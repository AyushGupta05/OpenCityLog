const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT = path.join(__dirname, "fetch_round630_london_pld_lifecycle_next114_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round636 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current wrapper from Round630/next114 to Round636/next116.
source = replaceRequired(source, "ROUND630_OUT_DIR", "ROUND636_OUT_DIR", "out dir variable");
source = replaceRequired(source, "ROUND630_ACCESS_DATE", "ROUND636_ACCESS_DATE", "access date variable");
source = replaceRequired(source, "round630_london_pld_lifecycle_next114", "round636_london_pld_lifecycle_next116", "round name");
source = replaceRequired(source, "round630.london_pld_lifecycle_next114", "round636.london_pld_lifecycle_next116", "round dotted name");
source = replaceRequired(source, "Bims5Round630PldLifecycleNext114", "Bims5Round636PldLifecycleNext116", "class name");
source = replaceRequired(source, "Round 630", "Round 636", "display round");
source = replaceRequired(source, "Round630", "Round636", "camel round");
source = replaceRequired(source, "round630", "round636", "lower round");
source = replaceRequired(source, "next114", "next116", "next label");

// Advance the dedupe boundary so generated Round636 excludes Round634.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 629", "MAX_PRIOR_ROUND = 634", "prior cutoff");
source = replaceRequired(source, "through round629", "through round634", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 629", "packRound(entry.name) > 634", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round629");', '.replace(/round276/g, "round634");', "prior round replacement");
source = replaceRequired(source, "round629 prior PLD lifecycle pack was scanned", "round634 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round629_london_pld_lifecycle_next113" && pack.exists === true',
  'pack) => pack.label === "round634_london_pld_lifecycle_next115" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, and round629",
  "round628, round629, round630, and round634",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  'assertContains(transformed, "round629_london_pld_lifecycle_next113", "round629 prior pack");',
  'assertContains(transformed, "round630_london_pld_lifecycle_next114", "round630 prior pack");\n  assertContains(transformed, "round634_london_pld_lifecycle_next115", "round634 prior pack");',
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round636_london_pld_lifecycle_next116";')) {
  throw new Error("Round636 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 634") || !source.includes("through round634")) {
  throw new Error("Round636 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round634_london_pld_lifecycle_next115")) {
  throw new Error("Round636 wrapper did not retain Round634 as a prior pack");
}

vm.runInNewContext(source, {
  require,
  console,
  process,
  fetch,
  setTimeout,
  clearTimeout,
  __dirname,
  module: { exports: {} },
  exports: {},
}, {
  filename: "generated_round636_wrapper.js",
});
