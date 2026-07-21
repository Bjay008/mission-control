import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const canonicalLine =
  "Mission control keeps long-running missions moving. by coordinating AI, tools and people, with clear, explainable decisions.";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Mission Control story", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Mission Control — Every mission deserves mission control<\/title>/i);
  assert.ok(html.includes(canonicalLine));
  assert.match(html, /Bible in 365 days/);
  assert.match(html, /The mission is paused by design\./);
  assert.match(html, /this decision belongs to a human\./);
  assert.match(html, /Approve &amp; resume/);
  assert.match(html, /<dt>Owner<\/dt><dd>You<\/dd>/);
  assert.match(html, /<dt>Reason<\/dt>/);
  assert.match(html, /<dt>Next step<\/dt>/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Starter Project|react-loading-skeleton/i);
});

test("keeps canonical copy and the approval transition in source", async () => {
  const [page, layout, css, packageJson, readme, devpost, dashboard, productVoice] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../README.md", import.meta.url), "utf8"),
      readFile(new URL("../docs/devpost.md", import.meta.url), "utf8"),
      readFile(new URL("../docs/dashboard-copy.md", import.meta.url), "utf8"),
      readFile(new URL("../docs/product-voice.md", import.meta.url), "utf8"),
    ]);

  for (const artifact of [page, layout, readme, devpost, dashboard, productVoice]) {
    assert.ok(artifact.includes(canonicalLine));
  }

  assert.match(page, /useState\(false\)/);
  assert.match(page, /Decision recorded\. Mission resumed\./);
  assert.match(page, /aria-live="polite"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
