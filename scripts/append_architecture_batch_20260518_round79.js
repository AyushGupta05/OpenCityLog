const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";
const sourceId = "nyc-architecture-public-pages";

const records = [
  {
    city_id: "nyc",
    event_id: "nyc_arch_staten_island_family_justice_center_groundbreaking_2015",
    date: "2015-10-05",
    bucket: "planning/development/architecture/civic support facility",
    title: "Staten Island Family Justice Center groundbreaking was recorded",
    summary:
      "NYC DDC's news archive records an October 5, 2015 groundbreaking for a 10,000-square-foot Family Justice Center at 126 Stuyvesant Place on Staten Island.",
    observed_change:
      "A documented city design-and-construction news record marked the start of work on a civic support facility.",
    area: "Stuyvesant Place / St. George, Staten Island",
    latitude: 40.6426,
    longitude: -74.0766,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: A New Family Justice Center for Staten Island",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ground-staten-island-family-justice-center.page",
    source_record_id: "nyc-ddc-2015-10-05-staten-island-family-justice-center-groundbreaking",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and groundbreaking wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "family justice center construction start",
    geometry_source:
      "Approximate point for 126 Stuyvesant Place from the DDC source address; not a surveyed parcel boundary.",
    geometry_precision: "address/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records groundbreaking only. It does not confirm construction completion, opening, service delivery, later fit-out, or operating outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_queens_botanical_garden_pathways_completion_2015",
    date: "2015-10-01",
    bucket: "planning/development/architecture/public garden accessibility",
    title: "Queens Botanical Garden pathways project completion was celebrated",
    summary:
      "NYC DDC's news archive records an October 1, 2015 ribbon cutting for the Queens Botanical Garden Pathways Repaving Project.",
    observed_change:
      "A documented city design-and-construction news record marked completion of public-garden pathway, access, irrigation, ramp, and site-support works.",
    area: "Flushing / Queens",
    latitude: 40.7517,
    longitude: -73.8263,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Brand New Pathways for Queens Botanical Garden",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ribbon-queens-botanical-pathways.page",
    source_record_id: "nyc-ddc-2015-10-01-queens-botanical-garden-pathways",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and ribbon-cutting/completion wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "public garden pathway and accessibility project completion",
    geometry_source:
      "Approximate point for Queens Botanical Garden near Main Street and College Point Boulevard.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records a ribbon cutting and project completion. It does not document all later garden improvements, visitor use, maintenance, or planting changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_ravenswood_upk_renovation_ribbon_cutting_2015",
    date: "2015-09-18",
    bucket: "planning/development/architecture/early childhood education",
    title: "Ravenswood Universal Pre-Kindergarten renovation ribbon cutting was recorded",
    summary:
      "NYC DDC's news archive records a September 18, 2015 ribbon cutting for a renovated 3,200-square-foot Universal Pre-K space in a Queens Public Library branch at Ravenswood Houses.",
    observed_change:
      "A documented city design-and-construction news record marked completion/opening of renovated early-childhood classrooms and support spaces.",
    area: "Ravenswood Houses / Long Island City, Queens",
    latitude: 40.7596,
    longitude: -73.936,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Ravenswood Universal Pre-Kindergarten",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ribbon-ravenswood-upk.page",
    source_record_id: "nyc-ddc-2015-09-18-ravenswood-upk-ribbon-cutting",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and ribbon-cutting wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "universal pre-kindergarten classroom renovation opening",
    geometry_source:
      "Approximate point for the Ravenswood library/Ravenswood Houses context described by the DDC source.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records a ribbon cutting for renovated classrooms. It does not confirm school-year enrollment, staffing, later program changes, or long-term facility condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_urban_post_disaster_housing_prototype_ribbon_cutting_2014",
    date: "2014-06-10",
    bucket: "planning/development/architecture/emergency housing prototype",
    title: "Urban Post-Disaster Housing Prototype ribbon cutting was recorded",
    summary:
      "NYC DDC's news archive records a June 10, 2014 ribbon cutting for the Urban Post-Disaster Housing Prototype installed adjacent to NYC Emergency Management headquarters in Brooklyn.",
    observed_change:
      "A documented city design-and-construction news record marked public debut of a three-story interim housing prototype.",
    area: "Cadman Plaza / Downtown Brooklyn",
    latitude: 40.6997,
    longitude: -73.9907,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Urban Post-Disaster Housing Prototype",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ribbon-urban-housing-prototype.page",
    source_record_id: "nyc-ddc-2014-06-10-urban-post-disaster-housing-prototype",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and ribbon-cutting/debut wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name a separate architect on the cited page",
    project_type: "interim post-disaster housing prototype public debut",
    geometry_source:
      "Approximate point near NYC Emergency Management headquarters in Downtown Brooklyn, matching the source location context.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records prototype debut only. It does not document permanent housing delivery, disaster deployment, later evaluation results, or policy adoption."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_ocean_breeze_riding_facility_groundbreaking_2014",
    date: "2014-05-30",
    bucket: "planning/development/architecture/recreation facility",
    title: "Ocean Breeze Riding Facility groundbreaking was recorded",
    summary:
      "NYC DDC's news archive records a May 30, 2014 groundbreaking for the Ocean Breeze Riding Facility in Staten Island.",
    observed_change:
      "A documented city design-and-construction news record marked the start of construction for an accessible therapeutic riding facility.",
    area: "Ocean Breeze Park / Staten Island",
    latitude: 40.582,
    longitude: -74.074,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Ocean Breeze Riding Facility",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ground-ocean-breeze-riding-facility.page",
    source_record_id: "nyc-ddc-2014-05-30-ocean-breeze-riding-facility-groundbreaking",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and groundbreaking wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page states the facility was designed in-house by Parks and DDC architecture teams",
    project_type: "accessible therapeutic riding facility construction start",
    geometry_source:
      "Approximate point within Ocean Breeze Park near the riding-facility and track context described by DDC.",
    geometry_precision: "park/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records groundbreaking only. It does not confirm construction completion, opening, therapeutic-program operations, or later facility condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_rikers_island_admissions_facility_groundbreaking_2013",
    date: "2013-12-18",
    bucket: "planning/development/architecture/civic justice facility",
    title: "Rikers Island admissions facility groundbreaking was recorded",
    summary:
      "NYC DDC's news archive records a December 18, 2013 groundbreaking for a new Rikers Island admissions facility.",
    observed_change:
      "A documented city design-and-construction news record marked construction start for a major civic justice intake facility.",
    area: "Rikers Island",
    latitude: 40.791,
    longitude: -73.884,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Rikers Island Admissions Facility",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ground-rikers-admissions.page",
    source_record_id: "nyc-ddc-2013-12-18-rikers-island-admissions-facility",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and groundbreaking wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "1100 Architects and Ricci Greene Associates",
    project_type: "civic justice admissions facility construction start",
    geometry_source: "Approximate point on Rikers Island; source does not provide a parcel or building footprint.",
    geometry_precision: "island/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records groundbreaking only. It does not confirm project completion, operation, later scope changes, policy changes, or facility population outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_irish_repertory_theatre_renovation_groundbreaking_2014",
    date: "2014-09-05",
    bucket: "planning/development/architecture/theatre renovation",
    title: "Irish Repertory Theatre renovation groundbreaking was recorded",
    summary:
      "NYC DDC's news archive records a September 5, 2014 groundbreaking for a renovation of Irish Repertory Theatre.",
    observed_change:
      "A documented city design-and-construction news record marked the start of a theatre renovation and accessibility upgrade.",
    area: "Chelsea / Manhattan",
    latitude: 40.7424,
    longitude: -73.995,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Irish Repertory Theatre",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ground-irish-repertory.page",
    source_record_id: "nyc-ddc-2014-09-05-irish-repertory-theatre-renovation",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and groundbreaking wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Garrison Architects",
    project_type: "theatre renovation construction start",
    geometry_source: "Approximate point for Irish Repertory Theatre at 132 West 22nd Street.",
    geometry_precision: "address/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records renovation groundbreaking only. It does not confirm final reopening date, LEED certification, later programming, or theatre operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_art_new_york_theatres_opening_2017",
    date: "2017-01-18",
    bucket: "planning/development/architecture/theatre opening",
    title: "A.R.T./New York Theatres opening was recorded",
    summary:
      "NYC DDC recorded the official opening of two new A.R.T./New York performance spaces in the lower levels of 502 West 53rd Street in January 2017.",
    observed_change:
      "A documented city design-and-construction press release marked the opening of two flexible theatre spaces and support facilities.",
    area: "Hell's Kitchen / Manhattan",
    latitude: 40.7663,
    longitude: -73.99,
    source_ids: [sourceId],
    source_name: "NYC DDC press release: DDC Celebrates Two New Theaters With A.R.T./New York",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/press-releases/2017/pr-011817-art-theater-rc.page",
    source_record_id: "nyc-ddc-2017-01-18-art-new-york-theatres-opening",
    source_type: "official city design-and-construction press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC press-release slug/date and official-opening wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "two-theatre cultural facility opening",
    geometry_source: "Approximate point for 502 West 53rd Street, matching the source address.",
    geometry_precision: "address/site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records official opening only. It does not document construction start, later programming, tenant use, or long-term operating status."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_womens_plaza_queens_borough_hall_rededication_2017",
    date: "2017-08-22",
    bucket: "planning/development/architecture/civic plaza",
    title: "Women's Plaza at Queens Borough Hall was rededicated",
    summary:
      "NYC DDC recorded the August 22, 2017 dedication of the renovated plaza and fountain at Queens Borough Hall as Women's Plaza.",
    observed_change:
      "A documented city design-and-construction press release recorded a civic plaza renovation and rededication milestone.",
    area: "Kew Gardens / Queens",
    latitude: 40.7135,
    longitude: -73.828,
    source_ids: [sourceId],
    source_name: "NYC DDC press release: Plaza at Queens Borough Hall Rededicated as Women's Plaza",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/press-releases/2017/pr-082217-womens-plaza.page",
    source_record_id: "nyc-ddc-2017-08-22-womens-plaza-rededication",
    source_type: "official city design-and-construction press release",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC press-release date and dedication wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "civic plaza renovation and rededication",
    geometry_source: "Approximate point for Queens Borough Hall plaza at Union Turnpike and Queens Boulevard.",
    geometry_precision: "site approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records plaza dedication after renovation. It does not provide full construction phasing, maintenance history, or later public-realm changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_belle_harbor_sandy_rehabilitation_groundbreaking_2015",
    date: "2015-08-17",
    bucket: "planning/development/architecture/coastal resilience public realm",
    title: "Belle Harbor Sandy rehabilitation groundbreaking was recorded",
    summary:
      "NYC DDC's news archive records an August 17, 2015 groundbreaking for a FEMA-funded Belle Harbor rehabilitation project covering roadways, sidewalks, sewers, and water mains.",
    observed_change:
      "A documented city design-and-construction news record marked construction start for coastal-neighborhood public-realm and infrastructure rehabilitation.",
    area: "Belle Harbor / Rockaway Peninsula, Queens",
    latitude: 40.576,
    longitude: -73.849,
    source_ids: [sourceId],
    source_name: "NYC DDC news archive: Belle Harbor",
    publisher: "New York City Department of Design and Construction",
    source_url: "https://www.nyc.gov/site/ddc/about/news-archive/news-ground-belle-harbor.page",
    source_record_id: "nyc-ddc-2015-08-17-belle-harbor-rehabilitation-groundbreaking",
    source_type: "official city design-and-construction news archive",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC news archive date and groundbreaking wording",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "DDC page does not name the architect on the cited page",
    project_type: "coastal-neighborhood public-realm and infrastructure rehabilitation construction start",
    geometry_source: "Approximate neighborhood point for Belle Harbor on the Rockaway Peninsula.",
    geometry_precision: "neighborhood approximate",
    license_or_terms_note: "NYC website terms cited through source manifest; source page text is used as citation metadata only.",
    limitations:
      "The event records project groundbreaking only. It does not confirm completion, exact block-by-block scope, resilience performance, or later roadway/utility condition."
  }
];

const batchIds = new Set();
for (const event of records) {
  if (batchIds.has(event.event_id)) {
    throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
  }
  batchIds.add(event.event_id);
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

const duplicateSourceRecords = records
  .filter((event) =>
    doc.events.some(
      (existing) =>
        existing.city_id === event.city_id &&
        existing.source_record_id === event.source_record_id &&
        existing.source_url === event.source_url
    )
  )
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
