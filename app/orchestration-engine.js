import { cloneMissionState, recalculateMissionHealth } from "./mission-engine.js";

const VALID_RUN_STATUSES = new Set(["idle", "running", "ready"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function recordId(prefix, timestamp, suffix) {
  const parsedTime = Date.parse(timestamp);
  return `${prefix}-${Number.isNaN(parsedTime) ? timestamp : parsedTime}-${suffix}`;
}

function executorById(state, executorId) {
  return state.executors.find((executor) => executor.id === executorId);
}

function taskById(state, taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function stageByTaskId(state, taskId) {
  return state.orchestration.stages.find((stage) => stage.taskId === taskId);
}

function createArtifact(stage, timestamp, episodeDay) {
  return {
    id: `artifact-${stage.id}`,
    name: stage.artifact.name,
    filename: stage.artifact.filename,
    type: stage.artifact.type,
    summary: stage.artifact.summary,
    producedByTaskId: stage.taskId,
    reviewState: "accepted_for_demo",
    version: 1,
    episodeDay,
    createdAt: timestamp,
    uri: `demo://artifacts/day-${episodeDay}/${stage.artifact.filename}`
  };
}

export function parseEpisodeCommand(input) {
  const command = String(input ?? "").trim();
  const match = command.match(/^create\s+day\s+(\d{1,3})\.?$/i);
  assert(match, "Use the command format: Create Day 32.");
  const day = Number(match[1]);
  assert(day >= 1 && day <= 365, "Episode day must be between 1 and 365.");
  return { day, command: `Create Day ${day}.` };
}

export function validateOrchestrationData(input) {
  assert(input?.orchestration, "Mission data requires orchestration configuration.");
  assert(VALID_RUN_STATUSES.has(input.orchestration.status), `Unknown orchestration status: ${input.orchestration.status}.`);
  assert(Array.isArray(input.orchestration.stages) && input.orchestration.stages.length > 0, "Orchestration requires at least one stage.");

  const taskIds = new Set(input.tasks.map((task) => task.id));
  const stageIds = new Set();
  const pipelineTaskIds = new Set();

  for (const [index, stage] of input.orchestration.stages.entries()) {
    assert(stage.id && !stageIds.has(stage.id), `Orchestration stage IDs must be unique; found ${stage.id || "an empty ID"}.`);
    assert(taskIds.has(stage.taskId), `Orchestration stage ${stage.id} references unknown task ${stage.taskId}.`);
    assert(!pipelineTaskIds.has(stage.taskId), `Task ${stage.taskId} appears more than once in the orchestration pipeline.`);
    assert(stage.executorId === taskById(input, stage.taskId).executorId, `Stage ${stage.id} and task ${stage.taskId} must use the same executor.`);
    assert(executorById(input, stage.executorId), `Stage ${stage.id} references unknown executor ${stage.executorId}.`);
    assert(stage.artifact?.filename && stage.artifact?.type, `Stage ${stage.id} requires an artifact contract.`);
    assert(Number.isFinite(stage.demoDurationMs) && stage.demoDurationMs >= 0, `Stage ${stage.id} requires a non-negative demoDurationMs.`);

    const priorTaskIds = new Set(input.orchestration.stages.slice(0, index).map((candidate) => candidate.taskId));
    for (const dependencyId of taskById(input, stage.taskId).dependsOn ?? []) {
      assert(priorTaskIds.has(dependencyId), `Task ${stage.taskId} must appear after dependency ${dependencyId}.`);
    }

    stageIds.add(stage.id);
    pipelineTaskIds.add(stage.taskId);
  }

  return true;
}

export function startEpisodeRun(input, options = {}) {
  validateOrchestrationData(input);
  const state = cloneMissionState(input);
  const timestamp = options.timestamp ?? new Date().toISOString();
  const parsedCommand = parseEpisodeCommand(options.command ?? state.orchestration.defaultCommand ?? "Create Day 32.");
  const firstStage = state.orchestration.stages[0];

  state.tasks = state.tasks.map((task) => ({
    ...task,
    state: task.id === firstStage.taskId ? "active" : "pending",
    nextAction: task.id === firstStage.taskId ? "Executing now." : "Wait for upstream stage completion."
  }));
  state.artifacts = [];
  state.blockers = [];
  state.orchestration.status = "running";
  state.orchestration.command = parsedCommand.command;
  state.orchestration.episodeDay = parsedCommand.day;
  state.mission.id = `bible-365-day-${String(parsedCommand.day).padStart(3, "0")}`;
  state.mission.name = `Bible in 365 Days — Day ${parsedCommand.day}`;
  state.orchestration.runId = recordId("episode-run", timestamp, state.mission.id);
  state.orchestration.startedAt = timestamp;
  state.orchestration.completedAt = null;
  state.orchestration.currentStageId = firstStage.id;
  state.mission.currentStage = firstStage.label;
  state.mission.humanRequired = false;
  state.mission.nextRecommendedAction = {
    label: `${firstStage.label} is running`,
    taskId: firstStage.taskId,
    owner: executorById(state, firstStage.executorId).name,
    reason: firstStage.purpose
  };
  state.mission.updatedAt = timestamp;
  state.healthSignals.schedule = "on_track";
  state.healthSignals.momentum = "accelerating";
  state.healthSignals.riskPenalty = 0;
  state.healthSignals.summary = "CEO Brain accepted the command and is moving the episode through the deterministic production pipeline.";
  state.recentActivity = [{
    id: recordId("activity", timestamp, "run-started"),
    timestamp,
    type: "orchestration_started",
    actor: "CEO Brain",
    message: `${parsedCommand.command} accepted. The AI company organized the frozen production team and started execution.`
  }, ...(state.recentActivity ?? [])];
  state.decisions = [{
    id: recordId("decision", timestamp, "execution-plan"),
    timestamp,
    actor: "CEO Brain",
    choice: "Execute the frozen ten-stage episode workflow",
    rationale: "The workflow is the approved hackathon critical path and every stage has a deterministic output contract.",
    effect: "Started a traceable run from research through upload packaging."
  }, ...(state.decisions ?? [])];

  return recalculateMissionHealth(state);
}

export function advanceEpisodeRun(input, options = {}) {
  validateOrchestrationData(input);
  assert(input.orchestration.status === "running", "The episode pipeline is not running.");

  const state = cloneMissionState(input);
  const timestamp = options.timestamp ?? new Date().toISOString();
  const activeTask = state.tasks.find((task) => task.state === "active");
  assert(activeTask, "A running episode pipeline requires one active task.");

  const stage = stageByTaskId(state, activeTask.id);
  assert(stage, `No orchestration stage exists for active task ${activeTask.id}.`);

  activeTask.state = "complete";
  activeTask.nextAction = "Stage contract completed.";
  const artifact = createArtifact(stage, timestamp, state.orchestration.episodeDay);
  state.artifacts = [...(state.artifacts ?? []).filter((candidate) => candidate.id !== artifact.id), artifact];

  const stageIndex = state.orchestration.stages.findIndex((candidate) => candidate.id === stage.id);
  const nextStage = state.orchestration.stages[stageIndex + 1];
  const executor = executorById(state, stage.executorId);
  state.recentActivity = [{
    id: recordId("activity", timestamp, stage.id),
    timestamp,
    type: "task_completed",
    actor: executor.name,
    message: `${stage.label} completed and produced ${artifact.filename}.`
  }, ...(state.recentActivity ?? [])];
  state.mission.updatedAt = timestamp;

  if (nextStage) {
    const nextTask = taskById(state, nextStage.taskId);
    nextTask.state = "active";
    nextTask.nextAction = "Executing now.";
    state.orchestration.currentStageId = nextStage.id;
    state.mission.currentStage = nextStage.label;
    state.mission.nextRecommendedAction = {
      label: `${nextStage.label} is running`,
      taskId: nextStage.taskId,
      owner: executorById(state, nextStage.executorId).name,
      reason: nextStage.purpose
    };
    state.healthSignals.summary = `${stage.label} is complete. CEO Brain routed the accepted artifact to ${nextStage.label}.`;
    return recalculateMissionHealth(state);
  }

  state.orchestration.status = "ready";
  state.orchestration.currentStageId = null;
  state.orchestration.completedAt = timestamp;
  state.mission.currentStage = "Ready for YouTube";
  state.mission.nextRecommendedAction = {
    label: "Review upload package",
    taskId: stage.taskId,
    owner: "Creator",
    reason: "Every frozen production stage completed. The manifest is ready for the creator-controlled external action; Mission Control has not published it."
  };
  state.healthSignals.momentum = "complete";
  state.healthSignals.summary = "The full episode production workflow completed. The package is ready for a creator to upload to YouTube.";
  state.decisions = [{
    id: recordId("decision", timestamp, "package-ready"),
    timestamp,
    actor: "CEO Brain",
    choice: "Release the upload package",
    rationale: "Every upstream stage completed and QC accepted the production manifest.",
    effect: "Marked the episode Ready for YouTube without performing an external publish action."
  }, ...(state.decisions ?? [])];

  return recalculateMissionHealth(state);
}

export function runEpisodeToCompletion(input, options = {}) {
  let state = startEpisodeRun(input, { timestamp: options.startedAt ?? "2026-07-19T09:00:00.000Z" });
  let step = 0;
  while (state.orchestration.status === "running") {
    step += 1;
    state = advanceEpisodeRun(state, {
      timestamp: options.timestampForStep?.(step) ?? new Date(Date.parse(state.orchestration.startedAt) + step * 1000).toISOString()
    });
  }
  return state;
}

