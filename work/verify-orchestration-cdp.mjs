import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const debugPort = 9333;
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
  await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
  await waitForText("#create-episode-label", "Create Episode");
  await waitForText("#health-label", "On track");

  const initial = await evaluate(`({
    health: document.querySelector('#health-label').textContent.trim(),
    progress: document.querySelector('#progress-value').textContent.trim(),
    stages: document.querySelectorAll('.pipeline-step').length,
    mode: document.querySelector('#provider-status').textContent.trim()
  })`);
  if (initial.health !== "On track") throw new Error(`Expected On track health, received ${initial.health}.`);
  if (initial.progress !== "0%") throw new Error(`Expected 0% progress, received ${initial.progress}.`);
  if (initial.stages !== 10) throw new Error(`Expected 10 pipeline stages, received ${initial.stages}.`);

  await evaluate("document.querySelector('#create-episode-button').click()");
  await waitForText("#create-episode-label", "Create Another Episode");

  const completed = await evaluate(`({
    progress: document.querySelector('#progress-value').textContent.trim(),
    currentStage: [...document.querySelectorAll('#signal-grid dd')][0].textContent.trim(),
    completeStages: document.querySelectorAll('.pipeline-step.complete').length,
    ready: document.querySelector('#ready-panel h3').textContent.trim(),
    artifact: document.querySelector('#ready-artifact-name').textContent.trim(),
    saved: Boolean(localStorage.getItem('mission-control:episode-pipeline:v1'))
  })`);
  if (completed.progress !== "100%") throw new Error(`Expected 100% progress, received ${completed.progress}.`);
  if (completed.completeStages !== 10) throw new Error(`Expected 10 completed stages, received ${completed.completeStages}.`);
  if (completed.ready !== "Ready for YouTube") throw new Error(`Expected Ready for YouTube, received ${completed.ready}.`);
  if (completed.artifact !== "upload-package.json") throw new Error(`Unexpected final artifact: ${completed.artifact}.`);
  if (!completed.saved) throw new Error("Completed run was not persisted.");

  await send("Page.reload", { ignoreCache: true });
  await waitForText("#create-episode-label", "Create Another Episode");

  await evaluate("document.querySelector('#reset-button').click()");
  await waitForText("#create-episode-label", "Create Episode");
  const resetClearedStorage = await evaluate("!localStorage.getItem('mission-control:episode-pipeline:v1')");
  if (!resetClearedStorage) throw new Error("Reset did not clear the saved run state.");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth");
  if (mobileOverflow) throw new Error("Mobile layout has horizontal overflow.");
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);

  console.log(JSON.stringify({ initial, completed, persistedAfterRefresh: true, resetClearedStorage, mobileOverflow, browserErrors: browserErrors.length }, null, 2));
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

