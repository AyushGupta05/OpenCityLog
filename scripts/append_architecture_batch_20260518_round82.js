const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_kings_quad_building_official_opening_2025",
    date: "2025-03-06",
    bucket: "planning/development/architecture/higher education",
    title: "King's College London Quad building was officially opened",
    summary:
      "King's College London records HRH The Princess Royal officially opening the Quadrangle building on 6 March 2025.",
    observed_change:
      "A documented university news record marked the official opening of a teaching and research building for engineering at the Strand campus.",
    area: "Strand / King's College London",
    latitude: 51.5112,
    longitude: -0.1161,
    source_ids: ["london-architecture-public-pages"],
    source_name: "King's welcomes The Princess Royal for official opening of the Quad",
    publisher: "King's College London",
    source_url: "https://www.kcl.ac.uk/news/kings-welcomes-the-princess-royal-for-official-opening-of-the-quad",
    source_record_id: "kcl-quad-official-opening-2025-03-06",
    source_type: "university news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "King's news page date and official-opening wording",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "King's page does not name the architect on the cited page",
    project_type: "university teaching and research building opening",
    geometry_source: "Approximate point for the King's College London Strand campus Quadrangle.",
    geometry_precision: "campus/building approximate",
    license_or_terms_note: "King's College London website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records official opening only. It does not confirm construction completion date, teaching timetable changes, later fit-out, or research outcomes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kings_maisi_facility_opening_2024",
    date: "2024-02-06",
    bucket: "planning/development/architecture/healthcare research facility",
    title: "King's MAISI healthcare-engineering facility opened",
    summary:
      "King's College London records the opening of the Manufacture of Active Implants and Surgical Instruments facility at St Thomas' Hospital on 6 February 2024.",
    observed_change:
      "A documented university news record marked the opening of a regulated healthcare-engineering manufacturing facility within a hospital setting.",
    area: "St Thomas' Hospital / Lambeth",
    latitude: 51.4985,
    longitude: -0.1181,
    source_ids: ["london-architecture-public-pages"],
    source_name: "King's launches new facility for Manufacture of Active Implants and Surgical Instruments",
    publisher: "King's College London",
    source_url:
      "https://www.kcl.ac.uk/news/kings-launches-new-facility-for-manufacture-of-active-implants-and-surgical-instruments",
    source_record_id: "kcl-maisi-facility-opening-2024-02-06",
    source_type: "university news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "King's news page date and opened wording",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "King's page does not name the architect on the cited page",
    project_type: "healthcare engineering manufacturing facility opening",
    geometry_source: "Approximate point for St Thomas' Hospital, matching the source location context.",
    geometry_precision: "hospital/site approximate",
    license_or_terms_note: "King's College London website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records facility opening only. It does not confirm regulatory approvals, clinical translation results, equipment commissioning details, or measured research output."
  },
  {
    city_id: "london",
    event_id: "lon_arch_guys_campus_informal_learning_space_opening_2026",
    date: "2026-02-12",
    bucket: "planning/development/architecture/higher education learning space",
    title: "Guy's Campus 24/7 informal learning space opened",
    summary:
      "King's College London student news records a new 24/7 informal learning space opening at Guy's Campus on 12 February 2026.",
    observed_change:
      "A documented university student-news record marked the opening of a ground-floor learning space in Addison House.",
    area: "Guy's Campus / London Bridge",
    latitude: 51.5037,
    longitude: -0.0877,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New 24/7 Informal Learning Space now open at Guy's Campus",
    publisher: "King's College London",
    source_url: "https://www.kcl.ac.uk/students/new-247-informal-learning-space-now-open-at-guys-campus",
    source_record_id: "kcl-guys-campus-informal-learning-space-2026-02-12",
    source_type: "university student-news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "King's student-news date and now-open wording",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "King's page does not name the architect on the cited page",
    project_type: "university informal learning space opening",
    geometry_source: "Approximate point for Addison House at Guy's Campus.",
    geometry_precision: "campus/building approximate",
    license_or_terms_note: "King's College London website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records opening of the learning space only. It does not document construction history, room-by-room capacity, student usage, or later operating changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_green_wood_green_house_visitor_center_opening_2026",
    date: "2026-04-16",
    bucket: "planning/development/architecture/cultural visitor center",
    title: "Green-House at Green-Wood visitor center officially opened",
    summary:
      "NYC Department of Cultural Affairs records an April 16, 2026 ribbon-cutting for the Green-House at Green-Wood visitor and education center.",
    observed_change:
      "A documented city cultural-affairs press release marked official opening of a visitor and education center combining a restored greenhouse with a new welcome-center use.",
    area: "Green-Wood Cemetery / Brooklyn",
    latitude: 40.6537,
    longitude: -73.9945,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "DCLA Joins Green-Wood Cemetery Cut the Garland on New Green-House Visitor Center",
    publisher: "NYC Department of Cultural Affairs",
    source_url:
      "https://www.nyc.gov/site/dcla/about/pressrelease/PR-2026-4-16-Department-of-Cultural-Affairs-Joins-Green-Wood-Cemetery-Cut-the-Garland-on-New%20Green-House-Visitor-Center.page",
    source_record_id: "nyc-dcla-green-wood-green-house-opening-2026-04-16",
    source_type: "official city cultural-affairs press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "DCLA release date and officially-open wording",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Architecture Research Office",
    project_type: "cultural visitor and education center opening",
    geometry_source: "Approximate point near Green-Wood Cemetery's main entrance and visitor-center context.",
    geometry_precision: "site/building approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records official opening only. It does not document all restoration phases, public programming, attendance, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_yankee_stadium_bronx_bus_streetscape_groundbreaking_2026",
    date: "2026-03-24",
    bucket: "planning/development/architecture/public realm transport",
    title: "Bronx crosstown bus and street-safety project broke ground near Yankee Stadium",
    summary:
      "The NYC Mayor's Office records a March 24, 2026 groundbreaking for a Bronx crosstown bus service and street-safety project near Yankee Stadium.",
    observed_change:
      "A documented official city release marked construction start for bus-priority and street-safety public-realm works near the stadium area.",
    area: "Yankee Stadium / Concourse, Bronx",
    latitude: 40.8296,
    longitude: -73.9262,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "Ahead of Opening Day, Mamdani Administration Breaks Ground on Project near Yankee Stadium",
    publisher: "NYC Mayor's Office",
    source_url: "https://www.nyc.gov/mayors-office/news/2026/03/ahead-of-opening-day--mamdani-administration-breaks-ground-on-pr",
    source_record_id: "nyc-mayor-bronx-crosstown-bus-streetscape-groundbreaking-2026-03-24",
    source_type: "official mayoral press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral release date and breaks-ground wording",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Not applicable; source describes public-realm and transport works",
    project_type: "street-safety and bus-priority construction start",
    geometry_source: "Approximate point near Yankee Stadium, matching the source corridor context.",
    geometry_precision: "corridor/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records groundbreaking only. It does not confirm completion, final street layout, bus performance, safety outcomes, or later traffic conditions."
  }
];

const batchIds = new Set();
const batchSourceKeys = new Set();
for (const event of records) {
  if (batchIds.has(event.event_id)) {
    throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
  }
  batchIds.add(event.event_id);

  const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
  if (batchSourceKeys.has(sourceKey)) {
    throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
  }
  batchSourceKeys.add(sourceKey);
}

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${event.date}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) {
  throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);
}

const existingSourceKeys = new Set(
  doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`)
);
const duplicateSourceRecords = records
  .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) {
  throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);
}

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (source.source_id === "london-architecture-public-pages" || source.source_id === "nyc-architecture-public-pages") {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
