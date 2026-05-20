const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round558_nyc_dob_legacy_permit_next16_candidates.js");
const EXPECTED_SOURCE_SHA256 = "85ef5a81548ec09f5aeb5c15e31ec9c0b56e8c5ae4bf3ff2b932c355f4e28856";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round563_nyc_dob_legacy_permit_next17");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round555", "through Round558")
      .replaceAll("treating Round555", "treating Round558");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round563 expected Round558 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round563Source = source
  .replace("const ROUND = 558;", "const ROUND = 563;")
  .replace(
    'const SLUG = "round558_nyc_dob_legacy_permit_next16";',
    'const SLUG = "round563_nyc_dob_legacy_permit_next17";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 555;", "const DEDUPE_BOUNDARY_ROUND = 558;")
  .replaceAll(
    "fetch_round558_nyc_dob_legacy_permit_next16_candidates.js",
    "fetch_round563_nyc_dob_legacy_permit_next17_candidates.js"
  )
  .replaceAll("round558_nyc_dob_legacy_permit_next16", "round563_nyc_dob_legacy_permit_next17")
  .replaceAll("Round558", "Round563")
  .replaceAll('"Round545", "Round555"', '"Round555", "Round558"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558");'
  )
  .replaceAll("through Round555", "through Round558")
  .replaceAll("treating Round555", "treating Round558")
  .replaceAll("next16", "next17");

vm.runInNewContext(round563Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
