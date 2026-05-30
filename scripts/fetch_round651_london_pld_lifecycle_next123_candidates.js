const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_WRAPPER = path.join(__dirname, "fetch_round649_london_pld_lifecycle_next122_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round651 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_WRAPPER, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current wrapper from Round649/next122 to Round651/next123.
source = replaceRequired(source, "Round649", "Round651", "camel round");
source = replaceRequired(source, "Round 649", "Round 651", "display round");
source = replaceRequired(source, "ROUND649", "ROUND651", "upper round");
source = replaceRequired(source, "round649_london_pld_lifecycle_next122", "round651_london_pld_lifecycle_next123", "round name");
source = replaceRequired(source, "round649.london_pld_lifecycle_next122", "round651.london_pld_lifecycle_next123", "round dotted name");
source = replaceRequired(source, "round649", "round651", "lower round");
source = replaceRequired(source, "next122", "next123", "next label");

// Advance the scratch-pack dedupe boundary so generated Round651 excludes Round649.
// Later PLD rows already appended to the live manual corpus are still excluded by corpus scanning.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 647", "MAX_PRIOR_ROUND = 649", "prior cutoff");
source = replaceRequired(source, "through round647", "through round649", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 647", "packRound(entry.name) > 649", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round647");', '.replace(/round276/g, "round649");', "prior round replacement");
source = replaceRequired(source, "round647 prior PLD lifecycle pack was scanned", "round649 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round647_london_pld_lifecycle_next121" && pack.exists === true',
  'pack) => pack.label === "round649_london_pld_lifecycle_next122" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, round629, round630, round634, round636, round638, round641, round643, round645, and round647",
  "round628, round629, round630, round634, round636, round638, round641, round643, round645, round647, and round649",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119",\\\\\\\\n  "round645_london_pld_lifecycle_next120",\\\\\\\\n  "round647_london_pld_lifecycle_next121"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119",\\\\\\\\n  "round645_london_pld_lifecycle_next120",\\\\\\\\n  "round647_london_pld_lifecycle_next121",\\\\\\\\n  "round649_london_pld_lifecycle_next122"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  String.raw`assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");\\\\n  assertContains(transformed, "round645_london_pld_lifecycle_next120", "round645 prior pack");\\\\n  assertContains(transformed, "round647_london_pld_lifecycle_next121", "round647 prior pack");`,
  String.raw`assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");\\\\n  assertContains(transformed, "round645_london_pld_lifecycle_next120", "round645 prior pack");\\\\n  assertContains(transformed, "round647_london_pld_lifecycle_next121", "round647 prior pack");\\\\n  assertContains(transformed, "round649_london_pld_lifecycle_next122", "round649 prior pack");`,
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round651_london_pld_lifecycle_next123";')) {
  throw new Error("Round651 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 649") || !source.includes("through round649")) {
  throw new Error("Round651 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round649_london_pld_lifecycle_next122")) {
  throw new Error("Round651 wrapper did not retain Round649 as a prior pack");
}

vm.runInNewContext(source, {
  require,
  console,
  process,
  fetch,
  Buffer,
  setTimeout,
  clearTimeout,
  __dirname,
  module: { exports: {} },
  exports: {},
}, {
  filename: "generated_round651_wrapper.js",
});
