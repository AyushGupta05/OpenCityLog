const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND362_SCRIPT = path.join(ROOT, "scripts", "fetch_round362_london_pld_lifecycle_next42_candidates.js");

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round377 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round377 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound362Script(source) {
  let transformed = source
    .replace(/round362_london_pld_lifecycle_next42/g, "round377_london_pld_lifecycle_next46")
    .replace(/round362\.london_pld_lifecycle_next42/g, "round377.london_pld_lifecycle_next46")
    .replace(/Bims5Round362PldLifecycleNext42/g, "Bims5Round377PldLifecycleNext46")
    .replace(/Round362/g, "Round377")
    .replace(/Round 362/g, "Round 377")
    .replace(/round362/g, "round377")
    .replace(/next42/g, "next46")
    .replace(/MAX_PRIOR_ROUND = 358/g, "MAX_PRIOR_ROUND = 373")
    .replace(/through round358/g, "through round373");

  transformed = replaceRequired(
    transformed,
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, and round358"\\n    );',
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, and round373"\\n    );',
    "prior round prose list"
  );

  transformed = replaceRequired(
    transformed,
    '  "round316_london_pld_lifecycle_next31",\\\\n  "round323_london_pld_lifecycle_next32",\\\\n  "round327_london_pld_lifecycle_next33",\\\\n  "round328_london_pld_lifecycle_next34",\\\\n  "round333_london_pld_lifecycle_next35",\\\\n  "round338_london_pld_lifecycle_next36",\\\\n  "round343_london_pld_lifecycle_next37",\\\\n  "round348_london_pld_lifecycle_next38",\\\\n  "round350_london_pld_lifecycle_next39",\\\\n  "round354_london_pld_lifecycle_next40",\\\\n  "round358_london_pld_lifecycle_next41"\\\\n];',
    '  "round316_london_pld_lifecycle_next31",\\\\n  "round323_london_pld_lifecycle_next32",\\\\n  "round327_london_pld_lifecycle_next33",\\\\n  "round328_london_pld_lifecycle_next34",\\\\n  "round333_london_pld_lifecycle_next35",\\\\n  "round338_london_pld_lifecycle_next36",\\\\n  "round343_london_pld_lifecycle_next37",\\\\n  "round348_london_pld_lifecycle_next38",\\\\n  "round350_london_pld_lifecycle_next39",\\\\n  "round354_london_pld_lifecycle_next40",\\\\n  "round358_london_pld_lifecycle_next41",\\\\n  "round362_london_pld_lifecycle_next42",\\\\n  "round365_london_pld_lifecycle_next43",\\\\n  "round369_london_pld_lifecycle_next44",\\\\n  "round373_london_pld_lifecycle_next45"\\\\n];',
    "explicit prior pack list"
  );

  transformed = replaceRequired(
    transformed,
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\\n  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 pack");\\n  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 pack");\\n  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 pack");\\n  assertContains(transformed, "round338_london_pld_lifecycle_next36", "prior round338 pack");\\n  assertContains(transformed, "round343_london_pld_lifecycle_next37", "prior round343 pack");\\n  assertContains(transformed, "round348_london_pld_lifecycle_next38", "prior round348 pack");\\n  assertContains(transformed, "round350_london_pld_lifecycle_next39", "prior round350 pack");\\n  assertContains(transformed, "round354_london_pld_lifecycle_next40", "prior round354 pack");\\n  assertContains(transformed, "round358_london_pld_lifecycle_next41", "prior round358 pack");\\n  assertContains(transformed, "through round373", "dedupe cutoff");',
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\\n  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 pack");\\n  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 pack");\\n  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 pack");\\n  assertContains(transformed, "round338_london_pld_lifecycle_next36", "prior round338 pack");\\n  assertContains(transformed, "round343_london_pld_lifecycle_next37", "prior round343 pack");\\n  assertContains(transformed, "round348_london_pld_lifecycle_next38", "prior round348 pack");\\n  assertContains(transformed, "round350_london_pld_lifecycle_next39", "prior round350 pack");\\n  assertContains(transformed, "round354_london_pld_lifecycle_next40", "prior round354 pack");\\n  assertContains(transformed, "round358_london_pld_lifecycle_next41", "prior round358 pack");\\n  assertContains(transformed, "round362_london_pld_lifecycle_next42", "prior round362 pack");\\n  assertContains(transformed, "round365_london_pld_lifecycle_next43", "prior round365 pack");\\n  assertContains(transformed, "round369_london_pld_lifecycle_next44", "prior round369 pack");\\n  assertContains(transformed, "round373_london_pld_lifecycle_next45", "prior round373 pack");\\n  assertContains(transformed, "through round373", "dedupe cutoff");',
    "prior round327 through round373 fetch assertions"
  );

  transformed = replaceRequired(
    transformed,
    '    .replace(/round276/g, "round358");',
    '    .replace(/round276/g, "round373");',
    "validator prior cutoff prose replacement"
  );

  assertContains(transformed, 'const ROUND_NAME = "round377_london_pld_lifecycle_next46";', "round name");
  assertContains(transformed, 'const ROUND = "round377";', "generated round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 373", "prior cutoff");
  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 exclusion");
  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 exclusion");
  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 exclusion");
  assertContains(transformed, "round338_london_pld_lifecycle_next36", "prior round338 exclusion");
  assertContains(transformed, "round343_london_pld_lifecycle_next37", "prior round343 exclusion");
  assertContains(transformed, "round348_london_pld_lifecycle_next38", "prior round348 exclusion");
  assertContains(transformed, "round350_london_pld_lifecycle_next39", "prior round350 exclusion");
  assertContains(transformed, "round354_london_pld_lifecycle_next40", "prior round354 exclusion");
  assertContains(transformed, "round358_london_pld_lifecycle_next41", "prior round358 exclusion");
  assertContains(transformed, "round362_london_pld_lifecycle_next42", "prior round362 exclusion");
  assertContains(transformed, "round365_london_pld_lifecycle_next43", "prior round365 exclusion");
  assertContains(transformed, "round369_london_pld_lifecycle_next44", "prior round369 exclusion");
  assertContains(transformed, "round373_london_pld_lifecycle_next45", "prior round373 exclusion");
  assertContains(transformed, "through round373", "dedupe prose cutoff");
  return transformed;
}

function main() {
  const source = fs.readFileSync(ROUND362_SCRIPT, "utf8");
  const transformed = transformRound362Script(source);
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
      filename: "generated_round377_london_pld_lifecycle_next46_candidates.js"
    }
  );
}

main();
