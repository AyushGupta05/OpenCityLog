const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_imperial_agilent_measurement_suite_opening_2019",
    date: "2019-03-07",
    bucket: "planning/development/architecture/research facility",
    title: "Imperial Agilent Measurement Suite opened in the Molecular Sciences Research Hub",
    summary:
      "Imperial College London records a March 2019 ribbon-cutting for the Agilent Measurement Suite in the Molecular Sciences Research Hub at White City.",
    observed_change:
      "A documented university news record marked the opening of an advanced analytical-instrument suite within the White City research hub.",
    area: "White City / Imperial College London",
    latitude: 51.5176,
    longitude: -0.2355,
    source_ids: ["london-architecture-public-pages"],
    source_name: "Advanced chemistry made possible with new suite of state-of-the-art instruments",
    publisher: "Imperial College London",
    source_url: "https://www.imperial.ac.uk/news/190474/advanced-chemistry-made-possible-with-suite/",
    source_record_id: "imperial-agilent-measurement-suite-opening-2019-03-07",
    source_type: "university news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "Imperial news page date and has-opened wording",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Imperial page does not name the architect on the cited page",
    project_type: "research instrumentation suite opening",
    geometry_source: "Approximate point for Imperial's Molecular Sciences Research Hub at White City.",
    geometry_precision: "campus/building approximate",
    license_or_terms_note: "Imperial website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records suite opening only. It does not confirm full building completion, equipment commissioning dates, research outputs, or later operational changes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_imperial_dri_care_research_technology_centre_opening_2022",
    date: "2022-05-18",
    bucket: "planning/development/architecture/healthcare research facility",
    title: "UK DRI Care Research and Technology Centre opened at Imperial White City",
    summary:
      "Imperial College London records the official opening of the UK Dementia Research Institute Care Research and Technology Centre at White City on 18 May 2022.",
    observed_change:
      "A documented university news record marked the opening of a dementia-care technology research centre on the White City campus.",
    area: "White City / Imperial College London",
    latitude: 51.5174,
    longitude: -0.2353,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New dementia research centre to pioneer transformative tech for at-home care",
    publisher: "Imperial College London",
    source_url: "https://www.imperial.ac.uk/news/236596/new-dementia-research-centre-pioneer-transformative/",
    source_record_id: "imperial-dri-care-research-technology-centre-opening-2022-05-18",
    source_type: "university news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "Imperial news page date and officially-opened wording",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Imperial page does not name the architect on the cited page",
    project_type: "dementia-care research centre opening",
    geometry_source: "Approximate point for Imperial's White City campus.",
    geometry_precision: "campus/site approximate",
    license_or_terms_note: "Imperial website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records centre opening only. It does not document all laboratory fit-out, clinical trials, care outcomes, or later research programme changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bushwick_covid_center_excellence_opening_2022",
    date: "2022-02-11",
    bucket: "planning/development/architecture/community healthcare",
    title: "Bushwick COVID-19 Center of Excellence opened",
    summary:
      "The NYC Mayor's Office records the opening of a new COVID-19 Center of Excellence in Bushwick, Brooklyn on February 11, 2022.",
    observed_change:
      "A documented mayoral release marked the opening of a community health clinic for COVID recovery and ambulatory services.",
    area: "Bushwick / Brooklyn",
    latitude: 40.6997,
    longitude: -73.9416,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "Mayor Adams, NYC Health + Hospitals/Gotham Health Open new COVID-19 Center of Excellence in Brooklyn",
    publisher: "NYC Mayor's Office",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/071-22/mayor-adams-nyc-health-hospitals-gotham-health-open-new-covid-19-center-excellence-brooklyn",
    source_record_id: "nyc-mayor-bushwick-covid-center-excellence-opening-2022-02-11",
    source_type: "official mayoral press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "mayoral release date and opened wording",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Mayor's Office page does not name the architect on the cited page",
    project_type: "community health clinic opening",
    geometry_source: "Approximate point for the Bushwick/Broadway clinic location described by the source.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records opening only. It does not document clinical outcomes, long-COVID service capacity, staffing, or later operating changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jackson_heights_roosevelt_covid_center_excellence_opening_2021",
    date: "2021-02-24",
    bucket: "planning/development/architecture/community healthcare",
    title: "Gotham Health Roosevelt COVID-19 Center of Excellence opened",
    summary:
      "The NYC Mayor's Office records the opening of the Gotham Health, Roosevelt COVID-19 Center of Excellence in Queens on February 24, 2021.",
    observed_change:
      "A documented mayoral release marked the opening of a community health clinic for COVID recovery in Jackson Heights.",
    area: "Jackson Heights / Queens",
    latitude: 40.7483,
    longitude: -73.8918,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "Recovery for All of Us: de Blasio Administration Opens Gotham Health, Roosevelt COVID-19 Center of Excellence",
    publisher: "NYC Mayor's Office",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/129-21/recovery-all-us-de-blasio-administration-opens-gotham-health-roosevelt-covid-19-center-of",
    source_record_id: "nyc-mayor-roosevelt-covid-center-excellence-opening-2021-02-24",
    source_type: "official mayoral press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "mayoral release date and opens wording",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Mayor's Office page does not name the architect on the cited page",
    project_type: "community health clinic opening",
    geometry_source: "Approximate point for Gotham Health, Roosevelt in Jackson Heights.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records opening only. It does not document clinical outcomes, long-COVID service capacity, staffing, or later operating changes."
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
