const fs = require("fs");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

let changed = 0;
for (const event of doc.events) {
  const isRound116LondonMhclg =
    event.city_id === "london" &&
    event.source_dataset_id === "mhclg-called-in-decisions" &&
    String(event.transformation_method || "").includes("Round116") &&
    Number(String(event.date).slice(0, 4)) < 2020 &&
    Array.isArray(event.source_ids) &&
    event.source_ids.includes("gla-planning-datahub-applications");

  if (!isRound116LondonMhclg) continue;

  event.source_ids = event.source_ids.filter((sourceId) => sourceId !== "gla-planning-datahub-applications");
  event.geometry_source = `${event.geometry_source} Supporting Planning London Datahub rows were used only as approximate site-location context and are not listed as event evidence for this pre-2020 MHCLG decision.`;
  event.transformation_method = `${event.transformation_method} Corrected by scripts/correct_architecture_batch_20260519_round116_london_pre2020_pld_sourceids.js to remove PLD from source_ids for pre-2020 MHCLG events because the dated administrative event source is GOV.UK/MHCLG.`;
  changed += 1;
}

const tmpPath = `${corpusPath}.round116-pld-sourceids.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, corpusPath);

console.log(JSON.stringify({ changed }, null, 2));
