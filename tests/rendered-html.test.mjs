import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const canonicalLine = "Mission Control keeps long-running missions moving by coordinating AI, tools, and people through clear, explainable decisions.";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the unified landing page and initial cockpit view", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Mission Control — Set the mission\. Build momentum\. Keep control\.<\/title>/i);
  assert.ok(html.includes(canonicalLine));
  assert.match(html, /Momentum is what people feel/);
  assert.match(html, /Bible in 365 Days/);
  assert.match(html, /The work that matters now/);
  assert.match(html, /Open human decision/);
  assert.doesNotMatch(html, /codex-preview|Starter Project|react-loading-skeleton/i);
});

test("keeps one mission state and functional approval flow in source", async () => {
  const [page, data, css, layout, readme, devpost] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"), readFile(new URL("../app/mission-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"), readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"), readFile(new URL("../docs/devpost.md", import.meta.url), "utf8"),
  ]);
  for (const artifact of [page, layout, readme, devpost]) assert.ok(artifact.includes(canonicalLine));
  assert.match(page, /mission-control-demo-decision/);
  assert.match(page, /setDecision\(next\)/);
  assert.match(page, /setView\("control"\)/);
  assert.match(page, /The mission is paused by design\./);
  assert.match(page, /Approve & resume/);
  assert.match(data, /Publish Plan/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
