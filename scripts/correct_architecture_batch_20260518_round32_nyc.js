const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const oldId = "nyc_arch_brownsville_arts_center_apartments_map_adopted_2024";
const newId = "nyc_arch_brownsville_arts_center_apartments_text_adopted_2024";

if (doc.events.some((event) => event.event_id === newId)) {
  throw new Error(`Replacement event_id already exists: ${newId}`);
}

const event = doc.events.find((candidate) => candidate.event_id === oldId);
if (!event) {
  throw new Error(`Could not find event to correct: ${oldId}`);
}

event.event_id = newId;
event.title = "Brownsville Arts Center and Apartments zoning text was adopted";
event.summary =
  "The NYC Zoning Resolution records Brownsville Arts Center and Apartments, N 240031 ZRK, with an adopted date of March 19, 2024.";
event.observed_change =
  "A documented zoning text milestone was recorded for the Brownsville Arts Center and Apartments project area in Brooklyn.";
event.project_type = "site-related zoning text amendment";
event.limitations =
  "The event records zoning text adoption only. It does not confirm permits, construction, cultural-facility delivery, affordable-housing delivery, occupancy, or later site design.";

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Corrected ${oldId} to ${newId}`);
