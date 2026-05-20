const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round572_nyc_dob_legacy_permit_next19_candidates.js");
const EXPECTED_SOURCE_SHA256 = "44012242b235ed6253f93143057dbe617c61eb9bc6007918ea08b68a3ca8e4b7";
const OUTPUT_DIR = path.join(__dirname, "..", "tmp", "subagents", "round593_nyc_dob_legacy_permit_next24");

function normalizeOutputBoundaryText() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const name of fs.readdirSync(OUTPUT_DIR)) {
    if (!name.endsWith(".json") && name !== "notes.md") continue;
    const filePath = path.join(OUTPUT_DIR, name);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = text
      .replaceAll("through Round568", "through Round588")
      .replaceAll("treating Round568", "treating Round588")
      .replaceAll("through Round572", "through Round588")
      .replaceAll("treating Round572", "treating Round588")
      .replaceAll("through Round574", "through Round588")
      .replaceAll("treating Round574", "treating Round588")
      .replaceAll("through Round578", "through Round588")
      .replaceAll("treating Round578", "treating Round588")
      .replaceAll("through Round583", "through Round588")
      .replaceAll("treating Round583", "treating Round588");
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
  }
}

process.on("beforeExit", normalizeOutputBoundaryText);

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round593 expected Round572 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round593Source = source
  .replace("const ROUND = 572;", "const ROUND = 593;")
  .replace(
    'const SLUG = "round572_nyc_dob_legacy_permit_next19";',
    'const SLUG = "round593_nyc_dob_legacy_permit_next24";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 568;", "const DEDUPE_BOUNDARY_ROUND = 588;")
  .replaceAll(
    "fetch_round572_nyc_dob_legacy_permit_next19_candidates.js",
    "fetch_round593_nyc_dob_legacy_permit_next24_candidates.js"
  )
  .replaceAll("round572_nyc_dob_legacy_permit_next19", "round593_nyc_dob_legacy_permit_next24")
  .replaceAll("Round572", "Round593")
  .replaceAll('"Round563", "Round568"', '"Round583", "Round588"')
  .replace(
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558")\n  .replaceAll("through Round558", "through Round563")\n  .replaceAll("treating Round558", "treating Round563")\n  .replaceAll("through Round563", "through Round568")\n  .replaceAll("treating Round563", "treating Round568");',
    '  .replaceAll("next12", "next13")\n  .replaceAll("through Round532", "through Round541")\n  .replaceAll("treating Round532", "treating Round541")\n  .replaceAll("through Round541", "through Round555")\n  .replaceAll("treating Round541", "treating Round555")\n  .replaceAll("through Round555", "through Round558")\n  .replaceAll("treating Round555", "treating Round558")\n  .replaceAll("through Round558", "through Round563")\n  .replaceAll("treating Round558", "treating Round563")\n  .replaceAll("through Round563", "through Round568")\n  .replaceAll("treating Round563", "treating Round568")\n  .replaceAll("through Round568", "through Round574")\n  .replaceAll("treating Round568", "treating Round574")\n  .replaceAll("through Round574", "through Round578")\n  .replaceAll("treating Round574", "treating Round578")\n  .replaceAll("through Round578", "through Round583")\n  .replaceAll("treating Round578", "treating Round583")\n  .replaceAll("through Round583", "through Round588")\n  .replaceAll("treating Round583", "treating Round588");'
  )
  .replaceAll("through Round568", "through Round588")
  .replaceAll("treating Round568", "treating Round588")
  .replaceAll("through Round572", "through Round588")
  .replaceAll("treating Round572", "treating Round588")
  .replaceAll("through Round574", "through Round588")
  .replaceAll("treating Round574", "treating Round588")
  .replaceAll("through Round578", "through Round588")
  .replaceAll("treating Round578", "treating Round588")
  .replaceAll("through Round583", "through Round588")
  .replaceAll("treating Round583", "treating Round588")
  .replaceAll("next19", "next24");

vm.runInNewContext(round593Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
