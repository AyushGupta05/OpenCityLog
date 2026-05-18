const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycGowanusLandmarksRelease =
  "https://www.nyc.gov/site/lpc/about/pr2019/lpc_designates_five_historic_buildings_in_gowanus_as_individual_landmarks.page";
const belfastPhysicalProgrammeApr2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=83024";
const belfastCompletedProjectsOct2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123923/Item%205%20a%20Physical%20Prog%20Appendix%201%20-%20Completed%20projects.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_dudley_house_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/residential",
    title: "Dudley House was listed as built",
    summary:
      "New London Architecture records Dudley House in Westminster as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Paddington residential project was recorded as reaching built status.",
    area: "Paddington / Westminster",
    latitude: 51.519,
    longitude: -0.173,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dudley House",
    source_url: "https://nla.london/projects/dudley-house",
    source_record_id: "nla-dudley-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Child Graddon Lewis",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at Merchant Square/Paddington from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, council housing allocation, estate management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_rochester_way_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/residential",
    title: "Rochester Way was listed as built",
    summary:
      "New London Architecture records Rochester Way in Greenwich as built, with estimated completion in June 2019.",
    observed_change:
      "A documented Rochester Way residential project was recorded as reaching built status.",
    area: "Eltham / Greenwich",
    latitude: 51.461,
    longitude: 0.042,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Rochester Way",
    source_url: "https://nla.london/projects/rochester-way",
    source_record_id: "nla-rochester-way",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Peter Barber Architects",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed on Rochester Way from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, allocation, resident outcomes, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kantor_centre_of_excellence_completion_2019",
    date: "2019-03-01",
    bucket: "planning/development/architecture/education and health",
    title: "The Kantor Centre of Excellence was listed as built",
    summary:
      "New London Architecture records The Kantor Centre of Excellence in Islington as built, with completion in March 2019.",
    observed_change:
      "A documented Rodney Street mental-health, education, and research facility project was recorded as reaching built status.",
    area: "Pentonville / Islington",
    latitude: 51.533,
    longitude: -0.115,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Kantor Centre of Excellence",
    source_url: "https://nla.london/projects/the-kantor-centre-of-excellence",
    source_record_id: "nla-the-kantor-centre-of-excellence",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Penoyre & Prasad",
    project_type: "education and health facility completion",
    geometry_source: "Approximate point placed at Rodney Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; service opening, programme activity, clinical outcomes, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_rye_apartments_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/residential",
    title: "The Rye Apartments were listed as built",
    summary:
      "New London Architecture records The Rye Apartments in Southwark as built, with completion in March 2020.",
    observed_change:
      "A documented Peckham Rye residential project was recorded as reaching built status.",
    area: "Peckham Rye / Southwark",
    latitude: 51.464,
    longitude: -0.067,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Rye Apartments",
    source_url: "https://nla.london/projects/the-rye-apartments",
    source_record_id: "nla-the-rye-apartments",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Tikari Works",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 114 Peckham Rye from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, sales, tenure, management, and later building alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_eccleston_yards_completion_2018",
    date: "2018-08-01",
    bucket: "planning/development/architecture/public realm",
    title: "Eccleston Yards was listed as built",
    summary:
      "New London Architecture records Eccleston Yards in Westminster as built, with estimated completion in August 2018.",
    observed_change:
      "A documented Belgravia yard and public-realm project was recorded as reaching built status.",
    area: "Belgravia / Westminster",
    latitude: 51.494,
    longitude: -0.149,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Eccleston Yards",
    source_url: "https://nla.london/projects/eccleston-yards",
    source_record_id: "nla-eccleston-yards",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman",
    project_type: "public-realm and mixed-use yard completion",
    geometry_source: "Approximate point placed at Eccleston Yards from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenant mix, public-access arrangements, management, events, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_somers_brothers_tinware_factory_landmark_designated_2019",
    date: "2019-10-29",
    bucket: "planning/development/architecture/landmark designation",
    title: "Somers Brothers Tinware Factory was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Somers Brothers Tinware Factory at 238-246 3rd Street as one of five Gowanus individual landmarks on October 29, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Somers Brothers Tinware Factory to individual landmark.",
    area: "Gowanus / Brooklyn",
    latitude: 40.675,
    longitude: -73.987,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five Gowanus landmarks",
    source_url: nycGowanusLandmarksRelease,
    source_record_id: "nyc-lpc-2019-10-29-somers-brothers-tinware-factory",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Industrial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 238-246 3rd Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, rezoning outcomes, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brt_central_power_station_engine_house_landmark_designated_2019",
    date: "2019-10-29",
    bucket: "planning/development/architecture/landmark designation",
    title: "BRT Central Power Station Engine House was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Brooklyn Rapid Transit Company Central Power Station Engine House at 153 2nd Street as one of five Gowanus individual landmarks on October 29, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the BRT Central Power Station Engine House to individual landmark.",
    area: "Gowanus / Brooklyn",
    latitude: 40.676,
    longitude: -73.989,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five Gowanus landmarks",
    source_url: nycGowanusLandmarksRelease,
    source_record_id: "nyc-lpc-2019-10-29-brt-central-power-station-engine-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Thomas E. Murray",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 153 2nd Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, rezoning outcomes, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gowanus_flushing_tunnel_pumping_station_landmark_designated_2019",
    date: "2019-10-29",
    bucket: "planning/development/architecture/landmark designation",
    title: "Gowanus Canal Flushing Tunnel Pumping Station and Gate House was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Gowanus Canal Flushing Tunnel Pumping Station and Gate House at 196 Butler Street as one of five Gowanus individual landmarks on October 29, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Gowanus Canal Flushing Tunnel Pumping Station and Gate House to individual landmark.",
    area: "Gowanus / Brooklyn",
    latitude: 40.682,
    longitude: -73.987,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five Gowanus landmarks",
    source_url: nycGowanusLandmarksRelease,
    source_record_id: "nyc-lpc-2019-10-29-gowanus-flushing-tunnel-pumping-station-gate-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Utilities building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 196 Butler Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm pumping operations, canal remediation, restoration work, permits, rezoning outcomes, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_montauk_paint_manufacturing_company_building_landmark_designated_2019",
    date: "2019-10-29",
    bucket: "planning/development/architecture/landmark designation",
    title: "Montauk Paint Manufacturing Company Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Montauk Paint Manufacturing Company Building at 170 2nd Avenue as one of five Gowanus individual landmarks on October 29, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Montauk Paint Manufacturing Company Building to individual landmark.",
    area: "Gowanus / Brooklyn",
    latitude: 40.67,
    longitude: -73.995,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five Gowanus landmarks",
    source_url: nycGowanusLandmarksRelease,
    source_record_id: "nyc-lpc-2019-10-29-montauk-paint-manufacturing-company-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Industrial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 170 2nd Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, rezoning outcomes, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_aspca_brooklyn_office_shelter_garage_landmark_designated_2019",
    date: "2019-10-29",
    bucket: "planning/development/architecture/landmark designation",
    title: "ASPCA Brooklyn Office, Shelter and Garage was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the ASPCA Brooklyn Office, Shelter and Garage at 233 Butler Street as one of five Gowanus individual landmarks on October 29, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the ASPCA Brooklyn Office, Shelter and Garage to individual landmark.",
    area: "Gowanus / Brooklyn",
    latitude: 40.682,
    longitude: -73.986,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five Gowanus landmarks",
    source_url: nycGowanusLandmarksRelease,
    source_record_id: "nyc-lpc-2019-10-29-aspca-brooklyn-office-shelter-garage",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Renwick, Aspinwall & Tucker",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 233 Butler Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, rezoning outcomes, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_mallusk_playing_fields_pitch_investment_completed_2025",
    date: "2025-09-30",
    bucket: "planning/development/sports facility completion",
    title: "Mallusk Playing Fields sporting-pitches investment was reported completed",
    summary:
      "Belfast City Council's October 2025 completed-projects appendix listed Sporting Pitches Investment 2024/25 works at Mallusk Playing Fields as completed during the April-September 2025 reporting period.",
    observed_change:
      "A documented completed-projects appendix recorded completed sports-pitch investment works at Mallusk Playing Fields.",
    area: "Mallusk Playing Fields",
    latitude: 54.69,
    longitude: -6.023,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 1: Completed Projects to September 2025",
    source_url: belfastCompletedProjectsOct2025Pdf,
    source_record_id: "bcc-completed-projects-2025-q2-mallusk-playing-fields-sporting-pitches",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed Projects appendix reporting period",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council sporting-pitches investment programme; delivery team not named in the appendix",
    project_type: "sports-pitch investment completion",
    geometry_source: "Approximate point placed at Mallusk Playing Fields from the named completed-projects appendix location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records completion within the reporting period, not an exact completion date. It does not provide pitch specifications, contract records, cost, opening arrangements, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_upper_ardoyne_youth_centre_completed_2025",
    date: "2025-09-30",
    bucket: "planning/development/community facility completion",
    title: "Upper Ardoyne Youth Centre was reported completed",
    summary:
      "Belfast City Council's October 2025 completed-projects appendix listed Upper Ardoyne Youth Centre as completed during the April-September 2025 reporting period.",
    observed_change:
      "A documented completed-projects appendix recorded completion of a youth-centre project in Upper Ardoyne.",
    area: "Upper Ardoyne",
    latitude: 54.619,
    longitude: -5.97,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 1: Completed Projects to September 2025",
    source_url: belfastCompletedProjectsOct2025Pdf,
    source_record_id: "bcc-completed-projects-2025-q2-upper-ardoyne-youth-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed Projects appendix reporting period",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and youth-centre project partners; design team not named in the appendix",
    project_type: "youth-centre project completion",
    geometry_source: "Approximate point placed in the Upper Ardoyne project context because the appendix does not map the youth centre.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records completion within the reporting period, not an exact completion date. It does not provide the final scope, building drawings, contract record, cost, opening arrangements, or operating model."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_oss_bereavement_services_machinery_phase1_completed_2025",
    date: "2025-09-30",
    bucket: "planning/development/civic asset completion",
    title: "OSS and Bereavement Services Machinery Phase 1 was reported completed",
    summary:
      "Belfast City Council's October 2025 completed-projects appendix listed OSS and Bereavement Services Machinery Phase 1 as completed during the April-September 2025 reporting period.",
    observed_change:
      "A documented completed-projects appendix recorded completion of a civic-asset machinery phase associated with open-space and bereavement services.",
    area: "Belfast OSS and Bereavement Services",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 1: Completed Projects to September 2025",
    source_url: belfastCompletedProjectsOct2025Pdf,
    source_record_id: "bcc-completed-projects-2025-q2-oss-bereavement-services-machinery-phase-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed Projects appendix reporting period",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council OSS and Bereavement Services; suppliers not named in the appendix",
    project_type: "civic asset and operational equipment completion",
    geometry_source: "Programme-approximate point placed at Belfast city centre because the appendix does not map the machinery deployment sites.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records completion within the reporting period, not an exact completion date. It does not list every asset, deployment location, procurement record, cost, maintenance plan, or service outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_hosford_community_homes_inclusive_hub_completed_2025",
    date: "2025-03-31",
    bucket: "planning/development/community facility completion",
    title: "Hosford Community Homes Inclusive Hub was reported completed",
    summary:
      "Belfast City Council's April 2025 Physical Programme update listed Hosford Community Homes Inclusive Hub as completed, describing refurbishment of an East Belfast Mission building at 240 Newtownards Road into a multi-purpose community and good-relations space and accommodation units.",
    observed_change:
      "A documented Physical Programme update recorded completion of a community and accommodation hub refurbishment at 240 Newtownards Road.",
    area: "Newtownards Road / East Belfast",
    latitude: 54.598,
    longitude: -5.889,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update April 2025",
    source_url: belfastPhysicalProgrammeApr2025,
    source_record_id: "bcc-physical-programme-2025-04-hosford-community-homes-inclusive-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and January-March 2025 completed-projects section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "East Belfast Mission, Urban Villages, Belfast City Council, and project partners; design team not named in the report",
    project_type: "community and accommodation hub refurbishment completion",
    geometry_source: "Approximate point placed at 240 Newtownards Road from the council report description.",
    geometry_precision: "site approximate",
    limitations:
      "The report records completion in a quarterly update, not an exact completion date. It does not provide final floor plans, accommodation-unit count, contract record, cost, opening arrangements, or service outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lorag_shaftesbury_pitch_carpet_replacement_completed_2025",
    date: "2025-03-31",
    bucket: "planning/development/sports facility completion",
    title: "LORAG/Shaftesbury centre pitch-carpet replacement was reported completed",
    summary:
      "Belfast City Council's April 2025 Physical Programme update listed pitch-carpet replacement at LORAG/Shaftesbury centre among completed enhancements to council assets for the January-March 2025 reporting period.",
    observed_change:
      "A documented Physical Programme update recorded completion of a sports-surface replacement project at LORAG/Shaftesbury centre.",
    area: "LORAG / Shaftesbury centre",
    latitude: 54.584,
    longitude: -5.922,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update April 2025",
    source_url: belfastPhysicalProgrammeApr2025,
    source_record_id: "bcc-physical-programme-2025-04-lorag-shaftesbury-pitch-carpet-replacement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and January-March 2025 completed-projects section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, LORAG/Shaftesbury centre project partners, and delivery team; contractor not named in the report",
    project_type: "sports-surface replacement completion",
    geometry_source: "Approximate point placed in the LORAG/Shaftesbury centre context because the report does not map the pitch surface.",
    geometry_precision: "site approximate",
    limitations:
      "The report records completion in a quarterly update, not an exact completion date. It does not provide pitch specifications, contract record, cost, reopening arrangements, maintenance plan, or usage outcomes."
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
