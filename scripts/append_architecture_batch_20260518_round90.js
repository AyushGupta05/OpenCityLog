const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round90.json",
  "tmp/subagents/belfast_arch_candidates_round90.json"
];

const selectedIds = new Set([
  "lon_arch_lyric_hammersmith_reuben_foundation_wing_opening_2015",
  "lon_arch_plumstead_centre_opening_2020",
  "lon_arch_maggies_royal_marsden_opening_2019",
  "lon_arch_brunel_eastern_gateway_building_completion_2012",
  "lon_arch_roehampton_university_library_opening_2017",
  "lon_arch_uwl_paul_hamlyn_library_opening_2015",
  "lon_arch_nhm_darwin_centre_public_opening_2009",
  "lon_arch_mulberry_utc_new_building_opening_2017",
  "lon_arch_world_heart_beat_embassy_gardens_opening_2022",
  "lon_arch_the_nest_thamesmead_opening_2023",
  "lon_arch_sidcup_storyteller_library_opening_2022",
  "lon_arch_london_design_engineering_utc_permanent_building_2019",
  "lon_arch_ada_broad_lane_campus_opening_2016",
  "lon_arch_harris_academy_sutton_building_opening_2019",
  "lon_arch_goldsmiths_caroline_graveson_computing_hub_opening_2026",
  "bfs_arch_ravenhill_reach_resource_centre_opening_2016"
]);

const cityIdsByName = {
  London: "london",
  Belfast: "belfast"
};

const sourceIdsByCity = {
  london: "london-architecture-public-pages",
  belfast: "belfast-architecture-public-pages"
};

const areaById = {
  lon_arch_lyric_hammersmith_reuben_foundation_wing_opening_2015: "Lyric Square / Hammersmith",
  lon_arch_plumstead_centre_opening_2020: "Plumstead High Street / Plumstead Centre",
  lon_arch_maggies_royal_marsden_opening_2019: "The Royal Marsden Hospital / Sutton",
  lon_arch_brunel_eastern_gateway_building_completion_2012: "Brunel University London / Uxbridge campus",
  lon_arch_roehampton_university_library_opening_2017: "University of Roehampton campus",
  lon_arch_uwl_paul_hamlyn_library_opening_2015: "St Mary's Road / Ealing",
  lon_arch_nhm_darwin_centre_public_opening_2009: "Natural History Museum / South Kensington",
  lon_arch_mulberry_utc_new_building_opening_2017: "Roman Road and Parnell Road / Bow",
  lon_arch_world_heart_beat_embassy_gardens_opening_2022: "Embassy Gardens / Nine Elms",
  lon_arch_the_nest_thamesmead_opening_2023: "Cygnet Square / South Thamesmead",
  lon_arch_sidcup_storyteller_library_opening_2022: "Sidcup High Street",
  lon_arch_london_design_engineering_utc_permanent_building_2019: "Royal Docks / Newham",
  lon_arch_ada_broad_lane_campus_opening_2016: "Broad Lane / Tottenham Hale",
  lon_arch_harris_academy_sutton_building_opening_2019: "Belmont / London Cancer Hub",
  lon_arch_goldsmiths_caroline_graveson_computing_hub_opening_2026: "Goldsmiths New Cross campus / Caroline Graveson Building",
  bfs_arch_ravenhill_reach_resource_centre_opening_2016: "Ravenhill Reach / South Belfast"
};

const observedChangeById = {
  lon_arch_lyric_hammersmith_reuben_foundation_wing_opening_2015: "A theatre building re-entered use with a new west-side extension and refurbished foyer spaces.",
  lon_arch_plumstead_centre_opening_2020: "A listed library building re-entered community use with library, leisure, community, and cafe facilities.",
  lon_arch_maggies_royal_marsden_opening_2019: "A cancer-support centre entered use on The Royal Marsden Hospital's Sutton campus.",
  lon_arch_brunel_eastern_gateway_building_completion_2012: "A university campus building reached documented completion at Brunel's Uxbridge campus.",
  lon_arch_roehampton_university_library_opening_2017: "A university library building entered use on the Roehampton campus.",
  lon_arch_uwl_paul_hamlyn_library_opening_2015: "A university library entered use at the St Mary's Road campus for the 2015-16 academic year.",
  lon_arch_nhm_darwin_centre_public_opening_2009: "A museum research and collections facility opened to public access at South Kensington.",
  lon_arch_mulberry_utc_new_building_opening_2017: "A technical education school entered use in a new Bow building.",
  lon_arch_world_heart_beat_embassy_gardens_opening_2022: "A community concert hall and music education venue entered use at Embassy Gardens.",
  lon_arch_the_nest_thamesmead_opening_2023: "A community building and library entered public and community use at Cygnet Square.",
  lon_arch_sidcup_storyteller_library_opening_2022: "A library and cafe opened in the Sidcup Storyteller mixed-use building.",
  lon_arch_london_design_engineering_utc_permanent_building_2019: "A technical college moved into its permanent Royal Docks building.",
  lon_arch_ada_broad_lane_campus_opening_2016: "A converted Broad Lane building entered official use as Ada's first London college campus.",
  lon_arch_harris_academy_sutton_building_opening_2019: "A secondary school building was officially opened after pupil use had begun.",
  lon_arch_goldsmiths_caroline_graveson_computing_hub_opening_2026: "A refurbished computing hub opened inside Goldsmiths' Caroline Graveson Building.",
  bfs_arch_ravenhill_reach_resource_centre_opening_2016: "A redeveloped regional resource centre opened as a disability-services hub in South Belfast."
};

