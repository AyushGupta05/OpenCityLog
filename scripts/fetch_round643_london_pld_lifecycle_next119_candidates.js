const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT = path.join(__dirname, "fetch_round630_london_pld_lifecycle_next114_candidates.js");

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Round643 wrapper transform could not find ${label}: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

const PRESELECTION_TARGET = `      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));
      selected.push(candidateFor(item));`;
const PRESELECTION_REPLACEMENT = `      const candidate = candidateFor(item);
      const restrictedCandidateText = [
        candidate.title,
        candidate.summary,
        candidate.observed_change,
        candidate.limitations.join(" "),
        candidate.transformation_method
      ].join(" ");
      if (RESTRICTED_OUTPUT_LANGUAGE.test(restrictedCandidateText)) {
        rejectWith(rejections, "restricted_lifecycle_language", item);
        continue;
      }
      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));
      selected.push(candidate);`;

const BARE_DUPLICATE_INSERTION_TARGET = [
  '      "      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));",',
  '      "      batchKeys.add(`source_url|${selectedSourceUrl}`);",',
  '      "      batchKeys.add(`source_record_id|${selectedSourceRecordId}`);",',
  '      "      batchKeys.add(`title_date|${selectedTitleDate}`);",',
  '      "      selected.push(candidateFor(item));"'
].join("\n");

const BARE_DUPLICATE_INSERTION_REPLACEMENT = [
  '      "      const candidate = candidateFor(item);",',
  '      "      const restrictedCandidateText = [",',
  '      "        candidate.title,",',
  '      "        candidate.summary,",',
  '      "        candidate.observed_change,",',
  '      "        candidate.limitations.join(\\" \\"),",',
  '      "        candidate.transformation_method",',
  '      "      ].join(\\" \\");",',
  '      "      if (RESTRICTED_OUTPUT_LANGUAGE.test(restrictedCandidateText)) {",',
  '      "        rejectWith(rejections, \\"restricted_lifecycle_language\\", item);",',
  '      "        continue;",',
  '      "      }",',
  '      "      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));",',
  '      "      batchKeys.add(`source_url|${selectedSourceUrl}`);",',
  '      "      batchKeys.add(`source_record_id|${selectedSourceRecordId}`);",',
  '      "      batchKeys.add(`title_date|${selectedTitleDate}`);",',
  '      "      selected.push(candidate);"'
].join("\n");

function patchSourceText(value) {
  if (typeof value !== "string") return value;
  if (value.includes("bare source duplicate batch key insertion") && !value.includes("restricted_lifecycle_language")) {
    if (value.includes(BARE_DUPLICATE_INSERTION_TARGET)) {
      return value.split(BARE_DUPLICATE_INSERTION_TARGET).join(BARE_DUPLICATE_INSERTION_REPLACEMENT);
    }
    const crlfTarget = BARE_DUPLICATE_INSERTION_TARGET.replace(/\n/g, "\r\n");
    if (value.includes(crlfTarget)) {
      return value
        .split(crlfTarget)
        .join(BARE_DUPLICATE_INSERTION_REPLACEMENT.replace(/\n/g, "\r\n"));
    }
  }
  return value;
}

const patchedFs = Object.create(fs);
patchedFs.readFileSync = function readFileSyncPatched(file, options) {
  return patchSourceText(fs.readFileSync(file, options));
};

function patchedRequire(request) {
  if (request === "fs") return patchedFs;
  return require(request);
}

// Advance the current wrapper from Round630/next114 to Round643/next119.
source = replaceRequired(source, "ROUND630_OUT_DIR", "ROUND643_OUT_DIR", "out dir variable");
source = replaceRequired(source, "ROUND630_ACCESS_DATE", "ROUND643_ACCESS_DATE", "access date variable");
source = replaceRequired(source, "round630_london_pld_lifecycle_next114", "round643_london_pld_lifecycle_next119", "round name");
source = replaceRequired(source, "round630.london_pld_lifecycle_next114", "round643.london_pld_lifecycle_next119", "round dotted name");
source = replaceRequired(source, "Bims5Round630PldLifecycleNext114", "Bims5Round643PldLifecycleNext119", "class name");
source = replaceRequired(source, "Round 630", "Round 643", "display round");
source = replaceRequired(source, "Round630", "Round643", "camel round");
source = replaceRequired(source, "round630", "round643", "lower round");
source = replaceRequired(source, "next114", "next119", "next label");

// Advance the dedupe boundary so generated Round643 excludes Round641.
source = replaceRequired(source, "MAX_PRIOR_ROUND = 629", "MAX_PRIOR_ROUND = 641", "prior cutoff");
source = replaceRequired(source, "through round629", "through round641", "prior cutoff prose");
source = replaceRequired(source, "packRound(entry.name) > 629", "packRound(entry.name) > 641", "prior pack filter");
source = replaceRequired(source, '.replace(/round276/g, "round629");', '.replace(/round276/g, "round641");', "prior round replacement");
source = replaceRequired(source, "round629 prior PLD lifecycle pack was scanned", "round641 prior PLD lifecycle pack was scanned", "prior scan text");
source = replaceRequired(
  source,
  'pack) => pack.label === "round629_london_pld_lifecycle_next113" && pack.exists === true',
  'pack) => pack.label === "round641_london_pld_lifecycle_next118" && pack.exists === true',
  "prior pack existence check",
);
source = replaceRequired(
  source,
  "round628, and round629",
  "round628, round629, round630, round634, round636, round638, and round641",
  "prior prose list",
);
source = replaceRequired(
  source,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113"\\\\\\\\n];`,
  String.raw`  "round628_london_pld_lifecycle_next112",\\\\\\\\n  "round629_london_pld_lifecycle_next113",\\\\\\\\n  "round630_london_pld_lifecycle_next114",\\\\\\\\n  "round634_london_pld_lifecycle_next115",\\\\\\\\n  "round636_london_pld_lifecycle_next116",\\\\\\\\n  "round638_london_pld_lifecycle_next117",\\\\\\\\n  "round641_london_pld_lifecycle_next118"\\\\\\\\n];`,
  "prior pack list",
);
source = replaceRequired(
  source,
  'assertContains(transformed, "round629_london_pld_lifecycle_next113", "round629 prior pack");',
  'assertContains(transformed, "round630_london_pld_lifecycle_next114", "round630 prior pack");\n  assertContains(transformed, "round634_london_pld_lifecycle_next115", "round634 prior pack");\n  assertContains(transformed, "round636_london_pld_lifecycle_next116", "round636 prior pack");\n  assertContains(transformed, "round638_london_pld_lifecycle_next117", "round638 prior pack");\n  assertContains(transformed, "round641_london_pld_lifecycle_next118", "round641 prior pack");',
  "prior pack assertion",
);

if (!source.includes('const ROUND_NAME = "round643_london_pld_lifecycle_next119";')) {
  throw new Error("Round643 wrapper did not advance the generated round name");
}
if (!source.includes("MAX_PRIOR_ROUND = 641") || !source.includes("through round641")) {
  throw new Error("Round643 wrapper did not advance the dedupe boundary");
}
if (!source.includes("round641_london_pld_lifecycle_next118")) {
  throw new Error("Round643 wrapper did not retain Round641 as a prior pack");
}
if (!PRESELECTION_REPLACEMENT.includes("restricted_lifecycle_language")) {
  throw new Error("Round643 wrapper did not install restricted-language candidate rejection");
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
  filename: "generated_round643_wrapper.js",
});
