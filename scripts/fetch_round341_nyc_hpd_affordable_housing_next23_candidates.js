const fs = require("fs");
const path = require("path");

const priorRoundScriptPath = path.join(__dirname, "fetch_round314_nyc_hpd_affordable_housing_next17_candidates.js");
let source = fs.readFileSync(priorRoundScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round314 HPD fetcher for round341: missing ${label}.`);
  }
  source = next;
}

replaceChecked(/round314/g, "round341", "lowercase round labels");
replaceChecked(/Round314/g, "Round341", "titlecase round labels");
replaceChecked(/next17/g, "next23", "next-pack labels");
replaceChecked('"const maxScreeningRound = 309;"', '"const maxScreeningRound = 336;"', "screening round");
replaceChecked(
  /"tmp\/subagents\/round309_nyc_hpd_affordable_housing_next16\/candidates\.json"\\n\];/,
  '"tmp/subagents/round309_nyc_hpd_affordable_housing_next16/candidates.json",\\n  "tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json",\\n  "tmp/subagents/round319_nyc_hpd_affordable_housing_next18/candidates.json",\\n  "tmp/subagents/round320_nyc_hpd_affordable_housing_next19/candidates.json",\\n  "tmp/subagents/round324_nyc_hpd_affordable_housing_next20/candidates.json",\\n  "tmp/subagents/round331_nyc_hpd_affordable_housing_next21/candidates.json",\\n  "tmp/subagents/round336_nyc_hpd_affordable_housing_next22/candidates.json"\\n];',
  "explicit Round314 through Round336 HPD candidate packs"
);
replaceChecked(/candidate_files_considered_through_round309/g, "candidate_files_considered_through_round336", "candidate-files summary key");
replaceChecked(/after Round309/g, "after Round336", "ranking previous round");
replaceChecked(/through round309/g, "through round336", "screening prose");
replaceChecked(
  /including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, and round309/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, round314, round319, round320, round324, round331, and round336",
  "explicit overlap caveat"
);

if (!source.includes("tmp/subagents/round341_nyc_hpd_affordable_housing_next23")) {
  throw new Error("Round341 adaptation failed: output directory was not updated.");
}
if (!source.includes("fetch_round341_nyc_hpd_affordable_housing_next23_candidates.js")) {
  throw new Error("Round341 adaptation failed: command label was not updated.");
}
if (!source.includes("tmp/subagents/round336_nyc_hpd_affordable_housing_next22/candidates.json")) {
  throw new Error("Round341 adaptation failed: Round336 candidate pack is not in duplicate screening.");
}
if (!source.includes("candidate_files_considered_through_round336")) {
  throw new Error("Round341 adaptation failed: duplicate-screening summary key was not updated.");
}

const runAdaptedRound314Fetcher = new Function(
  "require",
  "fetch",
  "__dirname",
  `${source}\n//# sourceURL=fetch_round341_nyc_hpd_affordable_housing_next23_candidates.adapted.js`
);

runAdaptedRound314Fetcher(require, fetch, __dirname);
