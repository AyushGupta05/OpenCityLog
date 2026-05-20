const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round541_nyc_dob_legacy_permit_next13_candidates.js");
const EXPECTED_SOURCE_SHA256 = "f3a9b39212acd8c3047b3b97b046a7b74cbd451cb33596b5a29b61977943987a";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round545_nyc_dob_legacy_permit_next14");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round532", "through Round541")
      .replaceAll("treating Round532", "treating Round541");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round545 expected Round541 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round545Source = source
  .replace("const ROUND = 541;", "const ROUND = 545;")
  .replace(
    'const SLUG = "round541_nyc_dob_legacy_permit_next13";',
    'const SLUG = "round545_nyc_dob_legacy_permit_next14";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 536;", "const DEDUPE_BOUNDARY_ROUND = 541;")
  .replaceAll(
    "fetch_round541_nyc_dob_legacy_permit_next13_candidates.js",
    "fetch_round545_nyc_dob_legacy_permit_next14_candidates.js"
  )
  .replaceAll("round541_nyc_dob_legacy_permit_next13", "round545_nyc_dob_legacy_permit_next14")
  .replaceAll("Round541", "Round545")
  .replaceAll('"Round532", "Round536"', '"Round536", "Round541"')
  .replace(
    '  .replaceAll("next12", "next13");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541");'
  )
  .replaceAll("through Round532", "through Round541")
  .replaceAll("treating Round532", "treating Round541")
  .replaceAll("next13", "next14");

vm.runInNewContext(round545Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
