const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round568_nyc_dob_legacy_permit_next18_candidates.js");
const EXPECTED_SOURCE_SHA256 = "39528dd0957bc257e44db0e3fc13dd317b376284447e41582ede074d5cdcb734";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round572_nyc_dob_legacy_permit_next19");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round563", "through Round568")
      .replaceAll("treating Round563", "treating Round568");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round572 expected Round568 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round572Source = source
  .replace("const ROUND = 568;", "const ROUND = 572;")
  .replace(
    'const SLUG = "round568_nyc_dob_legacy_permit_next18";',
    'const SLUG = "round572_nyc_dob_legacy_permit_next19";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 563;", "const DEDUPE_BOUNDARY_ROUND = 568;")
  .replaceAll(
    "fetch_round568_nyc_dob_legacy_permit_next18_candidates.js",
    "fetch_round572_nyc_dob_legacy_permit_next19_candidates.js"
  )
  .replaceAll("round568_nyc_dob_legacy_permit_next18", "round572_nyc_dob_legacy_permit_next19")
  .replaceAll("Round568", "Round572")
  .replaceAll('"Round558", "Round563"', '"Round563", "Round568"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558")\n  .replaceAll("through Round558", "through Round563")\n  .replaceAll("treating Round558", "treating Round563");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558")\n  .replaceAll("through Round558", "through Round563")\n  .replaceAll("treating Round558", "treating Round563")\n  .replaceAll("through Round563", "through Round568")\n  .replaceAll("treating Round563", "treating Round568");'
  )
  .replaceAll("through Round563", "through Round568")
  .replaceAll("treating Round563", "treating Round568")
  .replaceAll("next18", "next19");

vm.runInNewContext(round572Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
