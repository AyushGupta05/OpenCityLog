const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_WRAPPER = path.join(__dirname, "fetch_round643_london_pld_lifecycle_next119_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round645 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_WRAPPER, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current wrapper from Round643/next119 to Round645/next120.
source = replaceRequired(source, "ROUND643", "ROUND645", "upper round");
source = replaceRequired(source, "Round 643", "Round 645", "display round");
source = replaceRequired(source, "Round643", "Round645", "camel round");
source = replaceRequired(source, "round643_london_pld_lifecycle_next119", "round645_london_pld_lifecycle_next120", "round name");
source = replaceRequired(source, "round643.london_pld_lifecycle_next119", "round645.london_pld_lifecycle_next120", "round dotted name");
source = replaceRequired(source, "round643", "round645", "lower round");
source = replaceRequired(source, "next119", "next120", "next label");

// Advance the dedupe boundary so generated Round645 excludes Round643.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 641", "MAX_PRIOR_ROUND = 643", "prior cutoff");
source = replaceRequired(source, "through round641", "through round643", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 641", "packRound(entry.name) > 643", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round641");', '.replace(/round276/g, "round643");', "prior round replacement");
source = replaceRequired(source, "round641 prior PLD lifecycle pack was scanned", "round643 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round641_london_pld_lifecycle_next118" && pack.exists === true',
  'pack) => pack.label === "round643_london_pld_lifecycle_next119" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, round629, round630, round634, round636, round638, and round641",
  "round628, round629, round630, round634, round636, round638, round641, and round643",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  'assertContains(transformed, "round641_london_pld_lifecycle_next118", "round641 prior pack");',
  'assertContains(transformed, "round641_london_pld_lifecycle_next118", "round641 prior pack");\\n  assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");',
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round645_london_pld_lifecycle_next120";')) {
  throw new Error("Round645 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 643") || !source.includes("through round643")) {
  throw new Error("Round645 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round643_london_pld_lifecycle_next119")) {
  throw new Error("Round645 wrapper did not retain Round643 as a prior pack");
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
  filename: "generated_round645_wrapper.js",
});
