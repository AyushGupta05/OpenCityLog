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
    `Round516 expected Round509 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round516Source = source
  .replace("const ROUND = 509;", "const ROUND = 516;")
  .replace(
    'const SLUG = "round509_nyc_dob_legacy_permit_next6";',
    'const SLUG = "round516_nyc_dob_legacy_permit_next8";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 506;", "const DEDUPE_BOUNDARY_ROUND = 514;")
  .replaceAll(
    "fetch_round509_nyc_dob_legacy_permit_next6_candidates.js",
    "fetch_round516_nyc_dob_legacy_permit_next8_candidates.js"
  )
  .replaceAll("round509_nyc_dob_legacy_permit_next6", "round516_nyc_dob_legacy_permit_next8")
  .replaceAll("Round509", "Round516")
  .replaceAll("Round506", "Round514")
  .replaceAll("next6", "next8");

vm.runInNewContext(round516Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
