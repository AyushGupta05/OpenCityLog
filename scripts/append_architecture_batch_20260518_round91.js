const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";
const sourceId = "nyc-architecture-public-pages";

const selectedIds = new Set([
  "nyc_arch_ruth_bader_ginsburg_hospital_opening_2023",
  "nyc_arch_mount_sinai_hess_center_opening_2012",
  "nyc_arch_msk_josie_robertson_surgery_center_opening_2015",
  "nyc_arch_columbia_northwest_corner_building_opening_2010",
  "nyc_arch_columbia_school_of_nursing_building_opening_2017",
  "nyc_arch_columbia_campbell_sports_center_opening_2013",
  "nyc_arch_nypl_rose_main_reading_room_reopening_2016",
  "nyc_arch_queens_childrens_library_discovery_center_opening_2011",
  "nyc_arch_wnyc_transmitter_park_opening_2012",
  "nyc_arch_schomburg_art_artifacts_reopening_2019"
]);

const dateById = {
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "2017-08",
  nyc_arch_columbia_campbell_sports_center_opening_2013: "2013-03",
  nyc_arch_queens_childrens_library_discovery_center_opening_2011: "2011",
  nyc_arch_wnyc_transmitter_park_opening_2012: "2012",
  nyc_arch_schomburg_art_artifacts_reopening_2019: "2019-03"
};

const areaById = {
  nyc_arch_ruth_bader_ginsburg_hospital_opening_2023: "South Brooklyn Health / Coney Island",
  nyc_arch_mount_sinai_hess_center_opening_2012: "East Harlem / Mount Sinai campus",
  nyc_arch_msk_josie_robertson_surgery_center_opening_2015: "Upper East Side / York Avenue",
  nyc_arch_columbia_northwest_corner_building_opening_2010: "Morningside Heights / Columbia University",
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "Washington Heights / Columbia University Irving Medical Center",
  nyc_arch_columbia_campbell_sports_center_opening_2013: "Inwood / Baker Athletics Complex",
  nyc_arch_nypl_rose_main_reading_room_reopening_2016: "Bryant Park / Stephen A. Schwarzman Building",
  nyc_arch_queens_childrens_library_discovery_center_opening_2011: "Jamaica / Queens Central Library",
  nyc_arch_wnyc_transmitter_park_opening_2012: "Greenpoint waterfront",
  nyc_arch_schomburg_art_artifacts_reopening_2019: "Harlem / Schomburg Center"
};

const summaryById = {
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "Columbia University Irving Medical Center Facilities records that the seven-story School of Nursing building officially opened in August 2017, with clinical teaching, research, and student spaces."
};

const observedChangeById = {
  nyc_arch_ruth_bader_ginsburg_hospital_opening_2023: "An 11-story hospital tower opened for patient care at South Brooklyn Health.",
  nyc_arch_mount_sinai_hess_center_opening_2012: "A medical research and clinical building entered use on Mount Sinai's East Harlem campus.",
  nyc_arch_msk_josie_robertson_surgery_center_opening_2015: "A freestanding outpatient cancer surgery facility entered use on Manhattan's Upper East Side.",
  nyc_arch_columbia_northwest_corner_building_opening_2010: "A science building entered use for faculty, labs, library, cafe, and campus circulation at Columbia's Morningside campus.",
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "A medical education building entered use at Columbia's Washington Heights medical campus.",
  nyc_arch_columbia_campbell_sports_center_opening_2013: "An athletics and student-support building entered use at Baker Athletics Complex.",
  nyc_arch_nypl_rose_main_reading_room_reopening_2016: "Two restored public reading and catalog rooms reopened inside the Stephen A. Schwarzman Building.",
  nyc_arch_queens_childrens_library_discovery_center_opening_2011: "A children's library discovery facility opened at Queens Central Library.",
  nyc_arch_wnyc_transmitter_park_opening_2012: "A waterfront public park opened in Greenpoint on the former WNYC transmission site.",
  nyc_arch_schomburg_art_artifacts_reopening_2019: "A renovated library division reopened and returned its collection to the Schomburg Center."
};

