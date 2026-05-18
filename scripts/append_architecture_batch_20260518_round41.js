const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const londonMoorgateCrossrailLinks =
  "https://www.cityoflondon.gov.uk/services/streets/projects-and-proposals/moorgate-crossrail-station-links-mcsl-programme";
const londonTidewayBazalgetteEmbankment =
  "https://tideway.london/news/press-releases/2025/may/mp-opens-new-riverside-destination-created-as-part-of-super-sewer-project/";
const londonLsoStLukes =
  "https://www.lso.co.uk/lso-st-lukes-re-opens-following-8-million-refurbishment/";
const londonIkeaOxfordStreet =
  "https://www.ingka.com/newsroom/ikea-makes-a-new-home-on-londons-oxford-street/";
const londonMetShoreditch =
  "https://www.londonmet.ac.uk/news/articles/london-met-welcomes-community-to-celebrate-reopening-of-the-refurbished-shoreditch-campus/";
const nycBronxLandmarksRelease =
  "https://www.nyc.gov/site/lpc/about/pr2023/lpc-designates-three-bronx-sites-as-individual-landmarks.page";
const nycModernLandmarksRelease =
  "https://www.nyc.gov/site/lpc/about/pr2023/lpc-designates-two-modern-buildings-as-individual-landmarks-10131219.page";
