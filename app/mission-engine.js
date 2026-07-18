const DEFAULT_HEALTH_POLICY = {
  baseConfidence: 100,
  thresholds: [
    { minimum: 80, health: "on_track", label: "On track" },
    { minimum: 50, health: "at_risk", label: "At risk" },
    { minimum: 0, health: "off_track", label: "Off track" }
  ],
  deductions: {
    humanApprovalRequired: 0,
    activeHumanReview: 0,
    riskPenalty: 1,
    schedule: {},
    blockerSeverity: {}
  }
};

export function cloneMissionState(value) {
  return JSON.parse(JSON.stringify(value));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function taskById(state, taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function transitionIsAvailable(state, transition) {
  const requiredStates = transition.when?.taskStates ?? [];
  return requiredStates.every(({ taskId, state: expectedState }) => {
    return taskById(state, taskId)?.state === expectedState;
  });
}

function assignDefined(target, updates = {}) {
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) target[key] = cloneMissionState(value);
  }
}

function createRecordId(prefix, transitionId, timestamp, index = 0) {
  const parsedTime = Date.parse(timestamp);
  const timePart = Number.isNaN(parsedTime) ? timestamp : parsedTime;
  return `${prefix}-${transitionId}-${timePart}-${index}`;
}

export function validateMissionData(input) {
  assert(input && typeof input === "object", "Mission data must be an object.");
  assert(input.mission?.id, "Mission data requires mission.id.");
  assert(Array.isArray(input.tasks) && input.tasks.length > 0, "Mission data requires at least one task.");
  assert(Array.isArray(input.executors) && input.executors.length > 0, "Mission data requires at least one executor.");
  assert(Array.isArray(input.transitions), "Mission data requires a transitions array.");

  const taskIds = new Set();
  const executorIds = new Set(input.executors.map((executor) => executor.id));
  let totalProgressWeight = 0;

  for (const task of input.tasks) {
    assert(task.id && !taskIds.has(task.id), `Task IDs must be unique; found ${task.id || "an empty ID"}.`);
    taskIds.add(task.id);
    assert(executorIds.has(task.executorId), `Task ${task.id} references unknown executor ${task.executorId}.`);
    assert(Number.isFinite(task.progressWeight) && task.progressWeight >= 0, `Task ${task.id} requires a non-negative progressWeight.`);
    totalProgressWeight += task.progressWeight;
  }

  assert(Math.abs(totalProgressWeight - 100) < 0.001, `Task progressWeight values must total 100; received ${totalProgressWeight}.`);

  for (const task of input.tasks) {
    for (const dependencyId of task.dependsOn ?? []) {
      assert(taskIds.has(dependencyId), `Task ${task.id} references unknown dependency ${dependencyId}.`);
    }
  }

  const transitionIds = new Set();
  for (const transition of input.transitions) {
    assert(transition.id && !transitionIds.has(transition.id), `Transition IDs must be unique; found ${transition.id || "an empty ID"}.`);
    transitionIds.add(transition.id);
    assert(transition.action, `Transition ${transition.id} requires an action.`);

    for (const requirement of transition.when?.taskStates ?? []) {
      assert(taskIds.has(requirement.taskId), `Transition ${transition.id} checks unknown task ${requirement.taskId}.`);
    }
    for (const update of transition.effects?.taskUpdates ?? []) {
      assert(taskIds.has(update.taskId), `Transition ${transition.id} updates unknown task ${update.taskId}.`);
    }
  }

  return true;
}

export function listAvailableActions(state) {
  return state.transitions
    .filter((transition) => transitionIsAvailable(state, transition))
    .map((transition) => transition.action);
}

