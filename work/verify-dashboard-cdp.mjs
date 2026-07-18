import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const debugPort = 9333;
const profileDirectory = await mkdtemp(join(tmpdir(), "mission-control-edge-"));
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

async function poll(callback, timeout = 10000) {
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
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }

    if (message.method === "Runtime.exceptionThrown") {
      browserErrors.push(message.params.exceptionDetails.text);
    }
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
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitForHealth(label) {
  return poll(async () => {
    const current = await evaluate("document.querySelector('#health-label')?.textContent?.trim()");
    return current === label ? current : null;
  });
}

try {
  await connectToPage();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
  await waitForHealth("At risk");

  const initial = await evaluate(`({
    health: document.querySelector('#health-label').textContent.trim(),
    confidence: document.querySelector('#confidence-value').textContent.trim(),
    action: document.querySelector('#next-action-label').textContent.trim()
  })`);
  if (initial.confidence !== "72%") throw new Error(`Expected 72% confidence, received ${initial.confidence}.`);

  await evaluate("document.querySelector('#approve-button').click()");
  await waitForHealth("On track");
  const approved = await evaluate(`({
    confidence: document.querySelector('#confidence-value').textContent.trim(),
    action: document.querySelector('#next-action-label').textContent.trim(),
    qualityState: document.querySelector('#task-quality-review .state-chip').textContent.trim(),
    saved: Boolean(localStorage.getItem('mission-control:demo-state:v1'))
  })`);
  if (approved.confidence !== "86%") throw new Error(`Expected 86% confidence, received ${approved.confidence}.`);
  if (approved.qualityState !== "active") throw new Error(`Expected quality review to be active, received ${approved.qualityState}.`);
  if (!approved.saved) throw new Error("Approved state was not saved to browser storage.");

  await send("Page.reload", { ignoreCache: true });
  await waitForHealth("On track");

  await evaluate("document.querySelector('#reset-button').click()");
  await waitForHealth("At risk");
  const resetClearedStorage = await evaluate("!localStorage.getItem('mission-control:demo-state:v1')");
  if (!resetClearedStorage) throw new Error("Reset did not clear the saved demo state.");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth");
  if (mobileOverflow) throw new Error("Mobile layout has horizontal overflow.");
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);

  console.log(JSON.stringify({
    initial,
    approved,
    persistedAfterRefresh: true,
    resetClearedStorage,
    mobileOverflow,
    browserErrors: browserErrors.length
  }, null, 2));
} finally {
  socket?.close();
  if (browser.exitCode === null) {
    const treeKiller = spawn("taskkill.exe", ["/PID", String(browser.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    await new Promise((resolve) => treeKiller.once("exit", resolve));
    await delay(500);
  }

  await poll(async () => {
    try {
      await rm(profileDirectory, { recursive: true, force: true });
      return true;
    } catch (error) {
      if (error.code !== "EBUSY") throw error;
      return false;
    }
  }, 5000);
}

