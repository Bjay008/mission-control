import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyMissionAction,
  cloneMissionState,
  listAvailableActions,
  recalculateMissionHealth,
  restoreMissionState,
  serializeMissionState,
  validateMissionData
} from "../app/mission-engine.js";

const source = JSON.parse(await readFile(new URL("../data/demo-mission.json", import.meta.url), "utf8"));

test("the demo source and baseline health are valid", () => {
  assert.equal(validateMissionData(source), true);
  const state = recalculateMissionHealth(source);
  assert.equal(state.mission.health, "at_risk");
  assert.equal(state.mission.confidence, 72);
  assert.equal(state.mission.progress, 38);
  assert.deepEqual(listAvailableActions(state), ["approve", "request_changes"]);
});

test("approval clears the blocker, advances work, and recalculates health", () => {
  const { state } = applyMissionAction(source, "approve", {
    timestamp: "2026-07-18T10:00:00.000Z"
  });

  assert.equal(state.blockers.length, 0);
  assert.equal(state.mission.health, "on_track");
  assert.equal(state.mission.confidence, 86);
  assert.equal(state.mission.progress, 52);
  assert.equal(state.tasks.find((task) => task.id === "task-thumbnail-approval").state, "complete");
  assert.equal(state.tasks.find((task) => task.id === "task-thumbnail-generate").state, "complete");
  assert.equal(state.tasks.find((task) => task.id === "task-quality-review").state, "active");
  assert.equal(state.decisions[0].choice, "Approve revised thumbnail brief");
  assert.deepEqual(listAvailableActions(state), []);
});

test("requesting changes reroutes the brief and keeps the mission at risk", () => {
  const { state } = applyMissionAction(source, "request_changes", {
    timestamp: "2026-07-18T10:00:00.000Z"
  });

  assert.equal(state.mission.health, "at_risk");
  assert.equal(state.mission.confidence, 68);
  assert.equal(state.mission.progress, 38);
  assert.equal(state.mission.nextRecommendedAction.owner, "Episode Writing Agent");
  assert.equal(state.tasks.find((task) => task.id === "task-thumbnail-approval").state, "active");
  assert.equal(state.blockers.length, 1);
});

test("state persistence is revision-safe and actions do not mutate source data", () => {
  const before = cloneMissionState(source);
  assert.throws(() => applyMissionAction(source, "publish"), /No available mission transition/);
  assert.deepEqual(source, before);

  const approved = applyMissionAction(source, "approve", {
    timestamp: "2026-07-18T10:00:00.000Z"
  }).state;
  const serialized = serializeMissionState(approved);
  assert.equal(restoreMissionState(source, serialized).mission.health, "on_track");
  assert.equal(restoreMissionState({ ...source, sourceRevision: "v2" }, serialized), null);
  assert.equal(restoreMissionState(source, "not-json"), null);
});

