const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round536_nyc_dob_legacy_permit_next12_candidates.js");
const EXPECTED_SOURCE_SHA256 = "e791e54cb90605759ab2409ddb940f8610c8dd675d1d6fd3b1cb692293a0a074";

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round541 expected Round536 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round541Source = source
  .replace("const ROUND = 536;", "const ROUND = 541;")
  .replace(
    'const SLUG = "round536_nyc_dob_legacy_permit_next12";',
    'const SLUG = "round541_nyc_dob_legacy_permit_next13";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 533;", "const DEDUPE_BOUNDARY_ROUND = 536;")
  .replaceAll(
    "fetch_round536_nyc_dob_legacy_permit_next12_candidates.js",
    "fetch_round541_nyc_dob_legacy_permit_next13_candidates.js"
  )
  .replaceAll("round536_nyc_dob_legacy_permit_next12", "round541_nyc_dob_legacy_permit_next13")
  .replaceAll("Round536", "Round541")
  .replaceAll('"Round532", "Round533"', '"Round532", "Round536"')
  .replaceAll("next12", "next13");

vm.runInNewContext(round541Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
