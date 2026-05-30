const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_WRAPPER = path.join(__dirname, "fetch_round647_london_pld_lifecycle_next121_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round649 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_WRAPPER, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

function patchScriptSource(value) {
  if (typeof value !== "string") return value;
  return value
    .split('const ACCESSED_AT = "2026-05-20";').join('const ACCESSED_AT = "2026-05-23";')
    .split('const GENERATED_AT = "2026-05-20T00:00:00Z";').join('const GENERATED_AT = "2026-05-23T00:00:00Z";')
    .split('const END_DATE = "2026-05-20";').join('const END_DATE = "2026-05-23";');
}

const patchedFs = Object.create(fs);
patchedFs.readFileSync = function readFileSyncPatched(file, options) {
  const value = fs.readFileSync(file, options);
  const filePath = String(file);
  if (!filePath.endsWith(".js")) return value;
  return Buffer.isBuffer(value) ? Buffer.from(patchScriptSource(value.toString("utf8")), "utf8") : patchScriptSource(value);
};

function patchedRequire(request) {
  if (request === "fs") return patchedFs;
  return require(request);
}

// Advance the current wrapper from Round647/next121 to Round649/next122.
source = replaceRequired(source, "ROUND647", "ROUND649", "upper round");
source = replaceRequired(source, "Round 647", "Round 649", "display round");
source = replaceRequired(source, "Round647", "Round649", "camel round");
source = replaceRequired(source, "round647_london_pld_lifecycle_next121", "round649_london_pld_lifecycle_next122", "round name");
source = replaceRequired(source, "round647.london_pld_lifecycle_next121", "round649.london_pld_lifecycle_next122", "round dotted name");
source = replaceRequired(source, "round647", "round649", "lower round");
source = replaceRequired(source, "next121", "next122", "next label");

// Advance the dedupe boundary so generated Round649 excludes Round647.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 645", "MAX_PRIOR_ROUND = 647", "prior cutoff");
source = replaceRequired(source, "through round645", "through round647", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 645", "packRound(entry.name) > 647", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round645");', '.replace(/round276/g, "round647");', "prior round replacement");
source = replaceRequired(source, "round645 prior PLD lifecycle pack was scanned", "round647 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round645_london_pld_lifecycle_next120" && pack.exists === true',
  'pack) => pack.label === "round647_london_pld_lifecycle_next121" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, round629, round630, round634, round636, round638, round641, round643, and round645",
  "round628, round629, round630, round634, round636, round638, round641, round643, round645, and round647",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119",\\\\\\\\n  "round645_london_pld_lifecycle_next120"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118",\\\\\\\\n  "round643_london_pld_lifecycle_next119",\\\\\\\\n  "round645_london_pld_lifecycle_next120",\\\\\\\\n  "round647_london_pld_lifecycle_next121"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  String.raw`assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");\\\\n  assertContains(transformed, "round645_london_pld_lifecycle_next120", "round645 prior pack");`,
  String.raw`assertContains(transformed, "round643_london_pld_lifecycle_next119", "round643 prior pack");\\\\n  assertContains(transformed, "round645_london_pld_lifecycle_next120", "round645 prior pack");\\\\n  assertContains(transformed, "round647_london_pld_lifecycle_next121", "round647 prior pack");`,
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round649_london_pld_lifecycle_next122";')) {
  throw new Error("Round649 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 647") || !source.includes("through round647")) {
  throw new Error("Round649 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round647_london_pld_lifecycle_next121")) {
  throw new Error("Round649 wrapper did not retain Round647 as a prior pack");
}

vm.runInNewContext(source, {
  require: patchedRequire,
  console,
  process,
  fetch,
  setTimeout,
  clearTimeout,
  __dirname,
  module: { exports: {} },
  exports: {},
}, {
  filename: "generated_round649_wrapper.js",
});
