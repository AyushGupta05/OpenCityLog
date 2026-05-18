const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";
const sourceId = "london-architecture-public-pages";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_gosh_mittal_premier_inn_clinical_building_opening_2018",
    date: "2018-01-17",
    bucket: "planning/development/architecture/children's hospital",
    title: "GOSH Mittal Children's Medical Centre was officially opened",
    summary:
      "Great Ormond Street Hospital records the official opening of the Mittal Children's Medical Centre, including the new Premier Inn Clinical Building, on 17 January 2018.",
    observed_change:
      "A documented hospital press release marked the opening of a children's medical centre and clinical building with modern ward accommodation.",
    area: "Great Ormond Street / Bloomsbury",
    latitude: 51.5223,
    longitude: -0.1193,
    source_ids: [sourceId],
    source_name: "GOSH press release: official opening of the Mittal Children's Medical Centre",
    publisher: "Great Ormond Street Hospital",
    source_url:
      "https://www.gosh.nhs.uk/press-releases/hrh-duchess-cambridge-visits-patients-and-staff-great-ormond-street-hospital-official-opening-mittal/",
    source_record_id: "gosh-mittal-premier-inn-clinical-building-opening-2018-01-17",
    source_type: "NHS hospital press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "press release date and official-opening wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "GOSH page does not name the architect on the cited page",
    project_type: "children's hospital clinical building opening",
    geometry_source: "Approximate point for Great Ormond Street Hospital.",
    geometry_precision: "hospital/site approximate",
    license_or_terms_note: "Hospital website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records official opening only. It does not confirm all ward move-in dates, clinical capacity changes, patient outcomes, or later hospital redevelopment phases."
  },
  {
    city_id: "london",
    event_id: "lon_arch_croydon_university_hospital_emergency_department_opening_2019",
    date: "2019-05-20",
    bucket: "planning/development/architecture/emergency healthcare",
    title: "Croydon University Hospital emergency department was officially opened",
    summary:
      "Croydon Health Services records the official opening of Croydon University Hospital's new emergency department in May 2019 after first patient use in December 2018.",
    observed_change:
      "A documented NHS trust news record marked official opening of a newly built emergency department.",
    area: "Croydon University Hospital / Thornton Heath",
    latitude: 51.3895,
    longitude: -0.1086,
    source_ids: [sourceId],
    source_name: "Croydon Health Services: official launch of new Emergency Department",
    publisher: "Croydon Health Services NHS Trust",
    source_url:
      "https://www.croydonhealthservices.nhs.uk/trust-news/government-health-secretary-officially-launches-croydons-new-emergency-department-unveiling-a-plaque-remembering-beloved-nurses-1321/",
    source_record_id: "croydon-university-hospital-emergency-department-opening-2019-05-20",
    source_type: "NHS trust news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "trust news body states official opening on 20 May 2019",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Croydon Health Services page does not name the architect on the cited page",
    project_type: "hospital emergency department opening",
    geometry_source: "Approximate point for Croydon University Hospital.",
    geometry_precision: "hospital/site approximate",
    license_or_terms_note: "NHS trust website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records official opening. The source also notes first patient use in December 2018; detailed construction phasing, clinical performance, and staffing are outside this record."
  },
  {
    city_id: "london",
    event_id: "lon_arch_royal_brompton_diagnostic_centre_opening_2022",
    date: "2022-05-12",
    bucket: "planning/development/architecture/diagnostic healthcare",
    title: "Royal Brompton Diagnostic Centre was officially opened",
    summary:
      "Guy's and St Thomas' NHS Foundation Trust records the Princess Royal officially opening the Royal Brompton Diagnostic Centre in May 2022.",
    observed_change:
      "A documented NHS trust news record marked official opening of a heart and lung diagnostic centre with imaging and diagnostic services.",
    area: "Royal Brompton Hospital / Chelsea",
    latitude: 51.4898,
    longitude: -0.1706,
    source_ids: [sourceId],
    source_name: "The Princess Royal opens new Diagnostic Centre at Royal Brompton",
    publisher: "Guy's and St Thomas' NHS Foundation Trust",
    source_url: "https://www.guysandstthomas.nhs.uk/news/princess-royal-opens-new-diagnostic-centre-royal-brompton",
    source_record_id: "royal-brompton-diagnostic-centre-opening-2022-05-12",
    source_type: "NHS trust news page",
    source_retrieved_at: retrievedAt,
    source_date_field: "trust news page records official opening on 12 May 2022",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Guy's and St Thomas' page does not name the architect on the cited page",
    project_type: "hospital diagnostic centre opening",
    geometry_source: "Approximate point for Royal Brompton Hospital.",
    geometry_precision: "hospital/site approximate",
    license_or_terms_note: "NHS trust website terms not reviewed; store factual metadata and cite URL only.",
    limitations:
      "The event records official opening only. It does not confirm all service start dates, diagnostic throughput, patient outcomes, or later equipment changes."
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
  if (source.source_id === sourceId) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
