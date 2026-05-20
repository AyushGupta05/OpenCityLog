const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round289_nyc_dob_co_next23_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round300_nyc_dob_co_next24_candidates.generated.js";

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
    .replaceAll("round289", "round300")
    .replaceAll("Round289", "Round300")
    .replaceAll("next23", "next24")
    .replaceAll("Next23", "Next24");

  transformed = replaceOnce(
    transformed,
    'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278`;',
    'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278|289`;',
    "prior round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278`;',
    'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278|289`;',
    "CO round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22`;',
    'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22|23`;',
    "CO next-round constants"
  );
  transformed = replaceOnce(
    transformed,
    'const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";',
    'const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";\nconst REQUIRED_ROUND289_FILE = "tmp/subagents/round289_nyc_dob_co_next23/candidates.json";',
    "required round289 screened file constant"
  );

  transformed = replaceOnce(
    transformed,
    '.replaceAll("through round273", "through round278")',
    '.replaceAll("through round273", "through round289")',
    "notes prior-round phrase"
  );
  transformed = transformed
    .replaceAll(
      "225, 232, 242, 247, 250, 256, 264, 267, 273, and 278",
      "225, 232, 242, 247, 250, 256, 264, 267, 273, 278, and 289"
    )
    .replaceAll(
      "219, 225, 232, 242, 247, 250, 256, 264, 267, 273, and 278",
      "219, 225, 232, 242, 247, 250, 256, 264, 267, 273, 278, and 289"
    )
    .replaceAll(
      '"232", "242", "247", "250", "256", "264", "267", "273", "278"]',
      '"232", "242", "247", "250", "256", "264", "267", "273", "278", "289"]'
    )
    .replaceAll("including round278", "including round289")
    .replaceAll("including next22", "including next23");

  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json"\\n];',
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json",\\n  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json"\\n];',
    "required screened round289 file"
  );
  transformed = replaceOnce(
    transformed,
    '"tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\\\\\\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json"\\\\\\\\n];\';',
    '"tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\\\\\\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json",\\\\\\\\n  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json"\\\\\\\\n];\';',
    "duplicate block round289 file"
  );
  transformed = replaceOnce(
    transformed,
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");\\n  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screening file");',
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");\\n  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screening file");\\n  assertContains(transformed, "tmp/subagents/round289_nyc_dob_co_next23/candidates.json", "round289 screening file");',
    "round289 screening assertion"
  );
  transformed = replaceOnce(
    transformed,
    '  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");',
    '  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");\n  assertContains(transformed, REQUIRED_ROUND289_FILE, "round289 screened file");',
    "required round289 assert"
  );
  transformed = replaceOnce(
    transformed,
    '  if (!screenedFiles.includes(REQUIRED_ROUND278_FILE)) {\n    errors.push("Round278 DOB CO candidate pack was not listed in duplicate screening.");\n  }',
    '  if (!screenedFiles.includes(REQUIRED_ROUND278_FILE)) {\n    errors.push("Round278 DOB CO candidate pack was not listed in duplicate screening.");\n  }\n  if (!screenedFiles.includes(REQUIRED_ROUND289_FILE)) {\n    errors.push("Round289 DOB CO candidate pack was not listed in duplicate screening.");\n  }',
    "round289 validation duplicate-screen check"
  );
  transformed = replaceOnce(
    transformed,
    "      required_round278_screened: screenedFiles.includes(REQUIRED_ROUND278_FILE),",
    "      required_round278_screened: screenedFiles.includes(REQUIRED_ROUND278_FILE),\n      required_round289_screened: screenedFiles.includes(REQUIRED_ROUND289_FILE),",
    "round289 validation check field"
  );
  transformed = replaceOnce(
    transformed,
    "    `- Round278 screened: ${validation.checks.required_round278_screened}`,",
    "    `- Round278 screened: ${validation.checks.required_round278_screened}`,\n    `- Round289 screened: ${validation.checks.required_round289_screened}`,",
    "round289 validation report line"
  );

  assertContains(transformed, "round300_nyc_dob_co_next24", "round300 output path");
  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screened file");
  assertContains(transformed, "tmp/subagents/round289_nyc_dob_co_next23/candidates.json", "round289 screened file");
  assertContains(transformed, 'const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278|289`;', "prior rounds include round289");
  assertContains(transformed, 'const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278|289`;', "CO rounds include round289");
  assertContains(transformed, 'const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22|23`;', "CO next rounds include next23");
  assertContains(transformed, '.replaceAll("round278", "round300")', "round300 inner transform");
  assertContains(transformed, '.replaceAll("through round273", "through round289")', "notes through round289");
  assertContains(transformed, "including rounds 225, 232, 242, 247, 250, 256, 264, 267, 273, 278, and 289", "notes validation caveat");
  assertContains(transformed, "scripts/fetch_round300_nyc_dob_co_next24_candidates.js independent post-generation validator", "round300 validator label");
  assertContains(transformed, "required_round289_screened", "round289 validation result");

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
    throw new Error("Transformed round300 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
