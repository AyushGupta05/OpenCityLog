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
    throw new Error(`Round333 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round333 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound327Script(source) {
  let transformed = source
    .replace(/round327_london_pld_lifecycle_next33/g, "round333_london_pld_lifecycle_next35")
    .replace(/round327\.london_pld_lifecycle_next33/g, "round333.london_pld_lifecycle_next35")
    .replace(/Bims5Round327PldLifecycleNext33/g, "Bims5Round333PldLifecycleNext35")
    .replace(/Round327/g, "Round333")
    .replace(/Round 327/g, "Round 333")
    .replace(/round327/g, "round333")
    .replace(/next33/g, "next35")
    .replace(/MAX_PRIOR_ROUND = 323/g, "MAX_PRIOR_ROUND = 328")
    .replace(/through round323/g, "through round328");

  transformed = replaceRequired(
    transformed,
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, and round323"\n    );',
    '      "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, and round328"\n    );',
    "prior round prose list"
  );

  transformed = replaceRequired(
    transformed,
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32"\\n];',
    '  "round316_london_pld_lifecycle_next31",\\n  "round323_london_pld_lifecycle_next32",\\n  "round327_london_pld_lifecycle_next33",\\n  "round328_london_pld_lifecycle_next34"\\n];',
    "explicit prior pack list"
  );

  transformed = replaceRequired(
    transformed,
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "through round328", "dedupe cutoff");',
    '  assertContains(transformed, "round323_london_pld_lifecycle_next32", "prior round323 pack");\n  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 pack");\n  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 pack");\n  assertContains(transformed, "through round328", "dedupe cutoff");',
    "prior round327 and round328 fetch assertions"
  );

  transformed = replaceRequired(
    transformed,
    '    .replace(/round276/g, "round323");',
    '    .replace(/round276/g, "round328");',
    "validator prior cutoff prose replacement"
  );

  assertContains(transformed, 'const ROUND_NAME = "round333_london_pld_lifecycle_next35";', "round name");
  assertContains(transformed, 'const ROUND = "round333";', "generated round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 328", "prior cutoff");
  assertContains(transformed, "round327_london_pld_lifecycle_next33", "prior round327 exclusion");
  assertContains(transformed, "round328_london_pld_lifecycle_next34", "prior round328 exclusion");
  assertContains(transformed, "through round328", "dedupe prose cutoff");
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
      filename: "generated_round333_london_pld_lifecycle_next35_candidates.js"
    }
  );
}

main();
