import {
  applyMissionAction,
  cloneMissionState,
  listAvailableActions,
  recalculateMissionHealth,
  restoreMissionState,
  serializeMissionState,
  validateMissionData
} from "/app/mission-engine.js";
import {
  advanceEpisodeRun,
  runEpisodeToCompletion,
  startEpisodeRun,
  validateOrchestrationData
} from "/app/orchestration-engine.js";

const DATA_URL = "/data/episode-pipeline.json";
const STORAGE_KEY = "mission-control:episode-pipeline:v1";

const elements = {
  dashboard: document.querySelector("#dashboard"),
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  missionName: document.querySelector("#mission-name"),
  missionId: document.querySelector("#mission-id"),
  updatedLabel: document.querySelector("#updated-label"),
  healthPill: document.querySelector("#health-pill"),
  confidenceRing: document.querySelector("#confidence-ring"),
  confidenceValue: document.querySelector("#confidence-value"),
  healthLabel: document.querySelector("#health-label"),
  healthSummary: document.querySelector("#health-summary"),
  progressValue: document.querySelector("#progress-value"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),
  signalGrid: document.querySelector("#signal-grid"),
  nextActionCard: document.querySelector("#next-action-card"),
  nextActionLabel: document.querySelector("#next-action-label"),
  nextActionReason: document.querySelector("#next-action-reason"),
  nextActionOwner: document.querySelector("#next-action-owner"),
  humanRequired: document.querySelector("#human-required"),
  approvalPreview: document.querySelector("#approval-preview"),
  approvalActions: document.querySelector("#approval-actions"),
  blockerStrip: document.querySelector("#blocker-strip"),
  blockerTitle: document.querySelector("#blocker-title"),
  blockerCause: document.querySelector("#blocker-cause"),
  blockerResolution: document.querySelector("#blocker-resolution"),
  stageRail: document.querySelector("#stage-rail"),
  taskList: document.querySelector("#task-list"),
  activityCount: document.querySelector("#activity-count"),
  activityList: document.querySelector("#activity-list"),
  decisionCount: document.querySelector("#decision-count"),
  decisionList: document.querySelector("#decision-list"),
  createEpisodeButton: document.querySelector("#create-episode-button"),
  createEpisodeLabel: document.querySelector("#create-episode-label"),
  missionCommand: document.querySelector("#mission-command"),
  runStatus: document.querySelector("#run-status"),
  providerStatus: document.querySelector("#provider-status"),
  orchestrationPipeline: document.querySelector("#orchestration-pipeline"),
  readyPanel: document.querySelector("#ready-panel"),
  readyArtifactName: document.querySelector("#ready-artifact-name"),
  resetButton: document.querySelector("#reset-button"),
  approveButton: document.querySelector("#approve-button"),
  changesButton: document.querySelector("#changes-button"),
  toast: document.querySelector("#toast")
};

let originalState;
let state;
let toastTimer;
let runToken = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanize(value) {
  return String(value ?? "—").replaceAll("_", " ");
}