const sourceDateFieldById = {
  lon_arch_lyric_hammersmith_reuben_foundation_wing_opening_2015: "source page states building reopened in April 2015",
  lon_arch_plumstead_centre_opening_2020: "council page states The Plumstead Centre opened in 2020",
  lon_arch_maggies_royal_marsden_opening_2019: "architecture page states centre opened in 2019",
  lon_arch_brunel_eastern_gateway_building_completion_2012: "university timeline states Eastern Gateway Building completed in 2012",
  lon_arch_roehampton_university_library_opening_2017: "library page states the building opened in September 2017",
  lon_arch_uwl_paul_hamlyn_library_opening_2015: "annual report states the library opened for the 2015-16 academic year",
  lon_arch_nhm_darwin_centre_public_opening_2009: "museum history page states Darwin Centre opened to the public in 2009",
  lon_arch_mulberry_utc_new_building_opening_2017: "school page states opening in a new building in September 2017",
  lon_arch_world_heart_beat_embassy_gardens_opening_2022: "council news page published on opening date and states mayor opened the venue",
  lon_arch_the_nest_thamesmead_opening_2023: "news page states grand opening took place on 12 April 2023",
  lon_arch_sidcup_storyteller_library_opening_2022: "library page states Sidcup Storyteller opened on 16 December 2022",
  lon_arch_london_design_engineering_utc_permanent_building_2019: "mayoral decision states UTC moved into permanent location in January 2019",
  lon_arch_ada_broad_lane_campus_opening_2016: "institutional history page states official opening in September 2016",
  lon_arch_harris_academy_sutton_building_opening_2019: "council page publication and text state official opening on 8 October 2019",
  lon_arch_goldsmiths_caroline_graveson_computing_hub_opening_2026: "university news page states official opening on 25 February 2026",
  bfs_arch_ravenhill_reach_resource_centre_opening_2016: "government news release states official opening on 27 January 2016"
};

const projectTypeById = {
  lon_arch_lyric_hammersmith_reuben_foundation_wing_opening_2015: "theatre extension and foyer refurbishment",
  lon_arch_plumstead_centre_opening_2020: "community, library, and leisure centre reuse",
  lon_arch_maggies_royal_marsden_opening_2019: "healthcare support centre",
  lon_arch_brunel_eastern_gateway_building_completion_2012: "university campus building",
  lon_arch_roehampton_university_library_opening_2017: "university library",
  lon_arch_uwl_paul_hamlyn_library_opening_2015: "university library",
  lon_arch_nhm_darwin_centre_public_opening_2009: "museum research and collections facility",
  lon_arch_mulberry_utc_new_building_opening_2017: "technical education building",
  lon_arch_world_heart_beat_embassy_gardens_opening_2022: "community concert hall and music education venue",
  lon_arch_the_nest_thamesmead_opening_2023: "community building and library",
  lon_arch_sidcup_storyteller_library_opening_2022: "library and cafe in mixed-use building",
  lon_arch_london_design_engineering_utc_permanent_building_2019: "technical education campus",
  lon_arch_ada_broad_lane_campus_opening_2016: "further education campus conversion",
  lon_arch_harris_academy_sutton_building_opening_2019: "secondary school building",
  lon_arch_goldsmiths_caroline_graveson_computing_hub_opening_2026: "university computing hub refurbishment",
  bfs_arch_ravenhill_reach_resource_centre_opening_2016: "health and community resource centre"
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

const candidateRows = candidateFiles.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const records = candidateRows
  .filter((candidate) => selectedIds.has(candidate.proposed_event_id))
  .map((candidate) => {
    const cityId = cityIdsByName[candidate.city];
    if (!cityId) {
      throw new Error(`No city_id mapping for ${candidate.city}`);
    }
    const sourceId = sourceIdsByCity[cityId];
    const coordinates = candidate.geometry && candidate.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error(`Missing point geometry for ${candidate.proposed_event_id}`);
    }
    const [longitude, latitude] = coordinates;
    const eventId = candidate.proposed_event_id;
    const area = areaById[eventId];
    return {
      city_id: cityId,
      event_id: eventId,
      date: candidate.effective_date,
      bucket: candidate.category,
      title: candidate.title,
      summary: candidate.summary,
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
  if (Object.values(sourceIdsByCity).includes(source.source_id)) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
