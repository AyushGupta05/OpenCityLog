const { spawnSync } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const steps = [
  {
    label: "base city atlas data",
    command: process.execPath,
    args: ["scripts/build_data.js"],
  },
  {
    label: "discovery city atlas",
    command: process.execPath,
    args: ["scripts/run_python.js", "scripts/build_discovery_city_atlas.py"],
  },
  {
    label: "OSM detail layers",
    command: process.execPath,
    args: ["scripts/build_osm_detail_layers.js"],
  },
  {
    label: "lens overlays",
    command: process.execPath,
    args: ["scripts/build_lens_overlays_by_city.js"],
    attempts: 3,
  },
  {
    label: "city coverage report",
    command: process.execPath,
    args: ["scripts/build_city_coverage_report.js"],
  },
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runStep(step) {
  const attempts = step.attempts || 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(`\n[build:data] ${step.label}${attempts > 1 ? ` (attempt ${attempt}/${attempts})` : ""}`);
    const result = spawnSync(step.command, step.args, {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
    });

    if (result.status === 0) return;

    const status = result.status ?? result.signal ?? "unknown";
    if (attempt === attempts) {
      throw new Error(`${step.label} failed with status ${status}`);
    }
    console.warn(`[build:data] ${step.label} failed with status ${status}; retrying.`);
    sleep(1000 * attempt);
  }
}

for (const step of steps) {
  runStep(step);
}
