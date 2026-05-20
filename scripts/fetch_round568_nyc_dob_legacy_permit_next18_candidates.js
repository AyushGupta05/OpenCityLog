const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round563_nyc_dob_legacy_permit_next17_candidates.js");
const EXPECTED_SOURCE_SHA256 = "74ef113caba3f6465d203bde1f4eb60aa1a5acd27f5d69bb67bd1816096d8622";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round568_nyc_dob_legacy_permit_next18");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round558", "through Round563")
      .replaceAll("treating Round558", "treating Round563");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round568 expected Round563 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round568Source = source
  .replace("const ROUND = 563;", "const ROUND = 568;")
  .replace(
    'const SLUG = "round563_nyc_dob_legacy_permit_next17";',
    'const SLUG = "round568_nyc_dob_legacy_permit_next18";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 558;", "const DEDUPE_BOUNDARY_ROUND = 563;")
  .replaceAll(
    "fetch_round563_nyc_dob_legacy_permit_next17_candidates.js",
    "fetch_round568_nyc_dob_legacy_permit_next18_candidates.js"
  )
  .replaceAll("round563_nyc_dob_legacy_permit_next17", "round568_nyc_dob_legacy_permit_next18")
  .replaceAll("Round563", "Round568")
  .replaceAll('"Round555", "Round558"', '"Round558", "Round563"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558")\n  .replaceAll("through Round558", "through Round563")\n  .replaceAll("treating Round558", "treating Round563");'
  )
  .replaceAll("through Round558", "through Round563")
  .replaceAll("treating Round558", "treating Round563")
  .replaceAll("next17", "next18");

vm.runInNewContext(round568Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
