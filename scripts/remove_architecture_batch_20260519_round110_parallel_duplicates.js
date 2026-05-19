const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const removeIds = new Set([
  "lon_arch_bedfordbury_lamp_post_listing_2024",
  "lon_arch_garrick_rose_street_lamp_post_listing_2024",
  "lon_arch_st_jamess_place_lamp_post_listing_2024",
  "lon_arch_cecil_court_lamp_posts_listing_2024",
  "lon_arch_mornington_place_3_7_listing_2021",
  "lon_arch_101_harley_street_listing_2020",
  "lon_arch_coptic_little_russell_street_listing_2018",
  "lon_arch_bessborough_vauxhall_bridge_roads_listing_2018",
  "lon_arch_mercer_shelton_street_19_21_listing_2016",
  "lon_arch_monmouth_mercer_street_45_51_listing_2016"
]);

const before = doc.events.length;
const removed = [];
doc.events = doc.events.filter((event) => {
  if (!removeIds.has(event.event_id)) return true;
  removed.push(event.event_id);
  return false;
});

const missing = [...removeIds].filter((id) => !removed.includes(id));
if (missing.length > 0) {
  throw new Error(`Round110 duplicate-correction IDs were not present: ${missing.join(", ")}`);
}

const tmpPath = `${path}.round110-correction.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ removed: removed.length, before, after: doc.events.length, counts }, null, 2));
