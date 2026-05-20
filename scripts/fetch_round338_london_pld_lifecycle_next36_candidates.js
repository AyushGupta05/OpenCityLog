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
    throw new Error(`Round338 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round338 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound327Script(source) {
  let transformed = source
    .replace(/round327_london_pld_lifecycle_next33/g, "round338_london_pld_lifecycle_next36")
    .replace(/round327\.london_pld_lifecycle_next33/g, "round338.london_pld_lifecycle_next36")
    .replace(/Bims5Round327PldLifecycleNext33/g, "Bims5Round338PldLifecycleNext36")
    .replace(/Round327/g, "Round338")
    .replace(/Round 327/g, "Round 338")
    .replace(/round327/g, "round338")
    .replace(/next33/g, "next36")
    .replace(/MAX_PRIOR_ROUND = 323/g, "MAX_PRIOR_ROUND = 333")
    .replace(/through round323/g, "through round333");

  transformed = replaceRequired(
    transformed,
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, and round323"\n    );',
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, and round333"\n    );',
    "prior round prose list"
  );

  transformed = replaceRequired(
    transformed,
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32"\\n];',
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32",\\n  "round327_london_pld_lifecycle_next33",\\n  "round328_london_pld_lifecycle_next34",\\n  "round333_london_pld_lifecycle_next35"\\n];',
    "explicit prior pack list"
  );

  transformed = replaceRequired(
    transformed,
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "through round333", "dedupe cutoff");',
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 pack");\n  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 pack");\n  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 pack");\n  assertContains(transformed, "through round333", "dedupe cutoff");',
    "prior round327, round328, and round333 fetch assertions"
  );

  transformed = replaceRequired(
    transformed,
    '    .replace(/round276/g, "round323");',
    '    .replace(/round276/g, "round333");',
    "validator prior cutoff prose replacement"
  );

  assertContains(transformed, 'const ROUND_NAME = "round338_london_pld_lifecycle_next36";', "round name");
  assertContains(transformed, 'const ROUND = "round338";', "generated round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 333", "prior cutoff");
  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 exclusion");
  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 exclusion");
  assertContains(transformed, "round333_london_pld_lifecycle_next35", "prior round333 exclusion");
  assertContains(transformed, "through round333", "dedupe prose cutoff");
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
      filename: "generated_round338_london_pld_lifecycle_next36_candidates.js"
    }
  );
}

main();
