const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round289_nyc_dob_co_next23_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round303_nyc_dob_co_next25_candidates.generated.js";
const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";
const REQUIRED_ROUND289_FILE = "tmp/subagents/round289_nyc_dob_co_next23/candidates.json";
const REQUIRED_ROUND300_FILE = "tmp/subagents/round300_nyc_dob_co_next24/candidates.json";

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed template is missing ${label}`);
  }
}

function transformRound289Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round289", "round303")
    .replaceAll("Round289", "Round303")
    .replaceAll("next23", "next25")
    .replaceAll("Next23", "Next25");

  transformed = replaceOnce(
    transformed,
    'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278`;',
    'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278|289|300`;',
    "prior round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278`;',
    'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278|289|300`;',
    "CO round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22`;',
    'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22|23|24`;',
    "CO next-round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";',
    'const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";\nconst REQUIRED_ROUND289_FILE = "tmp/subagents/round289_nyc_dob_co_next23/candidates.json";\nconst REQUIRED_ROUND300_FILE = "tmp/subagents/round300_nyc_dob_co_next24/candidates.json";',
    "required round289 and round300 screened file constants"
  );

  transformed = replaceOnce(
    transformed,
    '.replaceAll("through round273", "through round278")',
    '.replaceAll("through round273", "through round300")',
    "notes prior-round phrase"
  );
  transformed = transformed
    .replaceAll(
      "225, 232, 242, 247, 250, 256, 264, 267, 273, and 278",
      "225, 232, 242, 247, 250, 256, 264, 267, 273, 278, 289, and 300"
    )
    .replaceAll(
      "219, 225, 232, 242, 247, 250, 256, 264, 267, 273, and 278",
      "219, 225, 232, 242, 247, 250, 256, 264, 267, 273, 278, 289, and 300"
    )
    .replaceAll(
      "\"232\", \"242\", \"247\", \"250\", \"256\", \"264\", \"267\", \"273\", \"278\"]",
      "\"232\", \"242\", \"247\", \"250\", \"256\", \"264\", \"267\", \"273\", \"278\", \"289\", \"300\"]"
    )
    .replaceAll("including round278", "including round300")
    .replaceAll("including next22", "including next24");

  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json"\\n];',
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json",\\n  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json",\\n  "tmp/subagents/round300_nyc_dob_co_next24/candidates.json"\\n];',
    "required screened round289 and round300 files"
  );
  const duplicateBlockLabel = '    "duplicate block round278 file"';
  const duplicateBlockLabelIndex = transformed.indexOf(duplicateBlockLabel);
  if (duplicateBlockLabelIndex === -1) {
    throw new Error("Could not find duplicate block label for round303 insertion.");
  }
  const duplicateBlockTail = '"tmp/subagents/round278_nyc_dob_co_next22/candidates.json"';
  const duplicateBlockTailIndex = transformed.lastIndexOf(duplicateBlockTail, duplicateBlockLabelIndex);
  if (duplicateBlockTailIndex === -1) {
    throw new Error("Could not find duplicate block round278 tail for round303 insertion.");
  }
  const duplicateBlockAfterTail = transformed.slice(duplicateBlockTailIndex + duplicateBlockTail.length);
  const duplicateBlockNewline = duplicateBlockAfterTail.match(/^((?:\\)+n)/);
  if (!duplicateBlockNewline) {
    throw new Error("Could not find duplicate block escaped newline for round303 insertion.");
  }
  transformed = `${transformed.slice(0, duplicateBlockTailIndex)}${duplicateBlockTail},${duplicateBlockNewline[1]}  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json",${duplicateBlockNewline[1]}  "tmp/subagents/round300_nyc_dob_co_next24/candidates.json"${duplicateBlockAfterTail}`;
  transformed = replaceOnce(
    transformed,
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");\\n  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screening file");',
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");\\n  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screening file");\\n  assertContains(transformed, "tmp/subagents/round289_nyc_dob_co_next23/candidates.json", "round289 screening file");\\n  assertContains(transformed, "tmp/subagents/round300_nyc_dob_co_next24/candidates.json", "round300 screening file");',
    "round289 and round300 screening assertions"
  );
  transformed = replaceOnce(
    transformed,
    '  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");',
    '  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");\n  assertContains(transformed, REQUIRED_ROUND289_FILE, "round289 screened file");\n  assertContains(transformed, REQUIRED_ROUND300_FILE, "round300 screened file");',
    "required round289 and round300 asserts"
  );
  transformed = replaceOnce(
    transformed,
    '  if (!screenedFiles.includes(REQUIRED_ROUND278_FILE)) {\n    errors.push("Round278 DOB CO candidate pack was not listed in duplicate screening.");\n  }',
    '  if (!screenedFiles.includes(REQUIRED_ROUND278_FILE)) {\n    errors.push("Round278 DOB CO candidate pack was not listed in duplicate screening.");\n  }\n  if (!screenedFiles.includes(REQUIRED_ROUND289_FILE)) {\n    errors.push("Round289 DOB CO candidate pack was not listed in duplicate screening.");\n  }\n  if (!screenedFiles.includes(REQUIRED_ROUND300_FILE)) {\n    errors.push("Round300 DOB CO candidate pack was not listed in duplicate screening.");\n  }',
    "round289 and round300 validation duplicate-screen checks"
  );
  transformed = replaceOnce(
    transformed,
    "      required_round278_screened: screenedFiles.includes(REQUIRED_ROUND278_FILE),",
    "      required_round278_screened: screenedFiles.includes(REQUIRED_ROUND278_FILE),\n      required_round289_screened: screenedFiles.includes(REQUIRED_ROUND289_FILE),\n      required_round300_screened: screenedFiles.includes(REQUIRED_ROUND300_FILE),",
    "round289 and round300 validation check fields"
  );
  transformed = replaceOnce(
    transformed,
    "    `- Round278 screened: ${validation.checks.required_round278_screened}`,",
    "    `- Round278 screened: ${validation.checks.required_round278_screened}`,\n    `- Round289 screened: ${validation.checks.required_round289_screened}`,\n    `- Round300 screened: ${validation.checks.required_round300_screened}`,",
    "round289 and round300 validation report lines"
  );
  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round303_nyc_dob_co_next25", "round303 output path");
  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");
  assertContains(transformed, REQUIRED_ROUND289_FILE, "round289 screened file");
  assertContains(transformed, REQUIRED_ROUND300_FILE, "round300 screened file");
  assertContains(transformed, 'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278|289|300`;', "prior rounds include round300");
  assertContains(transformed, 'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278|289|300`;', "CO rounds include round300");
  assertContains(transformed, 'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22|23|24`;', "CO next rounds include next24");
  assertContains(transformed, '.replaceAll("round278", "round303")', "round303 inner transform");
  assertContains(transformed, '.replaceAll("through round273", "through round300")', "notes through round300");
  assertContains(transformed, "including rounds 225, 232, 242, 247, 250, 256, 264, 267, 273, 278, 289, and 300", "notes validation caveat");
  assertContains(transformed, "scripts/fetch_round303_nyc_dob_co_next25_candidates.js independent post-generation validator", "round303 validator label");
  assertContains(transformed, "required_round300_screened", "round300 validation result");

  return transformed;
}

async function main() {
  const source = transformRound289Wrapper(fs.readFileSync(TEMPLATE_PATH, "utf8"));
  const sandbox = {
    require,
    console,
    process,
    setTimeout,
    clearTimeout,
    URL,
    fetch,
    module: { exports: {} },
    exports: {}
  };

  vm.runInNewContext(source, sandbox, { filename: GENERATED_FILENAME });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed round303 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
