import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const debugPort = 9334;
const dashboardUrl = process.env.DASHBOARD_URL ?? "http://127.0.0.1:4173/";
const profileDirectory = await mkdtemp(join(tmpdir(), "mission-control-orchestration-"));
const browser = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--no-first-run",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDirectory}`,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

let socket;
let nextMessageId = 1;
const pending = new Map();
const browserErrors = [];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function poll(callback, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await callback();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError ?? new Error("Timed out waiting for browser state.");
}

async function connectToPage() {
  const target = await poll(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await response.json();
    return targets.find((candidate) => candidate.type === "page");
  });

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handlers.reject(new Error(message.error.message));
      else handlers.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      browserErrors.push(message.params.args.map((argument) => argument.value ?? argument.description).join(" "));
    }
  });
}

function send(method, params = {}) {
  const id = nextMessageId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitForText(selector, text) {
  return poll(async () => {
    const current = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.trim()`);
    return current === text ? current : null;
  });
}

try {
  await connectToPage();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: dashboardUrl });
  await waitForText("#create-episode-label", "Create Episode");
  await waitForText("#health-label", "On track");

  const initial = await evaluate(`({
    health: document.querySelector('#health-label').textContent.trim(),
    progress: document.querySelector('#progress-value').textContent.trim(),
    stages: document.querySelectorAll('.pipeline-step').length,
    mode: document.querySelector('#provider-status').textContent.trim(),
    command: document.querySelector('#mission-command').value
  })`);
  if (initial.health !== "On track") throw new Error(`Expected On track health, received ${initial.health}.`);
  if (initial.progress !== "0%") throw new Error(`Expected 0% progress, received ${initial.progress}.`);
  if (initial.stages !== 10) throw new Error(`Expected 10 pipeline stages, received ${initial.stages}.`);
  if (initial.command !== "Create Day 32.") throw new Error(`Expected the judged Day 32 command, received ${initial.command}.`);

  await evaluate("document.querySelector('#create-episode-button').click()");
  await waitForText("#create-episode-label", "Awaiting Approval");

  const paused = await evaluate(`({
    progress: document.querySelector('#progress-value').textContent.trim(),
    currentStage: [...document.querySelectorAll('#signal-grid dd')][0].textContent.trim(),
    completeStages: document.querySelectorAll('.pipeline-step.complete').length,
    uploadState: document.querySelectorAll('.pipeline-step')[9].className,
    blocker: document.querySelector('#blocker-title').textContent.trim(),
    nextAction: document.querySelector('#next-action-label').textContent.trim(),
    humanNeeded: document.querySelector('#human-required').textContent.trim(),
    approvalVisible: !document.querySelector('#approval-actions').hidden,
    uploadArtifactExists: [...document.querySelectorAll('#activity-list p')].some((node) => node.textContent.includes('upload-package.json'))
  })`);
  if (paused.progress !== "86%") throw new Error(`Expected 86% progress at approval, received ${paused.progress}.`);
  if (paused.currentStage !== "Creator approval") throw new Error(`Expected Creator approval stage, received ${paused.currentStage}.`);
  if (paused.completeStages !== 9) throw new Error(`Expected 9 completed stages before approval, received ${paused.completeStages}.`);
  if (!paused.uploadState.includes("pending")) throw new Error(`Upload Package advanced before approval: ${paused.uploadState}.`);
  if (paused.blocker !== "Awaiting creator approval") throw new Error(`Unexpected blocker: ${paused.blocker}.`);
  if (paused.nextAction !== "Review and approve the episode package") throw new Error(`Unexpected next action: ${paused.nextAction}.`);
  if (!paused.humanNeeded.startsWith("Yes")) throw new Error(`Human approval was not visible: ${paused.humanNeeded}.`);
  if (!paused.approvalVisible) throw new Error("Approval controls are hidden at the creator checkpoint.");
  if (paused.uploadArtifactExists) throw new Error("Upload Package completed before creator approval.");

  await evaluate("document.querySelector('#approve-button').click()");
  await waitForText("#create-episode-label", "Create Another Episode");

  const completed = await evaluate(`({
    progress: document.querySelector('#progress-value').textContent.trim(),
    currentStage: [...document.querySelectorAll('#signal-grid dd')][0].textContent.trim(),
    completeStages: document.querySelectorAll('.pipeline-step.complete').length,
    ready: document.querySelector('#ready-panel h3').textContent.trim(),
    artifact: document.querySelector('#ready-artifact-name').textContent.trim(),
    mission: document.querySelector('#mission-name').textContent.trim(),
    saved: Boolean(localStorage.getItem('mission-control:episode-pipeline:v1')),
    approvalDecision: [...document.querySelectorAll('#decision-list h3')].some((node) => node.textContent.trim() === 'Approve the episode package'),
    approvalActivity: [...document.querySelectorAll('#activity-list p')].some((node) => node.textContent.includes('Creator approved the episode package'))
  })`);
  if (completed.progress !== "100%") throw new Error(`Expected 100% progress, received ${completed.progress}.`);
  if (completed.completeStages !== 10) throw new Error(`Expected 10 completed stages, received ${completed.completeStages}.`);
  if (completed.ready !== "Ready for YouTube") throw new Error(`Expected Ready for YouTube, received ${completed.ready}.`);
  if (completed.artifact !== "upload-package.json") throw new Error(`Unexpected final artifact: ${completed.artifact}.`);
  if (completed.mission !== "Bible in 365 Days — Day 32") throw new Error(`Unexpected mission name: ${completed.mission}.`);
  if (!completed.saved) throw new Error("Completed run was not persisted.");
  if (!completed.approvalDecision) throw new Error("Creator approval is missing from the decision log.");
  if (!completed.approvalActivity) throw new Error("Creator approval is missing from recent activity.");

  await send("Page.reload", { ignoreCache: true });
  await waitForText("#create-episode-label", "Create Another Episode");
  const persistedApproval = await evaluate(`
    [...document.querySelectorAll('#decision-list h3')].some((node) => node.textContent.trim() === 'Approve the episode package')
    && [...document.querySelectorAll('#activity-list p')].some((node) => node.textContent.includes('Creator approved the episode package'))
  `);
  if (!persistedApproval) throw new Error("Creator approval did not persist after refresh.");

  await evaluate("document.querySelector('#reset-button').click()");
  await waitForText("#create-episode-label", "Create Episode");
  const resetClearedStorage = await evaluate("!localStorage.getItem('mission-control:episode-pipeline:v1')");
  if (!resetClearedStorage) throw new Error("Reset did not clear the saved run state.");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth");
  if (mobileOverflow) throw new Error("Mobile layout has horizontal overflow.");
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);

  console.log(JSON.stringify({
    initial,
    paused,
    completed,
    persistedAfterRefresh: persistedApproval,
    resetClearedStorage,
    mobileOverflow,
    browserErrors: browserErrors.length
  }, null, 2));
} finally {
  socket?.close();
  if (browser.exitCode === null) {
    const treeKiller = spawn("taskkill.exe", ["/PID", String(browser.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    await new Promise((resolve) => treeKiller.once("exit", resolve));
    await delay(500);
  }
  try {
    await poll(async () => {
      try {
        await rm(profileDirectory, { recursive: true, force: true });
        return true;
      } catch (error) {
        if (error.code !== "EBUSY") throw error;
        return false;
      }
    }, 10000);
  } catch {
    // Windows can keep the disposable Edge profile locked briefly after process exit.
  }
}

process.exit(0);

