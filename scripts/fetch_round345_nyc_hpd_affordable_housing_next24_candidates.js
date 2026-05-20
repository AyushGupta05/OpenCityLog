const fs = require("fs");
const path = require("path");

const priorRoundScriptPath = path.join(__dirname, "fetch_round341_nyc_hpd_affordable_housing_next23_candidates.js");
let source = fs.readFileSync(priorRoundScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round341 HPD fetcher for round345: missing ${label}.`);
  }
  source = next;
}

replaceChecked(/round341/g, "round345", "lowercase round labels");
replaceChecked(/Round341/g, "Round345", "titlecase round labels");
replaceChecked(/next23/g, "next24", "next-pack labels");
replaceChecked('"const maxScreeningRound = 336;"', '"const maxScreeningRound = 341;"', "screening round");
replaceChecked(
  /"tmp\/subagents\/round309_nyc_hpd_affordable_housing_next16\/candidates\.json",\\\\n  "tmp\/subagents\/round314_nyc_hpd_affordable_housing_next17\/candidates\.json",\\\\n  "tmp\/subagents\/round319_nyc_hpd_affordable_housing_next18\/candidates\.json",\\\\n  "tmp\/subagents\/round320_nyc_hpd_affordable_housing_next19\/candidates\.json",\\\\n  "tmp\/subagents\/round324_nyc_hpd_affordable_housing_next20\/candidates\.json",\\\\n  "tmp\/subagents\/round331_nyc_hpd_affordable_housing_next21\/candidates\.json",\\\\n  "tmp\/subagents\/round336_nyc_hpd_affordable_housing_next22\/candidates\.json"\\\\n\];/,
  '"tmp/subagents/round309_nyc_hpd_affordable_housing_next16/candidates.json",\\\\n  "tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json",\\\\n  "tmp/subagents/round319_nyc_hpd_affordable_housing_next18/candidates.json",\\\\n  "tmp/subagents/round320_nyc_hpd_affordable_housing_next19/candidates.json",\\\\n  "tmp/subagents/round324_nyc_hpd_affordable_housing_next20/candidates.json",\\\\n  "tmp/subagents/round331_nyc_hpd_affordable_housing_next21/candidates.json",\\\\n  "tmp/subagents/round336_nyc_hpd_affordable_housing_next22/candidates.json",\\\\n  "tmp/subagents/round341_nyc_hpd_affordable_housing_next23/candidates.json"\\\\n];',
  "explicit Round341 HPD candidate pack"
);
replaceChecked(/candidate_files_considered_through_round336/g, "candidate_files_considered_through_round341", "candidate-files summary key");
replaceChecked(/after Round336/g, "after Round341", "ranking previous round");
replaceChecked(/through round336/g, "through round341", "screening prose");
replaceChecked(
  /including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, round314, round319, round320, round324, round331, and round336/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, round314, round319, round320, round324, round331, round336, and round341",
  "explicit overlap caveat"
);

if (!source.includes("tmp/subagents/round345_nyc_hpd_affordable_housing_next24")) {
  throw new Error("Round345 adaptation failed: output directory was not updated.");
}
if (!source.includes("fetch_round345_nyc_hpd_affordable_housing_next24_candidates.js")) {
  throw new Error("Round345 adaptation failed: command label was not updated.");
}
if (!source.includes("tmp/subagents/round341_nyc_hpd_affordable_housing_next23/candidates.json")) {
  throw new Error("Round345 adaptation failed: Round341 candidate pack is not in duplicate screening.");
}
if (!source.includes("candidate_files_considered_through_round341")) {
  throw new Error("Round345 adaptation failed: duplicate-screening summary key was not updated.");
}

const runAdaptedRound341Fetcher = new Function(
  "require",
  "fetch",
  "__dirname",
  `${source}\n//# sourceURL=fetch_round345_nyc_hpd_affordable_housing_next24_candidates.adapted.js`
);

runAdaptedRound341Fetcher(require, fetch, __dirname);
