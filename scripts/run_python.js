#!/usr/bin/env node
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node scripts/run_python.js <python-args...>");
  process.exit(2);
}

const candidates = process.platform === "win32"
  ? ["python", "python3", "py"]
  : ["python3", "python", "py"];

function versionText(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

function isPython3(result) {
  return /Python\s+3\./i.test(versionText(result));
}

function quoteCommandArg(arg) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

let lastError = null;
for (const executable of candidates) {
  const probeArgs = executable === "py" ? ["-3", "--version"] : ["--version"];
  const probe = spawnSync(executable, probeArgs, { encoding: "utf8" });
  if (probe.error) {
    lastError = probe.error;
    continue;
  }
  if (probe.status !== 0 || !isPython3(probe)) continue;

  const runArgs = executable === "py" ? ["-3", ...args] : args;
  const result = process.platform === "win32"
    ? spawnSync([executable, ...runArgs].map(quoteCommandArg).join(" "), { shell: true, stdio: "inherit" })
    : spawnSync(executable, runArgs, { stdio: "inherit" });
  if (result.error) {
    lastError = result.error;
    continue;
  }
  if (result.signal) {
    console.error(`Python process terminated by signal ${result.signal}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error("Could not find a usable Python 3 executable. Tried: " + candidates.join(", "));
if (lastError) console.error(lastError.message);
process.exit(127);