const belfastCompletedProjectsMar2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s121132/Appendix%201%20-%20Completed%20projects%20Mar25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_moorgate_crossrail_station_links_finsbury_circus_completion_2025",
    date: "2025-03-01",
    bucket: "planning/development/public realm",
    title: "Moorgate Crossrail Station Links public realm phase was completed",
    summary:
      "The City of London records the Finsbury Circus Western Arm phase of the Moorgate Crossrail Station Links programme as completed in March 2025.",
    observed_change:
      "A documented public-realm phase near Moorgate station was recorded as completed, adding pedestrianised space, soft landscaping, and seating.",
    area: "Moorgate / Finsbury Circus",
    latitude: 51.518,
    longitude: -0.087,
    source_ids: ["london-architecture-public-pages"],
    source_name: "City of London Moorgate Crossrail Station Links programme page",
    source_url: londonMoorgateCrossrailLinks,
    source_record_id: "city-of-london-mcsl-finsbury-circus-western-arm",
    source_retrieved_at: retrievedAt,
    source_date_field: "City of London phase completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "City of London Corporation project team; design team not named in the extracted source fields",
    project_type: "station-area public-realm completion",
    geometry_source: "Approximate point placed at the Finsbury Circus Western Arm/Moorgate project context described by the City of London page.",
    geometry_precision: "site approximate",
    limitations:
      "The source records completion of one programme phase, not the full Moorgate Crossrail Station Links programme. It does not provide full contract records, final cost, pedestrian counts, maintenance outcomes, or measured accessibility outcomes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bazalgette_embankment_public_space_opening_2025",
    date: "2025-05-01",
    bucket: "planning/development/public realm riverside",
    title: "Bazalgette Embankment public space was formally opened",
    summary:
      "Tideway recorded the formal opening of the Bazalgette Embankment riverside public space near Vauxhall in May 2025.",
    observed_change:
      "A documented new riverside public space built as part of the Thames Tideway project was recorded as formally opened.",
    area: "Vauxhall / Albert Embankment",
    latitude: 51.488,
    longitude: -0.123,
    source_ids: ["london-architecture-public-pages"],
    source_name: "Tideway press release: MP opens new riverside destination",
    source_url: londonTidewayBazalgetteEmbankment,
    source_record_id: "tideway-2025-05-bazalgette-embankment-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "Tideway May 2025 press-release month and formal-opening narrative",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Tideway project team and public-realm partners; full design team not named in the extracted source fields",
    project_type: "riverside public-space opening",
    geometry_source: "Approximate point placed on the southern Thames bank near Vauxhall Bridge from the Tideway source context.",
    geometry_precision: "site approximate",
    limitations:
      "The source records formal opening of the public space and describes the wider super sewer context. It does not by itself provide final design drawings, long-term access terms, maintenance outcomes, public-use counts, or environmental monitoring."
  },
  {
    city_id: "london",
    event_id: "lon_arch_lso_st_lukes_refurbishment_reopening_2025",
    date: "2025-10-15",
    bucket: "planning/development/architecture/cultural retrofit",
    title: "LSO St Luke's reopened after refurbishment",
    summary:
      "The London Symphony Orchestra announced the official reopening of LSO St Luke's after an 8 million GBP refurbishment on October 15, 2025.",
    observed_change:
      "A documented cultural-venue refurbishment in the former St Luke's Church was recorded as officially reopened.",
    area: "Old Street / Islington",
    latitude: 51.525,
    longitude: -0.095,
    source_ids: ["london-architecture-public-pages"],
    source_name: "London Symphony Orchestra news release: LSO St Luke's re-opens",
    source_url: londonLsoStLukes,
    source_record_id: "lso-st-lukes-reopening-2025-10-15",
    source_retrieved_at: retrievedAt,
    source_date_field: "LSO publication and official reopening date",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Levitt Bernstein",
    project_type: "cultural venue refurbishment and reopening",
    geometry_source: "Approximate point placed at LSO St Luke's on Old Street from the named venue location.",
    geometry_precision: "site approximate",
    limitations:
      "The source records official reopening and project features. It does not provide full tender records, measured acoustic performance, post-opening audience data, or long-term operating outcomes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ikea_oxford_street_opening_2025",
    date: "2025-05-01",
    bucket: "planning/development/architecture/retail adaptive reuse",
    title: "IKEA Oxford Street opened in a listed building",
    summary:
      "Ingka Group announced that IKEA opened its Oxford Street store at 214 Oxford Street on May 1, 2025 after renovation of the Grade II listed building.",
    observed_change:
      "A documented central London retail reuse project was recorded as open after renovation of the former Oxford Street building.",
    area: "Oxford Street / Westminster",
    latitude: 51.515,
    longitude: -0.144,
    source_ids: ["london-architecture-public-pages"],
    source_name: "Ingka Group news release: IKEA makes a new home on London's Oxford Street",
    source_url: londonIkeaOxfordStreet,
    source_record_id: "ingka-ikea-oxford-street-opening-2025-05-01",
    source_retrieved_at: retrievedAt,
    source_date_field: "Ingka publication and opening date",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Ingka Investments and IKEA project team; full design team not named in the extracted source fields",
    project_type: "listed-building retail reuse opening",
    geometry_source: "Approximate point placed at 214 Oxford Street from the source address.",
    geometry_precision: "site approximate",
    limitations:
      "The source records store opening and renovation of the listed building. It does not provide full planning conditions, heritage-consent details, construction records, public-realm effects, or retail footfall outcomes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_london_met_shoreditch_campus_reopening_2025",
    date: "2025-09-19",
    bucket: "planning/development/architecture/education retrofit",
    title: "London Met Shoreditch campus reopened after refurbishment",
    summary:
      "London Metropolitan University reported the reopening celebration for its refurbished Shoreditch campus on September 19, 2025.",
    observed_change:
      "A documented education and creative-campus refurbishment in Shoreditch was recorded as reopened for university and community use.",
    area: "Shoreditch",
    latitude: 51.522,
    longitude: -0.079,
    source_ids: ["london-architecture-public-pages"],
    source_name: "London Metropolitan University news release: refurbished Shoreditch campus reopening",
    source_url: londonMetShoreditch,
    source_record_id: "london-met-shoreditch-campus-reopening-2025-09-19",
    source_retrieved_at: retrievedAt,
    source_date_field: "London Metropolitan University publication date and reopening event narrative",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "London Metropolitan University estates team; external design team not named in the extracted source fields",
    project_type: "education campus refurbishment and reopening",
    geometry_source: "Approximate point placed in the Shoreditch campus context because the source does not provide a mapped building boundary.",
    geometry_precision: "campus approximate",
    limitations:
      "The source records a reopening celebration and describes refurbished campus use. It does not provide full scope drawings, cost, accessibility audit, occupancy schedule, or long-term educational outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bronx_opera_house_landmark_designated_2023",
    date: "2023-06-13",
    bucket: "planning/development/architecture/landmark designation",
    title: "Bronx Opera House was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Bronx Opera House as an individual landmark on June 13, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Bronx Opera House to individual landmark.",
    area: "South Bronx",
    latitude: 40.816,
    longitude: -73.918,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three Bronx sites",
    source_url: nycBronxLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-13-bronx-opera-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic theater building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Neighborhood-approximate point placed in the South Bronx because the press release names the site but does not provide a mapped parcel in extracted fields.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_engine_88_ladder_38_firehouse_landmark_designated_2023",
    date: "2023-06-13",
    bucket: "planning/development/architecture/landmark designation",
    title: "Engine Company 88/Ladder Company 38 Firehouse was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Engine Company 88/Ladder Company 38 Firehouse as an individual landmark on June 13, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of Engine Company 88/Ladder Company 38 Firehouse to individual landmark.",
    area: "Belmont / Bronx",
    latitude: 40.853,
    longitude: -73.886,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three Bronx sites",
    source_url: nycBronxLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-13-engine-88-ladder-38-firehouse",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic firehouse; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed in the Belmont firehouse context because the press release names the site but does not provide a mapped parcel in extracted fields.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, firehouse operational changes, building-condition change, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_fire_alarm_telegraph_bronx_central_office_landmark_designated_2023",
    date: "2023-06-13",
    bucket: "planning/development/architecture/landmark designation",
    title: "Fire Alarm Telegraph Bureau Bronx Central Office was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Fire Alarm Telegraph Bureau, Bronx Central Office as an individual landmark on June 13, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Fire Alarm Telegraph Bureau, Bronx Central Office to individual landmark.",
    area: "Bronx Park / West Farms",
    latitude: 40.842,
    longitude: -73.878,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three Bronx sites",
    source_url: nycBronxLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-13-fire-alarm-telegraph-bureau-bronx-central-office",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Frank J. Helmle",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed near the southeastern edge of Bronx Park from the LPC press-release location description.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, FDNY operational changes, building-condition change, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_barkin_levin_pavilion_landmark_designated_2023",
    date: "2023-12-19",
    bucket: "planning/development/architecture/landmark designation",
    title: "Barkin, Levin & Company Office Pavilion was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Barkin, Levin & Company Office Pavilion at 12-12 33rd Avenue in Long Island City as an individual landmark on December 19, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Barkin, Levin & Company Office Pavilion to individual landmark.",
    area: "Long Island City / Queens",
    latitude: 40.769,
    longitude: -73.936,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: two modern buildings",
    source_url: nycModernLandmarksRelease,
    source_record_id: "nyc-lpc-2023-12-19-barkin-levin-company-office-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Ulrich Franzen",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 12-12 33rd Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_modulightor_building_landmark_designated_2023",
    date: "2023-12-19",
    bucket: "planning/development/architecture/landmark designation",
    title: "Modulightor Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Modulightor Building at 246 East 58th Street in Manhattan as an individual landmark on December 19, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Modulightor Building to individual landmark.",
    area: "East Midtown / Manhattan",
    latitude: 40.76,
    longitude: -73.965,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: two modern buildings",
    source_url: nycModernLandmarksRelease,
    source_record_id: "nyc-lpc-2023-12-19-modulightor-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Paul Rudolph; later phase by Mark Squeo based on Rudolph drawings",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 246 East 58th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_customer_hub_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/civic service facility",
    title: "Customer Hub project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for January-March 2025 listed Customer Focus Programme - Customer Hub among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed civic customer-service facility project.",
    area: "Belfast city centre",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: January-March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-customer-focus-programme-customer-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and customer-focus project team; design team not named in the appendix",
    project_type: "civic customer-service facility completion",
    geometry_source: "Approximate Belfast City Hall point because the appendix does not identify or map the Customer Hub facility.",
    geometry_precision: "citywide approximate",
    limitations:
      "The appendix lists the project as completed during January-March 2025 but does not provide an exact completion date, facility address, fit-out specification, contract record, cost, accessibility audit, or service-use outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bredagh_gac_container_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/sports infrastructure",
    title: "Bredagh GAC container project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for January-March 2025 listed Bredagh GAC Container among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed sports-club container project associated with Bredagh GAC.",
    area: "Bredagh GAC / South Belfast",
    latitude: 54.55,
    longitude: -5.92,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: January-March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-bredagh-gac-container",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports project partners; design team not named in the appendix",
    project_type: "sports infrastructure container completion",
    geometry_source: "Approximate South Belfast project point because the appendix names the club but does not map the container location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during January-March 2025 but does not provide an exact completion date, container specification, facility address, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sir_thomas_lady_dixon_cycle_stand_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/active travel infrastructure",
    title: "Sir Thomas and Lady Dixon Park covered cycle stand was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for January-March 2025 listed Covered Cycle Stand - Sir Thomas & Lady Dixon Park among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed covered cycle-stand infrastructure at Sir Thomas and Lady Dixon Park.",
    area: "Sir Thomas and Lady Dixon Park",
    latitude: 54.529,
    longitude: -5.994,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: January-March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-covered-cycle-stand-sir-thomas-lady-dixon-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "covered cycle-stand completion",
    geometry_source: "Approximate point placed at Sir Thomas and Lady Dixon Park because the appendix does not map the stand location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during January-March 2025 but does not provide an exact completion date, stand location, capacity, supplier, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_orangefield_park_cycle_stand_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/active travel infrastructure",
    title: "Orangefield Park covered cycle stand was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for January-March 2025 listed Covered Cycle Stand - Orangefield Park among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed covered cycle-stand infrastructure at Orangefield Park.",
    area: "Orangefield Park",
    latitude: 54.59,
    longitude: -5.856,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: January-March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-covered-cycle-stand-orangefield-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "covered cycle-stand completion",
    geometry_source: "Approximate point placed at Orangefield Park because the appendix does not map the stand location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during January-March 2025 but does not provide an exact completion date, stand location, capacity, supplier, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bog_meadows_cycle_stand_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/active travel infrastructure",
    title: "Bog Meadows covered cycle stand was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for January-March 2025 listed Covered Cycle Stand - Bog Meadows among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed covered cycle-stand infrastructure at Bog Meadows.",
    area: "Bog Meadows",
    latitude: 54.584,
    longitude: -5.963,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: January-March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-covered-cycle-stand-bog-meadows",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "covered cycle-stand completion",
    geometry_source: "Approximate point placed at Bog Meadows because the appendix does not map the stand location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during January-March 2025 but does not provide an exact completion date, stand location, capacity, supplier, cost, maintenance plan, or usage outcomes."
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
