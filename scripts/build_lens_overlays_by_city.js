const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const atlas = JSON.parse(fs.readFileSync(atlasIndexPath, "utf8"));
const cityIds = (atlas.cities || []).map((city) => city.city_id).filter(Boolean);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function buildCity(cityId) {
  const args = ["--max-old-space-size=4096", "scripts/build_lens_overlays.js"];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync(process.execPath, args, {
      cwd: rootDir,
      env: { ...process.env, ONLY: cityId },
      stdio: "inherit",
    });

    if (result.status === 0) return;

    const status = result.status ?? result.signal ?? "unknown";
    if (attempt === 3) {
      throw new Error(`${cityId}: lens overlay build failed after ${attempt} attempts with status ${status}`);
    }

    console.warn(`${cityId}: lens overlay build attempt ${attempt} failed with status ${status}; retrying.`);
    sleep(1000 * attempt);
  }
}

for (const cityId of cityIds) {
  buildCity(cityId);
}
