const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_SCRIPT = path.join(ROOT, "scripts", "fetch_round281_belfast_official_planning_tail2_candidates.js");

function buildRound286Script(source) {
  let transformed = source
    .replaceAll("round281_belfast_official_planning_tail2", "round286_belfast_official_planning_tail3")
    .replaceAll("fetch_round281_belfast_official_planning_tail2_candidates.js", "fetch_round286_belfast_official_planning_tail3_candidates.js")
    .replaceAll("Round281", "Round286")
    .replaceAll("round281", "round286")
    .replaceAll("tail2", "tail3")
    .replaceAll("after round270", "after round281")
    .replaceAll("quality.score < 65", "quality.score < 45")
    .replaceAll("met a conservative tail gate", "met a residual physical-works tail gate")
    .replaceAll("capped the ranked review pack at 120", "capped the ranked review pack at 100")
    .replaceAll(
      "forecasts, impacts, or causal evidence",
      "future projections, outcome claims, or cause-and-effect evidence"
    )
    .replaceAll(
      "current manual architecture corpus, round270, and prior Belfast candidate packs",
      "current manual architecture corpus, round270, round281, and prior Belfast candidate packs through round281"
    )
    .replaceAll(
      "current manual architecture corpus, round270, or prior Belfast packs",
      "current manual architecture corpus, round270, round281, or prior Belfast packs through round281"
    )
    .replace("const TARGET_CANDIDATES = 120;", "const TARGET_CANDIDATES = 100;");

  const includesRound270 =
    "includes_round270: index.files.some((entry) => /round270_belfast_official_planning_tail\\/candidates\\.json$/i.test(entry.path))";
  transformed = transformed.replace(
    includesRound270,
    `${includesRound270},
      includes_round281: index.files.some((entry) => /round281_belfast_official_planning_tail2\\/candidates\\.json$/i.test(entry.path))`
  );

  transformed = transformed.replaceAll(
    "prior-Belfast-pack dedupe",
    "prior-Belfast-pack dedupe through round281"
  );

  return transformed;
}

function main() {
  const source = fs.readFileSync(BASE_SCRIPT, "utf8");
  const script = buildRound286Script(source);
  const context = {
    require,
    console,
    process,
    Buffer,
    fetch,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    __dirname,
    __filename
  };
  vm.runInNewContext(script, context, {
    filename: __filename,
    displayErrors: true
  });
}

main();
