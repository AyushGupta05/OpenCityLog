const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const atlas = JSON.parse(fs.readFileSync(atlasIndexPath, "utf8"));
const cityIds = (atlas.cities || []).map((city) => city.city_id).filter(Boolean);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runOverlayProcess(cityId) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--max-old-space-size=4096", "scripts/build_lens_overlays.js"], {
      cwd: rootDir,
      env: { ...process.env, ONLY: cityId },
      stdio: "inherit",
    });

    const heartbeat = setInterval(() => {
      console.log(`lens overlays: still building ${cityId}...`);
    }, 25000);

    child.on("close", (code, signal) => {
      clearInterval(heartbeat);
      resolve({ status: code, signal });
    });

    child.on("error", (error) => {
      clearInterval(heartbeat);
      console.error(error);
      resolve({ status: 1, signal: null });
    });
  });
}

async function buildCity(cityId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    console.log(`lens overlays: building ${cityId} (attempt ${attempt}/3)`);
    const result = await runOverlayProcess(cityId);

    if (result.status === 0) return;

    const status = result.status ?? result.signal ?? "unknown";
    if (attempt === 3) {
      throw new Error(`${cityId}: lens overlay build failed after ${attempt} attempts with status ${status}`);
    }

    console.warn(`${cityId}: lens overlay build attempt ${attempt} failed with status ${status}; retrying.`);
    sleep(1000 * attempt);
  }
}

(async () => {
  for (const cityId of cityIds) {
    await buildCity(cityId);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
