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
  "lib/proposal-impact.js",
  "schemas/proposal.schema.json",
  "scripts/verify_proposal_impact.js",
  "tests/test_proposal_lens.py",
  "tests/test_energy_proposal_lens.py",
  "docs/mvp_spec.md",
  "design/CivicReplay Main Page.html",
  "web/data/mode-a/baseline_2025_forecast.json",
  "web/data/mode-a/forecast_model.json",
  "web/data/mode-a/transformer_capacity_forecast.json",
  "web/data/mode-a/transformer_impact_model.json",
  "web/data/mode-a/trend_baseline_branch.json",
];

const bannedDirectories = [
  "open-citylog/data-discovery",
];

const bannedScriptFilePatterns = [
  [/^append_architecture_batch_.*\.(js|py)$/i, "one-off architecture append batch"],
  [/^audit_round.*\.(js|py)$/i, "one-off architecture audit round"],
  [/^correct_.*\.(js|py)$/i, "one-off correction script"],
  [/^extract_planning.*\.(js|py)$/i, "one-off extraction script"],
  [/^fetch_round.*\.(js|py)$/i, "one-off fetch round"],
  [/^remove_.*\.(js|py)$/i, "one-off removal script"],
];
const scriptReferencePattern = /\bscripts\/[A-Za-z0-9_./-]+\.(?:js|py)\b/g;

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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

function walkStrings(value, visit) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, visit);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) walkStrings(item, visit);
  }
}

function citedArchitectureOneOffScripts() {
  const relativePath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
  if (!exists(relativePath)) return new Set();
  const cited = new Set();
  walkStrings(readJson(relativePath), (text) => {
    for (const match of text.match(scriptReferencePattern) || []) {
      const fileName = path.basename(match);
      if (bannedScriptFilePatterns.some(([pattern]) => pattern.test(fileName))) {
        cited.add(match);
      }
    }
  });
  return cited;
}

for (const relativePath of bannedFiles) {
  if (exists(relativePath)) failures.push(`Legacy file should not exist: ${relativePath}`);
}

for (const relativePath of bannedDirectories) {
  if (exists(relativePath)) failures.push(`Legacy directory should not exist: ${relativePath}`);
}

const scriptsDir = path.join(rootDir, "scripts");
const provenanceRetainedScripts = citedArchitectureOneOffScripts();
for (const entry of fs.readdirSync(scriptsDir)) {
  for (const [pattern, label] of bannedScriptFilePatterns) {
    const relativePath = `scripts/${entry}`;
    if (pattern.test(entry) && !provenanceRetainedScripts.has(relativePath)) {
      failures.push(`${label} should not remain in scripts/ unless cited by active architecture provenance: ${entry}`);
    }
  }
}
for (const relativePath of provenanceRetainedScripts) {
  if (!exists(relativePath)) failures.push(`Architecture provenance cites missing retained script: ${relativePath}`);
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

console.log(`Legacy path verification OK: ${bannedFiles.length} retired files, ${bannedDirectories.length} retired directories, ${provenanceRetainedScripts.size} provenance-retained one-off script(s), and unreferenced one-off script patterns absent; runtime routes/copy clean.`);
