const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round545_nyc_dob_legacy_permit_next14_candidates.js");
const EXPECTED_SOURCE_SHA256 = "9a28b5b6ec49835fd6393c0a32d2c676f3783b60d044415e55c40e2bc0e5d58a";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round555_nyc_dob_legacy_permit_next15");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round541", "through Round545")
      .replaceAll("treating Round541", "treating Round545");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round555 expected Round545 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round555Source = source
  .replace("const ROUND = 545;", "const ROUND = 555;")
  .replace(
    'const SLUG = "round545_nyc_dob_legacy_permit_next14";',
    'const SLUG = "round555_nyc_dob_legacy_permit_next15";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 541;", "const DEDUPE_BOUNDARY_ROUND = 545;")
  .replaceAll(
    "fetch_round545_nyc_dob_legacy_permit_next14_candidates.js",
    "fetch_round555_nyc_dob_legacy_permit_next15_candidates.js"
  )
  .replaceAll("round545_nyc_dob_legacy_permit_next14", "round555_nyc_dob_legacy_permit_next15")
  .replaceAll("Round545", "Round555")
  .replaceAll('"Round536", "Round541"', '"Round541", "Round545"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round545")\n  .replaceAll("treating Round541", "treating Round545");'
  )
  .replaceAll("through Round541", "through Round545")
  .replaceAll("treating Round541", "treating Round545")
  .replaceAll("next14", "next15");

vm.runInNewContext(round555Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
