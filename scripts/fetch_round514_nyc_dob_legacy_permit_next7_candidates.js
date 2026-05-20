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
    `Round514 expected Round509 worker source hash ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}. ` +
      "Review the upstream pattern before regenerating this candidate pack."
  );
}

const round514Source = source
  .replace("const ROUND = 509;", "const ROUND = 514;")
  .replace(
    'const SLUG = "round509_nyc_dob_legacy_permit_next6";',
    'const SLUG = "round514_nyc_dob_legacy_permit_next7";'
  )
  .replace("const DEDUPE_BOUNDARY_ROUND = 506;", "const DEDUPE_BOUNDARY_ROUND = 509;")
  .replaceAll(
    "fetch_round509_nyc_dob_legacy_permit_next6_candidates.js",
    "fetch_round514_nyc_dob_legacy_permit_next7_candidates.js"
  )
  .replaceAll("round509_nyc_dob_legacy_permit_next6", "round514_nyc_dob_legacy_permit_next7")
  .replaceAll("Round509", "Round514")
  .replaceAll("Round506", "Round509")
  .replaceAll("next6", "next7");

vm.runInNewContext(round514Source, {
  __dirname,
  __filename,
  require,
  console,
  fetch,
  process,
  setTimeout,
  URL
});
