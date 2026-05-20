const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round545_nyc_dob_legacy_permit_next14_candidates.js");
const EXPECTED_SOURCE_SHA256 = "9a28b5b6ec49835fd6393c0a32d2c676f3783b60d044415e55c40e2bc0e5d58a";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round558_nyc_dob_legacy_permit_next16");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round541", "through Round555")
      .replaceAll("treating Round541", "treating Round555")
      .replaceAll("through Round545", "through Round555")
      .replaceAll("treating Round545", "treating Round555");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round558 expected Round545 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round558Source = source
  .replace("const ROUND = 545;", "const ROUND = 558;")
  .replace(
    'const SLUG = "round545_nyc_dob_legacy_permit_next14";',
    'const SLUG = "round558_nyc_dob_legacy_permit_next16";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 541;", "const DEDUPE_BOUNDARY_ROUND = 555;")
  .replaceAll(
    "fetch_round545_nyc_dob_legacy_permit_next14_candidates.js",
    "fetch_round558_nyc_dob_legacy_permit_next16_candidates.js"
  )
  .replaceAll("round545_nyc_dob_legacy_permit_next14", "round558_nyc_dob_legacy_permit_next16")
  .replaceAll("Round545", "Round558")
  .replaceAll('"Round536", "Round541"', '"Round545", "Round555"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555");'
  )
  .replaceAll("through Round541", "through Round555")
  .replaceAll("treating Round541", "treating Round555")
  .replaceAll("next14", "next16");

vm.runInNewContext(round558Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