export function recalculateMissionHealth(input) {
  const state = cloneMissionState(input);
  const policy = { ...DEFAULT_HEALTH_POLICY, ...(state.healthPolicy ?? {}) };
  policy.deductions = {
    ...DEFAULT_HEALTH_POLICY.deductions,
    ...(state.healthPolicy?.deductions ?? {})
  };

  const completedWeight = state.tasks
    .filter((task) => task.state === "complete")
    .reduce((total, task) => total + task.progressWeight, 0);

  let confidence = policy.baseConfidence;
  const blockerDeductions = policy.deductions.blockerSeverity ?? {};
  const severityOrder = ["clear", "low", "medium", "high", "critical"];
  let highestBlockerSeverity = "clear";

  for (const blocker of state.blockers ?? []) {
    confidence -= blockerDeductions[blocker.severity] ?? 0;
    if (severityOrder.indexOf(blocker.severity) > severityOrder.indexOf(highestBlockerSeverity)) {
      highestBlockerSeverity = blocker.severity;
    }
  }

  if (state.mission.humanRequired) {
    confidence -= policy.deductions.humanApprovalRequired ?? 0;
  }

  const executorsById = new Map(state.executors.map((executor) => [executor.id, executor]));
  const hasActiveHumanReview = state.tasks.some((task) => {
    return task.state === "active" && executorsById.get(task.executorId)?.type === "human";
  });
  if (hasActiveHumanReview) confidence -= policy.deductions.activeHumanReview ?? 0;

  confidence -= policy.deductions.schedule?.[state.healthSignals.schedule] ?? 0;
  confidence -= (state.healthSignals.riskPenalty ?? 0) * (policy.deductions.riskPenalty ?? 1);
  confidence = Math.round(clamp(confidence, 0, 100));

  const thresholds = [...(policy.thresholds ?? DEFAULT_HEALTH_POLICY.thresholds)]
    .sort((left, right) => right.minimum - left.minimum);
  const assessment = thresholds.find((threshold) => confidence >= threshold.minimum) ?? thresholds.at(-1);

  state.mission.progress = Math.round(clamp(completedWeight, 0, 100));
  state.mission.confidence = confidence;
  state.mission.health = assessment.health;
  state.mission.healthLabel = assessment.label;
  state.healthSignals.blockerSeverity = highestBlockerSeverity;

  return state;
}

export function applyMissionAction(input, action, options = {}) {
  const state = cloneMissionState(input);
  const transition = state.transitions.find((candidate) => {
    return candidate.action === action && transitionIsAvailable(state, candidate);
  });

  if (!transition) throw new Error(`No available mission transition for action: ${action}.`);

  const timestamp = options.timestamp ?? new Date().toISOString();
  const effects = transition.effects ?? {};

  for (const update of effects.taskUpdates ?? []) {
    const task = taskById(state, update.taskId);
    assignDefined(task, update.updates);
  }

  if (effects.removeBlockerIds?.length) {
    const removedIds = new Set(effects.removeBlockerIds);
    state.blockers = state.blockers.filter((blocker) => !removedIds.has(blocker.id));
  }

  assignDefined(state.mission, effects.mission);
  assignDefined(state.healthSignals, effects.healthSignals);
  state.mission.updatedAt = timestamp;

  const newActivity = (transition.activity ?? []).map((activity, index) => ({
    id: createRecordId("activity", transition.id, timestamp, index),
    timestamp,
    ...cloneMissionState(activity)
  }));
  state.recentActivity = [...newActivity, ...(state.recentActivity ?? [])];

  if (transition.decision) {
    state.decisions = [{
      id: createRecordId("decision", transition.id, timestamp),
      timestamp,
      ...cloneMissionState(transition.decision)
    }, ...(state.decisions ?? [])];
  }

  return {
    state: recalculateMissionHealth(state),
    transition: cloneMissionState(transition)
  };
}

export function serializeMissionState(state) {
  return JSON.stringify({
    schemaVersion: state.schemaVersion,
    sourceRevision: state.sourceRevision,
    savedAt: new Date().toISOString(),
    state
  });
}

export function restoreMissionState(sourceState, serializedState) {
  if (!serializedState) return null;

  try {
    const envelope = JSON.parse(serializedState);
    if (envelope.schemaVersion !== sourceState.schemaVersion) return null;
    if (envelope.sourceRevision !== sourceState.sourceRevision) return null;
    validateMissionData(envelope.state);
    return recalculateMissionHealth(envelope.state);
  } catch {
    return null;
  }
}