function slugClass(value) {
  return String(value ?? "").toLowerCase().replaceAll("_", "-").replace(/[^a-z0-9-]/g, "");
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function nowIso() {
  return new Date().toISOString();
}

function getExecutor(executorId) {
  return state.executors.find((executor) => executor.id === executorId) ?? {
    id: "unknown",
    type: "unknown",
    name: "Unassigned"
  };
}

function stateSymbol(taskState) {
  return {
    complete: "✓",
    blocked: "!",
    awaiting_human: "◉",
    active: "→",
    pending: "·"
  }[taskState] ?? "·";
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function renderOrchestration() {
  const { orchestration } = state;
  const isRunning = orchestration.status === "running";
  const isAwaitingApproval = orchestration.status === "awaiting_approval";
  const isReady = orchestration.status === "ready";
  const isBusy = isRunning || isAwaitingApproval;
  const currentStage = orchestration.stages.find((stage) => stage.id === orchestration.currentStageId);

  elements.providerStatus.textContent = orchestration.providerStatus;
  elements.createEpisodeButton.disabled = isBusy;
  elements.missionCommand.disabled = isBusy;
  elements.createEpisodeButton.classList.toggle("is-running", isBusy);
  elements.createEpisodeLabel.textContent = isRunning
    ? `${currentStage?.label ?? "Pipeline"} working…`
    : isAwaitingApproval
      ? "Awaiting Approval"
      : isReady
      ? "Create Another Episode"
      : "Create Episode";
  elements.runStatus.textContent = isRunning
    ? `${currentStage?.label ?? "Pipeline"} is active. CEO Brain will route the accepted artifact automatically.`
    : isAwaitingApproval
      ? "QC passed. Upload Package is blocked until the creator approves the episode."
      : isReady
      ? "All ten production stages completed successfully."
      : "Ready for one-command execution.";

  elements.orchestrationPipeline.innerHTML = orchestration.stages.map((stage, index) => {
    const task = state.tasks.find((candidate) => candidate.id === stage.taskId);
    const artifact = state.artifacts.find((candidate) => candidate.producedByTaskId === stage.taskId);
    const executor = state.executors.find((candidate) => candidate.id === stage.executorId);
    const taskState = task?.state ?? "pending";
    const stageDetail = artifact?.filename ?? (taskState === "active" ? `${executor?.name ?? "Specialist"} · working` : executor?.name ?? stage.purpose);
    return `
      <li class="pipeline-step ${escapeHtml(taskState)}">
        <span class="pipeline-index" aria-hidden="true">${taskState === "complete" ? "✓" : index + 1}</span>
        <div class="pipeline-copy"><strong>${escapeHtml(stage.label)}</strong><span>${escapeHtml(humanize(taskState))}</span></div>
        <small>${escapeHtml(stageDetail)}</small>
      </li>
    `;
  }).join("");

  const finalArtifact = state.artifacts.find((artifact) => artifact.type === "upload_manifest");
  elements.readyPanel.hidden = !isReady;
  elements.readyArtifactName.textContent = finalArtifact?.filename ?? "upload-package.json";
}

function renderMissionHeader() {
  const { mission } = state;
  elements.missionName.textContent = mission.name;
  elements.missionId.textContent = mission.id;
  elements.updatedLabel.textContent = `Updated ${formatDateTime(mission.updatedAt)} · episode-pipeline.json`;
}

function renderHealth() {
  const { mission, healthSignals } = state;
  const isHealthy = mission.health === "on_track";

  elements.healthPill.textContent = mission.healthLabel;
  elements.healthPill.dataset.health = mission.health;
  elements.confidenceRing.style.setProperty("--confidence", mission.confidence);
  elements.confidenceRing.classList.toggle("is-healthy", isHealthy);
  elements.confidenceRing.setAttribute("aria-label", `Confidence ${mission.confidence} percent`);
  elements.confidenceValue.textContent = `${mission.confidence}%`;
  elements.healthLabel.textContent = mission.healthLabel;
  elements.healthSummary.textContent = healthSignals.summary;
  elements.progressValue.textContent = `${mission.progress}%`;
  elements.progressTrack.setAttribute("aria-valuenow", mission.progress);
  elements.progressFill.style.width = `${mission.progress}%`;

  const signals = [
    ["Current stage", mission.currentStage, ""],
    ["Schedule", humanize(healthSignals.schedule), slugClass(healthSignals.schedule)],
    ["Momentum", humanize(healthSignals.momentum), slugClass(healthSignals.momentum)]
  ];

  elements.signalGrid.innerHTML = signals.map(([label, value, className]) => `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd class="signal-value ${className}">${escapeHtml(value)}</dd>
    </div>
  `).join("");
}

function renderNextAction() {
  const { mission } = state;
  const action = mission.nextRecommendedAction;
  const availableActions = listAvailableActions(state);
  const isApproval = availableActions.includes("approve") || availableActions.includes("request_changes");

  elements.nextActionLabel.textContent = action.label;
  elements.nextActionReason.textContent = action.reason;
  elements.nextActionOwner.textContent = action.owner;
  elements.humanRequired.textContent = mission.humanRequired ? "Yes · approval gate" : "No · ready to proceed";
  elements.approvalPreview.hidden = !isApproval;
  elements.approvalActions.hidden = !isApproval;
}

function renderBlocker() {
  const blocker = state.blockers[0];
  const isResolved = !blocker;
  elements.blockerStrip.classList.toggle("is-resolved", isResolved);

  if (isResolved) {
    elements.blockerStrip.querySelector(".section-label").textContent = "Blocker status";
    elements.blockerStrip.querySelector(".blocker-icon").textContent = "✓";
    elements.blockerTitle.textContent = "Critical path is clear";
    elements.blockerCause.textContent = state.orchestration.status === "running"
      ? "CEO Brain is routing accepted artifacts through the frozen workflow."
      : "No unresolved dependency or approval gate is blocking the episode pipeline.";
    elements.blockerResolution.textContent = state.orchestration.status === "ready"
      ? "Upload package is ready."
      : "Continue the approved critical path.";
    return;
  }

  elements.blockerStrip.querySelector(".section-label").textContent = "Active blocker";
  elements.blockerStrip.querySelector(".blocker-icon").textContent = "!";
  elements.blockerTitle.textContent = blocker.title;
  elements.blockerCause.textContent = blocker.cause;
  elements.blockerResolution.textContent = blocker.resolution;
}

function renderStages() {
  const stageOrder = [...new Set(state.tasks.map((task) => task.stage))];
  const stageStates = stageOrder.map((stage) => {
    const tasks = state.tasks.filter((task) => task.stage === stage);
    const allComplete = tasks.length > 0 && tasks.every((task) => task.state === "complete");
    const current = tasks.some((task) => ["blocked", "awaiting_human", "active"].includes(task.state));
    return { stage, tasks, allComplete, current };
  });

  elements.stageRail.innerHTML = stageStates.map(({ stage, tasks, allComplete, current }) => {
    const stateClass = allComplete ? "is-complete" : current ? "is-current" : "";
    const label = allComplete ? "Complete" : current ? "In progress" : `${tasks.filter((task) => task.state === "pending").length} pending`;
    return `<div class="stage-item ${stateClass}"><strong>${escapeHtml(stage)}</strong><span>${escapeHtml(label)}</span></div>`;
  }).join("");
}

function renderTasks() {
  elements.taskList.innerHTML = state.tasks.map((task) => {
    const executor = getExecutor(task.executorId);
    const stateClass = escapeHtml(task.state);
    return `
      <details class="task-row" id="${escapeHtml(task.id)}">
        <summary class="task-summary">
          <div class="task-title">
            <span class="task-state-mark ${stateClass}" aria-hidden="true">${stateSymbol(task.state)}</span>
            <div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.stage)}</span></div>
          </div>
          <span class="executor-chip executor-${escapeHtml(executor.type)}"><i></i><span>${escapeHtml(executor.name)}</span></span>
          <span class="state-chip ${stateClass}">${escapeHtml(humanize(task.state))}</span>
          <span class="task-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="task-detail">
          <div><strong>Why this executor</strong><span>${escapeHtml(task.routingReason)}</span></div>
          <div><strong>Next action</strong><span>${escapeHtml(task.nextAction)}</span></div>
        </div>
      </details>
    `;
  }).join("");
}

function renderActivity() {
  elements.activityCount.textContent = `${state.recentActivity.length} events`;
  elements.activityList.innerHTML = state.recentActivity.map((activity) => `
    <li class="activity-item">
      <span class="activity-node ${escapeHtml(activity.type)}" aria-hidden="true"></span>
      <div class="activity-copy">
        <p>${escapeHtml(activity.message)}</p>
        <div class="activity-meta"><strong>${escapeHtml(activity.actor)}</strong><span>·</span><time datetime="${escapeHtml(activity.timestamp)}">${escapeHtml(formatTime(activity.timestamp))}</time></div>
      </div>
    </li>
  `).join("");
}

function renderDecisions() {
  elements.decisionCount.textContent = `${state.decisions.length} decisions`;
  elements.decisionList.innerHTML = state.decisions.map((decision) => `
    <article class="decision-item">
      <h3>${escapeHtml(decision.choice)}</h3>
      <p>${escapeHtml(decision.rationale)}</p>
      <div class="decision-effect">${escapeHtml(decision.effect)}</div>
      <div class="decision-meta">${escapeHtml(decision.actor)} · <time datetime="${escapeHtml(decision.timestamp)}">${escapeHtml(formatDateTime(decision.timestamp))}</time></div>
    </article>
  `).join("");
}

function render() {
  renderOrchestration();
  renderMissionHeader();
  renderHealth();
  renderNextAction();
  renderBlocker();
  renderStages();
  renderTasks();
  renderActivity();
  renderDecisions();
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, serializeMissionState(state));
  } catch {
    showToast("Mission updated, but this browser could not save the demo state.");
  }
}

