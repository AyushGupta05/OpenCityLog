const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycFormerWhitneyRelease =
  "https://www.nyc.gov/site/lpc/about/pr2025/lpc-designates-the-former-whitney-museum-of-american-art-20250520.page";
const nycOneWallStreetRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-1-wall-street-banking-room-20240625.page";
const nycBrooklynEdisonRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-the-brooklyn-edison-building.page";
const nycTempleCourtRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-temple-court-building-atrium-20240604.page";
const nycHeckscherRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-the-heckscher-building-20240514.page";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_white_city_place_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/workplace campus",
    title: "White City Place was listed as built",
    summary:
      "New London Architecture records White City Place in Hammersmith as built, with completion in 2017.",
    observed_change:
      "A documented workplace-campus redevelopment at White City was recorded as reaching built status.",
    area: "White City / Hammersmith",
    latitude: 51.512,
    longitude: -0.225,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: White City Place",
    source_url: "https://nla.london/projects/white-city-place",
    source_record_id: "nla-white-city-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "workplace campus redevelopment",
    geometry_source: "Approximate point placed at White City Place/Wood Lane from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; tenant occupation, public-realm access, later phases, and estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_va_photography_centre_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/cultural retrofit",
    title: "V&A Photography Centre was listed as built",
    summary:
      "New London Architecture records the V&A Photography Centre in Kensington and Chelsea as built, with completion in 2023.",
    observed_change:
      "A documented cultural-gallery project at the Victoria and Albert Museum was recorded as reaching built status.",
    area: "South Kensington / Kensington and Chelsea",
    latitude: 51.496,
    longitude: -0.172,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: V&A Photography Centre",
    source_url: "https://nla.london/projects/va-photography-centre",
    source_record_id: "nla-va-photography-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Purcell",
    project_type: "museum gallery completion",
    geometry_source: "Approximate point placed at the Victoria and Albert Museum from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; gallery fit-out details, collection moves, visitor numbers, and long-term operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_elizabeth_tower_restoration_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/heritage restoration",
    title: "Elizabeth Tower restoration was listed as built",
    summary:
      "New London Architecture records Elizabeth Tower in Westminster as built, with completion in 2023.",
    observed_change:
      "A documented heritage-restoration project at Elizabeth Tower was recorded as reaching built status.",
    area: "Westminster",
    latitude: 51.501,
    longitude: -0.124,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Elizabeth Tower",
    source_url: "https://nla.london/projects/elizabeth-tower",
    source_record_id: "nla-elizabeth-tower",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Purcell",
    project_type: "heritage restoration completion",
    geometry_source: "Approximate point placed at Elizabeth Tower from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; detailed conservation records, construction phasing, access arrangements, and long-term maintenance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_100_george_st_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/mixed use housing",
    title: "100 George St. was listed as built",
    summary:
      "New London Architecture records 100 George St. in Westminster as built, with completion in 2025.",
    observed_change:
      "A documented mixed-use residential and hospitality project in Marylebone was recorded as reaching built status.",
    area: "Marylebone / Westminster",
    latitude: 51.516,
    longitude: -0.156,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 100 George St.",
    source_url: "https://nla.london/projects/100-george-st",
    source_record_id: "nla-100-george-st",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hopkins Architects",
    project_type: "mixed-use residential and hospitality completion",
    geometry_source: "Approximate point placed at 100 George Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, public access, operational start, and estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_st_lawrence_jewry_church_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/heritage restoration",
    title: "St Lawrence Jewry Church was listed as built",
    summary:
      "New London Architecture records St Lawrence Jewry Church in the City of London as built, with completion in 2023.",
    observed_change:
      "A documented church repair and heritage project near Guildhall Yard was recorded as reaching built status.",
    area: "Guildhall / City of London",
    latitude: 51.516,
    longitude: -0.092,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: St Lawrence Jewry Church",
    source_url: "https://nla.london/projects/st-lawrence-jewry-church",
    source_record_id: "nla-st-lawrence-jewry-church",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Julian Harrap Architects",
    project_type: "church repair and heritage restoration",
    geometry_source: "Approximate point placed at St Lawrence Jewry/Guildhall Yard from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; full conservation scope, worship/community use, access arrangements, and maintenance outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_former_whitney_landmark_designated_2025",
    date: "2025-05-20",
    bucket: "planning/development/architecture/landmark designation",
    title: "Former Whitney Museum was designated an individual and interior landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the former Whitney Museum of American Art at 945 Madison Avenue as an individual and interior landmark on May 20, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the former Whitney Museum building and interior to landmark status.",
    area: "Upper East Side / Manhattan",
    latitude: 40.774,
    longitude: -73.964,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: former Whitney Museum designation",
    source_url: nycFormerWhitneyRelease,
    source_record_id: "nyc-lpc-2025-05-20-former-whitney-museum",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Marcel Breuer and Associates",
    project_type: "individual and interior landmark designation",
    geometry_source: "Approximate point placed at 945 Madison Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, conversion delivery, building-condition change, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1_wall_street_banking_room_landmark_designated_2024",
    date: "2024-06-25",
    bucket: "planning/development/architecture/interior landmark designation",
    title: "1 Wall Street Banking Room was designated an interior landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the 1 Wall Street Banking Room Interior as an interior landmark on June 25, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the 1 Wall Street Banking Room Interior to interior landmark.",
    area: "Financial District / Manhattan",
    latitude: 40.707,
    longitude: -74.011,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: 1 Wall Street Banking Room",
    source_url: nycOneWallStreetRelease,
    source_record_id: "nyc-lpc-2024-06-25-1-wall-street-banking-room",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Ralph Walker; murals by Hildreth Meiere",
    project_type: "interior landmark designation",
    geometry_source: "Approximate point placed at 1 Wall Street from the LPC press-release location.",
    geometry_precision: "site approximate",
    limitations:
      "The event records interior landmark designation only. It does not confirm retail opening, restoration completion, residential conversion occupancy, permits, or later interior alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brooklyn_edison_building_landmark_designated_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/landmark designation",
    title: "Brooklyn Edison Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Brooklyn Edison Building at 345 Adams Street as an individual landmark on June 18, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Brooklyn Edison Building to individual landmark.",
    area: "Downtown Brooklyn",
    latitude: 40.693,
    longitude: -73.989,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Brooklyn Edison Building",
    source_url: nycBrooklynEdisonRelease,
    source_record_id: "nyc-lpc-2024-06-18-brooklyn-edison-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "McKenzie, Voorhees & Gmelin",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 345 Adams Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenancy, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_temple_court_atrium_landmark_designated_2024",
    date: "2024-06-04",
    bucket: "planning/development/architecture/interior landmark designation",
    title: "Temple Court Building atrium was designated an interior landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Temple Court Building, now The Beekman Hotel, atrium as an interior landmark on June 4, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Temple Court Building atrium to interior landmark.",
    area: "Civic Center / Manhattan",
    latitude: 40.711,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Temple Court Building atrium",
    source_url: nycTempleCourtRelease,
    source_record_id: "nyc-lpc-2024-06-04-temple-court-building-atrium",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Silliman & Farnsworth",
    project_type: "interior landmark designation",
    geometry_source: "Approximate point placed at the Temple Court/Beekman Hotel building from the LPC press-release location.",
    geometry_precision: "site approximate",
    limitations:
      "The event records interior landmark designation only. It does not confirm hotel operations, restoration completion, public-access hours, owner consent, permits, or later interior alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_heckscher_crown_building_landmark_designated_2024",
    date: "2024-05-14",
    bucket: "planning/development/architecture/landmark designation",
    title: "Heckscher Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Heckscher Building, now the Crown Building, at 730 Fifth Avenue as an individual landmark on May 14, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Heckscher Building to individual landmark.",
    area: "Midtown / Manhattan",
    latitude: 40.763,
    longitude: -73.974,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Heckscher Building",
    source_url: nycHeckscherRelease,
    source_record_id: "nyc-lpc-2024-05-14-heckscher-crown-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Warren & Wetmore",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 730 Fifth Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, hotel or retail operations, owner consent, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_cemetery_final_elements_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/heritage public realm",
    title: "City Cemetery visitor centre final elements were reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update recorded final City Cemetery Visitor Centre heritage-project elements, including the Victorian Fountain and central steps, as completed.",
    observed_change:
      "A documented Physical Programme update recorded final heritage and public-realm elements at City Cemetery as completed.",
    area: "Belfast City Cemetery",
    latitude: 54.594,
    longitude: -5.967,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-city-cemetery-final-elements",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and heritage project team; design team not named in the agenda item",
    project_type: "heritage/public-realm completion",
    geometry_source: "Approximate point placed at Belfast City Cemetery because the agenda item does not map the final elements.",
    geometry_precision: "site approximate",
    limitations:
      "The agenda item records recently completed final elements but does not provide exact completion dates, detailed conservation specifications, costs, contract records, maintenance plans, or visitor outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_lgbt_nhs_stained_glass_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/civic heritage public art",
    title: "City Hall LGBT and NHS stained-glass window was reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed the City Hall installation of a stained-glass window celebrating Belfast's LGBTQ+ community and the NHS among recently completed projects.",
    observed_change:
      "A documented Physical Programme update recorded completion of a civic stained-glass installation at City Hall.",
    area: "Belfast City Hall",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-city-hall-lgbt-nhs-stained-glass",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and civic-art project team; artist/design team not named in the agenda item",
    project_type: "civic stained-glass installation completion",
    geometry_source: "Approximate point placed at Belfast City Hall because the agenda item does not map the window location within the building.",
    geometry_precision: "site approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact installation date, artist, design drawings, conservation approvals, cost, interpretation text, or visitor/access arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_parklands_knocknagoney_environmental_improvements_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/open space improvement",
    title: "Parklands Knocknagoney environmental improvements were reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed Parklands - Knocknagoney Dale environmental improvements to Knocknagoney Park among recently completed projects.",
    observed_change:
      "A documented Physical Programme update recorded open-space environmental improvements at Knocknagoney Park as completed.",
    area: "Knocknagoney Park / Parklands",
    latitude: 54.615,
    longitude: -5.828,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-parklands-knocknagoney-environmental-improvements",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and open-space project team; design team not named in the agenda item",
    project_type: "open-space environmental improvement completion",
    geometry_source: "Approximate point placed at Knocknagoney Park because the agenda item does not map the works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact completion date, scope drawings, habitat/landscape specification, developer-contribution record, cost, maintenance plan, or measured environmental outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cherryvale_gate_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/parks infrastructure",
    title: "Cherryvale Gate project was reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed Cherryvale Gate among recently completed enhancements to Council assets.",
    observed_change:
      "A documented Physical Programme update recorded a completed parks/access infrastructure project at Cherryvale Gate.",
    area: "Cherryvale",
    latitude: 54.58,
    longitude: -5.884,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-cherryvale-gate",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks project team; design team not named in the agenda item",
    project_type: "park access infrastructure completion",
    geometry_source: "Approximate point placed in the Cherryvale area because the agenda item does not provide the gate location.",
    geometry_precision: "site approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact completion date, gate location, design specification, cost, contract record, access changes, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_hwrc_service_bay_works_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/waste infrastructure",
    title: "HWRC service bay works at Palmerston and Ormeau were reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed HWRCs Service Bay Works - Palmerston and Ormeau among recently completed enhancements to Council assets.",
    observed_change:
      "A documented Physical Programme update recorded completed household waste recycling centre service-bay works at Palmerston and Ormeau.",
    area: "Palmerston / Ormeau",
    latitude: 54.58,
    longitude: -5.91,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-hwrc-service-bay-works-palmerston-ormeau",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and waste infrastructure project team; design team not named in the agenda item",
    project_type: "waste-service infrastructure completion",
    geometry_source: "Multi-site works represented by an approximate South/East Belfast point because the agenda item does not map the Palmerston and Ormeau service bays.",
    geometry_precision: "multi-site approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact completion dates, facility drawings, bay specifications, cost, operational changes, maintenance plan, or usage outcomes."
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
