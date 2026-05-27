const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const failures = [];

const bannedFiles = [
  "web/solana-scenario-commit.js",
  "web/solana-web3.min.js",
  "web/impact-predictor.js",
  "web/map-ux.js",
  "web/traffic-sim.js",
  "web/transit-engine.js",
  "web/dashboard.js",
  "web/styles.css",
  "lib/scenario-proof.js",
  "lib/scenario-studio.js",
  "scripts/build_transformer_model.py",
  "scripts/build_trend_baseline_branch.js",
  "scripts/train_forecast_model.py",
  "scripts/verify-forecast.js",
  "scripts/verify-transformer-model.js",
  "scripts/verify-trend-baseline.js",
  "web/data/mode-a/baseline_2025_forecast.json",
  "web/data/mode-a/forecast_model.json",
  "web/data/mode-a/transformer_capacity_forecast.json",
  "web/data/mode-a/transformer_impact_model.json",
  "web/data/mode-a/trend_baseline_branch.json",
];

const runtimeFiles = [
  "package.json",
  "server.js",
  "web/index.html",
  "web/atlas.js",
  "web/atlas.css",
];

const bannedRuntimePatterns = [
  [/@solana\/web3\.js/i, "Solana dependency"],
  [/solana-scenario-commit|solana-web3|phantom|blockchain/i, "Solana/blockchain runtime path"],
  [/traffic-sim|transit-engine|impact-predictor|scenario-studio|scenario-proof/i, "retired simulator runtime path"],
  [/\/api\/manifest|\/api\/replay-manifest\.json|legacyReplayManifest/i, "legacy replay manifest route"],
  [/2036\s+Scenario|Branch Workspace|Run Simulation/i, "retired simulator UI copy"],
];

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

for (const relativePath of bannedFiles) {
  if (exists(relativePath)) failures.push(`Legacy file should not exist: ${relativePath}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const scriptText = Object.values(packageJson.scripts || {}).join("\n");
if (/build_mode_a_replay|build_ui_manifest|replay-manifest/i.test(scriptText)) {
  failures.push("Package scripts still invoke retired replay/Mode A builders.");
}
if (packageJson.scripts && Object.prototype.hasOwnProperty.call(packageJson.scripts, "verify:proposal")) {
  failures.push("Package scripts still expose the retired Proposal Lens verifier.");
}
if (/\bverify:proposal\b/i.test(scriptText)) {
  failures.push("Default package scripts still invoke the retired Proposal Lens verifier.");
}

const serverText = fs.readFileSync(path.join(rootDir, "server.js"), "utf8");
if (!serverText.includes('decodedPathname.startsWith("/data/mode-a/")') || !serverText.includes("Retired Mode A replay data") || !serverText.includes('replace(/\\\\/g, "/")') || !serverText.includes("path.posix.normalize")) {
  failures.push("Server does not quarantine retired /data/mode-a public data path.");
}
if (/require\(["']\.\/lib\/proposal-impact["']\)/i.test(serverText) || /proposalResponseCache|proposalCacheKey|setProposalCache|handleProposalImpact|assessProposal/i.test(serverText)) {
  failures.push("Server still has an active Proposal Lens/proposal-impact runtime path.");
}
if (!serverText.includes("/api/proposal-impact/schema") || !serverText.includes("/api/proposal-impact") || !serverText.includes("Retired endpoint") || !serverText.includes("Proposal/future analogue paths are quarantined")) {
  failures.push("Server does not quarantine retired proposal-impact endpoints with a clear 410 response.");
}

const retiredModeADir = path.join(rootDir, "web", "data", "mode-a");
if (fs.existsSync(retiredModeADir)) {
  const stack = [retiredModeADir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (!/\.(json|geojson)$/i.test(entry.name)) continue;
      const text = fs.readFileSync(entryPath, "utf8");
      if (!/"status"\s*:\s*"retired"/.test(text)) {
        failures.push(`Retired Mode A file is not tombstoned: ${path.relative(rootDir, entryPath)}`);
      }
    }
  }
}

for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
  for (const name of Object.keys(packageJson[section] || {})) {
    if (/solana|anchor|web3/i.test(name)) failures.push(`Legacy dependency remains in ${section}: ${name}`);
  }
}

for (const relativePath of runtimeFiles) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Runtime file missing: ${relativePath}`);
    continue;
  }
  const text = fs.readFileSync(absolutePath, "utf8");
  for (const [pattern, label] of bannedRuntimePatterns) {
    if (pattern.test(text)) failures.push(`${label} found in ${relativePath}`);
  }
}

if (failures.length) {
  console.error("Legacy path verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Legacy path verification OK: ${bannedFiles.length} retired files absent and runtime routes/copy clean.`);
