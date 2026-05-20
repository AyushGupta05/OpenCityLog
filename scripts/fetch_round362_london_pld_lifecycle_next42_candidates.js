const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND327_SCRIPT = path.join(ROOT, "scripts", "fetch_round327_london_pld_lifecycle_next33_candidates.js");

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round362 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round362 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound327Script(source) {
  let transformed = source
    .replace(/round327_london_pld_lifecycle_next33/g, "round362_london_pld_lifecycle_next42")
    .replace(/round327\.london_pld_lifecycle_next33/g, "round362.london_pld_lifecycle_next42")
    .replace(/Bims5Round327PldLifecycleNext33/g, "Bims5Round362PldLifecycleNext42")
    .replace(/Round327/g, "Round362")
    .replace(/Round 327/g, "Round 362")
    .replace(/round327/g, "round362")
    .replace(/next33/g, "next42")
    .replace(/MAX_PRIOR_ROUND = 323/g, "MAX_PRIOR_ROUND = 358")
    .replace(/through round323/g, "through round358");

  transformed = replaceRequired(
    transformed,
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, and round323"\n    );',
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, and round358"\n    );',
    "prior round prose list"
  );

  transformed = replaceRequired(
    transformed,
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32"\\n];',
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32",\\n  "round327_london_pld_lifecycle_next33",\\n  "round328_london_pld_lifecycle_next34",\\n  "round333_london_pld_lifecycle_next35",\\n  "round338_london_pld_lifecycle_next36",\\n  "round343_london_pld_lifecycle_next37",\\n  "round348_london_pld_lifecycle_next38",\\n  "round350_london_pld_lifecycle_next39",\\n  "round354_london_pld_lifecycle_next40",\\n  "round358_london_pld_lifecycle_next41"\\n];',
    "explicit prior pack list"
  );

  transformed = replaceRequired(
    transformed,
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "through round358", "dedupe cutoff");',
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 pack");\n  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 pack");\n  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 pack");\n  assertContains(transformed, "round338_london_pld_lifecycle_next36", "prior round338 pack");\n  assertContains(transformed, "round343_london_pld_lifecycle_next37", "prior round343 pack");\n  assertContains(transformed, "round348_london_pld_lifecycle_next38", "prior round348 pack");\n  assertContains(transformed, "round350_london_pld_lifecycle_next39", "prior round350 pack");\n  assertContains(transformed, "round354_london_pld_lifecycle_next40", "prior round354 pack");\n  assertContains(transformed, "round358_london_pld_lifecycle_next41", "prior round358 pack");\n  assertContains(transformed, "through round358", "dedupe cutoff");',
    "prior round327 through round358 fetch assertions"
  );

  transformed = replaceRequired(
    transformed,
    '    .replace(/round276/g, "round323");',
    '    .replace(/round276/g, "round358");',
    "validator prior cutoff prose replacement"
  );

  assertContains(transformed, 'const ROUND_NAME = "round362_london_pld_lifecycle_next42";', "round name");
  assertContains(transformed, 'const ROUND = "round362";', "generated round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 358", "prior cutoff");
  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 exclusion");
  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 exclusion");
  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 exclusion");
  assertContains(transformed, "round338_london_pld_lifecycle_next36", "prior round338 exclusion");
  assertContains(transformed, "round343_london_pld_lifecycle_next37", "prior round343 exclusion");
  assertContains(transformed, "round348_london_pld_lifecycle_next38", "prior round348 exclusion");
  assertContains(transformed, "round350_london_pld_lifecycle_next39", "prior round350 exclusion");
  assertContains(transformed, "round354_london_pld_lifecycle_next40", "prior round354 exclusion");
  assertContains(transformed, "round358_london_pld_lifecycle_next41", "prior round358 exclusion");
  assertContains(transformed, "through round358", "dedupe prose cutoff");
  return transformed;
}

function main() {
  const source = fs.readFileSync(ROUND327_SCRIPT, "utf8");
  const transformed = transformRound327Script(source);
  vm.runInNewContext(
    transformed,
    {
      require,
      console,
      process,
      fetch,
      __dirname,
      module: { exports: {} },
      exports: {}
    },
    {
      filename: "generated_round362_london_pld_lifecycle_next42_candidates.js"
    }
  );
}

main();
