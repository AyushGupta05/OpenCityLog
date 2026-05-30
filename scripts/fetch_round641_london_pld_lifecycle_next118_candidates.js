const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT = path.join(__dirname, "fetch_round630_london_pld_lifecycle_next114_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round641 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current wrapper from Round630/next114 to Round641/next118.
source = replaceRequired(source, "ROUND630_OUT_DIR", "ROUND641_OUT_DIR", "out dir variable");
source = replaceRequired(source, "ROUND630_ACCESS_DATE", "ROUND641_ACCESS_DATE", "access date variable");
source = replaceRequired(source, "round630_london_pld_lifecycle_next114", "round641_london_pld_lifecycle_next118", "round name");
source = replaceRequired(source, "round630.london_pld_lifecycle_next114", "round641.london_pld_lifecycle_next118", "round dotted name");
source = replaceRequired(source, "Bims5Round630PldLifecycleNext114", "Bims5Round641PldLifecycleNext118", "class name");
source = replaceRequired(source, "Round 630", "Round 641", "display round");
source = replaceRequired(source, "Round630", "Round641", "camel round");
source = replaceRequired(source, "round630", "round641", "lower round");
source = replaceRequired(source, "next114", "next118", "next label");

// Advance the dedupe boundary so generated Round641 excludes Round638.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 629", "MAX_PRIOR_ROUND = 638", "prior cutoff");
source = replaceRequired(source, "through round629", "through round638", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 629", "packRound(entry.name) > 638", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round629");', '.replace(/round276/g, "round638");', "prior round replacement");
source = replaceRequired(source, "round629 prior PLD lifecycle pack was scanned", "round638 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round629_london_pld_lifecycle_next113" && pack.exists === true',
  'pack) => pack.label === "round638_london_pld_lifecycle_next117" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, and round629",
  "round628, round629, round630, round634, round636, and round638",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  'assertContains(transformed, "round629_london_pld_lifecycle_next113", "round629 prior pack");',
  'assertContains(transformed, "round630_london_pld_lifecycle_next114", "round630 prior pack");\n  assertContains(transformed, "round634_london_pld_lifecycle_next115", "round634 prior pack");\n  assertContains(transformed, "round636_london_pld_lifecycle_next116", "round636 prior pack");\n  assertContains(transformed, "round638_london_pld_lifecycle_next117", "round638 prior pack");',
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round641_london_pld_lifecycle_next118";')) {
  throw new Error("Round641 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 638") || !source.includes("through round638")) {
  throw new Error("Round641 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round638_london_pld_lifecycle_next117")) {
  throw new Error("Round641 wrapper did not retain Round638 as a prior pack");
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
  filename: "generated_round641_wrapper.js",
});
