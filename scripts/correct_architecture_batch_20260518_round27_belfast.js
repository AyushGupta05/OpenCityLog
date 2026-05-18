const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const corrections = new Map([
  [
    "bfs_arch_basketball_courts_stage3_committed_2025",
    {
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Basketball Courts move to Stage 3 - Committed with up to GBP 550,000 allocated for creation or upgrades at Victoria Park, Alderman Tommy Patton Memorial Park, Ormeau Park, Blacks Road Park, and Pairc Nua Chollann.",
      observed_change:
        "A documented capital-programme milestone was recorded for five-site basketball-court works in Belfast parks and open spaces.",
      source_record_id: "bcc-spr-2025-10-24-basketball-courts-stage-3-gbp-550000",
      limitations:
        "The event records Stage 3 programme status and allocation only. It does not confirm final court designs, procurement outcome, works start, completion, use levels, or maintenance arrangements."
    }
  ],
  [
    "bfs_arch_musgrave_park_sensory_garden_stage3_committed_2025",
    {
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Musgrave Park Sensory Garden move to Stage 3 - Committed with up to GBP 100,000 allocated to provide a greater range of equipment and improve play value and accessibility.",
      source_record_id: "bcc-spr-2025-10-24-musgrave-park-sensory-garden-stage-3-gbp-100000",
      limitations:
        "The event records Stage 3 programme status and allocation only. It does not confirm final garden design, procurement outcome, works start, completion, accessibility performance, or maintenance arrangements."
    }
  ],
  [
    "bfs_arch_girdwood_hub_hs_works_stage3_committed_2025",
    {
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Girdwood Hub Health and Safety Works move to Stage 3 - Committed with up to GBP 310,000 allocated.",
      source_record_id: "bcc-spr-2025-10-24-girdwood-hub-hs-works-stage-3-gbp-310000",
      limitations:
        "The event records Stage 3 programme status and allocation only. It does not confirm works package details, legal recourse, procurement outcome, works start, completion, operating changes, or public access changes."
    }
  ]
]);

let updated = 0;
doc.events = doc.events.map((event) => {
  const correction = corrections.get(event.event_id);
  if (!correction) {
    return event;
  }
  updated += 1;
  return {
    ...event,
    ...correction
  };
});

if (updated !== corrections.size) {
  throw new Error(`Expected ${corrections.size} corrections, updated ${updated}`);
}

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Corrected ${updated} Belfast round 27 record(s) in ${path}`);
