const fs = require("fs");
const path = require("path");

const priorRoundScriptPath = path.join(__dirname, "fetch_round314_nyc_hpd_affordable_housing_next17_candidates.js");
let source = fs.readFileSync(priorRoundScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round314 HPD fetcher for round319: missing ${label}.`);
  }
  source = next;
}

replaceChecked(/round314/g, "round319", "lowercase round labels");
replaceChecked(/Round314/g, "Round319", "titlecase round labels");
replaceChecked(/next17/g, "next18", "next-pack labels");
replaceChecked('"const maxScreeningRound = 309;"', '"const maxScreeningRound = 314;"', "screening round");
replaceChecked(
  '"tmp/subagents/round309_nyc_hpd_affordable_housing_next16/candidates.json"\\n];',
  '"tmp/subagents/round309_nyc_hpd_affordable_housing_next16/candidates.json",\\n  "tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json"\\n];',
  "explicit Round314 HPD candidate pack"
);
replaceChecked(/candidate_files_considered_through_round309/g, "candidate_files_considered_through_round314", "candidate-files summary key");
replaceChecked(/after Round309/g, "after Round314", "ranking previous round");
replaceChecked(/through round309/g, "through round314", "screening prose");
replaceChecked(
  /including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, and round309/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, and round314",
  "explicit overlap caveat"
);

if (!source.includes("tmp/subagents/round319_nyc_hpd_affordable_housing_next18")) {
  throw new Error("Round319 adaptation failed: output directory was not updated.");
}
if (!source.includes("fetch_round319_nyc_hpd_affordable_housing_next18_candidates.js")) {
  throw new Error("Round319 adaptation failed: command label was not updated.");
}
if (!source.includes("tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json")) {
  throw new Error("Round319 adaptation failed: Round314 candidate pack is not in duplicate screening.");
}

const runAdaptedRound314Fetcher = new Function(
  "require",
  "fetch",
  "__dirname",
  `${source}\n//# sourceURL=fetch_round319_nyc_hpd_affordable_housing_next18_candidates.adapted.js`
);

runAdaptedRound314Fetcher(require, fetch, __dirname);
