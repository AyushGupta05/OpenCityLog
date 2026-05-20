const fs = require("fs");
const path = require("path");

const baseScriptPath = path.join(__dirname, "fetch_round251_nyc_hpd_affordable_housing_next8_candidates.js");
let source = fs.readFileSync(baseScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round251 HPD fetcher for round255: missing ${label}.`);
  }
  source = next;
}

replaceChecked(
  'const outDir = "tmp/subagents/round251_nyc_hpd_affordable_housing_next8";',
  'const outDir = "tmp/subagents/round255_nyc_hpd_affordable_housing_next9";',
  "output directory"
);
replaceChecked('const roundName = "Round251";', 'const roundName = "Round255";', "round name");
replaceChecked("const maxScreeningRound = 246;", "const maxScreeningRound = 251;", "screening round");
replaceChecked(/Round251/g, "Round255", "round label references");
replaceChecked(/round251\.nyc/g, "round255.nyc", "schema round prefix");
replaceChecked(
  /nyc_hpd_affordable_housing_next8/g,
  "nyc_hpd_affordable_housing_next9",
  "next pack label"
);
replaceChecked(
  '  "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json"\n];',
  '  "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json",\n  "tmp/subagents/round251_nyc_hpd_affordable_housing_next8/candidates.json"\n];',
  "explicit HPD candidate pack list"
);
replaceChecked(
  /candidate_files_considered_through_round246/g,
  "candidate_files_considered_through_round251",
  "candidate-files summary key"
);
replaceChecked(
  "async function main()",
  `const round255SelectionCache = new WeakMap();

function selectedRound255CandidateIds(rankedCandidates) {
  if (round255SelectionCache.has(rankedCandidates)) return round255SelectionCache.get(rankedCandidates);
  const selectedIds = new Set();
  const newConstructionCandidates = rankedCandidates.filter((candidate) => isNewConstruction(candidate.raw_row));
  const preservationCandidates = rankedCandidates.filter((candidate) => !isNewConstruction(candidate.raw_row));
  const reservedNewConstructionCount = newConstructionCandidates.length > 0 && preservationCandidates.length > 0
    ? Math.min(newConstructionCandidates.length, Math.max(1, Math.round(targetCount * 0.1)))
    : 0;

  for (const candidate of newConstructionCandidates.slice(0, reservedNewConstructionCount)) {
    selectedIds.add(candidate.event_id);
  }
  for (const candidate of rankedCandidates) {
    if (selectedIds.size >= targetCount) break;
    selectedIds.add(candidate.event_id);
  }

  round255SelectionCache.set(rankedCandidates, selectedIds);
  return selectedIds;
}

async function main()`,
  "round255 balanced selection helper"
);
replaceChecked(
  ".slice(0, targetCount)",
  ".filter((candidate, index, rankedCandidates) => selectedRound255CandidateIds(rankedCandidates).has(candidate.event_id))",
  "round255 balanced selection call"
);
replaceChecked(
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates. Round255 reserves a small deterministic New Construction slice when eligible post-dedupe rows remain, so the accepted pack includes both admitted HPD construction-type groups while still keeping building-completion records as the majority.",
  "round255 ranking summary"
);
replaceChecked(
  /including round229, round234, round236, round241, and round246/g,
  "including round229, round234, round236, round241, round246, and round251",
  "explicit overlap caveat"
);
replaceChecked(/through round246/g, "through round251", "screening prose");

const runAdaptedRound251Fetcher = new Function(
  "require",
  "fetch",
  `${source}\n//# sourceURL=fetch_round255_nyc_hpd_affordable_housing_next9_candidates.adapted.js`
);

runAdaptedRound251Fetcher(require, fetch);
