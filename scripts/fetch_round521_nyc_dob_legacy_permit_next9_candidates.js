const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round509_nyc_dob_legacy_permit_next6_candidates.js");
const EXPECTED_SOURCE_SHA256 = "06e2b1b79cbdcb33972f03834d492f2535673d53e528ae7176a71047bbcb5ba7";

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round521 expected Round509 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round521Source = source
  .replace("const ROUND = 509;", "const ROUND = 521;")
  .replace(
    'const SLUG = "round509_nyc_dob_legacy_permit_next6";',
    'const SLUG = "round521_nyc_dob_legacy_permit_next9";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 506;", "const DEDUPE_BOUNDARY_ROUND = 516;")
  .replaceAll(
    "fetch_round509_nyc_dob_legacy_permit_next6_candidates.js",
    "fetch_round521_nyc_dob_legacy_permit_next9_candidates.js"
  )
  .replaceAll("round509_nyc_dob_legacy_permit_next6", "round521_nyc_dob_legacy_permit_next9")
  .replaceAll("Round509", "Round521")
  .replaceAll("Round506", "Round516")
  .replaceAll(
    "prior NYC DOB/DOB legacy candidate packs",
    "prior NYC DOB legacy permit, DOB NOW, DOB CO, and screened permit candidate packs"
  )
  .replaceAll(
    "prior DOB/DOB legacy packs",
    "prior DOB legacy permit, DOB NOW, DOB CO, and screened permit packs"
  )
  .replaceAll("next6", "next9")
  .replace(
    "  const selected = [];\n  const selectedIds = new Set();",
    "  const selected = [];\n  const selectedIds = new Set();\n  const selectedTitleDateKeys = new Set();\n  const selectedAddressDateKeys = new Set();"
  )
  .replace(
    "  const take = (candidate) => {\n    selected.push(candidate);\n    selectedIds.add(candidate.candidate_id);",
    "  const take = (candidate) => {\n    const candidateTitleDateKey = titleDateKey(candidate);\n    const candidateAddressDateKey = addressDateKey(candidate);\n    if (selectedTitleDateKeys.has(candidateTitleDateKey) || selectedAddressDateKeys.has(candidateAddressDateKey)) return false;\n    selected.push(candidate);\n    selectedIds.add(candidate.candidate_id);\n    selectedTitleDateKeys.add(candidateTitleDateKey);\n    selectedAddressDateKeys.add(candidateAddressDateKey);"
  );

vm.runInNewContext(round521Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
