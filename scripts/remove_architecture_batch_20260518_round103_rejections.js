const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const rejectedIds = new Set([
  "lon_arch_lesnes_abbey_woods_clearing_opening_2024",
  "nyc_arch_flushing_meadows_aquatics_center_reopening_2023",
  "bfs_arch_lisburn_road_library_refurbishment_completion_2017"
]);

const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const before = doc.events.length;
doc.events = doc.events.filter((event) => !rejectedIds.has(event.event_id));
const removed = before - doc.events.length;

if (removed !== rejectedIds.size) {
  throw new Error(`Expected to remove ${rejectedIds.size} rejected round103 records, removed ${removed}`);
}

doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));

const tmpPath = `${path}.round103-rejections.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ removed, counts, total: doc.events.length }, null, 2));
