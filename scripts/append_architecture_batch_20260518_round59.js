const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeMar2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=83024";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_city_approach_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/housing retrofit",
    title: "City Approach was listed as built",
    summary:
      "New London Architecture records City Approach in Islington as built, with a 2022 completion year.",
    observed_change:
      "A documented Islington retrofit and extension project was recorded as reaching built status.",
    area: "Islington",
    latitude: 51.538,
    longitude: -0.102,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: City Approach",
    source_url: "https://nla.london/projects/city-approach",
    source_record_id: "nla-city-approach",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "DROO - Da Costa Mahindroo Architects",
    project_type: "historic building retrofit and extension completion",
    geometry_source: "Borough-approximate point placed in Islington because the NLA page provides borough and project metadata but no street address or mapped point in the parsed page.",
    geometry_precision: "borough approximate",
    limitations:
      "Source is a curated project page and gives completion at year precision. The event uses January 1 as a sortable year marker; exact completion date, address-level geometry, occupation, tenure, and later building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_national_gallery_accommodation_hub_completion_2021",
    date: "2021-04-01",
    bucket: "planning/development/architecture/heritage workplace",
    title: "National Gallery Accommodation Hub was listed as built",
    summary:
      "New London Architecture records the National Gallery Accommodation Hub in Westminster as built, with completion in April 2021.",
    observed_change:
      "A documented Grade I listed gallery workspace-refurbishment project was recorded as reaching built status.",
    area: "Trafalgar Square / Westminster",
    latitude: 51.507587,
    longitude: -0.12783,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: National Gallery - The Accommodation Hub",
    source_url: "https://nla.london/projects/national-gallery-the-accommodation-hub",
    source_record_id: "nla-national-gallery-accommodation-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Purcell",
    project_type: "heritage workplace refurbishment completion",
    geometry_source: "NLA project-page map point for the Nelson's Column/Trafalgar Square context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; staff move-in, internal operations, conservation approvals, public-gallery changes, and later workplace use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_mccann_worldgroup_completion_2020",
    date: "2020-05-01",
    bucket: "planning/development/architecture/workplace fitout",
    title: "McCann Worldgroup workplace was listed as built",
    summary:
      "New London Architecture records McCann Worldgroup at 166-170 Bishopsgate in the City of London as built, with completion in May 2020.",
    observed_change:
      "A documented Bishopsgate workplace fit-out project was recorded as reaching built status.",
    area: "Bishopsgate / City of London",
    latitude: 51.517462,
    longitude: -0.08038,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: McCann Worldgroup",
    source_url: "https://nla.london/projects/mccann-worldgroup",
    source_record_id: "nla-mccann-worldgroup",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Gensler",
    project_type: "office workplace fit-out completion",
    geometry_source: "NLA project-page map point for 166-170 Bishopsgate.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenant occupation, workplace utilisation, lease terms, later fit-out changes, and commercial performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_premier_place_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/workplace retrofit",
    title: "Premier Place was listed as built",
    summary:
      "New London Architecture records Premier Place at Devonshire Square as built, with estimated completion in June 2019.",
    observed_change:
      "A documented City of London office-refurbishment project was recorded as reaching built status.",
    area: "Devonshire Square / City of London",
    latitude: 51.516402,
    longitude: -0.079335,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Premier Place",
    source_url: "https://nla.london/projects/premier-place",
    source_record_id: "nla-premier-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stiff + Trevillion Architects",
    project_type: "office refurbishment completion",
    geometry_source: "NLA project-page map point for 11 Devonshire Square.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; office occupation, tenant fit-out, retail activation, later refurbishment, and operational performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_aperture_greenwich_peninsula_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/community mixed use",
    title: "Aperture at Greenwich Peninsula was listed as built",
    summary:
      "New London Architecture records Aperture at 42 Chandlers Avenue in Greenwich as built, with a 2017 completion year.",
    observed_change:
      "A documented Greenwich Peninsula mixed-use community building was recorded as reaching built status.",
    area: "Greenwich Peninsula",
    latitude: 51.497073,
    longitude: 0.011811,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Aperture",
    source_url: "https://nla.london/projects/aperture",
    source_record_id: "nla-aperture-greenwich-peninsula",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "DSDHA",
    project_type: "mixed-use community building completion",
    geometry_source: "NLA project-page map point for 42 Chandlers Avenue.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and gives completion at year precision. The event uses January 1 as a sortable year marker; exact completion date, public access, tenancy, programme mix, and later use require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_425_grand_concourse_developer_selection_2016",
    date: "2016-04-28",
    bucket: "planning/development/architecture/housing developer selection",
    title: "425 Grand Concourse development team was selected",
    summary:
      "NYC HPD announced on April 28, 2016 the selection of Trinity Financial and MBD Community Housing Corporation to develop 425 Grand Concourse.",
    observed_change:
      "A documented HPD announcement selected a development team for a South Bronx mixed-use affordable-housing project.",
    area: "Mott Haven / Bronx",
    latitude: 40.81707268019,
    longitude: -73.928054910716,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 425 Grand Concourse development-team selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/015-16/mayor-de-blasio-hpd-commissioner-been-hdc-president-rodney-development-team-will",
    source_record_id: "nyc-hpd-2016-04-28-425-grand-concourse-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Dattner Architects",
    project_type: "mixed-use affordable housing developer selection",
    geometry_source: "US Census geocoder point for 425 Grand Concourse, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm land-use approval, financing, final design, construction start, building completion, lease-up, school operations, supermarket opening, or later building performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_linden_terrace_completion_and_phase23_start_2022",
    date: "2022-03-15",
    bucket: "planning/development/architecture/housing completion groundbreaking",
    title: "Linden Terrace Phase 1 completion and next phases were celebrated",
    summary:
      "NYC HPD announced on March 15, 2022 the completion of Linden Terrace Phase 1 and the start of Phases 2 and 3 in East New York.",
    observed_change:
      "A documented HPD announcement recorded a completed affordable-housing phase and the start of the next Linden Terrace construction phases.",
    area: "East New York / Brooklyn",
    latitude: 40.669859118069,
    longitude: -73.858436149511,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Linden Terrace Phase 1 completion and Phases 2/3 groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/013-22/nyc-hpd-radson-development-cm-charles-barron-celebrate-548-new-affordable-apartments-at",
    source_record_id: "nyc-hpd-2022-03-15-linden-terrace-phase1-phase23",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Dattner Architects",
    project_type: "affordable housing completion and next-phase start",
    geometry_source: "US Census geocoder point for 2858 Linden Boulevard, used as an approximate Linden Terrace site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event combines a completion celebration for Phase 1 and start milestone for Phases 2 and 3 from one source. It does not confirm full lease-up, resident move-in for every unit, later phase completion, affordability compliance, or long-term building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_50_penn_completion_2022",
    date: "2022-06-09",
    bucket: "planning/development/architecture/housing completion",
    title: "50 Penn affordable housing development opened",
    summary:
      "CLPHA public member news recorded on June 15, 2022 the grand opening of 50 Penn, a mixed-use affordable housing development in East New York.",
    observed_change:
      "A documented HPD announcement recorded the opening of an affordable-housing building with ground-floor nonresidential space.",
    area: "East New York / Brooklyn",
    latitude: 40.676559338473,
    longitude: -73.897137677808,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "CLPHA member news page: grand opening of 50 Penn",
    source_url: "https://clpha.org/members/546",
    source_record_id: "clpha-2022-06-15-50-penn-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "CLPHA public news date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Dattner Architects",
    project_type: "mixed-use affordable housing opening",
    geometry_source: "US Census geocoder point for 50 Pennsylvania Avenue, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening milestone only. It does not confirm full occupancy, supportive-service operations, retail/community-space activation, long-term affordability compliance, energy performance, or later maintenance condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_chestnut_commons_opening_2022",
    date: "2022-10-04",
    bucket: "planning/development/architecture/housing opening",
    title: "Chestnut Commons opened in East New York",
    summary:
      "CityLand reported on October 12, 2022 that NYC HPD, HDC, and partners celebrated the opening of Chestnut Commons, a mixed-use affordable housing development in East New York.",
    observed_change:
      "A documented HPD announcement recorded the opening of an affordable housing and community-facility development.",
    area: "East New York / Brooklyn",
    latitude: 40.68126830682,
    longitude: -73.876143691901,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "CityLand coverage: Chestnut Commons opening",
    source_url: "https://www.citylandnyc.org/hpd-celebrates-opening-of-new-affordable-building-with-275-units-in-east-new-york/",
    source_record_id: "cityland-2022-10-12-chestnut-commons-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "CityLand article date reporting HPD/HDC opening event",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Dattner Architects",
    project_type: "mixed-use affordable housing and community-facility opening",
    geometry_source: "US Census geocoder point for 110 Dinsmore Place, used as an approximate Chestnut Commons site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening milestone only. It does not confirm full occupancy, community-facility programming, long-term affordability compliance, retail activation, energy performance, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_raven_hall_opening_2022",
    date: "2022-03-30",
    bucket: "planning/development/architecture/housing opening",
    title: "Raven Hall was announced complete in Coney Island",
    summary:
      "NYC HPD announced on March 30, 2022 the completion of Raven Hall, a mixed-use affordable and supportive housing development in Coney Island.",
    observed_change:
      "A documented HPD announcement recorded completion of an affordable and supportive housing development.",
    area: "Coney Island / Brooklyn",
    latitude: 40.574800141312,
    longitude: -73.986706875289,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Raven Hall completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/014-22/city-state-officials-development-partners-completion-133-million-mixed-use",
    source_record_id: "nyc-hpd-2022-03-30-raven-hall-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Marvel Architects",
    project_type: "mixed-use affordable and supportive housing completion",
    geometry_source: "US Census geocoder point for 2006 Surf Avenue, the address named in public project records.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening milestone only. It does not confirm full occupancy, supportive-service caseloads, commercial-space tenancy, long-term affordability compliance, storm-resilience performance, or later building operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_makaton_boards_stage1_2025",
    date: "2025-03-21",
    bucket: "planning/development/accessibility signage programme status",
    title: "Makaton Boards project was added at Stage 1",
    summary:
      "Belfast City Council's March 21, 2025 Physical Programme Update recorded Makaton Boards being added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented council physical-programme report recorded an early-stage accessibility and communication-board project milestone.",
    area: "Belfast citywide accessibility signage programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 21 March 2025",
    source_url: belfastPhysicalProgrammeMar2025,
    source_record_id: "bcc-physical-programme-2025-03-21-makaton-boards-stage1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name signage designers or contractors for this stage item",
    project_type: "accessibility signage programme stage movement",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report names a board/signage project without fixed installation sites.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records addition at Stage 1 only. It does not confirm design, installation sites, procurement, manufacturing, installation dates, accessibility review, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ormeau_park_basketball_upgrade_stage1_2025",
    date: "2025-03-21",
    bucket: "planning/development/sports court programme status",
    title: "Ormeau Park Basketball upgrade was added at Stage 1",
    summary:
      "Belfast City Council's March 21, 2025 Physical Programme Update recorded Ormeau Park Basketball upgrade being added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented council physical-programme report recorded an early-stage sports-court upgrade milestone.",
    area: "Ormeau Park",
    latitude: 54.584,
    longitude: -5.916,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 21 March 2025",
    source_url: belfastPhysicalProgrammeMar2025,
    source_record_id: "bcc-physical-programme-2025-03-21-ormeau-park-basketball-stage1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name sports-court designers or contractors for this stage item",
    project_type: "basketball court upgrade stage movement",
    geometry_source: "Approximate point placed at Ormeau Park from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records addition at Stage 1 only. It does not confirm design, funding, procurement, court location, construction start, completion, accessibility checks, final cost, or later court condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_west_basketball_courts_stage1_2025",
    date: "2025-03-21",
    bucket: "planning/development/sports court programme status",
    title: "West Basketball courts project was added at Stage 1",
    summary:
      "Belfast City Council's March 21, 2025 Physical Programme Update recorded West Basketball courts being added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented council physical-programme report recorded an early-stage multi-site west Belfast basketball-court milestone.",
    area: "West Belfast basketball court programme",
    latitude: 54.59,
    longitude: -5.98,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 21 March 2025",
    source_url: belfastPhysicalProgrammeMar2025,
    source_record_id: "bcc-physical-programme-2025-03-21-west-basketball-courts-stage1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name sports-court designers or contractors for this stage item",
    project_type: "basketball courts programme stage movement",
    geometry_source: "Programme-approximate point placed in west Belfast because the report names a west basketball-courts programme but does not provide individual court addresses.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records addition at Stage 1 only. It does not list individual courts, designs, funding, procurement, construction dates, completion, accessibility checks, final cost, or later court condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_loughside_changing_facility_stage1_2025",
    date: "2025-03-21",
    bucket: "planning/development/sports facility programme status",
    title: "Loughside Changing Facility was added at Stage 1",
    summary:
      "Belfast City Council's March 21, 2025 Physical Programme Update recorded Loughside Changing Facility being added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented council physical-programme report recorded an early-stage changing-facility capital project milestone.",
    area: "Loughside / Belfast",
    latitude: 54.626,
    longitude: -5.917,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 21 March 2025",
    source_url: belfastPhysicalProgrammeMar2025,
    source_record_id: "bcc-physical-programme-2025-03-21-loughside-changing-facility-stage1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name facility designers or contractors for this stage item",
    project_type: "sports changing facility stage movement",
    geometry_source: "Approximate point placed in the Loughside project context from the named council programme item.",
    geometry_precision: "site approximate",
    limitations:
      "The report records addition at Stage 1 only. It does not confirm site boundary, design, planning approvals, procurement, construction start, completion, opening, final cost, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_mobile_changing_places_stage1_2025",
    date: "2025-03-21",
    bucket: "planning/development/accessibility facility programme status",
    title: "Mobile Changing Places project was added at Stage 1",
    summary:
      "Belfast City Council's March 21, 2025 Physical Programme Update recorded Mobile Changing Places being added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented council physical-programme report recorded an early-stage accessibility-facility project milestone.",
    area: "Belfast citywide accessibility facility programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 21 March 2025",
    source_url: belfastPhysicalProgrammeMar2025,
    source_record_id: "bcc-physical-programme-2025-03-21-mobile-changing-places-stage1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this stage item",
    project_type: "accessibility facility programme stage movement",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report describes a mobile/citywide facility project without a fixed site address.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records addition at Stage 1 only. It does not confirm vehicle/facility specification, procurement, deployment locations, operating model, completion, accessibility certification, final cost, or later usage."
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
