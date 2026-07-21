import { spawn } from "node:child_process";

const command = process.argv[2];
const executable = process.platform === "win32" ? "vinext.cmd" : "vinext";

if (!command) {
  console.error("Usage: node scripts/run-vinext.mjs <command>");
  process.exit(1);
}

const child = spawn(executable, [command], {
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
