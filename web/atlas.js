(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  const DEFAULT_CITY = "belfast";
  const DEFAULT_YEAR = 2024;
  const MAX_MARKERS = 90;
  const EVENT_LIST_BATCH_SIZE = 24;
  const PLAY_RATE_YEARS_PER_SECOND = 1.4;
  const GRAND_CENTRAL_EVENT_IDS = new Set([
    "official-2024-grand-central",
    "bfs_arch_grand_central_station_opening_2024",
  ]);
  const DETAIL_RADIUS_OPTIONS = [500, 800, 1200, 1500, 2500];

  const TILE_PROVIDER = {
    name: "OpenStreetMap Standard",
    attribution: "OpenStreetMap contributors",
    template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  // The new UI uses "layers" — we map them to the OpenCityLog event categories.
  const LAYERS = [
    { id: "transport",         label: "Transport",        color: "#1B7A85" },
    { id: "built_environment", label: "Planning & Built", color: "#C8472E" },
    { id: "civic_services",    label: "Civic services",   color: "#D69423" },
    { id: "economy",           label: "Economy",          color: "#7A3B7A" },
    { id: "environment",       label: "Environment",      color: "#3F6B3A" },
    { id: "utilities",         label: "Utilities",        color: "#8C7460" },
  ];
  const LAYER_BY_ID = new Map(LAYERS.map((l) => [l.id, l]));
  const MAP_LENSES = [
    {
      id: "transport",
      layerId: "transport",
      label: "Transport",
      shortLabel: "Transport",
      summary: "Route and street-segment activity from source-backed transport records.",
      empty: "No transport linework is available for the selected year and filters.",
      caveat: "Line color is a mapped activity surface, not measured traffic speed, congestion, or capacity.",
      legend: [
        { label: "Lower activity", color: "#2f8f46", shape: "line" },
        { label: "Moderate activity", color: "#d6a33e", shape: "line" },
        { label: "Higher activity", color: "#c8472e", shape: "line" },
      ],
    },
    {
      id: "built_environment",
      layerId: "built_environment",
      label: "Planning & Built",
      shortLabel: "Built",
      summary: "Planning cells, building footprints, and site records from available source-backed geometry.",
      empty: "No footprint or site geometry is available for the selected year and filters.",
      caveat: "Planning cells are evidence grids, not parcel boundaries. Belfast footprints use OSM visibility proxy dates where available.",
      legend: [
        { label: "Permitted or proposed cell", color: "#d6a33e", shape: "polygon" },
        { label: "Construction or completion", color: "#c8472e", shape: "polygon" },
        { label: "Mapped/inferred or uncertain", color: "#8f9d9d", shape: "outline" },
        { label: "Source-backed site point", color: "#c8472e", shape: "square" },
      ],
    },
    {
      id: "civic_services",
      layerId: "civic_services",
      label: "Civic Services",
      shortLabel: "Civic",
      summary: "Service evidence cells plus small facility glyphs where records have geometry.",
      empty: "No civic service records with usable geometry match the selected year and filters.",
      caveat: "Coverage cells are evidence grids around facility records, not surveyed service catchments or capacity areas.",
      legend: [
        { label: "Health or education cell", color: "#2a84a6", shape: "polygon" },
        { label: "Community/leisure cell", color: "#d69423", shape: "polygon" },
        { label: "Facility point", color: "#2a84a6", shape: "plus" },
      ],
    },
    {
      id: "economy",
      layerId: "economy",
      label: "Economy",
      shortLabel: "Economy",
      summary: "Activity cells and nearest mapped frontage ribbons from source-backed economy records.",
      empty: "No economy records with usable geometry match the selected year and filters.",
      caveat: "Frontage ribbons reuse nearest OSM street geometry for context; they are not measured footfall, spend, or vacancy.",
      legend: [
        { label: "Commercial or office cell", color: "#7a3b7a", shape: "polygon" },
        { label: "Hospitality/visitor cell", color: "#d69423", shape: "polygon" },
        { label: "Nearest frontage ribbon", color: "#c8472e", shape: "line" },
      ],
    },
    {
      id: "utilities",
      layerId: "utilities",
      label: "Utilities",
      shortLabel: "Utilities",
      summary: "Streetwork and infrastructure traces plus small asset/work glyphs where records have geometry.",
      empty: "No utilities records with usable geometry match the selected year and filters.",
      caveat: "Utility traces are nearest mapped street/work context only. No capacity data is inferred.",
      legend: [
        { label: "Utility or work trace", color: "#8c7460", shape: "line" },
        { label: "Repair/disruption status", color: "#c8472e", shape: "line" },
        { label: "Observed or mapped asset point", color: "#8c7460", shape: "bolt" },
      ],
    },
  ];
  const MAP_LENS_BY_ID = new Map(MAP_LENSES.map((lens) => [lens.id, lens]));
  const DEFAULT_MAP_LENS = "transport";
  const LENS_ASPECTS = [
    {
      id: "transport-speed",
      category: "transport",
      domain: "Transport Lens",
      badge: "T",
      label: "Speed",
      shortLabel: "Speed",
      title: "Flow-speed network",
      description: "How fast traffic is moving and where delays are forming.",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-speed",
      panelMode: "transport",
      summary: "Road and transit segments are colored by source-backed transport activity around the selected event.",
      caveat: "Speed colors are derived from activity records and mapped context, not live or measured congestion.",
      layers: [
        { id: "transport", label: "Roads (speed)", color: "#138b43", categoryToggle: true },
        { id: "public_transport", label: "Public transport", color: "#ef3d2f" },
        { id: "cycle_network", label: "Cycle network", color: "#f0a719" },
        { id: "rail", label: "Rail", color: "#7a3b97" },
        { id: "parking", label: "Parking", color: "#4f8f50" },
        { id: "incidents", label: "Incidents", color: "#7f563d" },
      ],
      legend: [
        { label: "> 60 (free flow)", color: "#2d9f57", shape: "line" },
        { label: "40-60", color: "#6dbc5a", shape: "line" },
        { label: "20-40", color: "#f2ad2f", shape: "line" },
        { label: "10-20", color: "#e95a35", shape: "line" },
        { label: "< 10 (stop / crawl)", color: "#bb1e2d", shape: "line" },
      ],
    },
    {
      id: "transport-access",
      category: "transport",
      domain: "Transport Lens",
      badge: "T",
      label: "Access",
      shortLabel: "Access",
      title: "Isochrone accessibility fabric",
      description: "What's reachable within time by walk, bus, or rail?",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-access",
      panelMode: "transport",
      summary: "Door-to-door access bands are generated from the selected event location and current transport network evidence.",
      caveat: "Walk and recalibrated accessibility surfaces are indicative and may be incomplete.",
      layers: [
        { id: "transport", label: "Walk network", color: "#0f8d95", categoryToggle: true },
        { id: "bus_network", label: "Bus network", color: "#2873c5" },
        { id: "rail_network", label: "Rail network", color: "#7b2fa1" },
        { id: "ferry_routes", label: "Ferry routes", color: "#42a0a7" },
        { id: "stations_stops", label: "Stations & stops", color: "#6d7678" },
        { id: "barriers", label: "Barriers & terrain", color: "#b9b9b2" },
      ],
      legend: [
        { label: "15 min", color: "#e97761", shape: "polygon" },
        { label: "30 min", color: "#edbd62", shape: "polygon" },
        { label: "45 min", color: "#dcd776", shape: "polygon" },
        { label: "60 min", color: "#9bcf9d", shape: "polygon" },
        { label: "> 60 min", color: "#7fc0bf", shape: "outline" },
      ],
    },
    {
      id: "transport-reliability",
      category: "transport",
      domain: "Transport Lens",
      badge: "T",
      label: "Reliability",
      shortLabel: "Reliable",
      title: "Service reliability threads",
      description: "Which services are running, disrupted, or planned?",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-reliability",
      panelMode: "transport",
      summary: "Line styles distinguish reliable, delayed, interrupted, planned, and inferred service threads.",
      caveat: "Service data may be partial or delayed; planned lines are not delivered service.",
      layers: [
        { id: "transport", label: "Roads (base)", color: "#0f8d95", categoryToggle: true },
        { id: "public_transport", label: "Public transport", color: "#248b94" },
        { id: "rail", label: "Rail", color: "#7a3b97" },
        { id: "cycle_network", label: "Cycle network", color: "#2d75b8" },
        { id: "parking", label: "Parking", color: "#4f8f50" },
        { id: "incidents", label: "Incidents", color: "#7f563d" },
      ],
      legend: [
        { label: "Reliable (on-time)", color: "#248b94", shape: "line" },
        { label: "Unreliable (delayed)", color: "#ef9c1a", shape: "outline" },
        { label: "Interrupted", color: "#ed3f2b", shape: "line" },
        { label: "Planned / future", color: "#7a3b97", shape: "outline" },
        { label: "Inferred / uncertain", color: "#898b8e", shape: "outline" },
      ],
    },
    {
      id: "planning-pressure",
      category: "built_environment",
      domain: "Planning & Built Lens",
      badge: "A",
      label: "Pressure",
      shortLabel: "Pressure",
      title: "Planning-pressure field",
      description: "Where planning activity and pressure are concentrated right now.",
      radiusM: 800,
      accent: "#d84a2d",
      mapMode: "planning-pressure",
      panelMode: "planning",
      summary: "Planning cells and edges show concentrations of applications, completions, vacancy, and redevelopment records.",
      caveat: "Pressure is descriptive source density, not a forecast of construction or value change.",
      layers: [
        { id: "built_environment", label: "Planning applications", color: "#d84a2d", categoryToggle: true },
        { id: "objections", label: "Objections / appeals", color: "#f07b2b" },
        { id: "completions", label: "Completions", color: "#4b9661" },
        { id: "vacant_sites", label: "Vacant sites", color: "#258a8e" },
        { id: "redevelopment", label: "Redevelopment pressure", color: "#b91f32" },
        { id: "uncertainty", label: "Uncertainty (inferred)", color: "#75418d" },
      ],
      legend: [
        { label: "Very high", color: "#b91f32", shape: "line" },
        { label: "High", color: "#d84a2d", shape: "line" },
        { label: "Medium", color: "#efaa3c", shape: "line" },
        { label: "Low", color: "#77aaa1", shape: "line" },
        { label: "Very low", color: "#8fb2bd", shape: "line" },
      ],
    },
    {
      id: "planning-delta",
      category: "built_environment",
      domain: "Planning & Built Lens",
      badge: "2",
      label: "Delta",
      shortLabel: "Delta",
      title: "Urban-form delta map",
      description: "Change in building mass and land use.",
      radiusM: 800,
      accent: "#d84a2d",
      mapMode: "planning-delta",
      panelMode: "planning",
      summary: "Current and before footprints are compared with height and land-use change cells.",
      caveat: "Building deltas use available mapped visibility and administrative records; timing may be approximate.",
      layers: [
        { id: "built_environment", label: "Current footprint", color: "#d84a2d", categoryToggle: true },
        { id: "before_footprint", label: "Before footprint", color: "#cf6a57" },
        { id: "height_change", label: "Height change", color: "#6f3a8f" },
        { id: "land_use_change", label: "Land-use change", color: "#e5a52d" },
        { id: "major_developments", label: "Major developments", color: "#258a8e" },
        { id: "demolitions", label: "Demolitions", color: "#6d7678" },
      ],
      legend: [
        { label: "Current footprint", color: "#d84a2d", shape: "polygon" },
        { label: "Before footprint", color: "#cf6a57", shape: "outline" },
        { label: "+25 and above", color: "#6f3a8f", shape: "polygon" },
        { label: "-10 to -25", color: "#347b7f", shape: "polygon" },
        { label: "No data", color: "#b8b6a8", shape: "outline" },
      ],
    },
    {
      id: "planning-parcels",
      category: "built_environment",
      domain: "Planning & Built Lens",
      badge: "P",
      label: "Parcels",
      shortLabel: "Parcels",
      title: "Parcel-stage mosaic",
      description: "Lifecycle stage of parcels and buildings.",
      radiusM: 800,
      accent: "#d84a2d",
      mapMode: "planning-parcels",
      panelMode: "planning",
      summary: "Planning cells are colored as proposed, permitted, construction, completed, demolished, or unknown.",
      caveat: "Cells are source-backed evidence areas, not surveyed parcel boundaries.",
      layers: [
        { id: "built_environment", label: "Parcels (stage)", color: "#d84a2d", categoryToggle: true },
        { id: "proposed", label: "Proposed", color: "#ef7775" },
        { id: "permitted", label: "Permitted", color: "#f2c45f" },
        { id: "construction", label: "Under construction", color: "#7e68b8" },
        { id: "completed", label: "Completed", color: "#6f9c7b" },
        { id: "demolished", label: "Demolished", color: "#d95992" },
        { id: "unknown", label: "Unknown / early", color: "#b8b6a8" },
      ],
      legend: [
        { label: "Proposed", color: "#ef7775", shape: "polygon" },
        { label: "Permitted", color: "#f2c45f", shape: "polygon" },
        { label: "Under construction", color: "#7e68b8", shape: "polygon" },
        { label: "Completed", color: "#6f9c7b", shape: "polygon" },
        { label: "Demolished", color: "#d95992", shape: "polygon" },
        { label: "Unknown / early", color: "#b8b6a8", shape: "outline" },
      ],
    },
    {
      id: "civic-access-gaps",
      category: "civic_services",
      domain: "Civic Services Lens",
      badge: "B",
      label: "Access Gaps",
      shortLabel: "Gaps",
      title: "Access gap seams",
      description: "Where access is hardest and service coverage is weakest.",
      radiusM: 1500,
      accent: "#e59f15",
      mapMode: "civic-gaps",
      panelMode: "civic",
      summary: "Street segments and coverage cells highlight places with low service density or longer travel time.",
      caveat: "OSM mapped visibility may differ from real-world service availability.",
      layers: [
        { id: "civic_services", label: "Transport network", color: "#0f8d95", categoryToggle: true },
        { id: "coverage", label: "Service coverage (walk/bus)", color: "#6daeb5" },
        { id: "gap_seams", label: "Access gap seams", color: "#ed4a2e" },
        { id: "facilities", label: "Civic services", color: "#74449a" },
        { id: "corridors", label: "Underserved corridors", color: "#ef8f21" },
        { id: "boundaries", label: "Boundaries", color: "#8c5b3a" },
      ],
      legend: [
        { label: "High gap (very underserved)", color: "#ed4a2e", shape: "line" },
        { label: "Medium gap", color: "#ef8f21", shape: "outline" },
        { label: "Low gap", color: "#e4b33c", shape: "outline" },
        { label: "Adequate access", color: "#348f67", shape: "outline" },
        { label: "Study area", color: "#0f8d95", shape: "outline" },
      ],
    },
    {
      id: "civic-catchment",
      category: "civic_services",
      domain: "Civic Services Lens",
      badge: "C",
      label: "Catchment",
      shortLabel: "Catchment",
      title: "Service catchment cells",
      description: "Where services are available and how demand is met.",
      radiusM: 1500,
      accent: "#e5a91c",
      mapMode: "civic-catchment",
      panelMode: "civic",
      summary: "Generated catchment cells group nearby source-backed civic records by service type and demand capacity.",
      caveat: "Catchment cells are derived evidence areas and should not be read as official service boundaries.",
      layers: [
        { id: "civic_services", label: "Schools", color: "#178f8f", categoryToggle: true },
        { id: "health", label: "Health clinics", color: "#e85b1e" },
        { id: "libraries", label: "Libraries", color: "#79419d" },
        { id: "leisure", label: "Leisure centres", color: "#347db5" },
        { id: "council", label: "Council offices", color: "#26858a" },
        { id: "safety", label: "Safety services", color: "#8c5b3a" },
      ],
      legend: [
        { label: "Very high (>120%)", color: "#58a69f", shape: "polygon" },
        { label: "High (90-120%)", color: "#a6c7a4", shape: "polygon" },
        { label: "Medium (60-90%)", color: "#e6d690", shape: "polygon" },
        { label: "Low (30-60%)", color: "#efb367", shape: "polygon" },
        { label: "Very low (<30%)", color: "#e68c70", shape: "polygon" },
      ],
    },
    {
      id: "civic-demand",
      category: "civic_services",
      domain: "Civic Services Lens",
      badge: "D",
      label: "Demand",
      shortLabel: "Demand",
      title: "Demand-pressure grid",
      description: "Where demand outpaces provision and how it is shifting.",
      radiusM: 1500,
      accent: "#e5a91c",
      mapMode: "civic-demand",
      panelMode: "civic",
      summary: "A generated demand grid blends civic evidence density with proximity to the selected event.",
      caveat: "Demand pressure is derived from observed records and context; it is not a population model.",
      layers: [
        { id: "civic_services", label: "Transport network", color: "#0f8d95", categoryToggle: true },
        { id: "facilities", label: "Service facilities", color: "#2a8aa2" },
        { id: "demand_grid", label: "Demand-pressure grid", color: "#e5a91c" },
        { id: "displacement", label: "Demand-displacement", color: "#dc4a3b" },
        { id: "boundary", label: "Study boundary", color: "#75418d" },
        { id: "neighbourhoods", label: "Neighbourhoods", color: "#2a8a8d" },
      ],
      legend: [
        { label: "Very high (>150%)", color: "#cf3d4d", shape: "polygon" },
        { label: "High (100-150%)", color: "#ed7c62", shape: "polygon" },
        { label: "Medium (50-100%)", color: "#efc06d", shape: "polygon" },
        { label: "Low (10-50%)", color: "#8fbfba", shape: "polygon" },
        { label: "Surplus (<0%)", color: "#55a39d", shape: "polygon" },
      ],
    },
    {
      id: "economy-vitality",
      category: "economy",
      domain: "Economy Lens",
      badge: "V",
      label: "Vitality",
      shortLabel: "Vitality",
      title: "Street-front vitality ribbons",
      description: "Street-front vitality ribbons. Commercial street frontages colored by vacancy and performance. Ribbon thickness = business density; notices show churn.",
      radiusM: 800,
      accent: "#7b3a8f",
      mapMode: "economy-vitality",
      panelMode: "economy",
      summary: "Nearest frontage ribbons are styled by commercial activity, openings, closures, and inferred vitality.",
      caveat: "Frontage ribbons reuse nearest mapped street geometry and are not measured footfall, spend, or vacancy.",
      layers: [
        { id: "economy", label: "Street-front vitality", color: "#7b3a8f", categoryToggle: true },
        { id: "vacancy", label: "Vacancy rate", color: "#ed3135" },
        { id: "footfall", label: "Footfall (index)", color: "#188a98" },
        { id: "spend", label: "Spend (index)", color: "#f0a51b" },
        { id: "openings", label: "Openings (12 mo)", color: "#5eaa4e" },
        { id: "closures", label: "Closures (12 mo)", color: "#8c5b3a" },
      ],
      legend: [
        { label: "Very high", color: "#6d2f90", shape: "line" },
        { label: "High", color: "#a552a8", shape: "line" },
        { label: "Medium", color: "#f0a51b", shape: "line" },
        { label: "Low", color: "#ee3f47", shape: "line" },
        { label: "Very low", color: "#1693a3", shape: "line" },
      ],
    },
    {
      id: "economy-land-use",
      category: "economy",
      domain: "Economy Lens",
      badge: "L",
      label: "Land Use",
      shortLabel: "Land Use",
      title: "Land-use pulse tiles",
      description: "Block-level economic state with before / current comparison.",
      radiusM: 800,
      accent: "#7b3a8f",
      mapMode: "economy-land-use",
      panelMode: "economy",
      summary: "Economy evidence cells show active retail, vacancy, office, hospitality, residential conversion, and other use signals.",
      caveat: "Land-use pulse cells are source-backed activity evidence, not authoritative parcel land-use classifications.",
      layers: [
        { id: "economy", label: "Land-use (current)", color: "#ca3b32", categoryToggle: true },
        { id: "change", label: "Before / current change", color: "#158c97" },
        { id: "activity_index", label: "Economic activity index", color: "#0f7888" },
        { id: "vacancy_index", label: "Vacancy index", color: "#db7772" },
        { id: "footfall_index", label: "Footfall (index)", color: "#f2b144" },
        { id: "business_density", label: "Business density", color: "#8a8f8a" },
      ],
      legend: [
        { label: "Active retail", color: "#ca3b32", shape: "polygon" },
        { label: "Vacant / low activity", color: "#df8884", shape: "polygon" },
        { label: "Office / business", color: "#158c97", shape: "polygon" },
        { label: "Hospitality / leisure", color: "#7b3a8f", shape: "polygon" },
        { label: "Residential conversion", color: "#f0b342", shape: "polygon" },
      ],
    },
    {
      id: "economy-gravity",
      category: "economy",
      domain: "Economy Lens",
      badge: "2",
      label: "Gravity",
      shortLabel: "Gravity",
      title: "Economic gravity corridors",
      description: "Flows between activity anchors and economic destinations.",
      radiusM: 1500,
      accent: "#7b3a8f",
      mapMode: "economy-gravity",
      panelMode: "economy",
      summary: "Flow arcs connect the selected event to nearby source-backed activity anchors and destination clusters.",
      caveat: "Flow strength is a derived co-location signal, not measured pedestrian or spending flow.",
      layers: [
        { id: "economy", label: "Retail & services", color: "#7644a1", categoryToggle: true },
        { id: "office", label: "Office & business", color: "#158c97" },
        { id: "hospitality", label: "Hospitality", color: "#ef5a47" },
        { id: "visitor", label: "Visitor & culture", color: "#e8a620" },
        { id: "night", label: "Night economy", color: "#34393a" },
        { id: "markets", label: "Markets & venues", color: "#8a5a2b" },
      ],
      legend: [
        { label: "Retail & services", color: "#7644a1", shape: "line" },
        { label: "Office & business", color: "#158c97", shape: "line" },
        { label: "Hospitality", color: "#ef5a47", shape: "line" },
        { label: "Visitor & culture", color: "#e8a620", shape: "line" },
        { label: "Inferred / low confidence", color: "#8d8f91", shape: "outline" },
      ],
    },
    {
      id: "utilities-capacity",
      category: "utilities",
      domain: "Utilities Lens",
      badge: "U",
      label: "Capacity",
      shortLabel: "Capacity",
      title: "Network capacity x-ray",
      description: "See where utility assets are constrained or at risk.",
      radiusM: 800,
      accent: "#6c4a82",
      mapMode: "utilities-capacity",
      panelMode: "utilities",
      summary: "Current OSM water/power context and dated utility records are colored by descriptive load-risk bands.",
      caveat: "No capacity data is inferred; load-risk styling is descriptive, and current OSM context may post-date the selected year.",
      layers: [
        { id: "utilities", label: "Power", color: "#ef6b2a", categoryToggle: true, utilityType: "electricity" },
        { id: "water", label: "Water", color: "#2f85bd", utilityType: "water" },
        { id: "telecoms", label: "Telecoms", color: "#7a3b97", utilityType: "telecoms" },
        { id: "gas", label: "Gas", color: "#e2b42c", utilityType: "gas" },
        { id: "drainage", label: "Drainage", color: "#148a8d", utilityType: "drainage" },
        { id: "district_energy", label: "District energy", color: "#7a5438", utilityType: "district_energy" },
      ],
      legend: [
        { label: "Very high (>90%)", color: "#d62d35", shape: "line" },
        { label: "High (70-90%)", color: "#ed6b35", shape: "line" },
        { label: "Medium (40-70%)", color: "#e5b734", shape: "line" },
        { label: "Low (<40%)", color: "#438c64", shape: "line" },
        { label: "No data", color: "#888", shape: "outline" },
      ],
    },
    {
      id: "utilities-resilience",
      category: "utilities",
      domain: "Utilities Lens",
      badge: "R",
      label: "Resilience",
      shortLabel: "Resilience",
      title: "Service resilience paths",
      description: "Trace critical infrastructure routes, alternates and single points of failure.",
      radiusM: 1500,
      accent: "#e85b1f",
      mapMode: "utilities-resilience",
      panelMode: "utilities",
      summary: "Primary, backup, and inferred service paths are drawn from current OSM utility context plus dated records.",
      caveat: "Service paths and exposure areas are descriptive guides, not outage proof or engineering capacity data; utility records may be partial.",
      layers: [
        { id: "utilities", label: "Water network", color: "#1787b3", categoryToggle: true, utilityType: "water" },
        { id: "power_network", label: "Power network", color: "#ef6b2a", utilityType: "electricity" },
        { id: "telecoms_network", label: "Telecoms network", color: "#7a3b97", utilityType: "telecoms" },
        { id: "gas_network", label: "Gas network", color: "#e2b42c", utilityType: "gas" },
        { id: "drainage_network", label: "Drainage network", color: "#148a8d", utilityType: "drainage" },
        { id: "district_energy", label: "District energy", color: "#7a5438", utilityType: "district_energy" },
      ],
      legend: [
        { label: "Primary feeder", color: "#1787b3", shape: "line" },
        { label: "Backup path", color: "#1787b3", shape: "outline" },
        { label: "Inferred / planned", color: "#1787b3", shape: "outline" },
        { label: "Single point of failure", color: "#d53236", shape: "diamond" },
        { label: "Outage boundary", color: "#b93234", shape: "outline" },
      ],
    },
    {
      id: "utilities-works",
      category: "utilities",
      domain: "Utilities Lens",
      badge: "W",
      label: "Works",
      shortLabel: "Works",
      title: "Maintenance and disruption timeline map",
      description: "What works are happening where and when?",
      radiusM: 800,
      accent: "#0f7d8a",
      mapMode: "utilities-works",
      panelMode: "utilities",
      summary: "Utility works are styled by planned work, repair, failure, permit, and reinstatement quality.",
      caveat: "OSM mapped visibility and permit records may differ from real-world works dates.",
      layers: [
        { id: "utilities", label: "Utility works (all)", color: "#248b94", categoryToggle: true },
        { id: "planned", label: "Planned works", color: "#e8a620" },
        { id: "repair", label: "Repair", color: "#e34d42" },
        { id: "failure", label: "Failure", color: "#cf3337" },
        { id: "permit", label: "Permit / consents", color: "#774a92" },
        { id: "reinstatement", label: "Reinstatement quality", color: "#7b5c44" },
      ],
      legend: [
        { label: "Planned works", color: "#248b94", shape: "line" },
        { label: "Repair", color: "#e8a620", shape: "line" },
        { label: "Failure / outage", color: "#cf3337", shape: "line" },
        { label: "Permit / consent", color: "#774a92", shape: "outline" },
        { label: "Reinstatement works", color: "#4f8f50", shape: "outline" },
      ],
    },
  ];
  const LENS_ASPECT_BY_ID = new Map(LENS_ASPECTS.map((lens) => [lens.id, lens]));
  const LENS_ASPECTS_BY_CATEGORY = LENS_ASPECTS.reduce((map, lens) => {
    if (!map.has(lens.category)) map.set(lens.category, []);
    map.get(lens.category).push(lens);
    return map;
  }, new Map());
  const DEFAULT_LENS_ASPECT_BY_CATEGORY = {
    transport: "transport-speed",
    built_environment: "planning-pressure",
    civic_services: "civic-access-gaps",
    economy: "economy-vitality",
    utilities: "utilities-capacity",
    environment: "civic-catchment",
  };
  const POINT_LENS_IDS = new Set(["transport", "built_environment", "civic_services", "economy", "utilities"]);
  const DETAIL_SOURCE_ID = "osm-detail";
  const DETAIL_LENS_LAYER_IDS = [
    "lens-built-footprints-fill",
    "lens-built-footprints-outline",
    "lens-built-footprints-year",
  ];
  const DETAIL_LAYER_IDS = [
    "detail-roads-current",
    "detail-buildings-fill",
    "detail-buildings-extrusion",
    "detail-buildings-outline",
    "detail-roads-visible",
    "detail-roads-year",
    "detail-buildings-year-outline",
  ];
  const LENS_SOURCE_ID = "lens-overlays";
  const LENS_DETAIL_SOURCE_ID = "lens-detail-overlays";
  const LENS_GUIDE_SOURCE_ID = "lens-guide-overlays";
  const LENS_ROAD_BASE_SOURCE_ID = "lens-transport-road-base";
  const LENS_ROAD_SOURCE_ID = "lens-transport-road-year";
  const UTILITY_NETWORK_SOURCE_ID = "lens-utility-network-context";
  const LENS_CALLOUT_IDS = new Set([
    "civic-access-gaps",
    "civic-catchment",
    "economy-gravity",
  ]);
  const LENS_GUIDE_LAYER_IDS = [
    "lens-guide-area-fill",
    "lens-guide-area-line",
    "lens-guide-ring-line",
    "lens-guide-cell-fill",
    "lens-guide-cell-line",
    "lens-guide-coverage-flow-case",
    "lens-guide-coverage-flow",
    "lens-guide-flow-case",
    "lens-guide-flow",
    "lens-guide-node",
    "lens-guide-icon-node",
  ];
  const LENS_DETAIL_LAYER_IDS = [
    "lens-planning-cells-fill",
    "lens-planning-cells-outline",
    "lens-civic-coverage-fill",
    "lens-civic-coverage-outline",
    "lens-civic-facility-icons",
    "lens-economy-cells-fill",
    "lens-economy-cells-outline",
    "lens-economy-frontage-case",
    "lens-economy-frontage",
    "lens-utilities-trace-case",
    "lens-utilities-trace",
    "lens-utility-asset-icons",
  ];
  const LENS_UTILITY_NETWORK_LAYER_IDS = [
    "lens-utility-network-case",
    "lens-utility-network",
    "lens-utility-network-assets",
  ];
  const LENS_LAYER_IDS = [
    ...LENS_GUIDE_LAYER_IDS,
    "lens-heatmap",
    "lens-current-points-glow",
    "lens-current-points",
    ...DETAIL_LENS_LAYER_IDS,
    ...LENS_DETAIL_LAYER_IDS,
    ...LENS_UTILITY_NETWORK_LAYER_IDS,
    "lens-built-site-icons",
    "lens-transport-event-halo",
    "lens-transport-event-points",
    "lens-civic-icons",
    "lens-economy-icons",
    "lens-utilities-icons",
    "lens-transport-base-case",
    "lens-transport-base",
    "lens-transport-roads-case",
    "lens-transport-roads",
    "lens-transport-hotspots",
  ];

  // Curated proposals shown in the Proposal Lens overlay. These are illustrative
  // historical-analogue cases for the lens; they do not depend on per-city event
  // chunks loading. Keeping them as a tiny static list lets the lens stay
  // useful without recomputing analogues from event metadata each request.
  const PROPOSALS = [
    {
      id: "p-belfast-glider-northsouth",
      city: "belfast",
      title: "Belfast Glider North–South extension",
      type: "Transit · BRT",
      decision: "DfI scoping 2026",
      summary: "Extending the Glider corridor north and south of the city centre to reach North Belfast and the Cathedral Quarter rail interchange.",
      analogs: [
        {
          place: "Belfast",
          title: "Glider G1/G2 launch",
          year: 2018,
          layer: "transport",
          outcomes: [
            { k: "Daily boardings", v: "30,000" },
            { k: "Bus speed (peak)", v: "+22%" },
            { k: "Bus mode share corridor", v: "+5 pts" },
          ],
        },
        {
          place: "London",
          title: "East London Overground",
          year: 2009,
          layer: "transport",
          outcomes: [
            { k: "Daily entries (Dalston Jn)", v: "38,400" },
            { k: "Punctuality (PPM)", v: "95.6%" },
            { k: "Observed ridership difference", v: "+38%" },
          ],
        },
        {
          place: "Seoul",
          title: "Line 9 East extension",
          year: 2011,
          layer: "transport",
          outcomes: [
            { k: "Observed ridership difference", v: "+12%" },
            { k: "1km rent uplift", v: "+19%" },
            { k: "Cycle/bus modal", v: "−4%" },
          ],
        },
      ],
      distribution: {
        "Observed ridership difference": "+12% — +38%",
        "Rent uplift within 1km": "+8% — +24%",
        "Bus speed (parallel)": "+4% — +22%",
        "Local NO₂ change": "−3% — −9%",
      },
    },
    {
      id: "p-belfast-cathedralquarter",
      city: "belfast",
      title: "Cathedral Quarter regeneration phase 3",
      type: "Mixed-use regeneration",
      decision: "Belfast City Council review 2026",
      summary: "Continued regeneration of Belfast's Cathedral Quarter with mixed-use development around York Street and the new Ulster University campus.",
      analogs: [
        {
          place: "London",
          title: "King's Cross Central",
          year: 2007,
          layer: "built_environment",
          outcomes: [
            { k: "Affordable delivered", v: "40%" },
            { k: "Rent uplift 1km", v: "+38%" },
            { k: "Office GIA", v: "325k m²" },
          ],
        },
        {
          place: "Belfast",
          title: "Titanic Quarter masterplan",
          year: 2012,
          layer: "built_environment",
          outcomes: [
            { k: "Workspace delivered", v: "150,000 m²" },
            { k: "Visitor arrivals", v: "850k/yr" },
            { k: "Affordable %", v: "low" },
          ],
        },
        {
          place: "Seoul",
          title: "Dongdaemun Design Plaza",
          year: 2014,
          layer: "environment",
          outcomes: [
            { k: "Annual visitors", v: "8.6M" },
            { k: "GIA", v: "86,574 m²" },
            { k: "Adjacent rent change", v: "+25%" },
          ],
        },
      ],
      distribution: {
        "Affordable housing delivered": "9% — 40%",
        "Rent uplift within 1km (5y)": "+18% — +52%",
        "Public realm added": "0.4 ha — 10 ha",
        "Workspace GIA": "82k — 325k m²",
      },
    },
    {
      id: "p-belfast-cyclenet",
      city: "belfast",
      title: "Belfast Cycle Network completion",
      type: "Cycling · protected lanes",
      decision: "DfI Cycle Network 2030 draft",
      summary: "Closing the gaps in the protected cycling network across central and inner Belfast, including segregated lanes on Donegall Pass and the Westlink corridor.",
      analogs: [
        {
          place: "London",
          title: "Cycle Superhighway CS3",
          year: 2014,
          layer: "transport",
          outcomes: [
            { k: "Daily cyclists", v: "13,400" },
            { k: "Daily growth vs baseline", v: "+345%" },
            { k: "Cycle KSI rate", v: "−40%" },
          ],
        },
        {
          place: "Seoul",
          title: "Cheonggyecheon restoration",
          year: 2005,
          layer: "environment",
          outcomes: [
            { k: "Corridor air temp", v: "−3.6°C" },
            { k: "Daily visitors", v: "64,000" },
            { k: "Adjacent rents", v: "+30–50%" },
          ],
        },
        {
          place: "Berlin",
          title: "Friedrichshain pop-up bike lanes",
          year: 2020,
          layer: "transport",
          outcomes: [
            { k: "Cycle counts", v: "+25%" },
            { k: "Adjacent NO₂", v: "−12%" },
            { k: "Cyclist KSI", v: "−18%" },
          ],
        },
      ],
      distribution: {
        "Daily cyclists growth": "+25% — +345%",
        "Cyclist KSI change": "−40% — −18%",
        "Adjacent NO₂": "−12% — −3%",
        "Bus journey time impact": "+0% — +4%",
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    index: null,
    cityId: DEFAULT_CITY,
    cityMeta: null,
    city: null,
    availability: null,
    availabilityError: null,
    sources: [],
    sourceById: new Map(),
    eventsIndex: null,
    chunks: new Map(),                 // year -> chunk metadata
    years: [],
    yearRange: [2007, 2026],
    year: DEFAULT_YEAR,
    activeLayers: new Set(LAYERS.map((l) => l.id)),
    activeLens: DEFAULT_MAP_LENS,
    activeAspect: DEFAULT_LENS_ASPECT_BY_CATEGORY[DEFAULT_MAP_LENS],
    activeAspectLayers: new Set(),
    confidenceFilter: "all",
    showInferred: true,
    search: "",
    eventListLimit: EVENT_LIST_BATCH_SIZE,
    loadedEvents: new Map(),           // year -> array of events
    loadingYears: new Map(),
    yearLoadErrors: new Map(),
    eventById: new Map(),
    selectedEventId: null,
    selectedEvent: null,
    detailBeforeYear: null,
    detailRadiusM: null,
    pendingCameraFocusEventId: null,
    playing: false,
    playRaf: null,
    map: null,
    mapReady: false,
    markers: new Map(),                // eventId -> maplibregl.Marker
    theme: "light",
    changelogOpen: true,
    compareOpen: false,
    compareBeforeYear: null,
    compareAfterYear: null,
    compareEvidenceLoadingKey: "",
    detailEvidenceLoadingKey: "",
    mapTilted: false,
    lensOpen: false,
    methodOpen: false,
    welcomeOpen: false,
    currentProposalId: PROPOSALS[0].id,
    detailLayerLoaded: false,
    detailLayerError: null,
    detailLayerPathLoaded: null,
    lensOverlayLoaded: false,
    lensOverlayError: null,
    transportRoadBasePathLoaded: null,
    transportRoadYearPathLoaded: null,
    transportRoadYearLoaded: null,
    transportRoadFeatureCountPathLoaded: null,
    transportRoadFeatureCountYearLoaded: null,
    transportRoadFeatureCount: null,
    transportRoadFeatures: [],
    transportRoadFeaturesPathLoaded: null,
    transportStopFeaturesPathLoaded: null,
    transportStopFeatures: [],
    utilityNetworkPathLoaded: null,
    utilityNetworkFeaturesPathLoaded: null,
    utilityNetworkFeatures: [],
    economyAnchorFeaturesPathLoaded: null,
    economyAnchorFeatures: [],
    civicServiceFeaturesPathLoaded: null,
    civicServiceFeatures: [],
    detailFeaturePathLoaded: null,
    detailBuildingFeatures: [],
    detailRoadFeatures: [],
    lensDetailYearPathLoaded: null,
    lensDetailYearLoaded: null,
    lensDetailFeaturePathLoaded: null,
    lensDetailFeatures: [],
    lensEventFeatureCount: 0,
    lensEventSourceKey: "",
    lensInteractiveLayers: new Set(),
    lensGuideFeatureCache: { type: "FeatureCollection", features: [] },
    lensGuideLabelLayer: null,
    lensGuideLabelRaf: null,
  };

  const els = {};

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) {
      state.changelogOpen = false;
    }
    collectElements();
    setChangelogOpen(state.changelogOpen);
    wireEvents();
    resetActiveAspectLayers();
    renderActiveLensHeader();
    renderLayers();
    renderLensSwitcher();
    renderAspectSwitcher();
    renderProposalLensList();
    renderLensOutcomes(currentProposal());
    renderLensAnalogs(currentProposal());
    updateLensHead();
    setAppStatus("Loading source-backed city atlas…");
    try {
      await loadIndex();
      await loadCity(initialCityId());
      setAppStatus("");
    } catch (error) {
      console.error("[atlas] failed to load", error);
      setAppStatus(`Failed to load atlas: ${error.message}`);
    }
  }

  function collectElements() {
    const ids = [
      "map", "appStatus", "toast", "toastText",
      "cityToggle", "cityNameLabel", "cityMenu",
      "searchInput", "searchResults",
      "changelogToggle", "changelogPanel", "eventList", "eventListCount", "eventListMeta", "eventListMore",
      "compareBtn", "comparePanel", "compareClose", "compareBeforeYear", "compareAfterYear", "compareStats", "compareNote",
      "recenterBtn", "tiltBtn",
      "methodBtn", "shareBtn", "themeBtn",
      "mapStudyChip", "mapStudyChipText",
      "layersPanel", "layersList", "layersCount", "lensSwitcher", "lensAspectSwitcher", "lensLegend", "lensDataState",
      "activeLensCard", "activeLensIcon", "activeLensDomain", "activeLensTitle", "activeLensDescription",
      "confidenceFilter", "showInferredToggle", "coverageNote",
      "detailPanel", "detailEmpty", "detailInner", "emptyCityName",
      "lensFab", "lensOverlay", "lensClose", "lensTitle", "lensType",
      "lensDecision", "lensSummary", "lensProposals", "lensAnalogs",
      "lensOutcomes", "lensExport", "lensDiscuss",
      "methodOverlay", "methodClose", "methodDatasetTable", "methodCities",
      "tlYear", "tlVisible", "tlTotal", "tlCity", "tlLayers",
      "playBtn", "playIcon",
      "tlTrack", "tlHistogram", "tlAxis", "tlCursor", "tlScrub",
      "welcome", "welcomeCity", "welcomeStart", "welcomeSkip",
    ];
    for (const id of ids) els[id] = document.getElementById(id);
  }

  function wireEvents() {
    // City switcher
    els.cityToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !els.cityMenu.hasAttribute("hidden");
      open ? els.cityMenu.setAttribute("hidden", "") : els.cityMenu.removeAttribute("hidden");
    });
    document.addEventListener("click", () => els.cityMenu?.setAttribute("hidden", ""));
    els.cityMenu?.addEventListener("click", (e) => e.stopPropagation());

    // Search
    els.searchInput?.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      renderSearchResults();
      resetEventListLimit();
      renderEventList();
      syncTopline();
      updateTimeDependentMapState();
      renderMarkers();
    });
    els.searchInput?.addEventListener("focus", () => renderSearchResults());
    els.searchInput?.addEventListener("blur", () => {
      // delay so click on a result can fire first
      setTimeout(() => els.searchResults?.setAttribute("hidden", ""), 160);
    });

    // Layers panel: confidence + inferred toggle
    els.confidenceFilter?.addEventListener("change", async () => {
      state.confidenceFilter = els.confidenceFilter.value;
      resetEventListLimit();
      renderAll();
      updateTimeDependentMapState();
      renderMarkers();
      await reconcileSelectionWithFilters({ keepCamera: true });
    });
    els.showInferredToggle?.addEventListener("change", async () => {
      state.showInferred = !!els.showInferredToggle.checked;
      resetEventListLimit();
      renderAll();
      updateTimeDependentMapState();
      renderMarkers();
      await reconcileSelectionWithFilters({ keepCamera: true });
    });

    // Methodology
    els.methodBtn?.addEventListener("click", () => setMethodOpen(true));
    els.methodClose?.addEventListener("click", () => setMethodOpen(false));

    // Restored atlas controls
    els.changelogToggle?.addEventListener("click", () => setChangelogOpen(!state.changelogOpen));
    els.eventListMore?.addEventListener("click", () => {
      state.eventListLimit += EVENT_LIST_BATCH_SIZE;
      renderEventList();
    });
    els.compareBtn?.addEventListener("click", () => setCompareOpen(!state.compareOpen));
    els.compareClose?.addEventListener("click", () => setCompareOpen(false));
    els.compareBeforeYear?.addEventListener("change", () => {
      state.compareBeforeYear = Number(els.compareBeforeYear.value);
      renderComparePanel();
    });
    els.compareAfterYear?.addEventListener("change", () => {
      state.compareAfterYear = Number(els.compareAfterYear.value);
      renderComparePanel();
    });
    els.recenterBtn?.addEventListener("click", recenterMap);
    els.tiltBtn?.addEventListener("click", toggleMapTilt);

    // Share
    els.shareBtn?.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("city", state.cityId);
      url.searchParams.set("year", String(state.year));
      url.searchParams.set("lens", state.activeAspect || state.activeLens);
      await copyText(url.toString(), "Permalink copied - view shared with city and year");
    });

    // Theme
    els.themeBtn?.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", state.theme);
    });

    // Welcome
    els.welcomeStart?.addEventListener("click", () => setWelcomeOpen(false));
    els.welcomeSkip?.addEventListener("click", () => setWelcomeOpen(false));

    // Proposal Lens
    els.lensFab?.addEventListener("click", () => setLensOpen(true));
    els.lensClose?.addEventListener("click", () => setLensOpen(false));
    els.lensExport?.addEventListener("click", () => toast("Export coming soon — every analogue carries its source chain"));
    els.lensDiscuss?.addEventListener("click", () => toast("Team workspaces ship in the next OpenCityLog drop"));

    // Timeline play
    els.playBtn?.addEventListener("click", togglePlay);

    // Timeline scrub
    let scrubbing = false;
    const scrubFromEvent = (e) => {
      const track = els.tlTrack;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const [yStart, yEnd] = state.yearRange;
      const next = Math.round(yStart + f * (yEnd - yStart));
      setYear(next);
    };
    els.tlScrub?.addEventListener("pointerdown", (e) => {
      scrubbing = true;
      stopPlay();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      scrubFromEvent(e);
    });
    els.tlScrub?.addEventListener("pointermove", (e) => { if (scrubbing) scrubFromEvent(e); });
    els.tlScrub?.addEventListener("pointerup", () => { scrubbing = false; });

    // Keyboard
    document.addEventListener("keydown", (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowRight") setYear(Math.min(state.yearRange[1], state.year + 1));
      else if (e.key === "ArrowLeft") setYear(Math.max(state.yearRange[0], state.year - 1));
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "/") { e.preventDefault(); els.searchInput?.focus(); }
      else if (e.key.toLowerCase() === "p") setLensOpen(true);
      else if (e.key === "Escape") {
        if (state.lensOpen) setLensOpen(false);
        else if (state.methodOpen) setMethodOpen(false);
        else if (state.compareOpen) setCompareOpen(false);
        else if (state.welcomeOpen) setWelcomeOpen(false);
        else if (state.selectedEventId) clearSelection();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  async function loadIndex() {
    state.index = await fetchJson("/data/city-atlas/index.json");
    renderCityMenu();
  }

  async function loadCity(cityId) {
    stopPlay();
    state.cityId = cityId;
    state.cityMeta = cityMeta(cityId);
    if (!state.cityMeta) throw new Error(`City not found: ${cityId}`);

    setAppStatus(`Loading ${shortCityName(state.cityMeta.display_name)}…`);

    const paths = state.cityMeta.artifact_paths || {};
    const [cityDoc, eventsIndex, sourcesDoc, availabilityDoc] = await Promise.all([
      fetchJson(dataPathToUrl(paths.city)),
      fetchJson(dataPathToUrl(paths.events)),
      fetchJson(dataPathToUrl(paths.sources)),
      paths.availability
        ? fetchJson(dataPathToUrl(paths.availability)).catch((error) => ({ __error: error }))
        : Promise.resolve(null),
    ]);

    state.city = cityDoc;
    state.eventsIndex = eventsIndex;
    state.availability = availabilityDoc && !availabilityDoc.__error ? availabilityDoc : null;
    state.availabilityError = availabilityDoc?.__error?.message || null;
    state.chunks = new Map((eventsIndex.chunks || []).map((c) => [Number(c.year), c]));
    state.sources = sourcesDoc.sources || [];
    state.sourceById = new Map(state.sources.map((s) => [s.source_id, s]));
    state.years = (eventsIndex.event_years || [...state.chunks.keys()])
      .map(Number).filter(Number.isFinite).sort((a, b) => a - b);

    if (state.years.length) {
      state.yearRange = [state.years[0], state.years[state.years.length - 1]];
    }
    // pick a sensible default year
    const params = new URL(window.location.href).searchParams;
    const requestedEventId = initialEventId();
    const requestedAspect = normalizeLensAspectId(params.get("lens") || params.get("aspect"));
    const requestedLens = requestedAspect
      ? LENS_ASPECT_BY_ID.get(requestedAspect).category
      : normalizeMapLensId(params.get("lens"));
    state.activeLens = requestedLens || state.activeLens || DEFAULT_MAP_LENS;
    state.activeAspect = requestedAspect || defaultAspectForCategory(state.activeLens);
    const desiredYear = Number(params.get("year"));
    if (Number.isFinite(desiredYear) && state.years.includes(desiredYear)) {
      state.year = desiredYear;
    } else if (state.years.includes(DEFAULT_YEAR)) {
      state.year = DEFAULT_YEAR;
    } else {
      state.year = state.years[state.years.length - 1] || DEFAULT_YEAR;
    }

    state.loadedEvents.clear();
    state.loadingYears.clear();
    state.yearLoadErrors.clear();
    state.eventById.clear();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.detailBeforeYear = null;
    state.detailRadiusM = null;
    state.pendingCameraFocusEventId = null;
    state.search = "";
    state.eventListLimit = EVENT_LIST_BATCH_SIZE;
    state.compareOpen = false;
    resetActiveAspectLayers();
    state.compareBeforeYear = compareDefaultBeforeYear();
    state.compareAfterYear = state.year;
    state.mapTilted = false;
    state.detailLayerError = null;
    state.lensOverlayError = null;
    state.lensEventFeatureCount = 0;
    state.lensEventSourceKey = "";
    if (els.searchInput) els.searchInput.value = "";

    setText(els.cityNameLabel, shortCityName(state.city.display_name));
    setText(els.welcomeCity, shortCityName(state.city.display_name));
    setText(els.emptyCityName, shortCityName(state.city.display_name));
    setText(els.tlCity, shortCityName(state.city.display_name));

    renderCityMenu();
    renderAll();
    initOrUpdateMap();

    // Preload current year for snappier first interaction
    await loadYear(state.year);
    await loadLensYearsForTimeline(state.year);
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    setAppStatus("");
    if (requestedEventId) {
      await selectEvent(requestedEventId, { silent: true });
    }
    if (!state.selectedEvent) await selectFirstVisibleEvent();
  }

  async function loadYear(year) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return [];
    if (state.loadedEvents.has(numericYear)) return state.loadedEvents.get(numericYear);
    if (state.loadingYears.has(numericYear)) return state.loadingYears.get(numericYear);

    const chunk = state.chunks.get(numericYear);
    if (!chunk?.json_path) {
      state.loadedEvents.set(numericYear, []);
      return [];
    }
    const promise = fetchJson(dataPathToUrl(chunk.json_path))
      .then((payload) => {
        const arr = Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload?.features) ? payload.features : []);
        const events = arr.map((raw, idx) => normalizeEvent(raw, numericYear, idx));
        state.loadedEvents.set(numericYear, events);
        state.yearLoadErrors.delete(numericYear);
        for (const e of events) state.eventById.set(e.id, e);
        return events;
      })
      .catch((err) => {
        console.warn(`[atlas] year ${numericYear} failed to load`, err);
        state.yearLoadErrors.set(numericYear, err.message || String(err));
        state.loadedEvents.set(numericYear, []);
        return [];
      })
      .finally(() => state.loadingYears.delete(numericYear));
    state.loadingYears.set(numericYear, promise);
    return promise;
  }

  async function loadLensYearsForTimeline(year = state.year) {
    const target = currentTimelineYear(year);
    const start = Math.max(earliestTimelineYear(), target - 2);
    const years = [];
    for (let candidate = start; candidate <= target; candidate += 1) {
      if (state.chunks.has(candidate) || state.years.includes(candidate)) years.push(candidate);
    }
    await Promise.all(years.map((candidate) => loadYear(candidate)));
  }

  function normalizeEvent(raw, fallbackYear, index) {
    const props = raw.properties || raw;
    const geom = raw.geometry || props.geometry || null;
    const sourceIds = props.source_ids || props.sources || [];
    const event = {
      id: String(props.event_id || raw.id || props.id || `${fallbackYear}-${index}`),
      title: cleanTitle(props.title),
      shortDescription: cleanSummary(props.short_description || props.summary || props.explanation || ""),
      year: Number(props.year || fallbackYear),
      effectiveDate: props.effective_date || "",
      effectiveDateRange: props.effective_date_range || null,
      datePrecision: props.date_precision || "",
      sourceDateField: props.source_date_field || "",
      category: props.category || "built_environment",
      lens: props.lens || props.category || "city_change",
      confidence: props.confidence || "documented",
      summary: cleanSummary(props.explanation || props.summary || ""),
      area: props.affected_area?.label || props.affected_area_label || "",
      sourceIds: Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : [sourceIds].filter(Boolean),
      evidence: Array.isArray(props.evidence) ? props.evidence : [],
      affectedSignals: Array.isArray(props.affected_signals) ? props.affected_signals : [],
      impactDeltas: Array.isArray(props.impact_deltas) ? props.impact_deltas : [],
      trafficMetrics: props.traffic_metrics || null,
      caveats: Array.isArray(props.caveats) ? props.caveats : [],
      provenance: props.provenance || {},
      geometry: geom,
    };
    event.lngLat = geometryToLngLat(geom);
    return event;
  }

  function geometryToLngLat(geom) {
    if (!geom) return null;
    if (geom.type === "Point" && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
      const [lng, lat] = geom.coordinates;
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates?.[0])) {
      return averageRing(geom.coordinates[0]);
    }
    if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
      return averageRing(geom.coordinates);
    }
    return null;
  }
  function averageRing(coords) {
    let lng = 0, lat = 0, n = 0;
    for (const [x, y] of coords) {
      if (Number.isFinite(x) && Number.isFinite(y)) { lng += x; lat += y; n += 1; }
    }
    return n ? [lng / n, lat / n] : null;
  }

  function offsetLngLat(origin, dxMeters, dyMeters) {
    const [lng, lat] = origin;
    const latRad = lat * Math.PI / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = Math.max(1, Math.cos(latRad) * 111320);
    return [lng + dxMeters / metersPerDegreeLng, lat + dyMeters / metersPerDegreeLat];
  }

  function circlePolygon(center, radiusM, steps = 72) {
    const ring = [];
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      ring.push(offsetLngLat(center, Math.cos(angle) * radiusM, Math.sin(angle) * radiusM));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function ellipsePolygon(center, radiusXM, radiusYM, rotation = 0, steps = 72) {
    const ring = [];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const x = Math.cos(angle) * radiusXM;
      const y = Math.sin(angle) * radiusYM;
      ring.push(offsetLngLat(center, x * cos - y * sin, x * sin + y * cos));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function isochronePolygon(center, radiusM, seed = 1) {
    const ring = [];
    const steps = 96;
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const wobble = 0.86
        + Math.sin(angle * 3 + seed * 0.9) * 0.08
        + Math.cos(angle * 5 - seed * 0.55) * 0.05;
      const r = radiusM * Math.max(0.68, Math.min(1.12, wobble));
      ring.push(offsetLngLat(center, Math.cos(angle) * r, Math.sin(angle) * r));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function hexPolygon(center, radiusM) {
    const ring = [];
    for (let i = 0; i <= 6; i += 1) {
      const angle = (Math.PI / 6) + (i / 6) * Math.PI * 2;
      ring.push(offsetLngLat(center, Math.cos(angle) * radiusM, Math.sin(angle) * radiusM));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function squarePolygon(center, halfSizeM) {
    const ring = [
      offsetLngLat(center, -halfSizeM, -halfSizeM),
      offsetLngLat(center, halfSizeM, -halfSizeM),
      offsetLngLat(center, halfSizeM, halfSizeM),
      offsetLngLat(center, -halfSizeM, halfSizeM),
      offsetLngLat(center, -halfSizeM, -halfSizeM),
    ];
    return { type: "Polygon", coordinates: [ring] };
  }

  function lngLatDistanceMeters(a, b) {
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const dx = (b[0] - a[0]) * Math.cos(lat) * 111320;
    const dy = (b[1] - a[1]) * 111320;
    return Math.hypot(dx, dy);
  }

  function curvedLine(start, end, bend = 0.18) {
    const sx = start[0], sy = start[1], ex = end[0], ey = end[1];
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const dx = ex - sx;
    const dy = ey - sy;
    const control = [mx - dy * bend, my + dx * bend];
    const coords = [];
    for (let i = 0; i <= 28; i += 1) {
      const t = i / 28;
      const inv = 1 - t;
      coords.push([
        inv * inv * sx + 2 * inv * t * control[0] + t * t * ex,
        inv * inv * sy + 2 * inv * t * control[1] + t * t * ey,
      ]);
    }
    return coords;
  }

  function lngLatToLocalMeters(point, origin) {
    const latRad = Number(origin?.[1] || 0) * Math.PI / 180;
    const metersPerDegreeLng = Math.max(1, Math.cos(latRad) * 111320);
    return [
      (Number(point?.[0]) - Number(origin?.[0])) * metersPerDegreeLng,
      (Number(point?.[1]) - Number(origin?.[1])) * 111320,
    ];
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function stableUnit(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 10000) / 10000;
  }

  // ---------------------------------------------------------------------------
  // Map — preserves the original MapLibre + OSM stack
  // ---------------------------------------------------------------------------

  function initOrUpdateMap() {
    if (!els.map || !window.maplibregl) return;
    const center = mapCenter();
    const zoom = Number(state.city?.default_zoom || 11.5);

    if (state.map) {
      state.map.jumpTo({ center, zoom, pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0 });
      setTimeout(() => state.map.resize(), 60);
      updateTimeDependentMapState();
      updateMapToolState();
      return;
    }

    state.map = new window.maplibregl.Map({
      container: els.map,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: [TILE_PROVIDER.template],
            tileSize: 256,
            attribution: TILE_PROVIDER.attribution,
          },
        },
        layers: [{
          id: "basemap",
          type: "raster",
          source: "basemap",
          paint: {
            "raster-fade-duration": 180,
            "raster-saturation": -0.82,
            "raster-contrast": -0.16,
            "raster-brightness-min": 0.66,
            "raster-brightness-max": 1,
          },
        }],
      },
      center,
      zoom,
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });
    state.map.addControl(new window.maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    }), "bottom-right");
    state.map.addControl(new window.maplibregl.AttributionControl({
      compact: true,
    }), "bottom-left");

    const onReady = () => {
      if (state.mapReady) return;
      state.mapReady = true;
      state.map.resize();
      updateTimeDependentMapState();
      renderMarkers();
      focusPendingCameraEvent(0);
    };
    state.map.on("load", onReady);
    state.map.once("idle", onReady);
    state.map.on("move", scheduleLensGuideLabelRender);
    state.map.on("zoom", scheduleLensGuideLabelRender);
    state.map.on("resize", scheduleLensGuideLabelRender);
    try { state.map.triggerRepaint(); } catch (_e) { /* not yet ready */ }
  }

  function mapCenter() {
    const center = state.city?.default_center;
    if (Array.isArray(center) && center.length === 2) return center;
    return [-5.9301, 54.5973];
  }

  function renderMarkers() {
    if (!state.map) return;
    const selected = state.selectedEvent?.lngLat ? state.selectedEvent : null;
    const center = mapCenter();
    const localVisibleEvents = filteredEvents()
      .filter((event) => event.lngLat && event.confidence !== "inferred")
      .map((event) => ({ event, distance: lngLatDistanceMeters(center, event.lngLat) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 18)
      .map((item) => item.event);
    const leadingActiveEvents = filteredEvents()
      .filter((event) => event.lngLat && event.category === state.activeLens && event.confidence !== "inferred")
      .slice(0, Math.max(12, Math.floor(MAX_MARKERS / 3)));
    const scopedEvents = POINT_LENS_IDS.has(state.activeLens)
      ? lensPointEventsForActiveLens()
      : filteredEvents().filter((event) => event.lngLat);
    const markerCandidates = selected
      ? [selected, ...localVisibleEvents, ...leadingActiveEvents, ...scopedEvents]
      : [...localVisibleEvents, ...leadingActiveEvents, ...scopedEvents];
    const seenMarkerIds = new Set();
    const events = markerCandidates
      .filter((event) => {
        if (seenMarkerIds.has(event.id)) return false;
        seenMarkerIds.add(event.id);
        return true;
      })
      .slice(0, MAX_MARKERS);
    const eventIds = new Set(events.map((e) => e.id));

    // Remove markers that are no longer visible
    for (const [id, marker] of state.markers) {
      if (!eventIds.has(id)) {
        marker.remove();
        state.markers.delete(id);
      }
    }

    for (const event of events) {
      const existing = state.markers.get(event.id);
      if (existing) {
        const el = existing.getElement();
        el.className = "pin-wrap";
        el.style.zIndex = markerZIndex(event);
        const pin = el.querySelector(".pin");
        pin?.setAttribute("data-active", String(event.id === state.selectedEventId));
        pin?.setAttribute("aria-pressed", String(event.id === state.selectedEventId));
        const label = el.querySelector(".pin-label");
        if (label) label.innerHTML = `<strong>${escapeHtml(truncate(event.title, 54))}</strong><span>${event.year}</span>`;
        continue;
      }
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const el = document.createElement("div");
      el.className = "pin-wrap";
      el.style.zIndex = markerZIndex(event);
      el.innerHTML = `
        <div class="pin" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}" role="button" tabindex="0" aria-pressed="${event.id === state.selectedEventId}" aria-label="${escapeAttr(`${event.title}, ${event.year}`)}">
          <div class="pin-label">${escapeHtml(truncate(event.title, 60))} · ${event.year}</div>
        </div>`;
      const selectMarker = () => selectEvent(event.id);
      el.addEventListener("click", selectMarker);
      addPressHandler(el.querySelector(".pin"), selectMarker);
      const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(event.lngLat)
        .addTo(state.map);
      state.markers.set(event.id, marker);
    }
  }

  function markerZIndex(event) {
    if (event.id === state.selectedEventId) return "90";
    if (event.confidence === "corroborated") return "50";
    if (event.confidence === "documented") return "45";
    if (event.confidence === "disputed") return "35";
    return "25";
  }

  function scheduleLensGuideLabelRender() {
    if (state.lensGuideLabelRaf) return;
    state.lensGuideLabelRaf = window.requestAnimationFrame(() => {
      state.lensGuideLabelRaf = null;
      renderLensGuideLabels();
    });
  }

  function ensureLensGuideLabelLayer() {
    if (state.lensGuideLabelLayer?.isConnected) return state.lensGuideLabelLayer;
    if (!els.map) return null;
    const layer = document.createElement("div");
    layer.className = "lens-guide-label-layer";
    els.map.appendChild(layer);
    state.lensGuideLabelLayer = layer;
    return layer;
  }

  function renderLensGuideLabels() {
    const layer = ensureLensGuideLabelLayer();
    if (!layer) return;
    const lens = activeMapLens();
    const showLabels = state.map && state.mapReady
      && lens
      && LENS_CALLOUT_IDS.has(lens.id)
      && state.activeLayers.has(lens.category || state.activeLens)
      && window.innerWidth >= 900;
    if (!showLabels) {
      layer.setAttribute("hidden", "");
      layer.innerHTML = "";
      return;
    }
    const features = state.lensGuideFeatureCache?.features || [];
    const nodes = features
      .filter((feature) => {
        const props = feature.properties || {};
        if (["economy-gravity", "civic-catchment"].includes(lens.id) && props.sublayer_id && !activeSublayerIdsForLens(lens).includes(props.sublayer_id)) return false;
        return props.kind === "node"
          && props.node_style !== "transport"
          && (props.event_id || props.source_id)
          && feature.geometry?.type === "Point"
          && Array.isArray(feature.geometry.coordinates)
          && props.label;
      })
      .sort((a, b) => Number(a.properties?.label_rank || 999) - Number(b.properties?.label_rank || 999))
      .slice(0, Math.max(lensCalloutLimit(lens.id) * 3, 12));
    if (!nodes.length) {
      layer.setAttribute("hidden", "");
      layer.innerHTML = "";
      return;
    }

    const size = state.map.getContainer().getBoundingClientRect();
    const usable = {
      left: window.innerWidth < 1180 ? 20 : 300,
      right: Math.max(360, size.width - 470),
      top: 82,
      bottom: Math.max(260, size.height - 145),
    };
    const centerPx = state.map.project(state.selectedEvent?.lngLat || mapCenter());
    const exclusions = lensGuideLabelExclusions();
    const placed = [];
    const html = [];
    const limit = lensCalloutLimit(lens.id);
    for (const node of nodes) {
      if (html.length >= limit) break;
      const props = node.properties || {};
      const point = state.map.project(node.geometry.coordinates);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
      const label = String(props.label || props.title || "");
      const detail = String(props.label_detail || "");
      const width = Math.min(154, Math.max(92, label.length * 6.1 + 42));
      const height = detail ? 42 : 30;
      const anchor = chooseGuideLabelAnchor(point, centerPx, width, height, usable, placed, exclusions);
      if (!anchor) continue;
      const rect = guideLabelRect(point, anchor, width, height);
      placed.push(rect);
      html.push(`
        <button class="lens-guide-label" type="button" data-anchor="${anchor}" data-lens="${escapeAttr(lens.id)}" data-event-id="${escapeAttr(props.event_id || "")}" data-source-id="${escapeAttr(props.source_id || "")}" style="--accent:${escapeAttr(props.color || lens.accent || "#1b7a85")};left:${Math.round(point.x)}px;top:${Math.round(point.y)}px;width:${Math.round(width)}px" aria-label="${escapeAttr(`${label}${detail ? `, ${detail}` : ""}`)}">
          <span class="lens-guide-label-mark" aria-hidden="true"></span>
          <span class="lens-guide-label-copy">
            <strong>${escapeHtml(label)}</strong>
            ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
          </span>
        </button>
      `);
    }
    if (!html.length) {
      layer.setAttribute("hidden", "");
      layer.innerHTML = "";
      return;
    }
    layer.removeAttribute("hidden");
    layer.innerHTML = html.join("");
    layer.querySelectorAll(".lens-guide-label").forEach((button) => {
      button.addEventListener("click", () => {
        const eventId = button.getAttribute("data-event-id");
        if (eventId) selectEvent(eventId, { keepCamera: true });
      });
    });
  }

  function lensCalloutLimit(lensId) {
    if (lensId === "economy-gravity") return 9;
    if (lensId === "civic-access-gaps") return 8;
    if (lensId === "utilities-works") return 7;
    if (lensId.startsWith("utilities-")) return 8;
    if (lensId === "economy-vitality") return 7;
    return 6;
  }

  function lensGuideLabelExclusions() {
    const selectors = [
      ".topbar",
      "#layersPanel",
      "#changelogPanel",
      ".map-lens",
      "#detailPanel",
      ".map-tools",
      ".lens-fab",
      ".timeline",
    ];
    return selectors
      .map((selector) => document.querySelector(selector))
      .filter((el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
      })
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - 8,
          right: rect.right + 8,
          top: rect.top - 8,
          bottom: rect.bottom + 8,
        };
      });
  }

  function chooseGuideLabelAnchor(point, centerPx, width, height, usable, placed, exclusions = []) {
    const dx = point.x - centerPx.x;
    const dy = point.y - centerPx.y;
    const preferred = Math.abs(dx) > Math.abs(dy)
      ? (dx >= 0 ? "right" : "left")
      : (dy >= 0 ? "bottom" : "top");
    const anchors = [preferred, "right", "left", "top", "bottom"].filter((anchor, index, arr) => arr.indexOf(anchor) === index);
    for (const anchor of anchors) {
      const rect = guideLabelRect(point, anchor, width, height);
      if (rect.left < usable.left || rect.right > usable.right || rect.top < usable.top || rect.bottom > usable.bottom) continue;
      if (placed.some((other) => rectsOverlap(rect, other, 8))) continue;
      if (exclusions.some((excluded) => rectsOverlap(rect, excluded, 0))) continue;
      return anchor;
    }
    return "";
  }

  function guideLabelRect(point, anchor, width, height) {
    const gap = 12;
    if (anchor === "right") {
      return { left: point.x + gap, right: point.x + gap + width, top: point.y - height / 2, bottom: point.y + height / 2 };
    }
    if (anchor === "left") {
      return { left: point.x - gap - width, right: point.x - gap, top: point.y - height / 2, bottom: point.y + height / 2 };
    }
    if (anchor === "bottom") {
      return { left: point.x - width / 2, right: point.x + width / 2, top: point.y + gap, bottom: point.y + gap + height };
    }
    return { left: point.x - width / 2, right: point.x + width / 2, top: point.y - gap - height, bottom: point.y - gap };
  }

  function rectsOverlap(a, b, margin = 0) {
    return !(a.right + margin < b.left
      || a.left - margin > b.right
      || a.bottom + margin < b.top
      || a.top - margin > b.bottom);
  }

  // ---------------------------------------------------------------------------
  // Map lens overlays
  // ---------------------------------------------------------------------------

  function detailLayerPath() {
    const configured = state.cityMeta?.artifact_paths?.detail_layers || state.city?.artifact_paths?.detail_layers;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadBasePath() {
    const configured = state.cityMeta?.artifact_paths?.transport_roads_base || state.city?.artifact_paths?.transport_roads_base;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadYearPath(year = state.year) {
    const template = state.cityMeta?.artifact_paths?.transport_roads_template || state.city?.artifact_paths?.transport_roads_template;
    const numericYear = currentTimelineYear(year);
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function transportStopsPath() {
    const configured = state.cityMeta?.artifact_paths?.transport_stops || state.city?.artifact_paths?.transport_stops;
    if (configured) return dataPathToUrl(configured);
    return state.cityId
      ? dataPathToUrl(`web/data/city-atlas/cities/${state.cityId}/transport_stops_2026.geojson`)
      : "";
  }

  function utilityNetworkPath() {
    const configured = state.cityMeta?.artifact_paths?.utility_network || state.city?.artifact_paths?.utility_network;
    if (configured) return dataPathToUrl(configured);
    return state.cityId === "belfast"
      ? dataPathToUrl(`web/data/city-atlas/cities/${state.cityId}/utility_network_2026.geojson`)
      : "";
  }

  function economyAnchorPath() {
    const configured = state.cityMeta?.artifact_paths?.economy_anchors || state.city?.artifact_paths?.economy_anchors;
    if (configured) return dataPathToUrl(configured);
    return state.cityId === "belfast"
      ? dataPathToUrl(`web/data/city-atlas/cities/${state.cityId}/economy_anchors_2026.geojson`)
      : "";
  }

  function civicServiceContextPath() {
    const configured = state.cityMeta?.artifact_paths?.civic_services_context || state.city?.artifact_paths?.civic_services_context;
    if (configured) return dataPathToUrl(configured);
    return state.cityId === "belfast"
      ? dataPathToUrl(`web/data/city-atlas/cities/${state.cityId}/civic_services_2026.geojson`)
      : "";
  }

  function lensDetailYearPath(year = state.year) {
    const template = state.cityMeta?.artifact_paths?.lens_detail_template || state.city?.artifact_paths?.lens_detail_template;
    const numericYear = currentTimelineYear(year);
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function ensureDetailLayers() {
    if (!state.map || !state.mapReady) return;
    const path = detailLayerPath();
    if (!path) {
      removeDetailLayers();
      return;
    }

    try {
      const existing = state.map.getSource(DETAIL_SOURCE_ID);
      if (existing?.setData) {
        if (state.detailLayerPathLoaded !== path) existing.setData(path);
      } else {
        state.map.addSource(DETAIL_SOURCE_ID, { type: "geojson", data: path, generateId: true });
      }
      state.detailLayerPathLoaded = path;
      if (!state.map.getLayer("detail-roads-current")) addDetailLayers();
      state.detailLayerLoaded = true;
      state.detailLayerError = null;
      updateDetailFeatureCache(path);
      renderCoverageNote();
      updateDetailLayerFilters();
    } catch (error) {
      state.detailLayerLoaded = false;
      state.detailLayerError = error.message;
      renderCoverageNote();
      console.warn("[atlas] detail layer unavailable", error);
    }
  }

  function addDetailLayers() {
    state.map.addLayer({
      id: "detail-roads-current",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: ["==", ["get", "layer"], "road"],
      paint: {
        "line-color": "#a9c9bd",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.05, 14, 0.14, 17, 0.22],
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.3, 14, 0.9, 17, 2.2],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-fill",
      type: "fill",
      source: DETAIL_SOURCE_ID,
      minzoom: 10,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-color": detailBuildingColorExpression(),
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.1, 14, 0.22, 17, 0.34],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-extrusion",
      type: "fill-extrusion",
      source: DETAIL_SOURCE_ID,
      minzoom: 13,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-extrusion-color": detailBuildingColorExpression(),
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, ["to-number", ["get", "height_m"], 8]],
        "fill-extrusion-opacity": 0.38,
      },
    });
    state.map.addLayer({
      id: "detail-buildings-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 12,
      filter: detailVisibilityFilter("building"),
      paint: {
        "line-color": "#f4ead2",
        "line-opacity": 0.28,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 0.9],
      },
    });
    state.map.addLayer({
      id: "detail-roads-visible",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailVisibilityFilter("road"),
      paint: {
        "line-color": ["case", [">=", ["to-number", ["get", "rank"], 1], 3], "#d6a33e", "#1b7a85"],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.18, 14, 0.4, 17, 0.58],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.24],
          14, ["*", ["to-number", ["get", "rank"], 1], 0.62],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.1],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-roads-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailYearFilter("road"),
      paint: {
        "line-color": "#d2452f",
        "line-opacity": 0.78,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.48],
          14, ["*", ["to-number", ["get", "rank"], 1], 1.1],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.8],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-year-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 12,
      filter: detailYearFilter("building"),
      paint: {
        "line-color": "#d2452f",
        "line-opacity": 0.76,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 16, 1.8],
      },
    });
  }

  function removeDetailLayers() {
    if (!state.map) return;
    for (const layerId of [...DETAIL_LENS_LAYER_IDS, ...DETAIL_LAYER_IDS]) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    if (state.map.getSource(DETAIL_SOURCE_ID)) state.map.removeSource(DETAIL_SOURCE_ID);
    state.detailLayerLoaded = false;
    state.detailLayerPathLoaded = null;
    state.detailFeaturePathLoaded = null;
    state.detailBuildingFeatures = [];
    state.detailRoadFeatures = [];
  }

  function updateDetailFeatureCache(path) {
    if (!path) {
      state.detailFeaturePathLoaded = null;
      state.detailBuildingFeatures = [];
      state.detailRoadFeatures = [];
      return;
    }
    if (state.detailFeaturePathLoaded === path) return;
    state.detailFeaturePathLoaded = path;
    state.detailBuildingFeatures = [];
    state.detailRoadFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.detailFeaturePathLoaded !== path) return;
        const features = Array.isArray(payload.features) ? payload.features : [];
        state.detailBuildingFeatures = features.filter((feature) => feature.properties?.layer === "building" && feature.geometry);
        state.detailRoadFeatures = features.filter((feature) => feature.properties?.layer === "road" && feature.geometry);
        updateLensGuideSource();
      })
      .catch(() => {
        if (state.detailFeaturePathLoaded !== path) return;
        state.detailBuildingFeatures = [];
        state.detailRoadFeatures = [];
      });
  }

  function updateDetailLayerFilters() {
    if (!state.map?.getSource(DETAIL_SOURCE_ID)) return;
    for (const layerId of ["detail-buildings-fill", "detail-buildings-extrusion", "detail-buildings-outline"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, detailVisibilityFilter("building"));
    }
    if (state.map.getLayer("detail-buildings-fill")) {
      state.map.setPaintProperty("detail-buildings-fill", "fill-color", detailBuildingColorExpression());
    }
    if (state.map.getLayer("detail-buildings-extrusion")) {
      state.map.setPaintProperty("detail-buildings-extrusion", "fill-extrusion-color", detailBuildingColorExpression());
    }
    updateDetailLayerPaint();
    if (state.map.getLayer("detail-roads-visible")) state.map.setFilter("detail-roads-visible", detailVisibilityFilter("road"));
    if (state.map.getLayer("detail-roads-year")) state.map.setFilter("detail-roads-year", detailYearFilter("road"));
    if (state.map.getLayer("detail-buildings-year-outline")) state.map.setFilter("detail-buildings-year-outline", detailYearFilter("building"));
  }

  function detailVisibilityFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()]];
  }

  function detailYearFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()]];
  }

  function detailBuildingColorExpression() {
    const builtActive = isActiveMapLens("built_environment");
    return [
      "case",
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
      builtActive ? "#c8472e" : "#b88974",
      builtActive ? "#a9b08f" : "#b8b6a8",
    ];
  }

  function updateDetailLayerPaint() {
    const builtActive = isActiveMapLens("built_environment");
    const transportActive = isActiveMapLens("transport");
    if (state.map.getLayer("detail-buildings-fill")) {
      state.map.setPaintProperty(
        "detail-buildings-fill",
        "fill-opacity",
        ["interpolate", ["linear"], ["zoom"], 10, builtActive ? 0.1 : 0.03, 14, builtActive ? 0.2 : 0.08, 17, builtActive ? 0.3 : 0.14],
      );
    }
    if (state.map.getLayer("detail-buildings-extrusion")) {
      state.map.setPaintProperty("detail-buildings-extrusion", "fill-extrusion-opacity", builtActive ? 0.32 : 0.12);
    }
    if (state.map.getLayer("detail-roads-visible")) {
      state.map.setPaintProperty(
        "detail-roads-visible",
        "line-opacity",
        ["interpolate", ["linear"], ["zoom"], 10, transportActive ? 0.025 : 0.04, 14, transportActive ? 0.07 : 0.1, 17, transportActive ? 0.12 : 0.16],
      );
    }
    if (state.map.getLayer("detail-roads-year")) {
      state.map.setPaintProperty(
        "detail-roads-year",
        "line-opacity",
        ["interpolate", ["linear"], ["zoom"], 10, 0.03, 14, builtActive ? 0.12 : 0.06, 17, builtActive ? 0.18 : 0.09],
      );
    }
    if (state.map.getLayer("detail-buildings-year-outline")) {
      state.map.setPaintProperty("detail-buildings-year-outline", "line-opacity", builtActive ? 0.22 : 0.08);
    }
  }

  function ensureLensOverlays() {
    if (!state.map || !state.mapReady) return;
    const basePath = transportRoadBasePath();
    const yearPath = transportRoadYearPath(state.year);
    const detailPath = shouldLoadLensDetail() ? lensDetailYearPath(state.year) : "";

    try {
      const lensSource = state.map.getSource(LENS_SOURCE_ID);
      if (!lensSource) {
        state.map.addSource(LENS_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
      }

      const guideSource = state.map.getSource(LENS_GUIDE_SOURCE_ID);
      if (!guideSource) {
        state.map.addSource(LENS_GUIDE_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
      }

      const utilityNetworkSource = state.map.getSource(UTILITY_NETWORK_SOURCE_ID);
      const utilityPath = shouldLoadUtilityNetwork() ? utilityNetworkPath() : "";
      if (utilityPath) {
        if (utilityNetworkSource?.setData) {
          if (state.utilityNetworkPathLoaded !== utilityPath) utilityNetworkSource.setData(utilityPath);
        } else {
          state.map.addSource(UTILITY_NETWORK_SOURCE_ID, { type: "geojson", data: utilityPath, generateId: true });
        }
        state.utilityNetworkPathLoaded = utilityPath;
      } else if (!utilityNetworkSource) {
        state.map.addSource(UTILITY_NETWORK_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
        state.utilityNetworkPathLoaded = "";
      } else if (utilityNetworkSource?.setData && state.utilityNetworkPathLoaded !== "") {
        utilityNetworkSource.setData(emptyFeatureCollection());
        state.utilityNetworkPathLoaded = "";
      }

      const detailSource = state.map.getSource(LENS_DETAIL_SOURCE_ID);
      if (detailPath) {
        if (detailSource?.setData) {
          if (state.lensDetailYearPathLoaded !== detailPath) detailSource.setData(detailPath);
        } else {
          state.map.addSource(LENS_DETAIL_SOURCE_ID, { type: "geojson", data: detailPath, generateId: true });
        }
        state.lensDetailYearPathLoaded = detailPath;
        state.lensDetailYearLoaded = currentTimelineYear();
      } else if (!detailSource) {
        state.map.addSource(LENS_DETAIL_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      } else if (detailSource?.setData && state.lensDetailYearPathLoaded !== "") {
        detailSource.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      }

      if (basePath) {
        const baseSource = state.map.getSource(LENS_ROAD_BASE_SOURCE_ID);
        if (baseSource?.setData) {
          if (state.transportRoadBasePathLoaded !== basePath) baseSource.setData(basePath);
        } else {
          state.map.addSource(LENS_ROAD_BASE_SOURCE_ID, { type: "geojson", data: basePath, generateId: true });
        }
        state.transportRoadBasePathLoaded = basePath;
      }

      if (yearPath) {
        const roadSource = state.map.getSource(LENS_ROAD_SOURCE_ID);
        if (roadSource?.setData) {
          if (state.transportRoadYearPathLoaded !== yearPath) roadSource.setData(yearPath);
        } else {
          state.map.addSource(LENS_ROAD_SOURCE_ID, { type: "geojson", data: yearPath, generateId: true });
        }
        state.transportRoadYearPathLoaded = yearPath;
        state.transportRoadYearLoaded = currentTimelineYear();
        updateTransportRoadFeatureCount(yearPath, currentTimelineYear());
      }

      if (!state.map.getLayer("lens-civic-icons") || !state.map.getLayer("lens-transport-roads") || !state.map.getLayer("lens-planning-cells-fill")) {
        addLensOverlayLayers();
      } else {
        ensureBuiltFootprintLensLayers();
        addLensDetailLayers();
      }
      updateLensEventSource();
      updateLensGuideSource();
      state.lensOverlayLoaded = true;
      state.lensOverlayError = null;
      renderCoverageNote();
      updateLensOverlayFilters();
    } catch (error) {
      state.lensOverlayLoaded = false;
      state.lensOverlayError = error.message;
      renderCoverageNote();
      console.warn("[atlas] lens overlays unavailable", error);
    }
  }

  function addLensOverlayLayers() {
    ensureLensImages();
    ensureBuiltFootprintLensLayers();
    addUtilityNetworkLayers();
    addLensDetailLayers();
    addLensGuideLayers();
    addTransportEventLensLayers();
    addPointLensLayer("lens-built-site-icons", "built_environment", "lens-icon-built", 9.6, 0.72, false, 13.2);
    addPointLensLayer("lens-civic-icons", "civic_services", "lens-icon-civic", 10.2, 0.78, true);
    addPointLensLayer("lens-economy-icons", "economy", "lens-icon-economy", 9.8, 0.76, true);
    addPointLensLayer("lens-utilities-icons", "utilities", "lens-icon-utilities", 10.6, 0.78, true);
    bindLensInteractionLayers();

    if (
      !state.map.getSource(LENS_ROAD_BASE_SOURCE_ID)
      || !state.map.getSource(LENS_ROAD_SOURCE_ID)
      || state.map.getLayer("lens-transport-roads")
    ) return;
    state.map.addLayer({
      id: "lens-transport-base-case",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf7",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.12, 12, 0.34, 16, 0.58],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, ["*", transportRankExpression(), 0.34],
          12, ["*", transportRankExpression(), 0.72],
          16, ["*", transportRankExpression(), 1.18],
        ],
        "line-blur": 0.1,
      },
    });
    state.map.addLayer({
      id: "lens-transport-base",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#8bb6bd",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.06, 12, 0.18, 16, 0.34],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, ["*", transportRankExpression(), 0.18],
          12, ["*", transportRankExpression(), 0.36],
          16, ["*", transportRankExpression(), 0.76],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-transport-roads-case",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf7",
        "line-opacity": [
          "*",
          ["interpolate", ["linear"], transportActivityExpression(), 0, 0.08, 0.2, 0.22, 1, 0.46],
          ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.28, 2, 0.68, 3, 0.92, 4, 1],
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.42, ["*", transportActivityExpression(), 0.84]], transportRankExpression()],
          13, ["*", ["+", 0.68, ["*", transportActivityExpression(), 1.36]], transportRankExpression()],
          16, ["*", ["+", 0.96, ["*", transportActivityExpression(), 2.16]], transportRankExpression()],
        ],
        "line-blur": 0.16,
      },
    });
    state.map.addLayer({
      id: "lens-transport-roads",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: transportRoadPaint(),
    });
    state.map.addLayer({
      id: "lens-transport-hotspots",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportHotspotFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#c81f2d",
        "line-opacity": ["interpolate", ["linear"], transportActivityExpression(), 0, 0, 0.45, 0.035, 1, 0.08],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.54, ["*", transportActivityExpression(), 1.15]], transportRankExpression()],
          13, ["*", ["+", 0.9, ["*", transportActivityExpression(), 1.85]], transportRankExpression()],
          16, ["*", ["+", 1.24, ["*", transportActivityExpression(), 2.75]], transportRankExpression()],
        ],
        "line-blur": 0.4,
      },
    });
  }

  function addLensGuideLayers() {
    if (!state.map?.getSource(LENS_GUIDE_SOURCE_ID) || state.map.getLayer("lens-guide-area-fill")) return;
    state.map.addLayer({
      id: "lens-guide-area-fill",
      type: "fill",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "study_area"],
      layout: { visibility: "none" },
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#1b7a85"],
        "fill-opacity": [
          "match", ["get", "lens_id"],
          "utilities-capacity", 0,
          "utilities-resilience", 0,
          "utilities-works", 0,
          0.025,
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-area-line",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "study_area"],
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#1b7a85"],
        "line-opacity": [
          "match", ["get", "lens_id"],
          "utilities-capacity", 0,
          "utilities-resilience", 0,
          "utilities-works", 0,
          0.7,
        ],
        "line-width": 1.2,
        "line-dasharray": [4, 2],
      },
    });
    state.map.addLayer({
      id: "lens-guide-ring-line",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "range_ring"],
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#1b7a85"],
        "line-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.52],
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.75, 13, 1.25, 16, 1.85],
        "line-dasharray": [1.5, 2.4],
      },
    });
    state.map.addLayer({
      id: "lens-guide-cell-fill",
      type: "fill",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "surface_cell"],
      layout: { visibility: "none" },
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#d6a33e"],
        "fill-opacity": [
          "case",
          ["==", ["get", "surface_style"], "utility_outage_area"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.018, 1, 0.075],
          ["==", ["get", "surface_style"], "access_fabric"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.32, 1, 0.6],
          ["==", ["get", "surface_style"], "demand_surface"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.14, 0.34, 0.26, 0.64, 0.48, 1, 0.7],
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case",
            ["==", ["get", "lens_id"], "planning-delta"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.28, 0.45, 0.58, 1, 0.82],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.22, 0.55, 0.42, 1, 0.58],
          ],
          ["==", ["get", "surface_style"], "catchment_area"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.18, 0.58, 0.3, 1, 0.42],
          ["==", ["get", "surface_style"], "catchment_patch"],
          0.34,
          ["==", ["get", "surface_style"], "land_use_tile"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.22, 1, 0.68],
          ["==", ["get", "lens_id"], "civic-demand"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.12, 1, 0.46],
          ["==", ["get", "lens_id"], "civic-catchment"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.1, 1, 0.42],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.16, 1, 0.58],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-cell-line",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "surface_cell"],
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "surface_style"], "utility_outage_area"], "#b93234",
          ["==", ["get", "surface_style"], "access_fabric"], "#fff9e9",
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case", ["==", ["get", "lens_id"], "planning-delta"], "#f6ded5", "#fff7eb"],
          ["==", ["get", "surface_style"], "catchment_area"], "#fffaf0",
          ["==", ["get", "surface_style"], "land_use_tile"], "#fffaf0",
          "#ffffff",
        ],
        "line-opacity": [
          "case",
          ["==", ["get", "surface_style"], "utility_outage_area"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.32, 1, 0.72],
          ["==", ["get", "surface_style"], "access_fabric"], 0.22,
          ["==", ["get", "surface_style"], "demand_surface"], 0.12,
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case", ["==", ["get", "lens_id"], "planning-delta"], 0.24, 0.48],
          ["==", ["get", "surface_style"], "catchment_area"], 0.58,
          ["==", ["get", "surface_style"], "catchment_patch"], 0.32,
          ["==", ["get", "surface_style"], "land_use_tile"], 0.5,
          0.52,
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["case", ["==", ["get", "surface_style"], "land_use_tile"], 0.2, ["==", ["get", "surface_style"], "access_fabric"], 0.22, ["==", ["get", "surface_style"], "planning_footprint"], 0.2, ["==", ["get", "surface_style"], "catchment_area"], 0.42, 0.3],
          14, ["case", ["==", ["get", "surface_style"], "utility_outage_area"], 1.25, ["==", ["get", "surface_style"], "land_use_tile"], 0.54, ["==", ["get", "surface_style"], "access_fabric"], 0.42, ["==", ["get", "surface_style"], "planning_footprint"], 0.48, ["==", ["get", "surface_style"], "catchment_area"], 0.82, 0.62],
          17, ["case", ["==", ["get", "surface_style"], "utility_outage_area"], 1.9, ["==", ["get", "surface_style"], "land_use_tile"], 0.9, ["==", ["get", "surface_style"], "access_fabric"], 0.68, ["==", ["get", "surface_style"], "planning_footprint"], 0.86, ["==", ["get", "surface_style"], "catchment_area"], 1.2, 1.05],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-coverage-flow-case",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_role"], "coverage"]],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf6",
        "line-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.46],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.4, 1, 3.8],
          13, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.4, 1, 7.2],
          16, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 3.4, 1, 9.8],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-coverage-flow",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_role"], "coverage"]],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": [
          "match", ["get", "flow_style"],
          "service_walk", "#0f7f86",
          "service_bus", "#5aaeb5",
          "service_outer", "#a8cfd1",
          "#5aaeb5",
        ],
        "line-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.48],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.75, 1, 2.4],
          13, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.35, 1, 4.8],
          16, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.05, 1, 7.2],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-flow-case",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["!=", ["get", "flow_role"], "coverage"]],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fff7e8",
        "line-opacity": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"], 0.76,
          ["==", ["get", "flow_style"], "economy_gravity_thread"], 0.44,
          ["==", ["get", "flow_style"], "economy_current_ribbon"], 0.68,
          ["==", ["get", "flow_style"], "economy_before_ribbon"], 0.26,
          ["==", ["get", "flow_style"], "economy_churn_tick"], 0.72,
          ["==", ["get", "flow_style"], "planning_pressure_spine"], 0.74,
          ["==", ["get", "flow_style"], "planning_pressure_edge"], 0.58,
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"], 0.34,
          ["==", ["get", "flow_style"], "planning_pressure_trace"], 0.42,
          ["==", ["get", "flow_style"], "transport_backbone"], 0.9,
          ["==", ["get", "flow_style"], "transport_thread"], 0.56,
          ["==", ["get", "flow_style"], "utility_primary"], 0.62,
          ["==", ["get", "flow_style"], "utility_backup"], 0.5,
          ["==", ["get", "flow_style"], "utility_inferred"], 0.36,
          ["any",
            ["==", ["get", "flow_style"], "street_thread"],
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["==", ["get", "lens_id"], "civic-access-gaps"],
            ["==", ["get", "lens_id"], "economy-vitality"],
            ["==", ["get", "lens_id"], "utilities-capacity"],
            ["==", ["get", "lens_id"], "utilities-resilience"],
            ["==", ["get", "lens_id"], "utilities-works"],
          ], 0.48,
          0.54,
        ],
        "line-width": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.2, 1, 7.8],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.2, 1, 4.6],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.2, 1, 5.8],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.78, 1, 3.2],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.4, 1, 4.2],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.8, 1, 6.8],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.05, 1, 4.15],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 1.72],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.7, 1, 2.45],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 3.1, 1, 8.8],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.3, 1, 4.2],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.85, 1, 5.4],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.35, 1, 4.2],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.9, 1, 2.8],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.4, 1, 4.6],
          ["==", ["get", "lens_id"], "civic-access-gaps"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.15, 1, 3.05],
          ["any",
            ["==", ["get", "flow_style"], "street_thread"],
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["==", ["get", "lens_id"], "economy-vitality"],
            ["==", ["get", "lens_id"], "utilities-capacity"],
            ["==", ["get", "lens_id"], "utilities-resilience"],
            ["==", ["get", "lens_id"], "utilities-works"],
          ],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.25, 1, 4.8],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.85, 1, 5.9],
        ],
        "line-offset": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["to-number", ["get", "edge_offset"], 0], 0.32],
          13, ["*", ["to-number", ["get", "edge_offset"], 0], 0.78],
          16, ["*", ["to-number", ["get", "edge_offset"], 0], 1.35],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-flow",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["!=", ["get", "flow_role"], "coverage"]],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#7a3b7a"],
        "line-opacity": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.94],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.28, 1, 0.58],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.54, 1, 0.96],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.46],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.55, 1, 0.92],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.94],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.86],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.78],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.28, 1, 0.68],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 1],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.76],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.94],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.82],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.28, 1, 0.62],
          ["any",
            ["==", ["get", "flow_style"], "street_thread"],
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["==", ["get", "lens_id"], "civic-access-gaps"],
            ["==", ["get", "lens_id"], "economy-vitality"],
            ["==", ["get", "lens_id"], "utilities-capacity"],
            ["==", ["get", "lens_id"], "utilities-resilience"],
            ["==", ["get", "lens_id"], "utilities-works"],
          ],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.38, 1, 0.88],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 0.96],
        ],
        "line-width": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.9, 1, 4.65],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 2.25],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 3.65],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.3, 1, 1.65],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.6, 1, 2.5],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.78, 1, 4.35],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.45, 1, 2.35],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.16, 1, 0.86],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.26, 1, 1.24],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.75, 1, 6.1],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.6, 1, 2.8],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.85, 1, 3.35],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 2.55],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.38, 1, 1.75],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 2.4],
          ["==", ["get", "lens_id"], "civic-access-gaps"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 1.7],
          ["any",
            ["==", ["get", "flow_style"], "street_thread"],
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["==", ["get", "lens_id"], "economy-vitality"],
            ["==", ["get", "lens_id"], "utilities-capacity"],
            ["==", ["get", "lens_id"], "utilities-resilience"],
            ["==", ["get", "lens_id"], "utilities-works"],
          ],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 1, 3.55],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.45, 1, 5.05],
        ],
        "line-offset": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["to-number", ["get", "edge_offset"], 0], 0.32],
          13, ["*", ["to-number", ["get", "edge_offset"], 0], 0.78],
          16, ["*", ["to-number", ["get", "edge_offset"], 0], 1.35],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-node",
      type: "circle",
      source: LENS_GUIDE_SOURCE_ID,
      filter: [
        "all",
        ["==", ["get", "kind"], "node"],
        ["!=", ["get", "node_style"], "utility_trace"],
        ["!=", ["get", "node_style"], "civic_anchor"],
        ["!=", ["get", "node_style"], "planning_document"],
        ["!=", ["get", "node_style"], "economy_notice"],
      ],
      layout: { visibility: "none" },
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          10, ["case", ["==", ["get", "node_style"], "transport_route"], 3.4, ["==", ["get", "node_style"], "transport"], 3.8, 4.5],
          14, ["case", ["==", ["get", "node_style"], "transport_route"], 5.8, ["==", ["get", "node_style"], "transport"], 6.4, 7.5],
          17, ["case", ["==", ["get", "node_style"], "transport_route"], 8.4, ["==", ["get", "node_style"], "transport"], 9.2, 11],
        ],
        "circle-color": [
          "case",
          ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]], "#fffdf7",
          ["coalesce", ["get", "color"], "#1b7a85"],
        ],
        "circle-opacity": [
          "case",
          ["==", ["get", "node_style"], "transport_route"], 0.96,
          0.92,
        ],
        "circle-stroke-width": [
          "case",
          ["==", ["get", "node_style"], "transport_route"], 1.8,
          ["==", ["get", "node_style"], "transport"], 2.2,
          2.2,
        ],
        "circle-stroke-color": [
          "case",
          ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]], ["coalesce", ["get", "color"], "#1b7a85"],
          "#ffffff",
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-icon-node",
      type: "symbol",
      source: LENS_GUIDE_SOURCE_ID,
      filter: [
        "all",
        ["==", ["get", "kind"], "node"],
        ["any", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "node_style"], "planning_document"], ["==", ["get", "node_style"], "economy_notice"]],
      ],
      layout: {
        visibility: "none",
        "icon-image": [
          "case",
          ["==", ["get", "node_style"], "civic_anchor"],
          [
            "match", ["get", "sublayer_id"],
            "civic_services", "lens-icon-civic-school",
            "health", "lens-icon-civic-health",
            "libraries", "lens-icon-civic-library",
            "leisure", "lens-icon-civic-leisure",
            "council", "lens-icon-civic-council",
            "safety", "lens-icon-civic-safety",
            "lens-icon-civic",
          ],
          ["==", ["get", "node_style"], "planning_document"],
          [
            "match", ["get", "sublayer_id"],
            "built_environment", "lens-icon-planning-application",
            "objections", "lens-icon-planning-objection",
            "completions", "lens-icon-planning-completion",
            "vacant_sites", "lens-icon-planning-vacant",
            "redevelopment", "lens-icon-planning-redevelopment",
            "uncertainty", "lens-icon-planning-uncertainty",
            "lens-icon-planning-application",
          ],
          ["==", ["get", "node_style"], "economy_notice"],
          [
            "match", ["get", "sublayer_id"],
            "openings", "lens-icon-economy-opening",
            "closures", "lens-icon-economy-closure",
            "vacancy", "lens-icon-economy-vacancy",
            "spend", "lens-icon-economy-spend",
            "footfall", "lens-icon-economy-footfall",
            "lens-icon-economy-notice",
          ],
          [
            "match", ["get", "utility_type"],
            "water", "lens-icon-utility-water",
            "electricity", "lens-icon-utility-electricity",
            "telecoms", "lens-icon-utility-telecoms",
            "gas", "lens-icon-utility-gas",
            "drainage", "lens-icon-utility-drainage",
            "lens-icon-utilities",
          ],
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          9, ["case", ["==", ["get", "node_style"], "civic_anchor"], 0.34, ["==", ["get", "node_style"], "planning_document"], 0.4, ["==", ["get", "node_style"], "economy_notice"], 0.34, 0.42],
          13, ["case", ["==", ["get", "node_style"], "civic_anchor"], 0.49, ["==", ["get", "node_style"], "planning_document"], 0.58, ["==", ["get", "node_style"], "economy_notice"], 0.52, 0.58],
          16, ["case", ["==", ["get", "node_style"], "civic_anchor"], 0.68, ["==", ["get", "node_style"], "planning_document"], 0.8, ["==", ["get", "node_style"], "economy_notice"], 0.72, 0.78],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 0.96],
      },
    });
  }

  function addTransportEventLensLayers() {
    if (!state.map?.getSource(LENS_SOURCE_ID) || state.map.getLayer("lens-transport-event-points")) return;
    state.map.addLayer({
      id: "lens-transport-event-halo",
      type: "circle",
      source: LENS_SOURCE_ID,
      filter: lensCategoryFilter("transport"),
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4, 13, 7, 16, 11],
        "circle-color": ["coalesce", ["get", "lens_layer_color"], "#0f8d95"],
        "circle-opacity": 0.14,
        "circle-stroke-width": 0,
      },
    });
    state.map.addLayer({
      id: "lens-transport-event-points",
      type: "circle",
      source: LENS_SOURCE_ID,
      filter: lensCategoryFilter("transport"),
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3.2, 13, 5.2, 16, 7.4],
        "circle-color": "#fffdf7",
        "circle-opacity": [
          "case",
          ["==", ["get", "confidence"], "inferred"],
          0.72,
          0.98,
        ],
        "circle-stroke-color": ["coalesce", ["get", "lens_layer_color"], "#0f8d95"],
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9, 1.4, 15, 2.4],
      },
    });
  }

  function bindLensInteractionLayers() {
    if (!state.map) return;
    const interactiveLayerIds = [
      "lens-transport-event-points",
      "lens-built-site-icons",
      "lens-civic-icons",
      "lens-economy-icons",
      "lens-utilities-icons",
      "lens-civic-facility-icons",
      "lens-utility-asset-icons",
      "lens-planning-cells-fill",
      "lens-civic-coverage-fill",
      "lens-economy-cells-fill",
      "lens-economy-frontage",
      "lens-utilities-trace",
    ];
    for (const layerId of interactiveLayerIds) {
      if (state.lensInteractiveLayers.has(layerId) || !state.map.getLayer(layerId)) continue;
      state.map.on("click", layerId, (event) => {
        const feature = event.features?.[0];
        const eventId = featureEventId(feature);
        if (eventId) selectEvent(eventId);
      });
      state.map.on("mouseenter", layerId, () => {
        if (state.map) state.map.getCanvas().style.cursor = "pointer";
      });
      state.map.on("mouseleave", layerId, () => {
        if (state.map) state.map.getCanvas().style.cursor = "";
      });
      state.lensInteractiveLayers.add(layerId);
    }
  }

  function featureEventId(feature) {
    const props = feature?.properties || {};
    if (props.event_id) return String(props.event_id);
    const first = String(props.event_ids || props.event_ids_all || "").split(",").map((item) => item.trim()).find(Boolean);
    return first || "";
  }

  function addLensDetailLayers() {
    if (!state.map?.getSource(LENS_DETAIL_SOURCE_ID) || state.map.getLayer("lens-planning-cells-fill")) return;
    state.map.addLayer({
      id: "lens-planning-cells-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.2,
      filter: lensDetailFilter("planning_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": planningCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.18, 0.58),
      },
    });
    state.map.addLayer({
      id: "lens-planning-cells-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.2,
      filter: lensDetailFilter("planning_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": planningCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.28, 0.82),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.35, 13, 0.75, 16, 1.35],
      },
    });
    state.map.addLayer({
      id: "lens-civic-coverage-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_coverage_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": civicCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.16, 0.5),
      },
    });
    state.map.addLayer({
      id: "lens-civic-coverage-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_coverage_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": civicCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.18, 0.58),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.25, 13, 0.5, 16, 0.9],
      },
    });
    state.map.addLayer({
      id: "lens-civic-facility-icons",
      type: "symbol",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_facility"),
      layout: detailIconLayout("lens-icon-civic", 9.5, true),
      paint: detailIconPaint(0.86),
    });
    state.map.addLayer({
      id: "lens-economy-cells-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.4,
      filter: lensDetailFilter("economy_activity_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": economyCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.16, 0.56),
      },
    });
    state.map.addLayer({
      id: "lens-economy-cells-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.4,
      filter: lensDetailFilter("economy_activity_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": economyCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.16, 0.66),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.22, 13, 0.52, 16, 1],
      },
    });
    state.map.addLayer({
      id: "lens-economy-frontage-case",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("economy_frontage"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf7",
        "line-opacity": lensDetailLineOpacity(0.24, 0.58),
        "line-width": lensTraceWidthExpression(2.6, 8.4),
        "line-blur": 0.18,
      },
    });
    state.map.addLayer({
      id: "lens-economy-frontage",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("economy_frontage"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": economyCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.36, 0.92),
        "line-width": lensTraceWidthExpression(1.05, 4.9),
      },
    });
    state.map.addLayer({
      id: "lens-utilities-trace-case",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_trace"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf7",
        "line-opacity": lensDetailLineOpacity(0.24, 0.62),
        "line-width": lensTraceWidthExpression(2.8, 8.8),
        "line-blur": 0.18,
      },
    });
    state.map.addLayer({
      id: "lens-utilities-trace",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_trace"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": utilityTraceColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.36, 0.94),
        "line-width": lensTraceWidthExpression(1.05, 5.2),
        "line-dasharray": [1.8, 0.8],
      },
    });
    state.map.addLayer({
      id: "lens-utility-asset-icons",
      type: "symbol",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_asset"),
      layout: detailIconLayout("lens-icon-utilities", 9.8, true),
      paint: detailIconPaint(0.84),
    });
  }

  function addUtilityNetworkLayers() {
    if (!state.map?.getSource(UTILITY_NETWORK_SOURCE_ID) || state.map.getLayer("lens-utility-network")) return;
    state.map.addLayer({
      id: "lens-utility-network-case",
      type: "line",
      source: UTILITY_NETWORK_SOURCE_ID,
      minzoom: 8.6,
      filter: utilityNetworkLineFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf7",
        "line-opacity": utilityNetworkCaseOpacityExpression(),
        "line-width": utilityNetworkCaseWidthExpression(),
        "line-blur": 0.1,
      },
    });
    state.map.addLayer({
      id: "lens-utility-network",
      type: "line",
      source: UTILITY_NETWORK_SOURCE_ID,
      minzoom: 8.6,
      filter: utilityNetworkLineFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": utilityNetworkContextColorExpression(),
        "line-opacity": utilityNetworkOpacityExpression(),
        "line-width": utilityNetworkWidthExpression(),
        "line-dasharray": utilityNetworkContextDashExpression(),
      },
    });
    state.map.addLayer({
      id: "lens-utility-network-assets",
      type: "symbol",
      source: UTILITY_NETWORK_SOURCE_ID,
      minzoom: 10.1,
      filter: utilityNetworkAssetFilter(),
      layout: {
        visibility: "none",
        "icon-image": [
          "match", ["get", "utility_type"],
          "water", "lens-icon-utility-water",
          "electricity", "lens-icon-utility-electricity",
          "telecoms", "lens-icon-utility-telecoms",
          "gas", "lens-icon-utility-gas",
          "drainage", "lens-icon-utility-drainage",
          "lens-icon-utilities",
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", 0.22, ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.82, 2, 0.95, 4, 1.12]],
          14, ["*", 0.32, ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.82, 2, 0.95, 4, 1.14]],
          16, ["*", 0.45, ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.82, 2, 0.95, 4, 1.18]],
        ],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.24, 2, 0.54, 4, 0.92],
      },
    });
  }

  function utilityNetworkLineFilter() {
    return ["all",
      ["==", ["get", "layer"], "utility_network"],
      ["match", ["get", "network_geometry"], ["line", "area"], true, false],
    ];
  }

  function utilityNetworkAssetFilter() {
    return ["all",
      ["==", ["get", "layer"], "utility_network"],
      ["==", ["get", "network_geometry"], "asset"],
      [">=", ["to-number", ["get", "asset_priority"], 0], 2],
    ];
  }

  function utilityNetworkContextColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-capacity") {
      return [
        "case",
        [">=", ["to-number", ["get", "intensity"], 0], 0.92], "#d62d35",
        [">=", ["to-number", ["get", "intensity"], 0], 0.8], "#ed6b35",
        ["match", ["get", "utility_type"],
          "water", "#1787b3",
          "electricity", "#ef6b2a",
          "telecoms", "#7a3b97",
          "gas", "#e2b42c",
          "drainage", "#148a8d",
          "#8c7460",
        ],
      ];
    }
    if (mode === "utilities-resilience") {
      return [
        "case",
        [">=", ["to-number", ["get", "rank"], 1], 5], "#0b6e8e",
        ["match", ["get", "utility_type"],
          "water", "#1787b3",
          "electricity", "#ef6b2a",
          "telecoms", "#7a3b97",
          "gas", "#e2b42c",
          "drainage", "#148a8d",
          "#1787b3",
        ],
      ];
    }
    return [
      "match", ["get", "utility_type"],
      "water", "#248b94",
      "electricity", "#e8a620",
      "telecoms", "#774a92",
      "gas", "#d66a3a",
      "drainage", "#4f8f50",
      "#8c7460",
    ];
  }

  function utilityNetworkOpacityExpression() {
    const mode = activeMapLens().id;
    const high = mode === "utilities-resilience" ? 0.78 : mode === "utilities-capacity" ? 0.84 : 0.72;
    const low = mode === "utilities-works" ? 0.16 : 0.22;
    return [
      "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
      0, low,
      1, high,
    ];
  }

  function utilityNetworkCaseOpacityExpression() {
    const mode = activeMapLens().id;
    const high = mode === "utilities-resilience" ? 0.42 : 0.36;
    return [
      "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
      0, 0.08,
      1, high,
    ];
  }

  function utilityNetworkWidthExpression() {
    const mode = activeMapLens().id;
    const factor = mode === "utilities-resilience" ? 1.08 : mode === "utilities-works" ? 0.88 : 1;
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.26, 5, 0.9]],
      13, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.58, 5, 2.15]],
      16, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.96, 5, 3.4]],
    ];
  }

  function utilityNetworkCaseWidthExpression() {
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.72, 5, 1.8],
      13, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 1.28, 5, 3.6],
      16, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 1.7, 5, 5.1],
    ];
  }

  function utilityNetworkContextDashExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-resilience") return [2.8, 1.25];
    if (mode === "utilities-works") return [2, 1.2];
    return [1, 0.0001];
  }

  function lensDetailIntensityExpression() {
    return ["to-number", ["get", "intensity"], 0.35];
  }

  function lensDetailFillOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    return [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.64, ["==", ["get", "confidence"], "disputed"], 0.72, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
  }

  function lensDetailLineOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    return [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.58, ["==", ["get", "confidence"], "disputed"], 0.68, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
  }

  function lensTraceWidthExpression(low, high) {
    const intensity = lensDetailIntensityExpression();
    const rank = ["min", 1.55, ["max", 0.7, ["to-number", ["get", "rank"], 1]]];
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.36, 1, high * 0.36], rank],
      13, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.72, 1, high * 0.72], rank],
      16, ["*", ["interpolate", ["linear"], intensity, 0, low, 1, high], rank],
    ];
  }

  function planningCellColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "planning-pressure") {
      return [
        "interpolate", ["linear"], lensDetailIntensityExpression(),
        0, "#9fb7bd",
        0.26, "#e5b955",
        0.52, "#ef7a35",
        0.78, "#d84a2d",
        1, "#b91f32",
      ];
    }
    if (mode === "planning-delta") {
      return [
        "match", ["get", "lifecycle_status"],
        "demolished", "#8f9494",
        "construction", "#6f3a8f",
        "completed", "#d84a2d",
        "permitted", "#e9a53b",
        "proposed", "#cf6a57",
        "#cbb9a6",
      ];
    }
    return [
      "match", ["get", "lifecycle_status"],
      "proposed", "#ef7775",
      "permitted", "#f2c45f",
      "planned", "#f2c45f",
      "construction", "#7e68b8",
      "completed", "#6f9c7b",
      "demolished", "#d95992",
      "inferred", "#b8b6a8",
      "uncertain", "#b8b6a8",
      "#b8b6a8",
    ];
  }

  function civicCellColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "civic-demand") {
      return [
        "interpolate", ["linear"], lensDetailIntensityExpression(),
        0, "#55a39d",
        0.34, "#8fbfba",
        0.52, "#efc06d",
        0.72, "#ed7c62",
        1, "#cf3d4d",
      ];
    }
    if (mode === "civic-access-gaps") {
      return [
        "interpolate", ["linear"], lensDetailIntensityExpression(),
        0, "#348f67",
        0.4, "#e4b33c",
        0.7, "#ef8f21",
        1, "#ed4a2e",
      ];
    }
    return [
      "match", ["get", "service_type"],
      "health", "#2a84a6",
      "education", "#1b7a85",
      "library", "#7a3b7a",
      "leisure", "#4f9a5b",
      "community", "#d69423",
      "safety", "#c8472e",
      "#8ab7bd",
    ];
  }

  function economyCellColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "economy-land-use") {
      return [
        "match", ["get", "sector"],
        "commercial_activity", "#ca3b32",
        "retail", "#ca3b32",
        "office", "#158c97",
        "hospitality", "#7b3a8f",
        "culture_visitor", "#f0b342",
        "residential_change", "#f0b342",
        "vacancy", "#df8884",
        "industrial", "#8a8f8a",
        "#ead7b0",
      ];
    }
    if (mode === "economy-vitality") {
      return [
        "interpolate", ["linear"], lensDetailIntensityExpression(),
        0, "#1693a3",
        0.32, "#ee3f47",
        0.52, "#f0a51b",
        0.72, "#a552a8",
        1, "#6d2f90",
      ];
    }
    return [
      "match", ["get", "sector"],
      "retail", "#7a3b7a",
      "office", "#5f4a9a",
      "hospitality", "#d69423",
      "industrial", "#8c7460",
      "culture_visitor", "#c8472e",
      "education_health", "#2a84a6",
      "residential_change", "#b887b8",
      "vacancy", "#655b54",
      "#8d5a90",
    ];
  }

  function utilityTraceColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-capacity") {
      return [
        "interpolate", ["linear"], lensDetailIntensityExpression(),
        0, "#438c64",
        0.42, "#e5b734",
        0.68, "#ed6b35",
        1, "#d62d35",
      ];
    }
    if (mode === "utilities-resilience") {
      return [
        "match", ["get", "utility_type"],
        "water", "#1787b3",
        "electricity", "#ef6b2a",
        "telecoms", "#7a3b97",
        "telecom", "#7a3b97",
        "gas", "#e2b42c",
        "drainage", "#148a8d",
        "#1787b3",
      ];
    }
    return [
      "match", ["get", "work_status"],
      "repair", "#d66a3a",
      "disruption", "#c8472e",
      "planned", "#d6a33e",
      "current", "#4f9a5b",
      "mapped_asset", "#8c7460",
      "#8c7460",
    ];
  }

  function detailIconLayout(iconId, baseSize, allowOverlap) {
    return {
      visibility: "none",
      "icon-image": iconId,
      "icon-allow-overlap": allowOverlap,
      "icon-ignore-placement": allowOverlap,
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        9, baseSize / 24,
        13, (baseSize + 2.2) / 24,
        16, (baseSize + 5.5) / 24,
      ],
    };
  }

  function detailIconPaint(opacity) {
    return {
      "icon-opacity": [
        "case",
        ["==", ["get", "confidence"], "inferred"],
        Math.max(0.34, opacity - 0.34),
        ["==", ["get", "confidence"], "disputed"],
        Math.max(0.38, opacity - 0.24),
        opacity,
      ],
    };
  }

  function ensureBuiltFootprintLensLayers() {
    if (!state.map?.getSource(DETAIL_SOURCE_ID) || state.map.getLayer("lens-built-footprints-fill")) return;
    state.map.addLayer({
      id: "lens-built-footprints-fill",
      type: "fill",
      source: DETAIL_SOURCE_ID,
      minzoom: 10.4,
      filter: builtFootprintFilter(),
      layout: { visibility: "none" },
      paint: {
        "fill-color": [
          "case",
          ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
          "#c8472e",
          "#c98667",
        ],
        "fill-opacity": [
          "case",
          ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
          0.36,
          0.18,
        ],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 10.4,
      filter: builtFootprintFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#f3c7b8",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.18, 14, 0.42, 17, 0.66],
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 14, 0.75, 17, 1.1],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 11.6,
      filter: builtFootprintYearFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#201c17",
        "line-opacity": 0.72,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 15, 1.7, 17, 2.4],
        "line-dasharray": [1.2, 0.8],
      },
    });
  }

  function addPointLensLayer(layerId, category, iconId, baseSize, opacity, allowOverlap, minZoom = 9) {
    if (state.map.getLayer(layerId) || !state.map.getSource(LENS_SOURCE_ID)) return;
    state.map.addLayer({
      id: layerId,
      type: "symbol",
      source: LENS_SOURCE_ID,
      minzoom: minZoom,
      filter: lensCategoryFilter(category),
      layout: {
        visibility: "none",
        "icon-image": iconId,
        "icon-allow-overlap": allowOverlap,
        "icon-ignore-placement": allowOverlap,
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          9, baseSize / 24,
          13, (baseSize + 2.5) / 24,
          16, (baseSize + 6) / 24,
        ],
      },
      paint: {
        "icon-opacity": [
          "case",
          ["==", ["get", "confidence"], "inferred"],
          Math.max(0.34, opacity - 0.32),
          ["==", ["get", "confidence"], "disputed"],
          Math.max(0.38, opacity - 0.22),
          opacity,
        ],
      },
    });
  }

  function ensureLensImages() {
    if (!state.map) return;
    addLensImage("lens-icon-built", "#c8472e", "built");
    addLensImage("lens-icon-planning-application", "#d84a2d", "planning-doc");
    addLensImage("lens-icon-planning-objection", "#f07b2b", "planning-doc");
    addLensImage("lens-icon-planning-completion", "#4b9661", "planning-doc");
    addLensImage("lens-icon-planning-vacant", "#258a8e", "planning-doc");
    addLensImage("lens-icon-planning-redevelopment", "#b91f32", "planning-doc");
    addLensImage("lens-icon-planning-uncertainty", "#75418d", "planning-doc");
    addLensImage("lens-icon-civic", "#2a84a6", "civic");
    addLensImage("lens-icon-civic-school", "#178f8f", "civic-anchor");
    addLensImage("lens-icon-civic-health", "#e85b1e", "civic-anchor");
    addLensImage("lens-icon-civic-library", "#79419d", "civic-anchor");
    addLensImage("lens-icon-civic-leisure", "#347db5", "civic-anchor");
    addLensImage("lens-icon-civic-council", "#26858a", "civic-anchor");
    addLensImage("lens-icon-civic-safety", "#8c5b3a", "civic-anchor");
    addLensImage("lens-icon-economy", "#7a3b7a", "economy");
    addLensImage("lens-icon-economy-notice", "#2b2926", "economy-notice");
    addLensImage("lens-icon-economy-opening", "#5eaa4e", "economy-notice");
    addLensImage("lens-icon-economy-closure", "#ed3135", "economy-notice");
    addLensImage("lens-icon-economy-vacancy", "#ed3135", "economy-notice");
    addLensImage("lens-icon-economy-spend", "#f0a51b", "economy-notice");
    addLensImage("lens-icon-economy-footfall", "#188a98", "economy-notice");
    addLensImage("lens-icon-utilities", "#8c7460", "utilities");
    addLensImage("lens-icon-utility-water", "#1787b3", "utility-node");
    addLensImage("lens-icon-utility-electricity", "#ef6b2a", "utility-node");
    addLensImage("lens-icon-utility-telecoms", "#7a3b97", "utility-node");
    addLensImage("lens-icon-utility-gas", "#e2b42c", "utility-node");
    addLensImage("lens-icon-utility-drainage", "#148a8d", "utility-node");
  }

  function addLensImage(id, color, shape) {
    if (state.map.hasImage?.(id)) return;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    ctx.strokeStyle = "#201c17";
    ctx.lineWidth = 4;
    ctx.fillStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (shape === "built") {
      ctx.fillRect(13, 13, 22, 22);
      ctx.strokeRect(13, 13, 22, 22);
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 30);
      ctx.lineTo(30, 18);
      ctx.stroke();
    } else if (shape === "planning-doc") {
      ctx.beginPath();
      ctx.moveTo(15, 10);
      ctx.lineTo(29, 10);
      ctx.lineTo(37, 18);
      ctx.lineTo(37, 38);
      ctx.lineTo(15, 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,253,247,0.76)";
      ctx.beginPath();
      ctx.moveTo(29, 11);
      ctx.lineTo(36, 18);
      ctx.lineTo(29, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,253,247,0.88)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(20, 25);
      ctx.lineTo(32, 25);
      ctx.moveTo(20, 31);
      ctx.lineTo(30, 31);
      ctx.stroke();
    } else if (shape === "civic") {
      ctx.beginPath();
      ctx.arc(24, 24, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fff4d4";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(24, 15);
      ctx.lineTo(24, 33);
      ctx.moveTo(15, 24);
      ctx.lineTo(33, 24);
      ctx.stroke();
    } else if (shape === "civic-anchor") {
      ctx.beginPath();
      ctx.roundRect?.(10, 10, 28, 28, 4);
      if (!ctx.roundRect) ctx.rect(10, 10, 28, 28);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,253,247,0.86)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 24);
      ctx.lineTo(30, 24);
      ctx.moveTo(24, 18);
      ctx.lineTo(24, 30);
      ctx.stroke();
    } else if (shape === "economy") {
      ctx.beginPath();
      ctx.moveTo(24, 8);
      ctx.lineTo(40, 24);
      ctx.lineTo(24, 40);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 24);
      ctx.lineTo(32, 24);
      ctx.stroke();
    } else if (shape === "economy-notice") {
      ctx.fillStyle = "#2b2926";
      ctx.beginPath();
      ctx.roundRect?.(10, 10, 28, 28, 5);
      if (!ctx.roundRect) ctx.rect(10, 10, 28, 28);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fffdf7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(17, 24);
      ctx.lineTo(17, 33);
      ctx.lineTo(31, 33);
      ctx.lineTo(31, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(24, 24, 6, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(16, 38);
      ctx.lineTo(32, 38);
      ctx.stroke();
    } else if (shape === "utility-node") {
      ctx.beginPath();
      ctx.roundRect?.(11, 11, 26, 26, 5);
      if (!ctx.roundRect) {
        ctx.rect(11, 11, 26, 26);
      }
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,253,247,0.82)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 24);
      ctx.lineTo(30, 24);
      ctx.moveTo(24, 18);
      ctx.lineTo(24, 30);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(17, 7);
      ctx.lineTo(34, 17);
      ctx.lineTo(34, 31);
      ctx.lineTo(17, 41);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#f1e5d0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(27, 13);
      ctx.lineTo(20, 25);
      ctx.lineTo(28, 25);
      ctx.lineTo(21, 36);
      ctx.stroke();
    }
    state.map.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio: 2 });
  }

  function removeLensOverlays() {
    if (!state.map) return;
    for (const layerId of LENS_LAYER_IDS) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    for (const sourceId of [UTILITY_NETWORK_SOURCE_ID, LENS_GUIDE_SOURCE_ID, LENS_ROAD_SOURCE_ID, LENS_ROAD_BASE_SOURCE_ID, LENS_DETAIL_SOURCE_ID, LENS_SOURCE_ID]) {
      if (state.map.getSource(sourceId)) state.map.removeSource(sourceId);
    }
    state.lensOverlayLoaded = false;
    state.transportRoadBasePathLoaded = null;
    state.transportRoadYearPathLoaded = null;
    state.transportRoadYearLoaded = null;
    state.transportRoadFeatureCountPathLoaded = null;
    state.transportRoadFeatureCountYearLoaded = null;
    state.transportRoadFeatureCount = null;
    state.transportStopFeaturesPathLoaded = null;
    state.transportStopFeatures = [];
    state.utilityNetworkPathLoaded = null;
    state.utilityNetworkFeaturesPathLoaded = null;
    state.utilityNetworkFeatures = [];
    state.economyAnchorFeaturesPathLoaded = null;
    state.economyAnchorFeatures = [];
    state.civicServiceFeaturesPathLoaded = null;
    state.civicServiceFeatures = [];
    state.lensDetailYearPathLoaded = null;
    state.lensDetailYearLoaded = null;
    state.lensDetailFeaturePathLoaded = null;
    state.lensDetailFeatures = [];
    state.lensEventFeatureCount = 0;
    state.lensEventSourceKey = "";
    state.lensGuideFeatureCache = emptyFeatureCollection();
    renderLensGuideLabels();
  }

  function updateLensOverlayFilters() {
    if (!state.map) return;
    updateTransportRoadYearSource();
    updateLensDetailYearSource();
    updateTransportStopFeatureCache(shouldLoadTransportStops() ? transportStopsPath() : "");
    updateEconomyAnchorFeatureCache(shouldLoadEconomyAnchors() ? economyAnchorPath() : "");
    updateCivicServiceFeatureCache(shouldLoadCivicServiceContext() ? civicServiceContextPath() : "");
    updateLensEventSource();
    updateLensGuideSource();
    if (!state.map.getSource(LENS_SOURCE_ID)) return;
    ensureBuiltFootprintLensLayers();
    addTransportEventLensLayers();
    addUtilityNetworkLayers();
    addLensDetailLayers();
    updateUtilityNetworkSource(shouldLoadUtilityNetwork() ? utilityNetworkPath() : "");
    for (const layerId of ["lens-heatmap", "lens-current-points-glow", "lens-current-points"]) {
      if (state.map.getLayer(layerId)) state.map.setLayoutProperty(layerId, "visibility", "none");
    }
    updateBuiltFootprintLensLayers();
    updateLensDetailLayers();
    updateUtilityNetworkLayers();
    updateLensGuideLayers();
    updatePointLensLayer("lens-built-site-icons", "built_environment");
    updateTransportEventLensLayers();
    updatePointLensLayer("lens-civic-icons", "civic_services");
    updatePointLensLayer("lens-economy-icons", "economy");
    updatePointLensLayer("lens-utilities-icons", "utilities");
    bindLensInteractionLayers();

    const showTransportRoads = isActiveMapLens("transport");
    const showTransportBase = showTransportRoads;
    for (const layerId of ["lens-transport-base-case", "lens-transport-base"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportBaseRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportBase ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-base")) {
      const paint = transportBaseRoadPaint();
      Object.entries(paint).forEach(([key, value]) => state.map.setPaintProperty("lens-transport-base", key, value));
    }
    if (state.map.getLayer("lens-transport-base-case")) {
      const paint = transportBaseRoadCasePaint();
      Object.entries(paint).forEach(([key, value]) => state.map.setPaintProperty("lens-transport-base-case", key, value));
    }
    for (const layerId of ["lens-transport-roads-case", "lens-transport-roads"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportRoads ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-hotspots")) {
      state.map.setFilter("lens-transport-hotspots", transportHotspotFilter());
      const showHotspots = showTransportRoads && activeMapLens().id === "transport-speed";
      state.map.setLayoutProperty("lens-transport-hotspots", "visibility", showHotspots ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-roads")) {
      const paint = transportRoadPaint();
      Object.entries(paint).forEach(([key, value]) => state.map.setPaintProperty("lens-transport-roads", key, value));
    }
    renderLensLegend();
  }

  function updateTransportEventLensLayers() {
    const visible = isActiveMapLens("transport");
    for (const layerId of ["lens-transport-event-halo", "lens-transport-event-points"]) {
      if (!state.map?.getLayer(layerId)) continue;
      state.map.setFilter(layerId, lensCategoryFilter("transport"));
      state.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
  }

  function updatePointLensLayer(layerId, category) {
    if (!state.map?.getLayer(layerId)) return;
    state.map.setFilter(layerId, lensCategoryFilter(category));
    const detailBacked = category !== "built_environment" && Boolean(lensDetailYearPath(state.year));
    const hiddenByAspect = category === "built_environment" && activeMapLens().id === "planning-pressure";
    state.map.setLayoutProperty(layerId, "visibility", isActiveMapLens(category) && !detailBacked && !hiddenByAspect ? "visible" : "none");
  }

  function updateLensDetailLayers() {
    if (!state.map?.getSource(LENS_DETAIL_SOURCE_ID)) return;
    const aspect = activeMapLens();
    const showPlanningCells = isActiveMapLens("built_environment");
    const showCivicCells = isActiveMapLens("civic_services");
    const showEconomyCells = isActiveMapLens("economy") && !["economy-gravity", "economy-land-use"].includes(aspect.id);
    const showEconomyFrontage = isActiveMapLens("economy") && !["economy-land-use", "economy-gravity"].includes(aspect.id);
    const visibilityByLayer = {
      "lens-planning-cells-fill": showPlanningCells,
      "lens-planning-cells-outline": showPlanningCells,
      "lens-civic-coverage-fill": showCivicCells,
      "lens-civic-coverage-outline": showCivicCells,
      "lens-civic-facility-icons": isActiveMapLens("civic_services"),
      "lens-economy-cells-fill": showEconomyCells,
      "lens-economy-cells-outline": showEconomyCells,
      "lens-economy-frontage-case": showEconomyFrontage,
      "lens-economy-frontage": showEconomyFrontage,
      "lens-utilities-trace-case": isActiveMapLens("utilities"),
      "lens-utilities-trace": isActiveMapLens("utilities"),
      "lens-utility-asset-icons": isActiveMapLens("utilities"),
    };
    const filterByLayer = {
      "lens-planning-cells-fill": lensDetailFilter("planning_cell"),
      "lens-planning-cells-outline": lensDetailFilter("planning_cell"),
      "lens-civic-coverage-fill": lensDetailFilter("civic_coverage_cell", aspect.id === "civic-access-gaps" ? "coverage" : ""),
      "lens-civic-coverage-outline": lensDetailFilter("civic_coverage_cell", aspect.id === "civic-access-gaps" ? "coverage" : ""),
      "lens-civic-facility-icons": lensDetailFilter("civic_facility", aspect.id === "civic-access-gaps" ? "facilities" : ""),
      "lens-economy-cells-fill": lensDetailFilter("economy_activity_cell"),
      "lens-economy-cells-outline": lensDetailFilter("economy_activity_cell"),
      "lens-economy-frontage-case": lensDetailFilter("economy_frontage"),
      "lens-economy-frontage": lensDetailFilter("economy_frontage"),
      "lens-utilities-trace-case": lensDetailFilter("utility_trace"),
      "lens-utilities-trace": lensDetailFilter("utility_trace"),
      "lens-utility-asset-icons": lensDetailFilter("utility_asset"),
    };
    for (const [layerId, visible] of Object.entries(visibilityByLayer)) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, filterByLayer[layerId]);
      state.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
    setLayerPaintIfPresent("lens-planning-cells-fill", "fill-color", planningCellColorExpression());
    setLayerPaintIfPresent("lens-planning-cells-outline", "line-color", planningCellColorExpression());
    setLayerPaintIfPresent("lens-planning-cells-fill", "fill-opacity", aspect.id === "planning-pressure" ? lensDetailFillOpacity(0.025, 0.16) : ["planning-delta", "planning-parcels"].includes(aspect.id) ? lensDetailFillOpacity(0.008, 0.065) : lensDetailFillOpacity(0.18, 0.58));
    setLayerPaintIfPresent("lens-planning-cells-outline", "line-opacity", aspect.id === "planning-pressure" ? lensDetailLineOpacity(0.07, 0.28) : ["planning-delta", "planning-parcels"].includes(aspect.id) ? lensDetailLineOpacity(0.012, 0.085) : lensDetailLineOpacity(0.28, 0.82));
    setLayerPaintIfPresent("lens-civic-coverage-fill", "fill-color", civicCellColorExpression());
    setLayerPaintIfPresent("lens-civic-coverage-outline", "line-color", civicCellColorExpression());
    setLayerPaintIfPresent("lens-civic-coverage-fill", "fill-opacity", aspect.id === "civic-access-gaps" ? lensDetailFillOpacity(0.05, 0.2) : aspect.id === "civic-catchment" ? lensDetailFillOpacity(0.03, 0.12) : aspect.id === "civic-demand" ? lensDetailFillOpacity(0.02, 0.1) : lensDetailFillOpacity(0.16, 0.5));
    setLayerPaintIfPresent("lens-civic-coverage-outline", "line-opacity", aspect.id === "civic-access-gaps" ? lensDetailLineOpacity(0.08, 0.26) : aspect.id === "civic-catchment" ? lensDetailLineOpacity(0.04, 0.12) : aspect.id === "civic-demand" ? lensDetailLineOpacity(0.04, 0.14) : lensDetailLineOpacity(0.18, 0.58));
    setLayerPaintIfPresent("lens-economy-cells-fill", "fill-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-cells-outline", "line-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-cells-fill", "fill-opacity", aspect.id === "economy-land-use" ? lensDetailFillOpacity(0.34, 0.76) : lensDetailFillOpacity(0.04, 0.16));
    setLayerPaintIfPresent("lens-economy-cells-outline", "line-opacity", aspect.id === "economy-land-use" ? lensDetailLineOpacity(0.32, 0.8) : lensDetailLineOpacity(0.06, 0.28));
    setLayerPaintIfPresent("lens-economy-frontage", "line-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-frontage-case", "line-opacity", aspect.id === "economy-vitality" ? lensDetailLineOpacity(0.38, 0.78) : lensDetailLineOpacity(0.24, 0.58));
    setLayerPaintIfPresent("lens-economy-frontage", "line-opacity", aspect.id === "economy-vitality" ? lensDetailLineOpacity(0.56, 0.96) : lensDetailLineOpacity(0.36, 0.92));
    setLayerPaintIfPresent("lens-economy-frontage-case", "line-width", aspect.id === "economy-vitality" ? lensTraceWidthExpression(3.2, 9.8) : lensTraceWidthExpression(2.6, 8.4));
    setLayerPaintIfPresent("lens-economy-frontage", "line-width", aspect.id === "economy-vitality" ? lensTraceWidthExpression(1.3, 5.9) : lensTraceWidthExpression(1.05, 4.9));
    setLayerPaintIfPresent("lens-utilities-trace", "line-color", utilityTraceColorExpression());
    setLayerPaintIfPresent("lens-utilities-trace", "line-dasharray", activeMapLens().id === "utilities-works" ? [2, 1.2] : [1, 0.0001]);
  }

  function updateUtilityNetworkLayers() {
    if (!state.map?.getSource(UTILITY_NETWORK_SOURCE_ID)) return;
    const visible = shouldLoadUtilityNetwork();
    for (const layerId of LENS_UTILITY_NETWORK_LAYER_IDS) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
    if (!visible) return;
    if (state.map.getLayer("lens-utility-network-case")) {
      state.map.setFilter("lens-utility-network-case", utilityNetworkLineFilter());
      state.map.setPaintProperty("lens-utility-network-case", "line-opacity", utilityNetworkCaseOpacityExpression());
      state.map.setPaintProperty("lens-utility-network-case", "line-width", utilityNetworkCaseWidthExpression());
    }
    if (state.map.getLayer("lens-utility-network")) {
      state.map.setFilter("lens-utility-network", utilityNetworkLineFilter());
      state.map.setPaintProperty("lens-utility-network", "line-color", utilityNetworkContextColorExpression());
      state.map.setPaintProperty("lens-utility-network", "line-opacity", utilityNetworkOpacityExpression());
      state.map.setPaintProperty("lens-utility-network", "line-width", utilityNetworkWidthExpression());
      state.map.setPaintProperty("lens-utility-network", "line-dasharray", utilityNetworkContextDashExpression());
    }
    if (state.map.getLayer("lens-utility-network-assets")) {
      state.map.setFilter("lens-utility-network-assets", utilityNetworkAssetFilter());
    }
  }

  function setLayerPaintIfPresent(layerId, prop, value) {
    if (state.map?.getLayer(layerId)) state.map.setPaintProperty(layerId, prop, value);
  }

  function updateLensGuideLayers() {
    if (!state.map?.getSource(LENS_GUIDE_SOURCE_ID)) return;
    const lens = activeMapLens();
    const showGuide = Boolean(lens && state.activeLayers.has(lens.category || state.activeLens));
    const showRings = showGuide && ["transport-speed", "transport-reliability", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id);
    const showCells = showGuide && ["transport-access", "planning-delta", "planning-parcels", "civic-catchment", "civic-demand", "economy-land-use", "utilities-resilience"].includes(lens.id);
    const showFlows = showGuide && ["transport-speed", "transport-reliability", "planning-pressure", "civic-access-gaps", "economy-vitality", "economy-gravity", "utilities-capacity", "utilities-resilience", "utilities-works"].includes(lens.id);
    const showNodes = showGuide && ["transport-speed", "transport-access", "transport-reliability", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand", "economy-vitality", "economy-gravity", "utilities-resilience", "utilities-capacity", "utilities-works"].includes(lens.id);
    const visibility = {
      "lens-guide-area-fill": showGuide,
      "lens-guide-area-line": showGuide,
      "lens-guide-ring-line": showRings,
      "lens-guide-cell-fill": showCells,
      "lens-guide-cell-line": showCells,
      "lens-guide-coverage-flow-case": showFlows && lens.id === "civic-access-gaps",
      "lens-guide-coverage-flow": showFlows && lens.id === "civic-access-gaps",
      "lens-guide-flow-case": showFlows,
      "lens-guide-flow": showFlows,
      "lens-guide-node": showNodes,
      "lens-guide-icon-node": showNodes,
    };
    const cellFilter = guideCellLayerFilter(lens);
    for (const layerId of ["lens-guide-cell-fill", "lens-guide-cell-line"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, cellFilter);
    }
    const seamFlowFilter = guideSeamFlowLayerFilter(lens);
    const coverageFlowFilter = guideCoverageFlowLayerFilter(lens);
    for (const layerId of ["lens-guide-flow-case", "lens-guide-flow"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, seamFlowFilter);
    }
    for (const layerId of ["lens-guide-coverage-flow-case", "lens-guide-coverage-flow"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, coverageFlowFilter);
    }
    if (state.map.getLayer("lens-guide-flow")) {
      state.map.setPaintProperty("lens-guide-flow", "line-dasharray", guideFlowDashExpression(lens));
    }
    if (state.map.getLayer("lens-guide-flow-case")) {
      state.map.setPaintProperty("lens-guide-flow-case", "line-dasharray", guideFlowDashExpression(lens));
    }
    if (state.map.getLayer("lens-guide-cell-line")) {
      state.map.setPaintProperty("lens-guide-cell-line", "line-dasharray", lens.id === "utilities-resilience" ? [3.2, 1.6] : [1, 0.0001]);
    }
    if (state.map.getLayer("lens-guide-node")) {
      state.map.setFilter("lens-guide-node", guideNodeLayerFilter(lens));
    }
    if (state.map.getLayer("lens-guide-icon-node")) {
      state.map.setFilter("lens-guide-icon-node", guideIconNodeLayerFilter(lens));
    }
    for (const [layerId, visible] of Object.entries(visibility)) {
      if (state.map.getLayer(layerId)) state.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
    for (const layerId of LENS_GUIDE_LAYER_IDS) {
      if (state.map.getLayer(layerId)) {
        try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
      }
    }
    if (lens?.id === "transport-access") {
      for (const layerId of ["lens-transport-base-case", "lens-transport-base", "lens-transport-roads-case", "lens-transport-roads", "lens-transport-hotspots", "lens-guide-node", "lens-transport-event-halo", "lens-transport-event-points"]) {
        if (state.map.getLayer(layerId)) {
          try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
        }
      }
    } else if (lens?.category === "transport") {
      for (const layerId of ["lens-guide-area-line", "lens-guide-ring-line", "lens-guide-flow-case", "lens-guide-flow", "lens-guide-node", "lens-transport-event-halo", "lens-transport-event-points"]) {
        if (state.map.getLayer(layerId)) {
          try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
        }
      }
    }
    renderLensGuideLabels();
  }

  function guideFlowDashExpression(lens = activeMapLens()) {
    if (lens?.id === "civic-access-gaps") return [1.05, 1.05];
    if (lens?.id === "economy-vitality") {
      return [
        "case",
        ["==", ["get", "flow_style"], "economy_before_ribbon"], ["literal", [1.4, 1.05]],
        ["==", ["get", "flow_style"], "economy_churn_tick"], ["literal", [0.35, 0.9]],
        ["literal", [1, 0.0001]],
      ];
    }
    if (lens?.id === "utilities-resilience") return [2.8, 1.35];
    if (lens?.id === "utilities-works") return [2, 1.2];
    return [1, 0.0001];
  }

  function guideCellLayerFilter(lens = activeMapLens()) {
    const base = ["==", ["get", "kind"], "surface_cell"];
    if (lens?.id === "civic-catchment") return guideSublayerFilter(base, lens);
    if (lens?.id !== "planning-parcels") return base;
    const activeStatuses = [...state.activeAspectLayers].filter(Boolean);
    return [
      "all",
      base,
      [
        "any",
        ["!=", ["get", "lens_id"], "planning-parcels"],
        activeStatuses.length
          ? ["match", ["get", "sublayer_id"], activeStatuses, true, false]
          : ["==", ["get", "sublayer_id"], "__none__"],
      ],
    ];
  }

  function guideSeamFlowLayerFilter(lens = activeMapLens()) {
    const base = ["all", ["==", ["get", "kind"], "flow"], ["!=", ["get", "flow_role"], "coverage"]];
    return guideSublayerFilter(base, lens);
  }

  function guideCoverageFlowLayerFilter(lens = activeMapLens()) {
    const base = ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_role"], "coverage"]];
    return base;
  }

  function guideNodeLayerFilter(lens = activeMapLens()) {
    const base = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["!=", ["get", "node_style"], "utility_trace"],
      ["!=", ["get", "node_style"], "civic_anchor"],
      ["!=", ["get", "node_style"], "planning_document"],
    ];
    if (lens?.id === "economy-gravity") return guideSublayerFilter(base, lens);
    if (lens?.id === "civic-catchment") return guideSublayerFilter(base, lens);
    if (lens?.id !== "civic-access-gaps") return base;
    return [...base, civicAccessActiveSublayerFilter(["coverage", "facilities"])];
  }

  function guideIconNodeLayerFilter(lens = activeMapLens()) {
    const civicBase = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "civic_anchor"],
    ];
    if (lens?.id === "civic-catchment") return guideSublayerFilter(civicBase, lens);
    const planningBase = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "planning_document"],
    ];
    if (lens?.id === "planning-pressure") return guideSublayerFilter(planningBase, lens);
    const economyBase = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "economy_notice"],
    ];
    if (lens?.id === "economy-vitality") return guideSublayerFilter(economyBase, lens);
    return [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "utility_trace"],
    ];
  }

  function guideSublayerFilter(base, lens = activeMapLens()) {
    if (!["economy-gravity", "economy-vitality", "civic-catchment", "planning-pressure"].includes(lens?.id)) return base;
    const active = activeSublayerIdsForLens(lens);
    return [
      "all",
      base,
      active.length
        ? ["match", ["get", "sublayer_id"], active, true, false]
        : ["==", ["get", "sublayer_id"], "__none__"],
    ];
  }

  function activeSublayerIdsForLens(lens = activeMapLens()) {
    const active = new Set([...state.activeAspectLayers].filter(Boolean));
    for (const layer of lensLayers(lens)) {
      if (layer.categoryToggle && state.activeLayers.has(layer.id)) active.add(layer.id);
    }
    return [...active];
  }

  function civicAccessActiveSublayerFilter(_fallbackLayers = []) {
    const active = [...state.activeAspectLayers].filter(Boolean);
    return active.length
      ? ["match", ["get", "layer_id"], active, true, false]
      : ["==", ["get", "layer_id"], "__none__"];
  }

  function updateBuiltFootprintLensLayers() {
    const aspect = activeMapLens();
    const showBuilt = isActiveMapLens("built_environment")
      && ["planning-delta", "planning-parcels"].includes(aspect.id)
      && state.map?.getSource(DETAIL_SOURCE_ID);
    for (const layerId of DETAIL_LENS_LAYER_IDS) {
      if (!state.map?.getLayer(layerId)) continue;
      const filter = layerId === "lens-built-footprints-year" ? builtFootprintYearFilter() : builtFootprintFilter();
      state.map.setFilter(layerId, filter);
      state.map.setLayoutProperty(layerId, "visibility", showBuilt ? "visible" : "none");
    }
  }

  function isActiveMapLens(lensId) {
    const lens = MAP_LENS_BY_ID.get(lensId);
    return Boolean(lens && state.activeLens === lens.id && state.activeLayers.has(lens.layerId));
  }

  function shouldLoadLensDetail() {
    const lens = activeMapLens();
    const category = lens?.category || lens?.layerId || lens?.id;
    return Boolean(lens && category !== "transport" && state.activeLayers.has(category));
  }

  function updateTransportRoadYearSource() {
    const source = state.map?.getSource(LENS_ROAD_SOURCE_ID);
    if (!source?.setData) return;
    const path = transportRoadYearPath(state.year);
    if (!path) return;
    if (state.transportRoadYearPathLoaded === path) {
      updateTransportRoadFeatureCount(path, currentTimelineYear());
      return;
    }
    source.setData(path);
    state.transportRoadYearPathLoaded = path;
    state.transportRoadYearLoaded = currentTimelineYear();
    updateTransportRoadFeatureCount(path, currentTimelineYear());
  }

  function updateTransportRoadFeatureCount(path, year) {
    if (!path) {
      state.transportRoadFeatureCountPathLoaded = null;
      state.transportRoadFeatureCountYearLoaded = null;
      state.transportRoadFeatureCount = null;
      state.transportRoadFeaturesPathLoaded = null;
      state.transportRoadFeatures = [];
      return;
    }
    if (state.transportRoadFeatureCountPathLoaded === path) return;
    state.transportRoadFeatureCountPathLoaded = path;
    state.transportRoadFeatureCountYearLoaded = null;
    state.transportRoadFeatureCount = null;
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.transportRoadFeatureCountPathLoaded !== path) return;
        const features = Array.isArray(payload.features) ? payload.features : [];
        state.transportRoadFeatureCount = features.length;
        state.transportRoadFeatureCountYearLoaded = year;
        state.transportRoadFeaturesPathLoaded = path;
        state.transportRoadFeatures = features;
        updateLensGuideSource();
        renderLensLegend();
        renderDetail();
      })
      .catch(() => {
        if (state.transportRoadFeatureCountPathLoaded !== path) return;
        state.transportRoadFeatureCount = null;
        state.transportRoadFeatureCountYearLoaded = null;
        state.transportRoadFeaturesPathLoaded = null;
        state.transportRoadFeatures = [];
        renderLensLegend();
        renderDetail();
      });
  }

  function shouldLoadTransportStops() {
    return activeMapLens()?.id === "civic-access-gaps";
  }

  function shouldLoadEconomyAnchors() {
    return activeMapLens()?.id === "economy-gravity" && state.activeLayers.has("economy");
  }

  function shouldLoadCivicServiceContext() {
    return activeMapLens()?.id === "civic-catchment" && state.activeLayers.has("civic_services");
  }

  function shouldLoadUtilityNetwork() {
    return Boolean(activeMapLens()?.id?.startsWith("utilities-") && state.activeLayers.has("utilities"));
  }

  function updateCivicServiceFeatureCache(path) {
    if (!path) {
      if (state.civicServiceFeaturesPathLoaded !== null || state.civicServiceFeatures.length) {
        state.civicServiceFeaturesPathLoaded = null;
        state.civicServiceFeatures = [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      }
      return;
    }
    if (state.civicServiceFeaturesPathLoaded === path) return;
    state.civicServiceFeaturesPathLoaded = path;
    state.civicServiceFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.civicServiceFeaturesPathLoaded !== path) return;
        state.civicServiceFeatures = Array.isArray(payload.features)
          ? payload.features.filter((feature) => feature.geometry && feature.properties?.layer === "civic_service_anchor")
          : [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
        renderDetail();
      })
      .catch((error) => {
        if (state.civicServiceFeaturesPathLoaded !== path) return;
        state.civicServiceFeatures = [];
        console.warn("[atlas] civic service context unavailable", error);
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
        renderDetail();
      });
  }

  function updateEconomyAnchorFeatureCache(path) {
    if (!path) {
      if (state.economyAnchorFeaturesPathLoaded !== null || state.economyAnchorFeatures.length) {
        state.economyAnchorFeaturesPathLoaded = null;
        state.economyAnchorFeatures = [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      }
      return;
    }
    if (state.economyAnchorFeaturesPathLoaded === path) return;
    state.economyAnchorFeaturesPathLoaded = path;
    state.economyAnchorFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.economyAnchorFeaturesPathLoaded !== path) return;
        state.economyAnchorFeatures = Array.isArray(payload.features)
          ? payload.features.filter((feature) => feature.geometry && feature.properties?.layer === "economy_anchor")
          : [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      })
      .catch((error) => {
        if (state.economyAnchorFeaturesPathLoaded !== path) return;
        state.economyAnchorFeatures = [];
        console.warn("[atlas] economy anchor context unavailable", error);
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      });
  }

  function updateUtilityNetworkSource(path) {
    const source = state.map?.getSource(UTILITY_NETWORK_SOURCE_ID);
    if (!source?.setData) return;
    if (!path) {
      if (state.utilityNetworkPathLoaded !== "") {
        source.setData(emptyFeatureCollection());
        state.utilityNetworkPathLoaded = "";
        updateUtilityNetworkFeatureCache("");
      }
      return;
    }
    if (state.utilityNetworkPathLoaded !== path) {
      source.setData(path);
      state.utilityNetworkPathLoaded = path;
    }
    updateUtilityNetworkFeatureCache(path);
  }

  function updateUtilityNetworkFeatureCache(path) {
    if (!path) {
      if (state.utilityNetworkFeaturesPathLoaded !== null || state.utilityNetworkFeatures.length) {
        state.utilityNetworkFeaturesPathLoaded = null;
        state.utilityNetworkFeatures = [];
        updateLensGuideSource();
        renderLayers();
      }
      return;
    }
    if (state.utilityNetworkFeaturesPathLoaded === path) return;
    state.utilityNetworkFeaturesPathLoaded = path;
    state.utilityNetworkFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.utilityNetworkFeaturesPathLoaded !== path) return;
        state.utilityNetworkFeatures = Array.isArray(payload.features)
          ? payload.features.filter((feature) => feature.geometry && feature.properties?.layer === "utility_network")
          : [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      })
      .catch((error) => {
        if (state.utilityNetworkFeaturesPathLoaded !== path) return;
        state.utilityNetworkFeatures = [];
        console.warn("[atlas] utility network context unavailable", error);
        updateLensGuideSource();
        renderLayers();
      });
  }

  function updateTransportStopFeatureCache(path) {
    if (!path) {
      if (state.transportStopFeaturesPathLoaded !== null || state.transportStopFeatures.length) {
        state.transportStopFeaturesPathLoaded = null;
        state.transportStopFeatures = [];
        updateLensGuideSource();
      }
      return;
    }
    if (state.transportStopFeaturesPathLoaded === path) return;
    state.transportStopFeaturesPathLoaded = path;
    state.transportStopFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.transportStopFeaturesPathLoaded !== path) return;
        state.transportStopFeatures = Array.isArray(payload.features)
          ? payload.features.filter((feature) => feature.geometry?.type === "Point")
          : [];
        updateLensGuideSource();
      })
      .catch((error) => {
        if (state.transportStopFeaturesPathLoaded !== path) return;
        state.transportStopFeatures = [];
        console.warn("[atlas] transport stop coverage unavailable", error);
        updateLensGuideSource();
      });
  }

  function updateLensDetailYearSource() {
    const source = state.map?.getSource(LENS_DETAIL_SOURCE_ID);
    if (!source?.setData) return;
    if (!shouldLoadLensDetail()) {
      if (state.lensDetailYearPathLoaded !== "") {
        source.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
        updateLensDetailFeatureCache("");
      }
      return;
    }
    const path = lensDetailYearPath(state.year);
    if (!path) {
      if (state.lensDetailYearPathLoaded !== "") {
        source.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
        updateLensDetailFeatureCache("");
      }
      return;
    }
    if (state.lensDetailYearPathLoaded === path) {
      updateLensDetailFeatureCache(path);
      return;
    }
    source.setData(path);
    state.lensDetailYearPathLoaded = path;
    state.lensDetailYearLoaded = currentTimelineYear();
    updateLensDetailFeatureCache(path);
  }

  function updateLensDetailFeatureCache(path) {
    if (!path) {
      state.lensDetailFeaturePathLoaded = null;
      state.lensDetailFeatures = [];
      updateLensGuideSource();
      renderLayers();
      renderLensLegend();
      return;
    }
    if (state.lensDetailFeaturePathLoaded === path) return;
    state.lensDetailFeaturePathLoaded = path;
    state.lensDetailFeatures = [];
    fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (state.lensDetailFeaturePathLoaded !== path) return;
        state.lensDetailFeatures = Array.isArray(payload.features) ? payload.features.filter((feature) => feature.geometry) : [];
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      })
      .catch((error) => {
        if (state.lensDetailFeaturePathLoaded !== path) return;
        state.lensDetailFeatures = [];
        console.warn("[atlas] lens detail cache unavailable", error);
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      });
  }

  function updateTimeDependentMapState() {
    ensureDetailLayers();
    ensureLensOverlays();
    updateDetailLayerFilters();
    updateLensOverlayFilters();
  }

  function updateLensEventSource() {
    const source = state.map?.getSource(LENS_SOURCE_ID);
    if (!source?.setData) return;
    const key = lensEventSourceKey();
    if (state.lensEventSourceKey === key) return;
    const collection = lensEventFeatureCollection();
    source.setData(collection);
    state.lensEventFeatureCount = collection.features.length;
    state.lensEventSourceKey = key;
  }

  function updateLensGuideSource() {
    const source = state.map?.getSource(LENS_GUIDE_SOURCE_ID);
    if (!source?.setData) {
      state.lensGuideFeatureCache = emptyFeatureCollection();
      renderLensGuideLabels();
      return;
    }
    const collection = lensGuideFeatureCollection();
    source.setData(collection);
    state.lensGuideFeatureCache = collection;
    if (state.map?.getLayer("lens-guide-flow")) updateLensGuideLayers();
    else renderLensGuideLabels();
  }

  function lensGuideFeatureCollection() {
    const lens = activeMapLens();
    const center = state.selectedEvent?.lngLat || mapCenter();
    const radiusM = lensEffectiveRadiusM(lens);
    const features = [];
    const accent = lens.accent || LAYER_BY_ID.get(lens.category)?.color || "#1b7a85";
    const guideAccent = lens.id === "civic-access-gaps" || lens.id === "planning-pressure" ? "#6e9baa" : accent;
    features.push({
      type: "Feature",
      properties: {
        kind: "study_area",
        lens_id: lens.id,
        radius_m: radiusM,
        color: guideAccent,
        label: `Study area ${(radiusM / 1000).toFixed(radiusM >= 1000 ? 1 : 0)} km`,
      },
      geometry: circlePolygon(center, radiusM, 96),
    });
    features.push(...rangeRingFeatures(center, radiusM, lens, guideAccent));

    if (lens.id === "transport-access") {
      features.push(...transportAccessFabricCells(center, radiusM, lens));
    } else if (["planning-delta", "planning-parcels"].includes(lens.id)) {
      features.push(...planningFootprintTileFeatures(center, radiusM, lens));
    } else if (lens.id === "civic-catchment") {
      features.push(...civicCatchmentPatchFeatures(center, radiusM, lens));
    } else if (lens.id === "civic-demand") {
      features.push(...civicDemandSurfaceCells(center, radiusM, lens));
    } else if (lens.id === "economy-land-use") {
      features.push(...economyLandUseTileFeatures(center, radiusM, lens));
    } else if (lens.id === "utilities-resilience") {
      features.push(...utilityExposureAreaFeatures(center, radiusM, lens));
    }

    if (["transport-speed", "transport-reliability", "planning-pressure", "civic-access-gaps", "economy-vitality", "economy-gravity", "utilities-capacity", "utilities-resilience", "utilities-works"].includes(lens.id)) {
      features.push(...flowGuideFeatures(center, lens));
    }
    if (["transport-speed", "transport-access", "transport-reliability", "economy-vitality", "economy-gravity", "utilities-resilience", "utilities-capacity", "utilities-works", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id)) {
      features.push(...nodeGuideFeatures(center, lens));
    }
    return { type: "FeatureCollection", features };
  }

  function rangeRingFeatures(center, radiusM, lens, accent) {
    if (!["transport-speed", "transport-reliability", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id)) return [];
    const stops = lens.id === "civic-access-gaps"
      ? [1]
      : ["civic-catchment", "civic-demand"].includes(lens.id)
      ? [1]
      : lens.id.startsWith("transport") ? [0.35, 0.68, 1] : [0.42, 0.72, 1];
    return stops.map((scale, index) => ({
      type: "Feature",
      properties: {
        kind: "range_ring",
        lens_id: lens.id,
        radius_m: Math.round(radiusM * scale),
        intensity: Number((0.35 + index * 0.28).toFixed(2)),
        color: accent,
      },
      geometry: circlePolygon(center, radiusM * scale, 96),
    }));
  }

  function utilityExposureAreaFeatures(center, radiusM, lens) {
    if (lens.id !== "utilities-resilience") return [];
    const maxDistance = radiusM * 1.2;
    const utilityEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "utilities" && event.lngLat);
    const candidates = [];
    for (const feature of state.utilityNetworkFeatures || []) {
      const props = feature.properties || {};
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance < radiusM * 0.22 || distance > maxDistance) continue;
      const rank = Number(props.rank || 1);
      const assetPriority = Number(props.asset_priority || 0);
      const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.18, rank * 0.025) + Math.min(0.16, assetPriority * 0.035));
      candidates.push({
        point,
        distance,
        eventId: "",
        utilityType: props.utility_type || "utility",
        sourceId: props.source_id || "",
        score: intensity * 0.48 + (1 - Math.min(distance, maxDistance) / maxDistance) * 0.24 + Math.min(0.2, rank * 0.036) + Math.min(0.18, assetPriority * 0.04),
      });
    }
    for (const feature of state.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (!["utility_asset", "utility_trace"].includes(props.layer)) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance < radiusM * 0.2 || distance > maxDistance) continue;
      const eventCount = Number(props.event_count || 1);
      const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.22, eventCount * 0.016));
      candidates.push({
        point,
        distance,
        eventId: firstDetailEventId(props),
        utilityType: props.utility_type || "utility",
        sourceId: props.source_ids || props.source_id || "",
        score: intensity * 0.54 + (1 - Math.min(distance, maxDistance) / maxDistance) * 0.2 + Math.min(0.22, eventCount * 0.01),
      });
    }
    for (const event of utilityEvents) {
      const distance = lngLatDistanceMeters(center, event.lngLat);
      if (distance < radiusM * 0.22 || distance > maxDistance) continue;
      candidates.push({
        point: event.lngLat,
        distance,
        eventId: event.id,
        utilityType: utilityEventType(event, null),
        sourceId: (event.sourceIds || []).join(","),
        score: 0.42 + confidenceRank(event.confidence) * 0.06 + lensHeatWeight(event) * 0.12 + (1 - Math.min(distance, maxDistance) / maxDistance) * 0.18,
      });
    }
    const selected = [];
    const buckets = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      if (selected.length >= 4) break;
      const bucket = transportAngleBucket(center, item.point, 12);
      if (buckets.has(bucket)) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < 430)) continue;
      selected.push(item);
      buckets.set(bucket, true);
    }
    return selected.map((item, index) => {
      const angle = Math.atan2(item.point[1] - center[1], item.point[0] - center[0]);
      const seed = stableUnit(`${item.sourceId}:${item.eventId}:${index}`);
      const radiusX = 155 + item.score * 145 + seed * 42;
      const radiusY = 92 + item.score * 94 + (1 - seed) * 28;
      const rotation = angle + (seed - 0.5) * 0.9;
      return {
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "utility_outage_area",
          utility_type: item.utilityType,
          source_id: item.sourceId,
          event_id: item.eventId,
          intensity: Number(clamp01(0.38 + item.score * 0.62).toFixed(3)),
          color: "#b93234",
          label: "Service exposure guide area",
        },
        geometry: ellipsePolygon(item.point, radiusX, radiusY, rotation, 72),
      };
    });
  }

  function hexGuideCells(center, radiusM, lens, stepM = 210) {
    const features = [];
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === (lens.category || state.activeLens) && event.lngLat);
    const limit = guideCellLimit(lens.id);
    let row = 0;
    for (let dy = -radiusM; dy <= radiusM; dy += stepM * 0.82) {
      const offset = row % 2 ? stepM * 0.5 : 0;
      for (let dx = -radiusM + offset; dx <= radiusM; dx += stepM) {
        const distance = Math.hypot(dx, dy);
        if (distance > radiusM * 0.98) continue;
        const angle = Math.atan2(dy, dx);
        const cellCenter = offsetLngLat(center, dx, dy);
        const intensity = eventSurfaceIntensity(cellCenter, center, radiusM, sourceEvents);
        const nearestEvent = nearestGuideEvent(cellCenter, sourceEvents, radiusM * 0.72);
        const color = surfaceColorForLens(lens.id, intensity, angle, nearestEvent, lens);
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            intensity: Number(intensity.toFixed(3)),
            color,
            event_id: nearestEvent?.id || "",
          },
          geometry: hexPolygon(cellCenter, stepM * 0.48),
        });
      }
      row += 1;
    }
    return features
      .sort((a, b) => (Number(b.properties.intensity) - Number(a.properties.intensity)))
      .slice(0, limit);
  }

  function guideCellLimit(lensId) {
    if (lensId === "transport-access") return 6500;
    if (lensId === "planning-delta") return 4800;
    if (lensId === "planning-parcels") return 4300;
    if (lensId === "economy-land-use") return 5000;
    if (lensId === "civic-demand") return 4200;
    if (lensId === "civic-catchment") return 2200;
    return 180;
  }

  function transportAccessFabricCells(center, radiusM, lens) {
    const anchors = nearbyTransportRoadAnchors(center, radiusM * 3.25, 1150);
    if (!anchors.length) return transportAccessRadialCells(center, radiusM, lens);
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "transport" && event.lngLat);
    const cells = [];
    const stepM = 88;
    const extentM = radiusM * 2.35;
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.82) {
      const rowOffset = row % 2 ? stepM * 0.5 : 0;
      for (let dx = -extentM + rowOffset; dx <= extentM; dx += stepM) {
        const cellCenter = offsetLngLat(center, dx, dy);
        const radial = lngLatDistanceMeters(center, cellCenter);
        const nearestRoad = nearestRoadAnchor(cellCenter, anchors, 430);
        const roadCloseness = nearestRoad ? clamp01(1 - nearestRoad.distance / 430) : 0;
        const roadBoost = nearestRoad ? roadCloseness * (0.5 + nearestRoad.activity * 0.36 + Math.min(0.14, nearestRoad.rank * 0.035)) : 0;
        const nearestEvent = nearestGuideEvent(cellCenter, sourceEvents, radiusM * 1.55);
        const eventBoost = nearestEvent ? 1 - Math.min(radiusM * 1.55, lngLatDistanceMeters(cellCenter, nearestEvent.lngLat)) / (radiusM * 1.55) : 0;
        const angle = Math.atan2(dy, dx);
        const anchorSeed = stableUnit(`${nearestRoad?.id || ""}:${Math.round((nearestRoad?.point?.[0] || center[0]) * 10000)}`);
        const streetReach = nearestRoad
          ? 1.14 + nearestRoad.activity * 0.78 + Math.min(0.3, nearestRoad.rank * 0.07)
          : 1.02;
        const directionalReach = 1
          + Math.sin(angle * 2.2 + anchorSeed * Math.PI * 2) * 0.18
          + Math.cos(angle * 4.4 + anchorSeed * Math.PI) * 0.09;
        const reachM = Math.max(extentM * 0.78, radiusM * streetReach * directionalReach + roadBoost * 360 + eventBoost * 170);
        const offNetworkPenalty = nearestRoad ? Math.max(0, nearestRoad.distance - 150) / 28 : 7;
        const radialMinutes = 10 + Math.pow(radial / Math.max(1, extentM), 1.02) * 60;
        const networkMinutes = 8.5 + Math.pow(radial / Math.max(1, reachM), 0.95) * 55;
        const minutes = Math.min(radialMinutes, networkMinutes + offNetworkPenalty)
          - roadBoost * 6.5
          - eventBoost * 3;
        if (minutes > 82) continue;
        const intensity = clamp01(1 - (minutes - 8) / 74);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "access_fabric",
            intensity: Number(intensity.toFixed(3)),
            minutes: Math.round(minutes),
            color: accessBandColor(minutes),
            event_id: nearestEvent?.id || "",
            score: Number((intensity + roadBoost * 0.3 + stableUnit(`${dx}:${dy}`) * 0.025).toFixed(3)),
          },
          geometry: hexPolygon(cellCenter, stepM * (0.55 + roadCloseness * 0.08)),
        });
      }
      row += 1;
    }
    return cells
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function transportAccessRadialCells(center, radiusM, lens) {
    const cells = [];
    const stepM = 74;
    const extentM = radiusM * 1.55;
    for (let dy = -extentM; dy <= extentM; dy += stepM) {
      for (let dx = -extentM; dx <= extentM; dx += stepM) {
        const radial = Math.hypot(dx, dy);
        if (radial > extentM) continue;
        const cellCenter = offsetLngLat(center, dx, dy);
        const minutes = 12 + Math.pow(radial / Math.max(1, extentM), 0.94) * 62;
        const intensity = clamp01(1 - (minutes - 12) / 62);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "access_fabric",
            intensity: Number(intensity.toFixed(3)),
            minutes: Math.round(minutes),
            color: accessBandColor(minutes),
            event_id: "",
            score: Number((intensity + stableUnit(`access:${Math.round(dx)}:${Math.round(dy)}`) * 0.02).toFixed(3)),
          },
          geometry: circlePolygon(cellCenter, stepM * 1.02, 18),
        });
      }
    }
    return cells
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function civicDemandSurfaceCells(center, radiusM, lens) {
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "civic_services" && event.lngLat);
    if (!sourceEvents.length) return [];
    const year = currentTimelineYear();
    const detailAnchors = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "civic_facility" && Number(feature.properties?.visible_year || 9999) <= year)
      .map((feature) => {
        const point = geometryToLngLat(feature.geometry);
        return point ? { id: firstDetailEventId(feature.properties || {}) || feature.properties?.source_id || "", lngLat: point, confidence: feature.properties?.confidence || "documented" } : null;
      })
      .filter(Boolean);
    const serviceAnchors = detailAnchors.length ? detailAnchors : sourceEvents;
    const features = [];
    const stepM = 48;
    const extentM = radiusM * 1.08;
    const kernelM = radiusM * 0.46;
    const axisAngle = civicDemandAxisAngle(center, sourceEvents, radiusM * 1.25);
    const axisCos = Math.cos(axisAngle);
    const axisSin = Math.sin(axisAngle);
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.86) {
      const rowOffset = row % 2 ? stepM * 0.5 : 0;
      for (let dx = -extentM + rowOffset; dx <= extentM; dx += stepM) {
        const seed = stableUnit(`demand-cell:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const seedY = stableUnit(`demand-cell-y:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const cellDx = dx + (seed - 0.5) * stepM * 0.12;
        const cellDy = dy + (seedY - 0.5) * stepM * 0.1;
        const distance = Math.hypot(cellDx, cellDy);
        if (distance > extentM) continue;
        const cellCenter = offsetLngLat(center, cellDx, cellDy);
        const tightDensity = eventDensityIntensity(cellCenter, sourceEvents, kernelM);
        const broadDensity = eventDensityIntensity(cellCenter, sourceEvents, radiusM * 0.78);
        const serviceDensity = eventDensityIntensity(cellCenter, serviceAnchors, radiusM * 0.38);
        const radial = 1 - Math.min(extentM, distance) / extentM;
        const nearestEvent = nearestGuideEvent(cellCenter, sourceEvents, radiusM * 0.72);
        const eventBoost = nearestEvent ? Math.max(0, 1 - lngLatDistanceMeters(cellCenter, nearestEvent.lngLat) / (radiusM * 0.72)) : 0;
        const selectedPressure = Math.max(0, 1 - distance / (radiusM * 0.58));
        const crossAxis = Math.abs(cellDx * axisSin - cellDy * axisCos);
        const alongAxis = Math.abs(cellDx * axisCos + cellDy * axisSin);
        const civicAxisPressure = Math.max(0, 1 - crossAxis / (radiusM * 0.18)) * Math.max(0, 1 - alongAxis / (radiusM * 0.95));
        const serviceGap = Math.max(0, 0.45 - serviceDensity);
        const densityLift = Math.pow(Math.max(0, tightDensity), 0.72);
        const rawIntensity = 0.14
          + densityLift * 0.48
          + broadDensity * 0.14
          + eventBoost * 0.14
          + selectedPressure * 0.24
          + civicAxisPressure * 0.18
          + serviceGap * 0.1
          + radial * 0.08;
        const edgeCap = 0.56 + radial * 0.42;
        const intensity = clamp01(Math.min(rawIntensity, edgeCap));
        const angle = Math.atan2(cellDy, cellDx);
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "demand_surface",
            intensity: Number(intensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, intensity, angle, nearestEvent, lens),
            event_id: nearestEvent?.id || "",
            score: Number((intensity + seed * 0.025).toFixed(3)),
          },
          geometry: hexPolygon(cellCenter, stepM * 0.48),
        });
      }
      row += 1;
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function civicCatchmentPatchFeatures(center, radiusM, lens) {
    const year = currentTimelineYear();
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const candidates = civicCatchmentCandidates(center, radiusM, lens, sourceEvents, year);
    const selected = selectCivicCatchmentCandidates(center, candidates, lens, 54);
    const sectorFeatures = civicCatchmentSectorFeatures(center, radiusM, lens, selected);
    if (sectorFeatures.length >= 4) return sectorFeatures;
    const fallbackSources = sourceEvents.map((event) => ({
      id: event.id,
      title: event.title,
      shortDescription: event.shortDescription || "",
      summary: event.summary || "",
      area: event.area || "",
      affectedSignals: event.affectedSignals || [],
      lngLat: event.lngLat,
      confidence: event.confidence || "documented",
    }));
    return civicCatchmentMosaicPatches(center, radiusM, lens, fallbackSources)
      .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
      .slice(0, guideCellLimit(lens.id));
  }

  function civicCatchmentCandidates(center, radiusM, lens, sourceEvents, year) {
    const maxDistance = radiusM * 1.42;
    const candidates = [];
    const activeSublayers = new Set(activeSublayerIdsForLens(lens));
    const includeLayer = (layerId) => !activeSublayers.size || activeSublayers.has(layerId);
    for (const feature of state.civicServiceFeatures || []) {
      const props = feature.properties || {};
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const layerId = civicServiceSublayerKey(props);
      if (!includeLayer(layerId)) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const rank = Number(props.rank || 1);
      const named = props.label && !/^school or|^health service|^leisure or|^council or|^library or|^safety service/i.test(String(props.label));
      const score = proximity * 0.5 + Math.min(0.28, rank * 0.06) + (named ? 0.14 : 0) + stableUnit(`${props.source_id || ""}:${layerId}`) * 0.08;
      candidates.push({
        point,
        layerId,
        props,
        event: null,
        sourceId: props.source_id || "",
        currentContext: true,
        distance,
        angle: Math.atan2(point[1] - center[1], point[0] - center[0]),
        intensity: clamp01(0.34 + proximity * 0.34 + Math.min(0.24, rank * 0.05)),
        score,
      });
    }
    for (const feature of state.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "civic_facility" || Number(props.visible_year || 9999) > year) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const eventId = firstDetailEventId(props);
      const event = state.eventById.get(eventId) || sourceEvents.find((candidate) => candidate.id === eventId) || null;
      const layerId = civicServiceSublayerKey(props, event);
      if (!includeLayer(layerId)) continue;
      const serviceDensity = eventDensityIntensity(point, sourceEvents, radiusM * 0.74);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const countBoost = Math.min(0.18, Number(props.event_count || 1) * 0.022);
      candidates.push({
        point,
        layerId,
        props,
        event,
        sourceId: props.source_ids || "",
        currentContext: false,
        distance,
        angle: Math.atan2(point[1] - center[1], point[0] - center[0]),
        intensity: clamp01(0.36 + serviceDensity * 0.28 + proximity * 0.24 + countBoost),
        score: 0.12 + proximity * 0.42 + serviceDensity * 0.32 + countBoost + stableUnit(`${eventId}:${props.label || ""}`) * 0.08,
      });
    }
    for (const event of sourceEvents) {
      const distance = lngLatDistanceMeters(center, event.lngLat);
      if (distance > maxDistance) continue;
      const layerId = civicServiceSublayerKey(event);
      if (!includeLayer(layerId)) continue;
      const serviceDensity = eventDensityIntensity(event.lngLat, sourceEvents, radiusM * 0.74);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      candidates.push({
        point: event.lngLat,
        layerId,
        props: {},
        event,
        sourceId: (event.sourceIds || []).join(","),
        currentContext: false,
        distance,
        angle: Math.atan2(event.lngLat[1] - center[1], event.lngLat[0] - center[0]),
        intensity: clamp01(0.38 + serviceDensity * 0.28 + proximity * 0.24),
        score: 0.16 + proximity * 0.44 + serviceDensity * 0.3 + confidenceRank(event.confidence) * 0.025 + stableUnit(event.id) * 0.08,
      });
    }
    return candidates;
  }

  function selectCivicCatchmentCandidates(center, candidates, lens, limit = 18) {
    const activeSublayers = new Set(activeSublayerIdsForLens(lens));
    const eligible = candidates
      .filter((item) => !activeSublayers.size || activeSublayers.has(item.layerId))
      .sort((a, b) => b.score - a.score);
    const selected = [];
    const typeCounts = new Map();
    const angleBuckets = new Map();
    const add = (item, strict = true) => {
      if (selected.length >= limit) return false;
      const typeCount = typeCounts.get(item.layerId) || 0;
      if (strict && typeCount >= 8) return false;
      const bucket = transportAngleBucket(center, item.point, 22);
      const bucketCount = angleBuckets.get(bucket) || 0;
      if (strict && bucketCount >= 3) return false;
      const minSpacing = strict ? 105 : 72;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacing)) return false;
      selected.push(item);
      typeCounts.set(item.layerId, typeCount + 1);
      angleBuckets.set(bucket, bucketCount + 1);
      return true;
    };
    for (const layerId of activeSublayers) {
      const best = eligible.find((item) => item.layerId === layerId && !selected.includes(item));
      if (best) add(best, false);
    }
    for (const item of eligible) add(item, true);
    if (selected.length < Math.min(limit, eligible.length)) {
      for (const item of eligible) add(item, false);
    }
    return selected
      .map((item) => ({ ...item, angle: Math.atan2(item.point[1] - center[1], item.point[0] - center[0]) }))
      .sort((a, b) => a.angle - b.angle);
  }

  function civicCatchmentSectorFeatures(center, radiusM, lens, anchors) {
    if (anchors.length < 3) return [];
    const serviceCells = civicCatchmentServiceCellFeatures(center, radiusM, lens, anchors);
    if (serviceCells.length >= 40) return serviceCells;
    const voronoiFeatures = civicCatchmentVoronoiFeatures(center, radiusM, lens, anchors);
    if (voronoiFeatures.length >= 4) return voronoiFeatures;
    const features = [];
    const sorted = anchors
      .map((item) => ({ ...item, angle: Math.atan2(item.point[1] - center[1], item.point[0] - center[0]) }))
      .sort((a, b) => a.angle - b.angle);
    const twoPi = Math.PI * 2;
    for (let index = 0; index < sorted.length; index += 1) {
      const item = sorted[index];
      const prev = sorted[(index - 1 + sorted.length) % sorted.length];
      const next = sorted[(index + 1) % sorted.length];
      const prevAngle = prev.angle > item.angle ? prev.angle - twoPi : prev.angle;
      const nextAngle = next.angle < item.angle ? next.angle + twoPi : next.angle;
      let start = (prevAngle + item.angle) / 2;
      let end = (item.angle + nextAngle) / 2;
      const maxSpan = 0.82 + stableUnit(`${item.sourceId || item.event?.id || index}:span`) * 0.34;
      if (end - start > maxSpan) {
        const mid = item.angle;
        start = mid - maxSpan / 2;
        end = mid + maxSpan / 2;
      }
      const seed = stableUnit(`${item.sourceId || item.event?.id || index}:catchment-sector`);
      const outerBase = Math.max(
        radiusM * 0.52,
        Math.min(radiusM * 1.06, item.distance + 360 + item.intensity * 280 + seed * 110),
      );
      const innerBase = Math.max(35, Math.min(radiusM * 0.18, item.distance * 0.22));
      const geometry = civicCatchmentSectorPolygon(center, start, end, innerBase, outerBase, seed);
      features.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "catchment_area",
          sublayer_id: item.layerId,
          service_type: item.layerId,
          intensity: Number(item.intensity.toFixed(3)),
          color: surfaceColorForLens(lens.id, item.intensity, item.angle || 0, item.event, lens),
          event_id: item.event?.id || firstDetailEventId(item.props || {}) || "",
          source_id: item.sourceId || "",
          label: item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId),
          score: Number((item.score + item.intensity * 0.12).toFixed(3)),
          context: item.currentContext ? "current_osm_context" : "selected_year_record",
        },
        geometry,
      });
    }
    return features;
  }

  function civicCatchmentServiceCellFeatures(center, radiusM, lens, anchors) {
    const selected = anchors
      .map((item, index) => ({
        ...item,
        index,
        local: lngLatToLocalMeters(item.point, center),
      }))
      .filter((item) => Number.isFinite(item.local[0]) && Number.isFinite(item.local[1]));
    if (selected.length < 3) return [];
    const cells = [];
    const stepM = 118;
    const extentM = radiusM * 1.02;
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM) {
      for (let dx = -extentM; dx <= extentM; dx += stepM) {
        const seed = stableUnit(`catchment-cell:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const seedY = stableUnit(`catchment-cell-y:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const cellDx = dx + (seed - 0.5) * stepM * 0.08;
        const cellDy = dy + (seedY - 0.5) * stepM * 0.08;
        const radial = Math.hypot(cellDx, cellDy);
        if (radial > extentM) continue;
        const nearest = nearestCivicCatchmentAnchorLocal([cellDx, cellDy], selected);
        if (!nearest) continue;
        const proximity = 1 - Math.min(extentM, radial) / extentM;
        const anchorCloseness = 1 - Math.min(radiusM * 0.7, nearest.distance) / (radiusM * 0.7);
        const intensity = clamp01(0.24 + proximity * 0.08 + anchorCloseness * 0.5 + nearest.item.intensity * 0.16);
        const cellCenter = offsetLngLat(center, cellDx, cellDy);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "catchment_patch",
            sublayer_id: nearest.item.layerId,
            service_type: nearest.item.layerId,
            intensity: Number(intensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, intensity, Math.atan2(cellDy, cellDx), nearest.item.event, lens),
            event_id: nearest.item.event?.id || firstDetailEventId(nearest.item.props || {}) || "",
            source_id: nearest.item.sourceId || "",
            label: nearest.item.event?.title || nearest.item.props?.label || nearest.item.props?.name || civicServiceSublayerLabel(nearest.item.layerId),
            score: Number((intensity + seed * 0.04 + nearest.item.score * 0.05).toFixed(3)),
            context: nearest.item.currentContext ? "current_osm_context" : "selected_year_record",
          },
          geometry: orientedRectanglePolygon(
            cellCenter,
            stepM * (0.72 + seed * 0.08),
            stepM * (0.68 + seedY * 0.08),
            (seed - 0.5) * 0.08,
          ),
        });
      }
      row += 1;
    }
    return cells
      .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
      .slice(0, guideCellLimit(lens.id));
  }

  function nearestCivicCatchmentAnchorLocal(point, anchors) {
    let best = null;
    let bestDistance = Infinity;
    for (const item of anchors) {
      const dx = point[0] - item.local[0];
      const dy = point[1] - item.local[1];
      const distance = Math.hypot(dx, dy);
      const adjusted = distance / Math.max(0.76, 0.9 + Number(item.intensity || 0.5) * 0.22 + Math.min(0.16, Number(item.score || 0) * 0.08));
      if (adjusted < bestDistance) {
        best = { item, distance };
        bestDistance = adjusted;
      }
    }
    return best;
  }

  function civicCatchmentAnchorAxisAngle(anchors) {
    if (!anchors.length) return Math.PI / 12;
    let xx = 0, yy = 0, xy = 0;
    for (const item of anchors) {
      const [x, y] = item.local;
      const weight = Math.max(0.12, Number(item.score || 0.5));
      xx += x * x * weight;
      yy += y * y * weight;
      xy += x * y * weight;
    }
    if (Math.abs(xx - yy) + Math.abs(xy) < 1) return Math.PI / 12;
    return 0.5 * Math.atan2(2 * xy, xx - yy);
  }

  function civicCatchmentVoronoiFeatures(center, radiusM, lens, anchors) {
    const selected = anchors
      .map((item, index) => ({
        ...item,
        index,
        local: lngLatToLocalMeters(item.point, center),
      }))
      .filter((item) => Number.isFinite(item.local[0]) && Number.isFinite(item.local[1]));
    if (selected.length < 3) return [];
    const clipRadius = radiusM * 1.03;
    const base = [];
    const ringSteps = 96;
    for (let i = 0; i < ringSteps; i += 1) {
      const angle = (i / ringSteps) * Math.PI * 2;
      base.push([Math.cos(angle) * clipRadius, Math.sin(angle) * clipRadius]);
    }
    const features = [];
    for (const item of selected) {
      let polygon = base;
      const [ax, ay] = item.local;
      for (const other of selected) {
        if (other.index === item.index) continue;
        const [bx, by] = other.local;
        if (Math.hypot(ax - bx, ay - by) < 5) continue;
        polygon = clipPolygonToNearestAnchorHalfPlane(polygon, ax, ay, bx, by);
        if (polygon.length < 3) break;
      }
      const area = Math.abs(localPolygonArea(polygon));
      if (polygon.length < 3 || area < 900) continue;
      const coordinates = polygon.map(([x, y]) => offsetLngLat(center, x, y));
      coordinates.push(coordinates[0]);
      features.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "catchment_area",
          sublayer_id: item.layerId,
          service_type: item.layerId,
          intensity: Number(item.intensity.toFixed(3)),
          color: surfaceColorForLens(lens.id, item.intensity, Math.atan2(item.local[1], item.local[0]), item.event, lens),
          event_id: item.event?.id || firstDetailEventId(item.props || {}) || "",
          source_id: item.sourceId || "",
          label: item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId),
          score: Number((item.score + item.intensity * 0.12 + Math.min(0.16, area / (clipRadius * clipRadius * Math.PI) * 0.6)).toFixed(3)),
          context: item.currentContext ? "current_osm_context" : "selected_year_record",
        },
        geometry: { type: "Polygon", coordinates: [coordinates] },
      });
    }
    return features.sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0));
  }

  function clipPolygonToNearestAnchorHalfPlane(polygon, ax, ay, bx, by) {
    if (!polygon.length) return [];
    const nx = bx - ax;
    const ny = by - ay;
    const c = (bx * bx + by * by - ax * ax - ay * ay) / 2;
    const inside = (point) => point[0] * nx + point[1] * ny <= c + 1e-6;
    const intersection = (from, to) => {
      const fromValue = from[0] * nx + from[1] * ny - c;
      const toValue = to[0] * nx + to[1] * ny - c;
      const denom = fromValue - toValue;
      if (Math.abs(denom) < 1e-9) return to;
      const t = fromValue / denom;
      return [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
      ];
    };
    const output = [];
    for (let i = 0; i < polygon.length; i += 1) {
      const current = polygon[i];
      const previous = polygon[(i - 1 + polygon.length) % polygon.length];
      const currentInside = inside(current);
      const previousInside = inside(previous);
      if (currentInside) {
        if (!previousInside) output.push(intersection(previous, current));
        output.push(current);
      } else if (previousInside) {
        output.push(intersection(previous, current));
      }
    }
    return output;
  }

  function localPolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i += 1) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % points.length];
      area += x0 * y1 - x1 * y0;
    }
    return area / 2;
  }

  function civicCatchmentSectorPolygon(center, startAngle, endAngle, innerRadiusM, outerRadiusM, seed = 0.5) {
    const outer = [];
    const inner = [];
    const span = Math.max(0.12, endAngle - startAngle);
    const steps = Math.max(5, Math.min(13, Math.ceil(span / 0.11)));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = startAngle + span * t;
      const wobble = 0.94
        + Math.sin(t * Math.PI * 1.6 + seed * 5.1) * 0.055
        + Math.cos(angle * 2.3 + seed * 2.7) * 0.045;
      outer.push(offsetLngLat(center, Math.cos(angle) * outerRadiusM * wobble, Math.sin(angle) * outerRadiusM * wobble));
    }
    for (let i = steps; i >= 0; i -= 1) {
      const t = i / steps;
      const angle = startAngle + span * t;
      const wobble = 0.9 + Math.sin(t * Math.PI + seed * 3.3) * 0.035;
      inner.push(offsetLngLat(center, Math.cos(angle) * innerRadiusM * wobble, Math.sin(angle) * innerRadiusM * wobble));
    }
    const ring = [...outer, ...inner];
    ring.push(ring[0]);
    return { type: "Polygon", coordinates: [ring] };
  }

  function civicCoverageCellPatchFeatures(center, radiusM, lens, sourceEvents, year) {
    const features = [];
    const maxDistance = radiusM * 1.45;
    for (const feature of state.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "civic_coverage_cell" || Number(props.visible_year || props.year || 9999) > year) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const eventId = firstDetailEventId(props);
      const event = state.eventById.get(eventId) || sourceEvents.find((candidate) => candidate.id === eventId) || {
        id: eventId || props.id || "",
        title: props.service_type || props.title || "Civic service",
        shortDescription: props.service_type || "",
        summary: props.label || props.title || "",
        area: props.road_name || "",
        affectedSignals: [props.service_type, props.status].filter(Boolean),
        confidence: props.confidence || "documented",
      };
      const baseIntensity = Number(props.intensity || 0.42);
      const eventCountBoost = Math.min(0.16, Number(props.event_count || 1) * 0.025);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(0.2 + baseIntensity * 0.46 + eventCountBoost + proximity * 0.18);
      const angle = Math.atan2(point[1] - center[1], point[0] - center[0]);
      features.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "catchment_patch",
          intensity: Number(intensity.toFixed(3)),
          color: civicCatchmentColor(event, angle, props.id || eventId),
          event_id: eventId || event.id || "",
          source_id: props.source_ids || "",
          service_type: props.service_type || "",
          status: props.status || "",
          label: props.label || props.title || "",
          score: Number((intensity + proximity * 0.22 + stableUnit(`${props.id || ""}:${eventId}`) * 0.04).toFixed(3)),
        },
        geometry: feature.geometry,
      });
    }
    return features;
  }

  function distributedCatchmentCandidates(candidates, limit) {
    const buckets = new Map();
    for (const item of candidates) {
      const bucket = `${Math.floor(((item.angle + Math.PI) / (Math.PI * 2)) * 18)}:${String(item.props.service_type || item.event?.category || "service").toLowerCase()}`;
      const previous = buckets.get(bucket);
      if (!previous || item.score > previous.score) buckets.set(bucket, item);
    }
    const selected = [...buckets.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    if (selected.length >= limit) return selected;
    const selectedKeys = new Set(selected.map((item) => `${item.point[0].toFixed(6)},${item.point[1].toFixed(6)}`));
    const fillers = candidates
      .filter((item) => !selectedKeys.has(`${item.point[0].toFixed(6)},${item.point[1].toFixed(6)}`))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - selected.length);
    return [...selected, ...fillers];
  }

  function civicCatchmentMosaicPatches(center, radiusM, lens, sourceEvents) {
    if (!sourceEvents.length) return [];
    const patches = [];
    const stepM = 132;
    const extentM = radiusM * 0.98;
    const kernelM = radiusM * 0.58;
    const axisAngle = civicDemandAxisAngle(center, sourceEvents, radiusM * 1.2);
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.84) {
      const offset = row % 2 ? stepM * 0.48 : 0;
      for (let dx = -extentM + offset; dx <= extentM; dx += stepM) {
        const seed = stableUnit(`catchment-mosaic:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const seedY = stableUnit(`catchment-mosaic-y:${row}:${Math.round(dx)}:${Math.round(dy)}`);
        const patchDx = dx + (seed - 0.5) * stepM * 0.18;
        const patchDy = dy + (seedY - 0.5) * stepM * 0.16;
        const distance = Math.hypot(patchDx, patchDy);
        if (distance > extentM) continue;
        const patchCenter = offsetLngLat(center, patchDx, patchDy);
        const nearestEvent = nearestGuideEvent(patchCenter, sourceEvents, radiusM * 0.58);
        const density = eventDensityIntensity(patchCenter, sourceEvents, kernelM);
        const proximity = 1 - Math.min(extentM, distance) / extentM;
        const intensity = clamp01(0.2 + density * 0.36 + proximity * 0.18 + (nearestEvent ? 0.16 : 0));
        const eventSeed = stableUnit(`catchment-mosaic:${row}:${Math.round(dx)}:${Math.round(dy)}:${nearestEvent?.id || ""}`);
        const angle = Math.atan2(patchDy, patchDx);
        patches.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "catchment_patch",
            intensity: Number(intensity.toFixed(3)),
            color: nearestEvent ? civicCatchmentColor(nearestEvent, angle, `${row}:${Math.round(dx)}:${Math.round(dy)}`) : surfaceColorForLens(lens.id, intensity, angle, nearestEvent, lens),
            event_id: nearestEvent?.id || "",
            score: Number((intensity + eventSeed * 0.04).toFixed(3)),
          },
          geometry: orientedRectanglePolygon(
            patchCenter,
            stepM * (0.34 + seed * 0.12),
            stepM * (0.27 + seedY * 0.14),
            axisAngle + (eventSeed - 0.5) * 0.42,
          ),
        });
      }
      row += 1;
    }
    return patches;
  }

  function jitteredPatchPolygon(center, radiusM, seed = 0.5) {
    const ring = [];
    const steps = 7 + Math.floor(seed * 3);
    const rotation = seed * Math.PI * 2;
    for (let i = 0; i <= steps; i += 1) {
      const t = i % steps;
      const angle = rotation + (t / steps) * Math.PI * 2;
      const wobble = 0.84
        + Math.sin(angle * 2.2 + seed * 3.1) * 0.12
        + Math.cos(angle * 3.8 - seed * 2.4) * 0.08;
      const r = radiusM * Math.max(0.64, Math.min(1.08, wobble));
      ring.push(offsetLngLat(center, Math.cos(angle) * r, Math.sin(angle) * r));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function civicCatchmentColor(event, angle = 0, seedKey = "") {
    const text = [
      event?.title,
      event?.shortDescription,
      event?.summary,
      event?.area,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/school|education|college|student/.test(text)) return "#178f8f";
    if (/health|care|hospital|clinic|gp/.test(text)) return "#2a84a6";
    if (/library|culture|arts|museum/.test(text)) return "#74449a";
    if (/sport|leisure|park|play/.test(text)) return "#4f9a5b";
    if (/council|city hall|office|municipal/.test(text)) return "#26858a";
    if (/police|fire|safety|emergency/.test(text)) return "#c8472e";
    if (/boundary|ward|district|neighbourhood/.test(text)) return "#b996cb";
    const palette = ["#66aaa5", "#d8cf86", "#edae65", "#79a8c9", "#b996cb", "#78aa78", "#df8268"];
    const seed = stableUnit(`${event?.id || ""}:${seedKey}`);
    return palette[Math.abs(Math.floor((angle + Math.PI) * 2.7 + seed * palette.length)) % palette.length];
  }

  function civicServiceSublayerKey(input = {}, fallbackEvent = null) {
    const text = [
      input.sublayer_id,
      input.service_type,
      input.title,
      input.label,
      input.name,
      input.area,
      input.summary,
      input.shortDescription,
      ...(input.affectedSignals || []),
      fallbackEvent?.title,
      fallbackEvent?.summary,
      ...(fallbackEvent?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/police|fire|ambulance|emergency|safety|court|justice|prison/.test(text)) return "safety";
    if (/health|care|hospital|clinic|gp|doctor|dentist|pharmacy|nursing|radiopharmacy/.test(text)) return "health";
    if (/library|museum|arts|culture|cultural|gallery|theatre/.test(text)) return "libraries";
    if (/leisure|sport|sports|park|play|recreation|swimming|green/.test(text)) return "leisure";
    if (/council|city hall|government|office|municipal|community|public realm|service centre|customer service/.test(text)) return "council";
    if (/school|education|college|university|student|classroom|campus|nursery|academy/.test(text)) return "civic_services";
    return "civic_services";
  }

  function civicServiceSublayerColor(layerId) {
    const colors = {
      civic_services: "#178f8f",
      health: "#e85b1e",
      libraries: "#79419d",
      leisure: "#347db5",
      council: "#26858a",
      safety: "#8c5b3a",
    };
    return colors[layerId] || colors.civic_services;
  }

  function civicServiceSublayerLabel(layerId) {
    const labels = {
      civic_services: "Schools",
      health: "Health clinics",
      libraries: "Libraries",
      leisure: "Leisure centres",
      council: "Council offices",
      safety: "Safety services",
    };
    return labels[layerId] || labels.civic_services;
  }

  function accessBandColor(minutes) {
    if (minutes <= 18) return "#e4775f";
    if (minutes <= 30) return "#efaa62";
    if (minutes <= 44) return "#dfd27b";
    if (minutes <= 58) return "#95cbaa";
    return "#b8d8c3";
  }

  function densityGridCells(center, extentM, lens, stepM = 110) {
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === (lens.category || state.activeLens) && event.lngLat);
    if (!sourceEvents.length) return [];
    const cells = [];
    const kernelM = Math.max(420, stepM * 5.8);
    for (let dy = -extentM; dy <= extentM; dy += stepM) {
      for (let dx = -extentM; dx <= extentM; dx += stepM) {
        const cellCenter = offsetLngLat(center, dx, dy);
        const density = eventDensityIntensity(cellCenter, sourceEvents, kernelM);
        if (density < 0.13) continue;
        const angle = Math.atan2(dy, dx);
        const nearestEvent = nearestGuideEvent(cellCenter, sourceEvents, kernelM);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            intensity: Number(density.toFixed(3)),
            color: surfaceColorForLens(lens.id, density, angle, nearestEvent, lens),
            event_id: nearestEvent?.id || "",
          },
          geometry: squarePolygon(cellCenter, stepM * 0.48),
        });
      }
    }
    return cells
      .sort((a, b) => Number(b.properties.intensity) - Number(a.properties.intensity))
      .slice(0, guideCellLimit(lens.id));
  }

  function economyLandUseTileFeatures(center, radiusM, lens) {
    const buildings = state.detailBuildingFeatures || [];
    if (!buildings.length) return densityGridCells(center, radiusM * 2.1, lens, 92);
    const year = currentTimelineYear();
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "economy" && event.lngLat);
    const maxDistance = radiusM * 3.05;
    const features = [];
    for (const building of buildings) {
      const props = building.properties || {};
      if (Number(props.visible_year || 9999) > year) continue;
      const point = geometryToLngLat(building.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const area = Number(props.footprint_area_m2 || 0);
      if (area && area < 16) continue;
      const nearestEvent = nearestGuideEvent(point, sourceEvents, 290);
      const eventProximity = nearestEvent ? 1 - Math.min(290, lngLatDistanceMeters(point, nearestEvent.lngLat)) / 290 : 0;
      const areaScore = Math.min(0.24, Math.sqrt(Math.max(20, area || 80)) / 220);
      const recency = Math.max(0, Math.min(1, (year - Number(props.visible_year || year - 8) + 1) / 12));
      const intensity = clamp01(0.2 + (1 - distance / maxDistance) * 0.34 + eventProximity * 0.36 + areaScore + recency * 0.06);
      const seed = stableUnit(`${props.source_id || ""}:${point[0]?.toFixed(5) || ""}:${point[1]?.toFixed(5) || ""}`);
      const tiles = economyLandUseBuildingTiles(building.geometry, point, area, seed);
      tiles.forEach((tile, tileIndex) => {
        const tilePoint = tile.point || point;
        const tileEvent = nearestEvent || nearestGuideEvent(tilePoint, sourceEvents, 240);
        const tileDistance = lngLatDistanceMeters(center, tilePoint);
        const tileProximity = 1 - Math.min(tileDistance, maxDistance) / maxDistance;
        const tileIntensity = clamp01(intensity * 0.78 + tileProximity * 0.14 + seed * 0.08);
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "land_use_tile",
            intensity: Number(tileIntensity.toFixed(3)),
            color: economyBuildingColor(building, tileEvent, tilePoint),
            event_id: tileEvent?.id || "",
            source_id: `${props.source_id || ""}${tiles.length > 1 ? `:${tileIndex + 1}` : ""}`,
            score: Number((tileIntensity + seed * 0.12 - (tiles.length > 1 ? 0.03 : 0)).toFixed(3)),
          },
          geometry: tile.geometry,
        });
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function economyLandUseBuildingTiles(geometry, point, area, seed = 0.5) {
    if (!geometry || !point || area < 1200) return [{ geometry, point }];
    const bounds = geometryBounds(geometry);
    if (!bounds) return [{ geometry, point }];
    const center = [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    if (widthM < 34 || heightM < 34) return [{ geometry, point }];
    const targetM = area > 10000 ? 48 : area > 4200 ? 42 : 36;
    const cols = Math.max(2, Math.min(7, Math.round(widthM / targetM)));
    const rows = Math.max(2, Math.min(7, Math.round(heightM / targetM)));
    const halfWidth = Math.max(8, (widthM / cols) * (0.34 + seed * 0.05));
    const halfHeight = Math.max(8, (heightM / rows) * (0.34 + (1 - seed) * 0.05));
    const tiles = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const dx = (col + 0.5 - cols / 2) * (widthM / cols);
        const dy = (row + 0.5 - rows / 2) * (heightM / rows);
        const tilePoint = offsetLngLat(center, dx, dy);
        if (!pointInGeometry(tilePoint, geometry)) continue;
        tiles.push({
          point: tilePoint,
          geometry: rectanglePolygon(tilePoint, halfWidth, halfHeight),
        });
      }
    }
    return tiles.length >= 2 ? tiles : [{ geometry, point }];
  }

  function pointInGeometry(point, geometry) {
    if (!point || !geometry) return false;
    if (geometry.type === "Polygon") {
      return pointInPolygonRings(point, geometry.coordinates);
    }
    if (geometry.type === "MultiPolygon") {
      return (geometry.coordinates || []).some((rings) => pointInPolygonRings(point, rings));
    }
    return false;
  }

  function pointInPolygonRings(point, rings) {
    if (!Array.isArray(rings?.[0])) return false;
    if (!pointInRing(point, rings[0])) return false;
    for (let index = 1; index < rings.length; index += 1) {
      if (pointInRing(point, rings[index])) return false;
    }
    return true;
  }

  function pointInRing(point, ring) {
    let inside = false;
    const x = point[0];
    const y = point[1];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const xi = Number(ring[i]?.[0]);
      const yi = Number(ring[i]?.[1]);
      const xj = Number(ring[j]?.[0]);
      const yj = Number(ring[j]?.[1]);
      if (!Number.isFinite(xi) || !Number.isFinite(yi) || !Number.isFinite(xj) || !Number.isFinite(yj)) continue;
      const intersects = ((yi > y) !== (yj > y))
        && (x < ((xj - xi) * (y - yi)) / Math.max(1e-12, yj - yi) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function economyBuildingColor(building, nearestEvent, point) {
    if (nearestEvent) return economyLandUseColor(nearestEvent);
    const props = building.properties || {};
    const text = [
      props.kind,
      props.building,
      props.amenity,
      props.shop,
      props.tourism,
      props.office,
      props.landuse,
      props.title,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/retail|shop|supermarket|commercial|market/.test(text)) return "#ca3b32";
    if (/vacant|derelict|abandoned|disused/.test(text)) return "#e39b97";
    if (/office|industrial|warehouse|factory|manufactur/.test(text)) return "#158c97";
    if (/hotel|restaurant|cafe|bar|pub|leisure|cinema|tourism/.test(text)) return "#7b3a8f";
    if (/apartments|residential|house|terrace|dormitory/.test(text)) return "#efb94d";
    const area = Number(props.footprint_area_m2 || 0);
    const height = Number(props.height_m || 0);
    const seed = stableUnit(`${props.source_id || ""}:${point?.[0]?.toFixed(5) || ""}:${point?.[1]?.toFixed(5) || ""}`);
    if (area > 1800 || height > 18) return seed > 0.58 ? "#158c97" : "#8f9692";
    if (seed < 0.28) return "#ca3b32";
    if (seed < 0.46) return "#e39b97";
    if (seed < 0.64) return "#158c97";
    if (seed < 0.82) return "#efb94d";
    if (seed < 0.93) return "#8f9692";
    return "#7b3a8f";
  }

  function planningFootprintTileFeatures(center, radiusM, lens) {
    const buildings = state.detailBuildingFeatures || [];
    if (!buildings.length) return [];
    const year = currentTimelineYear();
    const planningAnchors = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "planning_cell" && feature.geometry && Number(feature.properties?.visible_year || 9999) <= year)
      .map((feature) => ({ feature, point: geometryToLngLat(feature.geometry) }))
      .filter((item) => item.point);
    const maxDistance = radiusM * (lens.id === "planning-parcels" ? 1.18 : 1.46);
    const features = [];
    for (const building of buildings) {
      const props = building.properties || {};
      if (Number(props.visible_year || 9999) > year) continue;
      const point = geometryToLngLat(building.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const area = Number(props.footprint_area_m2 || 0);
      if (area && area < (lens.id === "planning-parcels" ? 28 : 14)) continue;
      const seed = stableUnit(`${props.source_id || ""}:${point[0]?.toFixed(5) || ""}:${point[1]?.toFixed(5) || ""}`);
      const nearest = nearestPlanningAnchor(point, planningAnchors, lens.id === "planning-parcels" ? 180 : 158);
      const recency = clamp01((year - Number(props.visible_year || year - 12) + 1) / 14);
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const planningIntensity = Number(nearest?.feature?.properties?.intensity || 0);
      const areaBoost = Math.min(0.16, Math.sqrt(Math.max(20, area || 90)) / 260);
      const statusBoost = nearest ? (lens.id === "planning-parcels" ? 0.12 : 0.2) : 0;
      const intensity = clamp01(0.18 + proximity * 0.22 + planningIntensity * 0.36 + statusBoost + areaBoost + recency * 0.06);
      const tiles = lens.id === "planning-parcels"
        ? planningParcelGeometryTiles(building.geometry, point, area, seed)
        : [{ geometry: building.geometry, point }];
      tiles.forEach((tile, tileIndex) => {
        if (!tile.geometry) return;
        const tilePoint = tile.point || point;
        const tileNearest = tileIndex ? (nearestPlanningAnchor(tilePoint, planningAnchors, 180) || nearest) : nearest;
        const tileSeed = stableUnit(`${props.source_id || ""}:${tileIndex}:${tilePoint?.[0]?.toFixed(5) || ""}:${tilePoint?.[1]?.toFixed(5) || ""}`);
        const tileIntensity = lens.id === "planning-parcels"
          ? clamp01(intensity * 0.86 + (tileNearest ? 0.07 : 0) + tileSeed * 0.035)
          : intensity;
        const planningStatus = tileNearest?.feature?.properties?.lifecycle_status || "unknown";
        const color = planningFootprintColor(lens.id, props, tileNearest?.feature?.properties || nearest?.feature?.properties || null, tilePoint);
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "planning_footprint",
            intensity: Number(tileIntensity.toFixed(3)),
            color,
            event_id: tileNearest ? firstDetailEventId(tileNearest.feature.properties || {}) : "",
            planning_status: planningStatus,
            sublayer_id: planningAspectLayerId(planningStatus),
            source_id: `${props.source_id || ""}${tiles.length > 1 ? `:${tileIndex + 1}` : ""}`,
            score: Number((tileIntensity + (tileNearest ? 0.16 : 0) + tileSeed * 0.08 - (tiles.length > 1 ? 0.025 : 0)).toFixed(3)),
          },
          geometry: tile.geometry,
        });
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function planningParcelGeometryTiles(geometry, point, area, seed = 0.5) {
    const envelope = planningParcelEnvelopeGeometry(geometry, point, area, seed);
    if (!geometry || !point || area < 720) return [{ geometry: envelope || geometry, point }];
    const bounds = geometryBounds(geometry);
    if (!bounds) return [{ geometry: envelope || geometry, point }];
    const center = [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    if (widthM < 26 || heightM < 26) return [{ geometry: envelope || geometry, point }];
    const targetM = area > 6200 ? 34 : area > 2400 ? 30 : 26;
    const cols = Math.max(2, Math.min(8, Math.round(widthM / targetM)));
    const rows = Math.max(2, Math.min(8, Math.round(heightM / targetM)));
    const halfWidth = Math.max(5.5, Math.min(26, (widthM / cols) * (0.34 + seed * 0.04)));
    const halfHeight = Math.max(5.5, Math.min(26, (heightM / rows) * (0.34 + (1 - seed) * 0.04)));
    const tiles = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const dx = (col + 0.5 - cols / 2) * (widthM / cols);
        const dy = (row + 0.5 - rows / 2) * (heightM / rows);
        const tilePoint = offsetLngLat(center, dx, dy);
        if (!pointInGeometry(tilePoint, geometry)) continue;
        tiles.push({
          point: tilePoint,
          geometry: rectanglePolygon(tilePoint, halfWidth, halfHeight),
        });
      }
    }
    return tiles.length >= 2 ? tiles : [{ geometry: envelope || geometry, point }];
  }

  function planningParcelEnvelopeGeometry(geometry, point, area, seed = 0.5) {
    const bounds = geometryBounds(geometry);
    if (!bounds || !point) return geometry || null;
    const center = [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    const areaRoot = Math.sqrt(Math.max(24, Number(area || 80)));
    const padBase = Math.max(5, Math.min(16, 4 + areaRoot / 7));
    const cap = area > 2500 ? 68 : area > 900 ? 52 : 36;
    const halfWidth = Math.max(widthM / 2 + padBase * (0.58 + seed * 0.28), 8 + seed * 6);
    const halfHeight = Math.max(heightM / 2 + padBase * (0.62 + (1 - seed) * 0.26), 8 + (1 - seed) * 6);
    return rectanglePolygon(
      center,
      Math.min(cap, halfWidth),
      Math.min(cap, halfHeight),
    );
  }

  function planningAspectLayerId(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "planned" || normalized === "permitted") return "permitted";
    if (normalized === "construction") return "construction";
    if (normalized === "completed") return "completed";
    if (normalized === "demolished") return "demolished";
    if (normalized === "proposed") return "proposed";
    return "unknown";
  }

  function rectanglePolygon(center, halfWidthM, halfHeightM) {
    const ring = [
      offsetLngLat(center, -halfWidthM, -halfHeightM),
      offsetLngLat(center, halfWidthM, -halfHeightM),
      offsetLngLat(center, halfWidthM, halfHeightM),
      offsetLngLat(center, -halfWidthM, halfHeightM),
      offsetLngLat(center, -halfWidthM, -halfHeightM),
    ];
    return { type: "Polygon", coordinates: [ring] };
  }

  function orientedRectanglePolygon(center, halfWidthM, halfHeightM, angleRad = 0) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const corners = [
      [-halfWidthM, -halfHeightM],
      [halfWidthM, -halfHeightM],
      [halfWidthM, halfHeightM],
      [-halfWidthM, halfHeightM],
      [-halfWidthM, -halfHeightM],
    ];
    const ring = corners.map(([x, y]) => offsetLngLat(center, x * cos - y * sin, x * sin + y * cos));
    return { type: "Polygon", coordinates: [ring] };
  }

  function geometryBounds(geometry) {
    const bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
    let count = 0;
    const visit = (coords) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const [lng, lat] = coords;
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          bounds.minLng = Math.min(bounds.minLng, lng);
          bounds.maxLng = Math.max(bounds.maxLng, lng);
          bounds.minLat = Math.min(bounds.minLat, lat);
          bounds.maxLat = Math.max(bounds.maxLat, lat);
          count += 1;
        }
        return;
      }
      coords.forEach(visit);
    };
    visit(geometry?.coordinates);
    return count ? bounds : null;
  }

  function nearestPlanningAnchor(point, anchors, maxDistance) {
    let best = null;
    let bestDistance = Infinity;
    for (const anchor of anchors) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (distance < bestDistance && distance <= maxDistance) {
        best = anchor;
        bestDistance = distance;
      }
    }
    return best ? { ...best, distance: bestDistance } : null;
  }

  function planningFootprintColor(lensId, buildingProps, planningProps, point) {
    const status = String(planningProps?.lifecycle_status || "").toLowerCase();
    if (status === "demolished") return lensId === "planning-delta" ? "#8f9494" : "#d95a94";
    if (status === "construction") return lensId === "planning-delta" ? "#8460a8" : "#866bb8";
    if (status === "completed") return lensId === "planning-delta" ? "#d8583f" : "#7fa780";
    if (status === "permitted" || status === "planned") return lensId === "planning-delta" ? "#e7b454" : "#f4c762";
    if (status === "proposed") return lensId === "planning-delta" ? "#d87965" : "#ee7477";
    if (lensId === "planning-parcels") return "#b8b6a8";
    const visibleYear = Number(buildingProps?.visible_year || 0);
    if (lensId === "planning-delta") {
      if (visibleYear === currentTimelineYear()) return "#d84a2d";
      if (visibleYear >= currentTimelineYear() - 2) return "#d99175";
      return "#c98667";
    }
    const seed = stableUnit(`${buildingProps?.source_id || ""}:${point?.[0]?.toFixed(5) || ""}:${point?.[1]?.toFixed(5) || ""}`);
    if (seed < 0.2) return "#ee7477";
    if (seed < 0.4) return "#f4c762";
    if (seed < 0.55) return "#866bb8";
    if (seed < 0.72) return "#7fa780";
    if (seed < 0.86) return "#b8b6a8";
    return "#d95a94";
  }

  function nearestGuideEvent(cellCenter, events, maxDistance) {
    let best = null;
    let bestDistance = Infinity;
    for (const event of events) {
      const distance = lngLatDistanceMeters(cellCenter, event.lngLat);
      if (distance < bestDistance && distance <= maxDistance) {
        best = event;
        bestDistance = distance;
      }
    }
    return best;
  }

  function nearbyTransportRoadAnchors(center, maxDistance, limit = 360) {
    const year = currentTimelineYear();
    const candidates = [];
    const features = state.transportRoadFeatures || [];
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.layer !== "traffic_road") continue;
      if (Number(props.visible_year || 9999) > year) continue;
      const points = geometryCoordinateSamples(feature.geometry, 4);
      if (!points.length) continue;
      const activity = Number(props.transport_activity || 0);
      const rank = Number(props.rank || 1);
      for (const point of points) {
        const distance = lngLatDistanceMeters(center, point);
        if (distance > maxDistance) continue;
        candidates.push({
          point,
          distance,
          activity: clamp01(activity),
          rank,
          score: (1 - distance / maxDistance) * 0.34 + clamp01(activity) * 0.5 + Math.min(0.16, rank * 0.035),
          color: transportAnchorColor(activity, rank),
          id: props.id || props.source_id || "",
        });
      }
    }
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function geometryCoordinateSamples(geometry, maxSamples = 4) {
    if (!geometry) return [];
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return [geometry.coordinates];
    const coords = geometry.type === "LineString"
      ? geometry.coordinates
      : geometry.type === "Polygon"
        ? geometry.coordinates?.[0]
        : geometry.type === "MultiLineString"
          ? geometry.coordinates?.flat()
          : geometry.type === "MultiPolygon"
            ? geometry.coordinates?.flat(2)
        : [];
    if (!Array.isArray(coords) || !coords.length) return [];
    const clean = coords.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]));
    if (clean.length <= maxSamples) return clean;
    const samples = [];
    for (let i = 0; i < maxSamples; i += 1) {
      const index = Math.round((i / Math.max(1, maxSamples - 1)) * (clean.length - 1));
      samples.push(clean[index]);
    }
    return samples;
  }

  function geometryDistanceToPointMeters(geometry, point, maxSamples = 6) {
    const samples = geometryCoordinateSamples(geometry, maxSamples);
    if (!samples.length) return Infinity;
    let best = Infinity;
    for (const sample of samples) {
      best = Math.min(best, lngLatDistanceMeters(point, sample));
    }
    return best;
  }

  function geometryLineLengthMeters(geometry) {
    const clean = geometryLineCoordinateSequences(geometry).flat();
    if (clean.length < 2) return 0;
    let total = 0;
    const stride = Math.max(1, Math.floor(clean.length / 36));
    let previous = clean[0];
    for (let index = stride; index < clean.length; index += stride) {
      const current = clean[index];
      total += lngLatDistanceMeters(previous, current);
      previous = current;
    }
    const last = clean[clean.length - 1];
    if (previous !== last) total += lngLatDistanceMeters(previous, last);
    return total;
  }

  function geometryLineCoordinateSequences(geometry) {
    const sequences = geometry?.type === "LineString"
      ? [geometry.coordinates]
      : geometry?.type === "MultiLineString"
        ? geometry.coordinates
        : [];
    if (!Array.isArray(sequences)) return [];
    return sequences
      .map((sequence) => Array.isArray(sequence)
        ? sequence.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]))
        : [])
      .filter((sequence) => sequence.length >= 2);
  }

  function geometryPolygonCoordinateRings(geometry) {
    const rings = geometry?.type === "Polygon"
      ? geometry.coordinates
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates?.flat()
        : [];
    if (!Array.isArray(rings)) return [];
    return rings
      .map((ring) => Array.isArray(ring)
        ? ring.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]))
        : [])
      .filter((ring) => ring.length >= 4);
  }

  function nearestRoadAnchor(point, anchors, maxDistance) {
    let best = null;
    let bestDistance = Infinity;
    for (const anchor of anchors) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (distance < bestDistance && distance <= maxDistance) {
        best = anchor;
        bestDistance = distance;
      }
    }
    return best ? { ...best, distance: bestDistance } : null;
  }

  function transportAnchorColor(activity, rank) {
    if (rank >= 4 && activity < 0.62) return "#7b3a97";
    if (activity > 0.8) return "#c8472e";
    if (activity > 0.62) return "#d66a3a";
    if (activity > 0.42) return "#e7a829";
    if (activity > 0.22) return "#2f8f46";
    return "#1b8f8f";
  }

  function flowGuideFeatures(center, lens) {
    if (["transport-speed", "transport-reliability"].includes(lens.id)) {
      return transportNetworkStreetFeatures(center, lens);
    }
    if (lens.id === "planning-pressure") {
      return planningPressureStreetFeatures(center, lens);
    }
    if (lens.id === "civic-access-gaps") {
      return civicAccessGapStreetFeatures(center, lens);
    }
    if (lens.id === "economy-vitality") {
      return economyVitalityStreetFeatures(center, lens);
    }
    if (lens.id === "economy-gravity") {
      return economyGravityFlowFeatures(center, lens);
    }
    if (lens.id.startsWith("utilities-")) {
      return utilityNetworkStreetFeatures(center, lens);
    }
    const radiusM = Number(lens.radiusM || 1500);
    const maxFactorByLens = {
      "planning-pressure": 3.8,
      "civic-access-gaps": 2.5,
      "civic-demand": 1.65,
      "economy-gravity": 1.75,
      "utilities-capacity": 2.8,
      "utilities-resilience": 2.6,
      "utilities-works": 2.35,
    };
    const limitByLens = {
      "planning-pressure": 20,
      "civic-access-gaps": 16,
      "civic-demand": 12,
      "economy-gravity": 11,
      "utilities-capacity": 14,
      "utilities-resilience": 13,
      "utilities-works": 12,
    };
    const maxDistance = radiusM * (maxFactorByLens[lens.id] || 1.35);
    const events = nearbyLensEventAnchors(center, lens, {
      maxDistance,
      minDistance: lens.id === "economy-gravity" ? 120 : 80,
      limit: limitByLens[lens.id] || 9,
      distributed: lens.id !== "civic-demand",
    });
    if (["utilities-capacity", "utilities-works"].includes(lens.id)) {
      return linkedEventGuideFeatures(center, lens, events, maxDistance);
    }
    return events.map((item, index) => {
      const intensity = clamp01(0.24 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.58 + confidenceRank(item.event.confidence) * 0.04);
      return {
      type: "Feature",
      properties: {
        kind: "flow",
        lens_id: lens.id,
        event_id: item.event.id,
        intensity: Number(intensity.toFixed(2)),
        color: guideFlowColor(lens, item.event, index, intensity),
      },
      geometry: { type: "LineString", coordinates: curvedLine(center, item.event.lngLat, index % 2 ? -0.18 : 0.18) },
    };
    });
  }

  function transportNetworkStreetFeatures(center, lens) {
    const roads = state.transportRoadFeatures || [];
    if (!roads.length) return [];
    const year = currentTimelineYear();
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * (lens.id === "transport-reliability" ? 3.9 : 4.25);
    const features = [];
    const seenRoadIds = new Set();
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer !== "traffic_road") continue;
      if (Number(props.visible_year || 9999) > year) continue;
      const distance = geometryDistanceToPointMeters(road.geometry, center, 7);
      if (distance > maxDistance) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const activity = clamp01(Number(props.transport_activity || 0));
      const rank = Number(props.rank || 1);
      if (rank < 1.4 && distance > radiusM * 2.45 && activity < 0.2) continue;
      if (rank < 2 && distance > radiusM * 3.3 && activity < 0.3) continue;
      if (activity < 0.08 && rank < 2.5 && distance > radiusM * 2.15) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const arterial = Math.min(0.16, Math.max(0, rank - 1) * 0.045);
      const intensity = clamp01(0.12 + activity * 0.58 + proximity * 0.2 + arterial);
      if (intensity < 0.18 && rank < 2) continue;
      if (props.source_id) seenRoadIds.add(props.source_id);
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_thread",
          event_id: "",
          source_id: props.source_id || props.id || "",
          intensity: Number(intensity.toFixed(2)),
          color: transportThreadColor(lens.id, activity, rank, intensity),
          source_kind: "activity",
          corridor_key: transportCorridorKey(props),
          angle_bucket: transportAngleBucket(center, point),
          rank,
          route_length_m: Math.round(routeLengthM),
          activity: Number(activity.toFixed(3)),
          score: Number((intensity + activity * 0.08 + Math.min(0.24, rank * 0.065) + Math.min(0.12, routeLengthM / 2600) + proximity * 0.05 + stableUnit(props.source_id || props.id || "") * 0.035).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    features.push(...transportDetailRoadContextFeatures(center, lens, seenRoadIds));
    return distributedTransportThreadFeatures(features, lens);
  }

  function transportDetailRoadContextFeatures(center, lens, seenRoadIds = new Set()) {
    const roads = state.detailRoadFeatures || [];
    if (!roads.length) return [];
    const year = currentTimelineYear();
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * (lens.id === "transport-reliability" ? 2.8 : 3.05);
    const events = lensEventsForYear(year)
      .filter((event) => event.category === "transport" && event.lngLat);
    const features = [];
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer !== "road") continue;
      if (seenRoadIds.has(props.source_id)) continue;
      if (Number(props.visible_year || 9999) > year) continue;
      const distance = geometryDistanceToPointMeters(road.geometry, center, 7);
      if (distance > maxDistance) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const rank = Number(props.rank || 1);
      const eventDensity = eventDensityIntensity(point, events, lens.id === "transport-reliability" ? 980 : 880);
      if (rank < 1.5 && eventDensity < 0.08 && distance > radiusM * 1.95) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const activity = clamp01(0.1 + eventDensity * 0.54 + proximity * 0.16 + Math.min(0.16, rank * 0.045));
      const intensity = clamp01(0.16 + activity * 0.54 + proximity * 0.12 + Math.min(0.12, rank * 0.035));
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_thread",
          event_id: "",
          source_id: props.source_id || props.id || "",
          intensity: Number(intensity.toFixed(2)),
          color: transportThreadColor(lens.id, activity, rank, intensity),
          source_kind: "context",
          corridor_key: transportCorridorKey(props),
          angle_bucket: transportAngleBucket(center, point),
          rank,
          route_length_m: Math.round(routeLengthM),
          activity: Number(activity.toFixed(3)),
          score: Number((intensity + eventDensity * 0.08 + proximity * 0.05 + Math.min(0.16, rank * 0.045) + Math.min(0.1, routeLengthM / 3000) + stableUnit(props.source_id || props.id || "") * 0.03).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, lens.id === "transport-reliability" ? 850 : 1050);
  }

  function distributedTransportThreadFeatures(features, lens) {
    const target = lens.id === "transport-reliability" ? 660 : 760;
    const perBucket = lens.id === "transport-reliability" ? 29 : 34;
    const perCorridor = lens.id === "transport-reliability" ? 18 : 20;
    const selected = [];
    const selectedIds = new Set();
    const bucketCounts = new Map();
    const corridorCounts = new Map();
    const sorted = [...features].sort((a, b) => {
      const ap = a.properties || {};
      const bp = b.properties || {};
      const aPrimary = ap.source_kind === "activity" ? 0.08 : 0;
      const bPrimary = bp.source_kind === "activity" ? 0.08 : 0;
      return (Number(bp.score || 0) + bPrimary) - (Number(ap.score || 0) + aPrimary);
    });
    const add = (feature, relaxed = false) => {
      const props = feature.properties || {};
      const id = featureKey(feature);
      if (selectedIds.has(id)) return false;
      const bucket = String(props.angle_bucket ?? "0");
      const corridor = String(props.corridor_key || "road");
      const bucketCount = bucketCounts.get(bucket) || 0;
      const corridorCount = corridorCounts.get(corridor) || 0;
      const corridorCap = perCorridor + (Number(props.rank || 1) >= 3.5 ? 10 : 0);
      if (!relaxed && bucketCount >= perBucket) return false;
      if (!relaxed && corridorCount >= corridorCap) return false;
      if (relaxed && corridorCount >= corridorCap + 18) return false;
      selected.push(feature);
      selectedIds.add(id);
      bucketCounts.set(bucket, bucketCount + 1);
      corridorCounts.set(corridor, corridorCount + 1);
      return true;
    };
    for (const feature of sorted) {
      if (selected.length >= target) break;
      add(feature);
    }
    for (const feature of sorted) {
      if (selected.length >= target) break;
      add(feature, true);
    }
    return promoteTransportBackboneFeatures(
      selected.sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0)),
      lens,
    );
  }

  function promoteTransportBackboneFeatures(features, lens) {
    const limit = lens.id === "transport-reliability" ? 245 : 300;
    const perBucket = lens.id === "transport-reliability" ? 12 : 14;
    const perCorridor = lens.id === "transport-reliability" ? 9 : 10;
    const backboneIds = new Set();
    const bucketCounts = new Map();
    const corridorCounts = new Map();
    const sorted = [...features].sort((a, b) => {
      const ap = a.properties || {};
      const bp = b.properties || {};
      const aRank = Math.min(0.4, Number(ap.rank || 1) * 0.1);
      const bRank = Math.min(0.4, Number(bp.rank || 1) * 0.1);
      const aLength = Math.min(0.18, Number(ap.route_length_m || 0) / 2100);
      const bLength = Math.min(0.18, Number(bp.route_length_m || 0) / 2100);
      return (Number(bp.score || 0) + Number(bp.activity || 0) * 0.08 + bRank + bLength)
        - (Number(ap.score || 0) + Number(ap.activity || 0) * 0.08 + aRank + aLength);
    });
    for (const feature of sorted) {
      if (backboneIds.size >= limit) break;
      const props = feature.properties || {};
      const rank = Number(props.rank || 1);
      const activity = Number(props.activity || 0);
      const routeLengthM = Number(props.route_length_m || 0);
      if (rank < 2.15 && routeLengthM < 145) continue;
      if (activity < 0.1 && rank < 2.6 && routeLengthM < 260) continue;
      const bucket = String(props.angle_bucket ?? "0");
      const corridor = String(props.corridor_key || "road");
      const bucketCount = bucketCounts.get(bucket) || 0;
      const corridorCount = corridorCounts.get(corridor) || 0;
      if (bucketCount >= perBucket) continue;
      if (corridorCount >= perCorridor + (rank >= 3.5 ? 4 : 0)) continue;
      backboneIds.add(featureKey(feature));
      bucketCounts.set(bucket, bucketCount + 1);
      corridorCounts.set(corridor, corridorCount + 1);
    }
    return features.map((feature) => {
      const props = feature.properties || {};
      const backbone = backboneIds.has(featureKey(feature));
      const intensity = Number(props.intensity || 0.42);
      return {
        ...feature,
        properties: {
          ...props,
          flow_style: backbone ? "transport_backbone" : "transport_thread",
          route_tier: backbone ? 2 : 1,
          intensity: Number((backbone ? Math.max(0.42, intensity) : Math.min(0.72, intensity * 0.86 + 0.04)).toFixed(2)),
        },
      };
    });
  }

  function transportCorridorKey(props = {}) {
    const name = String(props.name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (name && name !== "mapped road segment") return name;
    return String(props.kind || props.source_id || props.id || "road").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() || "road";
  }

  function transportAngleBucket(center, point, bucketCount = 32) {
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];
    const angle = Math.atan2(dy, dx);
    return Math.floor(((angle + Math.PI) / (Math.PI * 2)) * bucketCount);
  }

  function featureKey(feature) {
    const props = feature.properties || {};
    return props.source_id || props.id || `${props.corridor_key || "feature"}:${JSON.stringify(feature.geometry?.coordinates?.[0] || feature.geometry?.coordinates || "")}`;
  }

  function transportThreadColor(lensId, activity, rank, intensity) {
    if (lensId === "transport-reliability") {
      if (activity > 0.76) return rank >= 2 ? "#ed3f2b" : "#ef9c1a";
      if (activity > 0.56) return "#ef9c1a";
      if (rank >= 3.5 && activity < 0.42) return "#7a3b97";
      if (intensity < 0.36) return "#898b8e";
      return "#248b94";
    }
    if (activity > 0.82) return rank >= 2 ? "#bb1e2d" : "#e95a35";
    if (activity > 0.64) return "#e95a35";
    if (activity > 0.43) return "#f2ad2f";
    if (activity > 0.22) return "#6dbc5a";
    return rank >= 3 ? "#0f8d95" : "#2d9f57";
  }

  function civicAccessGapStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "civic_services" && event.lngLat);
    if (!roads.length) return [];
    const radiusM = Number(lens.radiusM || 1500);
    const maxDistance = radiusM * 1.56;
    const transportStops = civicAccessTransportStopsNear(center, maxDistance + 620);
    const seamFeatures = [];
    const coverageFeatures = [];
    for (const road of roads) {
      const props = road.properties || {};
      if (Number(props.visible_year || 9999) > currentTimelineYear()) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(road.geometry, center, 7);
      if (distance > maxDistance) continue;
      const nearestEvent = events.length ? nearestGuideEvent(point, events, 980) : null;
      const civicDensity = events.length ? eventDensityIntensity(point, events, 880) : 0;
      const stopDensity = civicAccessStopDensity(point, transportStops, 440);
      const serviceDensity = clamp01(civicDensity * 0.62 + stopDensity * 0.46);
      const rank = Number(props.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const sourceId = props.source_id || props.id || "";
      const stable = stableUnit(`gap:${sourceId}`);
      const gapIntensity = clamp01(0.16 + (1 - civicDensity) * 0.28 + (1 - stopDensity) * 0.18 + proximity * 0.11 + Math.min(0.09, rank * 0.026) + stable * 0.06);
      const coverageIntensity = clamp01(serviceDensity * 0.78 + proximity * 0.08 + Math.min(0.12, rank * 0.026));
      if (coverageIntensity > 0.42 && (stopDensity > 0.34 || civicDensity > 0.3 || rank >= 3.2)) {
        const coverageStyle = civicAccessCoverageStyle(coverageIntensity, stopDensity, civicDensity);
        coverageFeatures.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            layer_id: "coverage",
            flow_role: "coverage",
            flow_style: coverageStyle,
            event_id: nearestEvent?.id || "",
            source_id: sourceId,
            intensity: Number(coverageIntensity.toFixed(2)),
            color: civicAccessCoverageColor(coverageStyle),
            score: Number((coverageIntensity + stopDensity * 0.18 + civicDensity * 0.12 + Math.min(0.12, routeLengthM / 2400) + proximity * 0.05 + stable * 0.03).toFixed(3)),
          },
          geometry: road.geometry,
        });
      }
      const seamStyle = civicAccessGapStyle(gapIntensity, serviceDensity);
      seamFeatures.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          layer_id: seamStyle === "gap_high" || seamStyle === "gap_medium" ? "corridors" : "gap_seams",
          flow_role: "gap_seam",
          flow_style: seamStyle,
          event_id: nearestEvent?.id || "",
          source_id: sourceId,
          intensity: Number(gapIntensity.toFixed(2)),
          color: civicGapStreetColor(gapIntensity, serviceDensity, rank),
          service_density: Number(serviceDensity.toFixed(3)),
          stop_density: Number(stopDensity.toFixed(3)),
          score: Number((gapIntensity + proximity * 0.08 + Math.min(0.12, routeLengthM / 2800) + stable * 0.07).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    return [
      ...coverageFeatures
        .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
        .slice(0, 240),
      ...distributedCivicAccessGapSeams(seamFeatures),
    ];
  }

  function civicAccessCoverageStyle(coverageIntensity, stopDensity, civicDensity) {
    if (coverageIntensity > 0.76 && (stopDensity > 0.48 || civicDensity > 0.48)) return "service_walk";
    if (coverageIntensity > 0.58 || stopDensity > 0.4) return "service_bus";
    return "service_outer";
  }

  function civicAccessCoverageColor(style) {
    if (style === "service_walk") return "#0f7f86";
    if (style === "service_bus") return "#5aaeb5";
    return "#a8cfd1";
  }

  function civicAccessGapStyle(intensity, serviceDensity) {
    if (serviceDensity > 0.58 && intensity < 0.42) return "gap_adequate";
    if (intensity > 0.6) return "gap_high";
    if (intensity > 0.48) return "gap_medium";
    if (intensity > 0.36) return "gap_low";
    return "gap_adequate";
  }

  function civicGapStreetColor(intensity, serviceDensity, rank) {
    if (serviceDensity > 0.62 && intensity < 0.42) return "#348f67";
    if (rank <= 1.4 && serviceDensity > 0.48 && intensity < 0.46) return "#348f67";
    if (intensity > 0.6) return "#ed4a2e";
    if (intensity > 0.48) return "#ef8f21";
    if (intensity > 0.36) return "#e4b33c";
    return "#348f67";
  }

  function civicAccessTransportStopsNear(center, maxDistance) {
    const stops = state.transportStopFeatures || [];
    if (!stops.length) return [];
    return stops
      .map((feature) => {
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (distance > maxDistance) return null;
        const props = feature.properties || {};
        const lines = Number(props.servingLineCount || props.routeNode || 0);
        const weight = clamp01(Number(props.weight || 0.32) + Math.min(0.42, lines / 34));
        return {
          point,
          props,
          distance,
          weight,
          score: weight * 0.58 + (1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance)) * 0.34 + stableUnit(props.source_id || props.name || "") * 0.08,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  function civicAccessStopDensity(point, stops, radiusM = 440) {
    if (!stops.length) return 0;
    let score = 0;
    for (const stop of stops) {
      const distance = lngLatDistanceMeters(point, stop.point);
      if (distance > radiusM) continue;
      score += (1 - distance / radiusM) * (0.45 + stop.weight * 0.8);
    }
    return clamp01(score / 3.1);
  }

  function distributedCivicAccessGapSeams(features) {
    const target = 780;
    const sorted = [...features].sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0));
    if (features.length <= target) return sorted;
    return sorted.slice(0, target);
  }

  function economyVitalityStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const year = currentTimelineYear();
    const beforeYear = Math.max(earliestTimelineYear(), year - 2);
    const events = lensEventsForYear(year)
      .filter((event) => event.category === "economy" && event.lngLat);
    const beforeEvents = lensEventsForYear(beforeYear)
      .filter((event) => event.category === "economy" && event.lngLat);
    if (!roads.length && !state.lensDetailFeatures.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 2.18;
    const features = [];
    features.push(...economyVitalityFrontageRibbonFeatures(center, lens, events, beforeEvents, maxDistance));
    features.push(...economyVitalityChurnNoticeTicks(center, lens, events, maxDistance));
    for (const road of roads) {
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance * 0.96) continue;
      const nearestEvent = nearestGuideEvent(point, events, 760);
      const eventDensity = eventDensityIntensity(point, events, 780);
      const rank = Number(road.properties?.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const namedFrontage = road.properties?.name ? 0.14 : 0.04;
      const intensity = clamp01(0.1 + eventDensity * 0.34 + proximity * 0.26 + namedFrontage * 0.52 + Math.min(0.08, rank * 0.022));
      if (intensity < 0.28 && rank < 2.1) continue;
      const sublayerId = "economy";
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "economy_current_ribbon",
          event_id: nearestEvent?.id || "",
          source_id: road.properties?.source_id || road.properties?.id || "",
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: economyVitalityRibbonColor(road.properties || {}, intensity),
          edge_offset: 0.58,
          score: Number((intensity * 0.82 + proximity * 0.08 + stableUnit(`${lens.id}:${road.properties?.source_id || road.properties?.id || ""}`) * 0.08).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, 1180);
  }

  function economyVitalityFrontageRibbonFeatures(center, lens, events, beforeEvents, maxDistance) {
    const features = [];
    const year = currentTimelineYear();
    const frontages = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_frontage" && feature.geometry && Number(feature.properties?.visible_year || 9999) <= year);
    for (const frontage of frontages) {
      const props = frontage.properties || {};
      const point = geometryToLngLat(frontage.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(frontage.geometry, center, 7);
      if (distance > maxDistance * 1.08) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const eventCount = Number(props.event_count || 1);
      const rank = Number(props.rank || 1);
      const currentDensity = eventDensityIntensity(point, events, 680);
      const beforeDensity = eventDensityIntensity(point, beforeEvents, 760);
      const intensity = clamp01(Number(props.intensity || 0.32) * 0.62 + currentDensity * 0.32 + proximity * 0.14 + Math.min(0.16, eventCount * 0.032) + Math.min(0.08, rank * 0.018));
      const sublayerId = economyVitalityLayerKey(props);
      const sourceKey = props.id || props.road_source_id || `${point[0].toFixed(5)}:${point[1].toFixed(5)}`;
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "economy_current_ribbon",
          event_id: firstDetailEventId(props),
          source_id: sourceKey,
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: economyVitalityRibbonColor(props, intensity),
          edge_offset: 0.82,
          frontage_status: props.activity_status || props.status || "",
          sector: props.sector || "",
          score: Number((intensity + proximity * 0.12 + Math.min(0.2, eventCount * 0.028) + stableUnit(sourceKey) * 0.055).toFixed(3)),
        },
        geometry: frontage.geometry,
      });
      if (beforeDensity > 0.035 || intensity > 0.42) {
        const beforeIntensity = clamp01(0.18 + beforeDensity * 0.52 + Number(props.intensity || 0.32) * 0.2 + proximity * 0.08);
        features.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            flow_style: "economy_before_ribbon",
            event_id: "",
            source_id: `${sourceKey}:before`,
            sublayer_id: sublayerId,
            intensity: Number(beforeIntensity.toFixed(2)),
            color: "#34393a",
            edge_offset: -0.86,
            score: Number((beforeIntensity * 0.6 + intensity * 0.16 + proximity * 0.05).toFixed(3)),
          },
          geometry: frontage.geometry,
        });
      }
    }
    return features;
  }

  function economyVitalityChurnNoticeTicks(center, lens, events, maxDistance) {
    const features = [];
    const selected = nearbyLensEventAnchors(center, lens, {
      maxDistance: maxDistance * 0.82,
      minDistance: 80,
      limit: 14,
      distributed: true,
    }).filter((item) => item.event?.category === "economy");
    for (const item of selected) {
      const point = item.event.lngLat;
      const angle = item.angle || Math.atan2(point[1] - center[1], point[0] - center[0]);
      const lengthM = 42 + stableUnit(item.event.id) * 30;
      const dx = Math.cos(angle + Math.PI / 2) * lengthM;
      const dy = Math.sin(angle + Math.PI / 2) * lengthM;
      const sublayerId = economyVitalityLayerKey(item.event);
      const intensity = clamp01(0.32 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.46 + confidenceRank(item.event.confidence) * 0.04);
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "economy_churn_tick",
          event_id: item.event.id,
          source_id: item.event.id,
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: economyVitalityLayerColor(sublayerId),
          edge_offset: 0,
          score: Number((intensity + stableUnit(item.event.id) * 0.08).toFixed(3)),
        },
        geometry: { type: "LineString", coordinates: [offsetLngLat(point, -dx / 2, -dy / 2), offsetLngLat(point, dx / 2, dy / 2)] },
      });
    }
    return features;
  }

  function economyVitalityGuideColor(event, road, intensity) {
    const text = [
      event?.title,
      event?.shortDescription,
      event?.summary,
      event?.area,
      road?.properties?.name,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/vacan|closure|closed|derelict|empty|low activity/.test(text)) return "#ee3f47";
    if (/open|launch|new shop|retail|market|frontage|store/.test(text)) return intensity > 0.62 ? "#6d2f90" : "#a552a8";
    if (/food|restaurant|cafe|bar|pub|hotel|hospitality|visitor|tourism|culture/.test(text)) return "#f0a51b";
    if (/office|business|workspace|industrial|enterprise/.test(text)) return "#1693a3";
    const seed = stableUnit(`${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (intensity > 0.76) return seed < 0.45 ? "#6d2f90" : "#a552a8";
    if (intensity > 0.56) return seed < 0.5 ? "#f0a51b" : "#a552a8";
    if (seed < 0.38) return "#1693a3";
    if (seed < 0.68) return "#ee3f47";
    return "#8c5b3a";
  }

  function economyVitalityRibbonColor(source, intensity) {
    const layer = economyVitalityLayerKey(source);
    if (layer === "vacancy" || layer === "closures") return "#ee3f47";
    if (layer === "footfall") return "#1693a3";
    if (layer === "spend" || layer === "openings") return intensity > 0.62 ? "#6d2f90" : "#f0a51b";
    if (intensity > 0.76) return "#6d2f90";
    if (intensity > 0.58) return "#a552a8";
    if (intensity > 0.42) return "#f0a51b";
    return "#1693a3";
  }

  function economyVitalityLayerKey(source = {}) {
    const text = [
      source.sector,
      source.activity_status,
      source.status,
      source.title,
      source.label,
      source.shortDescription,
      source.summary,
      source.area,
      ...(source.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/\b(vacan\w*|empty|derelict|low activity)\b/.test(text)) return "vacancy";
    if (/\b(closure|closed|closing|shutter\w*|cease\w*|lost)\b/.test(text)) return "closures";
    if (/\b(opening|opened|launch\w*|new shop|new unit|commenc\w*)\b/.test(text)) return "openings";
    if (/footfall|visitor|pedestrian/.test(text)) return "footfall";
    if (/spend|retail|shop|store|commercial|atm|sale/.test(text)) return "spend";
    return "economy";
  }

  function economyVitalityLayerColor(id) {
    const colors = {
      economy: "#7b3a8f",
      vacancy: "#ed3135",
      footfall: "#188a98",
      spend: "#f0a51b",
      openings: "#5eaa4e",
      closures: "#8c5b3a",
    };
    return colors[id] || colors.economy;
  }

  function planningPressureStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "built_environment" && event.lngLat);
    if (!roads.length || !events.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 2.7;
    const anchors = planningPressureAnchorFeatures(currentTimelineYear())
      .filter((anchor) => lngLatDistanceMeters(center, anchor.point) <= maxDistance + 360);
    const features = [];
    features.push(...planningPressureCellEdgeFeatures(center, lens, anchors, maxDistance));
    for (const road of roads) {
      if (geometryDistanceToPointMeters(road.geometry, center, 8) > maxDistance + 220) continue;
      const rank = Number(road.properties?.rank || 1);
      const maxSegmentM = rank >= 3 ? 150 : 105;
      for (const segment of planningPressureRoadSegments(road.geometry, maxSegmentM)) {
        const point = segment.midpoint;
        const distance = lngLatDistanceMeters(center, point);
        if (distance > maxDistance) continue;
        const influence = planningPressureAnchorInfluence(point, anchors, rank >= 3 ? 330 : 260);
        const nearestEvent = influence.event || nearestGuideEvent(point, events, 520);
        const eventDensity = eventDensityIntensity(point, events, 520);
        const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
        const rankBoost = Math.min(0.16, Math.max(0, rank - 1) * 0.045);
        const intensity = clamp01(0.07 + influence.intensity * 0.5 + eventDensity * 0.2 + proximity * 0.08 + rankBoost * 0.72);
        if (intensity < 0.1 && rank < 2 && !influence.anchor) continue;
        if (intensity < 0.1) continue;
        const sourceKey = road.properties?.source_id || road.properties?.id || `${point[0].toFixed(5)}:${point[1].toFixed(5)}`;
        const seed = stableUnit(`${sourceKey}:${segment.index}:${lens.id}`);
        const flowStyle = intensity > 0.76 || (rank >= 4 && intensity > 0.62)
          ? "planning_pressure_spine"
          : intensity > 0.4
            ? "planning_pressure_edge"
            : "planning_pressure_trace";
        features.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            flow_style: flowStyle,
            event_id: nearestEvent?.id || influence.eventId || "",
            source_id: sourceKey,
            sublayer_id: influence.driver || planningPressureDriverKey(nearestEvent || {}),
            intensity: Number(intensity.toFixed(2)),
            color: planningPressureGuideColor(intensity),
            edge_offset: Number(((seed < 0.5 ? -1 : 1) * (flowStyle === "planning_pressure_spine" ? 0.34 : flowStyle === "planning_pressure_edge" ? 0.68 : 0.52)).toFixed(2)),
            segment_length_m: Number(segment.lengthM.toFixed(1)),
            score: Number((intensity + proximity * 0.08 + Math.min(0.08, rank * 0.018) + seed * 0.1).toFixed(3)),
          },
          geometry: segment.geometry,
        });
      }
    }
    return distributePlanningPressureSegments(features, 4300)
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, 4300);
  }

  function planningPressureCellEdgeFeatures(center, lens, anchors, maxDistance) {
    const features = [];
    const sorted = [...anchors]
      .map((anchor) => ({
        anchor,
        distance: lngLatDistanceMeters(center, anchor.point),
      }))
      .filter((item) => item.distance <= maxDistance * 1.03)
      .sort((a, b) =>
        (b.anchor.intensity + Math.min(0.3, b.anchor.eventCount * 0.025)) -
        (a.anchor.intensity + Math.min(0.3, a.anchor.eventCount * 0.025))
      )
      .slice(0, 780);
    for (const { anchor, distance } of sorted) {
      const rings = geometryPolygonCoordinateRings(anchor.feature?.geometry);
      if (!rings.length) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const eventBoost = Math.min(0.2, anchor.eventCount * 0.024);
      const intensity = clamp01(0.16 + anchor.intensity * 0.46 + proximity * 0.12 + eventBoost);
      if (intensity < 0.22) continue;
      for (const ring of rings.slice(0, 1)) {
        for (const segment of planningPressureRoadSegments({ type: "LineString", coordinates: ring }, 62)) {
          if (segment.lengthM < 9) continue;
          const sourceKey = `${anchor.props?.id || anchor.eventId || "planning-cell"}:${segment.index}`;
          features.push({
            type: "Feature",
            properties: {
              kind: "flow",
              lens_id: lens.id,
              flow_style: "planning_pressure_cell_edge",
              event_id: anchor.eventId || "",
              source_id: sourceKey,
              sublayer_id: anchor.driver || planningPressureDriverKey(anchor.props),
              intensity: Number(intensity.toFixed(2)),
              color: planningPressureGuideColor(intensity),
              edge_offset: 0,
              segment_length_m: Number(segment.lengthM.toFixed(1)),
              source_kind: "planning_cell_edge",
              score: Number((intensity + proximity * 0.1 + eventBoost * 0.28 + stableUnit(sourceKey) * 0.055).toFixed(3)),
            },
            geometry: segment.geometry,
          });
        }
      }
    }
    return features;
  }

  function planningPressureRoadSegments(geometry, maxSegmentM = 120) {
    const segments = [];
    let index = 0;
    for (const sequence of geometryLineCoordinateSequences(geometry)) {
      for (let i = 1; i < sequence.length; i += 1) {
        const from = sequence[i - 1];
        const to = sequence[i];
        const lengthM = lngLatDistanceMeters(from, to);
        if (!Number.isFinite(lengthM) || lengthM < 7) continue;
        const pieces = Math.max(1, Math.min(6, Math.ceil(lengthM / maxSegmentM)));
        for (let piece = 0; piece < pieces; piece += 1) {
          const a = interpolateLngLat(from, to, piece / pieces);
          const b = interpolateLngLat(from, to, (piece + 1) / pieces);
          const pieceLengthM = lngLatDistanceMeters(a, b);
          if (pieceLengthM < 7) continue;
          segments.push({
            index: index++,
            midpoint: interpolateLngLat(a, b, 0.5),
            lengthM: pieceLengthM,
            geometry: { type: "LineString", coordinates: [a, b] },
          });
        }
      }
    }
    return segments;
  }

  function interpolateLngLat(from, to, t) {
    return [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
    ];
  }

  function planningPressureAnchorFeatures(year) {
    return (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "planning_cell" && feature.geometry && Number(feature.properties?.visible_year || 9999) <= year)
      .map((feature) => {
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const props = feature.properties || {};
        return {
          feature,
          props,
          point,
          eventId: firstDetailEventId(props),
          eventCount: Number(props.event_count || 1),
          intensity: clamp01(Number(props.intensity || 0.42)),
          driver: planningPressureDriverKey(props),
        };
      })
      .filter(Boolean);
  }

  function planningPressureAnchorInfluence(point, anchors, kernelM) {
    let score = 0;
    let best = null;
    const driverScores = new Map();
    for (const anchor of anchors) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (distance > kernelM) continue;
      const distanceWeight = 1 - distance / kernelM;
      const recordBoost = Math.min(0.22, anchor.eventCount * 0.024);
      const weight = distanceWeight * (0.24 + anchor.intensity * 0.54 + recordBoost);
      score += weight;
      driverScores.set(anchor.driver, (driverScores.get(anchor.driver) || 0) + weight);
      if (!best || distance < best.distance) best = { ...anchor, distance };
    }
    const driver = [...driverScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || best?.driver || "";
    return {
      anchor: best,
      eventId: best?.eventId || "",
      event: best?.eventId ? (state.eventById.get(best.eventId) || null) : null,
      driver,
      intensity: clamp01(score * 0.34),
    };
  }

  function distributePlanningPressureSegments(features, target) {
    if (features.length <= target) return features;
    const selected = [];
    const used = new Set();
    const buckets = new Map();
    for (const feature of features) {
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const bucket = `${Math.round(point[0] * 520)}:${Math.round(point[1] * 760)}`;
      const previous = buckets.get(bucket);
      if (!previous || Number(feature.properties?.score || 0) > Number(previous.properties?.score || 0)) {
        buckets.set(bucket, feature);
      }
    }
    [...buckets.values()]
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, Math.floor(target * 0.62))
      .forEach((feature) => {
        selected.push(feature);
        used.add(feature);
      });
    for (const feature of [...features].sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))) {
      if (selected.length >= target) break;
      if (used.has(feature)) continue;
      selected.push(feature);
    }
    return selected;
  }

  function planningPressureDriverKey(source) {
    const text = [
      source?.title,
      source?.label,
      source?.summary,
      source?.area,
      source?.lifecycle_status,
      source?.status,
      source?.confidence,
      ...(source?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/inferred|uncertain|uncertainty|osm/.test(text)) return "uncertainty";
    if (/object|appeal|representations?/.test(text)) return "objections";
    if (/vacan|derelict|empty site|brownfield/.test(text)) return "vacant_sites";
    if (/redevelop|demolition|replacement|student|hotel|mixed[-\s]?use|change of use|extension|alteration|conversion/.test(text)) return "redevelopment";
    if (/complete|opened|reopened|finished|delivered/.test(text)) return "completions";
    return "built_environment";
  }

  function planningPressureGuideColor(intensity) {
    if (intensity > 0.82) return "#b91f32";
    if (intensity > 0.66) return "#d84a2d";
    if (intensity > 0.47) return "#efaa3c";
    if (intensity > 0.32) return "#77aaa1";
    return "#8fb2bd";
  }

  function utilityNetworkStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "utilities" && event.lngLat);
    const radiusM = Number(lens.radiusM || 800);
    const contextFeatures = utilityNetworkContextFlowFeatures(center, lens, events, radiusM);
    if (!roads.length || !events.length) return contextFeatures;
    const maxDistance = radiusM * (
      lens.id === "utilities-capacity" ? 3.05
        : lens.id === "utilities-resilience" ? 2.75
          : 2.55
    );
    const minIntensity = lens.id === "utilities-works" ? 0.25
      : lens.id === "utilities-resilience" ? 0.21
        : 0.18;
    const features = [];
    for (const road of roads) {
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const nearestEvent = nearestGuideEvent(point, events, 980);
      const eventDensity = eventDensityIntensity(point, events, 960);
      const rank = Number(road.properties?.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(0.18 + eventDensity * 0.5 + proximity * 0.16 + Math.min(0.12, rank * 0.025));
      if (intensity < minIntensity) continue;
      const type = utilityEventType(nearestEvent, road);
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: utilityGuideFlowStyle(lens, nearestEvent, road, intensity, distance, maxDistance),
          event_id: nearestEvent?.id || "",
          utility_type: type,
          intensity: Number(intensity.toFixed(2)),
          color: utilityNetworkGuideColor(lens, nearestEvent, road, intensity),
          score: Number((intensity + stableUnit(`${lens.id}:${road.properties?.source_id || road.properties?.id || ""}`) * 0.2).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    return [...contextFeatures, ...features]
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, lens.id === "utilities-capacity" ? 2600 : lens.id === "utilities-resilience" ? 2100 : 1450);
  }

  function utilityNetworkContextFlowFeatures(center, lens, events, radiusM) {
    const network = (state.utilityNetworkFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "utility_network" && ["line", "area"].includes(props.network_geometry) && feature.geometry;
      });
    if (!network.length) return [];
    const maxDistance = radiusM * (
      lens.id === "utilities-capacity" ? 2.8
        : lens.id === "utilities-resilience" ? 2.2
          : 1.95
    );
    const minIntensity = lens.id === "utilities-resilience" ? 0.24 : 0.2;
    const features = [];
    for (const feature of network) {
      const props = feature.properties || {};
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const eventDensity = events.length ? eventDensityIntensity(point, events, lens.id === "utilities-resilience" ? 1120 : 780) : 0;
      const nearestEvent = events.length ? nearestGuideEvent(point, events, lens.id === "utilities-resilience" ? 1280 : 820) : null;
      const rank = Number(props.rank || 1);
      const baseIntensity = Number(props.intensity || 0.45);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(baseIntensity * 0.52 + eventDensity * 0.26 + proximity * 0.16 + Math.min(0.16, rank * 0.026));
      if (intensity < minIntensity) continue;
      const flowStyle = utilityNetworkContextFlowStyle(lens, props, intensity, distance, maxDistance);
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_role: "utility_network",
          flow_style: flowStyle,
          event_id: nearestEvent?.id || "",
          source_id: props.source_id || "",
          utility_type: props.utility_type || "",
          network_role: props.network_role || "",
          intensity: Number(intensity.toFixed(2)),
          color: utilityNetworkContextGuideColor(lens, props, intensity, flowStyle),
          score: Number((intensity + Math.min(0.24, rank * 0.024) + stableUnit(`${lens.id}:${props.source_id || props.id || ""}`) * 0.14).toFixed(3)),
        },
        geometry: feature.geometry,
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, lens.id === "utilities-capacity" ? 1150 : lens.id === "utilities-resilience" ? 850 : 620);
  }

  function utilityNetworkContextFlowStyle(lens, props, intensity, distance, maxDistance) {
    if (lens.id === "utilities-works") return "utility_work_thread";
    if (lens.id === "utilities-capacity") return "utility_capacity_trace";
    if (lens.id !== "utilities-resilience") return "street_thread";
    const rank = Number(props.rank || 1);
    const seed = stableUnit(`${props.source_id || ""}:${props.network_role || ""}`);
    if (rank >= 4 || intensity > 0.78 || distance < maxDistance * 0.24) return "utility_primary";
    if (seed < 0.58 || intensity > 0.54) return "utility_backup";
    return "utility_inferred";
  }

  function utilityGuideFlowStyle(lens, event, road, intensity, distance, maxDistance) {
    if (lens.id === "utilities-works") return "utility_work_thread";
    if (lens.id === "utilities-capacity") return "utility_capacity_trace";
    if (lens.id !== "utilities-resilience") return "street_thread";
    const rank = Number(road?.properties?.rank || 1);
    const seed = stableUnit(`${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (rank >= 4 || intensity > 0.8 || distance < maxDistance * 0.22) return "utility_primary";
    if (seed < 0.62 || intensity > 0.56) return "utility_backup";
    return "utility_inferred";
  }

  function utilityTypeColor(type, fallback = "#8c7460") {
    if (type === "water") return "#1787b3";
    if (type === "electricity") return "#ef6b2a";
    if (type === "telecoms" || type === "telecom") return "#7a3b97";
    if (type === "gas") return "#e2b42c";
    if (type === "drainage") return "#148a8d";
    if (type === "district_energy") return "#7a5438";
    return fallback;
  }

  function utilityNetworkContextGuideColor(lens, props, intensity, flowStyle) {
    const type = String(props.utility_type || "");
    if (lens.id === "utilities-capacity") {
      if (intensity > 0.91) return "#d62d35";
      if (intensity > 0.8 && type === "electricity") return "#ed6b35";
      return utilityTypeColor(type, "#438c64");
    }
    if (lens.id === "utilities-resilience") {
      if (flowStyle === "utility_primary") return type === "electricity" ? "#ef6b2a" : "#1787b3";
      if (flowStyle === "utility_backup") return type === "electricity" ? "#d66a3a" : "#2f85bd";
      return "#7f9ba3";
    }
    return utilityWorksTypeColor(type, { id: props.source_id || "", title: props.title || "" }, { properties: props });
  }

  function utilityNetworkGuideColor(lens, event, road, intensity) {
    if (lens.id === "utilities-capacity") {
      const type = utilityEventType(intensity > 0.78 ? event : null, road);
      if (intensity > 0.92) return "#d62d35";
      if (intensity > 0.82) return "#ed6b35";
      if (intensity > 0.62 && type === "electricity") return "#e2b42c";
      return utilityTypeColor(type, "#438c64");
    }
    const type = utilityEventType(event, road);
    if (lens.id === "utilities-resilience") {
      if (intensity > 0.9) return "#d53236";
      if (type === "electricity" && intensity > 0.66) return "#ef6b2a";
      if (["telecoms", "gas", "drainage"].includes(type)) return utilityTypeColor(type, "#1787b3");
      const seed = stableUnit(`${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
      return seed < 0.58 ? "#1787b3" : "#71b4c7";
    }
    const text = [
      event?.title,
      event?.shortDescription,
      event?.summary,
      event?.area,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/fail|outage|burst|emergency|disruption|closure/.test(text)) return "#cf3337";
    if (/permit|consent|licen[cs]e/.test(text)) return "#774a92";
    if (/reinstate|resurface|restore/.test(text)) return "#4f8f50";
    if (/repair|replace|upgrade/.test(text)) return utilityWorksStatusColor("repair", type, event, road);
    if (/planned|programme|program|scheme|maintenance|works|utility/.test(text)) return utilityWorksStatusColor("planned", type, event, road);
    if (type === "water" || type === "telecoms" || type === "electricity" || type === "gas" || type === "drainage") {
      return utilityWorksStatusColor("asset", type, event, road);
    }
    return intensity > 0.66 ? "#d66a3a" : "#8c7460";
  }

  function utilityWorksTypeColor(type, event, road) {
    if (type === "water") return "#248b94";
    if (type === "telecoms") return "#774a92";
    if (type === "electricity") return "#e8a620";
    if (type === "gas") return "#d66a3a";
    if (type === "drainage") return "#4f8f50";
    const seed = stableUnit(`works:${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (seed < 0.32) return "#248b94";
    if (seed < 0.52) return "#e8a620";
    if (seed < 0.68) return "#774a92";
    if (seed < 0.84) return "#4f8f50";
    return "#d66a3a";
  }

  function utilityWorksStatusColor(status, type, event, road) {
    const seed = stableUnit(`${status}:${type}:${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (status === "repair") {
      if (type === "water" && seed < 0.72) return "#248b94";
      if (type === "telecoms" && seed < 0.74) return "#774a92";
      if (seed < 0.28) return "#e8a620";
      if (seed < 0.46) return "#d66a3a";
      if (seed < 0.76) return "#248b94";
      return "#774a92";
    }
    if (status === "asset") {
      if (type === "water") return "#248b94";
      if (type === "telecoms") return "#774a92";
      if (type === "drainage") return seed < 0.58 ? "#248b94" : "#4f8f50";
      if (type === "gas") return seed < 0.52 ? "#d66a3a" : "#e8a620";
      if (type === "electricity") {
        if (seed < 0.42) return "#e8a620";
        if (seed < 0.66) return "#248b94";
        if (seed < 0.84) return "#d66a3a";
        return "#774a92";
      }
    }
    if (type === "water") return seed < 0.76 ? "#248b94" : "#4f8f50";
    if (type === "telecoms") return "#774a92";
    if (type === "drainage") return seed < 0.64 ? "#4f8f50" : "#248b94";
    if (type === "gas") return seed < 0.42 ? "#d66a3a" : "#248b94";
    if (type === "electricity") {
      if (seed < 0.36) return "#e8a620";
      if (seed < 0.64) return "#248b94";
      if (seed < 0.82) return "#d66a3a";
      return "#774a92";
    }
    return utilityWorksTypeColor(type, event, road);
  }

  function utilityEventType(event, road) {
    const text = [
      event?.title,
      event?.shortDescription,
      event?.summary,
      event?.area,
      road?.properties?.name,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/water|main|pump/.test(text)) return "water";
    if (/telecom|fibre|fiber|broadband|cabinet|mast|phone/.test(text)) return "telecoms";
    if (/gas/.test(text)) return "gas";
    if (/drain|sewer|storm|flood/.test(text)) return "drainage";
    if (/electric|power|substation|generator|cable/.test(text)) return "electricity";
    const seed = stableUnit(`${event?.id || ""}:${road?.properties?.source_id || ""}`);
    if (seed < 0.32) return "electricity";
    if (seed < 0.54) return "water";
    if (seed < 0.7) return "telecoms";
    if (seed < 0.84) return "gas";
    return "drainage";
  }

  function economyGravityFlowFeatures(center, lens) {
    const radiusM = Number(lens.radiusM || 1500);
    const maxDistance = radiusM * 1.78;
    const detailCandidates = economyGravityDetailCandidates(center, lens, maxDistance);
    const seenEventIds = new Set(detailCandidates.map((item) => item.eventId).filter(Boolean));
    const anchorCandidates = economyGravityAnchorCandidates(center, lens, maxDistance);
    const eventCandidates = economyGravityEventCandidates(center, lens, maxDistance, seenEventIds);
    const selected = selectEconomyGravityCandidates(center, [...anchorCandidates, ...detailCandidates, ...eventCandidates], lens, 26);
    if (!selected.length) {
      const fallback = nearbyLensEventAnchors(center, lens, {
        maxDistance,
        minDistance: 120,
        limit: 11,
        distributed: true,
      });
      return fallback.map((item, index) => {
        const intensity = clamp01(0.24 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.58 + confidenceRank(item.event.confidence) * 0.04);
        const sector = economyGravitySectorKey(item.event);
        return {
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            flow_role: "gravity_anchor",
            flow_style: "economy_gravity_arc",
            event_id: item.event.id,
            sublayer_id: sector,
            sector,
            intensity: Number(intensity.toFixed(2)),
            color: economyGravitySectorColor(sector),
          },
          geometry: { type: "LineString", coordinates: economyGravityArcLine(center, item.event.lngLat, { eventId: item.event.id, sector }, index, 0, 1) },
        };
      });
    }
    const features = [];
    selected.forEach((item, index) => {
      const laneCount = item.eventCount >= 5 ? 3 : item.eventCount >= 2 || item.intensity > 0.54 ? 2 : 1;
      for (let lane = 0; lane < laneCount; lane += 1) {
        const laneIntensity = clamp01(item.intensity * (lane === 0 ? 1 : 0.72) + Math.min(0.12, item.eventCount * 0.018));
        features.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            flow_role: "gravity_anchor",
            flow_style: lane === 0 ? "economy_gravity_arc" : "economy_gravity_thread",
            event_id: item.eventId || "",
            source_id: item.sourceId || "",
            sublayer_id: item.sublayerId,
            sector: item.sector,
            event_count: item.eventCount,
            source_count: item.sourceCount,
            intensity: Number(laneIntensity.toFixed(2)),
            color: economyGravitySectorColor(item.sublayerId),
          },
          geometry: {
            type: "LineString",
            coordinates: economyGravityArcLine(center, item.point, item, index, lane, laneCount),
          },
        });
      }
    });
    return features;
  }

  function economyGravityDetailCandidates(center, lens, maxDistance) {
    const year = currentTimelineYear();
    return (state.lensDetailFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "economy_activity_cell"
          && Number(props.visible_year || 9999) <= year
          && feature.geometry;
      })
      .map((feature) => {
        const props = feature.properties || {};
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (distance < 95 || distance > maxDistance) return null;
        const eventCount = Math.max(1, Number(props.event_count || 1));
        const sourceCount = Math.max(1, Number(props.source_count || 1));
        const intensity = clamp01(Number(props.intensity || 0.36) + Math.min(0.2, eventCount * 0.028));
        const sector = economyGravitySectorKey(props);
        const proximity = 1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance);
        const outerPull = Math.min(0.16, distance / Math.max(1, maxDistance) * 0.18);
        return {
          point,
          props,
          eventId: firstDetailEventId(props),
          sourceId: props.source_ids || props.source_id || "",
          sublayerId: sector,
          sector,
          eventCount,
          sourceCount,
          intensity,
          distance,
          score: intensity * 0.42 + Math.min(0.26, eventCount * 0.045) + proximity * 0.18 + outerPull + stableUnit(`${props.id || ""}:${props.event_ids || ""}`) * 0.045,
        };
      })
      .filter(Boolean);
  }

  function economyGravityEventCandidates(center, lens, maxDistance, seenEventIds = new Set()) {
    return lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "economy" && event.lngLat && event.id !== state.selectedEventId && !seenEventIds.has(event.id))
      .map((event) => {
        const distance = lngLatDistanceMeters(center, event.lngLat);
        if (distance < 110 || distance > maxDistance) return null;
        const sector = economyGravitySectorKey(event);
        const confidence = confidenceRank(event.confidence);
        const intensity = clamp01(0.28 + (1 - Math.min(distance, maxDistance) / maxDistance) * 0.42 + confidence * 0.055 + lensHeatWeight(event) * 0.07);
        return {
          point: event.lngLat,
          props: event,
          eventId: event.id,
          sourceId: (event.sourceIds || []).join(","),
          sublayerId: sector,
          sector,
          eventCount: 1,
          sourceCount: Math.max(1, event.sourceIds?.length || 1),
          intensity,
          distance,
          score: intensity * 0.5 + confidence * 0.045 + stableUnit(event.id) * 0.04,
        };
      })
      .filter(Boolean);
  }

  function economyGravityAnchorCandidates(center, lens, maxDistance) {
    const anchorMaxDistance = Math.min(maxDistance, Number(lens.radiusM || 1500) * 1.62);
    return (state.economyAnchorFeatures || [])
      .map((feature) => {
        const props = feature.properties || {};
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (distance < 135 || distance > anchorMaxDistance) return null;
        const sector = props.sublayer_id || props.sector || economyGravitySectorKey(props);
        const rank = Number(props.anchor_rank || 1);
        const proximity = 1 - Math.min(distance, anchorMaxDistance) / Math.max(1, anchorMaxDistance);
        const radial = Math.min(1, distance / Math.max(1, anchorMaxDistance));
        const ringFit = clamp01(1 - Math.abs(radial - 0.58) / 0.58);
        const nameBoost = props.label ? 0.12 : 0;
        const intensity = clamp01(0.26 + rank * 0.16 + ringFit * 0.18 + nameBoost);
        return {
          point,
          props,
          eventId: "",
          sourceId: props.source_id || props.id || "",
          sublayerId: sector,
          sector,
          eventCount: 1,
          sourceCount: 1,
          intensity,
          distance,
          score: intensity * 0.38 + ringFit * 0.34 + Math.min(0.22, rank * 0.07) + radial * 0.08 + stableUnit(`${props.source_id || ""}:${props.label || ""}`) * 0.04,
          isContextAnchor: true,
        };
      })
      .filter(Boolean);
  }

  function selectEconomyGravityCandidates(center, candidates, lens, limit) {
    const selected = [];
    const sectorCounts = new Map();
    const bucketCounts = new Map();
    const sorted = candidates
      .filter((item) => item.point && item.sublayerId)
      .sort((a, b) => b.score - a.score || b.distance - a.distance);
    for (const item of sorted) {
      if (selected.length >= limit) break;
      const sectorLimit = item.sublayerId === "economy" ? 7 : item.isContextAnchor ? 4 : 5;
      if ((sectorCounts.get(item.sublayerId) || 0) >= sectorLimit) continue;
      const bucket = transportAngleBucket(center, item.point, 30);
      if ((bucketCounts.get(bucket) || 0) >= (item.isContextAnchor ? 2 : 3)) continue;
      const minSpacing = item.distance < 600 ? 92 : 138;
      if (selected.some((existing) => existing.sublayerId === item.sublayerId && lngLatDistanceMeters(existing.point, item.point) < minSpacing)) continue;
      selected.push(item);
      sectorCounts.set(item.sublayerId, (sectorCounts.get(item.sublayerId) || 0) + 1);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    }
    if (selected.length >= Math.min(12, limit)) return selected;
    const selectedKeys = new Set(selected.map((item) => `${item.eventId}:${item.sourceId}:${item.distance.toFixed(0)}`));
    for (const item of sorted) {
      if (selected.length >= limit) break;
      const key = `${item.eventId}:${item.sourceId}:${item.distance.toFixed(0)}`;
      if (selectedKeys.has(key)) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < 84)) continue;
      selected.push(item);
      selectedKeys.add(key);
    }
    return selected;
  }

  function economyGravityArcLine(start, end, item, index = 0, laneIndex = 0, laneCount = 1) {
    const [dx, dy] = lngLatToLocalMeters(end, start);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const px = -dy / distance;
    const py = dx / distance;
    const angle = Math.atan2(dy, dx);
    const seed = stableUnit(`${item?.sourceId || ""}:${item?.eventId || ""}:${item?.sector || ""}:${index}`);
    const laneOffset = (laneIndex - (laneCount - 1) / 2) * Math.min(76, 26 + distance * 0.026);
    const sectorSign = item?.sublayerId === "office" || item?.sublayerId === "visitor" ? -1 : 1;
    const orbitSign = Math.sin(angle * 1.55 + seed * 5.6) >= 0 ? 1 : -1;
    const bendMagnitude = Math.min(distance * (0.12 + seed * 0.095 + clamp01(item?.intensity || 0.45) * 0.045), 520);
    const bend = bendMagnitude * sectorSign * orbitSign + laneOffset;
    const c1 = [dx * 0.28 + px * bend * 0.54, dy * 0.28 + py * bend * 0.54];
    const c2 = [dx * 0.78 + px * bend * 0.86, dy * 0.78 + py * bend * 0.86];
    const coords = [];
    for (let i = 0; i <= 34; i += 1) {
      const t = i / 34;
      const inv = 1 - t;
      const x = inv * inv * inv * 0
        + 3 * inv * inv * t * c1[0]
        + 3 * inv * t * t * c2[0]
        + t * t * t * dx;
      const y = inv * inv * inv * 0
        + 3 * inv * inv * t * c1[1]
        + 3 * inv * t * t * c2[1]
        + t * t * t * dy;
      coords.push(offsetLngLat(start, x, y));
    }
    return coords;
  }

  function economyGravitySectorKey(source = {}) {
    const text = [
      source.sector,
      source.status,
      source.title,
      source.label,
      source.shortDescription,
      source.summary,
      source.area,
      ...(source.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/night|pub|club|late[-\s]?night/.test(text)) return "night";
    if (/market|venue|arena|concert|event space/.test(text)) return "markets";
    if (/hotel|hospitality|restaurant|cafe|caf\u00e9|bar|food|drink|takeaway/.test(text)) return "hospitality";
    if (/visitor|culture|tourism|museum|gallery|theatre|cinema|leisure|university|education|campus/.test(text)) return "visitor";
    if (/office|workspace|business|enterprise|industrial|warehouse|manufactur|employment/.test(text)) return "office";
    if (/retail|shop|store|commercial|service|atm|awning|frontage|salon/.test(text)) return "economy";
    return "economy";
  }

  function economyGravitySectorColor(sector) {
    const colors = {
      economy: "#7644a1",
      office: "#158c97",
      hospitality: "#ef5a47",
      visitor: "#e8a620",
      night: "#34393a",
      markets: "#8a5a2b",
    };
    return colors[sector] || colors.economy;
  }

  function economyGravitySectorLabel(sector) {
    const labels = {
      economy: "Retail & services",
      office: "Office & business",
      hospitality: "Hospitality",
      visitor: "Visitor & culture",
      night: "Night economy",
      markets: "Markets & venues",
    };
    return labels[sector] || labels.economy;
  }

  function nodeGuideFeatures(center, lens) {
    if (lens.id.startsWith("transport-")) {
      return transportNodeGuideFeatures(center, lens);
    }
    const radiusM = Number(lens.radiusM || 800);
    const distributedNodeLenses = ["planning-pressure", "civic-access-gaps", "utilities-capacity", "utilities-resilience", "utilities-works"];
    const maxDistance = radiusM * (distributedNodeLenses.includes(lens.id) ? 2.35 : 1.18);
    const anchors = nearbyLensEventAnchors(center, lens, {
      maxDistance,
      minDistance: 70,
      limit: lens.id === "economy-gravity" ? 9 : lens.id === "utilities-works" ? 8 : 10,
      distributed: distributedNodeLenses.includes(lens.id),
    });
    const eventNodes = anchors
      .map((item, index) => {
        const intensity = clamp01(0.18 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.72);
        const sublayerId = lens.id === "economy-gravity"
          ? economyGravitySectorKey(item.event)
          : lens.id === "civic-catchment"
          ? civicServiceSublayerKey(item.event)
          : lens.id === "planning-pressure"
          ? planningPressureDriverKey(item.event)
          : lens.id === "economy-vitality"
          ? economyVitalityLayerKey(item.event)
          : "";
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: lens.id === "planning-pressure" ? "planning_document" : lens.id === "economy-vitality" ? "economy_notice" : "",
          event_id: item.event.id,
          title: item.event.title,
          area: item.event.area || "",
          year: item.event.year || currentTimelineYear(),
          confidence: item.event.confidence || "",
          label: guideNodeLabel(item.event, lens),
          label_detail: guideNodeDetail(item.event, lens),
          label_rank: index + 1,
          layer_id: lens.id === "civic-access-gaps" ? "facilities" : "",
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: lens.id === "economy-gravity" && sublayerId
            ? economyGravitySectorColor(sublayerId)
            : lens.id === "civic-catchment" && sublayerId
            ? civicServiceSublayerColor(sublayerId)
            : lens.id === "planning-pressure" && sublayerId
            ? planningDriverColor(sublayerId)
            : lens.id === "economy-vitality" && sublayerId
            ? economyVitalityLayerColor(sublayerId)
            : guideFlowColor(lens, item.event, 0, intensity),
        },
        geometry: { type: "Point", coordinates: item.event.lngLat },
      };
    });
    const seenEventIds = new Set(eventNodes.map((feature) => feature.properties.event_id).filter(Boolean));
    const utilityTraceNodes = lens.id.startsWith("utilities-")
      ? utilityTraceNodeGuideFeatures(center, lens, maxDistance, seenEventIds)
      : [];
    const civicAccessStopNodes = lens.id === "civic-access-gaps"
      ? civicAccessStopNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const economyAnchorNodes = lens.id === "economy-gravity"
      ? economyGravityAnchorNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const civicCatchmentAnchorNodes = lens.id === "civic-catchment"
      ? civicCatchmentAnchorNodeGuideFeatures(center, lens, maxDistance)
      : [];
    return [
      ...civicAccessStopNodes,
      ...civicCatchmentAnchorNodes,
      ...economyAnchorNodes,
      ...eventNodes,
      ...utilityTraceNodes,
      ...lensDetailNodeGuideFeatures(center, lens, maxDistance, seenEventIds, eventNodes.length + economyAnchorNodes.length + civicCatchmentAnchorNodes.length),
    ];
  }

  function civicCatchmentAnchorNodeGuideFeatures(center, lens, maxDistance) {
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const selected = selectCivicCatchmentCandidates(
      center,
      civicCatchmentCandidates(center, Number(lens.radiusM || 1500), lens, sourceEvents, currentTimelineYear()),
      lens,
      28,
    );
    return selected.map((item, index) => ({
      type: "Feature",
      properties: {
        kind: "node",
        lens_id: lens.id,
        node_style: "civic_anchor",
        source_id: item.sourceId || "",
        event_id: item.event?.id || firstDetailEventId(item.props || {}) || "",
        title: item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId),
        label: truncate(item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId), 28),
        label_detail: item.currentContext
          ? `${civicServiceSublayerLabel(item.layerId)} / OSM context`
          : `${civicServiceSublayerLabel(item.layerId)} / ${currentTimelineYear()}`,
        label_rank: index + 1,
        sublayer_id: item.layerId,
        intensity: Number(item.intensity.toFixed(2)),
        color: civicServiceSublayerColor(item.layerId),
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
  }

  function economyGravityAnchorNodeGuideFeatures(center, lens, maxDistance) {
    const selected = selectEconomyGravityCandidates(
      center,
      economyGravityAnchorCandidates(center, lens, maxDistance),
      lens,
      13,
    );
    return selected.map((item, index) => ({
      type: "Feature",
      properties: {
        kind: "node",
        lens_id: lens.id,
        node_style: "economy_anchor",
        source_id: item.sourceId || "",
        event_id: "",
        title: item.props.label || "Economy anchor",
        label: truncate(item.props.label || economyGravitySectorLabel(item.sublayerId), 30),
        label_detail: `${economyGravitySectorLabel(item.sublayerId)} / OSM context`,
        label_rank: index + 1,
        sublayer_id: item.sublayerId,
        intensity: Number(item.intensity.toFixed(2)),
        color: economyGravitySectorColor(item.sublayerId),
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
  }

  function utilityTraceNodeGuideFeatures(center, lens, maxDistance, seenEventIds = new Set()) {
    const traces = (state.lensDetailFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "utility_trace"
          && Number(props.visible_year || 9999) <= currentTimelineYear()
          && feature.geometry;
      });
    if (!traces.length) return [];
    const limit = lens.id === "utilities-capacity" ? 86
      : lens.id === "utilities-resilience" ? 74
        : 56;
    const minSpacingM = lens.id === "utilities-works" ? 88 : 72;
    const traceMaxDistance = maxDistance * (
      lens.id === "utilities-capacity" ? 1.18
        : lens.id === "utilities-resilience" ? 1.1
          : 1
    );
    const candidates = [];
    for (const trace of traces) {
      const props = trace.properties || {};
      const eventId = firstDetailEventId(props);
      const tracePoint = geometryToLngLat(trace.geometry);
      if (!tracePoint) continue;
      const traceDistance = lngLatDistanceMeters(center, tracePoint);
      if (traceDistance > traceMaxDistance) continue;
      const eventCount = Number(props.event_count || 1);
      const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.18, eventCount * 0.008));
      const sampleCount = Math.max(4, Math.min(12, Math.round(3 + Math.sqrt(eventCount) / 1.8 + Number(props.rank || 1))));
      const points = geometryCoordinateSamples(trace.geometry, sampleCount);
      for (const point of points) {
        const distance = lngLatDistanceMeters(center, point);
        if (distance > traceMaxDistance) continue;
        const proximity = 1 - Math.min(distance, traceMaxDistance) / Math.max(1, traceMaxDistance);
        const duplicatePenalty = eventId && seenEventIds.has(eventId) ? -0.08 : 0;
        candidates.push({
          point,
          props,
          eventId,
          intensity,
          distance,
          score: proximity * 0.45 + intensity * 0.34 + Math.min(0.18, eventCount * 0.006) + Math.min(0.08, Number(props.rank || 1) * 0.018) + duplicatePenalty,
        });
      }
    }
    const selected = [];
    const buckets = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      if (selected.length >= limit) break;
      const bucket = transportAngleBucket(center, item.point, 36);
      const bucketCount = buckets.get(bucket) || 0;
      if (bucketCount >= 7) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacingM)) continue;
      selected.push(item);
      buckets.set(bucket, bucketCount + 1);
    }
    return selected.map((item) => {
      const utilityType = String(item.props.utility_type || utilityEventType({ id: item.eventId, title: item.props.title || "" }, { properties: item.props }) || "asset");
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "utility_trace",
          detail_layer: "utility_trace",
          utility_type: utilityType,
          event_id: item.eventId || "",
          source_id: item.props.source_ids || item.props.source_id || "",
          confidence: item.props.confidence || "",
          intensity: Number(item.intensity.toFixed(2)),
          color: utilityWorksTypeColor(utilityType, { id: item.eventId, title: item.props.title || "" }, { properties: item.props }),
        },
        geometry: { type: "Point", coordinates: item.point },
      };
    });
  }

  function transportNodeGuideFeatures(center, lens) {
    if (["transport-speed", "transport-reliability"].includes(lens.id)) {
      const routeNodes = transportRouteNodeGuideFeatures(center, lens);
      if (routeNodes.length) return routeNodes;
    }
    const radiusM = Number(lens.radiusM || 800);
    const searchRadius = radiusM * (lens.id === "transport-access" ? 2.05 : 2.05);
    const anchors = nearbyTransportRoadAnchors(center, searchRadius, 620);
    const byBucket = new Map();
    for (const anchor of anchors) {
      const dx = anchor.point[0] - center[0];
      const dy = anchor.point[1] - center[1];
      const angle = Math.atan2(dy, dx);
      const bucket = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 24);
      const distributedScore = anchor.score + Math.min(0.36, (anchor.distance / searchRadius) * 0.36);
      const previous = byBucket.get(bucket);
      if (!previous || distributedScore > previous.distributedScore) byBucket.set(bucket, { ...anchor, angle, distributedScore });
    }
    return [...byBucket.values()]
      .sort((a, b) => a.angle - b.angle)
      .slice(0, lens.id === "transport-access" ? 22 : 26)
      .map((anchor) => ({
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "transport",
          intensity: Number(anchor.activity.toFixed(2)),
          color: anchor.color,
          event_id: "",
        },
        geometry: { type: "Point", coordinates: anchor.point },
      }));
  }

  function transportRouteNodeGuideFeatures(center, lens) {
    const routes = transportNetworkStreetFeatures(center, lens)
      .filter((feature) => feature.properties?.flow_style === "transport_backbone")
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0));
    if (!routes.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * (lens.id === "transport-reliability" ? 3.65 : 3.95);
    const limit = lens.id === "transport-reliability" ? 78 : 92;
    const minSpacingM = lens.id === "transport-reliability" ? 150 : 132;
    const bucketCounts = new Map();
    const selected = [];
    for (const route of routes) {
      if (selected.length >= limit) break;
      const props = route.properties || {};
      const samples = geometryCoordinateSamples(route.geometry, Number(props.rank || 1) >= 3 ? 5 : 3);
      for (const point of samples) {
        if (selected.length >= limit) break;
        const distance = lngLatDistanceMeters(center, point);
        if (distance > maxDistance) continue;
        const bucket = transportAngleBucket(center, point, 36);
        const bucketCount = bucketCounts.get(bucket) || 0;
        if (bucketCount >= 5) continue;
        const tooClose = selected.some((item) => lngLatDistanceMeters(item.point, point) < minSpacingM);
        if (tooClose) continue;
        selected.push({ point, props, distance });
        bucketCounts.set(bucket, bucketCount + 1);
      }
    }
    return selected.map((item) => ({
      type: "Feature",
      properties: {
        kind: "node",
        lens_id: lens.id,
        node_style: "transport_route",
        source_id: item.props.source_id || "",
        corridor_key: item.props.corridor_key || "",
        intensity: Number(Math.max(0.34, Number(item.props.intensity || 0.45)).toFixed(2)),
        color: item.props.color || "#1b7a85",
        event_id: "",
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
  }

  function civicAccessStopNodeGuideFeatures(center, lens, maxDistance) {
    const stops = civicAccessTransportStopsNear(center, maxDistance * 1.08);
    if (!stops.length) return [];
    const selected = [];
    const buckets = new Map();
    const minSpacingM = 138;
    for (const stop of stops) {
      if (selected.length >= 64) break;
      const bucket = transportAngleBucket(center, stop.point, 40);
      const bucketCount = buckets.get(bucket) || 0;
      if (bucketCount >= 4) continue;
      if (selected.some((item) => lngLatDistanceMeters(item.point, stop.point) < minSpacingM)) continue;
      selected.push(stop);
      buckets.set(bucket, bucketCount + 1);
    }
    return selected.map((stop) => {
      const props = stop.props || {};
      const lineCount = Number(props.servingLineCount || 0);
      const color = lineCount >= 12 ? "#0f7f86" : lineCount >= 7 ? "#2a84a6" : "#6daeb5";
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          layer_id: "coverage",
          node_style: "transport",
          source_id: props.source_id || "",
          title: props.name || "Transport stop",
          label: truncate(props.name || "Stop", 24),
          label_detail: lineCount ? `${lineCount} lines` : "Translink stop",
          intensity: Number(Math.max(0.32, stop.weight).toFixed(2)),
          color,
          event_id: "",
        },
        geometry: { type: "Point", coordinates: stop.point },
      };
    });
  }

  function lensDetailNodeGuideFeatures(center, lens, maxDistance, seenEventIds = new Set(), baseRank = 0) {
    const detailLayers = detailNodeLayersForLens(lens);
    if (!detailLayers.length || !state.lensDetailFeatures.length) return [];
    const candidates = [];
    for (const feature of state.lensDetailFeatures) {
      const props = feature.properties || {};
      if (!detailLayers.includes(props.layer)) continue;
      if (Number(props.visible_year || 9999) > currentTimelineYear()) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance * detailNodeDistanceFactor(lens.id)) continue;
      const eventId = firstDetailEventId(props);
      const duplicatePenalty = eventId && seenEventIds.has(eventId) ? -0.16 : 0;
      const eventCount = Number(props.event_count || 1);
      const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.24, eventCount * 0.035));
      const proximity = 1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance);
      candidates.push({
        point,
        eventId,
        props,
        score: proximity * 0.58 + intensity * 0.28 + Math.min(0.12, eventCount * 0.018) + duplicatePenalty,
        intensity,
        distance,
      });
    }
    return distributedDetailNodeCandidates(center, candidates, lens)
      .slice(0, detailNodeLimit(lens.id))
      .map((item, index) => {
        const sublayerId = lens.id === "economy-gravity"
          ? economyGravitySectorKey(item.props)
          : lens.id === "planning-pressure"
            ? planningPressureDriverKey(item.props)
            : "";
        return {
          type: "Feature",
          properties: {
            kind: "node",
            lens_id: lens.id,
            node_style: lens.id.startsWith("utilities-") ? "utility_trace" : lens.id === "planning-pressure" ? "planning_document" : "detail",
            detail_layer: item.props.layer,
            utility_type: item.props.utility_type || "",
            event_id: item.eventId,
            title: item.props.label || item.props.title || "",
            area: item.props.road_name || item.props.service_type || item.props.utility_type || "",
            year: item.props.year || currentTimelineYear(),
            confidence: item.props.confidence || "",
            label: guideDetailNodeLabel(item.props, lens),
            label_detail: guideDetailNodeDetail(item.props, lens),
            label_rank: baseRank + index + 1,
            layer_id: lens.id === "civic-access-gaps" ? "facilities" : "",
            sublayer_id: sublayerId,
            intensity: Number(item.intensity.toFixed(2)),
            color: lens.id === "economy-gravity" && sublayerId
              ? economyGravitySectorColor(sublayerId)
              : lens.id === "planning-pressure" && sublayerId
                ? planningDriverColor(sublayerId)
                : detailNodeColor(lens, item.props, index),
          },
          geometry: { type: "Point", coordinates: item.point },
        };
      });
  }

  function detailNodeLayersForLens(lens) {
    if (lens.id === "planning-pressure") return ["planning_cell"];
    if (lens.id.startsWith("civic-")) return ["civic_facility"];
    if (lens.id === "economy-gravity") return ["economy_activity_cell"];
    if (lens.id === "economy-vitality") return ["economy_frontage", "economy_activity_cell"];
    if (lens.id.startsWith("utilities-")) return ["utility_asset"];
    return [];
  }

  function detailNodeDistanceFactor(lensId) {
    if (lensId === "planning-pressure") return 1.55;
    if (lensId === "civic-access-gaps") return 1.25;
    if (lensId === "economy-gravity") return 1.08;
    if (lensId === "utilities-resilience") return 1.1;
    return 1;
  }

  function detailNodeLimit(lensId) {
    if (lensId === "planning-pressure") return 52;
    if (lensId === "civic-access-gaps") return 18;
    if (lensId === "civic-catchment" || lensId === "civic-demand") return 18;
    if (lensId === "economy-gravity") return 18;
    if (lensId.startsWith("utilities-")) return 16;
    return 12;
  }

  function distributedDetailNodeCandidates(center, candidates, lens) {
    const buckets = new Map();
    const bucketCount = lens.id === "civic-access-gaps" ? 20 : 16;
    for (const item of candidates) {
      const angle = Math.atan2(item.point[1] - center[1], item.point[0] - center[0]);
      const bucket = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * bucketCount);
      const previous = buckets.get(bucket);
      if (!previous || item.score > previous.score) buckets.set(bucket, { ...item, angle });
    }
    return [...buckets.values()].sort((a, b) => b.score - a.score);
  }

  function firstDetailEventId(props) {
    return String(props.event_ids || props.event_ids_all || "")
      .split(",")
      .map((value) => value.trim())
      .find(Boolean) || "";
  }

  function guideDetailNodeLabel(props, lens) {
    return guideNodeLabel({
      title: props.label || props.title,
      area: props.road_name || props.service_type || props.utility_type || "",
      year: props.year,
    }, lens);
  }

  function guideDetailNodeDetail(props, lens) {
    if (lens.id === "economy-gravity") {
      const sector = economyGravitySectorKey(props);
      const count = Number(props.event_count || 0);
      return count > 1
        ? `${economyGravitySectorLabel(sector)} / ${count} records`
        : economyGravitySectorLabel(sector);
    }
    const values = [];
    if (props.road_name) values.push(props.road_name);
    if (props.service_type) values.push(titleCase(props.service_type));
    if (props.utility_type) values.push(titleCase(props.utility_type));
    if (props.status || props.work_status) values.push(titleCase(String(props.status || props.work_status).replace(/_/g, " ")));
    if (!values.length && props.event_count) values.push(`${props.event_count} records`);
    if (!values.length && lens?.label) values.push(lens.label);
    return truncate(values.join(" / "), 32);
  }

  function detailNodeColor(lens, props, index = 0) {
    if (lens.id === "planning-pressure") return planningDriverColor(planningPressureDriverKey(props));
    if (lens.id.startsWith("civic-")) {
      const type = String(props.service_type || "").toLowerCase();
      if (/health|care|hospital|gp/.test(type)) return "#e85b1e";
      if (/education|school|college|library/.test(type)) return "#178f8f";
      if (/leisure|sport|culture/.test(type)) return "#347db5";
      if (/safety|police|fire/.test(type)) return "#8c5b3a";
      return index % 3 === 0 ? "#74449a" : index % 3 === 1 ? "#d69423" : "#2a84a6";
    }
    if (lens.id.startsWith("utilities-")) {
      return utilityWorksTypeColor(String(props.utility_type || ""), { id: firstDetailEventId(props), title: props.title || props.label || "" }, { properties: props });
    }
    if (lens.id === "economy-gravity") {
      return economyGravitySectorColor(economyGravitySectorKey(props));
    }
    const text = [props.sector, props.status, props.title, props.label].filter(Boolean).join(" ").toLowerCase();
    if (/office|business/.test(text)) return "#158c97";
    if (/hospitality|hotel|restaurant|cafe|visitor|culture/.test(text)) return /visitor|culture/.test(text) ? "#e8a620" : "#ef5a47";
    if (/night/.test(text)) return "#34393a";
    if (/market/.test(text)) return "#8a5a2b";
    if (/vacan|closure|low/.test(text)) return "#ee3f47";
    return "#7644a1";
  }

  function planningDriverColor(driver) {
    const colors = {
      built_environment: "#d84a2d",
      objections: "#f07b2b",
      completions: "#4b9661",
      vacant_sites: "#258a8e",
      redevelopment: "#b91f32",
      uncertainty: "#75418d",
    };
    return colors[driver] || colors.built_environment;
  }

  function guideNodeLabel(event, lens) {
    const raw = String(event?.title || event?.area || "Source-backed record");
    const cleaned = raw
      .replace(/^(Civic|Commercial|Utility)\s+planning\s+approval:\s*/i, "")
      .replace(/^\d+\s+source-backed\s+(civic service|economy|utilities?)\s+records?\s+(near|around)\s+/i, "")
      .replace(/\bmapped in OSM\b/gi, "mapped asset")
      .replace(/\bBelfast\b/gi, "")
      .replace(/\bopened\b/gi, "open")
      .replace(/\bcompleted\b/gi, "complete")
      .replace(/\bplanning application\b/gi, "planning")
      .replace(/\s+[./-]\s+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const maxByLens = {
      "economy-gravity": 30,
      "economy-vitality": 28,
      "civic-access-gaps": 26,
      "utilities-capacity": 26,
      "utilities-resilience": 26,
      "utilities-works": 24,
    };
    return truncate(cleaned || raw, maxByLens[lens.id] || 26);
  }

  function guideNodeDetail(event, lens) {
    const parts = [];
    if (event?.area) parts.push(event.area);
    if (event?.year) parts.push(String(event.year));
    if (!parts.length && lens?.label) parts.push(lens.label);
    return truncate(parts.join(" / "), 32);
  }

  function nearbyLensEventAnchors(center, lens, options = {}) {
    const category = lens.category || state.activeLens;
    const maxDistance = Number(options.maxDistance || lens.radiusM || 1500);
    const minDistance = Number(options.minDistance || 80);
    const limit = Number(options.limit || 10);
    const candidates = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === category && event.lngLat && event.id !== state.selectedEventId)
      .map((event) => {
        const dx = event.lngLat[0] - center[0];
        const dy = event.lngLat[1] - center[1];
        const distance = lngLatDistanceMeters(center, event.lngLat);
        return { event, distance, angle: Math.atan2(dy, dx) };
      })
      .filter((item) => item.distance > minDistance && item.distance < maxDistance);
    if (!options.distributed) {
      return candidates
        .sort((a, b) => a.distance - b.distance || confidenceRank(b.event.confidence) - confidenceRank(a.event.confidence))
        .slice(0, limit);
    }
    const bucketCount = Math.max(8, Math.min(18, Math.round(limit * 0.9)));
    const byBucket = new Map();
    for (const item of candidates) {
      const bucket = Math.floor(((item.angle + Math.PI) / (Math.PI * 2)) * bucketCount);
      const score = (item.distance / maxDistance) * 0.52 + confidenceRank(item.event.confidence) * 0.08 + lensHeatWeight(item.event) * 0.12;
      const previous = byBucket.get(bucket);
      if (!previous || score > previous.score) byBucket.set(bucket, { ...item, score });
    }
    const selected = [...byBucket.values()].sort((a, b) => a.angle - b.angle);
    const selectedIds = new Set(selected.map((item) => item.event.id));
    if (selected.length < limit) {
      const fillers = candidates
        .filter((item) => !selectedIds.has(item.event.id))
        .sort((a, b) => a.distance - b.distance || confidenceRank(b.event.confidence) - confidenceRank(a.event.confidence))
        .slice(0, limit - selected.length);
      selected.push(...fillers);
    }
    return selected.slice(0, limit);
  }

  function linkedEventGuideFeatures(center, lens, anchors, maxDistance) {
    const links = [];
    const previous = [];
    anchors.forEach((item, index) => {
      const source = previous
        .map((candidate) => ({ candidate, distance: lngLatDistanceMeters(candidate.event.lngLat, item.event.lngLat) }))
        .filter((candidate) => candidate.distance < maxDistance * 0.62)
        .sort((a, b) => a.distance - b.distance)[0]?.candidate;
      const from = source?.event.lngLat || center;
      const intensity = clamp01(0.28 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.52 + confidenceRank(item.event.confidence) * 0.03);
      links.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          event_id: item.event.id,
          intensity: Number(intensity.toFixed(2)),
          color: guideFlowColor(lens, item.event, index, intensity),
        },
        geometry: { type: "LineString", coordinates: curvedLine(from, item.event.lngLat, index % 2 ? -0.1 : 0.1) },
      });
      previous.push(item);
    });
    return links;
  }

  function guideFlowColor(lens, event, index, intensity) {
    if (lens.id === "economy-gravity") {
      const text = [
        event?.title,
        event?.shortDescription,
        event?.summary,
        event?.area,
        ...(event?.affectedSignals || []),
      ].filter(Boolean).join(" ").toLowerCase();
      if (/office|business|workspace|industrial|enterprise/.test(text)) return "#158c97";
      if (/hotel|hospitality|restaurant|cafe|bar|visitor|culture|tourism/.test(text)) return "#ef5a47";
      if (/market|venue|night|pub|entertainment/.test(text)) return "#34393a";
      const palette = ["#7644a1", "#158c97", "#ef5a47", "#e8a620", "#8a5a2b"];
      const seed = stableUnit(`${event?.id || ""}:${index}`);
      return palette[Math.min(palette.length - 1, Math.floor(seed * palette.length))];
    }
    if (lens.id === "planning-pressure") {
      return planningPressureGuideColor(intensity);
    }
    if (lens.id === "civic-access-gaps") {
      if (intensity > 0.72) return "#ed4a2e";
      if (intensity > 0.54) return "#ef8f21";
      if (intensity > 0.38) return "#e4b33c";
      return index % 2 ? "#348f67" : "#0f8d95";
    }
    if (lens.id === "civic-demand") {
      if (intensity > 0.7) return "#cf3d4d";
      if (intensity > 0.52) return "#ed7c62";
      if (intensity > 0.36) return "#efc06d";
      return "#55a39d";
    }
    if (lens.id === "utilities-capacity") {
      if (intensity > 0.76) return "#d62d35";
      if (intensity > 0.58) return "#ed6b35";
      if (intensity > 0.4) return "#e5b734";
      return "#438c64";
    }
    const lensLayer = lensLayerForEvent(event, lens);
    return lensLayer.color || lens.layers?.[index % Math.max(1, lens.layers.length)]?.color || lens.accent || "#1b7a85";
  }

  function eventSurfaceIntensity(cellCenter, lensCenter, radiusM, events) {
    const proximity = 1 - Math.min(radiusM, lngLatDistanceMeters(lensCenter, cellCenter)) / Math.max(1, radiusM);
    if (!events.length) return clamp01(0.18 + proximity * 0.3);
    let score = 0;
    for (const event of events) {
      const distance = lngLatDistanceMeters(cellCenter, event.lngLat);
      if (distance > radiusM * 0.55) continue;
      const weight = confidenceRank(event.confidence) / 4;
      score += Math.max(0, 1 - distance / (radiusM * 0.55)) * Math.max(0.18, weight);
    }
    return clamp01(0.16 + proximity * 0.2 + Math.min(0.74, score * 0.32));
  }

  function eventDensityIntensity(cellCenter, events, kernelM) {
    let score = 0;
    for (const event of events) {
      const distance = lngLatDistanceMeters(cellCenter, event.lngLat);
      if (distance > kernelM) continue;
      const weight = confidenceRank(event.confidence) / 4;
      score += Math.max(0, 1 - distance / kernelM) * Math.max(0.2, weight);
    }
    return clamp01(Math.min(1, score * 0.36));
  }

  function civicDemandAxisAngle(center, events, maxDistance) {
    let xx = 0, yy = 0, xy = 0, total = 0;
    const latRad = center[1] * Math.PI / 180;
    const metersPerLng = Math.max(1, Math.cos(latRad) * 111320);
    for (const event of events) {
      if (!event.lngLat) continue;
      const dx = (event.lngLat[0] - center[0]) * metersPerLng;
      const dy = (event.lngLat[1] - center[1]) * 111320;
      const distance = Math.hypot(dx, dy);
      if (!Number.isFinite(distance) || distance <= 1 || distance > maxDistance) continue;
      const weight = Math.max(0.08, 1 - distance / maxDistance) * Math.max(0.24, confidenceRank(event.confidence) / 4);
      xx += dx * dx * weight;
      yy += dy * dy * weight;
      xy += dx * dy * weight;
      total += weight;
    }
    if (total < 0.1 || Math.abs(xx - yy) + Math.abs(xy) < 1) return Math.PI / 2;
    return 0.5 * Math.atan2(2 * xy, xx - yy);
  }

  function surfaceColorForLens(lensId, intensity, angle, nearestEvent = null, lens = activeMapLens()) {
    if (lensId === "transport-access") {
      if (intensity > 0.84) return "#e97761";
      if (intensity > 0.66) return "#edbd62";
      if (intensity > 0.5) return "#dcd776";
      if (intensity > 0.34) return "#9bcf9d";
      return "#7fc0bf";
    }
    if (lensId === "civic-demand") {
      if (intensity > 0.8) return "#cf3d4d";
      if (intensity > 0.64) return "#ed7c62";
      if (intensity > 0.48) return "#efc06d";
      if (intensity > 0.34) return "#8fbfba";
      return "#55a39d";
    }
    if (lensId === "civic-catchment") {
      if (intensity > 0.78) return "#58a69f";
      if (intensity > 0.62) return "#a6c7a4";
      if (intensity > 0.48) return "#e6d690";
      if (intensity > 0.34) return "#efb367";
      return "#e68c70";
    }
    if (lensId === "economy-land-use") {
      if (nearestEvent) return economyLandUseColor(nearestEvent);
      const palette = ["#ca3b32", "#df8884", "#158c97", "#7b3a8f", "#f0b342", "#8a8f8a"];
      return palette[Math.abs(Math.floor((angle + Math.PI) * 3 + intensity * 6)) % palette.length];
    }
    return intensity > 0.5 ? "#d6a33e" : "#6daeb5";
  }

  function economyLandUseColor(event) {
    const text = [
      event.title,
      event.shortDescription,
      event.summary,
      event.area,
      ...(event.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/vacan|empty|derelict|low activity/.test(text)) return "#df8884";
    if (/office|business|workspace|industrial|factory|manufactur/.test(text)) return "#158c97";
    if (/hotel|hospitality|restaurant|cafe|bar|leisure|visitor|culture|tourism/.test(text)) return "#7b3a8f";
    if (/residential|apartment|student|hmo|dwelling|housing|living/.test(text)) return "#f0b342";
    if (/shop|retail|commercial|market|frontage|store/.test(text)) return "#ca3b32";
    return "#8a8f8a";
  }

  function lensEventSourceKey() {
    const year = currentTimelineYear();
    return [
      state.cityId,
      state.activeLens,
      state.activeAspect,
      [...state.activeAspectLayers].sort().join(","),
      year,
      activeLayerIds().join(","),
      state.confidenceFilter,
      state.showInferred ? "inferred-on" : "inferred-off",
      state.search,
      state.loadedEvents.get(year)?.length || 0,
    ].join(":");
  }

  function lensEventFeatureCollection() {
    const features = [];
    if (!POINT_LENS_IDS.has(state.activeLens)) {
      return { type: "FeatureCollection", features };
    }
    const events = lensPointEventsForActiveLens()
      .filter((event) => event.category === state.activeLens);
    for (const event of events) {
      features.push(lensFeatureFromEvent(event, "current"));
    }
    return { type: "FeatureCollection", features };
  }

  function lensPointEventsForActiveLens() {
    let events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === state.activeLens);
    const center = state.selectedEvent?.lngLat || mapCenter();
    const radiusM = lensEffectiveRadiusM(activeMapLens()) * (state.activeLens === "transport" ? 2.4 : 1.8);
    const limit = state.activeLens === "transport" ? 90 : 120;
    events = events
      .map((event) => ({ event, distance: event.lngLat ? lngLatDistanceMeters(center, event.lngLat) : Infinity }))
      .filter((item) => item.event.id === state.selectedEventId || (item.event.confidence !== "inferred" && item.distance <= radiusM))
      .sort((a, b) => {
        if (a.event.id === state.selectedEventId) return -1;
        if (b.event.id === state.selectedEventId) return 1;
        return a.distance - b.distance || confidenceRank(b.event.confidence) - confidenceRank(a.event.confidence);
      })
      .slice(0, limit)
      .map((item) => item.event);
    if (state.selectedEvent && state.selectedEvent.category === state.activeLens && events.every((event) => event.id !== state.selectedEvent.id)) {
      events.unshift(state.selectedEvent);
    }
    return events;
  }

  function lensEventsForYear(year) {
    let events = visibleEventsForYear(year).filter((event) => event.lngLat);
    if (state.search) {
      const q = state.search.toLowerCase();
      events = events.filter((event) =>
        (event.title || "").toLowerCase().includes(q) ||
        (event.area || "").toLowerCase().includes(q) ||
        (event.summary || "").toLowerCase().includes(q));
    }
    return events;
  }

  function lensFeatureFromEvent(event, role) {
    const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
    const lensLayer = lensLayerForEvent(event, activeMapLens());
    return {
      type: "Feature",
      id: `${role}-${event.id}`,
      properties: {
        layer: "lens_event",
        lens_role: role,
        event_id: event.id,
        title: event.title,
        short_description: event.shortDescription || event.summary || "",
        category: event.category,
        category_color: layer.color,
        lens_layer_id: lensLayer.id,
        lens_layer_label: lensLayer.label,
        lens_layer_color: lensLayer.color,
        year: Number(event.year),
        confidence: event.confidence || "documented",
        heat_weight: lensHeatWeight(event),
        source_count: event.sourceIds?.length || 0,
        evidence_count: Array.isArray(event.evidence) ? event.evidence.length : 0,
        source_ids: (event.sourceIds || []).join(","),
      },
      geometry: { type: "Point", coordinates: event.lngLat },
    };
  }

  function lensLayerForEvent(event, lens = activeMapLens()) {
    const layers = lensLayers(lens);
    const matched = layers.find((layer) => !layer.categoryToggle && eventMatchesTerms(event, aspectLayerTerms(layer)));
    return matched || layers.find((layer) => layer.categoryToggle) || LAYER_BY_ID.get(event.category) || LAYERS[0];
  }

  function isLensPointEvent(event) {
    return event.confidence === "documented" || event.confidence === "corroborated";
  }

  function lensHeatWeight(event) {
    const base = event.confidence === "documented" ? 1.05
      : event.confidence === "corroborated" ? 1.2
      : event.confidence === "inferred" ? 0.35
      : 0.55;
    const sourceBoost = Math.min(0.35, (event.sourceIds?.length || 0) * 0.07);
    return Number((base + sourceBoost).toFixed(3));
  }

  function lensHeatmapFilter() {
    const categories = activeNonTransportLayerIds();
    if (!categories.length) return ["==", ["get", "category"], "__none__"];
    return ["all", ["==", ["get", "lens_role"], "heat"], ["match", ["get", "category"], categories, true, false]];
  }

  function lensPointFilter() {
    return ["==", ["get", "lens_role"], "point"];
  }

  function lensCategoryFilter(category) {
    return ["all", ["==", ["get", "lens_role"], "current"], ["==", ["get", "category"], category]];
  }

  function lensDetailFilter(layer, sublayerId = "") {
    const clauses = [
      "all",
      ["==", ["get", "layer"], layer],
      ["==", ["to-number", ["get", "year"], 0], currentTimelineYear()],
      ...lensDetailConfidenceFilter(),
    ];
    if (sublayerId && !state.activeAspectLayers.has(sublayerId)) clauses.push(["==", ["get", "layer"], "__none__"]);
    return clauses;
  }

  function lensDetailConfidenceFilter() {
    const clauses = [];
    if (state.confidenceFilter !== "all") clauses.push(["==", ["get", "confidence"], state.confidenceFilter]);
    if (!state.showInferred) clauses.push(["!=", ["get", "confidence"], "inferred"]);
    return clauses;
  }

  function builtFootprintFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
    ];
  }

  function builtFootprintYearFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
    ];
  }

  function emptyFeatureCollection() {
    return { type: "FeatureCollection", features: [] };
  }

  function transportBaseRoadFilter() {
    const mode = activeMapLens().id;
    const filter = ["==", ["get", "layer"], "traffic_road_base"];
    if (["transport-speed", "transport-reliability"].includes(mode)) {
      return ["all", filter, [">=", ["to-number", ["get", "rank"], 1], 2]];
    }
    return filter;
  }

  function transportRoadFilter() {
    const mode = activeMapLens().id;
    const filter = [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
    ];
    if (mode === "transport-speed") {
      filter.push(["any", [">=", transportActivityExpression(), 0.16], [">=", ["to-number", ["get", "rank"], 1], 2]]);
    } else if (mode === "transport-reliability") {
      filter.push(["any", [">=", transportActivityExpression(), 0.12], [">=", ["to-number", ["get", "rank"], 1], 2]]);
    }
    return filter;
  }

  function transportHotspotFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
      [">=", transportActivityExpression(), 0.62],
    ];
  }

  function transportActivityExpression() {
    return ["to-number", ["get", "transport_activity"], 0];
  }

  function transportRankExpression() {
    return ["min", 2.2, ["max", 0.72, ["to-number", ["get", "rank"], 1]]];
  }

  function transportBaseRoadCasePaint() {
    const mode = activeMapLens().id;
    const rank = transportRankExpression();
    const opacity = mode === "transport-speed" ? [8, 0.1, 12, 0.24, 16, 0.42]
      : mode === "transport-reliability" ? [8, 0.08, 12, 0.2, 16, 0.36]
        : [8, 0.1, 12, 0.24, 16, 0.42];
    return {
      "line-color": "#fffdf7",
      "line-opacity": ["interpolate", ["linear"], ["zoom"], ...opacity],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        8, ["*", rank, mode === "transport-speed" ? 0.34 : 0.28],
        12, ["*", rank, mode === "transport-speed" ? 0.7 : 0.54],
        16, ["*", rank, mode === "transport-speed" ? 1.1 : 0.9],
      ],
      "line-blur": 0.08,
    };
  }

  function transportBaseRoadPaint() {
    const mode = activeMapLens().id;
    const rank = ["to-number", ["get", "rank"], 1];
    const color = mode === "transport-reliability"
      ? [
        "interpolate", ["linear"], rank,
        1, "#8fb2bd",
        2, "#248b94",
        3, "#ef9c1a",
        4, "#7a3b97",
      ]
      : mode === "transport-access"
        ? [
          "interpolate", ["linear"], rank,
          1, "#b7d7d2",
          2, "#73b7b0",
          3, "#3f9aa0",
          4, "#6b61a8",
        ]
        : [
          "interpolate", ["linear"], rank,
          1, "#4f9a5b",
          2, "#c0b64d",
          3, "#d99a36",
          4, "#c8472e",
        ];
    const opacity = mode === "transport-speed" ? [8, 0.08, 12, 0.18, 16, 0.34]
      : mode === "transport-reliability" ? [8, 0.07, 12, 0.16, 16, 0.3]
        : [8, 0.12, 12, 0.28, 16, 0.48];
    return {
      "line-color": color,
      "line-opacity": ["interpolate", ["linear"], ["zoom"], ...opacity],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        8, ["*", transportRankExpression(), mode === "transport-speed" ? 0.24 : 0.2],
        12, ["*", transportRankExpression(), mode === "transport-speed" ? 0.48 : 0.38],
        16, ["*", transportRankExpression(), mode === "transport-speed" ? 0.82 : 0.68],
      ],
    };
  }

  function transportRoadPaint() {
    const activity = transportActivityExpression();
    const rank = transportRankExpression();
    const rankRaw = ["to-number", ["get", "rank"], 1];
    const rankVisibility = ["interpolate", ["linear"], rankRaw, 1, 0.32, 2, 0.7, 3, 0.92, 4, 1];
    const mode = activeMapLens().id;
    if (mode === "transport-access") {
      return {
        "line-color": [
          "interpolate", ["linear"], activity,
          0, "#21789e",
          0.28, "#1f8fa3",
          0.5, "#2e95a1",
          0.75, "#8762a7",
          1, "#176f92",
        ],
        "line-opacity": ["interpolate", ["linear"], activity, 0, 0.12, 0.2, 0.24, 1, 0.42],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.26, ["*", activity, 0.46]], rank],
          13, ["*", ["+", 0.48, ["*", activity, 0.82]], rank],
          16, ["*", ["+", 0.72, ["*", activity, 1.26]], rank],
        ],
        "line-dasharray": [1.35, 1.15],
      };
    }
    if (mode === "transport-reliability") {
      return {
        "line-color": [
          "case",
          ["<", rankRaw, 2],
          [
            "interpolate", ["linear"], activity,
            0, "#898b8e",
            0.42, "#7a3b97",
            0.72, "#ef9c1a",
            1, "#ef9c1a",
          ],
          [
            "interpolate", ["linear"], activity,
            0, "#898b8e",
            0.28, "#7a3b97",
            0.5, "#ef9c1a",
            0.72, "#ed3f2b",
            1, "#248b94",
          ],
        ],
        "line-opacity": ["*", ["interpolate", ["linear"], activity, 0, 0.12, 0.2, 0.28, 1, 0.58], rankVisibility],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.36, ["*", activity, 0.72]], rank],
          13, ["*", ["+", 0.58, ["*", activity, 1.08]], rank],
          16, ["*", ["+", 0.86, ["*", activity, 1.72]], rank],
        ],
        "line-dasharray": [2.2, 1],
      };
    }
    return {
      "line-color": [
        "case",
        ["<", rankRaw, 2],
        [
          "interpolate", ["linear"], activity,
          0, "#2f8f46",
          0.3, "#6da34d",
          0.62, "#d6a33e",
          1, "#d66a3a",
        ],
        [
          "interpolate", ["linear"], activity,
          0, "#2f8f46",
          0.22, "#6da34d",
          0.46, "#d6a33e",
          0.7, "#d66a3a",
          1, "#c8472e",
        ],
      ],
        "line-opacity": ["*", ["interpolate", ["linear"], activity, 0, 0.14, 0.2, 0.3, 1, 0.62], rankVisibility],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.34, ["*", activity, 0.82]], rank],
          13, ["*", ["+", 0.58, ["*", activity, 1.42]], rank],
          16, ["*", ["+", 0.9, ["*", activity, 2.25]], rank],
      ],
      "line-dasharray": [1, 0.0001],
    };
  }

  function lensHeatmapColor() {
    const ramps = {
      built_environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(200,71,46,0.28)",
        0.35, "rgba(214,148,35,0.58)",
        0.68, "rgba(200,71,46,0.76)",
        1, "rgba(122,59,122,0.9)",
      ],
      transport: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(27,122,133,0.34)",
        0.35, "rgba(63,107,58,0.62)",
        0.68, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.94)",
      ],
      environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(63,107,58,0.34)",
        0.45, "rgba(73,140,88,0.68)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      civic_services: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(27,122,133,0.3)",
        0.45, "rgba(42,132,166,0.66)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      economy: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(122,59,122,0.3)",
        0.45, "rgba(135,76,139,0.66)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      utilities: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(140,116,96,0.32)",
        0.45, "rgba(166,133,89,0.64)",
        0.78, "rgba(214,148,35,0.8)",
        1, "rgba(200,71,46,0.9)",
      ],
      all: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(27,122,133,0.28)",
        0.35, "rgba(214,148,35,0.56)",
        0.68, "rgba(200,71,46,0.78)",
        1, "rgba(122,59,122,0.9)",
      ],
    };
    const active = activeLayerIds();
    return active.length === 1 ? (ramps[active[0]] || ramps.all) : ramps.all;
  }

  function overlayTimeRange() {
    const year = currentTimelineYear();
    return { start: Math.max(earliestTimelineYear(), year - 2), end: year };
  }

  function activeLayerIds() {
    return LAYERS.map((layer) => layer.id).filter((id) => state.activeLayers.has(id));
  }

  function activeNonTransportLayerIds() {
    return activeLayerIds().filter((id) => id !== "transport");
  }

  function currentTimelineYear(value = state.year) {
    const year = Number(value);
    if (Number.isFinite(year)) return Math.round(year);
    return state.yearRange[1] || DEFAULT_YEAR;
  }

  function lensEffectiveRadiusM(lens = activeMapLens()) {
    const override = Number(state.detailRadiusM);
    if (Number.isFinite(override) && override > 0) return override;
    const configured = Number(lens?.radiusM);
    return Number.isFinite(configured) && configured > 0 ? configured : 800;
  }

  function earliestTimelineYear() {
    return state.yearRange[0] || state.years[0] || DEFAULT_YEAR;
  }

  function isLayerVisible(layerId) {
    if (!state.map?.getLayer(layerId)) return false;
    return state.map.getLayoutProperty(layerId, "visibility") !== "none";
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  function visibleEventsForYear(year) {
    const arr = state.loadedEvents.get(year) || [];
    return arr.filter((e) => state.activeLayers.has(e.category))
      .filter((e) => state.confidenceFilter === "all" || e.confidence === state.confidenceFilter)
      .filter((e) => state.showInferred || e.confidence !== "inferred");
  }

  function filteredEvents() {
    let events = visibleEventsForYear(state.year);
    if (state.search) {
      const q = state.search.toLowerCase();
      events = events.filter((e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.area || "").toLowerCase().includes(q) ||
        (e.summary || "").toLowerCase().includes(q));
    }
    return events;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function renderAll() {
    renderLayers();
    renderLensSwitcher();
    renderAspectSwitcher();
    renderActiveLensHeader();
    renderLensLegend();
    renderCoverageNote();
    renderTimeline();
    renderDetail();
    renderSearchResults();
    renderEventList();
    renderComparePanel();
    syncTopline();
  }

  function renderLayers() {
    if (!els.layersList) return;
    const lens = activeMapLens();
    const layers = lensLayers(lens);

    els.layersList.innerHTML = layers.map((l) => {
      const isCategoryToggle = Boolean(l.categoryToggle);
      const on = isCategoryToggle ? state.activeLayers.has(l.id) : state.activeAspectLayers.has(l.id);
      const count = lens.id === "economy-gravity"
        ? economyGravityAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : lens.id === "civic-catchment"
        ? civicCatchmentAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : isCategoryToggle && lens.category === "utilities"
        ? utilityAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : isCategoryToggle
          ? categoryCount(l.id, state.year)
          : aspectLayerCount(l, lens);
      return `
        <div class="layer-row" data-on="${on}" data-layer="${isCategoryToggle ? escapeAttr(l.id) : ""}" data-sublayer="${escapeAttr(l.id)}" role="button" tabindex="0" aria-pressed="${on}">
          <span class="layer-swatch" style="--accent:${l.color}"></span>
          <span class="layer-name">${escapeHtml(l.label)}</span>
          <span class="layer-count">${escapeHtml(formatLayerCount(count, isCategoryToggle))}</span>
        </div>
      `;
    }).join("");

    els.layersList.querySelectorAll(".layer-row").forEach((row) => {
      const toggleLayer = async () => {
        const categoryId = row.getAttribute("data-layer");
        const sublayerId = row.getAttribute("data-sublayer");
        if (categoryId) {
          if (state.activeLayers.has(categoryId)) state.activeLayers.delete(categoryId);
          else state.activeLayers.add(categoryId);
        } else if (sublayerId) {
          if (state.activeAspectLayers.has(sublayerId)) state.activeAspectLayers.delete(sublayerId);
          else state.activeAspectLayers.add(sublayerId);
        }
        resetEventListLimit();
        renderAll();
        updateTimeDependentMapState();
        renderMarkers();
        await reconcileSelectionWithFilters({ keepCamera: false });
      };
      row.addEventListener("click", toggleLayer);
      addPressHandler(row, toggleLayer);
    });

    const onCount = layers.filter((l) => l.categoryToggle ? state.activeLayers.has(l.id) : state.activeAspectLayers.has(l.id)).length;
    setText(els.layersCount, `${onCount}/${layers.length} on`);
  }

  function renderActiveLensHeader() {
    const lens = activeMapLens();
    if (!lens) return;
    const accent = lens.accent || LAYER_BY_ID.get(lens.category)?.color || "#1B7A85";
    if (els.activeLensCard) {
      els.activeLensCard.style.setProperty("--lens-accent", accent);
    }
    els.layersPanel?.style.setProperty("--lens-accent", accent);
    if (els.layersPanel) els.layersPanel.dataset.lens = lens.id;
    setText(els.activeLensIcon, lens.badge || lens.shortLabel?.slice(0, 1) || "");
    setText(els.activeLensDomain, lens.domain || LAYER_BY_ID.get(lens.category)?.label || "Map lens");
    setText(els.activeLensTitle, lens.label || "");
    setText(els.activeLensDescription, lens.description || lens.summary || "");
  }

  function renderLensSwitcher() {
    if (!els.lensSwitcher) return;
    els.lensSwitcher.innerHTML = MAP_LENSES.map((lens) => {
      const active = state.activeLens === lens.id;
      const layerOn = state.activeLayers.has(lens.layerId);
      return `
        <button class="lens-choice" type="button" role="tab" data-lens="${escapeAttr(lens.id)}" data-active="${active}" data-layer-on="${layerOn}" aria-selected="${active}">
          ${escapeHtml(lens.shortLabel)}
        </button>
      `;
    }).join("");
    els.lensSwitcher.querySelectorAll(".lens-choice").forEach((button) => {
      const choose = () => setActiveLens(button.getAttribute("data-lens"));
      button.addEventListener("click", choose);
      addPressHandler(button, choose);
    });
  }

  function renderAspectSwitcher() {
    if (!els.lensAspectSwitcher) return;
    const aspects = LENS_ASPECTS_BY_CATEGORY.get(state.activeLens) || [];
    if (!aspects.length) {
      els.lensAspectSwitcher.innerHTML = "";
      return;
    }
    els.lensAspectSwitcher.innerHTML = aspects.map((lens) => {
      const active = state.activeAspect === lens.id;
      return `
        <button class="lens-aspect-choice" type="button" role="tab" data-aspect="${escapeAttr(lens.id)}" data-active="${active}" aria-selected="${active}">
          ${escapeHtml(lens.shortLabel)}
        </button>
      `;
    }).join("");
    els.lensAspectSwitcher.querySelectorAll(".lens-aspect-choice").forEach((button) => {
      const choose = () => setActiveAspect(button.getAttribute("data-aspect"));
      button.addEventListener("click", choose);
      addPressHandler(button, choose);
    });
  }

  function renderLensLegend() {
    if (!els.lensLegend) return;
    const lens = activeMapLens();
    const status = lensStatusText(lens);
    if (els.lensDataState) setText(els.lensDataState, status.label);
    if (lens.id === "planning-pressure") {
      els.lensLegend.innerHTML = renderPlanningPressureLegend(lens, status);
      return;
    }
    if (lens.id === "economy-vitality") {
      els.lensLegend.innerHTML = renderEconomyVitalityLegend(lens, status);
      return;
    }
    els.lensLegend.innerHTML = `
      <div class="lens-legend-head">
        <strong>${escapeHtml(lensLegendTitle(lens))}</strong>
        <span>${escapeHtml(status.label)}</span>
      </div>
      <div class="lens-legend-summary">${escapeHtml(lens.summary)}</div>
      <div class="lens-legend-items">
        ${lens.legend.map((item) => `
          <div class="lens-legend-item">
            <span class="lens-symbol ${escapeAttr(item.shape)}" style="--legend-color:${escapeAttr(item.color)}"></span>
            <span>${escapeHtml(item.label)}</span>
          </div>
        `).join("")}
      </div>
      <div class="lens-legend-note" data-empty="${status.empty}">${escapeHtml(status.note || lens.caveat)}</div>
    `;
  }

  function renderPlanningPressureLegend(lens, status) {
    const driverRows = lens.layers.map((layer) => `
      <div class="pressure-driver-row">
        <span class="pressure-driver-symbol ${escapeAttr(pressureDriverSymbol(layer.id))}" style="--driver-color:${escapeAttr(layer.color)}"></span>
        <span>${escapeHtml(pressureDriverLegendLabel(layer))}</span>
      </div>
    `).join("");
    return `
      <div class="pressure-legend-card">
        <div class="pressure-legend-title">
          <strong>Pressure field legend</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        <div class="pressure-legend-section">
          <span>Pressure level</span>
          <div class="pressure-levels">
            <div><i style="--level-color:#b91f32"></i><span>Very high</span></div>
            <div><i style="--level-color:#d84a2d"></i><span>High</span></div>
            <div><i style="--level-color:#efaa3c"></i><span>Medium</span></div>
            <div><i style="--level-color:#77aaa1"></i><span>Low</span></div>
            <div><i style="--level-color:#8fb2bd"></i><span>Very low</span></div>
          </div>
        </div>
        <div class="pressure-legend-section">
          <span>Drivers (dominant)</span>
          <div class="pressure-drivers">${driverRows}</div>
        </div>
        <div class="pressure-study-line"><i></i><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
        <div class="pressure-legend-note">Not a forecast</div>
      </div>
    `;
  }

  function pressureDriverLegendLabel(layer) {
    const labels = {
      built_environment: "Applications",
      objections: "Objections / appeals",
      completions: "Completions",
      vacant_sites: "Vacant / derelict",
      redevelopment: "Redevelopment press.",
      uncertainty: "Uncertainty inferred",
    };
    return labels[layer?.id] || layer?.label || "";
  }

  function pressureDriverSymbol(id) {
    return {
      built_environment: "document",
      objections: "bubble",
      completions: "check",
      vacant_sites: "dashed",
      redevelopment: "hatch",
      uncertainty: "dashed",
    }[id] || "document";
  }

  function renderEconomyVitalityLegend(lens, status) {
    return `
      <div class="vitality-legend-card">
        <div class="vitality-legend-title">
          <strong>Vitality (current)</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        <div class="vitality-legend-note">Ribbon thickness = business density</div>
        <div class="vitality-levels">
          ${lens.legend.map((item) => `
            <div><i style="--vitality-color:${escapeAttr(item.color)}"></i><span>${escapeHtml(item.label)}</span></div>
          `).join("")}
          <div><i class="muted"></i><span>No / not commercial</span></div>
        </div>
        <div class="vitality-legend-section">
          <strong>Ribbon split</strong>
          <div class="vitality-line-sample dashed"><i></i><span>Before (${Math.max(earliestTimelineYear(), currentTimelineYear() - 2)}-${Math.max(earliestTimelineYear(), currentTimelineYear() - 1)})</span></div>
          <div class="vitality-line-sample solid"><i></i><span>Current (${currentTimelineYear()})</span></div>
        </div>
        <div class="vitality-legend-section">
          <strong>Churn notices</strong>
          <div class="vitality-notice-row"><i style="--notice-color:#5eaa4e"></i><span>Opening</span></div>
          <div class="vitality-notice-row"><i style="--notice-color:#ed3135"></i><span>Closure / vacancy</span></div>
        </div>
      </div>
    `;
  }

  function lensLegendTitle(lens) {
    if (lens.id === "civic-access-gaps") return "Access gap seams";
    const category = LAYER_BY_ID.get(lens.category || lens.layerId || lens.id)?.label || "";
    if (!category || category === lens.label) return lens.label;
    return `${category} / ${lens.label}`;
  }

  function activeMapLens() {
    return LENS_ASPECT_BY_ID.get(state.activeAspect)
      || LENS_ASPECT_BY_ID.get(defaultAspectForCategory(state.activeLens))
      || MAP_LENS_BY_ID.get(state.activeLens)
      || MAP_LENS_BY_ID.get(DEFAULT_MAP_LENS);
  }

  function lensLayers(lens = activeMapLens()) {
    if (Array.isArray(lens?.layers) && lens.layers.length) return lens.layers;
    const category = lens?.category || lens?.layerId || state.activeLens;
    const layer = LAYER_BY_ID.get(category) || LAYERS[0];
    return [{ id: layer.id, label: layer.label, color: layer.color, categoryToggle: true }];
  }

  function resetActiveAspectLayers() {
    const lens = activeMapLens();
    state.activeAspectLayers = new Set(lensLayers(lens).filter((layer) => !layer.categoryToggle).map((layer) => layer.id));
  }

  function categoryCount(category, year = state.year) {
    const events = state.loadedEvents.get(year);
    if (events) return events.filter((event) => event.category === category).length;
    const chunk = state.chunks.get(year);
    return Number(chunk?.counts_by_category?.[category] || 0);
  }

  function aspectLayerCount(layer, lens = activeMapLens()) {
    const base = categoryCount(lens.category || state.activeLens, state.year);
    const index = Math.max(0, lensLayers(lens).findIndex((item) => item.id === layer.id));
    if (!base) return layer.id === "coverage" || layer.id === "boundary" ? "on" : 0;
    if (lens.category === "utilities") return utilityAspectLayerCount(layer, lens, base);
    if (lens.id === "economy-gravity") return economyGravityAspectLayerCount(layer, lens, base);
    if (lens.id === "civic-catchment") return civicCatchmentAspectLayerCount(layer, lens, base);
    if (/boundary|study|change|grid|seams|corridors|network|frontage|resilience|works|capacity/.test(layer.id)) return "on";
    const factor = [1, 0.42, 0.28, 0.18, 0.12, 0.08][Math.min(5, index)] || 0.06;
    return Math.max(1, Math.round(base * factor));
  }

  function economyGravityAspectLayerCount(layer, _lens, base) {
    const target = layer.categoryToggle ? "economy" : layer.id;
    const detailFeatures = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_activity_cell");
    const anchorFeatures = (state.economyAnchorFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_anchor");
    if (detailFeatures.length || anchorFeatures.length) {
      const detailCount = detailFeatures.reduce((sum, feature) => {
        const props = feature.properties || {};
        const sector = economyGravitySectorKey(props);
        return sector === target ? sum + Math.max(1, Number(props.event_count || 1)) : sum;
      }, 0);
      const anchorCount = anchorFeatures.reduce((sum, feature) => {
        const props = feature.properties || {};
        const sector = props.sublayer_id || props.sector || economyGravitySectorKey(props);
        return sector === target ? sum + 1 : sum;
      }, 0);
      return detailCount + anchorCount;
    }
    return lensEventsForYear(state.year)
      .filter((event) => event.category === "economy" && economyGravitySectorKey(event) === target)
      .length;
  }

  function civicCatchmentAspectLayerCount(layer, _lens, base) {
    const target = layer.id;
    const anchorCount = (state.civicServiceFeatures || [])
      .filter((feature) => civicServiceSublayerKey(feature.properties || {}) === target)
      .length;
    const detailCount = (state.lensDetailFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "civic_facility" && civicServiceSublayerKey(props) === target;
      })
      .reduce((sum, feature) => sum + Math.max(1, Number(feature.properties?.event_count || 1)), 0);
    if (anchorCount || detailCount) return anchorCount + detailCount;
    if (layer.categoryToggle) return base;
    return lensEventsForYear(state.year)
      .filter((event) => event.category === "civic_services" && civicServiceSublayerKey(event) === target)
      .length;
  }

  function utilityAspectLayerCount(layer, lens, base) {
    const typeByLayer = {
      utilities: "electricity",
      power_network: "electricity",
      water: "water",
      water_network: "water",
      telecoms: "telecoms",
      telecoms_network: "telecoms",
      gas: "gas",
      gas_network: "gas",
      drainage: "drainage",
      drainage_network: "drainage",
      district_energy: "district_energy",
    };
    if (lens.id === "utilities-works") {
      const termsByLayer = {
        planned: ["planned", "programme", "scheme", "maintenance", "works"],
        repair: ["repair", "replace", "upgrade", "reinstate"],
        failure: ["fail", "outage", "burst", "emergency", "disruption"],
        permit: ["permit", "consent", "licence", "license"],
        reinstatement: ["reinstate", "restore", "resurface"],
      };
      if (layer.categoryToggle) return base;
      const terms = termsByLayer[layer.id] || [];
      return countEventsByTerms(lensEventsForYear(state.year).filter((event) => event.category === "utilities"), terms);
    }
    const type = layer.utilityType || typeByLayer[layer.id];
    if (!type) return 0;
    const networkCount = (state.utilityNetworkFeatures || [])
      .filter((feature) => feature.properties?.utility_type === type)
      .length;
    const detailCount = (state.lensDetailFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return ["utility_trace", "utility_asset"].includes(props.layer) && props.utility_type === type;
      })
      .length;
    return networkCount + detailCount;
  }

  function formatLayerCount(value, categoryToggle) {
    if (value === "on") return "on";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return categoryToggle ? "0" : "off";
    return compactNumber(numeric);
  }

  function lensStatusText(lens) {
    const category = lens.category || lens.layerId || lens.id;
    if (!state.activeLayers.has(category)) {
      return {
        label: "Layer off",
        empty: true,
        note: `${lens.label} is disabled in the layer toggles, so its map lens is hidden.`,
      };
    }
    if (category === "transport") {
      if (!transportRoadYearPath(state.year)) return { label: "No linework", empty: true, note: lens.empty };
      if (state.transportRoadFeatureCountYearLoaded === state.year && state.transportRoadFeatureCount === 0) {
        return {
          label: "No linework",
          empty: true,
          note: "No source-backed transport records intersect mapped road segments for the selected year.",
        };
      }
      if (state.transportRoadFeatureCountPathLoaded === transportRoadYearPath(state.year) && state.transportRoadFeatureCountYearLoaded !== state.year) {
        return { label: "Loading lines", empty: false, note: lens.caveat };
      }
      return { label: `${state.year} lines`, empty: false, note: lens.caveat };
    }
    if (category === "built_environment") {
      const pointCount = lensPointCount("built_environment");
      const renderableCount = lensRenderablePointCount("built_environment");
      const hasFootprints = Boolean(detailLayerPath());
      const hasDetailCells = Boolean(renderableCount && lensDetailYearPath(state.year));
      if (!hasFootprints && !pointCount && !hasDetailCells) return { label: "No geometry", empty: true, note: lens.empty };
      if (pointCount && !renderableCount && !hasFootprints) {
        return {
          label: "No site geometry",
          empty: true,
          note: "Records exist for this year, but their geometry is aggregate, citywide, corridor, or otherwise unsuitable for site-like lens rendering.",
        };
      }
      if (!hasFootprints && !hasDetailCells) {
        return {
          label: `${renderableCount} sites`,
          empty: false,
          note: "No footprint polygons are available for this city; rendering source-backed site points only.",
        };
      }
      if (!hasDetailCells && hasFootprints) {
        return {
          label: "Footprint context",
          empty: false,
          note: pointCount
            ? "Planning records for this year are aggregate or non-site records, so only mapped footprint context is shown."
            : "No planning/built event cells match this year; mapped footprint context is shown where available for the selected year.",
        };
      }
      return {
        label: `Cells + ${hasFootprints ? "footprints + " : ""}${renderableCount} sites`,
        empty: false,
        note: lensGeometryNote(lens, pointCount, renderableCount),
      };
    }
    if (category === "civic_services") {
      const count = lensPointCount(category);
      const renderableCount = lensRenderablePointCount(category);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Civic records exist for this year, but only aggregate or non-site geometry is available." };
      if (lens.id === "civic-catchment") {
        const anchorCount = state.civicServiceFeatures.length;
        return {
          label: `${compactNumber(anchorCount)} anchors + ${renderableCount} facilities`,
          empty: false,
          note: `${lensGeometryNote(lens, count, renderableCount)} Current OSM civic-service anchors are context only and may post-date the selected year.`,
        };
      }
      return { label: `Cells + ${renderableCount} facilities`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    if (category === "economy") {
      const count = lensPointCount(category);
      const renderableCount = lensRenderablePointCount(category);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Economy records exist for this year, but only aggregate or non-site geometry is available." };
      if (lens.id === "economy-gravity") {
        const anchorCount = state.economyAnchorFeatures.length;
        return {
          label: `${compactNumber(anchorCount)} anchors + ${renderableCount} records`,
          empty: false,
          note: `${lensGeometryNote(lens, count, renderableCount)} Current OSM economy anchors are context only and may post-date the selected year.`,
        };
      }
      return { label: `Cells/frontages + ${renderableCount} records`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    if (category === "utilities") {
      const count = lensPointCount(category);
      const renderableCount = lensRenderablePointCount(category);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Utility records exist for this year, but only aggregate or non-site geometry is available." };
      return { label: `Traces + ${renderableCount} assets`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    const count = lensPointCount(category);
    if (!count) return { label: "No records", empty: true, note: lens.empty };
    return { label: `${count} records`, empty: false, note: lens.caveat };
  }

  function lensPointCount(category) {
    return lensEventsForYear(state.year).filter((event) => event.category === category).length;
  }

  function lensRenderablePointCount(category) {
    return lensEventsForYear(state.year).filter((event) => event.category === category && isLensDetailEligibleEvent(event)).length;
  }

  function lensGeometryNote(lens, rawCount, renderableCount) {
    const skipped = Math.max(0, rawCount - renderableCount);
    if (!skipped) return lens.caveat;
    return `${lens.caveat} ${skipped} aggregate or non-site record${skipped === 1 ? "" : "s"} remain available in the event list.`;
  }

  function isLensDetailEligibleEvent(event) {
    const precision = String(event.provenance?.geometry_precision || "").toLowerCase();
    const sourceBasis = String(event.provenance?.source_basis || "").toLowerCase();
    const sourceIds = (event.sourceIds || []).join(" ").toLowerCase();
    const text = [
      event.title,
      event.shortDescription,
      event.summary,
      event.area,
      event.sourceDateField,
    ].filter(Boolean).join(" ").toLowerCase();
    const combined = `${precision} ${sourceBasis} ${sourceIds} ${text}`;
    const geometryScope = precision.trim();
    if (/\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/.test(combined)) return false;
    if (/\bborough aggregate\b|\baggregate,\s*not\b|\baggregate record\b/.test(combined)) return false;
    if (/\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b/.test(geometryScope)
      || /^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(multiple sites|multi[-\s]?site|programme approximate)\b/.test(geometryScope)) return false;
    if (/^area(?:\s+approximate)?$/.test(precision.trim())) return false;
    return Boolean(event.lngLat);
  }

  function renderCoverageNote() {
    if (!els.coverageNote) return;
    const parts = [];
    const summary = state.availability?.summary;
    const status = summary?.status || state.cityMeta?.availability_status;
    if (status) parts.push(`Coverage: ${status.replace(/_/g, " ")}`);
    if (summary?.summary) parts.push(summary.summary);
    if (state.availabilityError) parts.push(`Availability metadata unavailable: ${state.availabilityError}`);
    const yearError = state.yearLoadErrors.get(state.year);
    if (yearError) parts.push(`Could not load ${state.year} event chunk: ${yearError}`);
    if (state.detailLayerError) parts.push(`Detail layer unavailable: ${state.detailLayerError}`);
    if (state.lensOverlayError) parts.push(`Map lens unavailable: ${state.lensOverlayError}`);
    els.coverageNote.textContent = parts.join(" ");
    els.coverageNote.toggleAttribute("data-warning", Boolean(state.availabilityError || yearError || state.detailLayerError || state.lensOverlayError));
  }

  function renderTimeline() {
    if (!els.tlHistogram || !els.tlAxis) return;
    const [yStart, yEnd] = state.yearRange;
    const years = [];
    for (let y = yStart; y <= yEnd; y++) years.push(y);

    // Bucket: per-year, per-layer counts (using chunk metadata since events
    // for non-current years aren't necessarily loaded yet).
    const totalPerYear = new Map();
    let maxStack = 0;
    for (const y of years) {
      const chunk = state.chunks.get(y);
      if (!chunk) { totalPerYear.set(y, {}); continue; }
      const byCat = chunk.counts_by_category || {};
      const filtered = {};
      let total = 0;
      for (const l of LAYERS) {
        if (!state.activeLayers.has(l.id)) continue;
        const n = byCat[l.id] || 0;
        if (!n) continue;
        filtered[l.id] = n;
        total += n;
      }
      totalPerYear.set(y, filtered);
      if (total > maxStack) maxStack = total;
    }

    els.tlHistogram.innerHTML = years.map((y) => {
      const past = y <= state.year;
      const selected = state.selectedEvent?.year === y;
      const byLayer = totalPerYear.get(y) || {};
      const bars = LAYERS
        .filter((l) => state.activeLayers.has(l.id) && byLayer[l.id])
        .map((l) => {
          const n = byLayer[l.id] || 0;
          // log scale so transport-heavy years don't drown the others
          const h = Math.sqrt(n) / Math.sqrt(Math.max(1, maxStack)) * 100;
          return `<div class="tl-bar" style="height:${h.toFixed(1)}%;background:${l.color}"></div>`;
        }).join("");
      return `<div class="tl-bar-group" data-year="${y}" data-past="${past}" data-selected="${selected}">${bars}</div>`;
    }).join("");

    els.tlAxis.innerHTML = years.map((y) => {
      const major = y % 5 === 0;
      return `<div class="tl-axis-tick ${major ? "major" : ""}">${major ? `'${String(y).slice(2)}` : ""}</div>`;
    }).join("");

    const total = yEnd - yStart;
    const pct = total > 0 ? ((state.year - yStart) / total) * 100 : 0;
    els.tlCursor.style.left = `calc(${pct}% - 1px)`;
    setText(els.tlYear, String(state.year));
  }

  function detailEvidenceYears(event) {
    const current = Number(event?.year || state.year);
    const previousYears = [...state.years].filter((year) => year < current);
    const requested = Number(state.detailBeforeYear);
    const before = previousYears.includes(requested)
      ? requested
      : previousYears.filter((year) => year <= current - 2).pop() || previousYears.pop() || current;
    return { before, after: current };
  }

  function ensureDetailEvidenceLoaded(event) {
    if (!event) return true;
    const { before, after } = detailEvidenceYears(event);
    const years = [...new Set([before, after].filter((year) => state.chunks.has(year)))];
    const missing = years.filter((year) => !state.loadedEvents.has(year));
    if (!missing.length) return true;
    const key = `${event.id}:${years.join(",")}`;
    if (state.detailEvidenceLoadingKey !== key) {
      state.detailEvidenceLoadingKey = key;
      Promise.all(missing.map((year) => loadYear(year))).finally(() => {
        if (state.detailEvidenceLoadingKey === key) state.detailEvidenceLoadingKey = "";
        renderDetail();
      });
    }
    return false;
  }

  function evidenceRowsForYears(beforeYear, afterYear, selectedEvent = null) {
    const beforeEvents = state.loadedEvents.get(beforeYear) || [];
    const afterEvents = state.loadedEvents.get(afterYear) || [];
    return LAYERS.map((layer) => ({
      layer,
      before: pickEvidenceEvent(beforeEvents, layer.id),
      after: selectedEvent?.category === layer.id && selectedEvent.year === afterYear
        ? selectedEvent
        : pickEvidenceEvent(afterEvents, layer.id),
    }));
  }

  function pickEvidenceEvent(events, category) {
    return events
      .filter((event) => event.category === category)
      .sort((a, b) =>
        confidenceRank(b.confidence) - confidenceRank(a.confidence)
        || eventSourceCount(b) - eventSourceCount(a)
        || String(a.title).localeCompare(String(b.title))
      )[0] || null;
  }

  function confidenceRank(value) {
    const key = String(value || "").toLowerCase();
    if (key === "corroborated") return 4;
    if (key === "documented") return 3;
    if (key === "inferred") return 2;
    if (key === "disputed") return 1;
    return 0;
  }

  function renderEvidenceEventButton(event, emptyText) {
    if (!event) return `<div class="evidence-empty">${escapeHtml(emptyText)}</div>`;
    const source = firstEvidenceLabel(event);
    return `
      <button class="evidence-event" type="button" data-event-id="${escapeAttr(event.id)}">
        <strong>${escapeHtml(event.shortDescription || event.title)}</strong>
        <span>${escapeHtml(event.area || "Unknown area")} / ${eventSourceCount(event)} evidence row${eventSourceCount(event) === 1 ? "" : "s"}${source ? ` / ${escapeHtml(source)}` : ""}</span>
      </button>`;
  }

  function firstEvidenceLabel(event) {
    const evidence = Array.isArray(event?.evidence) ? event.evidence.find((item) => item?.label || item?.record_id || item?.url) : null;
    if (evidence?.label) return evidence.label;
    if (evidence?.record_id) return `Record ${evidence.record_id}`;
    if (evidence?.url) return evidence.url;
    const source = Array.isArray(event?.sourceIds) ? state.sourceById.get(event.sourceIds[0]) : null;
    return source?.title || "";
  }

  function wireEvidenceEventButtons(root) {
    root?.querySelectorAll(".evidence-event[data-event-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-event-id");
        if (id) selectEvent(id);
      });
    });
  }

  function renderDetailLensEvidence(event) {
    const { before, after } = detailEvidenceYears(event);
    const ready = ensureDetailEvidenceLoaded(event);
    if (!ready) {
      return `
        <div class="detail-section">
          <h4>Lens Before / After Evidence</h4>
          <div class="lens-evidence-note">Loading source-backed lens context for ${before} and ${after}.</div>
        </div>`;
    }
    const rows = evidenceRowsForYears(before, after, event);
    return `
      <div class="detail-section">
        <h4>Lens Before / After Evidence</h4>
        <div class="lens-evidence-note">Nearest source-backed records by lens; these are context records, not causal outcome measurements.</div>
        <div class="lens-evidence-grid">
          ${rows.map((row) => `
            <div class="lens-evidence-row" style="--accent:${row.layer.color}">
              <div class="lens-evidence-label"><span></span>${escapeHtml(row.layer.label)}</div>
              <div>
                <small>Before ${before}</small>
                ${renderEvidenceEventButton(row.before, "No earlier source-backed record in this lens")}
              </div>
              <div>
                <small>After / current ${after}</small>
                ${renderEvidenceEventButton(row.after, "No source-backed record in this lens for this year")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  function buildLensContext(event) {
    const lens = activeMapLens();
    const category = lens.category || lens.layerId || state.activeLens;
    const layer = LAYER_BY_ID.get(category) || LAYERS[0];
    const { before, after } = detailEvidenceYears(event);
    const radiusM = lensEffectiveRadiusM(lens);
    const center = event?.lngLat || mapCenter();
    const beforeEvents = lensEventsForYear(before).filter((item) => item.category === category);
    const currentEvents = lensEventsForYear(after).filter((item) => item.category === category);
    const nearbyBefore = eventsNear(center, beforeEvents, radiusM);
    const nearbyCurrent = eventsNear(center, currentEvents, radiusM);
    return {
      lens,
      category,
      layer,
      beforeYear: before,
      currentYear: after,
      radiusM,
      center,
      beforeEvents,
      currentEvents,
      nearbyBefore,
      nearbyCurrent,
      selectedSourceCount: eventSourceCount(event),
      activeLensLayerCount: lensLayers(lens).filter((item) => item.categoryToggle
        ? state.activeLayers.has(item.id)
        : state.activeAspectLayers.has(item.id)).length,
    };
  }

  function eventsNear(center, events, radiusM) {
    if (!Array.isArray(center)) return [];
    return events
      .filter((event) => event.lngLat && lngLatDistanceMeters(center, event.lngLat) <= radiusM)
      .sort((a, b) => lngLatDistanceMeters(center, a.lngLat) - lngLatDistanceMeters(center, b.lngLat));
  }

  function renderDetailLensControls(event, context) {
    const currentYear = Number(event?.year || state.year);
    const beforeOptions = state.years.filter((year) => year < currentYear);
    const currentOptions = state.years.length ? state.years : [currentYear];
    const radiusOptions = [...new Set([...DETAIL_RADIUS_OPTIONS, Number(context.lens.radiusM || 0), context.radiusM])]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    return `
      <div class="lens-controls-card" style="--accent:${context.lens.accent || context.layer.color}">
        <label>
          <span>Before</span>
          <select id="detailBeforeYear" ${beforeOptions.length ? "" : "disabled"}>
            ${beforeOptions.length
              ? beforeOptions.map((year) => `<option value="${year}" ${year === context.beforeYear ? "selected" : ""}>${year}</option>`).join("")
              : `<option value="${currentYear}">${currentYear}</option>`}
          </select>
        </label>
        <label>
          <span>Current</span>
          <select id="detailCurrentYear">
            ${currentOptions.map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Radius</span>
          <select id="detailRadius">
            ${radiusOptions.map((radius) => `<option value="${radius}" ${radius === context.radiusM ? "selected" : ""}>${escapeHtml(formatRadius(radius))}</option>`).join("")}
          </select>
        </label>
      </div>
    `;
  }

  function wireDetailLensControls(root) {
    root?.querySelector("#detailBeforeYear")?.addEventListener("change", (event) => {
      state.detailBeforeYear = Number(event.target.value) || null;
      renderDetail();
      renderTimeline();
    });
    root?.querySelector("#detailCurrentYear")?.addEventListener("change", (event) => {
      const year = Number(event.target.value);
      if (Number.isFinite(year)) setYear(year);
    });
    root?.querySelector("#detailRadius")?.addEventListener("change", (event) => {
      state.detailRadiusM = Number(event.target.value) || null;
      state.lensEventSourceKey = "";
      updateTimeDependentMapState();
      renderDetail();
    });
  }

  function renderPlanningPressureDetail(event, context, confidence, sources, provenanceFacts) {
    const rows = planningPressureDriverRows(context);
    const topBlocks = planningPressureTopBlocks(context);
    return `
      <div class="detail-head lens-detail-head planning-pressure-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Change around this event</div>
        <div class="planning-detail-subtitle">Associated change, not causal proof</div>
        <div class="planning-change-tabs" role="tablist" aria-label="Change filter">
          <button type="button" data-filter="all" data-active="false">All lenses</button>
          <button type="button" data-filter="changed" data-active="true">With change</button>
          <button type="button" data-filter="unchanged" data-active="false">No change</button>
        </div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(event.area || "Unknown area")}</span>
          ${event.lngLat ? `<span class="sep">.</span><span style="font-family:var(--font-mono);font-size:10.5px">${event.lngLat[1].toFixed(3)}, ${event.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body planning-pressure-detail-body">
        <section class="detail-section planning-driver-section">
          <h4>Planning-pressure field <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
          <div class="planning-driver-grid" role="table" aria-label="Planning-pressure driver intensity">
            <div class="planning-driver-grid-head" role="row">
              <span>Drivers intensity</span>
              <span>Before ${context.beforeYear}</span>
              <span>After / current ${context.currentYear}</span>
              <span>Change</span>
            </div>
            ${rows.map((row) => `
              <div class="planning-driver-grid-row" role="row" data-changed="${row.delta !== 0}" style="--accent:${escapeAttr(row.layer.color)}">
                <span><i class="pressure-driver-symbol ${escapeAttr(pressureDriverSymbol(row.layer.id))}" style="--driver-color:${escapeAttr(row.layer.color)}"></i>${escapeHtml(pressureDriverLegendLabel(row.layer))}</span>
                <strong>${escapeHtml(compactNumber(row.before))}</strong>
                <strong>${escapeHtml(compactNumber(row.current))}</strong>
                <em data-positive="${row.delta > 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="detail-section planning-explain-section">
          <h4>What this shows</h4>
          <p>Planning activity and pressure concentrate along streets and block edges near the selected event.</p>
          <h4>Prevalence</h4>
          <div class="planning-caution">
            <span></span>
            <p>OSM mapped visibility may differ from real-world data.</p>
          </div>
        </section>

        <section class="detail-section planning-trend-section">
          <h4>Pressure trend <span>(records)</span></h4>
          <div class="planning-trend-list">
            ${rows.map((row) => `
              <div class="planning-trend-row" data-changed="${row.delta !== 0}" style="--accent:${escapeAttr(row.layer.color)}">
                <span>${escapeHtml(pressureDriverLegendLabel(row.layer))}</span>
                ${renderPlanningPressureTrend(row, context)}
                <strong>${escapeHtml(compactNumber(row.current))}</strong>
                <em data-positive="${row.delta > 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="detail-section planning-block-section">
          <h4>Top pressure blocks <span>(by change)</span></h4>
          <div class="planning-block-list">
            ${topBlocks.length ? topBlocks.map((block) => `
              <div class="planning-block-row">
                <span>${escapeHtml(block.label)}</span>
                <strong>${escapeHtml(formatSignedNumber(block.change))}</strong>
                <em>${escapeHtml(block.confidence)}</em>
              </div>
            `).join("") : `<div class="lens-evidence-note">No planning-cell geometry is loaded for the selected year.</div>`}
          </div>
        </section>

        ${sources.length ? `
          <section class="detail-section">
            <h4>Sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> . ${sources.length}</span></h4>
            ${sources.slice(0, 4).map(renderSourceRow).join("")}
          </section>
        ` : ""}

        ${provenanceFacts.length ? `
          <section class="detail-section">
            <h4>Provenance</h4>
            <div class="provenance-grid">
              ${provenanceFacts.slice(0, 4).map((fact) => `
                <div class="provenance-row">
                  <span>${escapeHtml(fact.label)}</span>
                  <strong>${escapeHtml(fact.value)}</strong>
                </div>
              `).join("")}
            </div>
          </section>
        ` : ""}
      </div>
    `;
  }

  function wirePlanningPressureDetail(root) {
    const buttons = [...(root?.querySelectorAll(".planning-change-tabs button") || [])];
    const rows = [...(root?.querySelectorAll("[data-changed]") || [])];
    const setFilter = (filter) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.filter === filter));
      rows.forEach((row) => {
        const changed = row.dataset.changed === "true";
        row.hidden = (filter === "changed" && !changed) || (filter === "unchanged" && changed);
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter || "all")));
    setFilter("changed");
  }

  function planningPressureDriverRows(context) {
    return lensLayers(context.lens).map((layer) => {
      const before = aspectLayerEventMatches(context.beforeEvents, layer).length;
      const current = aspectLayerEventMatches(context.currentEvents, layer).length;
      return { layer, before, current, delta: current - before };
    });
  }

  function renderPlanningPressureTrend(row, context) {
    const years = state.years
      .filter((year) => year <= context.currentYear && year >= context.currentYear - 4)
      .slice(-5);
    const values = years.map((year) => {
      const events = lensEventsForYear(year).filter((event) => event.category === context.category);
      return aspectLayerEventMatches(events, row.layer).length;
    });
    const max = Math.max(1, ...values);
    return `
      <div class="planning-trend-bars" aria-hidden="true">
        ${values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function planningPressureTopBlocks(context) {
    const center = context.center;
    if (!Array.isArray(center)) return [];
    return (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "planning_cell" && Number(feature.properties?.visible_year || 9999) <= context.currentYear)
      .map((feature) => {
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (distance > context.radiusM * 1.35) return null;
        const props = feature.properties || {};
        const eventCount = Number(props.event_count || 1);
        const intensity = Number(props.intensity || 0.4);
        const proximity = 1 - Math.min(context.radiusM * 1.35, distance) / Math.max(1, context.radiusM * 1.35);
        return {
          label: planningPressureBlockLabel(props),
          change: Math.max(1, Math.round(eventCount * 0.72 + intensity * 11 + proximity * 9)),
          confidence: confidenceDescriptor(props.confidence || "documented").label,
          score: eventCount + intensity * 8 + proximity * 3,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  function planningPressureBlockLabel(props) {
    const raw = props.road_name || props.area || props.label || props.title || "Planning evidence cell";
    const cleaned = String(raw)
      .replace(/^\d+\s+source-backed planning and built records:?\s*/i, "")
      .replace(/^planning approval\s*/i, "")
      .replace(/^mixed use planning approval\s*/i, "Mixed use")
      .split(/[.;]/)[0]
      .trim();
    return truncate(cleaned || "Planning evidence cell", 34);
  }

  function renderEconomyVitalityDetail(event, context, sources, provenanceFacts) {
    const rows = economyVitalityMetricRows(context);
    const topStreets = economyVitalityTopStreets(context);
    return `
      <div class="detail-head lens-detail-head economy-vitality-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Diff around selected event</div>
        <div class="planning-detail-subtitle">${escapeHtml(event.title)} . ${escapeHtml(event.effectiveDate || String(event.year))}</div>
        <div class="economy-detail-tabs" role="tablist" aria-label="Economy detail">
          <button type="button" data-panel="performance" data-active="true">Performance</button>
          <button type="button" data-panel="change" data-active="false">Change</button>
          <button type="button" data-panel="context" data-active="false">Context</button>
        </div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(event.area || "Unknown area")}</span>
          ${event.lngLat ? `<span class="sep">.</span><span style="font-family:var(--font-mono);font-size:10.5px">${event.lngLat[1].toFixed(3)}, ${event.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body economy-vitality-detail-body">
        <section class="detail-section economy-panel" data-panel-id="performance">
          <h4>Commercial street-front change <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
          <div class="economy-metric-grid" role="table" aria-label="Commercial street-front change">
            <div class="economy-metric-head" role="row">
              <span></span>
              <span>Before<br>${context.beforeYear}</span>
              <span>After / current<br>${context.currentYear}</span>
              <span>Change</span>
            </div>
            ${rows.map((row) => `
              <div class="economy-metric-row" role="row" style="--accent:${escapeAttr(row.layer.color)}">
                <span><i></i>${escapeHtml(row.label)}</span>
                <strong>${escapeHtml(row.beforeText)}</strong>
                <strong>${escapeHtml(row.currentText)}</strong>
                <em data-positive="${row.positive}">${escapeHtml(row.deltaText)}</em>
              </div>
            `).join("")}
          </div>
          <h4>What this shows</h4>
          <p>Commercial frontages near the selected event are shown as source-backed proxy ribbons, with openings, closures, and vacancy signals separated from activity context.</p>
          <h4>Prevalence</h4>
          <p>${escapeHtml(topStreets.slice(0, 3).map((item) => item.label).join(", ") || "No named frontage segments loaded")}</p>
          <div class="economy-caution"><span></span><p>OSM mapped visibility may differ from real-world data.</p></div>
        </section>

        <section class="detail-section economy-panel" data-panel-id="change" hidden>
          <h4>Top streets by improvement <span>(proxy count)</span></h4>
          <div class="economy-street-list">
            ${topStreets.length ? topStreets.map((street) => `
              <div class="economy-street-row">
                <span>${escapeHtml(street.label)}</span>
                <strong>${escapeHtml(street.changeText)}</strong>
                <em>${escapeHtml(street.confidence)}</em>
              </div>
            `).join("") : `<div class="lens-evidence-note">No frontage lines are loaded for the current lens year.</div>`}
          </div>
        </section>

        <section class="detail-section economy-panel" data-panel-id="context" hidden>
          <h4>Evidence context</h4>
          <p>Frontage ribbons reuse nearest mapped street geometry from source-backed economy records; they are not measured footfall, spend, or vacancy.</p>
          ${sources.length ? sources.slice(0, 4).map(renderSourceRow).join("") : `<div class="lens-evidence-note">No source rows are attached to the selected event.</div>`}
          ${provenanceFacts.length ? `
            <div class="provenance-grid">
              ${provenanceFacts.slice(0, 4).map((fact) => `
                <div class="provenance-row">
                  <span>${escapeHtml(fact.label)}</span>
                  <strong>${escapeHtml(fact.value)}</strong>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </section>
      </div>
    `;
  }

  function wireEconomyVitalityDetail(root) {
    const buttons = [...(root?.querySelectorAll(".economy-detail-tabs button") || [])];
    const panels = [...(root?.querySelectorAll(".economy-panel[data-panel-id]") || [])];
    const setPanel = (panelId) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.panel === panelId));
      panels.forEach((panel) => panel.hidden = panel.dataset.panelId !== panelId);
    };
    buttons.forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.panel || "performance")));
    setPanel("performance");
  }

  function economyVitalityMetricRows(context) {
    return lensLayers(context.lens)
      .filter((layer) => !layer.categoryToggle)
      .map((layer) => {
        const before = aspectLayerEventMatches(context.beforeEvents, layer).length;
        const current = aspectLayerEventMatches(context.currentEvents, layer).length;
        const delta = current - before;
        const isVacancyLike = layer.id === "vacancy" || layer.id === "closures";
        const percentLike = layer.id === "spend";
        const label = {
          vacancy: "Vacancy signals",
          footfall: "Footfall proxy",
          spend: "Spend proxy",
          openings: "Business openings",
          closures: "Business closures",
        }[layer.id] || layer.label;
        return {
          layer,
          label,
          beforeText: percentLike ? compactCurrencyProxy(before) : compactNumber(before),
          currentText: percentLike ? compactCurrencyProxy(current) : compactNumber(current),
          deltaText: percentLike ? `${delta >= 0 ? "+" : "-"}${Math.abs(delta * 8 + (delta ? 3 : 0))}%` : formatSignedNumber(delta),
          positive: isVacancyLike ? delta <= 0 : delta >= 0,
        };
      });
  }

  function compactCurrencyProxy(value) {
    const amount = 82 + Number(value || 0) * 14;
    return `£${compactNumber(amount)}`;
  }

  function economyVitalityTopStreets(context) {
    const center = context.center;
    if (!Array.isArray(center)) return [];
    return (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_frontage" && Number(feature.properties?.visible_year || 9999) <= context.currentYear)
      .map((feature) => {
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (distance > context.radiusM * 1.45) return null;
        const props = feature.properties || {};
        const eventCount = Number(props.event_count || 1);
        const intensity = Number(props.intensity || 0.3);
        const status = economyVitalityLayerKey(props);
        const beneficial = !(status === "vacancy" || status === "closures");
        const rawChange = Math.max(1, Math.round(eventCount * 3.2 + intensity * 12 + stableUnit(props.id || "") * 4));
        return {
          label: economyVitalityStreetLabel(props),
          changeText: beneficial ? formatSignedNumber(rawChange) : `-${compactNumber(rawChange)}`,
          confidence: confidenceDescriptor(props.confidence || "documented").label,
          score: rawChange + (beneficial ? 6 : 0) + (1 - Math.min(context.radiusM * 1.45, distance) / Math.max(1, context.radiusM * 1.45)) * 8,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  function economyVitalityStreetLabel(props) {
    const raw = props.road_name && props.road_name !== "mapped street segment"
      ? props.road_name
      : props.label || props.title || "Mapped frontage";
    return truncate(String(raw).replace(/^\d+\s+source-backed economy records near\s*/i, "").split(/[.;]/)[0].trim() || "Mapped frontage", 30);
  }

  function renderLensMetrics(context) {
    const metrics = lensMetricRows(context);
    return `
      <div class="detail-section lens-metrics-section">
        <h4>${escapeHtml(context.lens.label)} readout</h4>
        <div class="lens-metric-grid">
          ${metrics.map((metric) => `
            <div class="lens-metric" data-tone="${escapeAttr(metric.tone || "neutral")}">
              <span>${escapeHtml(metric.label)}</span>
              <strong>${escapeHtml(metric.value)}</strong>
              <small>${escapeHtml(metric.hint || "")}${metric.delta != null ? ` / ${escapeHtml(formatSignedNumber(metric.delta))} vs ${context.beforeYear}` : ""}</small>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  function lensMetricRows(context) {
    const categoryDelta = context.currentEvents.length - context.beforeEvents.length;
    const nearbyDelta = context.nearbyCurrent.length - context.nearbyBefore.length;
    const layerTotal = lensLayers(context.lens).length;
    const sourceText = `${context.selectedSourceCount} row${context.selectedSourceCount === 1 ? "" : "s"}`;
    const common = [
      { label: "Lens records", value: compactNumber(context.currentEvents.length), delta: categoryDelta, hint: context.layer.label },
      { label: "Near event", value: compactNumber(context.nearbyCurrent.length), delta: nearbyDelta, hint: `within ${formatRadius(context.radiusM)}` },
      { label: "Evidence rows", value: sourceText, hint: "selected event" },
      { label: "Layers on", value: `${context.activeLensLayerCount}/${layerTotal}`, hint: "visible treatment layers" },
    ];
    const roadCount = state.transportRoadFeatureCount == null ? "loading" : compactNumber(state.transportRoadFeatureCount);
    const detailStatus = state.lensDetailYearLoaded === context.currentYear ? "loaded" : "pending";
    const nearbyIndex = Math.round(clamp01(context.nearbyCurrent.length / Math.max(1, context.currentEvents.length)) * 100);
    const variants = {
      "transport-speed": [
        { label: "Activity index", value: `${nearbyIndex}`, hint: "derived from nearby records", tone: "teal" },
        { label: "Mapped segments", value: roadCount, hint: "source-backed linework" },
        common[1],
        common[2],
      ],
      "transport-access": [
        { label: "Access radius", value: formatRadius(context.radiusM), hint: "generated isochrone fabric", tone: "teal" },
        common[1],
        { label: "Network records", value: compactNumber(context.currentEvents.length), delta: categoryDelta, hint: "walk/bus/rail evidence" },
        common[3],
      ],
      "transport-reliability": [
        { label: "Service threads", value: compactNumber(context.currentEvents.length), delta: categoryDelta, hint: "transport records" },
        { label: "Disruption notes", value: compactNumber(countEventsByTerms(context.currentEvents, ["delay", "closed", "works", "disruption", "roadworks"])), hint: "keyword-matched" },
        common[1],
        common[2],
      ],
      "planning-pressure": [
        { label: "Pressure records", value: compactNumber(context.currentEvents.length), delta: categoryDelta, hint: "planning/built evidence", tone: "red" },
        common[1],
        { label: "Detail cells", value: detailStatus, hint: "planning geometry source" },
        common[2],
      ],
      "planning-delta": [
        { label: "Changed records", value: compactNumber(Math.max(0, categoryDelta)), delta: categoryDelta, hint: "before/current count" },
        { label: "Footprint context", value: state.detailLayerLoaded ? "loaded" : "pending", hint: "OSM visibility layer" },
        common[1],
        common[2],
      ],
      "planning-parcels": [
        { label: "Parcel-stage cells", value: detailStatus, hint: "derived evidence mosaic" },
        common[0],
        common[1],
        common[2],
      ],
      "civic-access-gaps": [
        { label: "Gap index", value: `${100 - nearbyIndex}`, hint: "inverse nearby coverage", tone: "amber" },
        common[1],
        common[0],
        common[2],
      ],
      "civic-catchment": [
        { label: "Catchment cells", value: compactNumber(Math.max(1, Math.round(context.radiusM / 28))), hint: "nearest service anchors" },
        common[1],
        common[0],
        common[2],
      ],
      "civic-demand": [
        { label: "Demand index", value: `${Math.min(160, 40 + nearbyIndex)}`, hint: "derived context" },
        common[1],
        common[0],
        common[2],
      ],
      "economy-vitality": [
        { label: "Vitality ribbons", value: detailStatus, hint: "frontage geometry" },
        common[1],
        common[0],
        common[2],
      ],
      "economy-land-use": [
        { label: "Land-use cells", value: detailStatus, hint: "activity tiles" },
        common[1],
        common[0],
        common[2],
      ],
      "economy-gravity": [
        { label: "Flow anchors", value: compactNumber(Math.min(13, Math.max(0, state.economyAnchorFeatures.length ? state.economyAnchorFeatures.length : context.nearbyCurrent.length - 1))), hint: state.economyAnchorFeatures.length ? "current OSM context" : "nearby activity records" },
        common[1],
        common[0],
        common[2],
      ],
      "utilities-capacity": [
        { label: "Capacity traces", value: detailStatus, hint: "utility trace geometry" },
        common[1],
        common[0],
        common[2],
      ],
      "utilities-resilience": [
        { label: "Resilience nodes", value: compactNumber(Math.min(5, Math.max(1, Math.round(context.nearbyCurrent.length / 3)))), hint: "generated route nodes" },
        common[1],
        common[0],
        common[2],
      ],
      "utilities-works": [
        { label: "Works records", value: compactNumber(context.currentEvents.length), delta: categoryDelta, hint: "permits/assets/work notes" },
        { label: "Disruption notes", value: compactNumber(countEventsByTerms(context.currentEvents, ["repair", "works", "closure", "permit", "outage", "disruption"])), hint: "keyword-matched" },
        common[1],
        common[2],
      ],
    };
    return variants[context.lens.id] || common;
  }

  function renderAspectDiffPanel(context) {
    const rows = lensLayers(context.lens).map((layer) => {
      const before = aspectLayerEventMatches(context.beforeEvents, layer).length;
      const current = aspectLayerEventMatches(context.currentEvents, layer).length;
      return { layer, before, current, delta: current - before };
    });
    return `
      <div class="detail-section aspect-diff-panel">
        <h4>Change around selected event</h4>
        <div class="aspect-diff-copy">${escapeHtml(context.lens.summary)}</div>
        ${renderMicroSparkline(context)}
        <div class="aspect-diff-rows">
          ${rows.map((row) => `
            <div class="aspect-diff-row" style="--accent:${escapeAttr(row.layer.color)}">
              <span class="aspect-diff-swatch"></span>
              <span>${escapeHtml(row.layer.label)}</span>
              <strong>${escapeHtml(compactNumber(row.before))}</strong>
              <strong>${escapeHtml(compactNumber(row.current))}</strong>
              <em data-positive="${row.delta > 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
            </div>
          `).join("")}
        </div>
        <div class="lens-causality-note">Observed records during the same period; causation is not claimed.</div>
      </div>`;
  }

  function renderMicroSparkline(context) {
    const years = state.years.filter((year) => year <= context.currentYear).slice(-7);
    const values = years.map((year) => Number(state.chunks.get(year)?.counts_by_category?.[context.category] || 0));
    const max = Math.max(1, ...values);
    return `
      <div class="lens-sparkline" aria-hidden="true">
        ${years.map((year, index) => {
          const height = Math.max(10, Math.round((values[index] / max) * 100));
          return `<span style="height:${height}%" data-current="${year === context.currentYear}"></span>`;
        }).join("")}
      </div>`;
  }

  function aspectLayerEventMatches(events, layer) {
    if (layer.categoryToggle) return events;
    const terms = aspectLayerTerms(layer);
    return events.filter((event) => eventMatchesTerms(event, terms));
  }

  function countEventsByTerms(events, terms) {
    return events.filter((event) => eventMatchesTerms(event, terms)).length;
  }

  function eventMatchesTerms(event, terms) {
    const text = [
      event.title,
      event.shortDescription,
      event.summary,
      event.area,
      event.lens,
      event.sourceDateField,
      ...(event.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    return terms.some((term) => text.includes(term));
  }

  function aspectLayerTerms(layer) {
    const synonyms = {
      public_transport: ["bus", "translink", "glider", "public transport", "station", "rail"],
      bus_network: ["bus", "translink", "glider", "stop"],
      rail: ["rail", "station", "train"],
      rail_network: ["rail", "station", "train"],
      cycle_network: ["cycle", "bike", "cycling"],
      parking: ["parking", "car park"],
      incidents: ["closure", "incident", "disruption", "roadworks", "delay"],
      barriers: ["barrier", "bridge", "crossing", "terrain"],
      stations_stops: ["station", "stop", "interchange"],
      objections: ["objection", "appeal"],
      completions: ["complete", "opened", "built"],
      vacant_sites: ["vacant", "derelict"],
      redevelopment: ["redevelopment", "regeneration"],
      uncertainty: ["inferred", "uncertain"],
      before_footprint: ["before", "mapped"],
      height_change: ["height", "storey", "tower"],
      land_use_change: ["land use", "conversion", "use"],
      major_developments: ["development", "masterplan"],
      demolitions: ["demolition", "demolished"],
      proposed: ["proposed", "proposal"],
      permitted: ["permitted", "approved", "permission"],
      construction: ["construction", "commenced", "works"],
      completed: ["completed", "opened", "built"],
      demolished: ["demolished", "demolition"],
      coverage: ["coverage", "service"],
      gap_seams: ["gap", "underserved"],
      facilities: ["facility", "school", "health", "library", "leisure"],
      health: ["health", "clinic", "hospital"],
      libraries: ["library"],
      leisure: ["leisure", "sport"],
      council: ["council"],
      safety: ["safety", "fire", "police"],
      demand_grid: ["demand", "capacity"],
      displacement: ["displacement", "relocation"],
      vacancy: ["vacancy", "vacant"],
      footfall: ["footfall", "visitor"],
      spend: ["spend", "retail"],
      openings: ["opening", "opened", "launch"],
      closures: ["closure", "closed"],
      change: ["change", "conversion"],
      office: ["office", "business", "workspace"],
      hospitality: ["hotel", "hospitality", "restaurant", "bar"],
      visitor: ["visitor", "culture", "tourism"],
      night: ["night", "bar", "venue"],
      markets: ["market", "venue"],
      water: ["water", "drainage", "sewer"],
      power_network: ["electric", "power", "energy"],
      telecoms: ["telecom", "broadband", "digital"],
      gas: ["gas"],
      drainage: ["drain", "sewer", "water"],
      district_energy: ["district", "heat", "energy"],
      planned: ["planned", "proposal"],
      repair: ["repair", "maintenance"],
      failure: ["failure", "outage", "fault"],
      permit: ["permit", "consent", "approval"],
      reinstatement: ["reinstatement", "resurface"],
    };
    const base = String(`${layer.id} ${layer.label}`).toLowerCase().replace(/[_/()]+/g, " ").split(/\s+/);
    return [...new Set([...(synonyms[layer.id] || []), ...base].filter((term) => term && term.length > 2))];
  }

  function formatRadius(radiusM) {
    const value = Number(radiusM) || 0;
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} km`;
    return `${Math.round(value)} m`;
  }

  function formatSignedNumber(value) {
    const number = Number(value) || 0;
    if (number > 0) return `+${compactNumber(number)}`;
    if (number < 0) return `-${compactNumber(Math.abs(number))}`;
    return "0";
  }

  function renderDetail() {
    if (!els.detailPanel) return;
    if (!state.selectedEvent) {
      els.detailInner.setAttribute("hidden", "");
      els.detailEmpty.removeAttribute("hidden");
      return;
    }
    els.detailEmpty.setAttribute("hidden", "");
    els.detailInner.removeAttribute("hidden");
    const e = state.selectedEvent;
    const layer = LAYER_BY_ID.get(e.category) || LAYERS[1];
    const context = buildLensContext(e);
    const lens = context.lens;
    const confidence = confidenceDescriptor(e.confidence);
    const sources = buildSourceRows(e);
    const provenanceFacts = buildProvenanceFacts(e);

    if (lens.id === "planning-pressure") {
      els.detailInner.innerHTML = renderPlanningPressureDetail(e, context, confidence, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wirePlanningPressureDetail(els.detailInner);
      return;
    }
    if (lens.id === "economy-vitality") {
      els.detailInner.innerHTML = renderEconomyVitalityDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireEconomyVitalityDetail(els.detailInner);
      return;
    }

    els.detailInner.innerHTML = `
      <div class="detail-head lens-detail-head" style="--accent:${lens.accent || layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Change around selected event</div>
        <div class="detail-chip-row">
          <span class="chip" style="--accent:${lens.accent || layer.color}">${escapeHtml(lens.label)}</span>
          <span class="chip" style="--accent:${layer.color}">${escapeHtml(layer.label)}</span>
          <span class="chip neutral">${e.year}</span>
          ${e.confidence === "inferred" ? '<span class="chip neutral">OSM visibility</span>' : ''}
        </div>
        <h2 class="detail-title">${escapeHtml(e.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(e.area || "—")}</span>
          ${e.lngLat ? `<span class="sep">·</span><span style="font-family:var(--font-mono);font-size:10.5px">${e.lngLat[1].toFixed(3)}, ${e.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body">
        ${renderDetailLensControls(e, context)}

        <div class="selected-event-card" style="--accent:${lens.accent || layer.color}">
          <div>
            <span>Selected event</span>
            <strong>${escapeHtml(e.shortDescription || e.summary || e.title)}</strong>
          </div>
          <dl>
            <div><dt>Effective</dt><dd>${escapeHtml(e.effectiveDate || String(e.year))}</dd></div>
            <div><dt>Confidence</dt><dd>${escapeHtml(confidence.label)}</dd></div>
            <div><dt>Sources</dt><dd>${eventSourceCount(e)}</dd></div>
          </dl>
        </div>

        ${renderLensMetrics(context)}
        ${renderAspectDiffPanel(context)}

        <div class="detail-section">
          <h4>Confidence</h4>
          <div class="confidence">
            <span class="conf-label" style="color:${confidence.color}">${escapeHtml(confidence.label)}</span>
            <span class="conf-text">${escapeHtml(confidence.description)}</span>
          </div>
        </div>

        ${provenanceFacts.length ? `
          <div class="detail-section">
            <h4>Provenance</h4>
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
                <div class="provenance-row">
                  <span>${escapeHtml(fact.label)}</span>
                  <strong>${escapeHtml(fact.value)}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${renderDetailLensEvidence(e)}

        ${sources.length ? `
          <div class="detail-section">
            <h4>Sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> · ${sources.length}</span></h4>
            ${sources.map(renderSourceRow).join("")}
          </div>
        ` : ""}

        ${e.caveats && e.caveats.length ? `
          <div class="detail-section">
            <h4>Caveats</h4>
            <ul class="caveat-list">${e.caveats.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="detail-actions">
          <button class="btn" id="detailOpenLens" style="flex:1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><circle cx="10" cy="10" r="5.5"/><path d="M14 14l5 5" stroke-linecap="round"/><path d="M10 7v6M7 10h6"/></svg>
            Open in Proposal Lens
          </button>
          <button class="btn btn-icon" id="detailShare" title="Copy permalink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>
          </button>
        </div>
      </div>
    `;

    els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
    wireDetailLensControls(els.detailInner);
    wireEvidenceEventButtons(els.detailInner);
    els.detailInner.querySelector("#detailOpenLens")?.addEventListener("click", () => setLensOpen(true));
    els.detailInner.querySelector("#detailShare")?.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("city", state.cityId);
      url.searchParams.set("year", String(state.year));
      url.searchParams.set("lens", state.activeAspect || state.activeLens);
      url.searchParams.set("event", state.selectedEventId);
      await copyText(url.toString(), "Event permalink copied");
    });
  }

  function buildSourceRows(event) {
    const rows = [];
    if (Array.isArray(event.evidence)) {
      for (const ev of event.evidence) {
        const kind = (ev.kind || "Source").replace(/_/g, " ");
        const source = state.sourceById.get(ev.source_id);
        const title = ev.label || source?.display_name || source?.title || ev.url || "Evidence";
        const year = ev.year ? String(ev.year) : (event.effectiveDate ? event.effectiveDate.slice(0, 4) : String(event.year));
        const url = ev.url || source?.url || "";
        rows.push({
          kind,
          title,
          year,
          url,
          provider: source?.provider || "",
          licence: source?.licence || "",
          accessed: source?.accessed_at || event.provenance?.source_retrieved_at || "",
          attribution: source?.attribution_text || "",
          filePath: ev.file_path || "",
          recordId: ev.record_id || event.provenance?.source_record_id || "",
        });
      }
    }
    if (!rows.length && Array.isArray(event.sourceIds)) {
      for (const sid of event.sourceIds) {
        const source = state.sourceById.get(sid);
        if (!source) continue;
        rows.push({
          kind: source.kind || source.source_family || "Source",
          title: source.display_name || source.title || sid,
          year: String(event.year),
          url: source.url || "",
          provider: source.provider || "",
          licence: source.licence || "",
          accessed: source.accessed_at || event.provenance?.source_retrieved_at || "",
          attribution: source.attribution_text || "",
          filePath: "",
          recordId: event.provenance?.source_record_id || "",
        });
      }
    }
    return rows.slice(0, 6);
  }

  function renderSourceRow(source) {
    const meta = [
      source.provider,
      source.licence ? `Licence: ${source.licence}` : "",
      source.accessed ? `Retrieved: ${source.accessed}` : "",
      source.recordId ? `Record: ${source.recordId}` : "",
      source.filePath ? `File: ${source.filePath}` : "",
    ].filter(Boolean);
    const body = `
      <div class="source-kind">${escapeHtml(source.kind)}</div>
      <div class="source-title">
        <strong>${escapeHtml(source.title)}</strong>
        ${meta.length ? `<span class="source-meta">${meta.map(escapeHtml).join(" / ")}</span>` : ""}
        ${source.attribution ? `<span class="source-note">${escapeHtml(source.attribution)}</span>` : ""}
      </div>
      <div class="source-year">${escapeHtml(source.year)}</div>`;
    if (!source.url) return `<div class="source-row">${body}</div>`;
    return `<a class="source-row" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`;
  }
  function renderEventList() {
    if (!els.eventList) return;
    const events = filteredEvents();
    const selectedIndex = state.selectedEventId ? events.findIndex((event) => event.id === state.selectedEventId) : -1;
    const limit = Math.min(events.length, Math.max(EVENT_LIST_BATCH_SIZE, state.eventListLimit, selectedIndex + 1));
    const selectedEvent = selectedIndex >= 0 ? events[selectedIndex] : null;
    const visible = selectedEvent
      ? [selectedEvent, ...events.filter((event) => event.id !== selectedEvent.id).slice(0, Math.max(0, limit - 1))]
      : events.slice(0, limit);

    setText(els.eventListCount, `${events.length} visible`);
    const city = shortCityName(state.city?.display_name);
    const searchNote = state.search ? ` Search: "${state.search}".` : "";
    setText(els.eventListMeta, `${city} records in ${state.year}. Timeline, layer, confidence, and inferred filters apply.${searchNote}`);

    if (els.eventListMore) {
      els.eventListMore.hidden = limit >= events.length;
      els.eventListMore.textContent = `Show ${Math.min(EVENT_LIST_BATCH_SIZE, Math.max(0, events.length - limit))} more records`;
    }

    if (!visible.length) {
      const loadError = state.yearLoadErrors.get(state.year);
      els.eventList.innerHTML = loadError
        ? `<div class="event-empty">Could not load ${state.year} records. ${escapeHtml(loadError)}</div>`
        : `<div class="event-empty">No source-backed records match the current timeline and filters.</div>`;
      return;
    }

    els.eventList.innerHTML = visible.map((event) => {
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const sourceCount = eventSourceCount(event);
      const confidence = confidenceDescriptor(event.confidence).label;
      return `
        <button class="event-row" type="button" role="listitem" data-event-id="${escapeAttr(event.id)}" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}">
          <span class="event-dot" aria-hidden="true"></span>
          <span class="event-main">
            <span class="event-title">${escapeHtml(event.title)}</span>
            <span class="event-summary">${escapeHtml(event.shortDescription || event.summary || "")}</span>
            <span class="event-meta">${escapeHtml(event.area || "Unknown area")} / ${escapeHtml(layer.label)} / ${escapeHtml(confidence)} / ${sourceCount} source${sourceCount === 1 ? "" : "s"}</span>
          </span>
          <span class="event-year">${event.year}</span>
        </button>`;
    }).join("");

    els.eventList.querySelectorAll(".event-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-event-id");
        if (id) selectEvent(id);
        if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) setChangelogOpen(false);
      });
    });
  }

  function eventSourceCount(event) {
    const evidence = Array.isArray(event.evidence) ? event.evidence.length : 0;
    const sources = Array.isArray(event.sourceIds) ? event.sourceIds.length : 0;
    return Math.max(evidence, sources, 1);
  }

  function resetEventListLimit() {
    state.eventListLimit = EVENT_LIST_BATCH_SIZE;
  }
  function renderSearchResults() {
    if (!els.searchResults || !els.searchInput) return;
    const q = state.search.trim();
    if (q.length < 2) {
      els.searchResults.setAttribute("hidden", "");
      return;
    }
    const events = visibleEventsForYear(state.year);
    const matches = events
      .filter((e) =>
        (e.title || "").toLowerCase().includes(q.toLowerCase()) ||
        (e.area || "").toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

    if (!matches.length) {
      els.searchResults.removeAttribute("hidden");
      els.searchResults.innerHTML = `<div class="search-empty">No matches in ${escapeHtml(shortCityName(state.city?.display_name))} for "${escapeHtml(q)}". Try a different term or scrub the timeline.</div>`;
      return;
    }
    els.searchResults.removeAttribute("hidden");
    els.searchResults.innerHTML = matches.map((m) => {
      const color = (LAYER_BY_ID.get(m.category) || LAYERS[1]).color;
      return `
        <div class="search-row" data-event-id="${escapeAttr(m.id)}" role="button" tabindex="0">
          <span class="dot" style="background:${color}"></span>
          <div>
            <div class="row-title">${escapeHtml(m.title)}</div>
            <div style="font-size:11px;color:var(--muted)">${escapeHtml(m.area || "")}</div>
          </div>
          <span class="meta">${m.year}</span>
        </div>`;
    }).join("");
    els.searchResults.querySelectorAll(".search-row").forEach((row) => {
      const selectResult = () => {
        const id = row.getAttribute("data-event-id");
        selectEvent(id);
        els.searchResults.setAttribute("hidden", "");
        els.searchInput.value = "";
        state.search = "";
      };
      row.addEventListener("click", selectResult);
      addPressHandler(row, selectResult);
    });
  }

  function renderCityMenu() {
    if (!els.cityMenu) return;
    const cities = state.index?.cities || [];
    els.cityMenu.innerHTML = cities.map((c) => `
      <div class="city-row" data-active="${c.city_id === state.cityId}" data-city-id="${escapeAttr(c.city_id)}" role="button" tabindex="0">
        <span class="city-name">${escapeHtml(shortCityName(c.display_name))}</span>
        <span class="meta">${escapeHtml(c.country || "")}</span>
      </div>
    `).join("");
    els.cityMenu.querySelectorAll(".city-row").forEach((row) => {
      const selectCity = async () => {
        const id = row.getAttribute("data-city-id");
        els.cityMenu.setAttribute("hidden", "");
        if (id && id !== state.cityId) {
          try {
            await loadCity(id);
          } catch (err) {
            toast(`Failed to load ${id}: ${err.message}`);
          }
        }
      };
      row.addEventListener("click", selectCity);
      addPressHandler(row, selectCity);
    });
  }

  function syncTopline() {
    const events = filteredEvents();
    const total = totalEventsForYear(state.year);
    const lens = activeMapLens();
    setText(els.tlVisible, String(events.length));
    setText(els.tlTotal, String(total));
    setText(els.tlCity, state.selectedEvent ? truncate(state.selectedEvent.title, 48) : shortCityName(state.city?.display_name));
    setText(els.tlLayers, `${lens?.label || "Lens"} / ${state.activeLayers.size}/${LAYERS.length} layers`);
  }

  function totalEventsForYear(year) {
    const chunk = state.chunks.get(year);
    if (!chunk) return 0;
    const cats = chunk.counts_by_category || {};
    let total = 0;
    for (const l of LAYERS) {
      if (state.activeLayers.has(l.id)) total += cats[l.id] || 0;
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Year + selection
  // ---------------------------------------------------------------------------

  async function setYear(year) {
    const next = Math.max(state.yearRange[0], Math.min(state.yearRange[1], Math.round(year)));
    if (next === state.year && state.loadedEvents.has(next)) {
      renderAll();
      updateTimeDependentMapState();
      return;
    }
    state.year = next;
    if (Number(state.detailBeforeYear) >= next) state.detailBeforeYear = null;
    resetEventListLimit();
    if (state.compareOpen) state.compareAfterYear = next;
    setText(els.tlYear, String(next));
    updateTimeDependentMapState();
    // de-select if the selected event isn't in the new year
    if (state.selectedEvent && state.selectedEvent.year !== next) {
      state.selectedEventId = null;
      state.selectedEvent = null;
    }
    await loadYear(next);
    await loadLensYearsForTimeline(next);
    if (state.year !== next) return;
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    if (!state.selectedEvent) await selectFirstVisibleEvent({ keepCamera: true });
  }

  async function selectFirstVisibleEvent(opts = {}) {
    const events = filteredEvents();
    const preferred = events.find((e) => e.id === "official-2024-grand-central")
      || events.find((e) => /Belfast Grand Central Station opened/i.test(e.title || ""))
      || events.find((e) => GRAND_CENTRAL_EVENT_IDS.has(e.id));
    const documented = events.find((e) => e.confidence === "documented");
    const first = preferred || documented || events[0];
    if (first) await selectEvent(first.id, { silent: true, ...opts });
  }

  async function reconcileSelectionWithFilters(opts = {}) {
    const events = filteredEvents();
    if (!events.length) {
      state.selectedEventId = null;
      state.selectedEvent = null;
      state.pendingCameraFocusEventId = null;
      renderDetail();
      renderEventList();
      renderMarkers();
      return;
    }
    if (state.selectedEvent && events.some((event) => event.id === state.selectedEventId)) return;
    state.selectedEventId = null;
    state.selectedEvent = null;
    await selectFirstVisibleEvent(opts);
  }

  async function selectEvent(id, opts = {}) {
    let event = state.eventById.get(id);
    if (!event) {
      // try loading any year where the id might live (rare path — usually selecting from current year)
      await loadYear(state.year);
      event = state.eventById.get(id);
    }
    if (!event) {
      if (!opts.silent) toast("Event not found in the current year");
      return;
    }
    state.selectedEventId = event.id;
    state.selectedEvent = event;
    if (event.year !== state.year) {
      await setYear(event.year);
    }
    renderDetail();
    renderEventList();
    renderMarkers();
    updateLensGuideSource();
    syncTopline();
    if (!opts.keepCamera && event.lngLat) {
      if (state.map && state.mapReady) {
        focusMapOnEvent(event, 720);
      } else {
        state.pendingCameraFocusEventId = event.id;
      }
    }
  }

  function focusPendingCameraEvent(duration = 0) {
    if (!state.pendingCameraFocusEventId || !state.map || !state.mapReady) return;
    const event = state.eventById.get(state.pendingCameraFocusEventId);
    state.pendingCameraFocusEventId = null;
    if (event?.lngLat) focusMapOnEvent(event, duration);
  }

  function focusMapOnEvent(event, duration = 720) {
    if (!event?.lngLat || !state.map || !state.mapReady) return;
    state.map.flyTo({
      center: event.lngLat,
      zoom: lensCameraZoom(activeMapLens(), event.lngLat),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      duration,
    });
  }

  function focusActiveLensCamera(duration = 420) {
    const event = state.selectedEvent;
    if (!event?.lngLat || !state.map || !state.mapReady) return;
    state.map.easeTo({
      center: event.lngLat,
      zoom: lensCameraZoom(activeMapLens(), event.lngLat),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      duration,
    });
  }

  function lensCameraZoom(lens = activeMapLens(), lngLat = state.selectedEvent?.lngLat || mapCenter()) {
    const radiusM = Math.max(300, lensEffectiveRadiusM(lens));
    const metersPerPixelByLens = {
      "transport-speed": 5.95,
      "transport-access": 7.85,
      "transport-reliability": 6.1,
      "planning-pressure": 6.05,
      "planning-delta": 4.85,
      "planning-parcels": 3.45,
      "civic-access-gaps": 6.25,
      "civic-catchment": 6.1,
      "civic-demand": 7.8,
      "economy-vitality": 5.75,
      "economy-land-use": 3.78,
      "economy-gravity": 5.85,
      "utilities-capacity": 4.65,
      "utilities-resilience": 5.15,
      "utilities-works": 4.65,
    };
    const lat = Number(lngLat?.[1] || mapCenter()[1]) * Math.PI / 180;
    const maxZoomByLens = {
      "planning-parcels": 14.85,
      "economy-land-use": 14.65,
      "utilities-capacity": 14.65,
      "utilities-resilience": 14.5,
      "utilities-works": 14.65,
    };
    const maxZoom = maxZoomByLens[lens?.id] || (["planning-delta", "planning-parcels", "economy-land-use"].includes(lens?.id) ? 14.4 : 14.3);
    const configuredMetersPerPixel = metersPerPixelByLens[lens?.id];
    if (configuredMetersPerPixel) {
      const zoom = Math.log2((156543.03392 * Math.max(0.25, Math.cos(lat))) / configuredMetersPerPixel);
      return Math.max(13.35, Math.min(maxZoom, zoom));
    }
    const factorByLens = {
      "transport-speed": 1.55,
      "transport-access": 2.55,
      "transport-reliability": 1.7,
      "planning-pressure": 1.35,
      "planning-delta": 0.92,
      "planning-parcels": 0.92,
      "civic-access-gaps": 1.45,
      "civic-catchment": 1.55,
      "civic-demand": 1.55,
      "economy-vitality": 1.35,
      "economy-land-use": 0.94,
      "economy-gravity": 1.45,
      "utilities-capacity": 1.25,
      "utilities-resilience": 1.5,
      "utilities-works": 1.4,
    };
    const targetPxByLens = {
      "transport-access": 420,
      "civic-demand": 380,
      "civic-catchment": 380,
      "economy-gravity": 390,
      "planning-delta": 330,
      "planning-parcels": 330,
      "economy-land-use": 340,
      "utilities-works": 350,
    };
    const effectiveRadius = radiusM * (factorByLens[lens?.id] || 1.35);
    const targetPx = targetPxByLens[lens?.id] || (radiusM >= 1200 ? 370 : 335);
    const metersPerPixel = Math.max(1.4, effectiveRadius / targetPx);
    const rawZoom = Math.log2((156543.03392 * Math.max(0.25, Math.cos(lat))) / metersPerPixel);
    return Math.max(13.55, Math.min(maxZoom, rawZoom));
  }

  function clearSelection() {
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.pendingCameraFocusEventId = null;
    renderDetail();
    renderEventList();
    renderMarkers();
    updateLensGuideSource();
    syncTopline();
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  function togglePlay() {
    if (state.playing) stopPlay(); else startPlay();
  }
  function startPlay() {
    if (state.playing) return;
    state.playing = true;
    updatePlayIcon();
    let last = performance.now();
    const step = (now) => {
      if (!state.playing) return;
      const dt = (now - last) / 1000;
      last = now;
      const nextFloat = state.year + dt * PLAY_RATE_YEARS_PER_SECOND;
      const next = Math.round(nextFloat);
      if (next >= state.yearRange[1]) {
        setYear(state.yearRange[1]);
        stopPlay();
        return;
      }
      if (next !== state.year) setYear(next);
      state.playRaf = requestAnimationFrame(step);
    };
    state.playRaf = requestAnimationFrame(step);
  }
  function stopPlay() {
    state.playing = false;
    if (state.playRaf) cancelAnimationFrame(state.playRaf);
    state.playRaf = null;
    updatePlayIcon();
  }
  function updatePlayIcon() {
    if (!els.playIcon) return;
    els.playIcon.innerHTML = state.playing
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M7 5l12 7-12 7z"/>';
  }

  // ---------------------------------------------------------------------------
  // Overlays
  // ---------------------------------------------------------------------------

  function setActiveLens(lensId) {
    const next = normalizeMapLensId(lensId);
    if (!next || next === state.activeLens) return;
    state.activeLens = next;
    state.activeAspect = defaultAspectForCategory(next);
    state.detailRadiusM = null;
    state.detailBeforeYear = null;
    resetActiveAspectLayers();
    state.lensEventSourceKey = "";
    renderLensSwitcher();
    renderAspectSwitcher();
    renderActiveLensHeader();
    renderLayers();
    renderLensLegend();
    renderDetail();
    updateTimeDependentMapState();
    focusActiveLensCamera();
    syncTopline();
  }

  function setActiveAspect(aspectId) {
    const next = normalizeLensAspectId(aspectId);
    if (!next || next === state.activeAspect) return;
    const aspect = LENS_ASPECT_BY_ID.get(next);
    state.activeAspect = next;
    if (aspect?.category && aspect.category !== state.activeLens) {
      state.activeLens = aspect.category;
    }
    state.detailRadiusM = null;
    state.detailBeforeYear = null;
    resetActiveAspectLayers();
    state.lensEventSourceKey = "";
    renderLensSwitcher();
    renderAspectSwitcher();
    renderActiveLensHeader();
    renderLayers();
    renderLensLegend();
    renderDetail();
    updateTimeDependentMapState();
    focusActiveLensCamera();
    syncTopline();
  }

  function setLensOpen(open) {
    state.lensOpen = open;
    els.lensOverlay?.setAttribute("data-open", String(open));
    if (open) updateLensHead();
  }

  function setMethodOpen(open) {
    state.methodOpen = open;
    els.methodOverlay?.setAttribute("data-open", String(open));
    if (open) renderMethodology();
  }

  function setWelcomeOpen(open) {
    state.welcomeOpen = open;
    els.welcome?.setAttribute("data-open", String(open));
  }

  function setChangelogOpen(open) {
    state.changelogOpen = !!open;
    els.changelogPanel?.setAttribute("data-open", String(state.changelogOpen));
    els.changelogToggle?.setAttribute("aria-pressed", String(state.changelogOpen));
    if (state.changelogOpen) renderEventList();
  }

  function setCompareOpen(open) {
    state.compareOpen = !!open;
    if (state.compareOpen) {
      state.compareBeforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
      state.compareAfterYear = state.compareAfterYear || state.year;
      renderCompareYearOptions();
    }
    renderComparePanel();
  }

  function renderCompareYearOptions() {
    if (!els.compareBeforeYear || !els.compareAfterYear) return;
    const options = state.years.map((year) => `<option value="${year}">${year}</option>`).join("");
    if (els.compareBeforeYear.innerHTML !== options) els.compareBeforeYear.innerHTML = options;
    if (els.compareAfterYear.innerHTML !== options) els.compareAfterYear.innerHTML = options;
    els.compareBeforeYear.value = String(state.compareBeforeYear || compareDefaultBeforeYear());
    els.compareAfterYear.value = String(state.compareAfterYear || state.year);
  }

  function ensureCompareEvidenceLoaded(beforeYear, afterYear) {
    const years = [...new Set([Number(beforeYear), Number(afterYear)].filter((year) => state.chunks.has(year)))];
    const missing = years.filter((year) => !state.loadedEvents.has(year));
    if (!missing.length) return true;
    const key = years.join(",");
    if (state.compareEvidenceLoadingKey !== key) {
      state.compareEvidenceLoadingKey = key;
      Promise.all(missing.map((year) => loadYear(year))).finally(() => {
        if (state.compareEvidenceLoadingKey === key) state.compareEvidenceLoadingKey = "";
        renderComparePanel();
      });
    }
    return false;
  }

  function renderCompareEvidence(rows, beforeYear, afterYear, ready) {
    if (!ready) {
      return `<div class="compare-evidence"><div class="lens-evidence-note">Loading source-backed evidence rows for ${beforeYear} and ${afterYear}.</div></div>`;
    }
    const evidenceRows = evidenceRowsForYears(beforeYear, afterYear)
      .filter((row) => state.activeLayers.has(row.layer.id));
    return `
      <div class="compare-evidence">
        <div class="lens-evidence-note">Before/after rows show one inspectable source-backed record per active lens. Count differences are descriptive, not causal.</div>
        ${evidenceRows.map((row) => `
          <div class="lens-evidence-row" style="--accent:${row.layer.color}">
            <div class="lens-evidence-label"><span></span>${escapeHtml(row.layer.label)}</div>
            <div>
              <small>Before ${beforeYear}</small>
              ${renderEvidenceEventButton(row.before, "No source-backed record in this lens")}
            </div>
            <div>
              <small>After ${afterYear}</small>
              ${renderEvidenceEventButton(row.after, "No source-backed record in this lens")}
            </div>
          </div>
        `).join("")}
      </div>`;
  }

  function renderComparePanel() {
    if (!els.comparePanel) return;
    els.comparePanel.setAttribute("data-open", String(state.compareOpen));
    els.compareBtn?.setAttribute("aria-pressed", String(state.compareOpen));
    if (!state.compareOpen) return;

    renderCompareYearOptions();
    const beforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
    const afterYear = state.compareAfterYear || state.year;
    const beforeCount = compareCountForYear(beforeYear);
    const afterCount = compareCountForYear(afterYear);
    const delta = afterCount - beforeCount;
    const rows = compareCategoryRows(beforeYear, afterYear);
    const evidenceReady = ensureCompareEvidenceLoaded(beforeYear, afterYear);

    if (els.compareStats) {
      els.compareStats.innerHTML = `
        <article><span>${beforeYear}</span><strong>${compactNumber(beforeCount)}</strong><small>records logged</small></article>
        <article><span>${afterYear}</span><strong>${compactNumber(afterCount)}</strong><small>records logged</small></article>
        <article><span>Delta</span><strong>${delta >= 0 ? "+" : ""}${compactNumber(delta)}</strong><small>record count difference</small></article>
        <div class="compare-deltas">
          ${rows.map((row) => `
            <span style="--accent:${row.layer.color}">
              <b>${escapeHtml(row.layer.label)}</b>
              <i>${row.delta >= 0 ? "+" : ""}${compactNumber(row.delta)}</i>
            </span>
          `).join("")}
        </div>
        ${renderCompareEvidence(rows, beforeYear, afterYear, evidenceReady)}`;
      wireEvidenceEventButtons(els.compareStats);
    }
    setText(els.compareNote, "Layer filters apply to this count comparison. OpenStreetMap remains the current orientation basemap; record deltas are not proof of construction volume, congestion, value change, or causation.");
  }

  function compareDefaultBeforeYear() {
    if (!state.years.length) return DEFAULT_YEAR;
    const target = (state.year || DEFAULT_YEAR) - 5;
    let candidate = state.years[0];
    for (const year of state.years) {
      if (year <= target) candidate = year;
      else break;
    }
    return candidate;
  }

  function compareCountForYear(year) {
    const chunk = state.chunks.get(Number(year));
    const counts = chunk?.counts_by_category || {};
    return LAYERS.reduce((sum, layer) => sum + (state.activeLayers.has(layer.id) ? Number(counts[layer.id] || 0) : 0), 0);
  }

  function compareCategoryRows(beforeYear, afterYear) {
    const before = state.chunks.get(Number(beforeYear))?.counts_by_category || {};
    const after = state.chunks.get(Number(afterYear))?.counts_by_category || {};
    return LAYERS
      .filter((layer) => state.activeLayers.has(layer.id))
      .map((layer) => ({
        layer,
        before: Number(before[layer.id] || 0),
        after: Number(after[layer.id] || 0),
        delta: Number(after[layer.id] || 0) - Number(before[layer.id] || 0),
      }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  function recenterMap() {
    if (!state.map) return;
    state.map.easeTo({
      center: mapCenter(),
      zoom: Number(state.city?.default_zoom || 11.5),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      duration: 520,
    });
  }

  function toggleMapTilt() {
    state.mapTilted = !state.mapTilted;
    updateMapToolState();
    if (!state.map) return;
    state.map.easeTo({ pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0, duration: 420 });
  }

  function updateMapToolState() {
    els.tiltBtn?.setAttribute("aria-pressed", String(state.mapTilted));
  }
  function currentProposal() {
    return PROPOSALS.find((p) => p.id === state.currentProposalId) || PROPOSALS[0];
  }

  function renderProposalLensList() {
    if (!els.lensProposals) return;
    const cityProposals = PROPOSALS.filter((p) => p.city === state.cityId);
    const proposals = cityProposals.length ? cityProposals : PROPOSALS;
    if (!proposals.find((p) => p.id === state.currentProposalId)) {
      state.currentProposalId = proposals[0].id;
    }
    els.lensProposals.innerHTML = proposals.map((p) => {
      const layer = LAYER_BY_ID.get(p.analogs?.[0]?.layer || "transport") || LAYERS[0];
      return `
        <div class="proposal-card" data-active="${p.id === state.currentProposalId}" data-proposal-id="${escapeAttr(p.id)}" role="button" tabindex="0" aria-pressed="${p.id === state.currentProposalId}">
          <div class="ptag" style="color:${layer.color}">● ${escapeHtml(p.type)}</div>
          <div class="ptitle">${escapeHtml(p.title)}</div>
          <div class="pmeta">
            <span>${escapeHtml(p.decision)}</span>
            <span>·</span>
            <span>${p.analogs.length} analogs</span>
          </div>
        </div>`;
    }).join("");
    els.lensProposals.querySelectorAll(".proposal-card").forEach((card) => {
      const selectProposal = () => {
        state.currentProposalId = card.getAttribute("data-proposal-id");
        renderProposalLensList();
        renderLensAnalogs(currentProposal());
        renderLensOutcomes(currentProposal());
        updateLensHead();
      };
      card.addEventListener("click", selectProposal);
      addPressHandler(card, selectProposal);
    });
  }

  function renderLensAnalogs(proposal) {
    if (!els.lensAnalogs || !proposal) return;
    els.lensAnalogs.innerHTML = proposal.analogs.map((a) => `
      <div class="analog">
        <div class="head">
          <span>${escapeHtml(a.place)} · ${escapeHtml((LAYER_BY_ID.get(a.layer) || LAYERS[0]).label)}</span>
          <span class="yr">${a.year}</span>
        </div>
        <div class="t">${escapeHtml(a.title)}</div>
        <div class="out-list">
          ${a.outcomes.map((o) => `
            <div class="out"><span>${escapeHtml(o.k)}</span><span class="val">${escapeHtml(o.v)}</span></div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderLensOutcomes(proposal) {
    if (!els.lensOutcomes || !proposal) return;
    els.lensOutcomes.innerHTML = Object.entries(proposal.distribution).map(([k, v]) => `
      <div class="outcome">
        <div class="lbl">${escapeHtml(k)}</div>
        <div class="v">${escapeHtml(v)}</div>
        <div class="range">observed across ${proposal.analogs.length} analogs</div>
      </div>
    `).join("");
  }

  function updateLensHead() {
    const p = currentProposal();
    setText(els.lensTitle, p.title);
    setText(els.lensType, p.type);
    setText(els.lensDecision, p.decision);
    setText(els.lensSummary, p.summary);
  }

  function renderMethodology() {
    if (!els.methodDatasetTable) return;
    const families = (state.city?.source_families || []).slice();
    if (!families.length) {
      els.methodDatasetTable.innerHTML = `<tr><td>Data is still loading.</td></tr>`;
    } else {
      els.methodDatasetTable.innerHTML = `
        <thead><tr><th>Source family</th><th>Coverage</th><th>Years</th><th class="mono">Status</th></tr></thead>
        <tbody>
          ${families.map((f) => `
            <tr>
              <td>${escapeHtml(f.label || f.family_id)}</td>
              <td>${escapeHtml(f.notes || "")}</td>
              <td class="mono">${escapeHtml(f.years?.length ? `${f.years[0]}–${f.years[f.years.length - 1]}` : "—")}</td>
              <td class="mono">${escapeHtml(f.availability || "—")}</td>
            </tr>
          `).join("")}
        </tbody>`;
    }
    const cities = (state.index?.cities || []).map((c) => shortCityName(c.display_name)).join(", ");
    setText(els.methodCities, cities || "Belfast, London, New York.");
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  function cityMeta(id) {
    return (state.index?.cities || []).find((c) => c.city_id === id) || null;
  }
  function initialCityId() {
    const params = new URL(window.location.href).searchParams;
    const requested = params.get("city");
    if (requested && cityMeta(requested)) return requested;
    return cityMeta(DEFAULT_CITY) ? DEFAULT_CITY : state.index?.default_city_id || state.index?.cities?.[0]?.city_id || DEFAULT_CITY;
  }

  function initialEventId() {
    const eventId = new URL(window.location.href).searchParams.get("event");
    return eventId ? String(eventId) : "";
  }

  function confidenceDescriptor(value) {
    const key = String(value || "documented").toLowerCase();
    const descriptions = {
      corroborated: {
        label: "Corroborated",
        color: "var(--conf-high)",
        description: "Supported by independent source organizations. This remains evidence of the observed record, not causation.",
      },
      documented: {
        label: "Documented",
        color: "var(--conf-high)",
        description: "Backed by at least one primary public source. OpenStreetMap basemap is for orientation only.",
      },
      inferred: {
        label: "Inferred (OSM visibility)",
        color: "var(--conf-med)",
        description: "Inferred from OpenStreetMap mapped-visibility metadata. OSM edit dates are not real-world change dates.",
      },
      disputed: {
        label: "Disputed",
        color: "var(--conf-low)",
        description: "Evidence conflicts or limitations are unresolved; inspect caveats and source rows before reuse.",
      },
    };
    return descriptions[key] || { label: titleCase(key), color: "var(--conf-med)", description: "Review source rows and caveats before reuse." };
  }

  function buildProvenanceFacts(event) {
    const p = event.provenance || {};
    return [
      { label: "Effective date", value: event.effectiveDate || String(event.year) },
      { label: "Date precision", value: event.datePrecision || "not stated" },
      { label: "Date basis", value: event.sourceDateField || p.source_date_field || p.source_basis || "" },
      { label: "Retrieved", value: p.source_retrieved_at || "" },
      { label: "Geometry source", value: p.geometry_source || "" },
      { label: "Geometry limitation", value: p.geometry_precision || "" },
      { label: "Transform", value: p.transform || "" },
    ].filter((fact) => fact.value);
  }

  function addPressHandler(el, handler) {
    if (!el) return;
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handler(event);
    });
  }

  function shortCityName(name) {
    if (!name) return "City";
    return String(name).split(",")[0];
  }

  function dataPathToUrl(path) {
    if (!path) return "";
    if (/^https?:/.test(path)) return path;
    return "/" + String(path).replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
  }

  function normalizeMapLensId(value) {
    const id = String(value || "").trim();
    return MAP_LENS_BY_ID.has(id) ? id : "";
  }

  function normalizeLensAspectId(value) {
    const id = String(value || "").trim();
    return LENS_ASPECT_BY_ID.has(id) ? id : "";
  }

  function defaultAspectForCategory(category) {
    const key = String(category || "");
    const configured = DEFAULT_LENS_ASPECT_BY_CATEGORY[key];
    if (configured && LENS_ASPECT_BY_ID.has(configured)) return configured;
    const first = LENS_ASPECTS_BY_CATEGORY.get(key)?.[0]?.id;
    return first || DEFAULT_LENS_ASPECT_BY_CATEGORY[DEFAULT_MAP_LENS];
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  function setAppStatus(text) {
    if (!els.appStatus) return;
    els.appStatus.textContent = text || "";
  }

  let toastTimer = null;
  function toast(message) {
    if (!els.toast) return;
    setText(els.toastText, message);
    els.toast.setAttribute("data-show", "true");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.setAttribute("data-show", "false"), 2200);
  }

  async function copyText(text, successMessage) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      toast(successMessage);
    } catch (_error) {
      toast("Share unavailable in this browser");
    }
  }

  function setText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function cleanTitle(t) {
    return String(t || "Untitled change").replace(/\s+/g, " ").trim();
  }
  function cleanSummary(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }
  function truncate(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
  }
  function compactNumber(n) {
    const value = Number(n) || 0;
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(value);
  }
  function titleCase(s) {
    return String(s || "").replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  window.BimsAtlas = {
    state,
    filteredEvents,
    setYear,
    selectEvent,
    clearSelection,
    setActiveLens,
    setActiveAspect,
    setChangelogOpen,
    setCompareOpen,
    updateTimeDependentMapState,
    isLayerVisible,
    recenterMap,
  };
})();
