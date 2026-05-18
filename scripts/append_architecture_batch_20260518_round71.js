const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningAug2025 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=12049";
const belfastPlanningMar2026 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?MId=12349";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_artsed_completion_2021",
    date: "2021-11-01",
    bucket: "planning/development/architecture/education building",
    title: "ArtsEd was listed as built",
    summary:
      "New London Architecture records ArtsEd at 14 Bath Road in Chiswick as built, with estimated completion in November 2021.",
    observed_change:
      "A documented Hounslow performing-arts education project was recorded as reaching built status.",
    area: "Chiswick / Hounslow",
    latitude: 51.4963429,
    longitude: -0.2522154,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: ArtsEd",
    source_url: "https://nla.london/projects/artsed",
    source_record_id: "nla-artsed",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "De Matos Ryan",
    project_type: "education building completion",
    geometry_source:
      "Nominatim geocoder point for Bath Road in the W4 1LY postcode area, matching the address listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, theatre operation, student capacity, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_britannia_leisure_centre_completion_2021",
    date: "2021-07-01",
    bucket: "planning/development/architecture/leisure centre",
    title: "Britannia Leisure Centre was listed as built",
    summary:
      "New London Architecture records Britannia Leisure Centre at 1 Pitfield Street in Hackney as built, with estimated completion in July 2021.",
    observed_change:
      "A documented Hackney leisure-centre project was recorded as reaching built status.",
    area: "Hoxton / Hackney",
    latitude: 51.5316292,
    longitude: -0.0824457,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Britannia Leisure Centre",
    source_url: "https://nla.london/projects/britannia-leisure-centre",
    source_record_id: "nla-britannia-leisure-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "FaulknerBrowns Architects",
    project_type: "leisure centre completion",
    geometry_source:
      "Nominatim geocoder point for Pitfield Street near the N1 5FT address listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public opening date, leisure programming, facility usage, later fit-out, or operational condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_samovar_space_completion_2022",
    date: "2022-10-01",
    bucket: "planning/development/architecture/public realm",
    title: "Samovar Space was listed as built",
    summary:
      "New London Architecture records Samovar Space at 49 Olympic Way in Wembley Park as built, with estimated completion in October 2022.",
    observed_change:
      "A documented Brent public-realm and civic-space project was recorded as reaching built status.",
    area: "Wembley Park / Brent",
    latitude: 51.5579446,
    longitude: -0.2782515,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Samovar Space",
    source_url: "https://nla.london/projects/samovar-space",
    source_record_id: "nla-samovar-space",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Flanagan Lawrence",
    project_type: "public realm completion",
    geometry_source:
      "Nominatim geocoder point for 49 Olympic Way, matching the location listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, event use, maintenance arrangements, public-realm performance, or later site condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_stroudley_walk_under_construction_2025",
    date: "2025-01-13",
    bucket: "planning/development/architecture/mixed-use construction status",
    title: "Stroudley Walk was listed as under construction",
    summary:
      "New London Architecture records Stroudley Walk at 20 Stroudley Walk in Tower Hamlets as under construction, with estimated completion in December 2025.",
    observed_change:
      "A documented Tower Hamlets mixed-use regeneration project was recorded with under-construction status.",
    area: "Bromley-by-Bow / Tower Hamlets",
    latitude: 51.5273154,
    longitude: -0.0175623,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Stroudley Walk",
    source_url: "https://nla.london/projects/stroudley-walk",
    source_record_id: "nla-stroudley-walk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA last-updated date and under-construction status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "NLA project page does not name a lead architect in the cited project-information text",
    project_type: "mixed-use regeneration construction status",
    geometry_source:
      "Nominatim geocoder point for 20 Stroudley Walk, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an NLA status snapshot only. It does not confirm practical completion, housing delivery, commercial occupation, public-realm completion, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_twickenham_square_under_construction_2026",
    date: "2026-05-15",
    bucket: "planning/development/architecture/housing construction status",
    title: "Twickenham Square was listed as under construction",
    summary:
      "New London Architecture records Twickenham Square at 7 Egerton Road in Richmond upon Thames as under construction, with the project page last updated on May 15, 2026.",
    observed_change:
      "A documented Richmond upon Thames housing project was recorded with under-construction status.",
    area: "Twickenham / Richmond upon Thames",
    latitude: 51.4526013,
    longitude: -0.3403136,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Twickenham Square",
    source_url: "https://nla.london/projects/twickenham-square",
    source_record_id: "nla-twickenham-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA last-updated date and under-construction status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "BTPW",
    project_type: "housing construction status",
    geometry_source:
      "Nominatim geocoder point for Egerton Road in the TW2 7SL postcode area, matching the location listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records an NLA status snapshot only. It does not confirm completion, affordable-housing tenure mix at handover, occupation, later design changes, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_morris_court_opening_2015",
    date: "2015-04-22",
    bucket: "planning/development/architecture/affordable housing",
    title: "Morris Court Apartments opening was announced",
    summary:
      "NYC HDC announced on April 22, 2015 a ribbon-cutting milestone for Morris Court Apartments, two connected six-story buildings at 253 East 142nd Street and 250 East 144th Street in Mott Haven.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of a 201-unit affordable housing development.",
    area: "Mott Haven / Bronx",
    latitude: 40.815206,
    longitude: -73.925003,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Morris Court Apartments grand opening",
    source_url:
      "https://www.nychdc.com/newsroom/hdc-hpd-join-best-development-group-azimuth-development-group-and-partners-announce-grand",
    source_record_id: "nychdc-2015-04-22-morris-court-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing opening",
    geometry_source:
      "Midpoint of Nominatim geocoder points for 253 East 142nd Street and 250 East 144th Street, matching the addresses listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, retail tenancy, affordability compliance, parking operation, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gateway_elton_i_ribbon_cutting_2015",
    date: "2015-01-15",
    bucket: "planning/development/architecture/affordable housing",
    title: "Gateway Elton I ribbon cutting was announced",
    summary:
      "NYC HDC announced on January 15, 2015 a ribbon-cutting milestone for Gateway Elton I, with 197 affordable apartments at 1149, 1152, 1165 and 1166 Elton Street in Spring Creek.",
    observed_change:
      "A documented city housing-finance announcement recorded completion/ribbon-cutting of the first Gateway Elton affordable housing phase.",
    area: "Spring Creek / Brooklyn",
    latitude: 40.6565151,
    longitude: -73.8739699,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Gateway Elton ribbon cutting and Gateway III groundbreaking",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-hdc-hudson-companies-related-companies-camba-housing-ventures-celebrate-ribbon-cutting",
    source_record_id: "nychdc-2015-01-15-gateway-elton-i-ribbon-cutting",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing ribbon cutting",
    geometry_source:
      "Nominatim geocoder point for 1149 Elton Street, used as an approximate marker for the Gateway Elton I address cluster listed in the HDC release.",
    geometry_precision: "site/address-cluster approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, supportive housing service delivery, retail tenancy, energy performance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_van_sinderen_plaza_groundbreaking_2016",
    date: "2016-10-13",
    bucket: "planning/development/architecture/mixed-use affordable housing construction start",
    title: "Van Sinderen Plaza groundbreaking was announced",
    summary:
      "NYC HDC announced on October 13, 2016 a groundbreaking milestone for Van Sinderen Plaza, a two-building mixed-use complex at 679 Van Sinderen Avenue and New Lots Avenue in East New York.",
    observed_change:
      "A documented city housing-finance announcement recorded the start of construction for a mixed-use affordable housing complex.",
    area: "East New York / Brooklyn",
    latitude: 40.6595945,
    longitude: -73.8992357,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Van Sinderen Plaza groundbreaking",
    source_url:
      "https://www.nychdc.com/newsroom/nyc-officials-join-macquesten-groundbreaking-van-sinderen-plaza-new-155000-sq-ft-mixed-use",
    source_record_id: "nychdc-2016-10-13-van-sinderen-plaza-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Gluck Architectural Collaborative is named in the HDC release as a project partner.",
    project_type: "mixed-use affordable housing construction start",
    geometry_source:
      "Nominatim geocoder point for 679 Van Sinderen Avenue, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm construction completion, lease-up, retail occupancy, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_mlk_plaza_opening_2019",
    date: "2019-03-04",
    bucket: "planning/development/architecture/affordable housing",
    title: "MLK Plaza opening was announced",
    summary:
      "NYC HDC announced on March 4, 2019 an opening milestone for MLK Plaza, a 12-story affordable housing building at 869 East 147th Street in the Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of a 167-unit affordable housing building.",
    area: "Mott Haven / Bronx",
    latitude: 40.8105013,
    longitude: -73.9046869,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: MLK Plaza opening",
    source_url:
      "https://www.nychdc.com/newsroom/nyc-hdc-hpd-join-radson-development-bronx-bp-diaz-celebrate-opening-mlk-plaza-ribbon",
    source_record_id: "nychdc-2019-03-04-mlk-plaza-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Magnusson Architecture and Planning (MAP)",
    project_type: "affordable housing opening",
    geometry_source:
      "Nominatim geocoder point for 869 East 147th Street, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, LEED certification closeout, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_5203_center_boulevard_ribbon_cutting_2021",
    date: "2021-12-02",
    bucket: "planning/development/architecture/mixed-income housing",
    title: "5203 and 5241 Center Boulevard ribbon cutting was announced",
    summary:
      "NYC HDC announced on December 2, 2021 a ribbon-cutting milestone for the Hunter's Point South buildings at 5203 and 5241 Center Boulevard, including 719 permanently affordable homes.",
    observed_change:
      "A documented city housing-finance announcement recorded a ribbon-cutting milestone for two mixed-income waterfront residential buildings.",
    area: "Hunter's Point South / Queens",
    latitude: 40.7416052,
    longitude: -73.9599455,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: 5203 Center Boulevard ribbon cutting",
    source_url:
      "https://www.nychdc.com/newsroom/hdc-and-hpd-joined-tf-cornerstone-and-elected-officials-ribbon-cutting-new-affordable",
    source_record_id: "nychdc-2021-12-02-5203-5241-center-boulevard-ribbon-cutting",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "ODA is listed as design architect and SLCE as architect of record.",
    project_type: "mixed-income housing ribbon cutting",
    geometry_source:
      "Midpoint of Nominatim geocoder points for 5203 and 5241 Center Boulevard, matching the addresses listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, affordable-unit occupancy, school delivery, public-park maintenance, retail tenancy, later operations, or building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lesley_retail_park_condition_variation_approved_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/retail condition variation",
    title: "Lesley Retail Park condition variation was approved",
    summary:
      "Belfast City Council Planning Committee minutes for August 12, 2025 record approval to vary a condition at Lesley Retail Park, Unit 1 Boucher Road, to allow convenience, non-bulky comparison and bulky comparison goods.",
    observed_change:
      "A documented planning-committee minute recorded a retail condition-variation approval milestone on Boucher Road.",
    area: "Boucher Road / Belfast",
    latitude: 54.5751812,
    longitude: -5.9661583,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 12 August 2025",
    source_url: belfastPlanningAug2025,
    source_record_id: "bcc-planning-2025-08-12-la04-2023-2868-lesley-retail-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and condition-variation minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "retail condition variation",
    geometry_source:
      "Nominatim geocoder point for Boucher Road, used as an approximate marker for Lesley Retail Park Unit 1 listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a condition-variation approval only. It does not confirm tenant changes, fit-out, opening, retail mix, traffic effects, later alterations, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lancedean_road_dwellings_refused_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/housing refusal",
    title: "Lancedean Road dwellings application was refused",
    summary:
      "Belfast City Council Planning Committee minutes for August 12, 2025 record refusal of planning permission for demolition of four garages and erection of two semi-detached dwellings on lands between 14 and 16 Lancedean Road.",
    observed_change:
      "A documented planning-committee minute recorded refusal of a small residential infill proposal.",
    area: "Lancedean Road / Castlereagh",
    latitude: 54.5697133,
    longitude: -5.8883164,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 12 August 2025",
    source_url: belfastPlanningAug2025,
    source_record_id: "bcc-planning-2025-08-12-la04-2025-0122-lancedean-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and refusal minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "residential planning refusal",
    geometry_source:
      "Nominatim geocoder point for Lancedean Road, used as an approximate marker for lands between 14 and 16 Lancedean Road listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a planning refusal only. It does not confirm any later appeal, revised application, construction, occupancy, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_olympia_drive_through_cafe_amendment_approved_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/cafe planning approval",
    title: "Olympia Leisure Centre access cafe amendment was approved",
    summary:
      "Belfast City Council Planning Committee minutes for August 12, 2025 record approval for an amended drive-through cafe design, amended parking layout, landscaping finishes, switchroom unit and associated site works on lands at the access to Olympia Leisure Centre.",
    observed_change:
      "A documented planning-committee minute recorded an amended cafe and site-works approval milestone beside Olympia Leisure Centre.",
    area: "Boucher Road / Olympia",
    latitude: 54.5830013,
    longitude: -5.9566889,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 12 August 2025",
    source_url: belfastPlanningAug2025,
    source_record_id: "bcc-planning-2025-08-12-la04-2025-0537-olympia-cafe",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and approval minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "drive-through cafe amendment approval",
    geometry_source:
      "Nominatim geocoder point for Olympia Leisure Centre on Boucher Road, matching the site context listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an amended planning approval only. It does not confirm construction, opening, tenant operation, traffic management, later alterations, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_loughside_playing_fields_monopole_refused_2026",
    date: "2026-03-10",
    bucket: "planning/development/architecture/telecom refusal",
    title: "Loughside Playing Fields monopole application was refused",
    summary:
      "Belfast City Council Planning Committee minutes for March 10, 2026 record refusal of a proposed 25m telecom monopole with antennas, transmission dishes, equipment cabinets and ancillary development at Loughside Playing Fields on Shore Road.",
    observed_change:
      "A documented planning-committee minute recorded refusal of a telecom structure on protected open-space land.",
    area: "Shore Road / North Belfast",
    latitude: 54.6344085,
    longitude: -5.9226611,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 10 March 2026",
    source_url: belfastPlanningMar2026,
    source_record_id: "bcc-planning-2026-03-10-la04-2025-0951-loughside-playing-fields",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and refusal minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the designer in the cited agenda text",
    project_type: "telecom structure planning refusal",
    geometry_source:
      "Nominatim geocoder point for Loughside Recreation Centre on Shore Road, used as an approximate marker for Loughside Playing Fields listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a planning refusal only. It does not confirm any later appeal, amended telecom proposal, equipment installation, network coverage, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_marrowbone_ballstop_fencing_approved_2026",
    date: "2026-03-10",
    bucket: "planning/development/architecture/sports fencing approval",
    title: "Marrowbone Millennium Park ballstop fencing was approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 10, 2026 record planning permission for extending existing ballstop fencing from 5m to 8m along three sides of the soccer pitch at Marrowbone Millennium Park.",
    observed_change:
      "A documented planning-committee minute recorded approval of a sports-fencing alteration at Marrowbone Millennium Park.",
    area: "Ardoyne / North Belfast",
    latitude: 54.6168739,
    longitude: -5.9533726,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 10 March 2026",
    source_url: belfastPlanningMar2026,
    source_record_id: "bcc-planning-2026-03-10-la04-2025-1692-marrowbone-ballstop-fencing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and approval minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the designer in the cited agenda text",
    project_type: "sports fencing planning approval",
    geometry_source:
      "Nominatim geocoder point for Marrowbone Park, used as an approximate marker for the soccer pitch near Ardoyne Court listed in the Planning Committee minute.",
    geometry_precision: "park/site approximate",
    limitations:
      "The event records planning permission only. It does not confirm installation, exact fence alignment, sports programming, maintenance, later alterations, or site condition."
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
