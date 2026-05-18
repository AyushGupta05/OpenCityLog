const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const corrections = new Map([
  [
    "bfs_arch_cremated_remains_burial_plots_stage2_2025",
    {
      event_id: "bfs_arch_cremated_remains_burial_plots_stage3_committed_2025",
      title: "Cremated Remains Burial Plots moved to Stage 3",
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Cremated Remains Burial Plots be moved to Stage 3 - Committed and held at Tier 0 - Scheme at Risk pending further development and a satisfactory tender return.",
      observed_change:
        "A documented capital-programme milestone was recorded for cremated-remains burial-plot infrastructure at Roselawn Cemetery.",
      area: "Roselawn Cemetery",
      latitude: 54.5278,
      longitude: -5.8153,
      source_record_id: "bcc-spr-2025-09-19-cremated-remains-burial-plots-stage-3",
      project_type: "cemetery infrastructure capital-programme milestone",
      geometry_source: "Approximate point geocoded from Roselawn Cemetery, the site named in the committee report.",
      geometry_precision: "site",
      limitations:
        "The event records Stage 3 programme status only. It does not confirm final design, tender result, contract award, construction start, completion, or plot availability."
    }
  ],
  [
    "bfs_arch_zoo_improvement_works_phase2_stage2_2025",
    {
      event_id: "bfs_arch_zoo_improvement_works_phase2_stage3_committed_2025",
      title: "Belfast Zoo Improvement Works Phase 2 moved to Stage 3",
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Belfast Zoo Improvement Works Phase 2 be moved to Stage 3 - Committed with a maximum allocation of GBP 950,000.",
      observed_change:
        "A documented capital-programme milestone was recorded for Phase 2 improvement works at Belfast Zoo.",
      source_record_id: "bcc-spr-2025-09-19-zoo-improvement-works-phase-2-stage-3",
      project_type: "zoo estate improvement capital-programme milestone",
      limitations:
        "The event records Stage 3 programme status and maximum allocation only. It does not confirm detailed scope, planning approval, procurement, construction start, completion, animal-facility changes, or visitor impacts."
    }
  ],
  [
    "bfs_arch_greening_growing_project_stage1_2025",
    {
      event_id: "bfs_arch_greening_growing_project_stage2_uncommitted_2025",
      title: "Greening and Growing Project moved to Stage 2",
      summary:
        "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that the Greening and Growing Project be moved to Stage 2 - Uncommitted with GBP 30,000 allocated to develop an outline business case.",
      observed_change:
        "A documented capital-programme milestone was recorded for the Greening and Growing Project at the GROW community garden beside the Waterworks.",
      area: "GROW community garden / Waterworks",
      latitude: 54.6154,
      longitude: -5.9399,
      source_record_id: "bcc-spr-2025-09-19-greening-growing-project-stage-2",
      project_type: "urban greening outline-business-case milestone",
      geometry_source: "Approximate point placed at the Waterworks/GROW garden area named in the committee report.",
      geometry_precision: "site",
      limitations:
        "The event records Stage 2 programme status only. It does not confirm final sites, planting designs, delivery funding, procurement, implementation, maintenance, or ecological outcomes."
    }
  ]
]);

const seen = new Set(doc.events.map((event) => event.event_id));
for (const oldId of corrections.keys()) {
  seen.delete(oldId);
}

let updated = 0;
doc.events = doc.events.map((event) => {
  const correction = corrections.get(event.event_id);
  if (!correction) {
    return event;
  }
  if (seen.has(correction.event_id)) {
    throw new Error(`Corrected event_id would duplicate existing event: ${correction.event_id}`);
  }
  updated += 1;
  seen.add(correction.event_id);
  return {
    ...event,
    ...correction
  };
});

if (updated !== corrections.size) {
  throw new Error(`Expected ${corrections.size} corrections, updated ${updated}`);
}

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Corrected ${updated} Belfast round 26 record(s) in ${path}`);
