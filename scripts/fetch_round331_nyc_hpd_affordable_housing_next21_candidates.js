const fs = require("fs");
const path = require("path");

const priorRoundScriptPath = path.join(__dirname, "fetch_round319_nyc_hpd_affordable_housing_next18_candidates.js");
let source = fs.readFileSync(priorRoundScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round319 HPD fetcher for round331: missing ${label}.`);
  }
  source = next;
}

replaceChecked(/round319/g, "round331", "lowercase round labels");
replaceChecked(/Round319/g, "Round331", "titlecase round labels");
replaceChecked(/next18/g, "next21", "next-pack labels");
replaceChecked('"const maxScreeningRound = 314;"', '"const maxScreeningRound = 324;"', "screening round");
replaceChecked(
  '"tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json"\\\\n];',
  '"tmp/subagents/round314_nyc_hpd_affordable_housing_next17/candidates.json",\\\\n  "tmp/subagents/round319_nyc_hpd_affordable_housing_next18/candidates.json",\\\\n  "tmp/subagents/round320_nyc_hpd_affordable_housing_next19/candidates.json",\\\\n  "tmp/subagents/round324_nyc_hpd_affordable_housing_next20/candidates.json"\\\\n];',
  "explicit Round314 through Round324 HPD candidate packs"
);
replaceChecked(/candidate_files_considered_through_round314/g, "candidate_files_considered_through_round324", "candidate-files summary key");
replaceChecked(/after Round314/g, "after Round324", "ranking previous round");
replaceChecked(/through round314/g, "through round324", "screening prose");
replaceChecked(
  /including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, and round314/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, round304, round309, round314, round319, round320, and round324",
  "explicit overlap caveat"
);

if (!source.includes("tmp/subagents/round331_nyc_hpd_affordable_housing_next21")) {
  throw new Error("Round331 adaptation failed: output directory was not updated.");
}
if (!source.includes("fetch_round331_nyc_hpd_affordable_housing_next21_candidates.js")) {
  throw new Error("Round331 adaptation failed: command label was not updated.");
}
if (!source.includes("tmp/subagents/round324_nyc_hpd_affordable_housing_next20/candidates.json")) {
  throw new Error("Round331 adaptation failed: Round324 candidate pack is not in duplicate screening.");
}
if (!source.includes("candidate_files_considered_through_round324")) {
  throw new Error("Round331 adaptation failed: duplicate-screening summary key was not updated.");
}

const runAdaptedRound319Fetcher = new Function(
  "require",
  "fetch",
  "__dirname",
  `${source}\n//# sourceURL=fetch_round331_nyc_hpd_affordable_housing_next21_candidates.adapted.js`
);

runAdaptedRound319Fetcher(require, fetch, __dirname);
