#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const TEST_ARGS = ["-m", "unittest", "discover", "tests"];
const COVERAGE_RUN_ARGS = ["-m", "coverage", "run", ...TEST_ARGS];
const COVERAGE_REPORT_ARGS = ["-m", "coverage", "report", "--fail-under=80"];
const pythonCandidates = process.platform === "win32" ? ["py", "python", "python3"] : ["python3", "python", "py"];
const rootDir = path.resolve(__dirname, "..");
const coverageFile = process.env.COVERAGE_FILE || path.join(rootDir, "output", "python", ".coverage");
const uvCacheDir = process.env.UV_CACHE_DIR || path.join(rootDir, "output", "uv-cache");
const coverageEnv = { ...process.env, COVERAGE_FILE: coverageFile, UV_CACHE_DIR: uvCacheDir };

fs.mkdirSync(path.dirname(coverageFile), { recursive: true });
fs.mkdirSync(uvCacheDir, { recursive: true });

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: "inherit", env: coverageEnv, ...options });
}

function probe(command, args) {
  return spawnSync(command, args, { encoding: "utf8", env: coverageEnv });
}

function pythonArgs(command, args) {
  return command === "py" ? ["-3", ...args] : args;
}

function hasCoverage(command) {
  const result = probe(command, pythonArgs(command, ["-m", "coverage", "--version"]));
  return !result.error && result.status === 0;
}

function runCoverage(command, prefixArgs = []) {
  const runResult = run(command, [...prefixArgs, ...COVERAGE_RUN_ARGS]);
  if (runResult.error) return runResult;
  if ((runResult.status ?? 1) !== 0) process.exit(runResult.status ?? 1);
  const reportResult = run(command, [...prefixArgs, ...COVERAGE_REPORT_ARGS]);
  if (reportResult.error) return reportResult;
  process.exit(reportResult.status ?? 1);
}

for (const command of pythonCandidates) {
  if (hasCoverage(command)) runCoverage(command, command === "py" ? ["-3"] : []);
}

const uvProbe = probe("uv", ["--version"]);
if (!uvProbe.error && uvProbe.status === 0) {
  const runResult = run("uv", ["run", "--with", "coverage", "python", ...COVERAGE_RUN_ARGS]);
  if ((runResult.status ?? 1) !== 0) process.exit(runResult.status ?? 1);
  const reportResult = run("uv", ["run", "--with", "coverage", "python", ...COVERAGE_REPORT_ARGS]);
  process.exit(reportResult.status ?? 1);
}

console.error("Could not run Python coverage. Install python3-coverage/coverage.py or uv.");
process.exit(127);