const sourceDateFieldById = {
  nyc_arch_ruth_bader_ginsburg_hospital_opening_2023: "press release date and text state hospital opened for care on 7 May 2023",
  nyc_arch_mount_sinai_hess_center_opening_2012: "press release date and title state Hess Center opened on 13 December 2012",
  nyc_arch_msk_josie_robertson_surgery_center_opening_2015: "press release date and text describe the facility as opened on 28 December 2015",
  nyc_arch_columbia_northwest_corner_building_opening_2010: "project news page date records science faculty being welcomed on 29 November 2010",
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "capital-project page states official opening in August 2017",
  nyc_arch_columbia_campbell_sports_center_opening_2013: "institutional magazine article states opening in spring 2013",
  nyc_arch_nypl_rose_main_reading_room_reopening_2016: "library press release date states reopening on 5 October 2016",
  nyc_arch_queens_childrens_library_discovery_center_opening_2011: "board packet states the facility opened to the public in 2011",
  nyc_arch_wnyc_transmitter_park_opening_2012: "environmental assessment states park opened to the public in 2012",
  nyc_arch_schomburg_art_artifacts_reopening_2019: "library timeline states the division reopened in spring 2019"
};

const projectTypeById = {
  nyc_arch_ruth_bader_ginsburg_hospital_opening_2023: "hospital tower opening",
  nyc_arch_mount_sinai_hess_center_opening_2012: "medical research and clinical building",
  nyc_arch_msk_josie_robertson_surgery_center_opening_2015: "outpatient surgery centre",
  nyc_arch_columbia_northwest_corner_building_opening_2010: "university science building",
  nyc_arch_columbia_school_of_nursing_building_opening_2017: "medical education building",
  nyc_arch_columbia_campbell_sports_center_opening_2013: "university athletics building",
  nyc_arch_nypl_rose_main_reading_room_reopening_2016: "library room restoration and reopening",
  nyc_arch_queens_childrens_library_discovery_center_opening_2011: "children's library and discovery centre",
  nyc_arch_wnyc_transmitter_park_opening_2012: "waterfront park opening",
  nyc_arch_schomburg_art_artifacts_reopening_2019: "library division renovation and reopening"
};

const normalizeDate = (value) => {
  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  return value;
};

const effectiveDate = (candidate) => {
  if (dateById[candidate.proposed_event_id]) {
    return dateById[candidate.proposed_event_id];
  }
  return candidate.effective_date;
};

const candidateRows = JSON.parse(fs.readFileSync("tmp/subagents/nyc_arch_candidates_round90.json", "utf8"));
const records = candidateRows
  .filter((candidate) => selectedIds.has(candidate.proposed_event_id))
  .map((candidate) => {
    const coordinates = candidate.geometry && candidate.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error(`Missing point geometry for ${candidate.proposed_event_id}`);
    }
    const [longitude, latitude] = coordinates;
    const eventId = candidate.proposed_event_id;
    const area = areaById[eventId];
    return {
      city_id: "nyc",
      event_id: eventId,
      date: effectiveDate(candidate),
      bucket: `planning/development/architecture/${candidate.category}`,
      title: candidate.title,
      summary: summaryById[eventId] || candidate.summary,
      observed_change: observedChangeById[eventId],
      area,
      latitude,
      longitude,
      source_ids: [sourceId],
      source_name: candidate.source_name,
      publisher: candidate.publisher,
      source_url: candidate.source_url,
      source_record_id: candidate.source_record_id,
      source_type: candidate.source_type,
      source_retrieved_at: retrievedAt,
      source_date_field: sourceDateFieldById[eventId],
      source_dataset_id: sourceId,
      confidence: candidate.confidence,
      architect: `${candidate.attribution || candidate.publisher} project team`,
      project_type: projectTypeById[eventId],
      geometry_source: `Curated project point from candidate geometry for ${area}.`,
      geometry_precision: "Approximate project point, not a measured footprint or parcel boundary.",
      license_or_terms_note: candidate.license,
      attribution: candidate.attribution,
      limitations: candidate.limitations,
      transformation_method: candidate.transformation_method
    };
  });

if (records.length !== selectedIds.size) {
  const found = new Set(records.map((event) => event.event_id));
  const missing = [...selectedIds].filter((id) => !found.has(id));
  throw new Error(`Expected ${selectedIds.size} selected records, found ${records.length}. Missing: ${missing.join(", ")}`);
}

const requiredFields = [
  "city_id",
  "event_id",
  "date",
  "bucket",
  "title",
  "summary",
  "observed_change",
  "latitude",
  "longitude",
  "source_ids",
  "source_url",
  "source_record_id",
  "source_retrieved_at",
  "source_date_field",
  "confidence",
  "limitations"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
}

const outputText = JSON.stringify(records);
const banned = /\b(predict|prediction|simulate|simulation|forecast|caused|causal|impact score|will increase|will decrease)\b/i;
if (banned.test(outputText)) {
  throw new Error("Output records contain overclaim or simulator wording");
}

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
const futureRecords = records.filter((event) => new Date(`${normalizeDate(event.date)}T00:00:00Z`) > latestAllowedDate);
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
