const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_WRAPPER = path.join(__dirname, "fetch_round645_london_pld_lifecycle_next120_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round647 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_WRAPPER, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current wrapper from Round645/next120 to Round647/next121.
source = replaceRequired(source, "ROUND645", "ROUND647", "upper round");
source = replaceRequired(source, "Round 645", "Round 647", "display round");
source = replaceRequired(source, "Round645", "Round647", "camel round");
source = replaceRequired(source, "round645_london_pld_lifecycle_next120", "round647_london_pld_lifecycle_next121", "round name");
source = replaceRequired(source, "round645.london_pld_lifecycle_next120", "round647.london_pld_lifecycle_next121", "round dotted name");
source = replaceRequired(source, "round645", "round647", "lower round");
source = replaceRequired(source, "next120", "next121", "next label");

// Advance the dedupe boundary so generated Round647 excludes Round645.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 643", "MAX_PRIOR_ROUND = 645", "prior cutoff");
source = replaceRequired(source, "through round643", "through round645", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 643", "packRound(entry.name) > 645", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round643");', '.replace(/round276/g, "round645");', "prior round replacement");
source = replaceRequired(source, "round643 prior PLD lifecycle pack was scanned", "round645 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round643_london_pld_lifecycle_next119" && pack.exists === true',
  'pack) => pack.label === "round645_london_pld_lifecycle_next120" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, round629, round630, round634, round636, round638, round641, and round643",
  "round628, round629, round630, round634, round636, round638, round641, round643, and round645",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119",\\\\\\\\n  "round645_london_pld_lifecycle_next120"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  'assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");',
  'assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");\\\\n  assertContains(transformed, "round645_london_pld_lifecycle_next120", "round645 prior pack");',
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round647_london_pld_lifecycle_next121";')) {
  throw new Error("Round647 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 645") || !source.includes("through round645")) {
  throw new Error("Round647 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round645_london_pld_lifecycle_next120")) {
  throw new Error("Round647 wrapper did not retain Round645 as a prior pack");
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
  filename: "generated_round647_wrapper.js",
});
