const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastMarch2025Spr =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=163&MId=12010";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_makers_building_completion_2020",
    date: "2020-12-01",
    bucket: "planning/development/architecture/mixed use school housing",
    title: "The Makers Building was listed as built",
    summary:
      "NLA records The Makers Building at 1 Jasper Walk as a built Hackney mixed-use regeneration scheme combining school, residential, commercial, gallery, and public-space elements, with estimated completion in December 2020.",
    observed_change:
      "A Hackney mixed-use building with education, residential, commercial, and public-space components was recorded as completed.",
    area: "The Makers Building, Hoxton",
    latitude: 51.5306,
    longitude: -0.0834,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Makers Building",
    source_url: "https://nla.london/projects/the-makers-building",
    source_record_id: "nla-the-makers-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Avanti Architects, London Borough of Hackney, McLaren, Londonewcastle, Kier Education, and project team",
    project_type: "mixed-use school, housing, commercial, gallery, and public-space development",
    geometry_source: "Approximate point geocoded from NLA-stated 1 Jasper Walk location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; school operation, residential occupation, gallery use, and long-term public-space management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_asta_house_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/adaptive reuse housing",
    title: "Asta House was listed as built",
    summary:
      "NLA records Asta House at 65 Whitfield Street as a built Camden adaptive-reuse project within the 80 Charlotte Street scheme, converting a former 1950s light-industrial building to homes and office space, with estimated completion in December 2019.",
    observed_change:
      "A Fitzrovia light-industrial building was recorded as adapted into homes and office accommodation.",
    area: "Asta House, Fitzrovia",
    latitude: 51.522,
    longitude: -0.137,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Asta House",
    source_url: "https://nla.london/projects/asta-house",
    source_record_id: "nla-asta-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Make, Multiplex, Arup, and project team",
    project_type: "light-industrial adaptive reuse for homes and office space",
    geometry_source: "Approximate point geocoded from NLA-stated 65 Whitfield Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; individual occupation, tenure, and office use require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bottle_factory_completion_2024",
    date: "2024-04-01",
    bucket: "planning/development/architecture/warehouse workspace",
    title: "The Bottle Factory was listed as built",
    summary:
      "NLA records The Bottle Factory at 12 Ossory Road as a built Southwark warehouse reuse project, repurposing a former bottling warehouse for work and light-industrial space, with estimated completion in April 2024.",
    observed_change:
      "An Old Kent Road former bottling warehouse was recorded as reused for work and light-industrial space.",
    area: "The Bottle Factory, Old Kent Road",
    latitude: 51.488,
    longitude: -0.068,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Bottle Factory",
    source_url: "https://nla.london/projects/the-bottle-factory",
    source_record_id: "nla-the-bottle-factory",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Fabrix, Opera, Quod, Whitepaper, Cundall, Symmetrys, CHP, and project team",
    project_type: "warehouse reuse for work and light-industrial space",
    geometry_source: "Approximate point geocoded from NLA-stated 12 Ossory Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; tenant mix, industrial use, and heritage protection status require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_noahs_ark_hospice_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/healthcare hospice",
    title: "The Ark children's hospice was listed as built",
    summary:
      "NLA records The Ark, Noah's Ark Children's Hospice, as a built Barnet hospice building at Byng Road, with estimated completion in October 2019.",
    observed_change:
      "A Barnet children's hospice building within a nature-reserve setting was recorded as completed.",
    area: "The Ark, Noah's Ark Children's Hospice",
    latitude: 51.652,
    longitude: -0.199,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Ark, Noah's Ark Children's Hospice",
    source_url: "https://nla.london/projects/the-ark-noahs-ark-childrens-hospice",
    source_record_id: "nla-the-ark-noahs-ark-childrens-hospice",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire and Partners, Noah's Ark Children's Hospice, Gensler, Ramboll, 8Build, KUT, JLL, RPS, and project team",
    project_type: "children's hospice building",
    geometry_source: "Approximate point geocoded from NLA-stated Byng Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; care-service start dates, patient capacity, and operating outcomes require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_motion_lea_bridge_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/residential mixed use",
    title: "Motion Lea Bridge was listed as built",
    summary:
      "NLA records Motion at Lea Bridge Road as a built Waltham Forest residential-led development with 300 homes, ground-floor gym, office, shop, cafe, new squares, and green spaces, with estimated completion in March 2020.",
    observed_change:
      "A Lea Bridge Road warehouse site was recorded as redeveloped into housing, ground-floor uses, and new open spaces.",
    area: "Lea Bridge Road, Leyton",
    latitude: 51.566,
    longitude: -0.039,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Motion",
    source_url: "https://nla.london/projects/motion",
    source_record_id: "nla-motion",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pollard Thomas Edwards, Hill, Peabody, RWDI, and project team",
    project_type: "residential-led mixed-use development",
    geometry_source: "Approximate point geocoded from NLA-stated Lea Bridge Business Centre / Enterprise Park location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; housing occupation, ground-floor business opening, and public-space management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_mandatory_inclusionary_housing_adopted_2016",
    date: "2016-03-22",
    bucket: "planning/development/zoning/citywide inclusionary housing",
    title: "Mandatory Inclusionary Housing zoning text was adopted",
    summary:
      "NYC Council records Resolution 1022-2016 approving N 160051 ZRY on March 22, 2016, creating the Mandatory Inclusionary Housing program in the Zoning Resolution.",
    observed_change:
      "A documented citywide zoning text milestone was recorded for New York City's Mandatory Inclusionary Housing framework.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 1022-2016, Mandatory Inclusionary Housing",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=D09CF096-FD49-4DD9-BD65-91949FBF1D29&ID=2636214&Options=&Search=",
    source_record_id: "nyc-council-res-1022-2016-mandatory-inclusionary-housing",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not confirm project-level affordable housing production, permits, completions, affordability enforcement, or neighborhood outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_zoning_quality_affordability_adopted_2016",
    date: "2016-03-22",
    bucket: "planning/development/zoning/citywide housing quality",
    title: "Zoning for Quality and Affordability was adopted",
    summary:
      "NYC Council records Resolution 1023-2016 approving N 160049 ZRY on March 22, 2016, amending zoning rules for building bulk, parking, and affordable-housing-related residential quality.",
    observed_change:
      "A documented citywide zoning text milestone was recorded for New York City's residential bulk, parking, and affordable-housing rule framework.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 1023-2016, Zoning for Quality and Affordability",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=7D81611A-7D57-463A-BCD6-122C2DBE6572&ID=2636215&Options=&Search=",
    source_record_id: "nyc-council-res-1023-2016-zoning-quality-affordability",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not confirm individual building designs, permits, residential quality outcomes, parking changes, or affordable housing delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_east_new_york_rezoning_adopted_2016",
    date: "2016-04-20",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "East New York rezoning map amendment was adopted",
    summary:
      "NYC Council records Resolution 1054-2016 approving C 160035 ZMK on April 20, 2016, a zoning map amendment for the East New York Community Plan.",
    observed_change:
      "A documented zoning map milestone was recorded for the East New York Community Plan area.",
    area: "East New York, Brooklyn",
    latitude: 40.675,
    longitude: -73.884,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 1054-2016, East New York Rezoning",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=080FF80E-84CA-4EB8-97FA-4C01DC776304&ID=2691332&Options=ID%7CText%7C&Search=",
    source_record_id: "nyc-council-res-1054-2016-east-new-york-rezoning",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "neighborhood zoning map amendment",
    geometry_source: "Approximate point placed in the East New York plan area rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning map adoption. It does not confirm later permits, affordable-housing completions, infrastructure delivery, business changes, or displacement outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_special_inwood_district_adopted_2018",
    date: "2018-08-08",
    bucket: "planning/development/zoning/special district",
    title: "Special Inwood District zoning text was adopted",
    summary:
      "NYC Council records Resolution 505-2018 approving N 180205(A) ZRM on August 8, 2018, establishing the Special Inwood District and related Mandatory Inclusionary Housing area.",
    observed_change:
      "A documented special-purpose zoning district milestone was recorded for Inwood, Manhattan.",
    area: "Inwood, Manhattan",
    latitude: 40.867,
    longitude: -73.922,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 0505-2018, Special Inwood District Rezoning",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=7E16088C-D505-48AA-9737-FFE23B2F818C&ID=3595772&Options=&Search=",
    source_record_id: "nyc-council-res-0505-2018-special-inwood-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Economic Development Corporation, NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed within Inwood rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm subsequent development applications, public waterfront access, housing completions, tenant protections, or infrastructure delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jerome_avenue_map_amendment_adopted_2018",
    date: "2018-03-22",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "Jerome Avenue zoning map amendment was adopted",
    summary:
      "NYC Council records Resolution 264-2018 approving C 180051(A) ZMX on March 22, 2018, a zoning map amendment associated with the Jerome Avenue rezoning in the Bronx.",
    observed_change:
      "A documented zoning map milestone was recorded for the Jerome Avenue corridor.",
    area: "Jerome Avenue corridor, Bronx",
    latitude: 40.849,
    longitude: -73.908,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 0264-2018, Jerome Avenue Rezoning",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=F6D2D526-13F2-41CA-95E5-F7A8A2D50825&ID=3371039&Options=&Search=",
    source_record_id: "nyc-council-res-0264-2018-jerome-avenue-zoning-map-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "neighborhood zoning map amendment",
    geometry_source: "Approximate point placed along the Jerome Avenue corridor rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning map adoption. It is distinct from the related zoning-text record and does not confirm later permits, tenant protections, public facility investments, or construction completions."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_duncrue_masterplan_stage1_added_2025",
    date: "2025-03-21",
    bucket: "planning/development/masterplan/industrial district",
    title: "Duncrue Masterplan was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee papers for 21 March 2025 recorded agreement that the Duncrue Masterplan be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on the Duncrue Masterplan.",
    area: "Duncrue, Belfast",
    latitude: 54.626,
    longitude: -5.913,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 21 March 2025",
    source_url: belfastMarch2025Spr,
    source_record_id: "bcc-spr-2025-03-21-duncrue-masterplan-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project team; design team not named at this stage",
    project_type: "industrial district masterplan business-case milestone",
    geometry_source: "Approximate point placed in the Duncrue industrial area rather than a masterplan boundary.",
    geometry_precision: "area",
    limitations:
      "The event records Stage 1 capital-programme status only. It does not confirm business-case approval, consultation, planning policy adoption, procurement, construction, or delivery of any project within Duncrue."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_leisure_programme_stage1_added_2025",
    date: "2025-03-21",
    bucket: "planning/development/leisure programme",
    title: "Leisure Programme was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee papers for 21 March 2025 recorded agreement that the Leisure Programme be added to the Capital Programme at Stage 1 - Emerging as a programme of works to allow business cases to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on Belfast leisure works.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 21 March 2025",
    source_url: belfastMarch2025Spr,
    source_record_id: "bcc-spr-2025-03-21-leisure-programme-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project team; site design teams not named at this stage",
    project_type: "citywide leisure capital-programme business-case milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast civic-centre point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme status only. It does not identify individual leisure sites, business-case approvals, planning permissions, procurement, construction starts, or openings."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_preservation_programme_stage1_added_2025",
    date: "2025-03-21",
    bucket: "planning/development/heritage conservation",
    title: "City Hall Preservation programme was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee papers for 21 March 2025 recorded agreement that City Hall Preservation be added to the Capital Programme at Stage 1 - Emerging as a programme of works to allow business cases to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on Belfast City Hall preservation works.",
    area: "Belfast City Hall",
    latitude: 54.5966,
    longitude: -5.9301,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 21 March 2025",
    source_url: belfastMarch2025Spr,
    source_record_id: "bcc-spr-2025-03-21-city-hall-preservation-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project team; conservation design team not named at this stage",
    project_type: "heritage preservation business-case milestone",
    geometry_source: "Approximate point placed at Belfast City Hall rather than a surveyed conservation works boundary.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 1 programme status only. It does not confirm business-case approval, statutory consents, procurement, works start, completion, or specific conservation scope."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bridges_improvement_programme_stage1_added_2025",
    date: "2025-03-21",
    bucket: "planning/development/bridge infrastructure",
    title: "Bridges Improvement Programme was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee papers for 21 March 2025 recorded agreement that the Bridges Improvement Programme be added to the Capital Programme at Stage 1 - Emerging as a programme of works to allow business cases to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on bridge-improvement works.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 21 March 2025",
    source_url: belfastMarch2025Spr,
    source_record_id: "bcc-spr-2025-03-21-bridges-improvement-programme-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project team; bridge design teams not named at this stage",
    project_type: "bridge improvement business-case milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast civic-centre point rather than individual bridge locations.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme status only. It does not list individual bridges, confirm engineering design, statutory approvals, procurement, construction, or reopening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_beacon_programme_stage1_added_2025",
    date: "2025-03-21",
    bucket: "planning/development/civic programme",
    title: "Beacon Programme was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee papers for 21 March 2025 recorded agreement that the Beacon Programme be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on the Beacon Programme.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 21 March 2025",
    source_url: belfastMarch2025Spr,
    source_record_id: "bcc-spr-2025-03-21-beacon-programme-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project team; design team not named at this stage",
    project_type: "capital-programme business-case milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast civic-centre point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme status only. It does not define final sites, design scope, planning permissions, procurement, construction starts, completion, or public opening."
  }
];

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (
    source.source_id === "london-architecture-public-pages" ||
    source.source_id === "nyc-architecture-public-pages" ||
    source.source_id === "belfast-architecture-public-pages"
  ) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
