const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const SOURCE_SCRIPT = path.join(__dirname, "fetch_round533_nyc_dob_legacy_permit_next11_candidates.js");
const EXPECTED_SOURCE_SHA256 = "9fb1b251f5031162b25db00a5b60677114f4c34ed0ab946639000f9afdcc10fe";

const source = fs.readFileSync(SOURCE_SCRIPT, "utf8");
const sourceHash = crypto.createHash("sha256").update(source).digest("hex");
if (sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(
    `Round536 expected Round533 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round536Source = source
  .replace("const ROUND = 533;", "const ROUND = 536;")
  .replace(
    'const SLUG = "round533_nyc_dob_legacy_permit_next11";',
    'const SLUG = "round536_nyc_dob_legacy_permit_next12";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 532;", "const DEDUPE_BOUNDARY_ROUND = 533;")
  .replaceAll(
    "fetch_round533_nyc_dob_legacy_permit_next11_candidates.js",
    "fetch_round536_nyc_dob_legacy_permit_next12_candidates.js"
  )
  .replaceAll("round533_nyc_dob_legacy_permit_next11", "round536_nyc_dob_legacy_permit_next12")
  .replaceAll("Round533", "Round536")
  .replaceAll("Round532", "Round533")
  .replaceAll("next11", "next12");

vm.runInNewContext(round536Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