function runAction(action) {
  try {
    const result = applyMissionAction(state, action, { timestamp: nowIso() });
    state = result.state;
    persistState();
    render();
    showToast(result.transition.toast);
    elements.nextActionCard.scrollIntoView({ behavior: "smooth", block: "center" });
    if (state.orchestration.status === "running") {
      continueEpisodeRun(++runToken);
    }
  } catch (error) {
    showToast(error.message);
  }
}

async function continueEpisodeRun(token) {
  while (state.orchestration.status === "running" && token === runToken) {
    const currentStage = state.orchestration.stages.find((stage) => stage.id === state.orchestration.currentStageId);
    await delay(currentStage?.demoDurationMs ?? 450);
    if (token !== runToken) return;
    state = advanceEpisodeRun(state, { timestamp: nowIso() });
    persistState();
    render();
  }

  if (token === runToken && state.orchestration.status === "ready") {
    showToast(`Day ${state.orchestration.episodeDay} complete. Upload package is Ready for YouTube.`);
    elements.readyPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (token === runToken && state.orchestration.status === "awaiting_approval") {
    showToast("QC passed. Creator approval is required before Upload Package.");
    elements.nextActionCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function createEpisode() {
  const token = ++runToken;
  try {
    state = startEpisodeRun(originalState, { timestamp: nowIso(), command: elements.missionCommand.value });
    elements.missionCommand.value = state.orchestration.command;
    persistState();
    render();
    showToast(`${state.orchestration.command} accepted. CEO Brain assembled the company.`);
    await continueEpisodeRun(token);
  } catch (error) {
    showToast(error.message);
    elements.missionCommand.focus();
    elements.missionCommand.select();
  }
}

function resetDemo() {
  if (!originalState) return;
  runToken += 1;
  state = cloneMissionState(originalState);
  elements.missionCommand.value = state.orchestration.defaultCommand;
  localStorage.removeItem(STORAGE_KEY);
  render();
  showToast("Demo reset to the source mission state.");
}

async function loadMission() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`The mission source returned HTTP ${response.status}.`);
    const data = await response.json();
    validateMissionData(data);
    validateOrchestrationData(data);

    originalState = recalculateMissionHealth(data);
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    state = previewMode === "ready"
      ? runEpisodeToCompletion(data)
      : restoreMissionState(data, localStorage.getItem(STORAGE_KEY)) ?? cloneMissionState(originalState);
    validateOrchestrationData(state);
    elements.missionCommand.value = state.orchestration.command ?? state.orchestration.defaultCommand;
    render();
    elements.loading.hidden = true;
    elements.dashboard.hidden = false;
    if (state.orchestration.status === "running") {
      continueEpisodeRun(++runToken);
    }
  } catch (error) {
    elements.loading.hidden = true;
    elements.error.hidden = false;
    elements.errorMessage.textContent = `${error.message} Start the local server from the repository root and reload this page.`;
  }
}

elements.approveButton.addEventListener("click", () => runAction("approve"));
elements.changesButton.addEventListener("click", () => runAction("request_changes"));
elements.createEpisodeButton.addEventListener("click", createEpisode);
elements.resetButton.addEventListener("click", resetDemo);

loadMission();

