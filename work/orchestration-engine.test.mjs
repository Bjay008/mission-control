import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  advanceEpisodeRun,
  parseEpisodeCommand,
  runEpisodeToCompletion,
  startEpisodeRun,
  validateOrchestrationData
} from "../app/orchestration-engine.js";
import {
  cloneMissionState,
  recalculateMissionHealth,
  validateMissionData
} from "../app/mission-engine.js";

const source = JSON.parse(await readFile(new URL("../data/episode-pipeline.json", import.meta.url), "utf8"));

test("the frozen CEO-to-upload pipeline is valid and starts idle", () => {
  assert.equal(validateMissionData(source), true);
  assert.equal(validateOrchestrationData(source), true);
  const initial = recalculateMissionHealth(source);
  assert.equal(initial.orchestration.status, "idle");
  assert.equal(initial.mission.progress, 0);
  assert.equal(initial.orchestration.stages.length, 10);
  assert.equal(initial.tasks.reduce((sum, task) => sum + task.progressWeight, 0), 100);
});

test("the judged command resolves Day 32 and rejects invalid days", () => {
  assert.deepEqual(parseEpisodeCommand("Create Day 32."), { day: 32, command: "Create Day 32." });
  assert.deepEqual(parseEpisodeCommand(" create day 7 "), { day: 7, command: "Create Day 7." });
  assert.throws(() => parseEpisodeCommand("Create an episode"), /Create Day 32/);
  assert.throws(() => parseEpisodeCommand("Create Day 366"), /between 1 and 365/);
});

test("Create Episode activates CEO Brain without mutating the source", () => {
  const before = cloneMissionState(source);
  const running = startEpisodeRun(source, { timestamp: "2026-07-19T09:00:00.000Z", command: "Create Day 32." });

  assert.equal(running.orchestration.status, "running");
  assert.equal(running.orchestration.currentStageId, "ceo");
  assert.equal(running.orchestration.episodeDay, 32);
  assert.equal(running.mission.name, "Bible in 365 Days — Day 32");
  assert.equal(running.tasks.find((task) => task.id === "task-ceo").state, "active");
  assert.equal(running.tasks.filter((task) => task.state === "active").length, 1);
  assert.deepEqual(source, before);
});

test("each advance completes one stage, creates its artifact, and routes the next", () => {
  const running = startEpisodeRun(source, { timestamp: "2026-07-19T09:00:00.000Z" });
  const advanced = advanceEpisodeRun(running, { timestamp: "2026-07-19T09:00:01.000Z" });

  assert.equal(advanced.tasks.find((task) => task.id === "task-ceo").state, "complete");
  assert.equal(advanced.tasks.find((task) => task.id === "task-research").state, "active");
  assert.equal(advanced.orchestration.currentStageId, "research");
  assert.equal(advanced.artifacts[0].filename, "episode-plan.json");
  assert.equal(advanced.mission.progress, 6);
});

test("one deterministic run produces every artifact and stops before external upload", () => {
  const completed = runEpisodeToCompletion(source);

  assert.equal(completed.orchestration.status, "ready");
  assert.equal(completed.mission.currentStage, "Ready for YouTube");
  assert.equal(completed.mission.progress, 100);
  assert.equal(completed.tasks.every((task) => task.state === "complete"), true);
  assert.equal(completed.artifacts.length, 10);
  assert.equal(completed.artifacts.at(-1).filename, "upload-package.json");
  assert.equal(completed.mission.nextRecommendedAction.owner, "Creator");
  assert.match(completed.mission.nextRecommendedAction.reason, /without performing an external publish action|creator-controlled external action/i);
});

test("invalid stage routing is rejected before execution", () => {
  const invalid = cloneMissionState(source);
  invalid.orchestration.stages[1].taskId = "missing-task";
  assert.throws(() => validateOrchestrationData(invalid), /unknown task/);
});

