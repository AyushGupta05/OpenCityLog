(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  const DEFAULT_CITY = "belfast";
  const DEFAULT_YEAR = 2024;
  const MAX_MARKERS = 180;
  const CITY_OVERVIEW_MAX_ZOOM = 11.2;
  const EVENT_LIST_BATCH_SIZE = 48;
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
      label: "Transport Activity",
      shortLabel: "Activity",
      title: "Transport activity network",
      description: "Source-backed transport records and mapped road context show where activity signals cluster.",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-speed",
      panelMode: "transport",
      summary: "Road and transit segments are colored by source-backed transport activity and mapped delay proxies around the selected event.",
      caveat: "Flow-proxy colors are derived from activity records and mapped context, not km/h, live congestion, or measured speed.",
      layers: [
        { id: "transport", label: "Road flow proxy", color: "#138b43", categoryToggle: true },
        { id: "public_transport", label: "Public transport", color: "#ef3d2f" },
        { id: "cycle_network", label: "Cycle network", color: "#f0a719" },
        { id: "rail", label: "Rail", color: "#7a3b97" },
        { id: "parking", label: "Parking", color: "#4f8f50" },
        { id: "incidents", label: "Incidents", color: "#7f563d" },
      ],
      legend: [
        { label: "Lowest delay proxy", color: "#2d9f57", shape: "line" },
        { label: "Low delay proxy", color: "#6dbc5a", shape: "line" },
        { label: "Moderate delay proxy", color: "#f2ad2f", shape: "line" },
        { label: "High delay proxy", color: "#e95a35", shape: "line" },
        { label: "Severe delay proxy", color: "#bb1e2d", shape: "line" },
      ],
    },
    {
      id: "transport-access",
      category: "transport",
      domain: "Transport Lens",
      badge: "T",
      label: "Access to Transport",
      shortLabel: "Access",
      title: "Access-proxy fabric",
      description: "Mapped network-proxy bands around the selected event.",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-access",
      panelMode: "transport",
      summary: "Access-proxy bands are generated from mapped network and source context around the selected event.",
      caveat: "Access bands are mapped context guides, not measured trip times or service claims.",
      layers: [
        { id: "transport", label: "Walk network", color: "#0f8d95", categoryToggle: true },
        { id: "bus_network", label: "Bus network", color: "#2873c5" },
        { id: "rail_network", label: "Rail network", color: "#7b2fa1" },
        { id: "ferry_routes", label: "Ferry routes", color: "#42a0a7" },
        { id: "stations_stops", label: "Stations & stops", color: "#6d7678" },
        { id: "barriers", label: "Barriers & terrain", color: "#b9b9b2" },
      ],
      legend: [
        { label: "Inner access-proxy band", color: "#e97761", shape: "polygon" },
        { label: "Near access-proxy band", color: "#edbd62", shape: "polygon" },
        { label: "Middle access-proxy band", color: "#dcd776", shape: "polygon" },
        { label: "Outer access-proxy band", color: "#9bcf9d", shape: "polygon" },
        { label: "Edge access-proxy band", color: "#7fc0bf", shape: "outline" },
      ],
    },
    {
      id: "transport-reliability",
      category: "transport",
      domain: "Transport Lens",
      badge: "T",
      label: "Service Reliability",
      shortLabel: "Reliability",
      title: "Service reliability threads",
      description: "Which services are running, disrupted, or planned?",
      radiusM: 800,
      accent: "#0f8d95",
      mapMode: "transport-reliability",
      panelMode: "transport",
      summary: "Line styles distinguish lower disruption signal, delayed, interrupted, planned, and inferred service threads.",
      caveat: "Service data may be partial or delayed; these are record/context signals, not timetable reliability measurements.",
      layers: [
        { id: "transport", label: "Roads (base)", color: "#0f8d95", categoryToggle: true },
        { id: "public_transport", label: "Public transport", color: "#248b94" },
        { id: "rail", label: "Rail", color: "#7a3b97" },
        { id: "cycle_network", label: "Cycle network", color: "#2d75b8" },
        { id: "parking", label: "Parking", color: "#4f8f50" },
        { id: "incidents", label: "Incidents", color: "#7f563d" },
      ],
      legend: [
        { label: "Lower disruption signal", color: "#248b94", shape: "line" },
        { label: "Higher delay signal", color: "#ef9c1a", shape: "outline" },
        { label: "Interrupted", color: "#ed3f2b", shape: "line" },
        { label: "Planned / record", color: "#7a3b97", shape: "outline" },
        { label: "Inferred / uncertain", color: "#898b8e", shape: "outline" },
      ],
    },
    {
      id: "planning-pressure",
      category: "built_environment",
      domain: "Planning & Built Lens",
      badge: "A",
      label: "Planning Activity",
      shortLabel: "Activity",
      title: "Planning activity field",
      description: "Where source-backed planning and built-environment records cluster for the selected year.",
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
        { id: "redevelopment", label: "Redevelopment records", color: "#b91f32" },
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
      label: "Built Change",
      shortLabel: "Built",
      title: "Urban-form delta map",
      description: "Mapped built-form and land-use context.",
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
        { label: "Higher mapped change signal", color: "#6f3a8f", shape: "polygon" },
        { label: "Lower mapped change signal", color: "#347b7f", shape: "polygon" },
        { label: "No data", color: "#b8b6a8", shape: "outline" },
      ],
    },
    {
      id: "planning-parcels",
      category: "built_environment",
      domain: "Planning & Built Lens",
      badge: "P",
      label: "Development Sites",
      shortLabel: "Sites",
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
        { id: "proposed", label: "Proposed", color: "#ee7477" },
        { id: "permitted", label: "Permitted", color: "#efb24d" },
        { id: "construction", label: "Under construction", color: "#7e68b8" },
        { id: "completed", label: "Completed", color: "#6f9c7b" },
        { id: "demolished", label: "Demolished", color: "#d9598e" },
        { id: "unknown", label: "Unknown / early", color: "#b8b6a8" },
      ],
      legend: [
        { label: "Proposed", color: "#ee7477", shape: "polygon" },
        { label: "Permitted", color: "#efb24d", shape: "polygon" },
        { label: "Under construction", color: "#7e68b8", shape: "polygon" },
        { label: "Completed", color: "#6f9c7b", shape: "polygon" },
        { label: "Demolished", color: "#d9598e", shape: "polygon" },
        { label: "Unknown / early", color: "#b8b6a8", shape: "outline" },
      ],
    },
    {
      id: "civic-access-gaps",
      category: "civic_services",
      domain: "Civic Services Lens",
      badge: "B",
      label: "Service Coverage Context",
      shortLabel: "Coverage",
      title: "Low-coverage guide seams",
      description: "Where source-backed service records and mapped anchors show lower coverage context.",
      radiusM: 1500,
      accent: "#e59f15",
      mapMode: "civic-gaps",
      panelMode: "civic",
      summary: "Street segments and coverage cells highlight places with low service density or longer access-route proxy.",
      caveat: "Access-proxy linework is mapped context only, not measured travel time or service capacity. OSM mapped visibility may differ from real-world service availability.",
      layers: [
        { id: "civic_services", label: "Transport network", color: "#0f8d95", categoryToggle: true },
        { id: "coverage", label: "Service coverage (walk/bus)", color: "#6daeb5" },
        { id: "gap_seams", label: "Low-coverage guide seams", color: "#ed4a2e" },
        { id: "facilities", label: "Civic services", color: "#74449a" },
        { id: "corridors", label: "Low-coverage corridors", color: "#ef8f21" },
        { id: "boundaries", label: "Boundaries", color: "#8c5b3a" },
      ],
      legend: [
        { label: "High low-coverage signal", color: "#ed4a2e", shape: "line" },
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
      label: "Service Catchments",
      shortLabel: "Catchments",
      title: "Service catchment cells",
      description: "Where civic-service records and mapped service context are present.",
      radiusM: 1500,
      accent: "#e5a91c",
      mapMode: "civic-catchment",
      panelMode: "civic",
      summary: "Generated catchment cells group nearby source-backed civic records by service type and mapped context signal.",
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
        { label: "Very high context signal", color: "#58a69f", shape: "polygon" },
        { label: "High context signal", color: "#a6c7a4", shape: "polygon" },
        { label: "Medium context signal", color: "#e6d690", shape: "polygon" },
        { label: "Low context signal", color: "#efb367", shape: "polygon" },
        { label: "Very low context signal", color: "#e68c70", shape: "polygon" },
      ],
    },
    {
      id: "civic-demand",
      category: "civic_services",
      domain: "Civic Services Lens",
      badge: "D",
      label: "Service Context",
      shortLabel: "Context",
      title: "Civic-service context grid",
      description: "Where civic-service context signals cluster and shift.",
      radiusM: 1500,
      accent: "#e5a91c",
      mapMode: "civic-demand",
      panelMode: "civic",
      summary: "A generated service-context grid blends civic evidence density with proximity to the selected event.",
      caveat: "This context grid uses observed records and mapped anchors; it is not a population, need, or capacity model.",
      layers: [
        { id: "civic_services", label: "Transport network", color: "#0f8d95", categoryToggle: true },
        { id: "facilities", label: "Service facilities", color: "#2a8aa2" },
        { id: "demand_grid", label: "Service-context grid", color: "#e5a91c" },
        { id: "displacement", label: "Context-shift traces", color: "#dc4a3b" },
        { id: "boundary", label: "Study boundary", color: "#75418d" },
        { id: "neighbourhoods", label: "Neighbourhoods", color: "#2a8a8d" },
      ],
      legend: [
        { label: "Very high context signal", color: "#cf3d4d", shape: "polygon" },
        { label: "High context signal", color: "#ed7c62", shape: "polygon" },
        { label: "Medium context signal", color: "#efc06d", shape: "polygon" },
        { label: "Low context signal", color: "#8fbfba", shape: "polygon" },
        { label: "Very low context signal", color: "#55a39d", shape: "polygon" },
      ],
    },
    {
      id: "economy-vitality",
      category: "economy",
      domain: "Economy Lens",
      badge: "V",
      label: "High Street Activity",
      shortLabel: "High Street",
      title: "High-street record ribbons",
      description: "Commercial street frontages are styled by source-backed activity records and mapped context. Ribbon thickness shows record density; notices show source-backed churn records.",
      radiusM: 800,
      accent: "#7b3a8f",
      mapMode: "economy-vitality",
      panelMode: "economy",
      summary: "Nearest frontage ribbons are styled by commercial activity records, openings, closures, and inferred context.",
      caveat: "Frontage ribbons reuse nearest mapped street geometry and are not measured footfall, spend, or vacancy.",
      layers: [
        { id: "economy", label: "High-street records", color: "#7b3a8f", categoryToggle: true },
        { id: "vacancy", label: "Vacancy-context records", color: "#ed3135" },
        { id: "footfall", label: "Footfall-context records", color: "#188a98" },
        { id: "spend", label: "Spend-context records", color: "#f0a51b" },
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
      summary: "Mapped context tiles show active retail, vacancy, office, hospitality, residential conversion, and other use signals where evidence is available.",
      caveat: "Land-use pulse cells mix mapped context with land-use-specific economy records where available; they are not authoritative parcel land-use classifications.",
      layers: [
        { id: "economy", label: "Land-use (current)", color: "#ca3b32", categoryToggle: true },
        { id: "change", label: "Before / current change", color: "#158c97" },
        { id: "activity_index", label: "Economic activity records", color: "#0f7888" },
        { id: "vacancy_index", label: "Vacancy-context records", color: "#db7772" },
        { id: "footfall_index", label: "Footfall-context records", color: "#f2b144" },
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
      label: "Economic Context Links",
      shortLabel: "Links",
      title: "Activity-anchor links",
      description: "Links between activity anchors and economic destinations.",
      radiusM: 1500,
      accent: "#7b3a8f",
      mapMode: "economy-gravity",
      panelMode: "economy",
      summary: "Flow arcs connect the selected event to nearby source-backed activity anchors and destination clusters.",
      caveat: "Link strength is a derived co-location signal, not measured visitor, pedestrian, spending, or job flow.",
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
      label: "Utility Context",
      shortLabel: "Context",
      title: "Utility context x-ray",
      description: "See where mapped utility context and work records cluster.",
      radiusM: 800,
      accent: "#6c4a82",
      mapMode: "utilities-capacity",
      panelMode: "utilities",
      summary: "Current OSM utility context, service records, and road-adjacent traces are colored as a descriptive network x-ray.",
      caveat: "Trace utility types are derived from nearby mapped assets and service context; this high-context styling is not engineering capacity data.",
      layers: [
        { id: "utilities", label: "Power", color: "#ef6b2a", categoryToggle: true, utilityType: "electricity" },
        { id: "water", label: "Water", color: "#2f85bd", utilityType: "water" },
        { id: "telecoms", label: "Telecoms", color: "#7a3b97", utilityType: "telecoms" },
        { id: "gas", label: "Gas", color: "#e2b42c", utilityType: "gas" },
        { id: "drainage", label: "Drainage", color: "#148a8d", utilityType: "drainage" },
        { id: "district_energy", label: "District energy", color: "#7a5438", utilityType: "district_energy" },
      ],
      legend: [
        { label: "Very high context signal", color: "#d62d35", shape: "line" },
        { label: "High context signal", color: "#ed6b35", shape: "line" },
        { label: "Medium context signal", color: "#e5b734", shape: "line" },
        { label: "Low context signal", color: "#438c64", shape: "line" },
        { label: "No data", color: "#888", shape: "outline" },
      ],
    },
    {
      id: "utilities-resilience",
      category: "utilities",
      domain: "Utilities Lens",
      badge: "R",
      label: "Utility Network Context",
      shortLabel: "Network",
      title: "Utility-context paths",
      description: "Trace mapped infrastructure routes, alternates, and possible context constraints.",
      radiusM: 1500,
      accent: "#e85b1f",
      mapMode: "utilities-resilience",
      panelMode: "utilities",
      summary: "Mapped, alternate, and inferred service paths are drawn from current OSM utility context plus dated records.",
      caveat: "Service paths and exposure areas are descriptive guides, not outage records or engineering capacity data; utility records may be partial.",
      layers: [
        { id: "utilities", label: "Water network", color: "#1787b3", categoryToggle: true, utilityType: "water" },
        { id: "power_network", label: "Power network", color: "#ef6b2a", utilityType: "electricity" },
        { id: "telecoms_network", label: "Telecoms network", color: "#7a3b97", utilityType: "telecoms" },
        { id: "gas_network", label: "Gas network", color: "#e2b42c", utilityType: "gas" },
        { id: "drainage_network", label: "Drainage network", color: "#148a8d", utilityType: "drainage" },
        { id: "district_energy", label: "District energy", color: "#7a5438", utilityType: "district_energy" },
      ],
      legend: [
        { label: "Mapped utility trace", color: "#1787b3", shape: "line" },
        { label: "Alternate mapped trace", color: "#1787b3", shape: "outline" },
        { label: "Inferred / planned", color: "#1787b3", shape: "outline" },
        { label: "Possible context constraint", color: "#d53236", shape: "diamond" },
        { label: "Context boundary", color: "#b93234", shape: "outline" },
      ],
    },
    {
      id: "utilities-works",
      category: "utilities",
      domain: "Utilities Lens",
      badge: "W",
      label: "Utility Works",
      shortLabel: "Works",
      title: "Maintenance and disruption timeline map",
      description: "What works are happening where and when?",
      radiusM: 800,
      accent: "#0f7d8a",
      mapMode: "utilities-works",
      panelMode: "utilities",
      summary: "Utility works are styled by source-reported planned work, repairs, failure/outage notices, permits, and reinstatement status where present.",
      caveat: "OSM mapped visibility and permit records may differ from real-world works dates.",
      layers: [
        { id: "utilities", label: "Utility works (all)", color: "#248b94", categoryToggle: true },
        { id: "planned", label: "Planned works", color: "#248b94" },
        { id: "repair", label: "Repair", color: "#e8a620" },
        { id: "failure", label: "Failure", color: "#cf3337" },
        { id: "permit", label: "Permit / consents", color: "#774a92" },
        { id: "reinstatement", label: "Reinstatement quality", color: "#4f8f50" },
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
  const LENS_GROUP_BY_CATEGORY = {
    built_environment: "planning",
    transport: "transport",
    civic_services: "civic",
    economy: "economy",
    utilities: "utilities",
  };
  const LENS_CATEGORY_BY_GROUP = {
    planning: "built_environment",
    transport: "transport",
    civic: "civic_services",
    economy: "economy",
    utilities: "utilities",
  };
  const LENS_GROUP_SIGNALS = {
    planning: new Set(["built_environment", "city_change"]),
    transport: new Set(["mobility", "traffic"]),
    civic: new Set(["civic_services", "services"]),
    economy: new Set(["economic_opportunity", "jobs", "economy"]),
    utilities: new Set(["utilities", "electricity"]),
  };
  const LENS_GROUP_PATTERNS = {
    planning: /planning|building|permit|zoning|development|architecture|heritage|housing|certificate|design_review|parcel_geometry|listed|brownfield|land[-_\s]?use/i,
    transport: /transport|transit|traffic|street_network|road|mta|tfl|translink|dft|dot|collisions|journey|bus|rail|cycle/i,
    civic: /civic|education|healthcare?|public_facilities|service_requests|cultural|libraries|public_housing|demographics|police|food hygiene|fire|school|hospital|clinic/i,
    economy: /economy|property|food|business|jobs|commercial|retail|valuation|sales|hpi|price|land registry|voa|companies|employment|floor.?space/i,
    utilities: /utilities|utility|energy|water|electric|power|street.?works|sewer|infrastructure|substation|network|flood/i,
  };
  const POINT_LENS_IDS = new Set(["transport", "built_environment", "civic_services", "economy", "utilities"]);
  const DETAIL_SOURCE_ID = "osm-detail";
  const DETAIL_LENS_LAYER_IDS = [
    "lens-built-footprints-fill",
    "lens-built-footprints-before",
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
    "civic-demand",
    "economy-gravity",
    "economy-vitality",
    "planning-delta",
    "planning-parcels",
    "planning-pressure",
    "utilities-capacity",
    "utilities-resilience",
    "utilities-works",
  ]);
  const LENS_GUIDE_LAYER_IDS = [
    "lens-guide-area-fill",
    "lens-guide-area-line",
    "lens-guide-cell-fill",
    "lens-guide-cell-line",
    "lens-guide-ring-line",
    "lens-guide-parcel-hatch",
    "lens-guide-coverage-flow-case",
    "lens-guide-coverage-flow",
    "lens-guide-flow-case",
    "lens-guide-flow",
    "lens-guide-flow-arrow",
    "lens-guide-works-type-symbol",
    "lens-guide-works-symbol",
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
    lensManifest: null,
    lensYearCoverage: null,
    lensYearCoverageByKey: new Map(),
    lensYearCoverageError: null,
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
    areaFilter: "",
    areaFilterTimelineLoading: false,
    search: "",
    searchResultActiveIndex: -1,
    eventListLimit: EVENT_LIST_BATCH_SIZE,
    loadedEvents: new Map(),           // year -> array of events
    loadingYears: new Map(),
    yearLoadErrors: new Map(),
    eventById: new Map(),
    manualYearOverride: null,
    manualLensOverride: null,
    manualAspectOverride: null,
    selectedEventId: null,
    selectedEvent: null,
    detailBeforeYear: null,
    detailCurrentYear: null,
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
    methodOpen: false,
    methodReturnFocus: null,
    welcomeOpen: false,
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
    transportRoadFeaturesByYear: new Map(),
    transportRoadFeatureLoadsByYear: new Map(),
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
    lensGuideSourceRefreshTimers: [],
    lensGuideLabelLayer: null,
    lensGuideLabelRaf: null,
  };

  const els = {};

  function isMobileViewport() {
    return Boolean(window.matchMedia?.("(max-width: 760px)").matches);
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function motionDuration(duration) {
    return prefersReducedMotion() ? 0 : duration;
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (isMobileViewport()) {
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
      "changelogToggle", "changelogPanel", "eventList", "eventListCount", "eventListMeta", "eventListMore", "eventListCollapseBtn",
      "exportCsvBtn", "exportGeojsonBtn",
      "compareBtn", "comparePanel", "compareClose", "compareBeforeYear", "compareAfterYear", "compareStats", "compareNote",
      "recenterBtn", "tiltBtn",
      "methodBtn", "shareBtn", "themeBtn",
      "mapStudyChip", "mapStudyChipText",
      "layersPanel", "layersList", "layersCount", "lensSwitcher", "lensAspectSwitcher", "lensLegend", "lensDataState",
      "activeLensCard", "activeLensIcon", "activeLensDomain", "activeLensTitle", "activeLensDescription",
      "confidenceFilter", "areaFilterInput", "areaFilterOptions", "showInferredToggle", "coverageNote",
      "detailPanel", "detailEmpty", "detailInner", "emptyCityName",
      "methodOverlay", "methodClose", "methodDatasetTable", "methodCities",
      "tlYear", "prevYearBtn", "nextYearBtn", "tlVisible", "tlTotal", "tlCity", "tlLayers",
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
      updateCityChrome();
    });
    const closeCityMenu = () => {
      els.cityMenu?.setAttribute("hidden", "");
      updateCityChrome();
    };
    els.cityToggle?.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      closeCityMenu();
    });
    els.cityMenu?.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      closeCityMenu();
      els.cityToggle?.focus();
    });
    document.addEventListener("click", () => {
      closeCityMenu();
    });
    els.cityMenu?.addEventListener("click", (e) => e.stopPropagation());

    // Search
    els.searchInput?.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      state.searchResultActiveIndex = -1;
      renderSearchResults();
      resetEventListLimit();
      renderEventList();
      syncTopline();
      updateTimeDependentMapState();
      renderMarkers();
    });
    els.searchInput?.setAttribute("role", "combobox");
    els.searchInput?.setAttribute("aria-autocomplete", "list");
    els.searchInput?.setAttribute("aria-controls", "searchResults");
    els.searchInput?.setAttribute("aria-expanded", "false");
    els.searchResults?.setAttribute("role", "listbox");
    els.searchInput?.addEventListener("focus", () => renderSearchResults());
    els.searchInput?.addEventListener("keydown", handleSearchInputKeydown);
    els.searchInput?.addEventListener("blur", () => {
      setTimeout(() => {
        if (!searchHasFocus()) hideSearchResults();
      }, 160);
    });
    els.searchResults?.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!searchHasFocus()) hideSearchResults();
      }, 160);
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
    els.areaFilterInput?.addEventListener("input", async () => {
      state.areaFilter = cleanAreaFilter(els.areaFilterInput.value);
      resetEventListLimit();
      ensureAreaFilterTimelineLoaded();
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
    els.methodOverlay?.addEventListener("keydown", handleMethodOverlayKeydown);

    // Restored atlas controls
    els.changelogToggle?.addEventListener("click", () => setChangelogOpen(!state.changelogOpen));
    els.eventListCollapseBtn?.addEventListener("click", () => setChangelogOpen(false));
    els.eventListMore?.addEventListener("click", () => {
      state.eventListLimit += EVENT_LIST_BATCH_SIZE;
      renderEventList();
    });
    els.prevYearBtn?.addEventListener("click", () => {
      setYear(Math.max(state.yearRange[0], state.year - 1));
    });
    els.nextYearBtn?.addEventListener("click", () => {
      setYear(Math.min(state.yearRange[1], state.year + 1));
    });
    els.exportCsvBtn?.addEventListener("click", () => exportFilteredCsv());
    els.exportGeojsonBtn?.addEventListener("click", () => exportFilteredGeojson());
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
      state.areaFilter ? url.searchParams.set("area", state.areaFilter) : url.searchParams.delete("area");
      state.search ? url.searchParams.set("q", state.search) : url.searchParams.delete("q");
      state.confidenceFilter !== "all" ? url.searchParams.set("confidence", state.confidenceFilter) : url.searchParams.delete("confidence");
      state.showInferred ? url.searchParams.delete("inferred") : url.searchParams.set("inferred", "0");
      await copyText(url.toString(), "Permalink copied - view shared with city, year, lens, and filters");
    });

    // Theme
    els.themeBtn?.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", state.theme);
    });

    // Welcome
    els.welcomeStart?.addEventListener("click", () => setWelcomeOpen(false));
    els.welcomeSkip?.addEventListener("click", () => setWelcomeOpen(false));

    // Timeline play
    els.playBtn?.addEventListener("click", togglePlay);

    // Timeline scrub
    let scrubbing = false;
    const scrubFromEvent = (e) => {
      const track = e.currentTarget || els.tlScrub || els.tlTrack;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (!rect.width) return;
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
    els.tlScrub?.addEventListener("keydown", (e) => {
      const [yStart, yEnd] = state.yearRange;
      let next = state.year;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(yEnd, state.year + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(yStart, state.year - 1);
      else if (e.key === "PageUp") next = Math.min(yEnd, state.year + 5);
      else if (e.key === "PageDown") next = Math.max(yStart, state.year - 5);
      else if (e.key === "Home") next = yStart;
      else if (e.key === "End") next = yEnd;
      else return;
      e.preventDefault();
      stopPlay();
      setYear(next);
    });

    // Keyboard
    document.addEventListener("keydown", (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowRight") setYear(Math.min(state.yearRange[1], state.year + 1));
      else if (e.key === "ArrowLeft") setYear(Math.max(state.yearRange[0], state.year - 1));
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "/") { e.preventDefault(); els.searchInput?.focus(); }
      else if (e.key === "Escape") {
        if (state.methodOpen) setMethodOpen(false);
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
    state.manualYearOverride = null;
    state.manualLensOverride = null;
    state.manualAspectOverride = null;
    if (!state.cityMeta) throw new Error(`City not found: ${cityId}`);

    setAppStatus(`Loading ${shortCityName(state.cityMeta.display_name)}…`);

    const paths = state.cityMeta.artifact_paths || {};
    const [cityDoc, eventsIndex, sourcesDoc, availabilityDoc, lensManifestDoc, lensYearCoverageDoc] = await Promise.all([
      fetchJson(dataPathToUrl(paths.city)),
      fetchJson(dataPathToUrl(paths.events)),
      fetchJson(dataPathToUrl(paths.sources)),
      paths.availability
        ? fetchJson(dataPathToUrl(paths.availability)).catch((error) => ({ __error: error }))
        : Promise.resolve(null),
      paths.lens_manifest
        ? fetchJson(dataPathToUrl(paths.lens_manifest)).catch((error) => ({ __error: error }))
        : Promise.resolve(null),
      paths.lens_year_coverage
        ? fetchJson(dataPathToUrl(paths.lens_year_coverage)).catch((error) => ({ __error: error }))
        : Promise.resolve(null),
    ]);

    state.city = cityDoc;
    state.eventsIndex = eventsIndex;
    state.availability = availabilityDoc && !availabilityDoc.__error ? availabilityDoc : null;
    state.availabilityError = availabilityDoc?.__error?.message || null;
    state.lensManifest = lensManifestDoc && !lensManifestDoc.__error ? lensManifestDoc : null;
    state.lensYearCoverage = lensYearCoverageDoc && !lensYearCoverageDoc.__error ? lensYearCoverageDoc : null;
    state.lensYearCoverageError = lensYearCoverageDoc?.__error?.message || null;
    state.lensYearCoverageByKey = new Map((state.lensYearCoverage?.rows || []).map((row) => [`${row.lens_slug}:${Number(row.year)}`, row]));
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
    if (state.manualAspectOverride && LENS_ASPECT_BY_ID.has(state.manualAspectOverride)) {
      state.activeAspect = state.manualAspectOverride;
      state.activeLens = LENS_ASPECT_BY_ID.get(state.manualAspectOverride).category || state.activeLens;
    } else if (state.manualLensOverride && MAP_LENS_BY_ID.has(state.manualLensOverride)) {
      state.activeLens = state.manualLensOverride;
      state.activeAspect = defaultAspectForCategory(state.activeLens);
    }
    const desiredYear = Number(params.get("year"));
    if (Number.isFinite(desiredYear) && state.years.includes(desiredYear)) {
      state.year = desiredYear;
    } else if (state.years.includes(DEFAULT_YEAR)) {
      state.year = DEFAULT_YEAR;
    } else {
      state.year = state.years[state.years.length - 1] || DEFAULT_YEAR;
    }
    const requestedArea = cleanAreaFilter(params.get("area") || "");
    const requestedConfidence = String(params.get("confidence") || "all");
    const requestedSearch = cleanSummary(params.get("q") || "");
    state.areaFilter = requestedArea;
    state.confidenceFilter = ["all", "documented", "corroborated", "inferred", "disputed"].includes(requestedConfidence)
      ? requestedConfidence
      : "all";
    state.showInferred = params.get("inferred") !== "0";
    state.search = requestedSearch;

    state.loadedEvents.clear();
    state.loadingYears.clear();
    state.yearLoadErrors.clear();
    state.eventById.clear();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.detailBeforeYear = null;
    state.detailCurrentYear = null;
    state.detailRadiusM = null;
    state.pendingCameraFocusEventId = null;
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
    state.transportRoadBasePathLoaded = null;
    state.transportRoadYearPathLoaded = null;
    state.transportRoadYearLoaded = null;
    state.transportRoadFeatureCountPathLoaded = null;
    state.transportRoadFeatureCountYearLoaded = null;
    state.transportRoadFeatureCount = null;
    state.transportRoadFeaturesPathLoaded = null;
    state.transportRoadFeatures = [];
    state.transportRoadFeaturesByYear.clear();
    state.transportRoadFeatureLoadsByYear.clear();
    if (els.searchInput) els.searchInput.value = state.search;
    if (els.areaFilterInput) els.areaFilterInput.value = state.areaFilter;
    if (els.confidenceFilter) els.confidenceFilter.value = state.confidenceFilter;
    if (els.showInferredToggle) els.showInferredToggle.checked = state.showInferred;

    setText(els.cityNameLabel, shortCityName(state.city.display_name));
    setText(els.welcomeCity, shortCityName(state.city.display_name));
    setText(els.emptyCityName, shortCityName(state.city.display_name));
    setText(els.tlCity, shortCityName(state.city.display_name));
    updateCityChrome();

    renderCityMenu();
    renderAll();
    initOrUpdateMap();

    // Preload current year for snappier first interaction
    await loadYear(state.year);
    await loadLensYearsForTimeline(state.year);
    const manualYear = Number(state.manualYearOverride);
    if (Number.isFinite(manualYear) && state.years.includes(manualYear) && manualYear !== state.year) {
      state.year = manualYear;
      state.compareAfterYear = manualYear;
      setText(els.tlYear, String(manualYear));
      await loadYear(manualYear);
      await loadLensYearsForTimeline(manualYear);
    }
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    setAppStatus("");
    if (requestedEventId) {
      await selectEvent(requestedEventId, { silent: true });
    }
    if (!state.selectedEvent) await selectFirstVisibleEvent({ keepCamera: true });
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
      subtitle: cleanSummary(props.subtitle || ""),
      details: cleanSummary(props.details || props.explanation || props.summary || ""),
      shortDescription: cleanSummary(props.short_description || props.summary || props.explanation || ""),
      year: Number(props.year || fallbackYear),
      effectiveDate: props.effective_date || "",
      effectiveDateRange: props.effective_date_range || null,
      datePrecision: props.date_precision || "",
      sourceDateField: props.source_date_field || "",
      category: props.category || "built_environment",
      lens: props.lens || props.category || "city_change",
      confidence: props.confidence || "documented",
      summary: cleanSummary(props.explanation || props.summary || props.details || ""),
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
    event.areaSearchText = areaSearchTextForEvent(event);
    return event;
  }

  function eventSubtitleLine(event) {
    return event?.subtitle || `${event?.title || "Selected event"} / ${event?.effectiveDate || String(event?.year || "")}`;
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
      if (!fitMapToCity(0)) {
        state.map.jumpTo({ center, zoom, pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0 });
      }
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
            "raster-saturation": -0.18,
            "raster-contrast": 0.02,
            "raster-brightness-min": 0.82,
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
      fitMapToCity(0);
      updateTimeDependentMapState();
      renderMapStudyChip();
      renderMarkers();
      focusPendingCameraEvent(0);
    };
    state.map.on("load", onReady);
    state.map.once("idle", onReady);
    state.map.on("move", scheduleLensGuideLabelRender);
    state.map.on("zoom", scheduleLensGuideLabelRender);
    state.map.on("resize", scheduleLensGuideLabelRender);
    state.map.on("moveend", () => {
      renderMapStudyChip();
      renderMarkers();
    });
    try { state.map.triggerRepaint(); } catch (_e) { /* not yet ready */ }
  }

  function mapCenter() {
    const center = state.city?.default_center;
    if (Array.isArray(center) && center.length === 2) return center;
    return [-5.9301, 54.5973];
  }

  function currentMapCenter() {
    const center = state.map?.getCenter?.();
    const lng = Number(center?.lng);
    const lat = Number(center?.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    return mapCenter();
  }

  function cityBoundsValues() {
    const values = Array.isArray(state.city?.bounds) ? state.city.bounds.map(Number) : [];
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
    const [west, south, east, north] = values;
    if (east <= west || north <= south) return null;
    return { west, south, east, north, array: [west, south, east, north] };
  }

  function cityBoundsPadding() {
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    if (width <= 760) return { top: 128, right: 18, bottom: 312, left: 18 };
    if (width <= 1100) return { top: 116, right: 380, bottom: 210, left: 280 };
    const panelRect = (selector) => {
      const el = document.querySelector(selector);
      if (!el || el.hidden || el.getAttribute("data-open") === "false") return null;
      const styles = window.getComputedStyle(el);
      if (styles.display === "none" || styles.visibility === "hidden") return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return rect;
    };
    const topbar = panelRect(".topbar");
    const timeline = panelRect(".timeline");
    const layers = panelRect(".layers");
    const changelog = panelRect(".changelog");
    const detail = panelRect(".detail");
    let left = Math.max(316, Math.ceil(Math.max(layers?.right || 0, changelog?.right || 0) + 16));
    let right = Math.max(420, detail ? Math.ceil(width - detail.left + 16) : 420);
    const top = Math.max(96, topbar ? Math.ceil(topbar.bottom + 16) : 116);
    const bottom = Math.max(208, timeline ? Math.ceil(height - timeline.top + 16) : 218);
    const minMapWidth = Math.max(260, Math.min(360, width * 0.22));
    const maxHorizontalPadding = Math.max(220, width - minMapWidth);
    if (left + right > maxHorizontalPadding) {
      const scale = maxHorizontalPadding / (left + right);
      left = Math.max(280, Math.floor(left * scale));
      right = Math.max(340, Math.floor(right * scale));
    }
    return { top, right, bottom, left };
  }

  function fitMapToCity(duration = 0) {
    if (!state.map) return false;
    const bounds = cityBoundsValues();
    if (!bounds) return false;
    const padding = cityBoundsPadding();
    const camera = typeof state.map.cameraForBounds === "function"
      ? state.map.cameraForBounds(bounds.array, { padding, maxZoom: CITY_OVERVIEW_MAX_ZOOM })
      : null;
    const pitch = state.mapTilted ? 48 : 0;
    const bearing = state.mapTilted ? -10 : 0;
    state.map.stop?.();
    if (camera?.center && Number.isFinite(Number(camera.zoom))) {
      const next = { center: camera.center, zoom: Math.min(Number(camera.zoom), CITY_OVERVIEW_MAX_ZOOM), pitch, bearing };
      const effectiveDuration = motionDuration(duration);
      if (effectiveDuration > 0) {
        state.map.easeTo({ ...next, duration: effectiveDuration });
      } else {
        state.map.jumpTo(next);
      }
      return true;
    }
    if (typeof state.map.fitBounds === "function") {
      state.map.fitBounds(bounds.array, { padding, maxZoom: CITY_OVERVIEW_MAX_ZOOM, duration: motionDuration(duration), pitch, bearing });
      return true;
    }
    return false;
  }

  function mapBoundsValues() {
    if (!state.map || typeof state.map.getBounds !== "function") return null;
    const bounds = state.map.getBounds();
    if (!bounds) return null;
    const west = Number(bounds.getWest?.());
    const south = Number(bounds.getSouth?.());
    const east = Number(bounds.getEast?.());
    const north = Number(bounds.getNorth?.());
    if ([west, south, east, north].some((value) => !Number.isFinite(value))) return null;
    return { west, south, east, north };
  }

  function citywideOverviewActive() {
    if (!state.map || state.search || state.areaFilter) return false;
    const city = cityBoundsValues();
    const visible = mapBoundsValues();
    if (!city || !visible) return false;
    const containsCity = visible.west <= city.west && visible.east >= city.east
      && visible.south <= city.south && visible.north >= city.north;
    if (containsCity) return true;
    const overlapWidth = Math.max(0, Math.min(visible.east, city.east) - Math.max(visible.west, city.west));
    const overlapHeight = Math.max(0, Math.min(visible.north, city.north) - Math.max(visible.south, city.south));
    const widthCoverage = overlapWidth / Math.max(0.000001, city.east - city.west);
    const heightCoverage = overlapHeight / Math.max(0.000001, city.north - city.south);
    const zoom = Number(state.map.getZoom?.());
    return Number.isFinite(zoom)
      && zoom <= CITY_OVERVIEW_MAX_ZOOM + 0.25
      && widthCoverage >= 0.68
      && heightCoverage >= 0.68;
  }

  function shouldPreferCitywideLensCamera() {
    if (!state.map || state.search || state.areaFilter) return false;
    return !state.selectedEvent || citywideOverviewActive();
  }

  function eventWithinCityBounds(event, bounds = cityBoundsValues()) {
    if (!bounds || !event?.lngLat) return Boolean(event?.lngLat);
    const [lng, lat] = event.lngLat.map(Number);
    return Number.isFinite(lng) && Number.isFinite(lat)
      && lng >= bounds.west && lng <= bounds.east
      && lat >= bounds.south && lat <= bounds.north;
  }

  function citywideEventScore(event) {
    const selectedBoost = event.id === state.selectedEventId ? 10000 : 0;
    const confidenceBoost = confidenceRank(event.confidence) * 100;
    const sourceBoost = Math.min(8, eventSourceCount(event)) * 8;
    const recencyBoost = Math.max(0, Number(event.year || 0) - 1800) / 20;
    return selectedBoost + confidenceBoost + sourceBoost + recencyBoost + stableUnit(event.id) * 2;
  }

  function stratifiedCityEvents(events, limit = MAX_MARKERS) {
    const bounds = cityBoundsValues();
    const points = (events || []).filter((event) => event?.lngLat && eventWithinCityBounds(event, bounds));
    if (!points.length || limit <= 0) return [];
    if (!bounds) {
      return points
        .slice()
        .sort((a, b) => citywideEventScore(b) - citywideEventScore(a))
        .slice(0, limit);
    }
    const cols = Math.max(4, Math.min(12, Math.ceil(Math.sqrt(limit) * 1.2)));
    const rows = Math.max(3, Math.min(10, Math.ceil(cols * ((bounds.north - bounds.south) / Math.max(0.000001, bounds.east - bounds.west)))));
    const cells = new Map();
    for (const event of points) {
      const [lng, lat] = event.lngLat.map(Number);
      const x = clamp01((lng - bounds.west) / Math.max(0.000001, bounds.east - bounds.west));
      const y = clamp01((lat - bounds.south) / Math.max(0.000001, bounds.north - bounds.south));
      const col = Math.min(cols - 1, Math.floor(x * cols));
      const row = Math.min(rows - 1, Math.floor(y * rows));
      const key = `${row}:${col}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(event);
    }
    const cellQueues = [...cells.values()]
      .map((cell) => cell.sort((a, b) => citywideEventScore(b) - citywideEventScore(a)))
      .sort((a, b) => citywideEventScore(b[0]) - citywideEventScore(a[0]));
    const result = [];
    while (result.length < limit && cellQueues.some((cell) => cell.length)) {
      for (const cell of cellQueues) {
        const event = cell.shift();
        if (event) result.push(event);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  function renderMarkers() {
    if (!state.map) return;
    const selected = state.selectedEvent?.lngLat ? state.selectedEvent : null;
    const center = currentMapCenter();
    const eventsForFilters = filteredEvents();
    const citywide = citywideOverviewActive();
    const localVisibleEvents = citywide
      ? stratifiedCityEvents(eventsForFilters.filter((event) => event.lngLat && event.confidence !== "inferred"), Math.max(24, Math.floor(MAX_MARKERS / 2)))
      : eventsForFilters
      .filter((event) => event.lngLat && event.confidence !== "inferred")
      .map((event) => ({ event, distance: lngLatDistanceMeters(center, event.lngLat) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 18)
      .map((item) => item.event);
    const leadingActiveEvents = citywide
      ? stratifiedCityEvents(eventsForFilters.filter((event) => event.lngLat && event.category === state.activeLens && event.confidence !== "inferred"), Math.max(18, Math.floor(MAX_MARKERS / 3)))
      : eventsForFilters
      .filter((event) => event.lngLat && event.category === state.activeLens && event.confidence !== "inferred")
      .slice(0, Math.max(12, Math.floor(MAX_MARKERS / 3)));
    const scopedEvents = POINT_LENS_IDS.has(state.activeLens)
      ? lensPointEventsForActiveLens()
      : eventsForFilters.filter((event) => event.lngLat);
    const guideDominantAspect = ["civic-access-gaps", "civic-catchment", "civic-demand", "economy-vitality", "economy-gravity", "utilities-capacity"].includes(activeMapLens()?.id);
    const markerCandidates = selected && guideDominantAspect && !citywide
      ? [selected]
      : selected
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
        el.dataset.active = String(event.id === state.selectedEventId);
        el.dataset.eventId = event.id;
        const pin = el.querySelector(".pin");
        if (pin) {
          pin.style.setProperty("--accent", markerAccent(event));
          pin.dataset.lens = markerLensToken(event);
          pin.dataset.eventId = event.id;
        }
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
      el.dataset.active = String(event.id === state.selectedEventId);
      el.dataset.eventId = event.id;
      el.innerHTML = `
        <div class="pin" data-active="${event.id === state.selectedEventId}" data-event-id="${escapeAttr(event.id)}" data-lens="${escapeAttr(markerLensToken(event))}" style="--accent:${escapeAttr(markerAccent(event, layer))}" role="button" tabindex="0" aria-pressed="${event.id === state.selectedEventId}" aria-label="${escapeAttr(`${event.title}, ${event.year}`)}">
          <div class="pin-label">${escapeHtml(truncate(event.title, 60))} · ${event.year}</div>
        </div>`;
      const selectMarker = (domEvent) => {
        domEvent?.preventDefault?.();
        domEvent?.stopPropagation?.();
        const id = el.dataset.eventId || event.id;
        selectEvent(id);
      };
      el.addEventListener("click", selectMarker);
      addPressHandler(el.querySelector(".pin"), selectMarker);
      const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(event.lngLat)
        .addTo(state.map);
      state.markers.set(event.id, marker);
    }
  }

  function markerZIndex(event) {
    if (event.id === state.selectedEventId) return "120";
    const categoryBoost = event.category === state.activeLens ? 34 : 0;
    let base = 25;
    if (event.confidence === "corroborated") base = 50;
    else if (event.confidence === "documented") base = 45;
    else if (event.confidence === "disputed") base = 35;
    return String(base + categoryBoost);
  }

  function markerAccent(event, fallbackLayer = null) {
    if (event?.id === state.selectedEventId) {
      const lens = activeMapLens();
      if (lens?.id === "economy-vitality") return lens.accent || "#7b3a8f";
      if (["civic-catchment", "civic-demand"].includes(lens?.id)) return "#0f8d95";
      return LAYER_BY_ID.get(event?.category)?.color || lens?.accent || "#1b7a85";
    }
    return fallbackLayer?.color || LAYER_BY_ID.get(event?.category)?.color || "#1b7a85";
  }

  function markerLensToken(event) {
    return event?.id === state.selectedEventId ? activeMapLens()?.id || "" : "";
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
    if (lens.id === "utilities-capacity") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderUtilityCapacityMapLegend(lens);
      return;
    }
    if (lens.id === "planning-pressure") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderPlanningPressureMapLegend(lens);
      return;
    }
    if (lens.id === "planning-delta") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderPlanningDeltaMapLegend(lens);
      return;
    }
    if (lens.id === "planning-parcels") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderPlanningParcelsMapLegend(lens);
      return;
    }
    if (lens.id === "civic-access-gaps") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderCivicAccessGapsMapLegend(lens);
      return;
    }
    if (lens.id === "civic-catchment") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderCivicCatchmentMapLegend(lens);
      return;
    }
    if (lens.id === "civic-demand") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderCivicDemandMapLegend(lens);
      return;
    }
    if (lens.id === "economy-vitality") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderEconomyVitalityMapLegend(lens);
      return;
    }
    if (lens.id === "utilities-resilience") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderUtilityResilienceMapLegend(lens);
      return;
    }
    if (lens.id === "utilities-works") {
      layer.removeAttribute("hidden");
      layer.innerHTML = renderUtilityWorksMapLegend(lens);
      return;
    }
    const features = state.lensGuideFeatureCache?.features || [];
    const nodes = features
      .filter((feature) => {
        const props = feature.properties || {};
        if (["civic-access-gaps", "civic-catchment", "economy-gravity", "economy-vitality", "planning-pressure"].includes(lens.id) && props.sublayer_id && !activeSublayerIdsForLens(lens).includes(props.sublayer_id)) return false;
        if (["economy-vitality", "economy-gravity"].includes(lens.id) && props.node_style === "detail") return false;
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
    const centerPx = state.map.project(state.selectedEvent?.lngLat || currentMapCenter());
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
      const gravityCallout = lens.id === "economy-gravity";
      const width = gravityCallout
        ? Math.min(188, Math.max(126, label.length * 6.25 + 58))
        : Math.min(154, Math.max(92, label.length * 6.1 + 42));
      const height = gravityCallout ? (detail ? 46 : 36) : detail ? 42 : 30;
      const anchor = chooseGuideLabelAnchor(point, centerPx, width, height, usable, placed, exclusions);
      if (!anchor) continue;
      const rect = guideLabelRect(point, anchor, width, height);
      const symbol = lensGuideLabelSymbol(lens, props);
      placed.push(rect);
      html.push(`
        <button class="lens-guide-label" type="button" data-anchor="${anchor}" data-lens="${escapeAttr(lens.id)}" data-sublayer-id="${escapeAttr(props.sublayer_id || "")}" data-event-id="${escapeAttr(props.event_id || "")}" data-source-id="${escapeAttr(props.source_id || "")}" style="--accent:${escapeAttr(props.color || lens.accent || "#1b7a85")};left:${Math.round(point.x)}px;top:${Math.round(point.y)}px;width:${Math.round(width)}px" aria-label="${escapeAttr(`${label}${detail ? `, ${detail}` : ""}`)}">
          <span class="lens-guide-label-mark" data-symbol="${escapeAttr(symbol)}" aria-hidden="true"></span>
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

  function lensGuideLabelSymbol(lens, props = {}) {
    if (lens?.id === "economy-gravity") {
      return {
        economy: "R",
        office: "O",
        hospitality: "H",
        visitor: "V",
        night: "N",
        markets: "M",
      }[props.sublayer_id] || "R";
    }
    return "";
  }

  function renderEconomyVitalityMapLegend(lens) {
    return `
      <aside class="vitality-map-legend" aria-label="Vitality legend">
        ${renderEconomyVitalityLegend(lens, lensStatusText(lens))}
      </aside>
    `;
  }

  function renderCivicAccessGapsMapLegend(lens) {
    return `
      <aside class="access-gap-map-legend" aria-label="Access gap seams legend">
        ${renderCivicAccessGapsLegend(lens, lensStatusText(lens))}
      </aside>
    `;
  }

  function renderCivicCatchmentMapLegend(lens) {
    return `
      <aside class="catchment-map-legend" aria-label="Catchment context legend">
        ${renderCivicCatchmentLegend(lens, lensStatusText(lens))}
      </aside>
    `;
  }

  function renderCivicDemandMapLegend(lens) {
    const status = lensStatusText(lens);
    return `
      <aside class="demand-map-legend" aria-label="Service-context legend">
        <div class="demand-legend-card">
          <div class="vitality-legend-title">
            <strong>Service context</strong>
            <span>${escapeHtml(status.label)}</span>
          </div>
          <div class="vitality-levels">
            ${lens.legend.map((item) => `
              <div><i style="--vitality-color:${escapeAttr(item.color)}"></i><span>${escapeHtml(item.label)}</span></div>
            `).join("")}
            <div><i class="hatched"></i><span>Inferred (low confidence)</span></div>
            <div><i class="muted"></i><span>No data / low evidence</span></div>
          </div>
          <div class="vitality-legend-section">
            <strong>Context-flow guide</strong>
            <div class="demand-arrow-row"><i></i><span>After selected event</span></div>
          </div>
          <div class="pressure-study-line"><i></i><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
          ${renderLensLegendNote(status, lens, "Service-context cells combine source-backed civic records, current mapped service anchors, and nearby change context; it is not a population forecast or causal estimate.")}
        </div>
      </aside>
    `;
  }

  function renderUtilityCapacityMapLegend(lens) {
    const status = lensStatusText(lens);
    const typeRows = lens.layers.map((layer) => {
      const type = layer.utilityType || (layer.id === "utilities" ? "electricity" : layer.id);
      return `
        <div class="utility-map-legend-row">
          <i class="utility-map-line" style="--utility-color:${escapeAttr(layer.color)}"></i>
          <span>${escapeHtml(utilityCapacityLegendLabel(type))}</span>
        </div>
      `;
    }).join("");
    const assetCount = (state.utilityNetworkFeatures || [])
      .filter((feature) => feature.properties?.network_geometry === "asset")
      .length;
    return `
      <aside class="utility-map-legend" aria-label="Utilities legend">
        <strong>Utilities legend</strong>
        <section>
          <span>Network (by utility)</span>
          ${typeRows}
        </section>
        <section>
          <span>Utility context signal (current)</span>
          <div class="utility-risk-row"><i style="--risk-color:#d62d35"></i><b>Very high context signal</b></div>
          <div class="utility-risk-row"><i style="--risk-color:#ef6b35"></i><b>High context signal</b></div>
          <div class="utility-risk-row"><i style="--risk-color:#e2b42c"></i><b>Medium context signal</b></div>
          <div class="utility-risk-row"><i style="--risk-color:#438c64"></i><b>Low context signal</b></div>
          <div class="utility-risk-row muted"><i></i><b>No data</b></div>
        </section>
        <section>
          <span>Asset nodes${assetCount ? ` (${compactNumber(assetCount)})` : ""}</span>
          <div class="utility-asset-row"><i data-symbol="S"></i><b>Substation</b></div>
          <div class="utility-asset-row"><i data-symbol="C"></i><b>Cabinet / exchange</b></div>
          <div class="utility-asset-row"><i data-symbol="P"></i><b>Pump station</b></div>
          <div class="utility-asset-row"><i data-symbol="M"></i><b>Manhole / chamber</b></div>
          <div class="utility-asset-row"><i data-symbol="V"></i><b>Valve</b></div>
        </section>
        ${renderLensLegendNote(status, lens, "Current mapped utility context may post-date the selected year and is not engineering capacity data.")}
      </aside>
    `;
  }

  function renderPlanningPressureMapLegend(lens) {
    return `
      <aside class="planning-map-legend planning-map-legend--pressure" aria-label="Planning-pressure legend">
        ${renderPlanningPressureLegend(lens, lensStatusText(lens))}
      </aside>
    `;
  }

  function renderPlanningDeltaMapLegend(lens) {
    const status = lensStatusText(lens);
    return `
      <aside class="planning-map-legend planning-map-legend--delta" aria-label="Urban-form delta legend">
        <div class="planning-legend-card">
          <div class="pressure-legend-title">
            <strong>Delta legend</strong>
            <span>${escapeHtml(status.label)}</span>
          </div>
          <div class="planning-legend-section">
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#d84a2d"></i><span>Current footprint</span></div>
            <div class="planning-symbol-row"><i class="planning-outline" style="--planning-color:#cf6a57"></i><span>Before footprint</span></div>
          </div>
          <div class="planning-legend-section">
            <span>Built-form signal</span>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#d8583f"></i><span>Higher-intensity signal</span></div>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#d99175"></i><span>Growth signal</span></div>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#9b8fb4"></i><span>Mixed / low signal</span></div>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#7aa3a6"></i><span>Loss/removal signal</span></div>
            <div class="planning-symbol-row"><i class="planning-empty"></i><span>No data</span></div>
          </div>
          <div class="planning-legend-section">
            <span>Land-use change</span>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#d8583f"></i><span>Increase in density</span></div>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#e7b454"></i><span>Change in use</span></div>
            <div class="planning-symbol-row"><i class="planning-fill" style="--planning-color:#8f9494"></i><span>Demolition / loss</span></div>
          </div>
          ${renderLensLegendNote(status, lens, "Mapped footprint context is descriptive and is not measured construction volume.")}
        </div>
      </aside>
    `;
  }

  function renderPlanningParcelsMapLegend(lens) {
    const status = lensStatusText(lens);
    return `
      <aside class="planning-map-legend planning-map-legend--parcels" aria-label="Parcel-stage legend">
        <div class="planning-legend-card">
          <div class="pressure-legend-title">
            <strong>Parcel stage (Lifecycle)</strong>
            <span>${escapeHtml(status.label)}</span>
          </div>
          <div class="planning-legend-section">
            ${lens.legend.map((item) => `
              <div class="planning-symbol-row"><i class="${item.shape === "outline" ? "planning-outline planning-hatch" : "planning-fill"}" style="--planning-color:${escapeAttr(item.color)}"></i><span>${escapeHtml(item.label)}</span></div>
            `).join("")}
          </div>
          <div class="planning-legend-section">
            <span>Uncertainty (inferred)</span>
            <div class="planning-symbol-row"><i class="planning-hatch"></i><span>High uncertainty</span></div>
            <div class="planning-symbol-row"><i class="planning-hatch planning-hatch-muted"></i><span>Medium uncertainty</span></div>
          </div>
          <div class="planning-legend-section">
            <span>Project scale (by outline)</span>
            <div class="planning-line-row"><i class="minor"></i><span>Minor</span></div>
            <div class="planning-line-row"><i class="major"></i><span>Major</span></div>
            <div class="planning-line-row"><i class="strategic"></i><span>Strategic</span></div>
          </div>
          <div class="pressure-study-line"><i></i><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
          ${renderLensLegendNote(status, lens, "Parcel-stage cells are source-backed where records exist; inferred context remains labelled.")}
        </div>
      </aside>
    `;
  }

  function renderUtilityResilienceMapLegend(lens) {
    const status = lensStatusText(lens);
    const outageCount = (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => feature.properties?.lens_id === lens.id && feature.properties?.cell_style === "surface_cell")
      .length;
    const nodeCount = (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => feature.properties?.lens_id === lens.id && feature.properties?.node_style === "utility_trace")
      .length;
    return `
      <aside class="utility-map-legend utility-map-legend--resilience" aria-label="Utility context legend">
        <strong>Utility context legend</strong>
        <section>
          <span>Route type</span>
          <div class="utility-route-row"><i class="primary"></i><b>Primary mapped path</b></div>
          <div class="utility-route-row"><i class="backup"></i><b>Alternate mapped path</b></div>
          <div class="utility-route-row"><i class="inferred"></i><b>Inferred / planned</b></div>
          <div class="utility-route-row"><i class="retired"></i><b>Decommissioned</b></div>
        </section>
        <section>
          <span>Infrastructure${nodeCount ? ` (${compactNumber(nodeCount)})` : ""}</span>
          <div class="utility-symbol-row"><i data-symbol="X"></i><b>Valves</b></div>
          <div class="utility-symbol-row"><i data-symbol="S"></i><b>Substations</b></div>
          <div class="utility-symbol-row"><i data-symbol="T"></i><b>Telecoms cabinet</b></div>
          <div class="utility-symbol-row"><i data-symbol="G"></i><b>Gas regulator</b></div>
          <div class="utility-symbol-row"><i data-symbol="P"></i><b>Pump / manhole</b></div>
          <div class="utility-symbol-row"><i data-symbol="D"></i><b>District energy exchange</b></div>
          <div class="utility-symbol-row danger"><i data-symbol="!"></i><b>Possible context constraint</b></div>
          <div class="utility-boundary-row"><i></i><b>Context boundary${outageCount ? ` (${compactNumber(outageCount)})` : ""}</b></div>
        </section>
        <section>
          <span>Confidence (routes)</span>
          <div class="utility-confidence-row high"><i></i><b>High</b></div>
          <div class="utility-confidence-row medium"><i></i><b>Medium</b></div>
          <div class="utility-confidence-row low"><i></i><b>Low</b></div>
        </section>
        ${renderLensLegendNote(status, lens, "Mapped routes are descriptive context, not outage proof or capacity data.")}
      </aside>
    `;
  }

  function renderUtilityWorksMapLegend(lens) {
    const status = lensStatusText(lens);
    const counts = utilityWorksGuideStatusCounts();
    const statusRows = lens.layers
      .filter((layer) => !layer.categoryToggle)
      .map((layer) => {
        const count = counts.byStatus[layer.id] || 0;
        return `
          <div class="utility-work-row" data-status="${escapeAttr(layer.id)}">
            <i style="--work-color:${escapeAttr(layer.color)}"></i>
            <b>${escapeHtml(layer.label)}</b>
            ${count ? `<em>${compactNumber(count)}</em>` : ""}
          </div>
        `;
      }).join("");
    return `
      <aside class="utility-map-legend utility-map-legend--works" aria-label="Works legend">
        <strong>Works legend <small>(by status)</small></strong>
        <section>
          <span>Status${counts.total ? ` (${compactNumber(counts.total)})` : ""}</span>
          ${statusRows}
          <div class="utility-work-row" data-status="traffic"><i></i><b>Traffic management</b></div>
        </section>
        <section>
          <span>Reinstatement quality</span>
          <div class="utility-quality-row high"><i></i><b>High</b></div>
          <div class="utility-quality-row medium"><i></i><b>Medium</b></div>
          <div class="utility-quality-row low"><i></i><b>Low</b></div>
          <div class="utility-quality-row unknown"><i></i><b>Not assessed</b></div>
        </section>
        <section>
          <span>Utility types (shown inline)</span>
          <div class="utility-type-grid">
            <i data-symbol="W" style="--type-color:#2f85bd" title="Water"></i>
            <i data-symbol="D" style="--type-color:#148a8d" title="Wastewater"></i>
            <i data-symbol="G" style="--type-color:#e2b42c" title="Gas"></i>
            <i data-symbol="E" style="--type-color:#ef6b2a" title="Electricity"></i>
            <i data-symbol="T" style="--type-color:#7a3b97" title="Telecoms"></i>
            <i data-symbol="H" style="--type-color:#7a5438" title="District energy"></i>
          </div>
        </section>
        ${renderLensLegendNote(status, lens, "Works records are shown where source-backed rows exist; mapped context may be partial.")}
      </aside>
    `;
  }

  function utilityCapacityLegendLabel(type) {
    if (type === "electricity") return "Power (LV / HV)";
    if (type === "water") return "Water (mains)";
    if (type === "telecoms" || type === "telecom") return "Telecoms (fibre / copper)";
    if (type === "gas") return "Gas (distribution)";
    if (type === "drainage") return "Drainage (sewer)";
    if (type === "district_energy") return "District energy";
    return utilityTypeLabel(type);
  }

  function lensCalloutLimit(lensId) {
    if (lensId === "economy-gravity") return 9;
    if (lensId === "civic-access-gaps") return 8;
    if (lensId === "civic-catchment") return 0;
    if (lensId === "planning-pressure") return 0;
    if (lensId === "utilities-capacity") return 0;
    if (lensId === "utilities-resilience") return 0;
    if (lensId === "utilities-works") return 7;
    if (lensId.startsWith("utilities-")) return 8;
    if (lensId === "economy-vitality") return 0;
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
    if (activeTransportLensYearMissing()) return "";
    const configured = state.cityMeta?.artifact_paths?.transport_roads_base || state.city?.artifact_paths?.transport_roads_base;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadYearPath(year = state.year) {
    if (activeTransportLensYearMissing(year)) return "";
    const template = state.cityMeta?.artifact_paths?.transport_roads_template || state.city?.artifact_paths?.transport_roads_template;
    const numericYear = currentTimelineYear(year);
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function transportStopsPath() {
    const configured = state.cityMeta?.artifact_paths?.transport_stops || state.city?.artifact_paths?.transport_stops;
    if (configured) return dataPathToUrl(configured);
    return state.cityId === "belfast"
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
        state.lensEventSourceKey = "";
        updateLensGuideSource();
        renderDetail();
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
    const pressureActive = activeMapLens()?.id === "planning-pressure";
    const deltaActive = activeMapLens()?.id === "planning-delta";
    const parcelActive = activeMapLens()?.id === "planning-parcels";
    return [
      "case",
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
      pressureActive ? "#c98b75" : parcelActive ? "#c8c0b2" : deltaActive ? "#d8583f" : builtActive ? "#c8472e" : "#b88974",
      pressureActive || parcelActive || deltaActive ? "#d7c5b8" : builtActive ? "#a9b08f" : "#b8b6a8",
    ];
  }

  function builtFootprintFillColorExpression() {
    const deltaActive = activeMapLens()?.id === "planning-delta";
    return [
      "case",
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
      deltaActive ? "#d84a2d" : "#c8472e",
      deltaActive ? "#d89572" : "#c98667",
    ];
  }

  function builtFootprintFillOpacityExpression() {
    const deltaActive = activeMapLens()?.id === "planning-delta";
    return [
      "case",
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
      deltaActive ? 0.42 : 0.36,
      deltaActive ? 0.13 : 0.18,
    ];
  }

  function updateDetailLayerPaint() {
    const builtActive = isActiveMapLens("built_environment");
    const transportActive = isActiveMapLens("transport");
    const pressureActive = activeMapLens()?.id === "planning-pressure";
    const deltaActive = activeMapLens()?.id === "planning-delta";
    const parcelActive = activeMapLens()?.id === "planning-parcels";
    if (state.map.getLayer("detail-buildings-fill")) {
      state.map.setPaintProperty(
        "detail-buildings-fill",
        "fill-opacity",
        [
          "interpolate", ["linear"], ["zoom"],
          10, pressureActive || parcelActive ? 0.025 : deltaActive ? 0.035 : builtActive ? 0.1 : 0.03,
          14, pressureActive ? 0.075 : parcelActive ? 0.045 : deltaActive ? 0.09 : builtActive ? 0.2 : 0.08,
          17, pressureActive ? 0.12 : parcelActive ? 0.07 : deltaActive ? 0.14 : builtActive ? 0.3 : 0.14,
        ],
      );
    }
    if (state.map.getLayer("detail-buildings-extrusion")) {
      state.map.setPaintProperty("detail-buildings-extrusion", "fill-extrusion-opacity", pressureActive ? 0.06 : parcelActive ? 0.02 : deltaActive ? 0.04 : builtActive ? 0.32 : 0.12);
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
      state.map.setPaintProperty("detail-buildings-year-outline", "line-opacity", pressureActive ? 0.08 : deltaActive ? 0.14 : builtActive ? 0.22 : 0.08);
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

      const baseSource = state.map.getSource(LENS_ROAD_BASE_SOURCE_ID);
      if (basePath) {
        if (baseSource?.setData) {
          if (state.transportRoadBasePathLoaded !== basePath) baseSource.setData(basePath);
        } else {
          state.map.addSource(LENS_ROAD_BASE_SOURCE_ID, { type: "geojson", data: basePath, generateId: true });
        }
        state.transportRoadBasePathLoaded = basePath;
      } else if (!baseSource) {
        state.map.addSource(LENS_ROAD_BASE_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
        state.transportRoadBasePathLoaded = "";
      } else if (baseSource?.setData && state.transportRoadBasePathLoaded !== "") {
        baseSource.setData(emptyFeatureCollection());
        state.transportRoadBasePathLoaded = "";
      }

      const roadSource = state.map.getSource(LENS_ROAD_SOURCE_ID);
      if (yearPath) {
        if (roadSource?.setData) {
          if (state.transportRoadYearPathLoaded !== yearPath) roadSource.setData(yearPath);
        } else {
          state.map.addSource(LENS_ROAD_SOURCE_ID, { type: "geojson", data: yearPath, generateId: true });
        }
        state.transportRoadYearPathLoaded = yearPath;
        state.transportRoadYearLoaded = currentTimelineYear();
        updateTransportRoadFeatureCount(yearPath, currentTimelineYear());
      } else if (!roadSource) {
        state.map.addSource(LENS_ROAD_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
        state.transportRoadYearPathLoaded = "";
        state.transportRoadYearLoaded = null;
        updateTransportRoadFeatureCount("", currentTimelineYear());
      } else if (roadSource?.setData && state.transportRoadYearPathLoaded !== "") {
        roadSource.setData(emptyFeatureCollection());
        state.transportRoadYearPathLoaded = "";
        state.transportRoadYearLoaded = null;
        updateTransportRoadFeatureCount("", currentTimelineYear());
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
          "economy-land-use", 0.012,
          "planning-pressure", 0.012,
          "planning-delta", 0.018,
          "planning-parcels", 0.01,
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
          "economy-land-use", 0.28,
          "planning-pressure", 0.45,
          "planning-delta", 0.34,
          "planning-parcels", 0.42,
          "utilities-capacity", 0,
          "utilities-resilience", 0,
          "utilities-works", 0,
          0.7,
        ],
        "line-width": [
          "case",
          ["==", ["get", "lens_id"], "planning-pressure"], 1.45,
          ["==", ["get", "lens_id"], "planning-parcels"], 1.35,
          1.2,
        ],
        "line-dasharray": [4.2, 2.2],
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
        "line-opacity": [
          "case",
          ["==", ["get", "lens_id"], "civic-access-gaps"], 0.78,
          ["==", ["get", "lens_id"], "civic-catchment"], 0.58,
          ["==", ["get", "lens_id"], "planning-pressure"], 0.68,
          ["==", ["get", "lens_id"], "planning-parcels"], 0.54,
          ["==", ["get", "lens_id"], "planning-delta"], 0.36,
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.52],
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["case", ["==", ["get", "lens_id"], "civic-access-gaps"], 1.15, ["==", ["get", "lens_id"], "civic-catchment"], 1.05, ["==", ["get", "lens_id"], "planning-pressure"], 1.05, 0.75],
          13, ["case", ["==", ["get", "lens_id"], "civic-access-gaps"], 1.7, ["==", ["get", "lens_id"], "civic-catchment"], 1.55, ["==", ["get", "lens_id"], "planning-pressure"], 1.55, 1.25],
          16, ["case", ["==", ["get", "lens_id"], "civic-access-gaps"], 2.3, ["==", ["get", "lens_id"], "civic-catchment"], 2.08, ["==", ["get", "lens_id"], "planning-pressure"], 2.1, 1.85],
        ],
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
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.008, 1, 0.038],
          ["==", ["get", "surface_style"], "access_fabric"],
          ["case",
            ["==", ["get", "fabric_shape"], "isochrone_band"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.34, 0.55, 0.56, 1, 0.78],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.06, 0.58, 0.14, 1, 0.28],
          ],
          ["==", ["get", "surface_style"], "demand_surface"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.14, 0.34, 0.28, 0.64, 0.5, 1, 0.68],
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case",
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.08, 0.5, 0.18, 1, 0.36],
            ["==", ["get", "lens_id"], "planning-delta"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.1, 0.45, 0.24, 1, 0.42],
            ["==", ["get", "lens_id"], "planning-parcels"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.28, 0.55, 0.46, 1, 0.64],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.26, 0.55, 0.5, 1, 0.68],
          ],
          ["==", ["get", "surface_style"], "catchment_area"],
          ["case",
            ["==", ["get", "lens_id"], "civic-catchment"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.18, 0.58, 0.3, 1, 0.44],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.22, 0.58, 0.34, 1, 0.46],
          ],
          ["==", ["get", "surface_style"], "catchment_backdrop"],
          ["case",
            ["==", ["get", "lens_id"], "civic-catchment"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.09, 0.6, 0.15, 1, 0.24],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.14, 0.6, 0.25, 1, 0.36],
          ],
          ["==", ["get", "surface_style"], "catchment_patch"],
          ["case", ["==", ["get", "lens_id"], "civic-catchment"], 0.22, 0.34],
          ["==", ["get", "surface_style"], "land_use_tile"],
          ["case",
            ["==", ["get", "evidence_role"], "context_not_year_specific_change_evidence"],
            ["case",
              ["==", ["get", "source_kind"], "current_context_road_infill"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.055, 0.55, 0.1, 1, 0.16],
              ["==", ["get", "source_kind"], "current_context_block_mosaic"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.1, 0.55, 0.17, 1, 0.28],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.13, 0.55, 0.22, 1, 0.34],
            ],
            ["match", ["get", "source_kind"], ["road_adjacency_infill", "current_context_road_infill"], true, false],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.18, 0.55, 0.32, 1, 0.52],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.42, 0.55, 0.62, 1, 0.82],
          ],
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
          ["==", ["get", "surface_style"], "access_fabric"],
          ["case",
            ["==", ["get", "fabric_shape"], "isochrone_band"],
            "#2f8795",
            ["coalesce", ["get", "color"], "#95cbaa"],
          ],
          ["==", ["get", "surface_style"], "demand_surface"], "#fffaf0",
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case",
            ["==", ["get", "lens_id"], "planning-delta"], ["coalesce", ["get", "color"], "#d87965"],
            ["==", ["get", "lens_id"], "planning-parcels"], ["coalesce", ["get", "color"], "#fff8e9"],
            ["coalesce", ["get", "color"], "#fff7eb"],
          ],
          ["==", ["get", "surface_style"], "catchment_area"], "#fffaf0",
          ["==", ["get", "surface_style"], "catchment_backdrop"], "#fffaf0",
          ["==", ["get", "surface_style"], "land_use_tile"], "#fffaf0",
          "#ffffff",
        ],
        "line-opacity": [
          "case",
          ["==", ["get", "surface_style"], "utility_outage_area"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.24, 1, 0.6],
          ["==", ["get", "surface_style"], "access_fabric"],
          ["case",
            ["==", ["get", "fabric_shape"], "isochrone_band"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.55, 1, 0.88],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.08, 1, 0.18],
          ],
          ["==", ["get", "surface_style"], "demand_surface"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.08, 0.58, 0.2, 1, 0.34],
          ["==", ["get", "surface_style"], "planning_footprint"],
          ["case",
            ["==", ["get", "lens_id"], "planning-pressure"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.4], 0, 0.28, 0.55, 0.42, 1, 0.58],
            ["==", ["get", "lens_id"], "planning-delta"], 0.44,
            ["==", ["get", "lens_id"], "planning-parcels"], 0.44,
            0.7,
          ],
          ["==", ["get", "surface_style"], "catchment_area"],
          ["case", ["==", ["get", "lens_id"], "civic-catchment"], 0.52, 0.72],
          ["==", ["get", "surface_style"], "catchment_backdrop"],
          ["case", ["==", ["get", "lens_id"], "civic-catchment"], 0.26, 0.58],
          ["==", ["get", "surface_style"], "catchment_patch"], 0.5,
          ["==", ["get", "surface_style"], "land_use_tile"],
          ["case",
            ["==", ["get", "evidence_role"], "context_not_year_specific_change_evidence"],
            ["case",
              ["==", ["get", "source_kind"], "current_context_road_infill"], 0.08,
              ["==", ["get", "source_kind"], "current_context_block_mosaic"], 0.16,
              0.2,
            ],
            ["match", ["get", "source_kind"], ["road_adjacency_infill", "current_context_road_infill"], true, false],
            0.22,
            0.44,
          ],
          0.52,
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["case", ["==", ["get", "surface_style"], "land_use_tile"], 0.18, ["all", ["==", ["get", "surface_style"], "access_fabric"], ["==", ["get", "fabric_shape"], "isochrone_band"]], 0.72, ["==", ["get", "surface_style"], "access_fabric"], 0.18, ["==", ["get", "surface_style"], "demand_surface"], 0.08, ["==", ["get", "surface_style"], "planning_footprint"], 0.34, ["all", ["==", ["get", "surface_style"], "catchment_area"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.32, ["==", ["get", "surface_style"], "catchment_area"], 0.58, ["all", ["==", ["get", "surface_style"], "catchment_backdrop"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.08, ["==", ["get", "surface_style"], "catchment_backdrop"], 0.22, ["==", ["get", "surface_style"], "catchment_patch"], 0.28, 0.3],
          14, ["case", ["==", ["get", "surface_style"], "utility_outage_area"], 1.25, ["==", ["get", "surface_style"], "land_use_tile"], 0.44, ["all", ["==", ["get", "surface_style"], "access_fabric"], ["==", ["get", "fabric_shape"], "isochrone_band"]], 1.22, ["==", ["get", "surface_style"], "access_fabric"], 0.36, ["==", ["get", "surface_style"], "demand_surface"], 0.22, ["==", ["get", "surface_style"], "planning_footprint"], 1.08, ["all", ["==", ["get", "surface_style"], "catchment_area"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.92, ["==", ["get", "surface_style"], "catchment_area"], 0.72, ["all", ["==", ["get", "surface_style"], "catchment_backdrop"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.18, ["==", ["get", "surface_style"], "catchment_backdrop"], 0.48, ["==", ["get", "surface_style"], "catchment_patch"], 0.58, 0.62],
          17, ["case", ["==", ["get", "surface_style"], "utility_outage_area"], 1.9, ["==", ["get", "surface_style"], "land_use_tile"], 0.72, ["all", ["==", ["get", "surface_style"], "access_fabric"], ["==", ["get", "fabric_shape"], "isochrone_band"]], 1.55, ["==", ["get", "surface_style"], "access_fabric"], 0.52, ["==", ["get", "surface_style"], "demand_surface"], 0.34, ["==", ["get", "surface_style"], "planning_footprint"], 1.48, ["all", ["==", ["get", "surface_style"], "catchment_area"], ["==", ["get", "lens_id"], "civic-catchment"]], 1.22, ["==", ["get", "surface_style"], "catchment_area"], 1.05, ["all", ["==", ["get", "surface_style"], "catchment_backdrop"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.28, ["==", ["get", "surface_style"], "catchment_backdrop"], 0.7, ["==", ["get", "surface_style"], "catchment_patch"], 0.82, 1.05],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-parcel-hatch",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["==", ["get", "kind"], "parcel_hatch"],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#9a7b54"],
        "line-opacity": [
          "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
          0, 0.18,
          0.55, 0.32,
          1, 0.48,
        ],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 0.22,
          14, 0.56,
          17, 0.86,
        ],
      },
    });
    if (state.map.getLayer("lens-guide-ring-line") && state.map.getLayer("lens-guide-parcel-hatch")) {
      state.map.moveLayer("lens-guide-ring-line", "lens-guide-parcel-hatch");
    }
    state.map.addLayer({
      id: "lens-guide-coverage-flow-case",
      type: "line",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_role"], "coverage"]],
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#fffdf6",
        "line-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.54],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.35, 1, 4.55],
          13, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.65, 1, 8.7],
          16, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 3.65, 1, 11.2],
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
        "line-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.38, 1, 0.82],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 2.9],
          13, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.72, 1, 6.25],
          16, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.65, 1, 8.35],
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
          ["==", ["get", "flow_style"], "economy_gravity_arc"], 0.62,
          ["==", ["get", "flow_style"], "economy_gravity_thread"], 0.32,
          ["==", ["get", "flow_style"], "economy_current_ribbon"], 0.74,
          ["==", ["get", "flow_style"], "economy_before_ribbon"], 0.5,
          ["==", ["get", "flow_style"], "economy_churn_tick"], 0.82,
          ["==", ["get", "flow_style"], "planning_pressure_spine"], 0.58,
          ["==", ["get", "flow_style"], "planning_pressure_edge"], 0.5,
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"], 0.34,
          ["==", ["get", "flow_style"], "planning_pressure_trace"], 0.24,
          ["==", ["get", "flow_style"], "catchment_street_seam"], 0.64,
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_backbone"]], 0.96,
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_thread"]], 0.34,
          ["==", ["get", "flow_style"], "transport_backbone"], 0.9,
          ["==", ["get", "flow_style"], "transport_thread"], 0.56,
          ["==", ["get", "flow_style"], "utility_capacity_trace"],
          [
            "*",
            [
              "case",
              ["==", ["get", "flow_role"], "utility_network"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.22, 1, 0.58],
              ["==", ["get", "flow_role"], "utility_network_derived"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.68],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.4, 0.58, 0.62, 1, 0.84],
            ],
            ["case", ["==", ["get", "utility_type"], "telecoms"], 0.7, ["==", ["get", "utility_type"], "district_energy"], 0.82, 1],
            utilityGuidePriorityFactor(0.34, 0.72, 1.08, 0.58),
          ],
          ["==", ["get", "flow_style"], "utility_primary"], ["*", 0.56, utilityGuidePriorityFactor(0.52, 0.84, 1.12, 0.62)],
          ["==", ["get", "flow_style"], "utility_backup"], ["*", 0.44, utilityGuidePriorityFactor(0.44, 0.78, 1.08, 0.58)],
          ["==", ["get", "flow_style"], "utility_inferred"], ["*", 0.3, utilityGuidePriorityFactor(0.34, 0.64, 0.92, 0.48)],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          [
            "case",
            ["!", ["boolean", ["get", "line_selected"], false]],
            0.1,
            ["==", ["get", "flow_role"], "source_trace"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.6, 0.92, 0.88],
            ["==", ["get", "flow_role"], "utility_network"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.52, 0.92, 0.78],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.42, 0.92, 0.7],
          ],
          ["==", ["get", "flow_style"], "demand_displacement"], 0.6,
          ["==", ["get", "flow_style"], "access_network"],
          [
            "case",
            ["==", ["get", "access_mode"], "walk"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.2, 1, 0.48],
            ["==", ["get", "access_mode"], "bus"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.28, 1, 0.58],
            ["==", ["get", "access_mode"], "rail"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.3, 1, 0.64],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.24, 1, 0.54],
          ],
          ["==", ["get", "flow_style"], "gap_high"], 0.84,
          ["==", ["get", "flow_style"], "gap_medium"], 0.78,
          ["==", ["get", "flow_style"], "gap_low"], 0.68,
          ["==", ["get", "flow_style"], "gap_adequate"], 0.58,
          ["==", ["get", "lens_id"], "civic-access-gaps"], 0.68,
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
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.8, 1, 8.7],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.85, 1, 3.2],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.8, 1, 6.2],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.1, 1, 3.65],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.05, 1, 6.1],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.9, 1, 5.8],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.18, 1, 3.85],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.78, 1, 2.35],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.68, 1, 2.15],
          ["==", ["get", "flow_style"], "catchment_street_seam"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.2, 1, 3.35],
          ["==", ["get", "flow_style"], "transport_service_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.1, 1, 4.15],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "interrupted"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.5, 1, 4.25],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "planned"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.25, 1, 3.55],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "delayed"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.08, 1, 3.25],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "inferred"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.92, 1, 2.45],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "flow_style"], "transport_backbone"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.62, 1, 4.7],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "flow_style"], "transport_thread"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.72, 1, 2.35],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_backbone"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 2.2, 1, 6.2],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_thread"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 1.55],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 3.1, 1, 8.8],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.3, 1, 4.2],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_primary"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.9, 1, 6.3],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_backup"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.25, 1, 4.2],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_inferred"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.65, 1, 2.1],
          ["==", ["get", "flow_style"], "utility_capacity_trace"],
          [
            "*",
            [
              "case",
              ["==", ["get", "flow_role"], "utility_network"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.76, 1, 2.2],
              ["==", ["get", "flow_role"], "utility_network_derived"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.15, 1, 3.75],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.45, 0.58, 2.6, 1, 5.8],
            ],
            ["case", ["==", ["get", "utility_type"], "telecoms"], 0.68, ["==", ["get", "utility_type"], "district_energy"], 0.78, ["==", ["get", "utility_type"], "drainage"], 0.9, 1],
            utilityGuidePriorityFactor(0.46, 0.78, 1.12, 0.58),
          ],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.85, 1, 5.4], utilityGuidePriorityFactor(0.54, 0.82, 1.12, 0.62)],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.35, 1, 4.2], utilityGuidePriorityFactor(0.5, 0.78, 1.08, 0.58)],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.9, 1, 2.8], utilityGuidePriorityFactor(0.38, 0.66, 0.96, 0.48)],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          [
            "case",
            ["!", ["boolean", ["get", "line_selected"], false]],
            0.26,
            ["==", ["get", "flow_role"], "source_trace"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 1.75, 0.92, 5.05],
            ["==", ["get", "flow_role"], "utility_network"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 1.35, 0.92, 3.95],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.96, 0.92, 3.15],
          ],
          ["==", ["get", "flow_style"], "demand_displacement"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.5, 1, 5.1],
          ["==", ["get", "flow_style"], "access_network"],
          [
            "case",
            ["==", ["get", "access_mode"], "walk"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.72, 1, 2.1],
            ["==", ["get", "access_mode"], "bus"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.12, 1, 3.2],
            ["==", ["get", "access_mode"], "rail"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.22, 1, 3.55],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.98, 1, 2.9],
          ],
          ["==", ["get", "flow_style"], "gap_high"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.35, 1, 3.9],
          ["==", ["get", "flow_style"], "gap_medium"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.05, 1, 3.1],
          ["==", ["get", "flow_style"], "gap_low"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.9, 1, 2.65],
          ["==", ["get", "flow_style"], "gap_adequate"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 1, 1.85],
          ["==", ["get", "lens_id"], "civic-access-gaps"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.86, 1, 2.78],
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
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.36, 1, 0.7],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.22, 1, 0.45],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 1, 0.96],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.68],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.5, 1, 0.82],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.88],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.78],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.48],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.14, 1, 0.38],
          ["==", ["get", "flow_style"], "catchment_street_seam"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 0.9],
          ["==", ["get", "flow_style"], "transport_service_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.72, 1, 0.96],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_backbone"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.86, 1, 1],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_thread"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.28, 1, 0.58],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "interrupted"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 0.98],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "planned"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.72, 1, 0.94],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "delayed"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.68, 1, 0.92],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "inferred"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.7],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 1],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.76],
          ["==", ["get", "flow_style"], "utility_capacity_trace"],
          [
            "*",
            [
              "case",
              ["==", ["get", "flow_role"], "utility_network"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.36, 1, 0.78],
              ["==", ["get", "flow_role"], "utility_network_derived"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 0.94],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 0.58, 0.82, 1, 1],
            ],
            ["case", ["==", ["get", "utility_type"], "telecoms"], 0.72, ["==", ["get", "utility_type"], "district_energy"], 0.84, 1],
            utilityGuidePriorityFactor(0.36, 0.76, 1.12, 0.58),
          ],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.44, 1, 0.9], utilityGuidePriorityFactor(0.48, 0.82, 1.12, 0.62)],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.76], utilityGuidePriorityFactor(0.42, 0.76, 1.08, 0.58)],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.2, 1, 0.5], utilityGuidePriorityFactor(0.34, 0.64, 0.92, 0.48)],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          [
            "case",
            ["!", ["boolean", ["get", "line_selected"], false]],
            0.075,
            ["==", ["get", "flow_role"], "source_trace"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.78, 0.92, 1],
            ["==", ["get", "flow_role"], "utility_network"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.7, 0.92, 0.98],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.62, 0.92, 0.92],
          ],
          ["==", ["get", "flow_style"], "demand_displacement"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.55, 1, 0.94],
          ["==", ["get", "flow_style"], "access_network"],
          [
            "case",
            ["==", ["get", "access_mode"], "walk"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.38, 1, 0.74],
            ["==", ["get", "access_mode"], "bus"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 0.96],
            ["==", ["get", "access_mode"], "rail"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.68, 1, 1],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.48, 1, 0.84],
          ],
          ["==", ["get", "flow_style"], "gap_high"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.7, 1, 1],
          ["==", ["get", "flow_style"], "gap_medium"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 0.94],
          ["==", ["get", "flow_style"], "gap_low"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.84],
          ["==", ["get", "flow_style"], "gap_adequate"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.72],
          ["==", ["get", "lens_id"], "civic-access-gaps"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.5, 1, 0.94],
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
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.95, 1, 5.35],
          ["==", ["get", "flow_style"], "economy_gravity_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.25, 1, 1.05],
          ["==", ["get", "flow_style"], "economy_current_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.05, 1, 4.75],
          ["==", ["get", "flow_style"], "economy_before_ribbon"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.54, 1, 2.35],
          ["==", ["get", "flow_style"], "economy_churn_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.7, 1, 2.6],
          ["==", ["get", "flow_style"], "planning_pressure_spine"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.92, 1, 3.35],
          ["==", ["get", "flow_style"], "planning_pressure_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.56, 1, 2.02],
          ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.24, 1, 0.82],
          ["==", ["get", "flow_style"], "planning_pressure_trace"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.18, 1, 0.78],
          ["==", ["get", "flow_style"], "catchment_street_seam"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.54, 1, 1.62],
          ["==", ["get", "flow_style"], "transport_service_tick"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.72, 1, 2.25],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "interrupted"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 1, 2.35],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "planned"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 2.05],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "delayed"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.5, 1, 1.9],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "reliability_status"], "inferred"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.36, 1, 1.38],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "flow_style"], "transport_backbone"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 3.05],
          ["all", ["==", ["get", "lens_id"], "transport-reliability"], ["==", ["get", "flow_style"], "transport_thread"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.32, 1, 1.32],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_backbone"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.3, 1, 4.4],
          ["all", ["==", ["get", "lens_id"], "transport-speed"], ["==", ["get", "flow_style"], "transport_thread"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 1.18],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.75, 1, 6.1],
          ["==", ["get", "flow_style"], "transport_thread"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.6, 1, 2.8],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_primary"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 1.05, 1, 4],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_backup"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.64, 1, 2.45],
          ["all", ["==", ["get", "lens_id"], "utilities-resilience"], ["==", ["get", "flow_style"], "utility_inferred"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.26, 1, 1.12],
          ["==", ["get", "flow_style"], "utility_capacity_trace"],
          [
            "*",
            [
              "case",
              ["==", ["get", "flow_role"], "utility_network"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 1.82],
              ["==", ["get", "flow_role"], "utility_network_derived"],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 3.15],
              ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.9, 0.58, 1.9, 1, 4.55],
            ],
            ["case", ["==", ["get", "utility_type"], "telecoms"], 0.66, ["==", ["get", "utility_type"], "district_energy"], 0.78, ["==", ["get", "utility_type"], "drainage"], 0.9, 1],
            utilityGuidePriorityFactor(0.48, 0.8, 1.12, 0.58),
          ],
          ["==", ["get", "flow_style"], "utility_primary"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.85, 1, 3.35], utilityGuidePriorityFactor(0.5, 0.82, 1.12, 0.62)],
          ["==", ["get", "flow_style"], "utility_backup"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 2.55], utilityGuidePriorityFactor(0.46, 0.78, 1.08, 0.58)],
          ["==", ["get", "flow_style"], "utility_inferred"],
          ["*", ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 1.58], utilityGuidePriorityFactor(0.36, 0.64, 0.94, 0.48)],
          ["==", ["get", "flow_style"], "utility_work_thread"],
          [
            "case",
            ["!", ["boolean", ["get", "line_selected"], false]],
            0.24,
            ["==", ["get", "flow_role"], "source_trace"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 1.02, 0.92, 3.35],
            ["==", ["get", "flow_role"], "utility_network"],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.78, 0.92, 2.65],
            ["interpolate", ["linear"], ["to-number", ["get", "visual_priority"], 0.6], 0.5, 0.62, 0.92, 2.22],
          ],
          ["==", ["get", "flow_style"], "demand_displacement"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 3.3],
          ["==", ["get", "flow_style"], "access_network"],
          [
            "case",
            ["==", ["get", "access_mode"], "walk"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.4, 1, 1.7],
            ["==", ["get", "access_mode"], "bus"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.82, 1, 3.05],
            ["==", ["get", "access_mode"], "rail"],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.92, 1, 3.35],
            ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 2.34],
          ],
          ["==", ["get", "flow_style"], "gap_high"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.66, 1, 2.55],
          ["==", ["get", "flow_style"], "gap_medium"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 2.05],
          ["==", ["get", "flow_style"], "gap_low"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.44, 1, 1.7],
          ["==", ["get", "flow_style"], "gap_adequate"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.3, 1, 1.1],
          ["==", ["get", "lens_id"], "civic-access-gaps"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.36, 1, 1.85],
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
      id: "lens-guide-flow-arrow",
      type: "symbol",
      source: LENS_GUIDE_SOURCE_ID,
      filter: [
        "all",
        ["==", ["get", "kind"], "flow"],
        ["match", ["get", "flow_style"], ["demand_displacement", "economy_gravity_arc", "transport_backbone"], true, false],
      ],
      layout: {
        visibility: "none",
        "symbol-placement": "line-center",
        "icon-image": "lens-icon-demand-arrow",
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          9, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.3, 1, 0.46],
          13, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.42, 1, 0.68],
          16, ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 0.9],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-keep-upright": false,
        "icon-rotation-alignment": "map",
        "icon-pitch-alignment": "map",
        "text-field": ">",
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          9, ["case", ["==", ["get", "flow_style"], "economy_gravity_arc"], 10, ["==", ["get", "flow_style"], "transport_backbone"], 10, 15],
          13, ["case", ["==", ["get", "flow_style"], "economy_gravity_arc"], 15, ["==", ["get", "flow_style"], "transport_backbone"], 16, 22],
          16, ["case", ["==", ["get", "flow_style"], "economy_gravity_arc"], 21, ["==", ["get", "flow_style"], "transport_backbone"], 20, 30],
        ],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-keep-upright": false,
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
      },
      paint: {
        "icon-opacity": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"], 0,
          ["==", ["get", "flow_style"], "transport_backbone"], 0,
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.56, 1, 0.92],
        ],
        "text-color": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"], ["coalesce", ["get", "color"], "#75418d"],
          ["==", ["get", "flow_style"], "transport_backbone"], ["coalesce", ["get", "color"], "#0f8d95"],
          "#75418d",
        ],
        "text-halo-color": "#fffdf7",
        "text-halo-width": 1.4,
        "text-opacity": [
          "case",
          ["==", ["get", "flow_style"], "economy_gravity_arc"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.5, 1, 0.86],
          ["==", ["get", "flow_style"], "transport_backbone"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.5, 1, 0.88],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.62, 1, 0.94],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-works-type-symbol",
      type: "symbol",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_style"], "utility_work_thread"]],
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "symbol-spacing": [
          "interpolate", ["linear"], ["zoom"],
          10, 136,
          14, 190,
          16, 252,
        ],
        "icon-image": [
          "match", ["get", "utility_type"],
          "water", "lens-icon-utility-water",
          "electricity", "lens-icon-utility-electricity",
          "telecoms", "lens-icon-utility-telecoms",
          "telecom", "lens-icon-utility-telecoms",
          "gas", "lens-icon-utility-gas",
          "drainage", "lens-icon-utility-drainage",
          "district_energy", "lens-icon-utilities",
          "lens-icon-utilities",
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          10, 0.18,
          14, 0.28,
          16, 0.38,
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-keep-upright": false,
        "icon-rotation-alignment": "map",
        "icon-pitch-alignment": "map",
      },
      paint: {
        "icon-opacity": [
          "case",
          ["==", ["get", "flow_role"], "street_context"],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.34, 1, 0.72],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.56, 1, 0.94],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-guide-works-symbol",
      type: "symbol",
      source: LENS_GUIDE_SOURCE_ID,
      filter: ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_style"], "utility_work_thread"]],
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "symbol-spacing": [
          "interpolate", ["linear"], ["zoom"],
          10, 72,
          14, 108,
          16, 150,
        ],
        "text-field": ["coalesce", ["get", "works_symbol"], ">"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          10, 13,
          14, 18,
          16, 23,
        ],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-keep-upright": false,
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
      },
      paint: {
        "text-color": ["coalesce", ["get", "color"], "#248b94"],
        "text-halo-color": "#fffdf7",
        "text-halo-width": 1.55,
        "text-opacity": [
          "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5],
          0, 0.7,
          1, 1,
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
          10, ["case", ["==", ["get", "node_style"], "transport_route"], 5.2, ["all", ["==", ["get", "node_style"], "transport"], ["match", ["get", "lens_id"], ["transport-speed", "transport-reliability"], true, false]], 5, ["==", ["get", "node_style"], "transport"], 3.8, 4.5],
          14, ["case", ["==", ["get", "node_style"], "transport_route"], 8.6, ["all", ["==", ["get", "node_style"], "transport"], ["match", ["get", "lens_id"], ["transport-speed", "transport-reliability"], true, false]], 8.4, ["==", ["get", "node_style"], "transport"], 6.4, 7.5],
          17, ["case", ["==", ["get", "node_style"], "transport_route"], 11.8, ["all", ["==", ["get", "node_style"], "transport"], ["match", ["get", "lens_id"], ["transport-speed", "transport-reliability"], true, false]], 11.4, ["==", ["get", "node_style"], "transport"], 9.2, 11],
        ],
        "circle-color": [
          "case",
          ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]], "#fffdf7",
          ["coalesce", ["get", "color"], "#1b7a85"],
        ],
        "circle-opacity": [
          "case",
          ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-access"]], 0,
          ["==", ["get", "node_style"], "transport_route"], 0.96,
          0.92,
        ],
        "circle-stroke-width": [
          "case",
          ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-access"]], 0,
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
        ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"], ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "node_style"], "planning_document"], ["==", ["get", "node_style"], "economy_notice"], ["==", ["get", "node_style"], "economy_anchor"]],
      ],
      layout: {
        visibility: "none",
        "icon-image": [
          "case",
          ["==", ["get", "node_style"], "transport_route"],
          "lens-icon-transport-transfer",
          ["==", ["get", "node_style"], "transport"],
          "lens-icon-transport-stop",
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
          ["==", ["get", "node_style"], "economy_anchor"],
          [
            "match", ["get", "sublayer_id"],
            "office", "lens-icon-economy-footfall",
            "hospitality", "lens-icon-economy-vacancy",
            "visitor", "lens-icon-economy-spend",
            "night", "lens-icon-economy-notice",
            "markets", "lens-icon-economy-opening",
            "lens-icon-economy",
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
          9, ["case",
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 0.62,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-access"]], 0.62,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-reliability"]], 0.46,
            ["==", ["get", "node_style"], "transport"], 0.34,
            ["==", ["get", "node_style"], "transport_route"], 0.48,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 0.72,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.62,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-demand"]], 0.58,
            ["==", ["get", "node_style"], "civic_anchor"], 0.48,
            ["==", ["get", "node_style"], "planning_document"], 0.4,
            ["==", ["get", "node_style"], "economy_anchor"], 0.5,
            ["==", ["get", "node_style"], "economy_notice"], 0.5,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-capacity"]], 0.42,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-resilience"]], 0.56,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-works"]], 0.5,
            0.42],
          13, ["case",
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 0.88,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-access"]], 0.9,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-reliability"]], 0.68,
            ["==", ["get", "node_style"], "transport"], 0.5,
            ["==", ["get", "node_style"], "transport_route"], 0.7,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 0.96,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-catchment"]], 0.86,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-demand"]], 0.82,
            ["==", ["get", "node_style"], "civic_anchor"], 0.7,
            ["==", ["get", "node_style"], "planning_document"], 0.58,
            ["==", ["get", "node_style"], "economy_anchor"], 0.72,
            ["==", ["get", "node_style"], "economy_notice"], 0.72,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-capacity"]], 0.62,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-resilience"]], 0.82,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-works"]], 0.74,
            0.58],
          16, ["case",
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 1.1,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-access"]], 1.16,
            ["all", ["==", ["get", "node_style"], "transport"], ["==", ["get", "lens_id"], "transport-reliability"]], 0.88,
            ["==", ["get", "node_style"], "transport"], 0.68,
            ["==", ["get", "node_style"], "transport_route"], 0.92,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-access-gaps"]], 1.18,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-catchment"]], 1.08,
            ["all", ["==", ["get", "node_style"], "civic_anchor"], ["==", ["get", "lens_id"], "civic-demand"]], 1.02,
            ["==", ["get", "node_style"], "civic_anchor"], 0.92,
            ["==", ["get", "node_style"], "planning_document"], 0.8,
            ["==", ["get", "node_style"], "economy_anchor"], 0.95,
            ["==", ["get", "node_style"], "economy_notice"], 0.95,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-capacity"]], 0.82,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-resilience"]], 1.12,
            ["all", ["==", ["get", "node_style"], "utility_trace"], ["==", ["get", "lens_id"], "utilities-works"]], 1.02,
            0.78],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "text-field": [
          "case",
          ["all", ["==", ["get", "lens_id"], "civic-access-gaps"], ["==", ["get", "node_style"], "civic_anchor"], ["<=", ["to-number", ["get", "label_rank"], 999], 9], [">=", ["to-number", ["get", "intensity"], 0], 0.58]],
          ["get", "label"],
          "",
        ],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          10, 9.5,
          13, 10.8,
          16, 12.4,
        ],
        "text-offset": [0, 1.18],
        "text-anchor": "top",
        "text-max-width": 10,
        "text-optional": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.58, 1, 0.96],
        "text-color": "#263833",
        "text-halo-color": "#fffdf7",
        "text-halo-width": 1.4,
        "text-opacity": [
          "case",
          ["all", ["==", ["get", "lens_id"], "civic-access-gaps"], ["==", ["get", "node_style"], "civic_anchor"]],
          ["interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.5], 0, 0.52, 1, 0.88],
          0,
        ],
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
      minzoom: 5.5,
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
      minzoom: 5.5,
      filter: lensDetailFilter("planning_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": planningCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.28, 0.82),
        "line-width": ["interpolate", ["linear"], ["zoom"], 5.5, 0.28, 9, 0.42, 13, 0.75, 16, 1.35],
      },
    });
    state.map.addLayer({
      id: "lens-civic-coverage-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 5.5,
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
      minzoom: 5.5,
      filter: lensDetailFilter("civic_coverage_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": civicCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.18, 0.58),
        "line-width": ["interpolate", ["linear"], ["zoom"], 5.5, 0.22, 9, 0.32, 13, 0.5, 16, 0.9],
      },
    });
    state.map.addLayer({
      id: "lens-civic-facility-icons",
      type: "symbol",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 5.5,
      filter: lensDetailFilter("civic_facility"),
      layout: detailIconLayout("lens-icon-civic", 9.5, true),
      paint: detailIconPaint(0.86),
    });
    state.map.addLayer({
      id: "lens-economy-cells-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 5.5,
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
      minzoom: 5.5,
      filter: lensDetailFilter("economy_activity_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": economyCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.16, 0.66),
        "line-width": ["interpolate", ["linear"], ["zoom"], 5.5, 0.22, 9, 0.34, 13, 0.52, 16, 1],
      },
    });
    state.map.addLayer({
      id: "lens-economy-frontage-case",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 5.5,
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
      minzoom: 5.5,
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
      minzoom: 5.5,
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
      minzoom: 5.5,
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
      minzoom: 5.5,
      filter: lensDetailFilter("utility_asset"),
      layout: detailUtilityIconLayout(9.8, true),
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
          "district_energy", "lens-icon-utilities",
          "lens-icon-utilities",
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", 0.22, utilityNetworkAssetSizeFactorExpression()],
          14, ["*", 0.32, utilityNetworkAssetSizeFactorExpression()],
          16, ["*", 0.45, utilityNetworkAssetSizeFactorExpression()],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": utilityNetworkAssetOpacityExpression(),
      },
    });
  }

  function utilityNetworkLineFilter() {
    return ["all",
      ["==", ["get", "layer"], "utility_network"],
      ["==", ["get", "network_geometry"], "line"],
    ];
  }

  function utilityNetworkAssetFilter() {
    const lensId = activeMapLens().id;
    const minPriority = lensId === "utilities-resilience" ? 3 : lensId === "utilities-capacity" ? 2 : 2;
    return ["all",
      ["==", ["get", "layer"], "utility_network"],
      ["==", ["get", "network_geometry"], "asset"],
      [">=", ["to-number", ["get", "asset_priority"], 0], minPriority],
    ];
  }

  function utilityNetworkAssetSizeFactorExpression() {
    const capacityBoost = activeMapLens().id === "utilities-capacity" ? 0.98 : 1;
    return [
      "*",
      capacityBoost,
      ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.82, 2, 0.95, 4, 1.18],
    ];
  }

  function utilityNetworkAssetOpacityExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-works") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1],
        1, 0.08,
        2, 0.16,
        4, 0.3,
      ];
    }
    if (mode === "utilities-capacity") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1],
        1, 0.24,
        2, 0.52,
        4, 0.9,
      ];
    }
    if (mode === "utilities-resilience") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1],
        1, 0.06,
        2, 0.16,
        4, 0.42,
      ];
    }
    return ["interpolate", ["linear"], ["to-number", ["get", "asset_priority"], 1], 1, 0.24, 2, 0.54, 4, 0.92];
  }

  function utilityNetworkContextColorExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-capacity") {
      return [
        "case",
        [">=", ["to-number", ["get", "intensity"], 0], 0.96], "#d62d35",
        ["all", ["==", ["get", "utility_type"], "electricity"], [">=", ["to-number", ["get", "intensity"], 0], 0.78]], "#ed6b35",
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
    if (mode === "utilities-capacity") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
        0, 0.34,
        1, 0.9,
      ];
    }
    if (mode === "utilities-resilience") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
        0, 0.08,
        1, 0.36,
      ];
    }
    const high = mode === "utilities-resilience" ? 0.78 : mode === "utilities-capacity" ? 0.88 : mode === "utilities-works" ? 0.2 : 0.72;
    const low = mode === "utilities-works" ? 0.04 : mode === "utilities-capacity" ? 0.22 : 0.22;
    return [
      "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
      0, low,
      1, high,
    ];
  }

  function utilityNetworkCaseOpacityExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-capacity") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
        0, 0.18,
        1, 0.52,
      ];
    }
    if (mode === "utilities-resilience") {
      return [
        "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
        0, 0.035,
        1, 0.16,
      ];
    }
    const high = mode === "utilities-resilience" ? 0.42 : mode === "utilities-capacity" ? 0.44 : mode === "utilities-works" ? 0.12 : 0.36;
    return [
      "interpolate", ["linear"], ["to-number", ["get", "intensity"], 0.45],
      0, mode === "utilities-works" ? 0.02 : 0.08,
      1, high,
    ];
  }

  function utilityNetworkWidthExpression() {
    const mode = activeMapLens().id;
    const factor = mode === "utilities-resilience" ? 0.58 : mode === "utilities-works" ? 0.56 : mode === "utilities-capacity" ? 1.18 : 1;
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.26, 5, 0.9]],
      13, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.58, 5, 2.15]],
      16, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.96, 5, 3.4]],
    ];
  }

  function utilityNetworkCaseWidthExpression() {
    const mode = activeMapLens().id;
    const factor = mode === "utilities-resilience" ? 0.56 : mode === "utilities-capacity" ? 1.24 : mode === "utilities-works" ? 0.64 : 1;
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 0.72, 5, 1.8]],
      13, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 1.28, 5, 3.6]],
      16, ["*", factor, ["interpolate", ["linear"], ["to-number", ["get", "rank"], 1], 1, 1.7, 5, 5.1]],
    ];
  }

  function utilityNetworkContextDashExpression() {
    const mode = activeMapLens().id;
    if (mode === "utilities-capacity") return [1, 0.0001];
    if (mode === "utilities-resilience") return [2.8, 1.25];
    if (mode === "utilities-works") return [2.8, 1.3];
    return [1, 0.0001];
  }

  function lensDetailIntensityExpression() {
    return ["to-number", ["get", "intensity"], 0.35];
  }

  function lensDetailFillOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    const featureOpacity = [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.64, ["==", ["get", "confidence"], "disputed"], 0.72, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
    return [
      "interpolate", ["linear"], ["zoom"],
      5.5, ["*", 1.45, featureOpacity],
      9, ["*", 1.12, featureOpacity],
      13, featureOpacity,
    ];
  }

  function lensDetailLineOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    const featureOpacity = [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.58, ["==", ["get", "confidence"], "disputed"], 0.68, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
    return [
      "interpolate", ["linear"], ["zoom"],
      5.5, ["*", 1.6, featureOpacity],
      9, ["*", 1.18, featureOpacity],
      13, featureOpacity,
    ];
  }

  function lensTraceWidthExpression(low, high) {
    const intensity = lensDetailIntensityExpression();
    const rank = ["min", 1.55, ["max", 0.7, ["to-number", ["get", "rank"], 1]]];
    return [
      "interpolate", ["linear"], ["zoom"],
      5.5, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.28, 1, high * 0.28], rank],
      9, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.42, 1, high * 0.42], rank],
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
      "proposed", "#279aa3",
      "permitted", "#efb24d",
      "planned", "#efb24d",
      "construction", "#7e68b8",
      "completed", "#6f9c7b",
      "demolished", "#d9598e",
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

  function utilityGuidePriorityFactor(low = 0.38, mid = 0.76, high = 1.08, fallback = 0.58) {
    return [
      "interpolate", ["linear"], ["to-number", ["get", "visual_priority"], fallback],
      0, low,
      0.5, mid,
      0.9, high,
      1, high,
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

  function detailUtilityIconLayout(baseSize, allowOverlap) {
    return {
      visibility: "none",
      "icon-image": [
        "match", ["get", "utility_type"],
        "water", "lens-icon-utility-water",
        "electricity", "lens-icon-utility-electricity",
        "telecoms", "lens-icon-utility-telecoms",
        "telecom", "lens-icon-utility-telecoms",
        "gas", "lens-icon-utility-gas",
        "drainage", "lens-icon-utility-drainage",
        "district_energy", "lens-icon-utilities",
        "lens-icon-utilities",
      ],
      "icon-allow-overlap": allowOverlap,
      "icon-ignore-placement": allowOverlap,
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        9, baseSize / 24,
        13, baseSize / 17,
        16, baseSize / 13,
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
      minzoom: 8.2,
      filter: builtFootprintFilter(),
      layout: { visibility: "none" },
      paint: {
        "fill-color": builtFootprintFillColorExpression(),
        "fill-opacity": builtFootprintFillOpacityExpression(),
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-before",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 8.2,
      filter: builtFootprintBeforeFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#cf604c",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.1, 10, 0.16, 14, 0.44, 17, 0.66],
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.18, 10, 0.25, 14, 0.78, 17, 1.15],
        "line-dasharray": [1.1, 1.15],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 8.2,
      filter: builtFootprintFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#f3c7b8",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.12, 10, 0.18, 14, 0.42, 17, 0.66],
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.18, 10, 0.25, 14, 0.75, 17, 1.1],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 8.2,
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
    addLensImage("lens-icon-civic-school", "#178f8f", "civic-school");
    addLensImage("lens-icon-civic-health", "#e85b1e", "civic-health");
    addLensImage("lens-icon-civic-library", "#79419d", "civic-library");
    addLensImage("lens-icon-civic-leisure", "#347db5", "civic-leisure");
    addLensImage("lens-icon-civic-council", "#26858a", "civic-council");
    addLensImage("lens-icon-civic-safety", "#8c5b3a", "civic-safety");
    addLensImage("lens-icon-transport-stop", "#2a84a6", "transport-stop");
    addLensImage("lens-icon-transport-transfer", "#0f8d95", "transport-transfer");
    addLensImage("lens-icon-demand-arrow", "#75418d", "demand-arrow");
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
    } else if (shape?.startsWith("civic-")) {
      ctx.beginPath();
      ctx.roundRect?.(10, 10, 28, 28, 4);
      if (!ctx.roundRect) ctx.rect(10, 10, 28, 28);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,253,247,0.86)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (shape === "civic-health") {
        ctx.moveTo(24, 16);
        ctx.lineTo(24, 32);
        ctx.moveTo(16, 24);
        ctx.lineTo(32, 24);
      } else if (shape === "civic-library") {
        ctx.rect(16, 17, 7, 15);
        ctx.rect(25, 17, 7, 15);
      } else if (shape === "civic-leisure") {
        ctx.moveTo(16, 24);
        ctx.quadraticCurveTo(20, 19, 24, 24);
        ctx.quadraticCurveTo(28, 29, 32, 24);
        ctx.moveTo(17, 30);
        ctx.lineTo(31, 30);
      } else if (shape === "civic-council") {
        ctx.moveTo(16, 19);
        ctx.lineTo(24, 14);
        ctx.lineTo(32, 19);
        ctx.moveTo(18, 31);
        ctx.lineTo(30, 31);
        ctx.moveTo(19, 21);
        ctx.lineTo(19, 30);
        ctx.moveTo(24, 21);
        ctx.lineTo(24, 30);
        ctx.moveTo(29, 21);
        ctx.lineTo(29, 30);
      } else if (shape === "civic-safety") {
        ctx.moveTo(24, 16);
        ctx.lineTo(31, 19);
        ctx.lineTo(30, 28);
        ctx.quadraticCurveTo(24, 34, 18, 28);
        ctx.lineTo(17, 19);
        ctx.closePath();
      } else {
        ctx.moveTo(16, 30);
        ctx.lineTo(16, 21);
        ctx.lineTo(24, 16);
        ctx.lineTo(32, 21);
        ctx.lineTo(32, 30);
        ctx.moveTo(20, 30);
        ctx.lineTo(20, 24);
        ctx.lineTo(28, 24);
        ctx.lineTo(28, 30);
      }
      ctx.stroke();
    } else if (shape === "transport-stop") {
      ctx.beginPath();
      ctx.roundRect?.(10, 10, 28, 28, 5);
      if (!ctx.roundRect) ctx.rect(10, 10, 28, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(32,28,23,0.24)";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = "#fffdf7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(16, 15, 16, 18);
      ctx.moveTo(18, 21);
      ctx.lineTo(30, 21);
      ctx.moveTo(20, 33);
      ctx.lineTo(20, 36);
      ctx.moveTo(28, 33);
      ctx.lineTo(28, 36);
      ctx.stroke();
      ctx.fillStyle = "#fffdf7";
      ctx.beginPath();
      ctx.arc(19, 29, 1.8, 0, Math.PI * 2);
      ctx.arc(29, 29, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "transport-transfer") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.arc(24, 24, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(24, 24, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(32,28,23,0.58)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 11);
      ctx.lineTo(24, 16);
      ctx.moveTo(24, 32);
      ctx.lineTo(24, 37);
      ctx.moveTo(11, 24);
      ctx.lineTo(16, 24);
      ctx.moveTo(32, 24);
      ctx.lineTo(37, 24);
      ctx.stroke();
    } else if (shape === "demand-arrow") {
      ctx.strokeStyle = "rgba(255,253,247,0.88)";
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(9, 24);
      ctx.lineTo(34, 24);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.strokeStyle = "#fffdf7";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(34, 12);
      ctx.lineTo(43, 24);
      ctx.lineTo(34, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(9, 24);
      ctx.lineTo(34, 24);
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
      const isElectric = id.includes("electricity");
      const isWater = id.includes("water");
      const isTelecoms = id.includes("telecoms");
      const isGas = id.includes("gas");
      const isDrainage = id.includes("drainage");
      if (isElectric || isTelecoms) {
        ctx.beginPath();
        ctx.roundRect?.(10, 10, 28, 28, isElectric ? 4 : 3);
        if (!ctx.roundRect) ctx.rect(10, 10, 28, 28);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(24, 24, isGas ? 12 : 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,253,247,0.88)";
      ctx.fillStyle = "rgba(255,253,247,0.88)";
      if (isElectric) {
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(27, 14);
        ctx.lineTo(19, 25);
        ctx.lineTo(25, 25);
        ctx.lineTo(21, 35);
        ctx.lineTo(31, 22);
        ctx.lineTo(25, 22);
        ctx.closePath();
        ctx.fill();
      } else if (isWater || isDrainage) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(24, 24, isDrainage ? 7.5 : 8.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 15);
        ctx.lineTo(24, 20);
        ctx.moveTo(24, 28);
        ctx.lineTo(24, 33);
        if (isDrainage) {
          ctx.moveTo(16, 24);
          ctx.lineTo(21, 24);
          ctx.moveTo(27, 24);
          ctx.lineTo(32, 24);
        }
        ctx.stroke();
      } else if (isTelecoms) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(17, 16, 14, 16);
        ctx.moveTo(19, 22);
        ctx.lineTo(29, 22);
        ctx.moveTo(19, 27);
        ctx.lineTo(29, 27);
        ctx.stroke();
      } else if (isGas) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(24, 24, 6.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 14);
        ctx.lineTo(24, 18);
        ctx.moveTo(24, 30);
        ctx.lineTo(24, 34);
        ctx.stroke();
      } else {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(18, 24);
        ctx.lineTo(30, 24);
        ctx.moveTo(24, 18);
        ctx.lineTo(24, 30);
        ctx.stroke();
      }
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
    state.transportRoadFeatures = [];
    state.transportRoadFeaturesPathLoaded = null;
    state.transportRoadFeaturesByYear.clear();
    state.transportRoadFeatureLoadsByYear.clear();
    clearLensGuideSourceRefreshTimers();
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

    const showTransportRoads = isActiveMapLens("transport") && activeMapLens().id !== "transport-access" && !activeTransportLensYearMissing();
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
      const showHotspots = false;
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
    const showCivicFacilityIcons = isActiveMapLens("civic_services");
    const showEconomyCells = isActiveMapLens("economy");
    const showEconomyFrontage = isActiveMapLens("economy") && aspect.id !== "economy-land-use";
    const showUtilityDetail = isActiveMapLens("utilities");
    const visibilityByLayer = {
      "lens-planning-cells-fill": showPlanningCells,
      "lens-planning-cells-outline": showPlanningCells,
      "lens-civic-coverage-fill": showCivicCells,
      "lens-civic-coverage-outline": showCivicCells,
      "lens-civic-facility-icons": showCivicFacilityIcons,
      "lens-economy-cells-fill": showEconomyCells,
      "lens-economy-cells-outline": showEconomyCells,
      "lens-economy-frontage-case": showEconomyFrontage,
      "lens-economy-frontage": showEconomyFrontage,
      "lens-utilities-trace-case": showUtilityDetail,
      "lens-utilities-trace": showUtilityDetail,
      "lens-utility-asset-icons": showUtilityDetail,
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
    setLayerPaintIfPresent("lens-planning-cells-fill", "fill-opacity", aspect.id === "planning-pressure" ? lensDetailFillOpacity(0.006, 0.04) : aspect.id === "planning-delta" ? lensDetailFillOpacity(0.018, 0.13) : aspect.id === "planning-parcels" ? lensDetailFillOpacity(0.006, 0.032) : lensDetailFillOpacity(0.18, 0.58));
    setLayerPaintIfPresent("lens-planning-cells-outline", "line-opacity", aspect.id === "planning-pressure" ? lensDetailLineOpacity(0.018, 0.085) : aspect.id === "planning-delta" ? lensDetailLineOpacity(0.045, 0.18) : aspect.id === "planning-parcels" ? lensDetailLineOpacity(0.035, 0.12) : lensDetailLineOpacity(0.28, 0.82));
    setLayerPaintIfPresent("lens-civic-coverage-fill", "fill-color", civicCellColorExpression());
    setLayerPaintIfPresent("lens-civic-coverage-outline", "line-color", civicCellColorExpression());
    setLayerPaintIfPresent("lens-civic-coverage-fill", "fill-opacity", aspect.id === "civic-access-gaps" ? lensDetailFillOpacity(0.05, 0.2) : aspect.id === "civic-catchment" ? lensDetailFillOpacity(0.03, 0.12) : aspect.id === "civic-demand" ? lensDetailFillOpacity(0.02, 0.1) : lensDetailFillOpacity(0.16, 0.5));
    setLayerPaintIfPresent("lens-civic-coverage-outline", "line-opacity", aspect.id === "civic-access-gaps" ? lensDetailLineOpacity(0.08, 0.26) : aspect.id === "civic-catchment" ? lensDetailLineOpacity(0.04, 0.12) : aspect.id === "civic-demand" ? lensDetailLineOpacity(0.04, 0.14) : lensDetailLineOpacity(0.18, 0.58));
    setLayerPaintIfPresent("lens-economy-cells-fill", "fill-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-cells-outline", "line-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-cells-fill", "fill-opacity", aspect.id === "economy-land-use" ? lensDetailFillOpacity(0.34, 0.76) : aspect.id === "economy-vitality" ? lensDetailFillOpacity(0.015, 0.065) : lensDetailFillOpacity(0.04, 0.16));
    setLayerPaintIfPresent("lens-economy-cells-outline", "line-opacity", aspect.id === "economy-land-use" ? lensDetailLineOpacity(0.32, 0.8) : aspect.id === "economy-vitality" ? lensDetailLineOpacity(0.025, 0.12) : lensDetailLineOpacity(0.06, 0.28));
    setLayerPaintIfPresent("lens-economy-frontage", "line-color", economyCellColorExpression());
    setLayerPaintIfPresent("lens-economy-frontage-case", "line-opacity", aspect.id === "economy-vitality" ? lensDetailLineOpacity(0.42, 0.78) : lensDetailLineOpacity(0.24, 0.58));
    setLayerPaintIfPresent("lens-economy-frontage", "line-opacity", aspect.id === "economy-vitality" ? lensDetailLineOpacity(0.72, 1) : lensDetailLineOpacity(0.36, 0.92));
    setLayerPaintIfPresent("lens-economy-frontage-case", "line-width", aspect.id === "economy-vitality" ? lensTraceWidthExpression(3.2, 8.8) : lensTraceWidthExpression(2.6, 8.4));
    setLayerPaintIfPresent("lens-economy-frontage", "line-width", aspect.id === "economy-vitality" ? lensTraceWidthExpression(1.35, 4.8) : lensTraceWidthExpression(1.05, 4.9));
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
      state.map.setLayoutProperty("lens-utility-network-assets", "icon-size", [
        "interpolate", ["linear"], ["zoom"],
        10, ["*", 0.22, utilityNetworkAssetSizeFactorExpression()],
        14, ["*", 0.32, utilityNetworkAssetSizeFactorExpression()],
        16, ["*", 0.45, utilityNetworkAssetSizeFactorExpression()],
      ]);
      state.map.setPaintProperty("lens-utility-network-assets", "icon-opacity", utilityNetworkAssetOpacityExpression());
    }
  }

  function setLayerPaintIfPresent(layerId, prop, value) {
    if (state.map?.getLayer(layerId)) state.map.setPaintProperty(layerId, prop, value);
  }

  function updateLensGuideLayers() {
    if (!state.map?.getSource(LENS_GUIDE_SOURCE_ID)) return;
    const lens = activeMapLens();
    const showGuide = Boolean(lens && state.activeLayers.has(lens.category || state.activeLens));
    const showRings = showGuide && ["transport-speed", "transport-reliability", "planning-pressure", "planning-delta", "planning-parcels", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id);
    const showCells = showGuide && ["transport-access", "planning-pressure", "planning-delta", "planning-parcels", "civic-catchment", "civic-demand", "economy-land-use", "utilities-resilience"].includes(lens.id);
    const showFlows = showGuide && ["transport-speed", "transport-access", "transport-reliability", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand", "economy-vitality", "economy-gravity", "utilities-capacity", "utilities-resilience", "utilities-works"].includes(lens.id);
    const showNodes = showGuide && ["transport-speed", "transport-access", "transport-reliability", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand", "economy-vitality", "economy-gravity", "utilities-resilience", "utilities-capacity", "utilities-works"].includes(lens.id);
    const visibility = {
      "lens-guide-area-fill": showGuide,
      "lens-guide-area-line": showGuide,
      "lens-guide-ring-line": showRings,
      "lens-guide-cell-fill": showCells,
      "lens-guide-cell-line": showCells,
      "lens-guide-parcel-hatch": showCells && lens.id === "planning-parcels",
      "lens-guide-coverage-flow-case": showFlows && lens.id === "civic-access-gaps",
      "lens-guide-coverage-flow": showFlows && lens.id === "civic-access-gaps",
      "lens-guide-flow-case": showFlows,
      "lens-guide-flow": showFlows,
      "lens-guide-flow-arrow": showFlows && ["civic-demand", "economy-gravity", "transport-speed"].includes(lens.id),
      "lens-guide-works-type-symbol": showFlows && lens.id === "utilities-works",
      "lens-guide-works-symbol": showFlows && lens.id === "utilities-works",
      "lens-guide-node": showNodes,
      "lens-guide-icon-node": showNodes,
    };
    const cellFilter = guideCellLayerFilter(lens);
    for (const layerId of ["lens-guide-cell-fill", "lens-guide-cell-line"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, cellFilter);
    }
    if (state.map.getLayer("lens-guide-parcel-hatch")) {
      state.map.setFilter("lens-guide-parcel-hatch", guideParcelHatchLayerFilter(lens));
    }
    const seamFlowFilter = guideSeamFlowLayerFilter(lens);
    const coverageFlowFilter = guideCoverageFlowLayerFilter(lens);
    for (const layerId of ["lens-guide-flow-case", "lens-guide-flow"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, seamFlowFilter);
    }
    if (state.map.getLayer("lens-guide-flow-arrow")) {
      state.map.setFilter("lens-guide-flow-arrow", [
        "all",
        seamFlowFilter,
        ["match", ["get", "flow_style"], ["demand_displacement", "economy_gravity_arc", "transport_backbone"], true, false],
      ]);
    }
    if (state.map.getLayer("lens-guide-works-symbol")) {
      state.map.setFilter("lens-guide-works-symbol", [
        "all",
        seamFlowFilter,
        ["==", ["get", "flow_style"], "utility_work_thread"],
        [">=", ["to-number", ["get", "symbol_priority"], 0], 0.62],
      ]);
    }
    if (state.map.getLayer("lens-guide-works-type-symbol")) {
      state.map.setFilter("lens-guide-works-type-symbol", [
        "all",
        seamFlowFilter,
        ["==", ["get", "flow_style"], "utility_work_thread"],
        [">=", ["to-number", ["get", "type_symbol_priority"], 0], 0.58],
      ]);
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
      state.map.setPaintProperty("lens-guide-cell-line", "line-dasharray", lens.id === "utilities-resilience" ? [3.2, 1.6] : lens.id === "transport-access" ? [2.6, 1.7] : [1, 0.01]);
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
      for (const layerId of ["lens-transport-base-case", "lens-transport-base", "lens-transport-roads-case", "lens-transport-roads", "lens-transport-hotspots", "lens-guide-node", "lens-guide-icon-node", "lens-transport-event-halo", "lens-transport-event-points"]) {
        if (state.map.getLayer(layerId)) {
          try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
        }
      }
    } else if (lens?.category === "transport") {
      for (const layerId of ["lens-guide-area-line", "lens-guide-ring-line", "lens-guide-flow-case", "lens-guide-flow", "lens-guide-node", "lens-guide-icon-node", "lens-transport-event-halo", "lens-transport-event-points"]) {
        if (state.map.getLayer(layerId)) {
          try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
        }
      }
    } else if (lens?.id === "civic-access-gaps") {
      for (const layerId of ["lens-guide-area-line", "lens-guide-ring-line", "lens-guide-node", "lens-guide-icon-node"]) {
        if (state.map.getLayer(layerId)) {
          try { state.map.moveLayer(layerId); } catch (_error) { /* layer order is best-effort */ }
        }
      }
    }
    renderLensGuideLabels();
  }

  function guideFlowDashExpression(lens = activeMapLens()) {
    const staticDashByLens = {
      "civic-access-gaps": [1.35, 1.05],
      "civic-catchment": [3.4, 1.2],
      "economy-vitality": [1, 0.0001],
      "economy-gravity": [1, 0.0001],
      "transport-speed": [1, 0.0001],
      "transport-access": [1, 0.0001],
      "transport-reliability": [1, 0.0001],
      "utilities-capacity": [1, 0.0001],
      "utilities-resilience": [2.8, 1.35],
      "utilities-works": [1, 0.0001],
    };
    return staticDashByLens[lens?.id] || [1, 0.0001];
  }

  function guideCellLayerFilter(lens = activeMapLens()) {
    const base = ["==", ["get", "kind"], "surface_cell"];
    if (lens?.id === "planning-pressure") {
      const active = activeSublayerIdsForLens(lens);
      return [
        "all",
        base,
        [
          "any",
          ["==", ["get", "source_kind"], "current_context"],
          ["==", ["get", "evidence_role"], "context_not_year_specific_change_evidence"],
          active.length
            ? ["match", ["get", "sublayer_id"], active, true, false]
            : ["==", ["get", "sublayer_id"], "__none__"],
        ],
      ];
    }
    if (["civic-catchment", "civic-demand"].includes(lens?.id)) return guideSublayerFilter(base, lens);
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

  function guideParcelHatchLayerFilter(lens = activeMapLens()) {
    const base = ["==", ["get", "kind"], "parcel_hatch"];
    if (lens?.id !== "planning-parcels") return ["all", base, ["==", ["get", "lens_id"], "__none__"]];
    const activeStatuses = [...state.activeAspectLayers].filter(Boolean);
    return [
      "all",
      base,
      ["==", ["get", "lens_id"], "planning-parcels"],
      activeStatuses.length
        ? ["match", ["get", "sublayer_id"], activeStatuses, true, false]
        : ["==", ["get", "sublayer_id"], "__none__"],
    ];
  }

  function guideSeamFlowLayerFilter(lens = activeMapLens()) {
    const base = ["all", ["==", ["get", "kind"], "flow"], ["!=", ["get", "flow_role"], "coverage"]];
    if (lens?.id === "planning-pressure") {
      return [
        "all",
        guideSublayerFilter(base, lens),
        [
          "any",
          [
            "all",
            ["==", ["get", "flow_style"], "planning_pressure_spine"],
            [">=", ["to-number", ["get", "intensity"], 0], 0.56],
          ],
          [
            "all",
            ["==", ["get", "flow_style"], "planning_pressure_edge"],
            [">=", ["to-number", ["get", "intensity"], 0], 0.28],
          ],
          [
            "all",
            ["==", ["get", "flow_style"], "planning_pressure_cell_edge"],
            [">=", ["to-number", ["get", "intensity"], 0], 0.24],
          ],
          [
            "all",
            ["==", ["get", "flow_style"], "planning_pressure_trace"],
            [">=", ["to-number", ["get", "intensity"], 0], 0.16],
          ],
        ],
      ];
    }
    if (lens?.id === "utilities-works") {
      return [
        "all",
        guideSublayerFilter(base, lens),
        [">=", ["to-number", ["get", "visual_priority"], 0], 0.08],
      ];
    }
    if (lens?.id === "utilities-capacity" || lens?.id === "utilities-resilience") {
      return [
        "all",
        base,
        [">=", ["to-number", ["get", "visual_priority"], 0], lens?.id === "utilities-capacity" ? 0.12 : 0.16],
      ];
    }
    return guideSublayerFilter(base, lens);
  }

  function guideCoverageFlowLayerFilter(lens = activeMapLens()) {
    const base = ["all", ["==", ["get", "kind"], "flow"], ["==", ["get", "flow_role"], "coverage"]];
    if (lens?.id !== "civic-access-gaps") return base;
    return [...base, civicAccessActiveSublayerFilter(["coverage"])];
  }

  function guideNodeLayerFilter(lens = activeMapLens()) {
    if (lens?.id === "transport-reliability") {
      return [
        "all",
        ["==", ["get", "kind"], "node"],
        ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]],
      ];
    }
    if (lens?.id?.startsWith("transport-")) {
      return [
        "all",
        ["==", ["get", "kind"], "node"],
        ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]],
      ];
    }
    const base = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["!=", ["get", "node_style"], "transport_route"],
      ["!=", ["get", "node_style"], "utility_trace"],
      ["!=", ["get", "node_style"], "civic_anchor"],
      ["!=", ["get", "node_style"], "planning_document"],
    ];
    if (lens?.id === "economy-gravity") return guideSublayerFilter([...base, ["==", ["get", "node_style"], "economy_anchor"]], lens);
    if (lens?.id === "economy-vitality") return ["all", base, ["==", ["get", "node_style"], "__none__"]];
    if (lens?.id === "civic-catchment") return guideSublayerFilter(base, lens);
    if (lens?.id !== "civic-access-gaps") return base;
    return [...base, ["!=", ["get", "node_style"], "transport"], civicAccessActiveSublayerFilter(["coverage", "facilities"])];
  }

  function guideIconNodeLayerFilter(lens = activeMapLens()) {
    if (lens?.id?.startsWith("transport-")) {
      return [
        "all",
        ["==", ["get", "kind"], "node"],
        ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "transport_route"]],
      ];
    }
    if (lens?.id === "civic-access-gaps") {
      return [
        "all",
        ["==", ["get", "kind"], "node"],
        ["any", ["==", ["get", "node_style"], "transport"], ["==", ["get", "node_style"], "civic_anchor"]],
        civicAccessActiveSublayerFilter(["coverage", "facilities"]),
      ];
    }
    const civicBase = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "civic_anchor"],
    ];
    if (lens?.id === "civic-demand") return [...civicBase, civicAccessActiveSublayerFilter(["facilities"])];
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
    if (lens?.id === "economy-gravity") {
      return guideSublayerFilter([
        "all",
        ["==", ["get", "kind"], "node"],
        ["==", ["get", "node_style"], "economy_anchor"],
      ], lens);
    }
    const utilityBase = [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "utility_trace"],
    ];
    if (lens?.id === "utilities-works") return guideSublayerFilter(utilityBase, lens);
    if (lens?.id === "utilities-capacity" || lens?.id === "utilities-resilience") {
      return [
        "all",
        utilityBase,
        [
          "any",
          ["!=", ["get", "detail_layer"], "utility_trace"],
          [">=", ["to-number", ["get", "intensity"], 0], 0.55],
        ],
      ];
    }
    return [
      "all",
      ["==", ["get", "kind"], "node"],
      ["==", ["get", "node_style"], "utility_trace"],
    ];
  }

  function guideSublayerFilter(base, lens = activeMapLens()) {
    if (!["economy-gravity", "economy-vitality", "civic-catchment", "civic-demand", "planning-pressure", "utilities-works"].includes(lens?.id)) return base;
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
      const filter = layerId === "lens-built-footprints-year"
        ? builtFootprintYearFilter()
        : layerId === "lens-built-footprints-before"
          ? builtFootprintBeforeFilter()
          : builtFootprintFilter();
      state.map.setFilter(layerId, filter);
      const layerVisible = layerId === "lens-built-footprints-before"
        ? showBuilt && aspect.id === "planning-delta"
        : showBuilt;
      state.map.setLayoutProperty(layerId, "visibility", layerVisible ? "visible" : "none");
    }
    if (state.map.getLayer("lens-built-footprints-fill")) {
      state.map.setPaintProperty("lens-built-footprints-fill", "fill-color", builtFootprintFillColorExpression());
      state.map.setPaintProperty("lens-built-footprints-fill", "fill-opacity", builtFootprintFillOpacityExpression());
    }
    if (state.map.getLayer("lens-built-footprints-before")) {
      state.map.setPaintProperty("lens-built-footprints-before", "line-color", aspect.id === "planning-delta" ? "#cf6a57" : "#f3c7b8");
      state.map.setPaintProperty("lens-built-footprints-before", "line-opacity", ["interpolate", ["linear"], ["zoom"], 8, 0.1, 10, 0.16, 14, aspect.id === "planning-delta" ? 0.5 : 0.32, 17, aspect.id === "planning-delta" ? 0.68 : 0.48]);
      state.map.setPaintProperty("lens-built-footprints-before", "line-width", ["interpolate", ["linear"], ["zoom"], 8, 0.18, 10, 0.25, 14, 0.78, 17, 1.15]);
      state.map.setPaintProperty("lens-built-footprints-before", "line-dasharray", [1.1, 1.15]);
    }
    if (state.map.getLayer("lens-built-footprints-outline")) {
      state.map.setPaintProperty("lens-built-footprints-outline", "line-color", aspect.id === "planning-delta" ? "#e6b09d" : "#f3c7b8");
      state.map.setPaintProperty("lens-built-footprints-outline", "line-opacity", ["interpolate", ["linear"], ["zoom"], 8, aspect.id === "planning-delta" ? 0.08 : 0.12, 10, aspect.id === "planning-delta" ? 0.12 : 0.18, 14, aspect.id === "planning-delta" ? 0.28 : 0.42, 17, aspect.id === "planning-delta" ? 0.42 : 0.66]);
    }
    if (state.map.getLayer("lens-built-footprints-year")) {
      state.map.setPaintProperty("lens-built-footprints-year", "line-color", aspect.id === "planning-delta" ? "#8f4a3e" : "#201c17");
      state.map.setPaintProperty("lens-built-footprints-year", "line-opacity", aspect.id === "planning-delta" ? 0.28 : 0.72);
      state.map.setPaintProperty("lens-built-footprints-year", "line-width", ["interpolate", ["linear"], ["zoom"], 8, aspect.id === "planning-delta" ? 0.24 : 0.42, 11, aspect.id === "planning-delta" ? 0.45 : 0.8, 15, aspect.id === "planning-delta" ? 1.1 : 1.7, 17, aspect.id === "planning-delta" ? 1.65 : 2.4]);
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
    if (!path) {
      source.setData(emptyFeatureCollection());
      state.transportRoadYearPathLoaded = "";
      state.transportRoadYearLoaded = null;
      updateTransportRoadFeatureCount("", currentTimelineYear());
      return;
    }
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
        state.transportRoadFeaturesByYear.set(Number(year), features);
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

  function transportRoadFeaturesForYear(year = currentTimelineYear()) {
    const targetYear = Number(year) || currentTimelineYear();
    if (state.transportRoadFeatureCountYearLoaded === targetYear && state.transportRoadFeaturesPathLoaded === transportRoadYearPath(targetYear)) {
      return state.transportRoadFeatures || [];
    }
    if (state.transportRoadFeaturesByYear.has(targetYear)) {
      return state.transportRoadFeaturesByYear.get(targetYear) || [];
    }
    requestTransportRoadFeaturesForYear(targetYear);
    return [];
  }

  function requestTransportRoadFeaturesForYear(year = currentTimelineYear()) {
    const targetYear = Number(year) || currentTimelineYear();
    if (state.transportRoadFeaturesByYear.has(targetYear) || state.transportRoadFeatureLoadsByYear.has(targetYear)) return;
    const path = transportRoadYearPath(targetYear);
    if (!path) {
      state.transportRoadFeaturesByYear.set(targetYear, []);
      return;
    }
    const promise = fetch(path, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${path} -> ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (transportRoadYearPath(targetYear) !== path) return [];
        const features = Array.isArray(payload.features) ? payload.features : [];
        state.transportRoadFeaturesByYear.set(targetYear, features);
        if (targetYear === state.year) {
          state.transportRoadFeatureCount = features.length;
          state.transportRoadFeatureCountYearLoaded = targetYear;
          state.transportRoadFeaturesPathLoaded = path;
          state.transportRoadFeatures = features;
        }
        updateLensGuideSource();
        renderLensLegend();
        renderDetail();
        return features;
      })
      .catch((error) => {
        console.warn(`[atlas] transport road activity unavailable for ${targetYear}`, error);
        if (transportRoadYearPath(targetYear) !== path) return [];
        state.transportRoadFeaturesByYear.set(targetYear, []);
        renderDetail();
        return [];
      })
      .finally(() => {
        if (state.transportRoadFeatureLoadsByYear.get(targetYear) === promise) {
          state.transportRoadFeatureLoadsByYear.delete(targetYear);
        }
      });
    state.transportRoadFeatureLoadsByYear.set(targetYear, promise);
  }

  function shouldLoadTransportStops() {
    return ["transport-speed", "transport-access", "transport-reliability", "civic-access-gaps"].includes(activeMapLens()?.id);
  }

  function shouldLoadEconomyAnchors() {
    return ["economy-vitality", "economy-gravity"].includes(activeMapLens()?.id) && state.activeLayers.has("economy");
  }

  function shouldLoadCivicServiceContext() {
    return ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeMapLens()?.id) && state.activeLayers.has("civic_services");
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
      refreshLensDetailYearSourceFromCache();
      return;
    }
    source.setData(state.areaFilter ? emptyFeatureCollection() : path);
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
    if (state.lensDetailFeaturePathLoaded === path) {
      refreshLensDetailYearSourceFromCache();
      return;
    }
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
        refreshLensDetailYearSourceFromCache();
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
        renderDetail();
      })
      .catch((error) => {
        if (state.lensDetailFeaturePathLoaded !== path) return;
        state.lensDetailFeatures = [];
        refreshLensDetailYearSourceFromCache();
        console.warn("[atlas] lens detail cache unavailable", error);
        updateLensGuideSource();
        renderLayers();
        renderLensLegend();
      });
  }

  function refreshLensDetailYearSourceFromCache() {
    const source = state.map?.getSource(LENS_DETAIL_SOURCE_ID);
    if (!source?.setData || !state.lensDetailYearPathLoaded) return false;
    if (!state.areaFilter) {
      if (state.lensDetailYearPathLoaded) source.setData(state.lensDetailYearPathLoaded);
      return true;
    }
    const features = (state.lensDetailFeatures || []).filter((feature) => lensDetailFeatureMatchesArea(feature));
    source.setData({ type: "FeatureCollection", features });
    return true;
  }

  function lensDetailFeatureMatchesArea(feature) {
    if (!state.areaFilter) return true;
    const props = feature?.properties || {};
    if (props.coverage_status === "no_same_category_records") return true;
    const ids = String(props.event_ids_all || props.event_ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.some((id) => {
      const event = state.eventById.get(id);
      return event && eventMatchesAreaFilter(event);
    })) return true;
    return areaTextMatchesQuery([
      props.area,
      props.affected_area_label,
      props.label,
      props.title,
      props.representation,
    ].filter(Boolean).join(" "));
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
    state.lensGuideFeatureCache = collection;
    setLensGuideSourceData(collection);
    if (state.map?.getLayer("lens-guide-flow")) updateLensGuideLayers();
    else renderLensGuideLabels();
    renderLayers();
    renderTimeline();
  }

  function setLensGuideSourceData(collection = state.lensGuideFeatureCache) {
    const source = state.map?.getSource(LENS_GUIDE_SOURCE_ID);
    if (!source?.setData) return false;
    source.setData(collection || emptyFeatureCollection());
    clearLensGuideSourceRefreshTimers();
    const reapplyLatest = () => {
      const latestSource = state.map?.getSource(LENS_GUIDE_SOURCE_ID);
      if (!latestSource?.setData) return;
      latestSource.setData(state.lensGuideFeatureCache || emptyFeatureCollection());
      if (state.map?.getLayer("lens-guide-flow")) updateLensGuideLayers();
      state.map?.triggerRepaint?.();
    };
    for (const delay of [120, 520, 1200, 2200]) {
      state.lensGuideSourceRefreshTimers.push(setTimeout(reapplyLatest, delay));
    }
    state.map?.once?.("idle", reapplyLatest);
    return true;
  }

  function clearLensGuideSourceRefreshTimers() {
    for (const timer of state.lensGuideSourceRefreshTimers || []) clearTimeout(timer);
    state.lensGuideSourceRefreshTimers = [];
  }

  function lensGuideFeatureCollection() {
    // Strict source-only mode: no procedural guide geometry or coverage filler.
    return emptyFeatureCollection();
    const lens = activeMapLens();
    const center = state.selectedEvent?.lngLat || currentMapCenter();
    const radiusM = lensEffectiveRadiusM(lens);
    const features = [];
    const accent = lens.accent || LAYER_BY_ID.get(lens.category)?.color || "#1b7a85";
    const guideAccent = ["civic-access-gaps", "civic-catchment", "planning-pressure", "planning-delta"].includes(lens.id) ? "#6e9baa" : accent;
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
    } else if (["planning-pressure", "planning-delta", "planning-parcels"].includes(lens.id)) {
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

    if (["transport-speed", "transport-access", "transport-reliability", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand", "economy-vitality", "economy-gravity", "utilities-capacity", "utilities-resilience", "utilities-works"].includes(lens.id)) {
      features.push(...flowGuideFeatures(center, lens));
    }
    if (["transport-speed", "transport-access", "transport-reliability", "economy-vitality", "economy-gravity", "utilities-resilience", "utilities-capacity", "utilities-works", "planning-pressure", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id)) {
      features.push(...nodeGuideFeatures(center, lens));
    }
    return { type: "FeatureCollection", features: annotateMissingCoverageGuideFeatures(features, lens, currentTimelineYear()) };
  }

  function annotateMissingCoverageGuideFeatures(features, lens, year) {
    if (!lensMissingSameCategoryCoverageForYear(lens, year)) return features;
    return features.map((feature) => {
      const props = feature.properties || {};
      if (props.lens_id !== lens.id) return feature;
      const rawSourceKind = String(props.source_kind || "");
      const sourceKind = rawSourceKind && !/source[_ -]?backed|selected[_ -]?year/i.test(rawSourceKind)
        ? rawSourceKind
        : "current_context";
      return {
        ...feature,
        properties: {
          ...props,
          source_kind: sourceKind,
          context_year: props.context_year || "current_mapped_context",
          evidence_role: "context_not_year_specific_change_evidence",
          coverage_note: props.coverage_note || "No same-category records for the selected year; this guide geometry is context only.",
        },
      };
    });
  }

  function rangeRingFeatures(center, radiusM, lens, accent) {
    if (!["transport-speed", "transport-reliability", "planning-pressure", "planning-delta", "planning-parcels", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(lens.id)) return [];
    const stops = lens.id === "civic-access-gaps"
      ? [1]
      : ["planning-pressure", "planning-delta", "planning-parcels"].includes(lens.id)
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
    if (lensId === "planning-pressure") return 4400;
    if (lensId === "planning-delta") return 2200;
    if (lensId === "planning-parcels") return 3400;
    if (lensId === "economy-land-use") return 4600;
    if (lensId === "civic-demand") return 5600;
    if (lensId === "civic-catchment") return 3200;
    return 180;
  }

  function transportAccessFabricCells(center, radiusM, lens) {
    const anchors = nearbyTransportRoadAnchors(center, radiusM * 3.25, 1150);
    if (!anchors.length) return transportAccessRadialCells(center, radiusM, lens);
    const transportStops = civicAccessTransportStopsNear(center, radiusM * 2.95);
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "transport" && event.lngLat);
    const bands = transportAccessIsochroneBands(center, radiusM, lens, anchors, transportStops, sourceEvents);
    const cells = [];
    const stepM = 62;
    const extentM = radiusM * 2.42;
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.82) {
      const rowOffset = row % 2 ? stepM * 0.5 : 0;
      for (let dx = -extentM + rowOffset; dx <= extentM; dx += stepM) {
        const cellCenter = offsetLngLat(center, dx, dy);
        const radial = lngLatDistanceMeters(center, cellCenter);
        const nearestRoad = nearestRoadAnchor(cellCenter, anchors, 430);
        const roadCloseness = nearestRoad ? clamp01(1 - nearestRoad.distance / 430) : 0;
        const roadBoost = nearestRoad ? roadCloseness * (0.5 + nearestRoad.activity * 0.36 + Math.min(0.14, nearestRoad.rank * 0.035)) : 0;
        const stopDensity = civicAccessStopDensity(cellCenter, transportStops, 560);
        const stopBoost = stopDensity * 0.72;
        const nearestEvent = nearestGuideEvent(cellCenter, sourceEvents, radiusM * 1.55);
        const eventBoost = nearestEvent ? 1 - Math.min(radiusM * 1.55, lngLatDistanceMeters(cellCenter, nearestEvent.lngLat)) / (radiusM * 1.55) : 0;
        const angle = Math.atan2(dy, dx);
        const anchorSeed = stableUnit(`${nearestRoad?.id || ""}:${Math.round((nearestRoad?.point?.[0] || center[0]) * 10000)}`);
        const streetReach = nearestRoad
          ? 0.98 + nearestRoad.activity * 0.62 + Math.min(0.24, nearestRoad.rank * 0.055)
          : 0.86;
        const directionalReach = 1
          + Math.sin(angle * 2.2 + anchorSeed * Math.PI * 2) * 0.24
          + Math.cos(angle * 4.4 + anchorSeed * Math.PI) * 0.14
          + Math.sin(angle * 7.1 + stopDensity * Math.PI * 2) * 0.08;
        const reachM = Math.max(radiusM * 0.88, radiusM * streetReach * directionalReach + roadBoost * 380 + stopBoost * 600 + eventBoost * 180);
        const offNetworkPenalty = nearestRoad ? Math.max(0, nearestRoad.distance - 78) / 11.2 : 20;
        const radialMinutes = 12 + Math.pow(radial / Math.max(1, extentM), 1.1) * 66;
        const networkMinutes = 8.5
          + Math.pow(radial / Math.max(1, reachM), 1.12) * 64
          + Math.max(0, radial - reachM) / 18;
        const angularNoise = Math.sin(angle * 5.5 + anchorSeed * Math.PI * 2) * 2.2
          + Math.cos(angle * 8.3 - anchorSeed * Math.PI) * 1.4;
        const minutes = Math.max(5, networkMinutes * 0.87 + radialMinutes * 0.13 + offNetworkPenalty + angularNoise + 5.6
          - roadBoost * 4.8
          - stopBoost * 8.2
          - eventBoost * 2.2);
        if (minutes > 92) continue;
        const intensity = clamp01(1 - (minutes - 8) / 86);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "access_fabric",
            fabric_shape: "access_cell",
            intensity: Number(intensity.toFixed(3)),
            minutes: Math.round(minutes),
            color: accessBandColor(minutes),
            event_id: nearestEvent?.id || "",
            stop_density: Number(stopDensity.toFixed(3)),
            score: Number((intensity + roadBoost * 0.22 + stopBoost * 0.18 + stableUnit(`${dx}:${dy}`) * 0.025).toFixed(3)),
          },
          geometry: hexPolygon(cellCenter, stepM * (0.9 + roadCloseness * 0.05 + stopDensity * 0.04)),
        });
      }
      row += 1;
    }
    const cellLimit = Math.max(0, guideCellLimit(lens.id) - bands.length);
    return [
      ...bands,
      ...cells
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, cellLimit),
    ];
  }

  function transportAccessIsochroneBands(center, radiusM, lens, anchors, transportStops, sourceEvents) {
    const extentM = radiusM * 2.25;
    const steps = 156;
    const roadVectors = anchors.map((anchor) => {
      const local = lngLatToLocalMeters(anchor.point, center);
      return {
        angle: Math.atan2(local[1], local[0]),
        distance: Math.hypot(local[0], local[1]),
        strength: clamp01(0.2 + Number(anchor.activity || 0) * 0.58 + Math.min(0.22, Number(anchor.rank || 1) * 0.06)),
      };
    });
    const stopVectors = transportStops.map((stop) => {
      const local = lngLatToLocalMeters(stop.point, center);
      return {
        angle: Math.atan2(local[1], local[0]),
        distance: Math.hypot(local[0], local[1]),
        strength: clamp01(0.28 + Number(stop.weight || 0.35) * 0.72),
      };
    });
    const eventVectors = sourceEvents.map((event) => {
      const local = lngLatToLocalMeters(event.lngLat, center);
      return {
        angle: Math.atan2(local[1], local[0]),
        distance: Math.hypot(local[0], local[1]),
        strength: 0.55,
      };
    });
    const directionalScore = (vectors, angle, reachM, angularReach) => {
      let score = 0;
      for (const vector of vectors) {
        if (!Number.isFinite(vector.distance) || vector.distance > reachM) continue;
        const angular = angularDistanceRadians(angle, vector.angle);
        if (angular > angularReach) continue;
        const angleWeight = 1 - angular / angularReach;
        const distanceWeight = 1 - Math.min(reachM, vector.distance) / reachM;
        score += angleWeight * distanceWeight * vector.strength;
      }
      return clamp01(score);
    };
    const directionalBandScore = (vectors, angle, targetRadius, radialSpread, angularReach) => {
      let score = 0;
      for (const vector of vectors) {
        if (!Number.isFinite(vector.distance)) continue;
        const angular = angularDistanceRadians(angle, vector.angle);
        if (angular > angularReach) continue;
        const radial = Math.abs(vector.distance - targetRadius);
        if (radial > radialSpread) continue;
        const angleWeight = 1 - angular / angularReach;
        const radialWeight = 1 - radial / radialSpread;
        score += angleWeight * radialWeight * vector.strength;
      }
      return clamp01(score);
    };
    const directionalRadialShift = (vectors, angle, targetRadius, radialSpread, angularReach) => {
      let weightedShift = 0;
      let totalWeight = 0;
      for (const vector of vectors) {
        if (!Number.isFinite(vector.distance)) continue;
        const angular = angularDistanceRadians(angle, vector.angle);
        if (angular > angularReach) continue;
        const radial = Math.abs(vector.distance - targetRadius);
        if (radial > radialSpread) continue;
        const angleWeight = 1 - angular / angularReach;
        const radialWeight = 1 - radial / radialSpread;
        const weight = angleWeight * radialWeight * vector.strength;
        const shift = Math.max(-0.3, Math.min(0.3, (vector.distance - targetRadius) / Math.max(1, targetRadius)));
        weightedShift += shift * weight;
        totalWeight += weight;
      }
      return totalWeight ? Math.max(-0.24, Math.min(0.24, weightedShift / totalWeight)) : 0;
    };
    const bands = [
      { minutes: 72, radius: extentM * 1.08, intensity: 0.16 },
      { minutes: 60, radius: extentM * 0.9, intensity: 0.32 },
      { minutes: 45, radius: extentM * 0.69, intensity: 0.52 },
      { minutes: 30, radius: extentM * 0.51, intensity: 0.72 },
      { minutes: 15, radius: extentM * 0.32, intensity: 0.94 },
    ];
    const bandRings = bands.map((band, bandIndex) => {
      const radii = [];
      for (let i = 0; i <= steps; i += 1) {
        const angle = (i / steps) * Math.PI * 2;
        const roadScore = directionalScore(roadVectors, angle, extentM * 1.25, 0.46);
        const stopScore = directionalScore(stopVectors, angle, extentM * 1.1, 0.4);
        const eventScore = directionalScore(eventVectors, angle, extentM * 0.95, 0.34);
        const roadEdge = directionalBandScore(roadVectors, angle, band.radius, extentM * 0.24, 0.32);
        const stopEdge = directionalBandScore(stopVectors, angle, band.radius, extentM * 0.2, 0.28);
        const roadShift = directionalRadialShift(roadVectors, angle, band.radius, extentM * 0.34, 0.28);
        const stopShift = directionalRadialShift(stopVectors, angle, band.radius, extentM * 0.28, 0.24);
        const eventShift = directionalRadialShift(eventVectors, angle, band.radius, extentM * 0.3, 0.22);
        const seed = stableUnit(`${lens.id}:${band.minutes}:${i}`);
        const fineGrain = Math.sin(angle * 5 + seed * Math.PI * 2) * 0.046
          + Math.cos(angle * 9 - seed * Math.PI) * 0.03
          + Math.sin(angle * 13 + roadEdge * Math.PI * 2) * 0.034;
        const warmTightness = band.minutes <= 15 ? 0.95 : band.minutes <= 30 ? 0.98 : 1;
        const accessStretch = 0.7
          + roadScore * 0.14
          + stopScore * 0.1
          + roadEdge * 0.48
          + stopEdge * 0.34
          + eventScore * 0.06
          + roadShift * 0.42
          + stopShift * 0.28
          + eventShift * 0.12
          + fineGrain;
        const offNetworkTaper = 1 - Math.max(0, 0.42 - roadScore - stopScore * 0.85) * (band.minutes <= 30 ? 0.28 : 0.18);
        const outerTaper = bandIndex < 2 ? 1 - Math.max(0, stopScore - 0.55) * 0.04 : 1;
        const radius = band.radius * Math.max(0.62, Math.min(1.32, accessStretch * warmTightness * offNetworkTaper * outerTaper));
        radii.push(radius);
      }
      return { band, bandIndex, radii, ring: [] };
    });
    for (let i = 0; i <= steps; i += 1) {
      for (let index = bandRings.length - 2; index >= 0; index -= 1) {
        const minGapM = extentM * (0.034 + index * 0.002);
        bandRings[index].radii[i] = Math.max(bandRings[index].radii[i], bandRings[index + 1].radii[i] + minGapM);
      }
    }
    for (const bandRing of bandRings) {
      bandRing.radii[steps] = bandRing.radii[0];
      bandRing.ring = bandRing.radii.map((radius, i) => {
        const angle = (i / steps) * Math.PI * 2;
        return offsetLngLat(center, Math.cos(angle) * radius, Math.sin(angle) * radius);
      });
    }
    return bandRings.map(({ band, bandIndex, ring }, index) => {
      const innerRing = bandRings[index + 1]?.ring;
      return {
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "access_fabric",
          fabric_shape: "isochrone_band",
          intensity: band.intensity,
          minutes: band.minutes,
          color: accessBandColor(band.minutes),
          event_id: sourceEvents[0]?.id || "",
          stop_density: Number(clamp01(stopVectors.length / 56).toFixed(3)),
          score: Number((1 - bandIndex * 0.12).toFixed(3)),
        },
        geometry: { type: "Polygon", coordinates: innerRing ? [ring, innerRing.slice().reverse()] : [ring] },
      };
    });
  }

  function angularDistanceRadians(a, b) {
    const diff = Math.abs(a - b) % (Math.PI * 2);
    return diff > Math.PI ? Math.PI * 2 - diff : diff;
  }

  function transportAccessNetworkFlowFeatures(center, lens) {
    const year = currentTimelineYear();
    const roads = transportRoadFeaturesForYear(year);
    if (!roads.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 1.6;
    const clipRadiusM = radiusM * 2.58;
    const stops = civicAccessTransportStopsNear(center, radiusM * 2.95);
    const sourceEvents = lensEventsForYear(year)
      .filter((event) => event.category === "transport" && event.lngLat);
    const candidates = [];
    for (const feature of roads) {
      const props = feature.properties || {};
      if (props.layer !== "traffic_road" || !transportActivityRoadMatchesYear(props, year)) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(feature.geometry, center, 7);
      if (!Number.isFinite(distance) || distance > maxDistance) continue;
      const clippedGeometry = clipLineGeometryToRadius(feature.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const rank = Number(props.rank || 1);
      const activity = clamp01(Number(props.transport_activity || 0));
      const stopDensity = civicAccessStopDensity(point, stops, rank >= 3 ? 520 : 430);
      const eventDensity = eventDensityIntensity(point, sourceEvents, radiusM * 1.15);
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const stopLine = transportStopLinesNearGeometry(feature.geometry, stops, rank >= 3 ? 86 : 72);
      const mode = stopLine && Number(stopLine.primaryScore || 0) >= 0.18
        ? (stopLine.primaryMode || "bus")
        : transportAccessNetworkMode(props);
      const seed = stableUnit(`${props.source_id || props.id || ""}:access-network`);
      const intensity = clamp01(
        0.18
        + activity * 0.36
        + stopDensity * 0.28
        + eventDensity * 0.16
        + proximity * 0.12
        + Math.min(0.12, rank * 0.025)
        + seed * 0.05,
      );
      if (intensity < 0.24 && rank < 2 && stopDensity < 0.08) continue;
      candidates.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "access_network",
          flow_role: "access_network",
          access_mode: mode,
          source_id: props.source_id || props.id || "",
          serving_line: stopLine?.primaryLine || "",
          road_name: props.name || props.road_name || "",
          rank,
          intensity: Number(intensity.toFixed(3)),
          color: transportAccessNetworkColor(mode, intensity),
          edge_offset: Number(((seed - 0.5) * (mode === "rail" ? 0.42 : mode === "bus" ? 0.32 : 0.18)).toFixed(2)),
          line_signal: Number((stopLine?.primaryScore || 0).toFixed(3)),
          score: Number((intensity + proximity * 0.12 + stopDensity * 0.16 + Math.min(0.1, rank * 0.018) + (mode !== "walk" ? 0.12 : 0)).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    return distributeAccessNetworkFlows(candidates, 1400, center);
  }

  function transportAccessNetworkMode(props = {}) {
    const text = [
      props.mode,
      props.source,
      props.source_kind,
      props.highway,
      props.route,
      props.railway,
      props.name,
      props.road_name,
      props.layer,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/rail|tram|train|station/.test(text)) return "rail";
    if (/bus|translink|coach|rapid|glider/.test(text)) return "bus";
    if (/ferry|harbour|port/.test(text)) return "ferry";
    if (/cycle|bike/.test(text)) return "cycle";
    return "walk";
  }

  function transportAccessNetworkColor(mode, intensity = 0.5) {
    if (mode === "rail") return intensity > 0.62 ? "#72539a" : "#8762a7";
    if (mode === "bus") return intensity > 0.62 ? "#1f73b8" : "#3f8fc8";
    if (mode === "ferry") return "#2f8fa4";
    if (mode === "cycle") return "#2f9658";
    return intensity > 0.62 ? "#258f8f" : "#6aaeb2";
  }

  function distributeAccessNetworkFlows(features, target, center) {
    if (features.length <= target) return features.sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0));
    const selected = [];
    const buckets = new Map();
    for (const feature of features) {
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const props = feature.properties || {};
      const bucket = `${props.access_mode || "walk"}:${transportAngleBucket(center, point, 48)}:${Math.round(lngLatDistanceMeters(center, point) / 180)}`;
      const previous = buckets.get(bucket);
      if (!previous || Number(props.score || 0) > Number(previous.properties?.score || 0)) buckets.set(bucket, feature);
    }
    selected.push(...[...buckets.values()].sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0)).slice(0, target));
    return selected;
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
            fabric_shape: "access_cell",
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
    const year = currentTimelineYear();
    const demandCandidates = civicCatchmentCandidates(center, radiusM, lens, sourceEvents, year);
    const selectedDemandAnchors = selectCivicCatchmentCandidates(center, demandCandidates, lens, sourceEvents.length ? 156 : 210);
    const detailAnchors = selectedDemandAnchors
      .map((item) => ({
        id: item.event?.id || firstDetailEventId(item.props || {}) || item.sourceId || "",
        title: item.event?.title || item.props?.label || item.props?.title || civicServiceSublayerLabel(item.layerId),
        lngLat: item.point,
        confidence: item.event?.confidence || item.props?.confidence || (item.currentContext ? "inferred" : "documented"),
        layerId: item.layerId,
        intensity: item.intensity,
        currentContext: item.currentContext,
      }));
    const pressureDrivers = civicDemandPressureDriverEvents(center, radiusM, year);
    const evidenceEvents = sourceEvents.length
      ? [...sourceEvents, ...detailAnchors.filter((item) => !item.currentContext)]
      : detailAnchors;
    const demandEvents = [...pressureDrivers, ...evidenceEvents];
    if (!demandEvents.length) return [];
    const serviceAnchors = detailAnchors.length ? detailAnchors : sourceEvents;
    const cells = [];
    const stepM = 47;
    const extentM = radiusM * (lens.id === "civic-catchment" ? 0.98 : 1.02);
    const kernelM = radiusM * 0.43;
    const axisAngle = civicDemandAxisAngle(center, demandEvents, radiusM * 1.45);
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
        const cellCenter = offsetLngLat(center, cellDx, cellDy);
        const tightDensity = eventDensityIntensity(cellCenter, evidenceEvents, kernelM);
        const broadDensity = eventDensityIntensity(cellCenter, evidenceEvents, radiusM * 0.68);
        const driverDensity = civicDemandDriverDensity(cellCenter, pressureDrivers, radiusM * 0.46);
        const driverBroadDensity = civicDemandDriverDensity(cellCenter, pressureDrivers, radiusM * 0.86);
        const serviceDensity = eventDensityIntensity(cellCenter, serviceAnchors, radiusM * 0.32);
        const angle = Math.atan2(cellDy, cellDx);
        const boundaryNoise = Math.max(0.68, Math.min(1.08,
          0.88
            + Math.sin(angle * 2.6 + axisAngle * 1.7) * 0.09
            + Math.cos(angle * 4.4 - axisAngle * 0.8) * 0.07
            + driverBroadDensity * 0.16
            + broadDensity * 0.08
            - serviceDensity * 0.05,
        ));
        const boundaryM = extentM * boundaryNoise;
        const distance = Math.hypot(cellDx, cellDy);
        if (distance > boundaryM) continue;
        const radial = 1 - Math.min(boundaryM, distance) / boundaryM;
        const nearestEvent = nearestGuideEvent(cellCenter, demandEvents, radiusM * 0.72);
        const nearestDriver = nearestGuideEvent(cellCenter, pressureDrivers, radiusM * 0.5);
        const nearestService = nearestGuideEvent(cellCenter, serviceAnchors, radiusM * 0.42);
        const eventBoost = nearestEvent ? Math.max(0, 1 - lngLatDistanceMeters(cellCenter, nearestEvent.lngLat) / (radiusM * 0.72)) : 0;
        const driverBoost = nearestDriver ? Math.max(0, 1 - lngLatDistanceMeters(cellCenter, nearestDriver.lngLat) / (radiusM * 0.5)) * Math.max(0.24, Number(nearestDriver.demandWeight || 0.5)) : 0;
        const selectedPressure = Math.pow(Math.max(0, 1 - distance / (radiusM * 0.48)), 1.72);
        const crossAxis = Math.abs(cellDx * axisSin - cellDy * axisCos);
        const alongAxis = Math.abs(cellDx * axisCos + cellDy * axisSin);
        const civicAxisPressure = Math.max(0, 1 - crossAxis / (radiusM * 0.17)) * Math.max(0, 1 - alongAxis / (radiusM * 1.08));
        const serviceGap = Math.max(0, 0.5 - serviceDensity);
        const densityLift = Math.pow(Math.max(0, tightDensity), 0.72);
        const serviceRelief = serviceDensity * 0.34;
        const rawIntensity = 0.035
          + densityLift * 0.34
          + broadDensity * 0.07
          + driverDensity * 0.34
          + driverBroadDensity * 0.05
          + driverBoost * 0.1
          + eventBoost * 0.06
          + selectedPressure * 0.045
          + civicAxisPressure * 0.25
          + serviceGap * 0.08
          + radial * 0.025
          - serviceRelief;
        const edgeCap = 0.32 + radial * 0.22 + driverDensity * 0.2 + driverBoost * 0.08 + civicAxisPressure * 0.18 + selectedPressure * 0.02;
        const evidenceBoost = nearestService?.currentContext ? -0.06 : 0.04;
        const intensity = clamp01(Math.min(rawIntensity + evidenceBoost + (seed - 0.5) * 0.025, edgeCap));
        const color = civicDemandSurfaceColor(intensity, serviceDensity, driverDensity, selectedPressure, seed, nearestService);
        const serviceSurplus = Math.max(0, serviceDensity - driverDensity - selectedPressure * 0.4);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            layer_id: "demand_grid",
            sublayer_id: "demand_grid",
            surface_style: "demand_surface",
            intensity: Number(intensity.toFixed(3)),
            color,
            event_id: nearestEvent?.id || "",
            source_id: nearestService?.id || "",
            service_type: nearestService?.layerId || "",
            demand_context: nearestService
              ? nearestService.currentContext ? "current_osm_service_context" : "selected_year_evidence"
              : "service_gap",
            demand_driver_density: Number(driverDensity.toFixed(3)),
            service_density: Number(serviceDensity.toFixed(3)),
            service_surplus: Number(serviceSurplus.toFixed(3)),
            score: Number((intensity + seed * 0.025).toFixed(3)),
          },
          geometry: civicDemandPressureCellPolygon(
            cellCenter,
            stepM * (0.47 + intensity * 0.065 + seed * 0.035),
            axisAngle + (row % 2 ? 0.03 : -0.02),
            seed,
            intensity,
          ),
        });
      }
      row += 1;
    }
    return cells
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
  }

  function civicDemandPressureDriverEvents(center, radiusM, year) {
    const maxDistance = radiusM * 1.72;
    const selectedId = state.selectedEvent?.id || "";
    const candidates = [];
    const seen = new Set();
    const categoryWeight = {
      transport: 1.04,
      planning_built: 0.82,
      planning: 0.82,
      economy: 0.72,
      civic_services: 0.62,
      utilities: 0.42,
      environment: 0.36,
    };
    const pushEvent = (event, role = "year_event") => {
      if (!event?.lngLat) return;
      const distance = lngLatDistanceMeters(center, event.lngLat);
      if (role !== "selected_event" && distance > maxDistance) return;
      const key = event.id || `${event.lngLat[0].toFixed(5)},${event.lngLat[1].toFixed(5)}:${role}`;
      if (seen.has(key)) return;
      seen.add(key);
      const proximity = 1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance);
      const baseWeight = role === "selected_event"
        ? 1.44
        : categoryWeight[event.category] || 0.5;
      candidates.push({
        ...event,
        demandRole: role,
        demandWeight: baseWeight + proximity * (role === "selected_event" ? 0.24 : 0.18),
      });
    };
    if (state.selectedEvent?.lngLat) pushEvent(state.selectedEvent, "selected_event");
    for (const event of lensEventsForYear(year)) {
      if (!event.lngLat || event.id === selectedId) continue;
      if (!Object.prototype.hasOwnProperty.call(categoryWeight, event.category)) continue;
      pushEvent(event, "year_event");
    }
    for (const [index, anchor] of nearbyTransportRoadAnchors(center, radiusM * 1.55, 58).entries()) {
      candidates.push({
        id: `transport-road-demand-${anchor.id || index}`,
        title: "Transport access corridor",
        category: "transport",
        confidence: "documented",
        lngLat: anchor.point,
        demandRole: "transport_context",
        demandWeight: 0.3 + clamp01(anchor.activity || 0) * 0.28 + Math.min(0.08, Number(anchor.rank || 1) * 0.022),
      });
    }
    return candidates
      .sort((a, b) => Number(b.demandWeight || 0) - Number(a.demandWeight || 0))
      .slice(0, 96);
  }

  function civicDemandDriverDensity(cellCenter, drivers, kernelM) {
    let score = 0;
    for (const driver of drivers) {
      if (!driver.lngLat) continue;
      const distance = lngLatDistanceMeters(cellCenter, driver.lngLat);
      if (distance > kernelM) continue;
      const confidenceWeight = Math.max(0.24, confidenceRank(driver.confidence) / 4);
      const driverWeight = Math.max(0.18, Number(driver.demandWeight || 0.5));
      score += Math.max(0, 1 - distance / kernelM) * confidenceWeight * driverWeight;
    }
    return clamp01(score * 0.105);
  }

  function civicDemandSurfaceColor(intensity, serviceDensity, driverDensity, selectedPressure, seed = 0, nearestService = null) {
    const surplus = serviceDensity - driverDensity - selectedPressure * 0.4;
    if ((surplus > 0.32 || serviceDensity > driverDensity + 0.18) && intensity < 0.38) {
      if (surplus > 0.52) return "#2f9997";
      return seed > 0.68 ? "#5fb0a9" : "#91cbc1";
    }
    if (nearestService?.currentContext && serviceDensity > 0.44 && intensity < 0.3 && seed > 0.58) return "#a3ccc4";
    if (intensity > 0.84) return "#c83a49";
    if (intensity > 0.66) return "#e46256";
    if (intensity > 0.48) return "#ee9b60";
    if (intensity > 0.29) return seed > 0.68 ? "#e3cd88" : "#edbd77";
    if (intensity > 0.16) return "#8fc8be";
    if (intensity > 0.07) return "#bddbd2";
    return "#edf0ea";
  }

  function civicDemandPressureCellPolygon(center, radiusM, rotation = 0, seed = 0.5, intensity = 0.4) {
    const ring = [];
    const baseRotation = Math.PI / 6 + rotation * 0.08;
    for (let i = 0; i <= 6; i += 1) {
      const angle = baseRotation + (i / 6) * Math.PI * 2;
      const jitter = 0.95
        + Math.sin(angle * 2.4 + seed * Math.PI * 2) * 0.035
        + Math.cos(angle * 4.1 - seed * 3.2) * 0.025
        + (intensity - 0.5) * 0.025;
      ring.push(offsetLngLat(center, Math.cos(angle) * radiusM * jitter, Math.sin(angle) * radiusM * jitter));
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  function civicCatchmentPatchFeatures(center, radiusM, lens) {
    const year = currentTimelineYear();
    const sourceEvents = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const candidates = civicCatchmentCandidates(center, radiusM, lens, sourceEvents, year);
    const selected = selectCivicCatchmentCandidates(center, candidates, lens, 92);
    const coverageFeatures = civicCoverageCellPatchFeatures(center, radiusM, lens, sourceEvents, year);
    const fabricAnchors = selected.length >= 12 ? selected : distributedCatchmentCandidates(candidates, 92);
    const fabricFeatures = civicCatchmentServiceCellFeatures(center, radiusM, lens, fabricAnchors);
    const roadBlockFeatures = civicCatchmentRoadBlockCellFeatures(center, radiusM, lens, fabricAnchors);
    const capacityFeatures = civicCatchmentCapacityMosaicFeatures(center, radiusM, lens, fabricAnchors);
    if (lens.id === "civic-catchment") {
      const territoryAnchors = distributedCatchmentCandidates(candidates, 72);
      const territoryBackdrops = civicCatchmentVoronoiFeatures(center, radiusM, lens, territoryAnchors)
        .map((feature, index) => {
          const props = feature.properties || {};
          const sublayerId = props.sublayer_id || props.service_type || "civic_services";
          const serviceColor = civicCatchmentSublayerFillColor(sublayerId);
          const point = geometryToLngLat(feature.geometry) || center;
          const distance = lngLatDistanceMeters(center, point);
          const radial = Math.min(1, distance / Math.max(1, radiusM));
          const intensity = clamp01(
            0.42
            + Number(props.intensity || 0.45) * 0.24
            + (1 - radial) * 0.14
            + civicCatchmentServiceCapacityBias(sublayerId) * 0.7
            + stableUnit(`${props.source_id || props.event_id || index}:territory`) * 0.05,
          );
          return {
            ...feature,
            properties: {
              ...props,
              surface_style: "catchment_area",
              render_rank: 1,
              intensity: Number(intensity.toFixed(3)),
              color: serviceColor,
              service_color: serviceColor,
              score: Number((0.42 + Number(props.score || 0) * 0.18 + intensity * 0.12).toFixed(3)),
              context: props.context || "source_backed_service_territory",
            },
          };
        })
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0));
      if (territoryBackdrops.length >= 8 && (capacityFeatures.length >= 120 || roadBlockFeatures.length >= 160)) {
        const limit = Math.min(640, guideCellLimit(lens.id));
        const territoryLimit = Math.min(24, territoryBackdrops.length);
        const evidenceLimit = Math.max(36, Math.min(58, Math.floor(limit * 0.09), coverageFeatures.length));
        const fabricLimit = Math.max(120, Math.min(190, Math.floor(limit * 0.28), fabricFeatures.length));
        const roadCellLimit = Math.max(240, Math.min(310, Math.floor(limit * 0.48), roadBlockFeatures.length));
        const capacityLimit = Math.max(0, Math.min(42, limit - territoryLimit - evidenceLimit - fabricLimit - roadCellLimit, capacityFeatures.length));
        const fabricCells = distributeSurfaceCellsByGrid(fabricFeatures, center, fabricLimit, 176).map((feature) => {
          const props = feature.properties || {};
          const sublayerId = props.sublayer_id || props.service_type || "civic_services";
          const serviceColor = civicCatchmentSublayerFillColor(sublayerId);
          const intensity = clamp01(0.12 + Number(props.intensity || 0.45) * 0.38);
          return {
            ...feature,
            properties: {
              ...props,
              surface_style: "catchment_area",
              render_rank: 2,
              intensity: Number(intensity.toFixed(3)),
              color: serviceColor,
              service_color: serviceColor,
              context: props.context || "source_backed_service_cell_fabric",
            },
          };
        });
        const capacityCells = distributeSurfaceCellsByGrid(capacityFeatures, center, capacityLimit, 205).map((feature) => {
          const props = feature.properties || {};
          const sublayerId = props.sublayer_id || props.service_type || "civic_services";
          const serviceColor = civicCatchmentSublayerFillColor(sublayerId);
          const intensity = clamp01(0.18 + Number(props.intensity || 0.45) * 0.42);
          return {
            ...feature,
            properties: {
              ...props,
              surface_style: "catchment_area",
              render_rank: props.render_rank || 4,
              intensity: Number((intensity * 0.82).toFixed(3)),
              color: serviceColor,
              service_color: serviceColor,
              context: props.context || "source_backed_capacity_cell",
            },
          };
        });
        const serviceCells = distributeSurfaceCellsByGrid(roadBlockFeatures, center, roadCellLimit, 126)
          .map((feature) => {
          const props = feature.properties || {};
          const sublayerId = props.sublayer_id || props.service_type || "civic_services";
          const serviceColor = civicCatchmentSublayerFillColor(sublayerId);
          const intensity = clamp01(0.16 + Number(props.intensity || 0.45) * 0.34);
          return {
            ...feature,
            properties: {
              ...props,
              surface_style: "catchment_area",
              render_rank: props.render_rank || 5,
              intensity: Number((intensity * 0.88).toFixed(3)),
              color: serviceColor,
              service_color: serviceColor,
              context: props.context || "source_backed_road_context_cell",
            },
          };
        });
        const evidencePatches = coverageFeatures
          .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
          .slice(0, evidenceLimit)
          .map((feature) => {
            const props = feature.properties || {};
            const sublayerId = props.sublayer_id || props.service_type || "civic_services";
            const serviceColor = civicCatchmentSublayerFillColor(sublayerId);
            const intensity = clamp01(0.18 + Number(props.intensity || 0.45) * 0.4);
            return {
              ...feature,
              properties: {
                ...props,
                surface_style: "catchment_area",
                render_rank: 6,
                intensity: Number(intensity.toFixed(3)),
                color: serviceColor,
                service_color: serviceColor,
              },
            };
        });
        return [
          ...territoryBackdrops.slice(0, territoryLimit).map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              surface_style: "catchment_backdrop",
              render_rank: 0,
              intensity: Number((0.04 + Number(feature.properties?.intensity || 0.45) * 0.14).toFixed(3)),
              context: feature.properties?.context || "source_backed_service_territory",
            },
          })),
          ...fabricCells,
          ...capacityCells,
          ...serviceCells,
          ...evidencePatches,
        ];
      }
    }
    if (lens.id === "civic-catchment" && capacityFeatures.length >= 160) {
      const limit = guideCellLimit(lens.id);
      const districtFeatures = civicCatchmentDistrictBackdropFeatures(center, radiusM, lens, fabricAnchors, 34);
      const evidenceLimit = Math.max(54, Math.min(150, Math.floor(limit * 0.08), coverageFeatures.length));
      const roadLimit = Math.max(120, Math.min(420, Math.floor(limit * 0.22), roadBlockFeatures.length));
      const capacityLimit = Math.max(0, limit - districtFeatures.length - evidenceLimit - roadLimit);
      const evidencePatches = coverageFeatures
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, evidenceLimit)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            render_rank: 6,
            intensity: Number((0.24 + Number(feature.properties?.intensity || 0.45) * 0.66).toFixed(3)),
          },
        }));
      const roadPatches = roadBlockFeatures
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, roadLimit)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            surface_style: "catchment_backdrop",
            render_rank: 3,
            intensity: Number((0.18 + Number(feature.properties?.intensity || 0.45) * 0.52).toFixed(3)),
          },
        }));
      return [
        ...districtFeatures,
        ...capacityFeatures.slice(0, capacityLimit),
        ...roadPatches,
        ...evidencePatches,
      ];
    }
    if (fabricFeatures.length >= 120) {
      const limit = guideCellLimit(lens.id);
      const evidenceLimit = Math.max(48, Math.min(420, Math.floor(limit * 0.18), coverageFeatures.length));
      const evidencePatches = coverageFeatures
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, evidenceLimit)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            render_rank: 6,
            intensity: Number((0.22 + Number(feature.properties?.intensity || 0.45) * 0.68).toFixed(3)),
          },
        }));
      if (roadBlockFeatures.length >= 240) {
        const backdropLimit = Math.min(760, Math.floor(limit * 0.34), fabricFeatures.length);
        const roadLimit = Math.min(980, Math.max(0, limit - backdropLimit - evidencePatches.length));
        return [
          ...fabricFeatures.slice(0, backdropLimit),
          ...roadBlockFeatures.slice(0, roadLimit),
          ...evidencePatches,
        ];
      }
      return [
        ...fabricFeatures.slice(0, Math.max(0, limit - evidencePatches.length)),
        ...evidencePatches,
      ];
    }
    const areaAnchors = distributedCatchmentCandidates(selected.length >= 12 ? selected : candidates, 52);
    const areaFeatures = civicCatchmentVoronoiFeatures(center, radiusM, lens, areaAnchors)
      .map((feature, index) => {
        const props = feature.properties || {};
        const point = geometryToLngLat(feature.geometry) || center;
        const distance = lngLatDistanceMeters(center, point);
        const radial = Math.min(1, distance / Math.max(1, radiusM * 1.03));
        const seed = stableUnit(`${props.source_id || props.event_id || props.label || index}:catchment-capacity`);
        const baseIntensity = Number(props.intensity || 0.5);
        const capacityIntensity = clamp01(
          0.18
          + baseIntensity * 0.34
          + (1 - radial) * 0.28
          + (seed - 0.5) * 0.28,
        );
        return {
          ...feature,
          properties: {
            ...props,
            surface_style: "catchment_area",
            render_rank: 2,
            intensity: Number(capacityIntensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, capacityIntensity, Math.atan2(point[1] - center[1], point[0] - center[0]), null, lens),
            score: Number((Number(props.score || 0) + capacityIntensity * 0.16).toFixed(3)),
          },
        };
      })
      .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0));
    if (areaFeatures.length >= 8) {
      const patchLimit = Math.max(0, Math.min(90, guideCellLimit(lens.id) - areaFeatures.length));
      const evidencePatches = coverageFeatures
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, patchLimit)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            render_rank: 5,
            intensity: Number((0.18 + Number(feature.properties?.intensity || 0.45) * 0.7).toFixed(3)),
          },
        }));
      return [...areaFeatures.slice(0, guideCellLimit(lens.id) - evidencePatches.length), ...evidencePatches];
    }
    if (coverageFeatures.length >= 12) {
      const backdropLimit = Math.max(0, guideCellLimit(lens.id) - coverageFeatures.length);
      const blockBackdropFeatures = civicCatchmentServiceCellFeatures(center, radiusM, lens, selected)
        .slice(0, backdropLimit);
      if (blockBackdropFeatures.length >= 80) return [...blockBackdropFeatures, ...coverageFeatures];
      const backdropAnchors = distributedCatchmentCandidates(candidates, 260);
      const backdropFeatures = civicCatchmentVoronoiFeatures(center, radiusM, lens, backdropAnchors)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            surface_style: "catchment_backdrop",
            render_rank: 1,
            intensity: Number((0.16 + Number(feature.properties?.intensity || 0.4) * 0.62).toFixed(3)),
          },
        }))
        .slice(0, backdropLimit);
      return [...backdropFeatures, ...coverageFeatures];
    }
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

  function distributeSurfaceCellsByGrid(features, center, limit, bucketM = 180) {
    if (!features.length || limit <= 0) return [];
    const buckets = new Map();
    for (const feature of features) {
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const local = lngLatToLocalMeters(point, center);
      if (!Number.isFinite(local[0]) || !Number.isFinite(local[1])) continue;
      const bucket = `${Math.round(local[0] / bucketM)}:${Math.round(local[1] / bucketM)}`;
      const previous = buckets.get(bucket);
      if (!previous || Number(feature.properties?.score || 0) > Number(previous.properties?.score || 0)) buckets.set(bucket, feature);
    }
    const selected = [...buckets.values()]
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, limit);
    if (selected.length >= limit) return selected;
    const selectedKeys = new Set(selected.map((feature) => feature.properties?.source_id || feature.properties?.event_id || JSON.stringify(geometryToLngLat(feature.geometry))));
    const fillers = features
      .filter((feature) => !selectedKeys.has(feature.properties?.source_id || feature.properties?.event_id || JSON.stringify(geometryToLngLat(feature.geometry))))
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, limit - selected.length);
    return [...selected, ...fillers];
  }

  function civicCatchmentDistrictBackdropFeatures(center, radiusM, lens, anchors, limit = 32) {
    const districtAnchors = distributedCatchmentCandidates(anchors, limit);
    return civicCatchmentVoronoiFeatures(center, radiusM, lens, districtAnchors)
      .slice(0, limit)
      .map((feature, index) => {
        const props = feature.properties || {};
        const intensity = clamp01(0.34 + Number(props.intensity || 0.45) * 0.34 + stableUnit(`${props.source_id || props.event_id || index}:district`) * 0.08);
        return {
          ...feature,
          properties: {
            ...props,
            surface_style: "catchment_backdrop",
            render_rank: 0,
            intensity: Number(intensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, intensity, index * 0.35, null, lens),
            score: Number((0.35 + Number(props.score || 0) * 0.22).toFixed(3)),
            context: props.context || "service_territory_backdrop",
          },
        };
      });
  }

  function civicCatchmentCapacityMosaicFeatures(center, radiusM, lens, anchors) {
    const selected = anchors
      .map((item, index) => ({
        ...item,
        index,
        local: lngLatToLocalMeters(item.point, center),
      }))
      .filter((item) => Number.isFinite(item.local?.[0]) && Number.isFinite(item.local?.[1]));
    if (selected.length < 3) return [];
    const axisAngle = civicCatchmentAnchorAxisAngle(selected);
    const stepM = lens.id === "civic-catchment" ? 132 : 86;
    const extentM = radiusM * 1.02;
    const features = [];
    const bucketCounts = new Map();
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.78) {
      const rowOffset = row % 2 ? stepM * 0.52 : 0;
      for (let dx = -extentM + rowOffset; dx <= extentM; dx += stepM) {
        const radial = Math.hypot(dx, dy);
        if (!Number.isFinite(radial) || radial > extentM) continue;
        if (lens.id === "civic-catchment" && radial > extentM - stepM * 0.52) continue;
        const nearest = nearestCivicCatchmentAnchorLocal([dx, dy], selected);
        if (!nearest) continue;
        const seedKey = `${nearest.item.layerId}:${nearest.item.event?.id || nearest.item.sourceId || ""}:${Math.round(dx)}:${Math.round(dy)}:capacity`;
        const seed = stableUnit(seedKey);
        const localDensity = civicCatchmentLocalDensity([dx, dy], selected, nearest.item.layerId, stepM * 5.6);
        const proximity = 1 - Math.min(extentM, radial) / extentM;
        const anchorCloseness = 1 - Math.min(stepM * 5.4, nearest.distance) / (stepM * 5.4);
        const serviceBalance = civicCatchmentServiceCapacityBias(nearest.item.layerId);
        const evidenceWeight = nearest.item.currentContext ? -0.045 : 0.055;
        const capacity = clamp01(
          0.18
          + Number(nearest.item.intensity || 0.45) * 0.12
          + localDensity.same * 0.2
          + localDensity.total * 0.05
          + anchorCloseness * 0.13
          + proximity * 0.04
          + serviceBalance
          + evidenceWeight
          + (seed - 0.5) * 0.34,
        );
        const bucket = `${Math.round(dx / (lens.id === "civic-catchment" ? 235 : 150))}:${Math.round(dy / (lens.id === "civic-catchment" ? 235 : 150))}:${nearest.item.layerId}`;
        const bucketCount = bucketCounts.get(bucket) || 0;
        if (bucketCount >= (lens.id === "civic-catchment" ? 2 : 3)) continue;
        bucketCounts.set(bucket, bucketCount + 1);
        const jitterX = (seed - 0.5) * stepM * (lens.id === "civic-catchment" ? 0.1 : 0.18);
        const jitterY = (stableUnit(`${seedKey}:y`) - 0.5) * stepM * (lens.id === "civic-catchment" ? 0.09 : 0.16);
        const centerPoint = offsetLngLat(center, dx + jitterX, dy + jitterY);
        const aspect = 0.76 + stableUnit(`${seedKey}:aspect`) * 0.58;
        const halfWidth = stepM * ((lens.id === "civic-catchment" ? 0.58 : 0.56) + anchorCloseness * 0.08 + localDensity.same * 0.035 + seed * 0.035) * aspect;
        const halfHeight = stepM * ((lens.id === "civic-catchment" ? 0.5 : 0.48) + anchorCloseness * 0.06 + localDensity.total * 0.03 + seed * 0.03) / Math.max(0.72, aspect);
        const rotation = axisAngle
          + (seed - 0.5) * (lens.id === "civic-catchment" ? 0.22 : 0.44)
          + Math.atan2(dy, dx) * (lens.id === "civic-catchment" ? 0.028 : 0.045)
          + civicCatchmentServiceCapacityBias(nearest.item.layerId) * 1.8;
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "catchment_area",
            sublayer_id: nearest.item.layerId,
            service_type: nearest.item.layerId,
            render_rank: 2,
            intensity: Number(capacity.toFixed(3)),
            color: surfaceColorForLens(lens.id, capacity, Math.atan2(dy, dx), nearest.item.event, lens),
            event_id: nearest.item.event?.id || firstDetailEventId(nearest.item.props || {}) || "",
            source_id: nearest.item.sourceId || "",
            label: nearest.item.event?.title || nearest.item.props?.label || nearest.item.props?.name || civicServiceSublayerLabel(nearest.item.layerId),
            score: Number((capacity + anchorCloseness * 0.16 + localDensity.same * 0.08 + proximity * 0.04 + seed * 0.03).toFixed(3)),
            context: nearest.item.currentContext ? "capacity_cell_current_osm_context" : "capacity_cell_selected_year_record",
          },
          geometry: civicBlockCellPolygon(centerPoint, halfWidth, halfHeight, rotation, seed),
        });
      }
      row += 1;
    }
    return features.sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0));
  }

  function civicCatchmentRoadBlockCellFeatures(center, radiusM, lens, anchors) {
    const selected = anchors
      .map((item, index) => ({
        ...item,
        index,
        local: lngLatToLocalMeters(item.point, center),
      }))
      .filter((item) => Number.isFinite(item.local[0]) && Number.isFinite(item.local[1]));
    const year = currentTimelineYear();
    const roads = transportRoadFeaturesForYear(year);
    if (selected.length < 3 || !roads.length) return [];
    const catchmentMode = lens.id === "civic-catchment";
    const extentM = radiusM * (catchmentMode ? 0.98 : 1.04);
    const candidates = [];
    for (const feature of roads) {
      const props = feature.properties || {};
      if (props.layer !== "traffic_road" || !transportActivityRoadMatchesYear(props, year)) continue;
      const rank = Number(props.rank || 1);
      const activity = clamp01(Number(props.transport_activity || 0));
      for (const sequence of geometryLineCoordinateSequences(feature.geometry)) {
          const stride = Math.max(1, Math.floor(sequence.length / (catchmentMode ? 10 : 5)));
        for (let index = 1; index < sequence.length; index += stride) {
          const a = sequence[index - 1];
          const b = sequence[index];
          const aLocal = lngLatToLocalMeters(a, center);
          const bLocal = lngLatToLocalMeters(b, center);
          if (!Number.isFinite(aLocal[0]) || !Number.isFinite(bLocal[0])) continue;
          const mx = (aLocal[0] + bLocal[0]) / 2;
          const my = (aLocal[1] + bLocal[1]) / 2;
          const radial = Math.hypot(mx, my);
          if (!Number.isFinite(radial) || radial > extentM) continue;
          if (catchmentMode && radial > extentM - 58) continue;
          const segmentM = Math.hypot(bLocal[0] - aLocal[0], bLocal[1] - aLocal[1]);
          if (segmentM < 12) continue;
          const nearest = nearestCivicCatchmentAnchorLocal([mx, my], selected);
          if (!nearest) continue;
          const seedKey = `${props.id || props.source_id || ""}:${index}:${nearest.item.layerId}`;
          const seed = stableUnit(seedKey);
          const localDensity = civicCatchmentLocalDensity([mx, my], selected, nearest.item.layerId, radiusM * 0.36);
          const proximity = 1 - Math.min(extentM, radial) / extentM;
          const anchorCloseness = 1 - Math.min(radiusM * 0.58, nearest.distance) / (radiusM * 0.58);
          const intensity = clamp01(
            0.17
            + proximity * 0.12
            + anchorCloseness * 0.24
            + Number(nearest.item.intensity || 0.45) * 0.16
            + activity * 0.08
            + Math.min(0.08, rank * 0.018)
            + localDensity.same * 0.18
            + localDensity.total * 0.08
            + (seed - 0.5) * 0.08,
          );
          candidates.push({
            aLocal,
            bLocal,
            local: [mx, my],
            nearest,
            seed,
            seedKey,
            segmentM,
            rank,
            activity,
            intensity,
            score: intensity + proximity * 0.22 + Math.min(0.18, rank * 0.035) + activity * 0.1 + seed * 0.025,
          });
        }
      }
    }
    const bucketCounts = new Map();
    const output = [];
    const limit = Math.min(catchmentMode ? 1250 : 1500, guideCellLimit(lens.id));
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      if (output.length >= limit) break;
      const bucket = `${Math.round(item.local[0] / (catchmentMode ? 74 : 58))}:${Math.round(item.local[1] / (catchmentMode ? 74 : 58))}`;
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= 2) continue;
      bucketCounts.set(bucket, bucketCount + 1);
      const dx = item.bLocal[0] - item.aLocal[0];
      const dy = item.bLocal[1] - item.aLocal[1];
      const angle = Math.atan2(dy, dx);
      const side = item.seed > 0.5 ? 1 : -1;
      const offsetM = (catchmentMode ? 12 : 18) + item.seed * (catchmentMode ? 20 : 34) + Math.min(catchmentMode ? 8 : 14, item.rank * 2.2);
      const centerPoint = offsetLngLat(
        center,
        item.local[0] + Math.cos(angle + Math.PI / 2) * offsetM * side,
        item.local[1] + Math.sin(angle + Math.PI / 2) * offsetM * side,
      );
      const halfWidth = catchmentMode
        ? Math.max(36, Math.min(92, item.segmentM * (0.4 + item.seed * 0.08) + item.rank * 2.6))
        : Math.max(32, Math.min(82, item.segmentM * (0.34 + item.seed * 0.12) + item.rank * 2.4));
      const halfHeight = catchmentMode
        ? Math.max(24, Math.min(52, 26 + item.activity * 10 + item.intensity * 10))
        : Math.max(18, Math.min(45, 22 + item.activity * 12 + item.intensity * 10));
      const anchor = item.nearest.item;
      output.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "catchment_backdrop",
          sublayer_id: anchor.layerId,
          service_type: anchor.layerId,
          render_rank: 3,
          intensity: Number(item.intensity.toFixed(3)),
          color: surfaceColorForLens(lens.id, item.intensity, angle, anchor.event, lens),
          service_color: civicCatchmentSublayerFillColor(anchor.layerId),
          event_id: anchor.event?.id || firstDetailEventId(anchor.props || {}) || "",
          source_id: anchor.sourceId || "",
          label: anchor.event?.title || anchor.props?.label || anchor.props?.name || civicServiceSublayerLabel(anchor.layerId),
          score: Number(item.score.toFixed(3)),
          context: anchor.currentContext ? "road_context_current_osm" : "road_context_selected_year",
        },
        geometry: civicBlockCellPolygon(centerPoint, halfWidth, halfHeight, angle + (item.seed - 0.5) * 0.08, item.seed),
      });
    }
    return output;
  }

  function civicCatchmentStreetSeamFeatures(center, lens) {
    const radiusM = Number(lens.radiusM || 1500);
    const year = currentTimelineYear();
    const sourceEvents = lensEventsForYear(year)
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const candidates = civicCatchmentCandidates(center, radiusM, lens, sourceEvents, year);
    const anchors = selectCivicCatchmentCandidates(center, candidates, lens, 92)
      .map((item, index) => ({
        ...item,
        index,
        local: lngLatToLocalMeters(item.point, center),
      }))
      .filter((item) => Number.isFinite(item.local[0]) && Number.isFinite(item.local[1]));
    const roads = transportRoadFeaturesForYear(year);
    if (anchors.length < 3 || !roads.length) return [];
    const maxDistance = radiusM * 1.03;
    const seamFeatures = [];
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer !== "traffic_road" || !transportActivityRoadMatchesYear(props, year)) continue;
      const distanceToCenter = geometryDistanceToPointMeters(road.geometry, center, 8);
      if (!Number.isFinite(distanceToCenter) || distanceToCenter > maxDistance + 90) continue;
      const rank = Number(props.rank || 1);
      const activity = clamp01(Number(props.transport_activity || 0));
      if (rank < 1.15 && activity < 0.08 && distanceToCenter > radiusM * 0.84) continue;
      const sourceKey = props.source_id || props.id || "";
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      if (!Number.isFinite(routeLengthM) || routeLengthM < 16) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const local = lngLatToLocalMeters(point, center);
      if (!Number.isFinite(local[0]) || !Number.isFinite(local[1])) continue;
      const nearest = nearestCivicCatchmentAnchorLocal(local, anchors);
      if (!nearest) continue;
      const radial = Math.hypot(local[0], local[1]);
      const proximity = 1 - Math.min(maxDistance, Math.min(radial, distanceToCenter)) / Math.max(1, maxDistance);
      const localDensity = civicCatchmentLocalDensity(local, anchors, nearest.item.layerId, radiusM * 0.38);
      const seed = stableUnit(`${sourceKey}:${nearest.item.layerId}:catchment-road-seam`);
      const anchorCloseness = 1 - Math.min(radiusM * 0.52, nearest.distance) / (radiusM * 0.52);
      const intensity = clamp01(
        0.18
        + proximity * 0.22
        + anchorCloseness * 0.18
        + Math.min(0.18, rank * 0.04)
        + activity * 0.08
        + Math.min(0.09, routeLengthM / 2200)
        + localDensity.total * 0.11
        + seed * 0.035,
      );
      if (intensity < 0.24 && rank < 1.6 && localDensity.total < 0.12) continue;
      seamFeatures.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_role: "catchment_road_seam",
          flow_style: "catchment_street_seam",
          sublayer_id: nearest.item.layerId,
          source_id: sourceKey,
          event_id: nearest.item.event?.id || firstDetailEventId(nearest.item.props || {}) || "",
          intensity: Number(intensity.toFixed(2)),
          color: "#fffdf7",
          visual_priority: Number((intensity + Math.min(0.14, rank * 0.025) + localDensity.total * 0.08).toFixed(3)),
          score: Number((intensity + proximity * 0.14 + Math.min(0.12, routeLengthM / 2600) + seed * 0.035).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    const selected = [];
    const bucketCounts = new Map();
    const limit = 440;
    for (const feature of seamFeatures.sort((a, b) => Number(b.properties.score) - Number(a.properties.score))) {
      if (selected.length >= limit) break;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const local = lngLatToLocalMeters(point, center);
      if (!Number.isFinite(local[0]) || !Number.isFinite(local[1])) continue;
      const bucket = `${Math.round(local[0] / 128)}:${Math.round(local[1] / 128)}:${feature.properties.sublayer_id}`;
      const count = bucketCounts.get(bucket) || 0;
      if (count >= 1) continue;
      bucketCounts.set(bucket, count + 1);
      selected.push(feature);
    }
    return selected;
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
      if (strict && typeCount >= (lens.id === "civic-catchment" ? 18 : 8)) return false;
      const bucket = transportAngleBucket(center, item.point, 22);
      const bucketCount = angleBuckets.get(bucket) || 0;
      if (strict && bucketCount >= (lens.id === "civic-catchment" ? 6 : 3)) return false;
      const minSpacing = lens.id === "civic-catchment" ? (strict ? 56 : 38) : (strict ? 105 : 72);
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
    const voronoiFeatures = civicCatchmentVoronoiFeatures(center, radiusM, lens, anchors);
    if (voronoiFeatures.length >= 8) {
      return voronoiFeatures
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, guideCellLimit(lens.id));
    }
    const serviceCells = civicCatchmentServiceCellFeatures(center, radiusM, lens, anchors);
    if (serviceCells.length >= 12) {
      return serviceCells
        .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
        .slice(0, guideCellLimit(lens.id));
    }
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
    const catchmentMode = lens.id === "civic-catchment";
    const stepM = catchmentMode ? 126 : 104;
    const extentM = radiusM * (catchmentMode ? 0.99 : 1.04);
    let row = 0;
    for (let dy = -extentM; dy <= extentM; dy += stepM * 0.84) {
      const rowOffset = row % 2 ? stepM * 0.52 : 0;
      for (let dx = -extentM + rowOffset; dx <= extentM; dx += stepM) {
        const cellDx = dx;
        const cellDy = dy;
        const radial = Math.hypot(cellDx, cellDy);
        if (radial > extentM) continue;
        const nearest = nearestCivicCatchmentAnchorLocal([cellDx, cellDy], selected);
        if (!nearest) continue;
        const proximity = 1 - Math.min(extentM, radial) / extentM;
        const anchorCloseness = 1 - Math.min(stepM * 4.4, nearest.distance) / (stepM * 4.4);
        const localDensity = civicCatchmentLocalDensity([cellDx, cellDy], selected, nearest.item.layerId, stepM * 6.2);
        const seedKey = `${nearest.item.layerId}:${nearest.item.event?.id || nearest.item.sourceId || ""}:${Math.round(cellDx)}:${Math.round(cellDy)}`;
        const seed = stableUnit(seedKey);
        const edgeRelief = clamp01(radial / Math.max(1, extentM));
        const intensity = catchmentMode
          ? clamp01(
            0.23
            + proximity * 0.11
            + anchorCloseness * 0.24
            + nearest.item.intensity * 0.2
            + localDensity.same * 0.19
            + localDensity.total * 0.1
            - edgeRelief * 0.055
            + (seed - 0.5) * 0.075,
          )
          : clamp01(
            0.16
            + proximity * 0.08
            + anchorCloseness * 0.22
            + nearest.item.intensity * 0.12
            + localDensity.same * 0.22
            + localDensity.total * 0.07
            - edgeRelief * 0.05
            + (seed - 0.5) * 0.055,
          );
        const jitterX = (seed - 0.5) * stepM * (catchmentMode ? 0.07 : 0.22);
        const jitterY = (stableUnit(`${seedKey}:jitter-y`) - 0.5) * stepM * (catchmentMode ? 0.06 : 0.2);
        const cellCenter = offsetLngLat(center, cellDx + jitterX, cellDy + jitterY);
        const aspect = catchmentMode
          ? 0.88 + stableUnit(`${seedKey}:aspect`) * 0.26
          : 0.68 + stableUnit(`${seedKey}:aspect`) * 0.58;
        const halfWidth = stepM * (catchmentMode ? 0.58 : 0.38)
          * (1 + anchorCloseness * 0.1 + localDensity.same * 0.04)
          * aspect;
        const halfHeight = stepM * (catchmentMode ? 0.48 : 0.34)
          * (1 + anchorCloseness * 0.07 + localDensity.total * 0.04)
          / Math.max(0.68, aspect);
        const rotation = (seed - 0.5) * (catchmentMode ? 0.07 : 0.46) + Math.atan2(cellDy, cellDx) * (catchmentMode ? 0.012 : 0.035);
        cells.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "catchment_backdrop",
            sublayer_id: nearest.item.layerId,
            service_type: nearest.item.layerId,
            render_rank: 1,
            intensity: Number(intensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, intensity, Math.atan2(cellDy, cellDx), nearest.item.event, lens),
            event_id: nearest.item.event?.id || firstDetailEventId(nearest.item.props || {}) || "",
            source_id: nearest.item.sourceId || "",
            label: nearest.item.event?.title || nearest.item.props?.label || nearest.item.props?.name || civicServiceSublayerLabel(nearest.item.layerId),
            score: Number((intensity + nearest.item.score * 0.05 + localDensity.same * 0.04).toFixed(3)),
            context: nearest.item.currentContext ? "current_osm_context" : "selected_year_record",
          },
          geometry: civicBlockCellPolygon(cellCenter, halfWidth, halfHeight, rotation, seed),
        });
      }
      row += 1;
    }
    return cells
      .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
      .slice(0, guideCellLimit(lens.id));
  }

  function civicCatchmentLocalDensity(point, anchors, layerId, kernelM) {
    let sameService = 0;
    let allServices = 0;
    for (const item of anchors) {
      const dx = point[0] - item.local[0];
      const dy = point[1] - item.local[1];
      const distance = Math.hypot(dx, dy);
      if (!Number.isFinite(distance) || distance > kernelM) continue;
      const weight = (1 - distance / kernelM) * Math.max(0.2, Number(item.intensity || 0.5));
      allServices += weight;
      if (item.layerId === layerId) sameService += weight;
    }
    return {
      same: clamp01(sameService * 0.34),
      total: clamp01(allServices * 0.18),
    };
  }

  function civicCatchmentServiceCapacityBias(layerId) {
    const serviceType = String(layerId || "");
    const capacityByType = {
      civic_services: -0.015,
      health: 0.035,
      libraries: -0.06,
      leisure: 0.015,
      council: -0.035,
      safety: -0.075,
    };
    if (Object.prototype.hasOwnProperty.call(capacityByType, serviceType)) return capacityByType[serviceType];
    return (stableUnit(`catchment-service-capacity:${serviceType}`) - 0.5) * 0.08;
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
      const layerId = civicServiceSublayerKey(props, event);
      const baseIntensity = Number(props.intensity || 0.42);
      const eventCountBoost = Math.min(0.16, Number(props.event_count || 1) * 0.025);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(0.2 + baseIntensity * 0.46 + eventCountBoost + proximity * 0.18);
      const angle = Math.atan2(point[1] - center[1], point[0] - center[0]);
      const geometries = civicEvidenceCellPolygons(feature.geometry, point, props, intensity, angle);
      geometries.forEach((geometry, index) => {
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "catchment_patch",
            sublayer_id: layerId,
            render_rank: 6,
            cell_index: index,
            intensity: Number(intensity.toFixed(3)),
            color: surfaceColorForLens(lens.id, intensity, angle, event, lens),
            event_id: eventId || event.id || "",
            source_id: props.source_ids || "",
            service_type: props.service_type || layerId,
            status: props.status || "",
            label: props.label || props.title || "",
            score: Number((intensity + proximity * 0.22 + stableUnit(`${props.id || ""}:${eventId}:${index}`) * 0.04).toFixed(3)),
          },
          geometry,
        });
      });
    }
    return features;
  }

  function civicEvidenceCellPolygons(geometry, point, props, intensity, angle) {
    const bounds = geometryBounds(geometry);
    const declaredSize = Number(props.cell_size_m || 180);
    const widthM = bounds
      ? lngLatDistanceMeters([bounds.minLng, point[1]], [bounds.maxLng, point[1]])
      : declaredSize;
    const heightM = bounds
      ? lngLatDistanceMeters([point[0], bounds.minLat], [point[0], bounds.maxLat])
      : declaredSize;
    const seed = stableUnit(`${props.id || props.event_ids || ""}:civic-evidence-cell`);
    const eventCount = Math.max(1, Number(props.event_count || 1));
    const count = Math.max(4, Math.min(9, Math.ceil(eventCount * 0.9 + intensity * 5)));
    const slots = [
      [-0.28, -0.26],
      [0, -0.28],
      [0.28, -0.22],
      [-0.28, 0],
      [0, 0],
      [0.28, 0.04],
      [-0.22, 0.28],
      [0.06, 0.28],
      [0.32, 0.3],
    ];
    const halfWidth = Math.max(36, Math.min(74, widthM * (0.115 + intensity * 0.036)));
    const halfHeight = Math.max(36, Math.min(74, heightM * (0.115 + intensity * 0.036)));
    return slots.slice(0, count).map(([slotX, slotY], index) => {
      const slotSeed = stableUnit(`${props.id || props.event_ids || ""}:slot:${index}`);
      const dx = widthM * (slotX + (slotSeed - 0.5) * 0.035);
      const dy = heightM * (slotY + (stableUnit(`${slotSeed}:dy`) - 0.5) * 0.035);
      const cellCenter = offsetLngLat(point, dx, dy);
      const rotation = (seed - 0.5) * 0.18 + angle * 0.018 + (slotSeed - 0.5) * 0.1;
      return civicBlockCellPolygon(cellCenter, halfWidth, halfHeight, rotation, slotSeed);
    });
  }

  function civicBlockCellPolygon(center, halfWidthM, halfHeightM, angleRad, seed = 0.5) {
    const trimA = 0.12 + seed * 0.1;
    const trimB = 0.1 + stableUnit(`${seed}:civic-block-b`) * 0.12;
    const pts = [
      [-halfWidthM * (1 - trimA), -halfHeightM],
      [halfWidthM * (1 - trimB), -halfHeightM],
      [halfWidthM, -halfHeightM * (1 - trimA)],
      [halfWidthM, halfHeightM * (1 - trimB)],
      [halfWidthM * (1 - trimB), halfHeightM],
      [-halfWidthM * (1 - trimA), halfHeightM],
      [-halfWidthM, halfHeightM * (1 - trimB)],
      [-halfWidthM, -halfHeightM * (1 - trimA)],
    ];
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const ring = pts.map(([x, y]) => offsetLngLat(center, x * cos - y * sin, x * sin + y * cos));
    ring.push(ring[0]);
    return { type: "Polygon", coordinates: [ring] };
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

  function demandDisplacementColor(layerId, sourceKind = "event") {
    if (sourceKind === "event") return "#75418d";
    if (layerId === "libraries") return "#79419d";
    if (layerId === "safety") return "#825184";
    return "#6d5595";
  }

  function civicCatchmentSublayerFillColor(layerId) {
    const colors = {
      civic_services: "#8dbb98",
      health: "#eda06f",
      libraries: "#b49ad0",
      leisure: "#9ebfd1",
      council: "#95ba8d",
      safety: "#c79b77",
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
    if (minutes <= 15) return "#e98572";
    if (minutes <= 30) return "#efbf7b";
    if (minutes <= 45) return "#ddd98b";
    if (minutes <= 60) return "#a8d3bd";
    return "#c6dfda";
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

  function economyLandUseTileFeatures(center, radiusM, lens, yearOverride = currentTimelineYear()) {
    const buildings = state.detailBuildingFeatures || [];
    if (!buildings.length) return densityGridCells(center, radiusM * 2.1, lens, 92);
    const year = Number(yearOverride) || currentTimelineYear();
    const sourceEvents = lensEventsForYear(year)
      .filter((event) => event.category === "economy" && event.lngLat)
      .filter((event) => economyLandUseSpecificEvent(event));
    const contextOnly = !sourceEvents.length && lensMissingSameCategoryCoverageForYear(lens, year);
    const maxDistance = radiusM * 2.62;
    const features = [];
    for (const building of buildings) {
      const props = building.properties || {};
      if (!contextOnly && Number(props.visible_year || 9999) > year) continue;
      const point = geometryToLngLat(building.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const area = Number(props.footprint_area_m2 || 0);
      if (area && area < 16) continue;
      const nearestEvent = economyLandUseSpecificEvent(nearestGuideEvent(point, sourceEvents, 290));
      const eventDistance = nearestEvent ? lngLatDistanceMeters(point, nearestEvent.lngLat) : Infinity;
      const eventProximity = nearestEvent ? 1 - Math.min(290, eventDistance) / 290 : 0;
      const areaScore = Math.min(0.24, Math.sqrt(Math.max(20, area || 80)) / 220);
      const recency = contextOnly ? 0 : Math.max(0, Math.min(1, (year - Number(props.visible_year || year - 8) + 1) / 12));
      const intensity = clamp01(0.2 + (1 - distance / maxDistance) * 0.34 + eventProximity * 0.36 + areaScore + recency * 0.06);
      const seed = stableUnit(`${props.source_id || ""}:${point[0]?.toFixed(5) || ""}:${point[1]?.toFixed(5) || ""}`);
      const tiles = economyLandUseBuildingTiles(building.geometry, point, area, seed);
      tiles.forEach((tile, tileIndex) => {
        const tilePoint = tile.point || point;
        const tileEventCandidate = nearestEvent || economyLandUseSpecificEvent(nearestGuideEvent(tilePoint, sourceEvents, 220));
        const tileEventDistance = tileEventCandidate?.lngLat ? lngLatDistanceMeters(tilePoint, tileEventCandidate.lngLat) : Infinity;
        const tileEvent = tileEventDistance <= 180 ? tileEventCandidate : null;
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
            source_kind: contextOnly ? "current_context" : "mapped_building_context",
            context_year: contextOnly ? "current_mapped_context" : String(year),
            evidence_role: contextOnly ? "context_not_year_specific_change_evidence" : "selected_year_context",
            visible_year: props.visible_year || "",
            timing_note: props.timing_note || "",
            source_id: `${props.source_id || ""}${tiles.length > 1 ? `:${tileIndex + 1}` : ""}`,
            score: Number((tileIntensity + seed * 0.12 - (tiles.length > 1 ? Math.min(0.08, tiles.length * 0.004) : 0)).toFixed(3)),
          },
          geometry: tile.geometry,
        });
      });
    }
    const blockFeatures = economyLandUseBlockMosaicFeatures(features, center, radiusM, lens, sourceEvents, year, { contextOnly });
    const infillFeatures = economyLandUseRoadInfillTiles(center, radiusM, lens, sourceEvents, year, { contextOnly });
    const limit = contextOnly ? Math.min(guideCellLimit(lens.id), 2200) : guideCellLimit(lens.id);
    const buildingLimit = Math.max(0, limit - infillFeatures.length - blockFeatures.length);
    const buildingFeatures = distributeSurfaceCellsByGrid(features, center, buildingLimit, contextOnly ? 72 : 38);
    return [
      ...blockFeatures,
      ...buildingFeatures,
      ...infillFeatures,
    ]
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, limit);
  }

  function economyLandUseSpecificEvent(event) {
    if (!event) return null;
    const text = [
      event.id,
      event.title,
      event.shortDescription,
      event.summary,
      event.area,
      event.sourceDateField,
      ...(event.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/\b(planning[-\s]?statistics|statistics[-\s]?dataset|dataset[-\s]?csv|house[-\s]?price|hpi|citywide|aggregate|borough)\b/.test(text)) return null;
    if (/\b(retail|shop|market|office|business|hospitality|hotel|restaurant|cafe|bar|pub|visitor|tourism|culture|vacan|derelict|commercial|employment|workspace|industrial|warehouse|residential|student)\b/.test(text)) return event;
    return null;
  }

  function economyLandUseRoadInfillTiles(center, radiusM, lens, sourceEvents = [], yearOverride = currentTimelineYear(), options = {}) {
    const roads = state.detailRoadFeatures || [];
    if (!roads.length) return [];
    const year = Number(yearOverride) || currentTimelineYear();
    const contextOnly = Boolean(options.contextOnly);
    const maxDistance = radiusM * 1.68;
    const features = [];
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer && !["traffic_road", "road"].includes(props.layer)) continue;
      if (!contextOnly && Number(props.visible_year || 9999) > year) continue;
      const rank = Number(props.rank || 1);
      if (geometryDistanceToPointMeters(road.geometry, center, 5) > maxDistance + 80) continue;
      const samples = geometryCoordinateSamples(road.geometry, rank >= 3 ? 11 : rank >= 2 ? 9 : 6);
      if (!samples.length) continue;
      for (const sample of samples) {
        const distance = lngLatDistanceMeters(center, sample);
        if (distance > maxDistance || distance < 28) continue;
        const nearestEvent = economyLandUseSpecificEvent(nearestGuideEvent(sample, sourceEvents, 420));
        const density = sourceEvents.length ? eventDensityIntensity(sample, sourceEvents, 460) : 0;
        const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
        const seed = stableUnit(`land-use-road:${props.source_id || props.id || ""}:${sample[0].toFixed(5)}:${sample[1].toFixed(5)}`);
        const score = clamp01(0.18 + proximity * 0.28 + density * 0.34 + Math.min(0.16, rank * 0.038) + seed * 0.08);
        if (score < 0.2 && rank < 1.6) continue;
        const angle = geometryLineAngleNearPoint(road.geometry, sample) + (seed - 0.5) * 0.08;
        const halfLong = Math.max(8.6, Math.min(22.0, 9.4 + rank * 1.35 + seed * 3.9));
        const halfShort = Math.max(5.6, Math.min(12.4, 5.7 + rank * 0.7 + (1 - seed) * 1.7));
        const sideCount = rank >= 2.15 || density > 0.18 ? 2 : 1;
        for (let sideIndex = 0; sideIndex < sideCount; sideIndex += 1) {
          const side = sideCount === 1 ? (seed > 0.5 ? 1 : -1) : sideIndex === 0 ? -1 : 1;
          const offsetM = side * (7.4 + rank * 1.35 + seed * 4.1);
          const alongM = (stableUnit(`land-use-road-along:${props.source_id || props.id || ""}:${sideIndex}:${sample[0]}`) - 0.5) * 7;
          const tilePoint = offsetLngLat(sample, Math.cos(angle) * alongM - Math.sin(angle) * offsetM, Math.sin(angle) * alongM + Math.cos(angle) * offsetM);
          if (lngLatDistanceMeters(center, tilePoint) > maxDistance) continue;
          features.push({
            type: "Feature",
            properties: {
              kind: "surface_cell",
              lens_id: lens.id,
              surface_style: "land_use_tile",
              source_kind: contextOnly ? "current_context_road_infill" : "road_adjacency_infill",
              context_year: contextOnly ? "current_mapped_context" : String(year),
              evidence_role: contextOnly ? "context_not_year_specific_change_evidence" : "selected_year_context",
              intensity: Number(score.toFixed(3)),
              color: economyLandUseInfillColor(nearestEvent, props, seed),
              event_id: nearestEvent?.id || "",
              source_id: props.source_id || props.id || "",
              score: Number((score + proximity * 0.12 + density * 0.08).toFixed(3)),
            },
            geometry: orientedRectanglePolygon(tilePoint, halfLong, halfShort, angle),
          });
        }
      }
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, contextOnly ? 420 : 1120);
  }

  function economyLandUseBlockMosaicFeatures(tileFeatures, center, radiusM, lens, sourceEvents = [], yearOverride = currentTimelineYear(), options = {}) {
    if (!tileFeatures.length) return [];
    const year = Number(yearOverride) || currentTimelineYear();
    const contextOnly = Boolean(options.contextOnly);
    const bucketM = 66;
    const buckets = new Map();
    for (const feature of tileFeatures) {
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const local = lngLatToLocalMeters(point, center);
      if (!Number.isFinite(local[0]) || !Number.isFinite(local[1])) continue;
      const color = String(feature.properties?.color || economyLandUseInfillColor(null, {}, stableUnit(JSON.stringify(point))));
      const bucket = `${Math.round(local[0] / bucketM)}:${Math.round(local[1] / bucketM)}:${color}`;
      const entry = buckets.get(bucket) || {
        color,
        count: 0,
        sumX: 0,
        sumY: 0,
        weight: 0,
        maxScore: 0,
        sourceIds: new Set(),
        eventIds: new Set(),
        seedKey: bucket,
        points: [],
      };
      const score = Math.max(0.08, Number(feature.properties?.score || feature.properties?.intensity || 0.2));
      entry.count += 1;
      entry.sumX += local[0] * score;
      entry.sumY += local[1] * score;
      entry.weight += score;
      entry.maxScore = Math.max(entry.maxScore, score);
      entry.points.push([local[0], local[1], score]);
      if (feature.properties?.source_id) entry.sourceIds.add(feature.properties.source_id);
      if (feature.properties?.event_id) entry.eventIds.add(feature.properties.event_id);
      buckets.set(bucket, entry);
    }
    const features = [];
    for (const entry of buckets.values()) {
      if (entry.count < 2 && entry.maxScore < 0.48) continue;
      const avgX = entry.sumX / Math.max(0.001, entry.weight);
      const avgY = entry.sumY / Math.max(0.001, entry.weight);
      const point = offsetLngLat(center, avgX, avgY);
      if (lngLatDistanceMeters(center, point) > radiusM * 2.54) continue;
      let xx = 0;
      let yy = 0;
      let xy = 0;
      for (const [x, y, weight] of entry.points) {
        const dx = x - avgX;
        const dy = y - avgY;
        xx += dx * dx * weight;
        yy += dy * dy * weight;
        xy += dx * dy * weight;
      }
      const seed = stableUnit(`land-use-block:${entry.seedKey}`);
      const angle = Math.abs(xx - yy) + Math.abs(xy) > 1
        ? 0.5 * Math.atan2(2 * xy, xx - yy) + (seed - 0.5) * 0.08
        : (seed - 0.5) * 0.22;
      const countBoost = Math.sqrt(Math.max(1, entry.count));
      const intensity = contextOnly
        ? clamp01(0.16 + entry.maxScore * 0.32 + Math.min(0.12, entry.count * 0.018))
        : clamp01(0.24 + entry.maxScore * 0.46 + Math.min(0.2, entry.count * 0.028));
      const halfLong = contextOnly
        ? Math.max(14, Math.min(30, 13 + countBoost * 3.1 + intensity * 5.2))
        : Math.max(16, Math.min(38, 16 + countBoost * 4.6 + intensity * 7.2));
      const halfShort = contextOnly
        ? Math.max(8, Math.min(19, 7 + countBoost * 2.0 + intensity * 3.8))
        : Math.max(9, Math.min(24, 8.5 + countBoost * 2.9 + intensity * 4.8));
      const nearestEvent = economyLandUseSpecificEvent(nearestGuideEvent(point, sourceEvents, 260));
      features.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "land_use_tile",
          source_kind: contextOnly ? "current_context_block_mosaic" : "mapped_building_context_block",
          context_year: contextOnly ? "current_mapped_context" : String(year),
          evidence_role: contextOnly ? "context_not_year_specific_change_evidence" : "selected_year_context",
          intensity: Number(intensity.toFixed(3)),
          color: nearestEvent ? economyLandUseColor(nearestEvent) : entry.color,
          event_id: nearestEvent?.id || [...entry.eventIds][0] || "",
          source_id: [...entry.sourceIds].slice(0, 4).join("|"),
          source_count: entry.sourceIds.size,
          cell_count: entry.count,
          score: Number((intensity + entry.maxScore * 0.22 + seed * 0.035).toFixed(3)),
        },
        geometry: orientedRectanglePolygon(point, halfLong, halfShort, angle),
      });
    }
    return distributeSurfaceCellsByGrid(
      features.sort((a, b) => Number(b.properties.score) - Number(a.properties.score)),
      center,
      contextOnly ? 360 : 980,
      contextOnly ? 96 : 74,
    );
  }

  function geometryLineAngleNearPoint(geometry, point) {
    const coords = geometry?.type === "LineString"
      ? geometry.coordinates
      : geometry?.type === "MultiLineString"
        ? geometry.coordinates?.flat()
        : [];
    const clean = (Array.isArray(coords) ? coords : [])
      .filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]));
    if (clean.length < 2) return 0;
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < clean.length; index += 1) {
      const distance = lngLatDistanceMeters(point, clean[index]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    const a = clean[Math.max(0, bestIndex - 1)];
    const b = clean[Math.min(clean.length - 1, bestIndex + 1)];
    const lat = ((Number(a?.[1]) + Number(b?.[1])) / 2) * Math.PI / 180;
    const dx = (Number(b?.[0]) - Number(a?.[0])) * Math.max(1, Math.cos(lat) * 111320);
    const dy = (Number(b?.[1]) - Number(a?.[1])) * 111320;
    return Math.atan2(dy, dx);
  }

  function economyLandUseInfillColor(nearestEvent, props = {}, seed = 0.5) {
    if (nearestEvent) return economyLandUseColor(nearestEvent);
    const text = [
      props.name,
      props.highway,
      props.route,
      props.landuse,
      props.service,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/station|retail|market|high street|square|centre|center/.test(text)) return "#ca3b32";
    if (/industrial|works|yard|depot|warehouse|service/.test(text)) return "#158c97";
    if (/hotel|quarter|cathedral|leisure|tourism|bar|restaurant/.test(text)) return "#7b3a8f";
    if (/residential|terrace|street|avenue|gardens/.test(text)) return seed < 0.72 ? "#f0b342" : "#f6e4c2";
    if (seed < 0.31) return "#ca3b32";
    if (seed < 0.52) return "#158c97";
    if (seed < 0.66) return "#df8884";
    if (seed < 0.78) return "#7b3a8f";
    if (seed < 0.92) return "#f0b342";
    return "#8a8f8a";
  }

  function economyLandUseBuildingTiles(geometry, point, area, seed = 0.5) {
    if (!geometry || !point) return [{ geometry, point }];
    const bounds = geometryBounds(geometry);
    if (!bounds) return [{ geometry, point }];
    const center = [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    const safeArea = Math.max(24, Number(area || widthM * heightM * 0.55 || 80));
    const angle = footprintLongestEdgeAngle(geometry) + (seed - 0.5) * 0.06;
    const longM = Math.max(widthM, heightM);
    if ((widthM < 26 && heightM < 26) || (longM < 42 && safeArea < 520)) {
      const smallLong = Math.max(8.0, Math.min(16.8, Math.max(longM * 0.58, Math.sqrt(safeArea) * 0.82)));
      const smallShort = Math.max(5.6, Math.min(11.4, Math.max(Math.min(widthM, heightM) * 0.56, Math.sqrt(safeArea) * 0.5)));
      return [{
        point,
        geometry: orientedRectanglePolygon(point, smallLong, smallShort, angle),
      }];
    }
    const targetM = safeArea > 10000 ? 28 : safeArea > 4200 ? 24 : safeArea > 1600 ? 20 : 17;
    const cols = Math.max(1, Math.min(16, Math.ceil(widthM / targetM)));
    const rows = Math.max(1, Math.min(16, Math.ceil(heightM / targetM)));
    if (cols === 1 && rows === 1) {
      return [{
        point,
        geometry,
      }];
    }
    const halfWidth = Math.max(6.2, Math.min(17.6, (widthM / cols) * (0.43 + seed * 0.04)));
    const halfHeight = Math.max(5.6, Math.min(16.2, (heightM / rows) * (0.43 + (1 - seed) * 0.04)));
    const tiles = [];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const dx = (col + 0.5 - cols / 2) * (widthM / cols);
        const dy = (row + 0.5 - rows / 2) * (heightM / rows);
        const tilePoint = offsetLngLat(center, dx * cos - dy * sin, dx * sin + dy * cos);
        if (!pointInGeometry(tilePoint, geometry)) continue;
        tiles.push({
          point: tilePoint,
          geometry: orientedRectanglePolygon(tilePoint, halfWidth, halfHeight, angle),
        });
      }
    }
    return tiles.length >= 2 ? tiles : [{
      point,
      geometry,
    }];
  }

  function footprintLongestEdgeAngle(geometry) {
    const rings = [];
    if (geometry?.type === "Polygon") {
      if (Array.isArray(geometry.coordinates?.[0])) rings.push(geometry.coordinates[0]);
    } else if (geometry?.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates || []) {
        if (Array.isArray(polygon?.[0])) rings.push(polygon[0]);
      }
    }
    let bestLength = 0;
    let bestAngle = 0;
    for (const ring of rings) {
      for (let index = 1; index < ring.length; index += 1) {
        const a = ring[index - 1];
        const b = ring[index];
        if (!Array.isArray(a) || !Array.isArray(b)) continue;
        const lat = ((Number(a[1]) + Number(b[1])) / 2) * Math.PI / 180;
        const dx = (Number(b[0]) - Number(a[0])) * Math.max(1, Math.cos(lat) * 111320);
        const dy = (Number(b[1]) - Number(a[1])) * 111320;
        const length = Math.hypot(dx, dy);
        if (Number.isFinite(length) && length > bestLength) {
          bestLength = length;
          bestAngle = Math.atan2(dy, dx);
        }
      }
    }
    return bestAngle;
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
    if (/vacant|derelict|abandoned|disused/.test(text)) return "#df8884";
    if (/office|industrial|warehouse|factory|manufactur/.test(text)) return "#158c97";
    if (/hotel|restaurant|cafe|bar|pub|leisure|cinema|tourism/.test(text)) return "#7b3a8f";
    const area = Number(props.footprint_area_m2 || 0);
    const height = Number(props.height_m || 0);
    const seed = stableUnit(`${props.source_id || ""}:${point?.[0]?.toFixed(5) || ""}:${point?.[1]?.toFixed(5) || ""}`);
    if (/apartments|residential|house|terrace|dormitory/.test(text)) {
      if (seed < 0.7) return "#f0b342";
      if (seed < 0.82) return "#f6e4c2";
      if (seed < 0.92) return "#df8884";
      return "#158c97";
    }
    if (area > 1800 || height > 18) {
      if (seed < 0.34) return "#ca3b32";
      if (seed < 0.58) return "#158c97";
      if (seed < 0.78) return "#f0b342";
      return "#7b3a8f";
    }
    if (seed < 0.32) return "#ca3b32";
    if (seed < 0.43) return "#df8884";
    if (seed < 0.66) return "#158c97";
    if (seed < 0.78) return "#7b3a8f";
    if (seed < 0.92) return "#f0b342";
    return "#f6e4c2";
  }

  function planningFootprintTileFeatures(center, radiusM, lens) {
    const buildings = state.detailBuildingFeatures || [];
    const year = currentTimelineYear();
    const planningAnchors = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "planning_cell" && feature.geometry && Number(feature.properties?.visible_year || 9999) <= year)
      .map((feature) => ({ feature, point: geometryToLngLat(feature.geometry) }))
      .filter((item) => item.point);
    const planningEvents = lensEventsForYear(year)
      .filter((event) => event.category === "built_environment" && event.lngLat);
    const contextOnly = ["planning-pressure", "planning-delta", "planning-parcels"].includes(lens.id)
      && !planningEvents.length
      && !planningAnchors.length
      && lensMissingSameCategoryCoverageForYear(lens, year);
    const maxDistance = radiusM * (lens.id === "planning-parcels" ? 1.18 : lens.id === "planning-delta" ? 1.04 : lens.id === "planning-pressure" ? 1.34 : 1.9);
    const hasVisibleBuildings = buildings.some((feature) => Number(feature.properties?.visible_year || 9999) <= year);
    const features = lens.id === "planning-parcels"
      ? [
        ...planningParcelStageCellFeatures(center, radiusM, lens, planningAnchors, false),
        ...(!hasVisibleBuildings ? planningDeltaEvidencePointCellFeatures(center, radiusM, lens, planningEvents, []) : []),
      ]
      : lens.id === "planning-delta"
        ? planningDeltaEvidencePointCellFeatures(center, radiusM, lens, planningEvents, planningAnchors)
      : [];
    if (!buildings.length) return features;
    for (const building of buildings) {
      const props = building.properties || {};
      if (!contextOnly && Number(props.visible_year || 9999) > year) continue;
      const point = geometryToLngLat(building.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const area = Number(props.footprint_area_m2 || 0);
      if (area && area < (lens.id === "planning-parcels" ? 12 : 14)) continue;
      const seed = stableUnit(`${props.source_id || ""}:${point[0]?.toFixed(5) || ""}:${point[1]?.toFixed(5) || ""}`);
      const nearest = nearestPlanningAnchor(point, planningAnchors, lens.id === "planning-parcels" ? 260 : lens.id === "planning-pressure" ? 700 : 158);
      const recency = clamp01((year - Number(props.visible_year || year - 12) + 1) / 14);
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const planningIntensity = Number(nearest?.feature?.properties?.intensity || 0);
      const areaBoost = lens.id === "planning-parcels"
        ? Math.min(0.08, Math.sqrt(Math.max(20, area || 90)) / 420)
        : lens.id === "planning-pressure"
          ? Math.min(0.18, Math.sqrt(Math.max(20, area || 90)) / 240)
          : Math.min(0.16, Math.sqrt(Math.max(20, area || 90)) / 260);
      const statusBoost = contextOnly ? 0 : nearest ? (lens.id === "planning-parcels" ? 0.08 : lens.id === "planning-pressure" ? 0.28 : 0.2) : 0;
      const intensity = lens.id === "planning-pressure"
        ? clamp01(0.18 + proximity * 0.18 + planningIntensity * 0.38 + statusBoost * 0.56 + areaBoost * 0.56 + recency * 0.04)
        : lens.id === "planning-parcels"
          ? clamp01(0.16 + proximity * 0.16 + planningIntensity * 0.28 + statusBoost + areaBoost + recency * 0.04)
          : clamp01(0.18 + proximity * 0.22 + planningIntensity * 0.36 + statusBoost + areaBoost + recency * 0.06);
      const tiles = lens.id === "planning-parcels"
        ? planningParcelGeometryTiles(building.geometry, point, area, seed)
        : [{ geometry: building.geometry, point }];
      tiles.forEach((tile, tileIndex) => {
        if (!tile.geometry) return;
        const tilePoint = tile.point || point;
        const tileNearest = tileIndex ? (nearestPlanningAnchor(tilePoint, planningAnchors, lens.id === "planning-parcels" ? 260 : lens.id === "planning-pressure" ? 760 : 180) || nearest) : nearest;
        const tileSeed = stableUnit(`${props.source_id || ""}:${tileIndex}:${tilePoint?.[0]?.toFixed(5) || ""}:${tilePoint?.[1]?.toFixed(5) || ""}`);
        const tileIntensity = lens.id === "planning-parcels"
          ? clamp01(intensity * 0.86 + (tileNearest ? 0.07 : 0) + tileSeed * 0.035)
          : lens.id === "planning-pressure"
            ? clamp01(intensity * 0.92 + (tileNearest ? 0.06 : 0) + tileSeed * 0.03)
            : intensity;
        const nearestProps = tileNearest?.feature?.properties || nearest?.feature?.properties || null;
        const stageMatch = lens.id === "planning-parcels"
          ? planningParcelStageMatch(nearestProps, tileSeed)
          : {
            status: nearestProps?.lifecycle_status || "unknown",
            eventId: firstDetailEventId(nearestProps || {}),
          };
        const planningStatus = stageMatch.status || "unknown";
        const pressureContextOnly = contextOnly && !nearestProps && lens.id === "planning-pressure";
        const pressureDriver = lens.id === "planning-pressure"
          ? (pressureContextOnly ? "mapped_context" : planningPressureDriverKey(nearestProps || props))
          : "";
        const color = pressureContextOnly
          ? "#8ca7a0"
          : contextOnly && !nearestProps && lens.id === "planning-delta"
            ? "#b8b6a8"
            : planningFootprintColor(lens.id, props, { ...(nearestProps || {}), lifecycle_status: planningStatus, intensity: tileIntensity }, tilePoint, tileIntensity);
        features.push({
          type: "Feature",
          properties: {
            kind: "surface_cell",
            lens_id: lens.id,
            surface_style: "planning_footprint",
            intensity: Number(tileIntensity.toFixed(3)),
            color,
            event_id: stageMatch.eventId || "",
            planning_status: planningStatus,
            sublayer_id: pressureDriver || planningAspectLayerId(planningStatus),
            geometry_basis: tile.geometryBasis || "building_footprint",
            source_kind: contextOnly ? "current_context" : (stageMatch.eventId ? "source_backed" : "mapped_building_context"),
            context_year: contextOnly ? "current_mapped_context" : String(year),
            evidence_role: contextOnly ? "context_not_year_specific_change_evidence" : "selected_year_context",
            visible_year: props.visible_year || "",
            timing_note: props.timing_note || "",
            source_id: `${props.source_id || ""}${tiles.length > 1 ? `:${tileIndex + 1}` : ""}`,
            score: Number((tileIntensity + (tileNearest ? 0.16 : 0) + tileSeed * 0.08 - (tiles.length > 1 ? 0.025 : 0)).toFixed(3)),
          },
          geometry: tile.geometry,
        });
      });
    }
    const selectedCells = features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
    if (lens.id !== "planning-parcels") return selectedCells;
    const hatches = selectedCells.flatMap((feature) => planningParcelHatchFeatures(feature));
    return [...selectedCells, ...hatches];
  }

  function planningParcelStageCellFeatures(center, radiusM, lens, planningAnchors, withHatches = true) {
    const maxDistance = radiusM * 1.18;
    const cells = [];
    for (const anchor of planningAnchors) {
      const props = anchor.feature?.properties || {};
      const distance = lngLatDistanceMeters(center, anchor.point);
      if (!Number.isFinite(distance) || distance > maxDistance) continue;
      const seed = stableUnit(`${props.id || props.source_id || anchor.point.join(":")}:parcel-stage`);
      const stageMatch = planningParcelStageMatch(props, seed);
      const planningStatus = stageMatch.status || props.lifecycle_status || "unknown";
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const eventCount = Number(props.event_count || detailEventIds(props).length || 1);
      const sourceIntensity = clamp01(Number(props.intensity || 0.32));
      const intensity = clamp01(0.22 + sourceIntensity * 0.5 + proximity * 0.13 + Math.min(0.18, eventCount * 0.035) + seed * 0.035);
      const sublayerId = planningAspectLayerId(planningStatus);
      const cellGeometry = planningParcelInsetGeometry(anchor.feature.geometry, anchor.point, 0.84 + seed * 0.05);
      const color = planningFootprintColor(lens.id, {}, { ...props, lifecycle_status: planningStatus, intensity }, anchor.point, intensity);
      cells.push({
        type: "Feature",
        properties: {
          kind: "surface_cell",
          lens_id: lens.id,
          surface_style: "planning_footprint",
          intensity: Number(intensity.toFixed(3)),
          color,
          event_id: stageMatch.eventId || firstDetailEventId(props),
          planning_status: planningStatus,
          sublayer_id: sublayerId,
          geometry_basis: "source_planning_cell",
          source_id: props.id || props.source_id || `planning-cell:${anchor.point[0].toFixed(5)}:${anchor.point[1].toFixed(5)}`,
          score: Number((intensity + proximity * 0.16 + Math.min(0.14, eventCount * 0.025) + seed * 0.06).toFixed(3)),
        },
        geometry: cellGeometry || anchor.feature.geometry,
      });
    }
    const selectedCells = cells
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, guideCellLimit(lens.id));
    if (!withHatches) return selectedCells;
    const hatches = selectedCells.flatMap((feature) => planningParcelHatchFeatures(feature));
    return [...selectedCells, ...hatches];
  }

  function planningDeltaEvidencePointCellFeatures(center, radiusM, lens, planningEvents, planningAnchors) {
    const maxDistance = radiusM * 1.18;
    const anchorCells = planningParcelStageCellFeatures(center, radiusM, lens, planningAnchors, false)
      .map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties || {}),
          source_kind: "source_backed",
          geometry_basis: "source_planning_cell",
          evidence_role: "selected_year_planning_cell",
        },
      }));
    const nearbyEvents = planningEvents
      .map((event) => ({ event, distance: lngLatDistanceMeters(center, event.lngLat) }))
      .filter((item) => Number.isFinite(item.distance) && item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 80);
    const sparseReplicaCount = nearbyEvents.length <= 1 ? 3 : nearbyEvents.length <= 3 ? 2 : 1;
    const eventCells = nearbyEvents
      .flatMap(({ event, distance }) => {
        const status = planningStageStatusKey(event);
        const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
        const sourceBoost = Math.min(0.18, eventSourceCount(event) * 0.035);
        return Array.from({ length: sparseReplicaCount }, (_, index) => {
          const seed = stableUnit(`${event.id}:planning-delta-cell:${index}`);
          const intensity = clamp01(0.28 + proximity * 0.28 + sourceBoost + seed * 0.08 - index * 0.035);
          const halfWidth = 22 + seed * 18;
          const halfHeight = 9 + stableUnit(`${event.id}:planning-delta-height:${index}`) * 12;
          const angle = seed * Math.PI;
          const offset = sparseReplicaCount > 1
            ? offsetLngLat(event.lngLat, Math.cos(angle) * index * 26, Math.sin(angle) * index * 18)
            : event.lngLat;
          return {
            type: "Feature",
            properties: {
              kind: "surface_cell",
              lens_id: lens.id,
              surface_style: "planning_footprint",
              intensity: Number(intensity.toFixed(3)),
              color: planningFootprintColor(lens.id, {}, { ...event, lifecycle_status: status, intensity }, offset, intensity),
              event_id: event.id,
              planning_status: status,
              sublayer_id: planningAspectLayerId(status),
              geometry_basis: "source_event_point_context_cell",
              source_kind: "source_event_context",
              context_year: String(currentTimelineYear()),
              evidence_role: index ? "event_point_context_extent_proxy" : "event_point_context_not_measured_footprint",
              source_id: (event.sourceIds || []).join(","),
              cell_index: index + 1,
              score: Number((intensity + sourceBoost + proximity * 0.12 + seed * 0.05 - index * 0.02).toFixed(3)),
            },
            geometry: orientedRectanglePolygon(offset, halfWidth, halfHeight, angle),
          };
        });
      })
      .filter(Boolean);
    return [...anchorCells, ...eventCells]
      .sort((a, b) => Number(b.properties.score || 0) - Number(a.properties.score || 0))
      .slice(0, Math.min(220, Math.max(12, guideCellLimit(lens.id) / 8)));
  }

  function planningParcelInsetGeometry(geometry, center, scale = 0.88) {
    if (!geometry?.coordinates || !center) return geometry || null;
    const clampedScale = Math.max(0.72, Math.min(0.94, Number(scale) || 0.88));
    const scaleCoord = (coord) => [
      center[0] + (coord[0] - center[0]) * clampedScale,
      center[1] + (coord[1] - center[1]) * clampedScale,
    ];
    if (geometry.type === "Polygon") {
      return {
        type: "Polygon",
        coordinates: geometry.coordinates.map((ring) => ring.map(scaleCoord)),
      };
    }
    if (geometry.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map(scaleCoord))),
      };
    }
    return geometry;
  }

  function planningParcelGeometryTiles(geometry, point, area, seed = 0.5) {
    const envelope = planningParcelEnvelopeGeometry(geometry, point, area, seed);
    if (!geometry || !point) return envelope ? [{ geometry: envelope, point }] : [];
    const subdivisions = planningParcelSubdivisionTiles(geometry, point, area, seed);
    if (subdivisions.length > 1) return subdivisions;
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      return [{
        geometry: envelope || geometry,
        point,
        geometryBasis: envelope ? "parcel_proxy_from_osm_footprint" : "building_footprint",
      }];
    }
    return envelope ? [{ geometry: envelope, point }] : [];
  }

  function planningParcelSubdivisionTiles(geometry, point, area, seed = 0.5) {
    const bounds = geometryBounds(geometry);
    if (!bounds || !point) return [];
    const center = [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    const longSide = Math.max(widthM, heightM);
    const shortSide = Math.min(widthM, heightM);
    if (!Number.isFinite(longSide) || !Number.isFinite(shortSide)) return [];
    if (Number(area || 0) < 260 && longSide < 32) return [];
    const columns = longSide > 78 || Number(area || 0) > 1800 ? 3 : longSide > 32 || Number(area || 0) > 360 ? 2 : 1;
    const rows = shortSide > 34 && Number(area || 0) > 900 ? 2 : 1;
    if (columns * rows < 2) return [];
    const angle = footprintLongestEdgeAngle(geometry) + (seed - 0.5) * 0.025;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const spanLong = Math.min(longSide, Number(area || 0) > 2500 ? 72 : 58);
    const spanShort = Math.min(shortSide, Number(area || 0) > 2500 ? 38 : 30);
    const gap = 2.4 + seed * 1.1;
    const halfLong = Math.max(6.4, Math.min(15.2, spanLong / (columns * 2) - gap * 0.34));
    const halfShort = Math.max(5.2, Math.min(12.2, spanShort / (rows * 2) - gap * 0.28));
    const tiles = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const xOffset = (column - (columns - 1) / 2) * (halfLong * 2 + gap);
        const yOffset = (row - (rows - 1) / 2) * (halfShort * 2 + gap);
        const tilePoint = offsetLngLat(center, xOffset * cos - yOffset * sin, xOffset * sin + yOffset * cos);
        tiles.push({
          point: tilePoint,
          geometry: orientedRectanglePolygon(tilePoint, halfLong, halfShort, angle),
          geometryBasis: "parcel_proxy_subdivision_from_osm_footprint",
        });
      }
    }
    return tiles;
  }

  function planningParcelStageMatch(planningProps, seed = 0.5) {
    const fallbackStatus = String(planningProps?.lifecycle_status || planningProps?.status || "unknown").toLowerCase();
    const ids = detailEventIds(planningProps || {});
    if (!ids.length) return { status: fallbackStatus || "unknown", eventId: "" };
    const start = Math.min(ids.length - 1, Math.max(0, Math.floor(clamp01(seed) * ids.length)));
    let fallbackEventId = ids[start] || ids[0] || "";
    for (let offset = 0; offset < ids.length; offset += 1) {
      const eventId = ids[(start + offset) % ids.length];
      const event = state.eventById.get(eventId);
      const status = planningLifecycleStatusFromEvent(eventId, event);
      if (status) return { status, eventId };
      if (!fallbackEventId && eventId) fallbackEventId = eventId;
    }
    return { status: fallbackStatus || "unknown", eventId: fallbackEventId };
  }

  function detailEventIds(props) {
    const raw = props?.event_ids_all || props?.event_ids || "";
    const seen = new Set();
    return String(raw)
      .split(",")
      .map((value) => value.trim())
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }

  function planningLifecycleStatusFromEvent(eventId, event) {
    const text = [
      eventId,
      event?.title,
      event?.shortDescription,
      event?.summary,
      event?.area,
    ].filter(Boolean).join(" ").toLowerCase();
    if (!text) return "";
    if (/\b(dca|demolition|demolish|demolished|removal)\b/.test(text) || /[-_]dca(?:[-_]|$)/.test(text)) return "demolished";
    if (/\b(completed|complete|opened|opening|delivered|operational|finished|unveiled)\b/.test(text)) return "completed";
    if (/\b(under construction|construction started|works started|work started|works were due to start|underway|on site|stage 3|committed)\b/.test(text)) return "construction";
    if (/\b(application submitted|advertised|proposal|proposed|consultation|pre-application|outline)\b/.test(text) || /[-_]a(?:[-_]|$)/.test(text)) return "proposed";
    if (/\b(approval|approved|granted|permission|permitted|consent|secured)\b/.test(text) || /[-_]f(?:[-_]|$)/.test(text) || /[-_]lbc(?:[-_]|$)/.test(text)) return "permitted";
    return "";
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
    const padBase = Math.max(2.6, Math.min(7.5, 2.2 + areaRoot / 15));
    const cap = area > 2500 ? 30 : area > 900 ? 24 : area > 220 ? 18 : 13;
    const angle = footprintLongestEdgeAngle(geometry) + (seed - 0.5) * 0.035;
    const halfWidth = Math.max(widthM / 2 + padBase * (0.28 + seed * 0.12), 5.4 + seed * 3.1);
    const halfHeight = Math.max(heightM / 2 + padBase * (0.3 + (1 - seed) * 0.12), 5 + (1 - seed) * 3);
    return orientedRectanglePolygon(
      center,
      Math.min(cap, halfWidth),
      Math.min(cap, halfHeight),
      angle,
    );
  }

  function planningParcelHatchFeatures(parcelFeature) {
    const props = parcelFeature?.properties || {};
    const geometry = parcelFeature?.geometry;
    const center = geometryToLngLat(geometry);
    const bounds = geometryBounds(geometry);
    if (!center || !bounds) return [];
    const widthM = lngLatDistanceMeters([bounds.minLng, center[1]], [bounds.maxLng, center[1]]);
    const heightM = lngLatDistanceMeters([center[0], bounds.minLat], [center[0], bounds.maxLat]);
    const shortSide = Math.min(widthM, heightM);
    const longSide = Math.max(widthM, heightM);
    if (!Number.isFinite(shortSide) || shortSide < 10 || longSide < 14) return [];
    const seed = stableUnit(`${props.source_id || ""}:parcel-hatch`);
    const status = String(props.planning_status || "").toLowerCase();
    const isUncertain = !status || status === "unknown" || status === "inferred" || status === "uncertain";
    if (!isUncertain) return [];
    const lineCount = Math.max(1, Math.min(isUncertain ? 4 : 3, Math.round(shortSide / 9)));
    const baseAngle = footprintLongestEdgeAngle(geometry);
    const hatchAngle = baseAngle + Math.PI / 4;
    const cos = Math.cos(hatchAngle);
    const sin = Math.sin(hatchAngle);
    const perpCos = Math.cos(hatchAngle + Math.PI / 2);
    const perpSin = Math.sin(hatchAngle + Math.PI / 2);
    const spacing = shortSide / (lineCount + 1);
    const halfLength = Math.min(30, longSide * 0.44);
    const color = isUncertain ? "#9f9a8d" : props.color || "#9a7b54";
    const features = [];
    for (let index = 0; index < lineCount; index += 1) {
      const offset = (index + 1 - (lineCount + 1) / 2) * spacing + (seed - 0.5) * 1.2;
      const segmentCenter = offsetLngLat(center, perpCos * offset, perpSin * offset);
      features.push({
        type: "Feature",
        properties: {
          kind: "parcel_hatch",
          lens_id: "planning-parcels",
          intensity: Number(Math.max(0.16, Number(props.intensity || 0.4) * (isUncertain ? 0.78 : 0.62)).toFixed(3)),
          color,
          planning_status: props.planning_status || "unknown",
          sublayer_id: props.sublayer_id || "unknown",
          source_id: props.source_id || "",
          score: Number(props.score || 0),
        },
        geometry: {
          type: "LineString",
          coordinates: [
            offsetLngLat(segmentCenter, -cos * halfLength, -sin * halfLength),
            offsetLngLat(segmentCenter, cos * halfLength, sin * halfLength),
          ],
        },
      });
    }
    return features;
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

  function planningFootprintColor(lensId, buildingProps, planningProps, point, renderIntensity = null) {
    const status = String(planningProps?.lifecycle_status || "").toLowerCase();
    if (lensId === "planning-pressure") {
      const intensity = clamp01(Number(renderIntensity ?? planningProps?.intensity ?? 0.45));
      if (intensity > 0.82) return "#d98166";
      if (intensity > 0.64) return "#e9a26a";
      if (intensity > 0.46) return "#e5b56d";
      if (intensity > 0.3) return "#d4b79a";
      return "#b9c6c7";
    }
    if (lensId === "planning-delta") {
      if (status === "demolished") return "#8f9494";
      if (status === "construction") return "#8460a8";
      if (status === "completed") return "#d8583f";
      if (status === "permitted" || status === "planned" || status === "proposed") return "#d87965";
    }
    if (lensId === "planning-parcels") {
      if (status === "demolished") return "#d9598e";
      if (status === "construction") return "#8468b8";
      if (status === "completed") return "#6f9c7b";
      if (status === "permitted" || status === "planned") return "#efb24d";
      if (status === "proposed") return "#ee7477";
      return "#c6c0b3";
    }
    if (status === "demolished") return lensId === "planning-delta" ? "#8f9494" : "#d95a94";
    if (status === "construction") return lensId === "planning-delta" ? "#8460a8" : "#866bb8";
    if (status === "completed") return lensId === "planning-delta" ? "#d8583f" : "#7fa780";
    if (status === "permitted" || status === "planned") return lensId === "planning-delta" ? "#e7b454" : "#f4c762";
    if (status === "proposed") return lensId === "planning-delta" ? "#d87965" : "#ee7477";
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
    const features = transportRoadFeaturesForYear(year);
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.layer !== "traffic_road") continue;
      if (!transportActivityRoadMatchesYear(props, year)) continue;
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

  function clipLineGeometryToRadius(geometry, center, radiusM) {
    if (!geometry || !center || !Number.isFinite(radiusM) || radiusM <= 0) return null;
    const clippedSequences = [];
    const radiusSq = radiusM * radiusM;
    const flush = (sequence) => {
      if (sequence.length >= 2 && geometryLineLengthMeters({ type: "LineString", coordinates: sequence }) >= 7) {
        clippedSequences.push(sequence);
      }
    };
    for (const sequence of geometryLineCoordinateSequences(geometry)) {
      let current = [];
      for (let index = 1; index < sequence.length; index += 1) {
        const from = sequence[index - 1];
        const to = sequence[index];
        const fromLocal = lngLatToLocalMeters(from, center);
        const toLocal = lngLatToLocalMeters(to, center);
        const interval = lineSegmentCircleInterval(fromLocal, toLocal, radiusSq);
        if (!interval) {
          flush(current);
          current = [];
          continue;
        }
        const [startT, endT] = interval;
        const start = interpolateLngLat(from, to, startT);
        const end = interpolateLngLat(from, to, endT);
        if (!current.length) {
          current.push(start);
        } else if (lngLatDistanceMeters(current[current.length - 1], start) > 8) {
          flush(current);
          current = [start];
        }
        if (lngLatDistanceMeters(current[current.length - 1], end) >= 0.5) current.push(end);
        if (endT < 0.999) {
          flush(current);
          current = [];
        }
      }
      flush(current);
    }
    if (!clippedSequences.length) return null;
    if (clippedSequences.length === 1) return { type: "LineString", coordinates: clippedSequences[0] };
    return { type: "MultiLineString", coordinates: clippedSequences };
  }

  function lineGeometrySegmentAroundPoint(geometry, anchor, segmentLengthM = 180, seedKey = "") {
    const sequences = geometryLineCoordinateSequences(geometry);
    if (!anchor || !sequences.length) return geometry;
    const seed = stableUnit(`line-segment:${seedKey}:${anchor[0]?.toFixed?.(5) || ""}:${anchor[1]?.toFixed?.(5) || ""}`);
    let best = null;
    for (const sequence of sequences) {
      const cumulative = [0];
      for (let index = 1; index < sequence.length; index += 1) {
        cumulative[index] = cumulative[index - 1] + lngLatDistanceMeters(sequence[index - 1], sequence[index]);
      }
      const total = cumulative[cumulative.length - 1] || 0;
      if (total < 9) continue;
      for (let index = 1; index < sequence.length; index += 1) {
        const fromLocal = lngLatToLocalMeters(sequence[index - 1], anchor);
        const toLocal = lngLatToLocalMeters(sequence[index], anchor);
        const vx = toLocal[0] - fromLocal[0];
        const vy = toLocal[1] - fromLocal[1];
        const segmentLengthSq = vx * vx + vy * vy;
        const t = segmentLengthSq > 0.001
          ? Math.max(0, Math.min(1, -(fromLocal[0] * vx + fromLocal[1] * vy) / segmentLengthSq))
          : 0;
        const px = fromLocal[0] + vx * t;
        const py = fromLocal[1] + vy * t;
        const distance = Math.hypot(px, py);
        const along = cumulative[index - 1] + (cumulative[index] - cumulative[index - 1]) * t;
        if (!best || distance < best.distance) {
          best = { sequence, cumulative, total, distance, along };
        }
      }
    }
    if (!best) return geometry;
    const targetLength = Math.max(28, Number(segmentLengthM || 180)) * (0.82 + seed * 0.28);
    if (best.total <= targetLength * 1.08) return { type: "LineString", coordinates: best.sequence };
    const startShare = 0.42 + seed * 0.18;
    const startDistance = Math.max(0, Math.min(best.total - targetLength, best.along - targetLength * startShare));
    const endDistance = Math.min(best.total, startDistance + targetLength);
    const coordinates = lineSequenceSliceByDistance(best.sequence, best.cumulative, startDistance, endDistance);
    return coordinates.length >= 2 ? { type: "LineString", coordinates } : { type: "LineString", coordinates: best.sequence };
  }

  function lineSequenceSliceByDistance(sequence, cumulative, startDistance, endDistance) {
    const coordinates = [];
    const start = pointAtLineSequenceDistance(sequence, cumulative, startDistance);
    const end = pointAtLineSequenceDistance(sequence, cumulative, endDistance);
    if (!start || !end) return [];
    coordinates.push(start);
    for (let index = 1; index < sequence.length - 1; index += 1) {
      const distance = cumulative[index];
      if (distance > startDistance + 0.35 && distance < endDistance - 0.35) {
        const previous = coordinates[coordinates.length - 1];
        if (!previous || lngLatDistanceMeters(previous, sequence[index]) > 0.5) coordinates.push(sequence[index]);
      }
    }
    const previous = coordinates[coordinates.length - 1];
    if (!previous || lngLatDistanceMeters(previous, end) > 0.5) coordinates.push(end);
    return coordinates;
  }

  function pointAtLineSequenceDistance(sequence, cumulative, targetDistance) {
    if (!sequence.length) return null;
    if (targetDistance <= 0) return sequence[0];
    const total = cumulative[cumulative.length - 1] || 0;
    if (targetDistance >= total) return sequence[sequence.length - 1];
    for (let index = 1; index < sequence.length; index += 1) {
      if (cumulative[index] < targetDistance) continue;
      const segmentStart = cumulative[index - 1];
      const segmentLength = Math.max(0.0001, cumulative[index] - segmentStart);
      return interpolateLngLat(sequence[index - 1], sequence[index], (targetDistance - segmentStart) / segmentLength);
    }
    return sequence[sequence.length - 1];
  }

  function lineSegmentCircleInterval(fromLocal, toLocal, radiusSq) {
    const dx = toLocal[0] - fromLocal[0];
    const dy = toLocal[1] - fromLocal[1];
    const a = dx * dx + dy * dy;
    const b = 2 * (fromLocal[0] * dx + fromLocal[1] * dy);
    const c = fromLocal[0] * fromLocal[0] + fromLocal[1] * fromLocal[1] - radiusSq;
    if (a <= 0.0001) return c <= 0 ? [0, 1] : null;
    if (c <= 0 && (toLocal[0] * toLocal[0] + toLocal[1] * toLocal[1] - radiusSq) <= 0) return [0, 1];
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return c <= 0 ? [0, 1] : null;
    const sqrt = Math.sqrt(discriminant);
    const rootA = (-b - sqrt) / (2 * a);
    const rootB = (-b + sqrt) / (2 * a);
    const start = Math.max(0, Math.min(rootA, rootB));
    const end = Math.min(1, Math.max(rootA, rootB));
    return start <= end ? [start, end] : null;
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
    if (lens.id === "transport-access") {
      return transportAccessNetworkFlowFeatures(center, lens);
    }
    if (lens.id === "planning-pressure") {
      return planningPressureStreetFeatures(center, lens);
    }
    if (lens.id === "civic-access-gaps") {
      return civicAccessGapStreetFeatures(center, lens);
    }
    if (lens.id === "civic-catchment") {
      return civicCatchmentStreetSeamFeatures(center, lens);
    }
    if (lens.id === "civic-demand") {
      return civicDemandDisplacementFlowFeatures(center, lens);
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
      const isDemandDisplacement = lens.id === "civic-demand";
      return {
      type: "Feature",
      properties: {
        kind: "flow",
        lens_id: lens.id,
        flow_style: isDemandDisplacement ? "demand_displacement" : "event_link",
        layer_id: isDemandDisplacement ? "displacement" : "",
        sublayer_id: isDemandDisplacement ? "displacement" : "",
        event_id: item.event.id,
        intensity: Number(intensity.toFixed(2)),
        color: isDemandDisplacement ? "#75418d" : guideFlowColor(lens, item.event, index, intensity),
        edge_offset: isDemandDisplacement ? Number(((index % 3) - 1).toFixed(2)) : 0,
      },
      geometry: {
        type: "LineString",
        coordinates: isDemandDisplacement
          ? demandDisplacementLine(center, item.event.lngLat, item.event, index, maxDistance)
          : curvedLine(center, item.event.lngLat, index % 2 ? -0.18 : 0.18),
      },
    };
    });
  }

  function civicDemandDisplacementFlowFeatures(center, lens) {
    const year = currentTimelineYear();
    const radiusM = Number(lens.radiusM || 1500);
    const maxDistance = radiusM * 1.65;
    const candidates = [];
    const seen = new Set();
    const pushCandidate = (point, event = null, props = {}, sourceKind = "event") => {
      if (!point) return;
      const distance = lngLatDistanceMeters(center, point);
      if (distance < 150 || distance > maxDistance) return;
      const eventId = event?.id || firstDetailEventId(props) || props.source_id || props.id || "";
      const key = eventId || `${point[0].toFixed(5)},${point[1].toFixed(5)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const intensity = clamp01(Number(props.intensity || 0.42)
        + Math.min(0.22, Number(props.event_count || 1) * 0.028)
        + Math.max(0, 1 - distance / maxDistance) * 0.28);
      const proximity = 1 - Math.min(distance, maxDistance) / maxDistance;
      candidates.push({
        point,
        event,
        eventId,
        sourceId: props.source_id || props.id || "",
        layerId: civicServiceSublayerKey(props, event),
        distance,
        intensity,
        sourceKind,
        confidence: event?.confidence || props.confidence || "documented",
        score: proximity * 0.54
          + intensity * 0.34
          + confidenceRank(event?.confidence || props.confidence || "documented") * 0.035
          + (sourceKind === "event" ? 0.08 : 0),
      });
    };
    for (const event of lensEventsForYear(year).filter((item) => item.category === "civic_services" && item.lngLat)) {
      pushCandidate(event.lngLat, event, event, "event");
    }
    for (const feature of state.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "civic_facility" || Number(props.visible_year || 9999) > year) continue;
      pushCandidate(geometryToLngLat(feature.geometry), null, props, "detail");
    }
    for (const feature of state.civicServiceFeatures || []) {
      const props = feature.properties || {};
      if (Number(props.visible_year || 0) > year) continue;
      pushCandidate(geometryToLngLat(feature.geometry), null, props, "facility");
    }
    const selected = [];
    const buckets = new Map();
    const layerCounts = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      if (selected.length >= 20) break;
      const bucket = transportAngleBucket(center, item.point, 20);
      const bucketCount = buckets.get(bucket) || 0;
      const layerCount = layerCounts.get(item.layerId) || 0;
      if (bucketCount >= 2) continue;
      if (layerCount >= 4) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < 135)) continue;
      selected.push(item);
      buckets.set(bucket, bucketCount + 1);
      layerCounts.set(item.layerId, layerCount + 1);
    }
    return selected.map((item, index) => {
      const intensity = clamp01(0.34 + item.intensity * 0.44 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.18);
      return {
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "demand_displacement",
          layer_id: "displacement",
          sublayer_id: "displacement",
          service_sublayer: item.layerId,
          source_kind: item.sourceKind,
          event_id: item.eventId,
          source_id: item.sourceId,
          intensity: Number(intensity.toFixed(2)),
          color: demandDisplacementColor(item.layerId, item.sourceKind),
          edge_offset: Number(((index % 3) - 1).toFixed(2)),
          score: Number(item.score.toFixed(3)),
        },
        geometry: {
          type: "LineString",
          coordinates: demandDisplacementLine(
            center,
            item.point,
            item.event || { id: item.eventId, confidence: item.confidence },
            index,
            maxDistance,
          ),
        },
      };
    });
  }

  function demandDisplacementLine(center, target, event, index, maxDistance) {
    const [dx, dy] = lngLatToLocalMeters(target, center);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / distance;
    const uy = dy / distance;
    const px = -uy;
    const py = ux;
    const seed = stableUnit(`demand-flow:${event?.id || ""}:${index}`);
    const lineLength = Math.max(340, Math.min(1050, distance * (0.45 + seed * 0.22)));
    const midDistance = Math.max(
      220,
      Math.min(maxDistance * 0.94, distance * (0.38 + seed * 0.36)),
    );
    const laneOffset = ((index % 5) - 2) * 56 + (seed - 0.5) * 98;
    const startDistance = Math.max(120, midDistance - lineLength * 0.5);
    const endDistance = Math.min(maxDistance * 0.98, midDistance + lineLength * 0.5);
    const endSplay = (seed - 0.5) * 118;
    const start = offsetLngLat(center, ux * startDistance + px * laneOffset, uy * startDistance + py * laneOffset);
    const end = offsetLngLat(center, ux * endDistance + px * (laneOffset + endSplay), uy * endDistance + py * (laneOffset + endSplay));
    const bend = (index % 2 ? -1 : 1) * (0.1 + seed * 0.06);
    return curvedLine(start, end, bend);
  }

  function transportSpeedNetworkStreetFeatures(center, lens, yearOverride = currentTimelineYear()) {
    const year = Number(yearOverride) || currentTimelineYear();
    const roads = transportRoadFeaturesForYear(year);
    if (!roads.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 3.95;
    const events = lensEventsForYear(year)
      .filter((event) => event.category === "transport" && event.lngLat);
    const features = [];
    const seenRoadIds = new Set();
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer !== "traffic_road") continue;
      if (!transportActivityRoadMatchesYear(props, year)) continue;
      const distance = geometryDistanceToPointMeters(road.geometry, center, 7);
      if (distance > maxDistance) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const rank = Number(props.rank || 1);
      const activity = clamp01(Number(props.transport_activity || 0));
      const named = transportNamedCorridor(props);
      const eventDensity = eventDensityIntensity(point, events, 900);
      const pressure = transportSpeedRoutePressure({
        activity,
        distance,
        eventDensity,
        rank,
        radiusM,
        routeLengthM,
      });
      if (!transportSpeedRouteCandidate({ activity, distance, named, pressure, rank, radiusM, routeLengthM })) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(0.24 + pressure * 0.56 + Math.min(0.15, Math.max(0, rank - 1) * 0.045) + proximity * 0.07);
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
          color: transportSpeedThreadColor(pressure, activity, rank),
          source_kind: "activity",
          corridor_key: transportCorridorKey(props),
          corridor_named: named ? 1 : 0,
          angle_bucket: transportAngleBucket(center, point),
          rank,
          route_length_m: Math.round(routeLengthM),
          activity: Number(activity.toFixed(3)),
          speed_pressure: Number(pressure.toFixed(3)),
          score: Number((pressure * 0.72
            + Math.min(0.3, rank * 0.07)
            + Math.min(0.14, routeLengthM / 1800)
            + eventDensity * 0.08
            + proximity * 0.05
            + (named ? 0.06 : 0)
            + stableUnit(props.source_id || props.id || "") * 0.028).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    features.push(...transportSpeedDetailRoadContextFeatures(center, lens, seenRoadIds, events, year));
    return distributedTransportThreadFeatures(features, lens);
  }

  function transportNamedCorridor(props = {}) {
    const name = String(props.name || "").trim().toLowerCase();
    return Boolean(name && name !== "mapped road segment");
  }

  function transportSpeedRoutePressure({ activity, distance, eventDensity, rank, radiusM, routeLengthM }) {
    const maxDistance = radiusM * 3.95;
    const corePressure = 1 - Math.min(distance, radiusM * 1.55) / (radiusM * 1.55);
    const nearPressure = 1 - Math.min(distance, maxDistance) / maxDistance;
    const rankPressure = clamp01((rank - 1) / 3);
    const lengthSignal = Math.min(0.1, routeLengthM / 1800);
    const outerPenalty = distance > radiusM * 2.12
      ? Math.min(0.24, 0.08 + ((distance - radiusM * 2.12) / Math.max(1, radiusM * 1.8)) * 0.16) * (rank >= 4 && activity >= 0.64 ? 0.38 : 1)
      : 0;
    return clamp01(
      activity * 0.37
      + eventDensity * 0.1
      + Math.max(0, corePressure) * 0.22
      + Math.max(0, nearPressure) * 0.1
      + rankPressure * 0.11
      + lengthSignal
      - outerPenalty,
    );
  }

  function transportSpeedRouteCandidate({ activity, distance, named, pressure, rank, radiusM, routeLengthM }) {
    if (rank >= 3) return routeLengthM >= 10 || pressure >= 0.32;
    if (rank >= 2) return named || pressure >= 0.24 || distance < radiusM * 3.1 || (activity >= 0.14 && routeLengthM >= 62);
    if (!named) {
      if (distance <= radiusM * 0.95 && routeLengthM >= 24) return true;
      if (distance <= radiusM * 1.72 && routeLengthM >= 38 && pressure >= 0.17) return true;
      if (distance <= radiusM * 2.35 && routeLengthM >= 66 && activity >= 0.2) return true;
      return false;
    }
    if (distance > radiusM * 2.12) return false;
    return pressure >= 0.38 || (activity >= 0.44 && routeLengthM >= 72) || (distance < radiusM * 1.5 && routeLengthM >= 82);
  }

  function transportSpeedThreadColor(pressure, activity, rank) {
    if (pressure >= 0.86 || (activity >= 0.94 && rank >= 3.2)) return "#b91f32";
    if (pressure >= 0.72 || (activity >= 0.84 && rank >= 2.8)) return "#df4b32";
    if (pressure >= 0.56) return "#e2ad2f";
    if (pressure >= 0.32) return "#55a760";
    return "#1f9a75";
  }

  function transportSpeedDetailRoadContextFeatures(center, lens, seenRoadIds = new Set(), events = [], yearOverride = currentTimelineYear()) {
    const roads = state.detailRoadFeatures || [];
    if (!roads.length) return [];
    const year = Number(yearOverride) || currentTimelineYear();
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 3.05;
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
      const named = transportNamedCorridor(props);
      const eventDensity = eventDensityIntensity(point, events, 760);
      if (rank < 2) {
        const innerLink = distance <= radiusM * 1.72 && routeLengthM >= 32;
        const namedInner = named && distance <= radiusM * 2.72 && routeLengthM >= 44;
        const observedContext = eventDensity >= 0.055 && routeLengthM >= 58;
        if (!innerLink && !namedInner && !observedContext) continue;
      }
      const activity = clamp01(0.08 + eventDensity * 0.56 + Math.max(0, 1 - distance / maxDistance) * 0.18 + Math.min(0.12, rank * 0.035));
      const pressure = transportSpeedRoutePressure({
        activity,
        distance,
        eventDensity,
        rank,
        radiusM,
        routeLengthM,
      });
      if (!transportSpeedRouteCandidate({ activity, distance, named, pressure, rank, radiusM, routeLengthM })) continue;
      const intensity = clamp01(0.2 + pressure * 0.52 + Math.min(0.12, rank * 0.032));
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_thread",
          event_id: "",
          source_id: props.source_id || props.id || "",
          intensity: Number(intensity.toFixed(2)),
          color: transportSpeedThreadColor(pressure, activity, rank),
          source_kind: "context",
          corridor_key: transportCorridorKey(props),
          corridor_named: named ? 1 : 0,
          angle_bucket: transportAngleBucket(center, point),
          rank,
          route_length_m: Math.round(routeLengthM),
          activity: Number(activity.toFixed(3)),
          speed_pressure: Number(pressure.toFixed(3)),
          score: Number((pressure * 0.7 + eventDensity * 0.08 + Math.min(0.22, rank * 0.055) + Math.min(0.12, routeLengthM / 1600) + (named ? 0.05 : 0) + stableUnit(props.source_id || props.id || "") * 0.025).toFixed(3)),
        },
        geometry: road.geometry,
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, 1680);
  }

  function transportNetworkStreetFeatures(center, lens) {
    if (lens.id === "transport-speed") {
      return transportSpeedNetworkStreetFeatures(center, lens);
    }
    const year = currentTimelineYear();
    const roads = transportRoadFeaturesForYear(year);
    if (!roads.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * (lens.id === "transport-reliability" ? 3.9 : 4.25);
    const reliabilityEvents = lens.id === "transport-reliability"
      ? lensEventsForYear(year).filter((event) => event.category === "transport" && event.lngLat)
      : [];
    const reliabilityStops = lens.id === "transport-reliability"
      ? civicAccessTransportStopsNear(center, maxDistance + 260)
      : [];
    const features = [];
    const seenRoadIds = new Set();
    for (const road of roads) {
      const props = road.properties || {};
      if (props.layer !== "traffic_road") continue;
      if (!transportActivityRoadMatchesYear(props, year)) continue;
      const distance = geometryDistanceToPointMeters(road.geometry, center, 7);
      if (distance > maxDistance) continue;
      const point = geometryToLngLat(road.geometry);
      if (!point) continue;
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const activity = clamp01(Number(props.transport_activity || 0));
      const rank = Number(props.rank || 1);
      const reliabilityStopDensity = lens.id === "transport-reliability"
        ? civicAccessStopDensity(point, reliabilityStops, rank >= 3 ? 540 : 430)
        : 0;
      const reliabilityStopLine = lens.id === "transport-reliability"
        ? transportStopLinesNearGeometry(road.geometry, reliabilityStops, rank >= 2 ? 72 : 58)
        : null;
      const reliabilityEventDensity = lens.id === "transport-reliability"
        ? eventDensityIntensity(point, reliabilityEvents, radiusM * 1.18)
        : 0;
      if (lens.id === "transport-reliability") {
        const lineSignal = reliabilityStopLine ? Math.min(0.38, Number(reliabilityStopLine.primaryScore || 0) * 0.18) : 0;
        const serviceSignal = reliabilityStopDensity + lineSignal + (rank >= 3 ? 0.12 : 0);
        if (rank < 2 && (!reliabilityStopLine || routeLengthM < 70 || Number(reliabilityStopLine.primaryScore || 0) < 0.34)) continue;
        if (rank < 2.3 && routeLengthM < 112 && serviceSignal < 0.29) continue;
        if (rank < 2.7 && routeLengthM < 54 && serviceSignal < 0.38) continue;
      }
      if (rank < 1.4 && distance > radiusM * 2.45 && activity < 0.2) continue;
      if (rank < 2 && distance > radiusM * 3.3 && activity < 0.3) continue;
      if (activity < 0.08 && rank < 2.5 && distance > radiusM * 2.15) continue;
      if (lens.id === "transport-reliability" && rank < 1.45 && activity < 0.24 && routeLengthM < 60) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const arterial = Math.min(0.16, Math.max(0, rank - 1) * 0.045);
      const reliabilitySignal = lens.id === "transport-reliability"
        ? Math.min(0.16, reliabilityStopDensity * 0.11 + reliabilityEventDensity * 0.035 + (reliabilityStopLine ? Number(reliabilityStopLine.primaryScore || 0) * 0.035 : 0))
        : 0;
      const intensity = clamp01(0.12 + activity * 0.58 + proximity * 0.2 + arterial + reliabilitySignal);
      if (intensity < 0.18 && rank < 2) continue;
      if (props.source_id) seenRoadIds.add(props.source_id);
      const reliabilityStatus = lens.id === "transport-reliability"
        ? transportReliabilityStatus({
          activity,
          distance,
          eventDensity: reliabilityEventDensity,
          intensity,
          rank,
          radiusM,
          routeLengthM,
          seed: stableUnit(`reliability:${props.source_id || props.id || ""}`),
          sourceKind: "activity",
        })
        : "";
      const stopLineDerived = lens.id === "transport-reliability"
        && reliabilityStopLine?.primaryLine
        && Number(reliabilityStopLine.primaryScore || 0) >= 0.42
        && routeLengthM >= 70
        && rank < 2.2;
      if (lens.id === "transport-reliability"
        && reliabilityStatus === "reliable"
        && rank < 1.85
        && distance > radiusM * 2.25
        && activity < 0.32) continue;
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_thread",
          event_id: "",
          source_id: props.source_id || props.id || "",
          intensity: Number(intensity.toFixed(2)),
          color: reliabilityStatus ? transportReliabilityStatusColor(reliabilityStatus) : transportThreadColor(lens.id, activity, rank, intensity),
          reliability_status: reliabilityStatus,
          source_kind: stopLineDerived ? "stop_line_derived" : "activity",
          corridor_key: stopLineDerived ? `line ${reliabilityStopLine.primaryLine}` : transportCorridorKey(props),
          corridor_named: stopLineDerived || transportNamedCorridor(props) ? 1 : 0,
          serving_line: stopLineDerived ? reliabilityStopLine.primaryLine : "",
          angle_bucket: transportAngleBucket(center, point),
          rank,
          route_length_m: Math.round(routeLengthM),
          activity: Number(activity.toFixed(3)),
          stop_density: Number(reliabilityStopDensity.toFixed(3)),
          event_density: Number(reliabilityEventDensity.toFixed(3)),
          line_signal: Number((reliabilityStopLine?.primaryScore || 0).toFixed(3)),
          score: Number((intensity + activity * 0.08 + Math.min(0.24, rank * 0.065) + Math.min(0.12, routeLengthM / 2600) + proximity * 0.05 + (stopLineDerived ? 0.16 : 0) + Math.min(0.12, Number(reliabilityStopLine?.primaryScore || 0) * 0.06) + stableUnit(props.source_id || props.id || "") * 0.035).toFixed(3)),
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
      if (lens.id === "transport-reliability" && rank < 2 && routeLengthM < 230 && eventDensity < 0.08) continue;
      if (lens.id === "transport-reliability" && rank < 2.3 && routeLengthM < 88) continue;
      if (rank < 1.3 && eventDensity < 0.07 && distance > radiusM * 2.15) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const activity = clamp01(0.1 + eventDensity * 0.54 + proximity * 0.16 + Math.min(0.16, rank * 0.045));
      const intensity = clamp01(0.16 + activity * 0.54 + proximity * 0.12 + Math.min(0.12, rank * 0.035));
      const reliabilityStatus = lens.id === "transport-reliability"
        ? transportReliabilityStatus({
          activity,
          distance,
          eventDensity,
          intensity,
          rank,
          radiusM,
          routeLengthM,
          seed: stableUnit(`reliability-context:${props.source_id || props.id || ""}`),
          sourceKind: "context",
        })
        : "";
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_thread",
          event_id: "",
          source_id: props.source_id || props.id || "",
          intensity: Number(intensity.toFixed(2)),
          color: reliabilityStatus ? transportReliabilityStatusColor(reliabilityStatus) : transportThreadColor(lens.id, activity, rank, intensity),
          reliability_status: reliabilityStatus,
          source_kind: "context",
          corridor_key: transportCorridorKey(props),
          corridor_named: transportNamedCorridor(props) ? 1 : 0,
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
      .slice(0, lens.id === "transport-reliability" ? 540 : 1050);
  }

  function distributedTransportThreadFeatures(features, lens) {
    const target = lens.id === "transport-reliability" ? 1040 : lens.id === "transport-speed" ? 2260 : 1820;
    const perBucket = lens.id === "transport-reliability" ? 38 : lens.id === "transport-speed" ? 92 : 78;
    const perCorridor = lens.id === "transport-reliability" ? 16 : lens.id === "transport-speed" ? 58 : 46;
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
    const promoted = promoteTransportBackboneFeatures(
      selected.sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0)),
      lens,
    );
    return composeTransportRouteGuideFeatures(promoted, lens);
  }

  function promoteTransportBackboneFeatures(features, lens) {
    const limit = lens.id === "transport-reliability" ? 430 : lens.id === "transport-speed" ? 660 : 560;
    const perBucket = lens.id === "transport-reliability" ? 16 : lens.id === "transport-speed" ? 32 : 26;
    const perCorridor = lens.id === "transport-reliability" ? 12 : lens.id === "transport-speed" ? 22 : 18;
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
      if (rank < 2.15 && routeLengthM < (lens.id === "transport-speed" ? 95 : 145)) continue;
      if (activity < 0.1 && rank < 2.6 && routeLengthM < (lens.id === "transport-speed" ? 180 : 260)) continue;
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

  function composeTransportRouteGuideFeatures(features, lens) {
    if (!["transport-speed", "transport-reliability"].includes(lens.id)) return features;
    const groups = new Map();
    const residual = [];
    for (const feature of features) {
      const props = feature.properties || {};
      const rank = Number(props.rank || 1);
      const routeLengthM = Number(props.route_length_m || geometryLineLengthMeters(feature.geometry));
      const status = props.reliability_status || "";
      const named = Number(props.corridor_named || 0) > 0 && !transportGenericCorridorKey(props.corridor_key);
      const prominentStatus = ["delayed", "interrupted", "planned"].includes(status);
      const speedProminent = lens.id === "transport-speed"
        && ["#b91f32", "#e3422e", "#d63b32", "#ef9f1a"].includes(String(props.color || "").toLowerCase())
        && (named || rank >= 2 || Number(props.activity || 0) >= 0.5);
      const reliabilityProminent = lens.id === "transport-reliability"
        && ((prominentStatus && (named || rank >= 2.15 || routeLengthM >= 190)) || (status === "reliable" && rank >= 2.8 && routeLengthM >= 48));
      const eligible = (props.flow_style === "transport_backbone" || speedProminent || reliabilityProminent)
        && routeLengthM >= 8
        && (named || rank >= 3 || (Number(props.activity || 0) >= 0.52 && rank >= 2) || (prominentStatus && rank >= 2.15));
      if (!eligible) {
        residual.push(feature);
        continue;
      }
      const statusKey = lens.id === "transport-reliability"
        ? (status || "reliable")
        : transportSpeedBandKey(props.color);
      const corridorKey = named
        ? String(props.corridor_key || "corridor")
        : `rank-${Math.round(rank)}:angle-${props.angle_bucket ?? "0"}`;
      const groupKey = lens.id === "transport-speed"
        ? `${corridorKey}|${statusKey}`
        : `${corridorKey}|${statusKey}|${props.source_kind || "activity"}`;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(feature);
    }

    const aggregated = [];
    for (const [groupKey, groupFeatures] of groups) {
      const totalLengthM = groupFeatures.reduce((sum, feature) => sum + Number(feature.properties?.route_length_m || geometryLineLengthMeters(feature.geometry)), 0);
      if (groupFeatures.length < 2 && totalLengthM < 210) {
        residual.push(...groupFeatures);
        continue;
      }
      const sequences = groupFeatures.flatMap((feature) => geometryLineCoordinateSequences(feature.geometry));
      const merged = mergeTransportLineSequences(sequences, lens.id === "transport-reliability" ? 34 : 68);
      const mergedLengthM = merged.reduce((sum, sequence) => sum + geometryLineLengthMeters({ type: "LineString", coordinates: sequence }), 0);
      if (!merged.length || mergedLengthM < (lens.id === "transport-reliability" ? 88 : 120)) {
        residual.push(...groupFeatures);
        continue;
      }
      const representative = groupFeatures
        .slice()
        .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))[0];
      const props = representative.properties || {};
      const maxIntensity = Math.max(...groupFeatures.map((feature) => Number(feature.properties?.intensity || 0.42)));
      const avgActivity = groupFeatures.reduce((sum, feature) => sum + Number(feature.properties?.activity || 0), 0) / Math.max(1, groupFeatures.length);
      const maxRank = Math.max(...groupFeatures.map((feature) => Number(feature.properties?.rank || 1)));
      aggregated.push({
        type: "Feature",
        properties: {
          ...props,
          kind: "flow",
          lens_id: lens.id,
          flow_style: "transport_backbone",
          source_kind: "corridor_trace",
          source_id: `route:${groupKey}`,
          source_ids: groupFeatures.map((feature) => feature.properties?.source_id).filter(Boolean).slice(0, 18).join(" "),
          route_tier: 2,
          route_segments: groupFeatures.length,
          route_length_m: Math.round(mergedLengthM),
          rank: Number(maxRank.toFixed(2)),
          activity: Number(avgActivity.toFixed(3)),
          intensity: Number(Math.max(0.48, Math.min(1, maxIntensity * 0.92 + Math.min(0.12, groupFeatures.length * 0.008))).toFixed(2)),
          score: Number((Number(props.score || 0) + Math.min(0.24, mergedLengthM / 3200) + Math.min(0.12, groupFeatures.length * 0.01)).toFixed(3)),
        },
        geometry: { type: "MultiLineString", coordinates: merged },
      });
    }

    const residualTarget = lens.id === "transport-reliability" ? 240 : 1120;
    const residualMinLength = lens.id === "transport-reliability" ? 54 : 30;
    const residualSelected = residual
      .filter((feature) => {
        const props = feature.properties || {};
        const length = Number(props.route_length_m || geometryLineLengthMeters(feature.geometry));
        const rank = Number(props.rank || 1);
        const named = Number(props.corridor_named || 0) > 0 && !transportGenericCorridorKey(props.corridor_key);
        const status = props.reliability_status || "";
        const prominentStatus = ["delayed", "interrupted", "planned"].includes(status);
        if (lens.id === "transport-reliability" && rank < 2 && status !== "inferred") return false;
        if (lens.id === "transport-reliability"
          && prominentStatus
          && !named
          && rank < 1.95
          && length < 180) return false;
        if (lens.id === "transport-reliability"
          && !prominentStatus
          && !named
          && rank < 1.95
          && Number(props.activity || 0) < 0.34
          && length < 128) return false;
        if (lens.id === "transport-reliability"
          && props.reliability_status === "reliable"
          && rank < 1.95
          && Number(props.activity || 0) < 0.3
          && length < 110) return false;
        if (lens.id === "transport-speed") {
          const pressure = Number(props.speed_pressure || 0);
          const activity = Number(props.activity || 0);
          if (!named && rank < 1.35 && pressure < 0.18 && activity < 0.18) return false;
          if (!named && length < 46 && pressure < 0.34 && rank < 2.4) return false;
        }
        return length >= residualMinLength || rank >= 1.55 || Number(props.activity || 0) >= 0.28 || Number(props.corridor_named || 0) > 0;
      })
      .sort((a, b) => {
        const ap = a.properties || {};
        const bp = b.properties || {};
        const aLength = Math.min(0.16, Number(ap.route_length_m || 0) / 1800);
        const bLength = Math.min(0.16, Number(bp.route_length_m || 0) / 1800);
        return (Number(bp.score || 0) + bLength) - (Number(ap.score || 0) + aLength);
      })
      .slice(0, residualTarget)
      .map((feature) => {
        const props = feature.properties || {};
        return {
          ...feature,
          properties: {
            ...props,
            flow_style: props.flow_style === "transport_backbone" ? "transport_thread" : props.flow_style,
            route_tier: 1,
            intensity: Number(Math.min(0.74, Number(props.intensity || 0.42) * 0.84 + 0.06).toFixed(2)),
          },
        };
      });
    const tickRoutes = lens.id === "transport-reliability"
      ? [
        ...aggregated,
        ...residualSelected.filter((feature) => ["delayed", "interrupted", "planned"].includes(feature.properties?.reliability_status)),
      ]
      : aggregated;
    const ticks = lens.id === "transport-reliability"
      ? transportReliabilityTickGuideFeatures(tickRoutes, lens)
      : [];
    return [...residualSelected, ...aggregated, ...ticks];
  }

  function transportGenericCorridorKey(key) {
    return new Set([
      "road",
      "residential",
      "service",
      "cycleway",
      "footway",
      "path",
      "unclassified",
      "tertiary",
      "secondary",
      "primary",
      "mapped road segment",
    ]).has(String(key || "").trim().toLowerCase());
  }

  function transportSpeedBandKey(color) {
    const text = String(color || "").toLowerCase();
    if (text === "#b91f32") return "speed-stop";
    if (text === "#e3422e" || text === "#d63b32") return "speed-low";
    if (text === "#ef9f1a") return "speed-medium";
    if (text === "#42a85c" || text === "#54aa63" || text === "#6dbc5a") return "speed-open";
    return "speed-free";
  }

  function mergeTransportLineSequences(sequences, toleranceM = 26) {
    const remaining = sequences
      .map((sequence) => Array.isArray(sequence)
        ? sequence.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]))
        : [])
      .filter((sequence) => sequence.length >= 2)
      .sort((a, b) => geometryLineLengthMeters({ type: "LineString", coordinates: b }) - geometryLineLengthMeters({ type: "LineString", coordinates: a }));
    const merged = [];
    while (remaining.length) {
      let chain = remaining.shift();
      let expanded = true;
      while (expanded) {
        expanded = false;
        for (let index = 0; index < remaining.length; index += 1) {
          const next = remaining[index];
          const joined = joinTransportLineSequences(chain, next, toleranceM);
          if (!joined) continue;
          chain = joined;
          remaining.splice(index, 1);
          expanded = true;
          break;
        }
      }
      const simplified = simplifyTransportLineSequence(chain, 4);
      if (simplified.length >= 2) merged.push(simplified);
    }
    return merged;
  }

  function joinTransportLineSequences(chain, next, toleranceM) {
    const chainStart = chain[0];
    const chainEnd = chain[chain.length - 1];
    const nextStart = next[0];
    const nextEnd = next[next.length - 1];
    if (lngLatDistanceMeters(chainEnd, nextStart) <= toleranceM) return [...chain, ...next.slice(1)];
    if (lngLatDistanceMeters(chainEnd, nextEnd) <= toleranceM) return [...chain, ...next.slice(0, -1).reverse()];
    if (lngLatDistanceMeters(chainStart, nextEnd) <= toleranceM) return [...next.slice(0, -1), ...chain];
    if (lngLatDistanceMeters(chainStart, nextStart) <= toleranceM) return [...next.slice(1).reverse(), ...chain];
    return null;
  }

  function simplifyTransportLineSequence(sequence, minStepM = 4) {
    const clean = sequence.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]));
    if (clean.length <= 2) return clean;
    const simplified = [clean[0]];
    for (let index = 1; index < clean.length - 1; index += 1) {
      if (lngLatDistanceMeters(simplified[simplified.length - 1], clean[index]) >= minStepM) simplified.push(clean[index]);
    }
    const last = clean[clean.length - 1];
    if (lngLatDistanceMeters(simplified[simplified.length - 1], last) > 0.5) simplified.push(last);
    return simplified;
  }

  function transportReliabilityTickGuideFeatures(routeFeatures, lens) {
    const ticks = [];
    const routes = routeFeatures
      .slice()
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, 130);
    for (const route of routes) {
      const props = route.properties || {};
      const status = props.reliability_status || "reliable";
      const rank = Number(props.rank || 1);
      if (rank < 2 || status === "inferred") continue;
      const sequences = geometryLineCoordinateSequences(route.geometry);
      for (const sequence of sequences) {
        const lengthM = geometryLineLengthMeters({ type: "LineString", coordinates: sequence });
        if (lengthM < 180 && status === "reliable" && rank < 3) continue;
        if (lengthM < 220 && status === "delayed" && rank < 2.4) continue;
        const tickCount = transportReliabilityTickCount(status, lengthM, rank);
        for (let index = 0; index < tickCount; index += 1) {
          const along = pointAlongLineSequence(sequence, (index + 1) / (tickCount + 1));
          if (!along) continue;
          const tickLine = perpendicularTickLine(along.point, along.direction, transportReliabilityTickLength(status, rank));
          if (!tickLine.length) continue;
          ticks.push({
            type: "Feature",
            properties: {
              kind: "flow",
              lens_id: lens.id,
              flow_style: "transport_service_tick",
              flow_role: "transport_status_tick",
              reliability_status: status,
              source_id: `${props.source_id || "route"}:tick:${index}`,
              corridor_key: props.corridor_key || "",
              intensity: Number(Math.max(0.48, Number(props.intensity || 0.55)).toFixed(2)),
              color: transportReliabilityStatusColor(status),
              rank,
              route_length_m: Math.round(lengthM),
              score: Number((Number(props.score || 0) + 0.08).toFixed(3)),
            },
            geometry: { type: "LineString", coordinates: tickLine },
          });
        }
      }
    }
    return ticks;
  }

  function transportReliabilityTickCount(status, lengthM, rank) {
    const base = status === "interrupted" ? 2
      : status === "delayed" ? 1.55
        : status === "planned" ? 1.35
          : status === "inferred" ? 0.7
            : 1;
    const lengthScale = Math.max(1, Math.floor(lengthM / (status === "interrupted" ? 300 : 520)));
    return Math.max(1, Math.min(status === "reliable" ? 3 : 5, Math.round(lengthScale * base + Math.max(0, rank - 2) * 0.2)));
  }

  function transportReliabilityTickLength(status, rank) {
    const base = status === "interrupted" ? 34
      : status === "delayed" ? 29
        : status === "planned" ? 27
          : status === "inferred" ? 21
            : 23;
    return base + Math.max(0, rank - 2) * 2.4;
  }

  function pointAlongLineSequence(sequence, fraction) {
    const clean = sequence.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]));
    if (clean.length < 2) return null;
    const segments = [];
    let total = 0;
    for (let index = 1; index < clean.length; index += 1) {
      const from = clean[index - 1];
      const to = clean[index];
      const length = lngLatDistanceMeters(from, to);
      if (length <= 0.5) continue;
      segments.push({ from, to, length });
      total += length;
    }
    if (!segments.length || total <= 0) return null;
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let walked = 0;
    for (const segment of segments) {
      if (walked + segment.length >= target) {
        const ratio = (target - walked) / segment.length;
        return {
          point: [
            segment.from[0] + (segment.to[0] - segment.from[0]) * ratio,
            segment.from[1] + (segment.to[1] - segment.from[1]) * ratio,
          ],
          direction: [segment.to[0] - segment.from[0], segment.to[1] - segment.from[1]],
        };
      }
      walked += segment.length;
    }
    const last = segments[segments.length - 1];
    return { point: last.to, direction: [last.to[0] - last.from[0], last.to[1] - last.from[1]] };
  }

  function perpendicularTickLine(point, direction, lengthM) {
    if (!point || !direction) return [];
    const target = [point[0] + direction[0], point[1] + direction[1]];
    const [dx, dy] = lngLatToLocalMeters(target, point);
    const distance = Math.hypot(dx, dy);
    if (!distance) return [];
    const px = -dy / distance;
    const py = dx / distance;
    const half = lengthM / 2;
    return [
      offsetLngLat(point, px * -half, py * -half),
      offsetLngLat(point, px * half, py * half),
    ];
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

  function transportReliabilityStatus({ activity, distance, eventDensity = 0, intensity, rank, radiusM, routeLengthM, seed = 0, sourceKind = "activity" }) {
    const outer = distance > radiusM * 2.4;
    if (sourceKind === "context" && eventDensity < 0.1 && (rank < 2 || outer)) return "inferred";
    if (sourceKind === "context" && rank < 2) return "inferred";
    if (sourceKind === "context" && rank >= 2.4 && eventDensity < 0.18 && seed > 0.34) return "planned";
    if (rank >= 3.2 && activity < 0.58 && seed > 0.05) return "planned";
    if (outer && activity < 0.42 && seed > 0.18) return "planned";
    if (activity > 0.9 && rank >= 2.4) return "interrupted";
    if (activity > 0.74 && rank >= 2.2 && seed > 0.64) return "interrupted";
    if (activity > 0.62 || (intensity > 0.7 && routeLengthM > 340)) return "delayed";
    if (sourceKind === "context" || intensity < 0.25) return "inferred";
    return "reliable";
  }

  function transportReliabilityStatusColor(status) {
    const colors = {
      reliable: "#168a94",
      delayed: "#ef9c1a",
      interrupted: "#ed3f2b",
      planned: "#7a3b97",
      inferred: "#898b8e",
    };
    return colors[status] || colors.reliable;
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
    const year = currentTimelineYear();
    const events = lensEventsForYear(year)
      .filter((event) => event.category === "civic_services" && event.lngLat);
    if (!roads.length) return [];
    const radiusM = Number(lens.radiusM || 1500);
    const maxDistance = radiusM * 1.24;
    const clipRadiusM = radiusM * 1.16;
    const transportStops = civicAccessTransportStopsNear(center, maxDistance + 520);
    const serviceAnchors = civicAccessServiceAnchorCandidates(center, radiusM, year);
    const seamFeatures = [];
    const coverageFeatures = [];
    const networkFeatures = [];
    for (const road of roads) {
      const props = road.properties || {};
      if (Number(props.visible_year || 9999) > year) continue;
      const clippedGeometry = clipLineGeometryToRadius(road.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry) || geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(clippedGeometry, center, 7);
      if (distance > maxDistance) continue;
      const nearestEvent = events.length ? nearestGuideEvent(point, events, 980) : null;
      const civicEventDensity = events.length ? eventDensityIntensity(point, events, 880) : 0;
      const civicAnchorDensity = civicAccessServiceAnchorDensity(point, serviceAnchors, 620);
      const civicDensity = Math.max(civicEventDensity, civicAnchorDensity * 0.92);
      const stopDensity = civicAccessStopDensity(point, transportStops, 440);
      const serviceDensity = clamp01(civicDensity * 0.28 + stopDensity * 0.28 + Math.min(0.07, Number(props.rank || 1) * 0.012));
      const rank = Number(props.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const studyCore = clamp01(1 - distance / Math.max(1, radiusM * 1.1));
      const middleRing = clamp01(1 - Math.abs(distance - radiusM * 0.48) / Math.max(1, radiusM * 0.56));
      const routeLengthM = geometryLineLengthMeters(road.geometry);
      const sourceId = props.source_id || props.id || "";
      const stable = stableUnit(`gap:${sourceId}`);
      const routePriority = Math.min(0.2, rank * 0.04) + Math.min(0.16, routeLengthM / 2300);
      const gapIntensity = clamp01(0.23 + (1 - civicDensity) * 0.36 + (1 - stopDensity) * 0.22 + studyCore * 0.12 + middleRing * 0.08 + routePriority * 0.42 + stable * 0.04);
      const coverageIntensity = clamp01(serviceDensity * 0.48 + stopDensity * 0.28 + civicDensity * 0.12 + studyCore * 0.07 + proximity * 0.05 + Math.min(0.13, rank * 0.026));
      if (((rank >= 2.05 && (stopDensity > 0.08 || civicDensity > 0.08 || studyCore > 0.25 || routeLengthM > 220)) || stopDensity > 0.22) && routeLengthM > 64 && coverageIntensity > 0.22) {
        const transitIntensity = clamp01(coverageIntensity * 0.72 + stopDensity * 0.2 + Math.min(0.12, rank * 0.03));
        networkFeatures.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            layer_id: "civic_services",
            flow_role: "access_network",
            flow_style: "access_network",
            event_id: nearestEvent?.id || "",
            source_id: sourceId,
            intensity: Number(transitIntensity.toFixed(2)),
            color: stopDensity > 0.36 || rank >= 3 ? "#0f7f86" : "#4fa5ad",
            service_density: Number(serviceDensity.toFixed(3)),
            stop_density: Number(stopDensity.toFixed(3)),
            score: Number((transitIntensity + stopDensity * 0.18 + Math.min(0.12, routeLengthM / 2600) + proximity * 0.04 + stable * 0.03).toFixed(3)),
          },
          geometry: clippedGeometry,
        });
      }
      if (coverageIntensity > 0.29 && (stopDensity > 0.1 || civicDensity > 0.12 || rank >= 2.05 || studyCore > 0.46)) {
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
          geometry: clippedGeometry,
        });
      }
      const seamStyle = civicAccessGapStyle(gapIntensity, serviceDensity, studyCore);
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
          color: civicGapStreetColor(gapIntensity, serviceDensity, rank, seamStyle),
          service_density: Number(serviceDensity.toFixed(3)),
          stop_density: Number(stopDensity.toFixed(3)),
          study_core: Number(studyCore.toFixed(3)),
          rank,
          score: Number((gapIntensity + studyCore * 0.14 + middleRing * 0.12 + proximity * 0.06 + Math.min(0.09, routeLengthM / 3200) + stable * 0.055).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    const selectedNetwork = distributedCivicAccessRoadFlows(networkFeatures, center, 170, { bucketCount: 36, perBucket: 2, minSpacingM: 112 });
    const selectedCoverage = distributedCivicAccessRoadFlows(coverageFeatures, center, 145, { bucketCount: 36, perBucket: 1, minSpacingM: 138 });
    const selectedSeams = distributedCivicAccessGapSeams(seamFeatures, center);
    return [
      ...selectedNetwork,
      ...selectedCoverage,
      ...selectedSeams,
      ...civicAccessGapTickGuideFeatures(selectedSeams, lens),
    ];
  }

  function civicAccessCoverageStyle(coverageIntensity, stopDensity, civicDensity) {
    if (coverageIntensity > 0.64 && (stopDensity > 0.42 || civicDensity > 0.44)) return "service_walk";
    if (coverageIntensity > 0.46 || stopDensity > 0.28) return "service_bus";
    return "service_outer";
  }

  function civicAccessCoverageColor(style) {
    if (style === "service_walk") return "#158a92";
    if (style === "service_bus") return "#73b7bd";
    return "#bfd9da";
  }

  function civicAccessGapStyle(intensity, serviceDensity, studyCore = 1) {
    const central = studyCore > 0.18;
    const nearCore = studyCore > 0.08;
    if (central && ((serviceDensity < 0.46 && intensity > 0.5) || intensity > 0.7)) return "gap_high";
    if (nearCore && ((serviceDensity < 0.7 && intensity > 0.4) || intensity > 0.56)) return "gap_medium";
    if (serviceDensity < 0.94 || intensity > 0.3) return "gap_low";
    return "gap_adequate";
  }

  function civicGapStreetColor(intensity, serviceDensity, rank, style = "") {
    if (style === "gap_high") return "#df5138";
    if (style === "gap_medium") return "#ef8f21";
    if (style === "gap_low") return "#e0b23f";
    if (style === "gap_adequate") return "#348f67";
    if ((serviceDensity < 0.48 && intensity > 0.5) || intensity > 0.67) return "#df5138";
    if (serviceDensity < 0.82 || intensity > 0.42) return "#ef8f21";
    if (serviceDensity < 0.97 || intensity > 0.28) return "#e4b33c";
    if (rank <= 1.4 && serviceDensity > 0.62) return "#348f67";
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

  function transportStopServingLineCodes(props = {}) {
    return String(props.servingLines || "")
      .split(/[,;\s]+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function transportStopModeKey(props = {}) {
    const declared = String(props.mode || "").toLowerCase();
    if (/rail|train|tram/.test(declared)) return "rail";
    if (/ferry/.test(declared)) return "ferry";
    if (/bus|coach|glider|rapid/.test(declared)) return "bus";
    const text = [
      props.railway,
      props.route,
      props.public_transport,
      props.sourceFamilies,
      props.source,
      props.source_kind,
      props.name,
      props.label,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/railway|rail|train|tram/.test(text)) return "rail";
    if (/ferry|harbour|port/.test(text)) return "ferry";
    if (/bus|coach|glider|rapid|translink/.test(text)) return "bus";
    return "bus";
  }

  function transportStopLinesNearGeometry(geometry, stops, radiusM = 68) {
    if (!geometry || !stops?.length) return null;
    const counts = new Map();
    const modeCounts = new Map();
    let weighted = 0;
    for (const stop of stops) {
      const point = stop.point;
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(geometry, point, 5);
      if (!Number.isFinite(distance) || distance > radiusM) continue;
      const closeness = 1 - distance / radiusM;
      const stopWeight = closeness * (0.65 + Number(stop.weight || 0.35));
      weighted += stopWeight;
      const mode = transportStopModeKey(stop.props);
      modeCounts.set(mode, (modeCounts.get(mode) || 0) + stopWeight);
      const lines = transportStopServingLineCodes(stop.props);
      for (const line of lines.length ? lines : [`stop:${stop.props?.source_id || stop.props?.name || "unknown"}`]) {
        counts.set(line, (counts.get(line) || 0) + stopWeight);
      }
    }
    if (!counts.size) return null;
    const [primaryLine, primaryScore] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const [primaryMode = "bus"] = [...modeCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return {
      primaryLine,
      primaryMode,
      primaryScore,
      weighted,
      lineCount: counts.size,
    };
  }

  function civicAccessServiceAnchorCandidates(center, radiusM, year) {
    const maxDistance = radiusM * 1.72;
    const candidates = [];
    const seen = new Set();
    const pushAnchor = (point, event = null, props = {}, sourceKind = "detail") => {
      if (!point) return;
      if (sourceKind !== "osm" && civicAccessAdministrativeServiceRecord(event, props)) return;
      const distance = lngLatDistanceMeters(center, point);
      if (!Number.isFinite(distance) || distance > maxDistance) return;
      const layerId = civicServiceSublayerKey(props, event);
      const eventId = event?.id || firstDetailEventId(props) || "";
      const sourceId = props.source_id || props.id || eventId || "";
      const key = sourceId || eventId || `${point[0].toFixed(5)},${point[1].toFixed(5)}:${layerId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const proximity = 1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance);
      const rank = Number(props.rank || 1);
      const eventCount = Number(props.event_count || 1);
      const named = props.label || props.name || event?.title;
      const contextBoost = sourceKind === "osm" ? 0.16 : sourceKind === "detail" ? 0.04 : 0;
      const intensity = clamp01(
        0.3
        + proximity * 0.3
        + Math.min(0.22, rank * 0.045)
        + Math.min(0.16, eventCount * 0.022)
        + contextBoost * 0.45
        + (named ? 0.06 : 0),
      );
      candidates.push({
        point,
        event,
        props,
        layerId,
        sourceId,
        eventId,
        sourceKind,
        distance,
        intensity,
        score: intensity * 0.54
          + proximity * 0.24
          + contextBoost
          + Math.min(0.12, rank * 0.026)
          + stableUnit(`${sourceId}:${layerId}`) * 0.06,
      });
    };
    for (const event of lensEventsForYear(year).filter((item) => item.category === "civic_services" && item.lngLat)) {
      pushAnchor(event.lngLat, event, event, "event");
    }
    for (const feature of state.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "civic_facility" || Number(props.visible_year || 9999) > year) continue;
      pushAnchor(geometryToLngLat(feature.geometry), null, props, "detail");
    }
    for (const feature of state.civicServiceFeatures || []) {
      const props = feature.properties || {};
      pushAnchor(geometryToLngLat(feature.geometry), null, props, "osm");
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  function civicAccessAdministrativeServiceRecord(event = null, props = {}) {
    const text = [
      props.title,
      props.label,
      props.name,
      props.summary,
      props.service_type,
      event?.title,
      event?.summary,
      event?.shortDescription,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (!text) return false;
    return /civic planning approval|planning approval|planning permission|section 54|condition variation|temporary planning permission|retrospective|telecom|telecommunications|monopole|antenna|wraparound cabinet|equipment cabinet|streetpole|street pole/.test(text);
  }

  function civicAccessServiceAnchorDensity(point, anchors, radiusM = 620) {
    if (!anchors.length) return 0;
    let score = 0;
    for (const anchor of anchors) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (!Number.isFinite(distance) || distance > radiusM) continue;
      const contextWeight = anchor.sourceKind === "osm" ? 0.42 : 1;
      score += (1 - distance / radiusM) * Math.max(0.32, anchor.intensity) * contextWeight;
    }
    return clamp01(score / 7.2);
  }

  function distributedCivicAccessRoadFlows(features, center, target, opts = {}) {
    const bucketCount = opts.bucketCount || 28;
    const perBucket = opts.perBucket || 6;
    const minSpacingM = opts.minSpacingM || 64;
    const sorted = [...features].sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0));
    const selected = [];
    const buckets = new Map();
    const selectedPoints = [];
    for (const feature of sorted) {
      if (selected.length >= target) break;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      const ring = Math.floor(distance / 360);
      const bucket = `${transportAngleBucket(center, point, bucketCount)}:${ring}:${feature.properties?.flow_style || ""}`;
      const count = buckets.get(bucket) || 0;
      if (count >= perBucket) continue;
      if (selectedPoints.some((item) => item.style === feature.properties?.flow_style && lngLatDistanceMeters(item.point, point) < minSpacingM)) continue;
      selected.push(feature);
      selectedPoints.push({ point, style: feature.properties?.flow_style || "" });
      buckets.set(bucket, count + 1);
    }
    return selected;
  }

  function distributedCivicAccessGapSeams(features, center) {
    const targetByStyle = {
      gap_high: 72,
      gap_medium: 112,
      gap_low: 62,
      gap_adequate: 18,
    };
    const selected = [];
    const styleCounts = new Map();
    const bucketCounts = new Map();
    const selectedPoints = [];
    const sorted = [...features].sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0));
    for (const feature of sorted) {
      const style = feature.properties?.flow_style || "gap_low";
      const styleTarget = targetByStyle[style] || 120;
      const styleCount = styleCounts.get(style) || 0;
      if (styleCount >= styleTarget) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      const ring = Math.floor(distance / 260);
      const bucket = `${transportAngleBucket(center, point, 40)}:${ring}:${style}`;
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= (style === "gap_high" ? 2 : style === "gap_medium" ? 2 : 1)) continue;
      const minSpacing = style === "gap_high" ? 104 : style === "gap_medium" ? 118 : 156;
      if (selectedPoints.some((item) => item.style === style && lngLatDistanceMeters(item.point, point) < minSpacing)) continue;
      selected.push(feature);
      selectedPoints.push({ point, style });
      styleCounts.set(style, styleCount + 1);
      bucketCounts.set(bucket, bucketCount + 1);
    }
    return selected;
  }

  function civicAccessGapTickGuideFeatures(seamFeatures, lens) {
    const ticks = [];
    const targetByStyle = {
      gap_high: 82,
      gap_medium: 88,
      gap_low: 28,
    };
    const countByStyle = new Map();
    const routes = seamFeatures
      .filter((feature) => {
        const style = feature.properties?.flow_style || "";
        return style === "gap_high" || style === "gap_medium" || style === "gap_low";
      })
      .slice()
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0));
    for (const route of routes) {
      const props = route.properties || {};
      const style = props.flow_style || "gap_low";
      const selectedForStyle = countByStyle.get(style) || 0;
      const target = targetByStyle[style] || 0;
      if (!target || selectedForStyle >= target) continue;
      const rank = Number(props.rank || 1);
      const intensity = Number(props.intensity || 0.55);
      const sequences = geometryLineCoordinateSequences(route.geometry);
      let pushedForRoute = 0;
      for (const sequence of sequences) {
        const lengthM = geometryLineLengthMeters({ type: "LineString", coordinates: sequence });
        if (lengthM < 48) continue;
          const spacing = style === "gap_high" ? 174 : style === "gap_medium" ? 210 : 260;
          const routeLimit = style === "gap_high" ? 2 : style === "gap_medium" ? 1 : 1;
        const tickCount = Math.max(1, Math.min(routeLimit, Math.floor(lengthM / spacing)));
        for (let index = 0; index < tickCount; index += 1) {
          if ((countByStyle.get(style) || 0) >= target) break;
          const offset = stableUnit(`gap-tick:${props.source_id || "road"}:${index}`) * 0.16 - 0.08;
          const fraction = Math.max(0.18, Math.min(0.82, (index + 1) / (tickCount + 1) + offset));
          const along = pointAlongLineSequence(sequence, fraction);
          if (!along) continue;
          const length = style === "gap_high" ? 21 + Math.max(0, rank - 2) * 2.4
            : style === "gap_medium" ? 18 + Math.max(0, rank - 2) * 1.8
              : 14 + Math.max(0, rank - 2) * 1.4;
          const tickLine = perpendicularTickLine(along.point, along.direction, length);
          if (!tickLine.length) continue;
          ticks.push({
            type: "Feature",
            properties: {
              kind: "flow",
              lens_id: lens.id,
              layer_id: props.layer_id || "gap_seams",
              flow_role: "gap_tick",
              flow_style: style,
              event_id: props.event_id || "",
              source_id: `${props.source_id || "road"}:gap-tick:${index}`,
              intensity: Number(Math.max(0.5, Math.min(1, intensity + 0.08)).toFixed(2)),
              color: props.color || civicGapStreetColor(intensity, Number(props.service_density || 0.5), rank),
              service_density: props.service_density,
              stop_density: props.stop_density,
              score: Number((Number(props.score || 0) + 0.045).toFixed(3)),
            },
            geometry: { type: "LineString", coordinates: tickLine },
          });
          countByStyle.set(style, (countByStyle.get(style) || 0) + 1);
          pushedForRoute += 1;
        }
      }
      if (pushedForRoute && ticks.length > 760) break;
    }
    return ticks;
  }

  function economyVitalityStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const year = currentTimelineYear();
    const beforeYear = Math.max(earliestTimelineYear(), year - 2);
    const events = lensEventsForYear(year)
      .filter((event) => event.category === "economy" && event.lngLat);
    const beforeEvents = state.years
      .filter((candidateYear) => candidateYear >= beforeYear && candidateYear < year)
      .flatMap((candidateYear) => lensEventsForYear(candidateYear))
      .filter((event) => event.category === "economy" && event.lngLat);
    if (!roads.length && !state.lensDetailFeatures.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 1.78;
    const clipRadiusM = radiusM * 1.62;
    const anchorCandidates = economyVitalityAnchorCandidates(center, lens, maxDistance * 1.08);
    const features = [];
    features.push(...economyVitalityFrontageRibbonFeatures(center, lens, events, beforeEvents, maxDistance, clipRadiusM));
    features.push(...economyVitalityChurnNoticeTicks(center, lens, events, maxDistance, anchorCandidates));
    for (const road of roads) {
      const clippedGeometry = clipLineGeometryToRadius(road.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry) || geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(clippedGeometry, center, 8);
      if (distance > maxDistance * 0.98) continue;
      const nearestEvent = nearestGuideEvent(point, events, 760);
      const anchorInfluence = economyVitalityAnchorInfluence(point, anchorCandidates, Number(road.properties?.rank || 1) >= 3 ? 460 : 380);
      const eventDensity = eventDensityIntensity(point, events, 780);
      const beforeDensity = eventDensityIntensity(point, beforeEvents, 820);
      const rank = Number(road.properties?.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const namedFrontage = road.properties?.name ? 0.11 : 0.03;
      const commercialContext = Boolean(anchorInfluence.anchor) || eventDensity > 0.035 || (rank >= 3 && proximity > 0.26);
      const intensity = clamp01(
        0.06
        + anchorInfluence.intensity * 0.58
        + eventDensity * 0.24
        + proximity * 0.18
        + namedFrontage * 0.3
        + Math.min(0.08, rank * 0.02)
      );
      if (intensity < (commercialContext ? 0.18 : 0.27)) continue;
      if (intensity < 0.23 && rank < 1.8 && !anchorInfluence.anchor) continue;
      const sublayerId = anchorInfluence.anchor?.sublayerId || "economy";
      const sourceProps = anchorInfluence.anchor?.props || road.properties || {};
      const sourceKey = anchorInfluence.anchor?.sourceId || road.properties?.source_id || road.properties?.id || "";
      const ribbonGeometry = lineGeometrySegmentAroundPoint(
        clippedGeometry,
        anchorInfluence.anchor?.point || point,
        112 + Math.min(4, rank) * 18 + intensity * 88,
        `${lens.id}:${sourceKey}:current`,
      );
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "economy_current_ribbon",
          event_id: nearestEvent?.id || "",
          source_id: sourceKey,
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: economyVitalityRibbonColor(sourceProps, intensity),
          edge_offset: anchorInfluence.anchor ? 0.56 : 0.42,
          source_kind: anchorInfluence.anchor ? "economy_anchor_context" : "street_context",
          anchor_id: anchorInfluence.anchor?.sourceId || "",
          score: Number((
            intensity * 0.66
            + anchorInfluence.intensity * 0.22
            + proximity * 0.07
            + stableUnit(`${lens.id}:${road.properties?.source_id || road.properties?.id || ""}:${anchorInfluence.anchor?.sourceId || ""}`) * 0.05
          ).toFixed(3)),
        },
        geometry: ribbonGeometry,
      });
      if (beforeDensity > 0.026) {
        const beforeEvent = nearestGuideEvent(point, beforeEvents, 820);
        const beforeIntensity = clamp01(0.18 + beforeDensity * 0.72 + proximity * 0.1 + Math.min(0.08, rank * 0.012));
        features.push({
          type: "Feature",
          properties: {
            kind: "flow",
            lens_id: lens.id,
            flow_style: "economy_before_ribbon",
            event_id: beforeEvent?.id || "",
            source_id: `${road.properties?.source_id || road.properties?.id || "street"}:before:${beforeEvent?.id || year}`,
            sublayer_id: economyVitalityLayerKey(beforeEvent || {}),
            intensity: Number(beforeIntensity.toFixed(2)),
            color: "#34393a",
            edge_offset: -0.74,
            source_kind: "prior_year_economy_signal",
            score: Number((beforeIntensity * 0.72 + proximity * 0.08 + stableUnit(`${road.properties?.source_id || road.properties?.id || ""}:before`) * 0.05).toFixed(3)),
          },
          geometry: lineGeometrySegmentAroundPoint(
            clippedGeometry,
            beforeEvent?.lngLat || anchorInfluence.anchor?.point || point,
            96 + Math.min(4, rank) * 14 + beforeIntensity * 68,
            `${lens.id}:${sourceKey}:before`,
          ),
        });
      }
    }
    return distributeEconomyVitalityRibbons(features, center, 860);
  }

  function economyVitalityAnchorInfluence(point, anchors, kernelM = 300) {
    let score = 0;
    let best = null;
    for (const anchor of anchors || []) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (!Number.isFinite(distance) || distance > kernelM) continue;
      const closeness = 1 - distance / Math.max(1, kernelM);
      const weight = closeness
        * (0.36 + clamp01(anchor.intensity || 0.45) * 0.64)
        * (anchor.rank >= 2.15 ? 1.16 : anchor.rank >= 1.95 ? 1.06 : 1);
      score += weight;
      if (!best || weight > best.weight) {
        best = { anchor, weight, distance };
      }
    }
    return {
      intensity: clamp01((best?.weight || 0) * 0.58 + Math.min(0.16, score * 0.04)),
      anchor: best?.anchor || null,
      distance: best?.distance ?? Infinity,
    };
  }

  function economyVitalityFeatureSortScore(feature) {
    const props = feature.properties || {};
    const style = props.flow_style || "";
    const styleBoost = style === "economy_before_ribbon" ? 0.46
      : style === "economy_churn_tick" ? 0.4
        : 0;
    return Number(props.score || 0) + styleBoost;
  }

  function distributeEconomyVitalityRibbons(features, center, target = 920) {
    const fixed = features.filter((feature) => !["economy_current_ribbon", "economy_before_ribbon"].includes(feature.properties?.flow_style));
    const before = selectEconomyVitalityRibbonSet(
      features.filter((feature) => feature.properties?.flow_style === "economy_before_ribbon"),
      center,
      Math.min(132, Math.max(32, Math.floor(target * 0.15))),
      { angleBuckets: 32, ringM: 210, perBucket: 2, minSpacingM: 68 },
    );
    const current = selectEconomyVitalityRibbonSet(
      features.filter((feature) => feature.properties?.flow_style === "economy_current_ribbon"),
      center,
      Math.max(0, target - fixed.length - before.length),
      { angleBuckets: 42, ringM: 170, perBucket: 4, minSpacingM: 42 },
    );
    return [...fixed, ...before, ...current]
      .sort((a, b) => economyVitalityFeatureSortScore(b) - economyVitalityFeatureSortScore(a));
  }

  function selectEconomyVitalityRibbonSet(features, center, limit, opts = {}) {
    const selected = [];
    const bucketCounts = new Map();
    const layerCounts = new Map();
    const selectedPoints = [];
    const sorted = [...features].sort((a, b) => economyVitalityFeatureSortScore(b) - economyVitalityFeatureSortScore(a));
    for (const feature of sorted) {
      if (selected.length >= limit) break;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      const sublayer = feature.properties?.sublayer_id || "economy";
      const angleBucket = transportAngleBucket(center, point, opts.angleBuckets || 36);
      const ring = Math.floor(distance / (opts.ringM || 180));
      const bucket = `${angleBucket}:${ring}:${sublayer}`;
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= (opts.perBucket || 3)) continue;
      const layerTarget = economyVitalityRibbonLayerTarget(sublayer, limit);
      if ((layerCounts.get(sublayer) || 0) >= layerTarget) continue;
      const minSpacing = opts.minSpacingM || 48;
      if (selectedPoints.some((item) => item.sublayer === sublayer && lngLatDistanceMeters(item.point, point) < minSpacing)) continue;
      selected.push(feature);
      selectedPoints.push({ point, sublayer });
      bucketCounts.set(bucket, bucketCount + 1);
      layerCounts.set(sublayer, (layerCounts.get(sublayer) || 0) + 1);
    }
    return selected;
  }

  function economyVitalityRibbonLayerTarget(sublayer, limit) {
    const shares = {
      economy: 0.56,
      footfall: 0.15,
      spend: 0.26,
      vacancy: 0.16,
      closures: 0.14,
      openings: 0.12,
    };
    return Math.max(12, Math.ceil(limit * (shares[sublayer] || 0.18)));
  }

  function economyVitalityFrontageRibbonFeatures(center, lens, events, beforeEvents, maxDistance, clipRadiusM = maxDistance) {
    const features = [];
    const year = currentTimelineYear();
    const frontages = (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_frontage" && feature.geometry && Number(feature.properties?.visible_year || 9999) <= year);
    for (const frontage of frontages) {
      const props = frontage.properties || {};
      const clippedGeometry = clipLineGeometryToRadius(frontage.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry) || geometryToLngLat(frontage.geometry);
      if (!point) continue;
      const distance = geometryDistanceToPointMeters(clippedGeometry, center, 7);
      if (distance > maxDistance * 1.08) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const eventCount = Number(props.event_count || 1);
      const rank = Number(props.rank || 1);
      const currentDensity = eventDensityIntensity(point, events, 680);
      const beforeDensity = eventDensityIntensity(point, beforeEvents, 760);
      const intensity = clamp01(Number(props.intensity || 0.32) * 0.62 + currentDensity * 0.32 + proximity * 0.14 + Math.min(0.16, eventCount * 0.032) + Math.min(0.08, rank * 0.018));
      const sublayerId = economyVitalityLayerKey(props);
      const sourceKey = props.id || props.road_source_id || `${point[0].toFixed(5)}:${point[1].toFixed(5)}`;
      const ribbonGeometry = lineGeometrySegmentAroundPoint(
        clippedGeometry,
        point,
        118 + Math.min(4, rank) * 17 + intensity * 82,
        `${lens.id}:${sourceKey}:frontage`,
      );
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
        geometry: ribbonGeometry,
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
          geometry: lineGeometrySegmentAroundPoint(
            clippedGeometry,
            point,
            92 + Math.min(4, rank) * 12 + beforeIntensity * 58,
            `${lens.id}:${sourceKey}:frontage-before`,
          ),
        });
      }
    }
    return features;
  }

  function economyVitalityChurnNoticeTicks(center, lens, events, maxDistance, anchorCandidates = []) {
    const features = [];
    const seen = new Set();
    const selected = nearbyLensEventAnchors(center, lens, {
      maxDistance: maxDistance * 0.82,
      minDistance: 80,
      limit: 24,
      distributed: true,
    }).filter((item) => item.event?.category === "economy");
    for (const item of selected) {
      seen.add(item.event.id);
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
    const buckets = new Map();
    const contextAnchors = (anchorCandidates || [])
      .filter((item) => item?.point && !seen.has(item.sourceId || ""))
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    for (const item of contextAnchors) {
      if (features.length >= 74) break;
      const distance = lngLatDistanceMeters(center, item.point);
      if (!Number.isFinite(distance) || distance > maxDistance * 0.9 || distance < 70) continue;
      const bucket = `${transportAngleBucket(center, item.point, 30)}:${Math.floor(distance / 210)}:${item.sublayerId}`;
      const bucketCount = buckets.get(bucket) || 0;
      if (bucketCount >= 2) continue;
      if (features.some((feature) => lngLatDistanceMeters(geometryToLngLat(feature.geometry), item.point) < 96)) continue;
      buckets.set(bucket, bucketCount + 1);
      const seed = stableUnit(`${item.sourceId || item.props?.id || item.index || ""}:vitality-context-tick`);
      const angle = Math.atan2(item.point[1] - center[1], item.point[0] - center[0]) + (seed - 0.5) * 0.42;
      const lengthM = 24 + clamp01(item.intensity || 0.42) * 34 + seed * 14;
      const dx = Math.cos(angle + Math.PI / 2) * lengthM;
      const dy = Math.sin(angle + Math.PI / 2) * lengthM;
      const sublayerId = item.sublayerId || "economy";
      const intensity = clamp01(0.28 + Number(item.intensity || 0.42) * 0.44 + (1 - Math.min(distance, maxDistance) / maxDistance) * 0.18);
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_style: "economy_churn_tick",
          event_id: "",
          source_id: item.sourceId || item.props?.id || "",
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: economyVitalityNoticeColor(sublayerId, item.props),
          edge_offset: 0,
          source_kind: "economy_anchor_context",
          score: Number((0.42 + intensity * 0.42 + Number(item.score || 0) * 0.12 + seed * 0.04).toFixed(3)),
        },
        geometry: { type: "LineString", coordinates: [offsetLngLat(item.point, -dx / 2, -dy / 2), offsetLngLat(item.point, dx / 2, dy / 2)] },
      });
    }
    return features;
  }

  function economyVitalityNoticeColor(sublayerId, props = {}) {
    if (sublayerId === "openings") return "#5eaa4e";
    if (sublayerId === "closures" || sublayerId === "vacancy") return "#ed3135";
    const layerColor = economyVitalityLayerColor(sublayerId);
    if (layerColor) return layerColor;
    return economyVitalityRibbonColor(props, 0.56);
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
    const layer = source?.layer === "economy_anchor"
      ? economyVitalityAnchorLayerKey(source)
      : economyVitalityLayerKey(source);
    const seed = stableUnit(`vitality-band:${source.id || source.source_id || source.road_source_id || source.name || source.label || ""}`);
    if (layer === "vacancy" || layer === "closures") return intensity > 0.6 ? "#c7354b" : "#ee3f47";
    if (layer === "openings") return intensity > 0.58 ? "#4f9d4e" : "#7ab35d";
    if (layer === "spend") return intensity > 0.58 ? "#f0a51b" : "#efc05a";
    if (layer === "footfall") return intensity > 0.58 ? "#1693a3" : "#55aeb4";
    if (intensity > 0.72) return seed < 0.82 ? "#6d2f90" : "#a552a8";
    if (intensity > 0.58) return seed < 0.72 ? "#8a3fa0" : "#b65ab3";
    if (intensity > 0.44) return seed < 0.62 ? "#f0a51b" : "#a552a8";
    if (intensity > 0.34) return seed < 0.48 ? "#ee3f47" : "#1693a3";
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

  function economyVitalityAnchorLayerKey(source = {}) {
    const explicit = economyVitalityLayerKey(source);
    if (explicit !== "economy") return explicit;
    const text = [
      source.sector,
      source.osm_shop,
      source.osm_amenity,
      source.osm_tourism,
      source.osm_leisure,
      source.osm_building,
      source.label,
      source.title,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/vacant|derelict|empty/.test(text)) return "vacancy";
    if (/museum|gallery|cinema|theatre|tourism|visitor|hotel|guest/.test(text)) return "footfall";
    if (/restaurant|cafe|caf\u00e9|fast_food|pub|bar|food|market|venue|office|workspace|business|enterprise|service/.test(text)) return "economy";
    if (/bank|finance|atm/.test(text)) return "spend";
    if (/shop|retail|mall|arcade|department|supermarket|convenience|chemist|pharmacy|gift|commercial|store/.test(text)) return "spend";
    if (source.sector === "visitor") return "footfall";
    if (source.sector === "hospitality" || source.sector === "office") return "economy";
    return "spend";
  }

  function economyVitalityLayerLabel(id) {
    const labels = {
      economy: "High-street records",
      vacancy: "Vacancy context",
      footfall: "Footfall context",
      spend: "Spend context",
      openings: "Opening context",
      closures: "Closure context",
    };
    return labels[id] || labels.economy;
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
    const maxDistance = radiusM * 1.56;
    const clipRadiusM = radiusM * 1.45;
    const anchors = planningPressureAnchorFeatures(currentTimelineYear())
      .filter((anchor) => lngLatDistanceMeters(center, anchor.point) <= maxDistance + 260);
    const features = [];
    features.push(...planningPressureCellEdgeFeatures(center, lens, anchors, maxDistance, clipRadiusM));
    for (const road of roads) {
      const roadDistance = geometryDistanceToPointMeters(road.geometry, center, 8);
      if (!Number.isFinite(roadDistance) || roadDistance > maxDistance + 160) continue;
      const rank = Number(road.properties?.rank || 1);
      const clippedGeometry = clipLineGeometryToRadius(road.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry) || geometryToLngLat(road.geometry);
      if (!point) continue;
      const distance = Math.min(maxDistance, geometryDistanceToPointMeters(clippedGeometry, center, 8));
      if (!Number.isFinite(distance) || distance > maxDistance) continue;
      const routeLengthM = geometryLineLengthMeters(clippedGeometry);
      if (routeLengthM < (rank >= 3 ? 18 : 30)) continue;
      const influence = planningPressureAnchorInfluence(point, anchors, rank >= 3 ? 880 : 720);
      const nearestEvent = influence.event || nearestGuideEvent(point, events, 1020);
      const eventDensity = eventDensityIntensity(point, events, 1050);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const rankBoost = Math.min(0.16, Math.max(0, rank - 1) * 0.045);
      const lengthBoost = Math.min(0.12, routeLengthM / 2350);
      const sourceKey = road.properties?.source_id || road.properties?.id || `${point[0].toFixed(5)}:${point[1].toFixed(5)}`;
      const seed = stableUnit(`${sourceKey}:${lens.id}`);
      const anchorSignal = Math.pow(clamp01(influence.intensity), 1.42);
      const intensity = clamp01(
        0.12
        + anchorSignal * 0.38
        + eventDensity * 0.15
        + proximity * 0.12
        + rankBoost
        + lengthBoost * 0.82
        + seed * 0.02
      );
      if (intensity < 0.13 && rank < 2 && !influence.anchor) continue;
      if (intensity < 0.12) continue;
      const flowStyle = intensity > 0.78 || (rank >= 4 && intensity > 0.68)
        ? "planning_pressure_spine"
        : intensity > 0.42
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
          edge_offset: Number(((seed < 0.5 ? -1 : 1) * (flowStyle === "planning_pressure_spine" ? 0.22 : flowStyle === "planning_pressure_edge" ? 0.38 : 0.26)).toFixed(2)),
          segment_length_m: Number(routeLengthM.toFixed(1)),
          distance_m: Number(distance.toFixed(1)),
          score: Number((intensity + proximity * 0.16 + Math.min(0.08, rank * 0.018) + lengthBoost * 0.42 + seed * 0.06).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    return distributePlanningPressureSegments(features, 3200, center)
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, 3200);
  }

  function planningPressureCellEdgeFeatures(center, lens, anchors, maxDistance, clipRadiusM = maxDistance) {
    const features = [];
    const sorted = [...anchors]
      .map((anchor) => ({
        anchor,
        distance: lngLatDistanceMeters(center, anchor.point),
      }))
      .filter((item) => item.distance <= maxDistance * 1.16)
      .sort((a, b) =>
        (b.anchor.intensity + Math.min(0.3, b.anchor.eventCount * 0.025)) -
        (a.anchor.intensity + Math.min(0.3, a.anchor.eventCount * 0.025))
      )
      .slice(0, 1900);
    for (const { anchor, distance } of sorted) {
      const rings = geometryPolygonCoordinateRings(anchor.feature?.geometry);
      if (!rings.length) continue;
      const proximity = 1 - Math.min(maxDistance, distance) / Math.max(1, maxDistance);
      const eventBoost = Math.min(0.2, anchor.eventCount * 0.024);
      const intensity = clamp01(0.12 + anchor.intensity * 0.46 + proximity * 0.1 + eventBoost * 0.62);
      if (intensity < 0.1) continue;
      for (const ring of rings.slice(0, 1)) {
        for (const segment of planningPressureRoadSegments({ type: "LineString", coordinates: ring }, 46)) {
          if (segment.lengthM < 7) continue;
          const clippedGeometry = clipLineGeometryToRadius(segment.geometry, center, clipRadiusM);
          if (!clippedGeometry) continue;
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
            geometry: clippedGeometry,
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
    let strongest = 0;
    let best = null;
    const driverScores = new Map();
    for (const anchor of anchors) {
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (distance > kernelM) continue;
      const distanceWeight = 1 - distance / kernelM;
      const recordBoost = Math.min(0.22, anchor.eventCount * 0.024);
      const weight = distanceWeight * (0.28 + anchor.intensity * 0.62 + recordBoost);
      score += weight;
      strongest = Math.max(strongest, weight);
      driverScores.set(anchor.driver, (driverScores.get(anchor.driver) || 0) + weight);
      if (!best || distance < best.distance) best = { ...anchor, distance };
    }
    const driver = [...driverScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || best?.driver || "";
    return {
      anchor: best,
      eventId: best?.eventId || "",
      event: best?.eventId ? (state.eventById.get(best.eventId) || null) : null,
      driver,
      intensity: clamp01(strongest * 0.68 + Math.min(0.26, score * 0.055)),
    };
  }

  function distributePlanningPressureSegments(features, target, center = null) {
    if (features.length <= target) return features;
    const selected = [];
    const used = new Set();
    if (center) {
      const radialBuckets = new Map();
      for (const feature of features) {
        const point = geometryToLngLat(feature.geometry);
        if (!point) continue;
        const distance = lngLatDistanceMeters(center, point);
        const ring = distance < 620 ? 0 : distance < 1240 ? 1 : 2;
        const bucket = `${transportAngleBucket(center, point, 36)}:${ring}`;
        const previous = radialBuckets.get(bucket);
        if (!previous || Number(feature.properties?.score || 0) > Number(previous.properties?.score || 0)) {
          radialBuckets.set(bucket, feature);
        }
      }
      [...radialBuckets.values()]
        .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
        .slice(0, Math.floor(target * 0.34))
        .forEach((feature) => {
          selected.push(feature);
          used.add(feature);
        });
    }
    const buckets = new Map();
    for (const feature of features) {
      if (used.has(feature)) continue;
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
      .slice(0, Math.max(0, Math.floor(target * 0.66) - selected.length))
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
    if (intensity > 0.58) return "#d85a3f";
    if (intensity > 0.42) return "#ee8d35";
    if (intensity > 0.3) return "#e0b463";
    return "#77a8bd";
  }

  function utilityNetworkContextAnchors(center, maxDistance, lens) {
    const network = state.utilityNetworkFeatures || [];
    const candidates = [];
    const capByType = lens.id === "utilities-capacity"
      ? { electricity: 180, water: 210, telecoms: 180, gas: 82, drainage: 190, district_energy: 60 }
      : { electricity: 220, water: 200, telecoms: 140, gas: 60, drainage: 160, district_energy: 40 };
    for (const feature of network) {
      const props = feature.properties || {};
      const type = String(props.utility_type || "");
      if (!type || !capByType[type]) continue;
      if (props.layer !== "utility_network") continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const rank = Number(props.rank || 1);
      if (lens.id === "utilities-capacity" && type === "electricity" && rank < 2 && Number(props.asset_priority || 0) < 2) continue;
      const intensity = Number(props.intensity || 0.45);
      const proximity = 1 - Math.min(distance, maxDistance) / Math.max(1, maxDistance);
      const role = String(props.network_role || "");
      const anchorTypes = [type];
      if (lens.id === "utilities-capacity" && type === "water" && /stream|river|canal|ditch|drain/.test(role)) {
        anchorTypes.push("drainage");
      }
      for (const visualType of anchorTypes) {
        const typeBoost = visualType === "gas" ? 0.2
          : visualType === "telecoms" ? 0.16
            : visualType === "drainage" ? 0.18
              : visualType === "water" ? 0.08
                : 0;
        candidates.push({
          feature,
          point,
          type: visualType,
          rank,
          intensity,
          distance,
          score: proximity * 0.36 + intensity * 0.28 + Math.min(0.22, rank * 0.05) + typeBoost,
        });
      }
    }
    const selected = [];
    const counts = {};
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      const count = counts[item.type] || 0;
      if (count >= capByType[item.type]) continue;
      selected.push(item);
      counts[item.type] = count + 1;
    }
    return selected;
  }

  function utilityContextInfluenceRadius(type, lens) {
    if (lens.id === "utilities-capacity") {
      if (type === "gas") return 1100;
      if (type === "telecoms") return 520;
      if (type === "drainage") return 700;
      if (type === "water") return 580;
      if (type === "electricity") return 260;
      return 420;
    }
    if (lens.id === "utilities-resilience") {
      if (type === "gas") return 820;
      if (type === "telecoms") return 620;
      if (type === "drainage") return 720;
      if (type === "water") return 620;
      if (type === "district_energy") return 760;
      if (type === "electricity") return 360;
      return 520;
    }
    if (type === "gas" || type === "telecoms") return 560;
    if (type === "drainage" || type === "water") return 460;
    return 340;
  }

  function utilityEventTypeFromText(event, road) {
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
    return "";
  }

  function utilityNetworkRoadUtilityType(point, event, road, lens, anchors) {
    const eventType = utilityEventTypeFromText(event, road);
    if (lens.id === "utilities-capacity") {
      return utilityCapacityRoadUtilityType(point, eventType, event, road, anchors);
    }
    if (lens.id === "utilities-resilience") {
      return utilityResilienceRoadUtilityType(point, eventType, event, road, anchors);
    }
    let best = null;
    for (const anchor of anchors) {
      const radius = utilityContextInfluenceRadius(anchor.type, lens);
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (distance > radius) continue;
      const matchBoost = eventType && anchor.type === eventType ? 0.1 : 0;
      const scarcityBoost = lens.id === "utilities-capacity" && anchor.type === "gas" ? 0.12 : 0;
      const score = (1 - distance / radius) * 0.62
        + Number(anchor.intensity || 0.45) * 0.2
        + Math.min(0.14, Number(anchor.rank || 1) * 0.032)
        + matchBoost
        + scarcityBoost;
      if (!best || score > best.score) best = { type: anchor.type, score };
    }
    if (best && (best.score > 0.36 || !eventType || eventType === "electricity")) return best.type;
    if (eventType) return eventType;
    return utilityEventType(event, road);
  }

  function utilityCapacityRoadUtilityType(point, eventType, event, road, anchors) {
    const scores = utilityCapacityContextScores(point, anchors);
    const seededType = utilityCapacitySeededType(point, event, road, scores, eventType);
    const best = Object.entries(scores)
      .map(([type, score]) => ({ type, score }))
      .sort((a, b) => b.score - a.score)[0] || { type: "", score: 0 };
    const seed = stableUnit(`capacity-type-choice:${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (eventType && scores[eventType] > 0.28 && (eventType !== "electricity" || seed < 0.18)) return eventType;
    if (best.type && best.type !== "electricity" && best.score > 0.58 && best.score > (scores[seededType] || 0) * 1.22) return best.type;
    if (best.type === "electricity" && best.score > 0.78 && seed < 0.12) return best.type;
    if (scores[seededType] > 0.08 || best.score < 0.64) return seededType;
    return seed < (best.type === "electricity" ? 0.07 : 0.22) ? best.type : seededType;
  }

  function utilityResilienceRoadUtilityType(point, eventType, event, road, anchors) {
    const scores = utilityResilienceContextScores(point, anchors);
    const seededType = utilityResilienceSeededType(point, event, road, scores, eventType);
    const best = Object.entries(scores)
      .map(([type, score]) => ({ type, score }))
      .sort((a, b) => b.score - a.score)[0] || { type: "", score: 0 };
    const seed = stableUnit(`resilience-type-choice:${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
    if (eventType === "electricity" && scores[eventType] > 0.68 && seed < 0.18) return eventType;
    if (eventType && eventType !== "electricity" && scores[eventType] > 0.34 && seed < 0.48) return eventType;
    if (eventType && eventType !== "electricity" && seed < 0.24) return eventType;
    if (best.type === "electricity" && best.score > 0.72 && best.score > (scores[seededType] || 0) * 1.24 && seed < 0.32) return best.type;
    if (best.type && best.type !== "electricity" && best.score > 0.56 && best.score > (scores[seededType] || 0) * 1.14 && seed < 0.66) return best.type;
    return seededType;
  }

  function utilityResilienceContextScores(point, anchors) {
    const scores = {
      electricity: 0,
      water: 0,
      telecoms: 0,
      gas: 0,
      drainage: 0,
      district_energy: 0,
    };
    for (const anchor of anchors) {
      const type = anchor.type || "";
      if (!(type in scores)) continue;
      const radius = utilityContextInfluenceRadius(type, { id: "utilities-resilience" });
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (!Number.isFinite(distance) || distance > radius) continue;
      const utilityMixBoost = type === "water" ? 0.09
        : type === "gas" ? 0.13
          : type === "drainage" ? 0.13
            : type === "district_energy" ? 0.16
              : type === "telecoms" ? 0.08
                : 0;
      const score = (1 - distance / radius) * 0.56
        + Number(anchor.intensity || 0.45) * 0.18
        + Math.min(0.16, Number(anchor.rank || 1) * 0.032)
        + utilityMixBoost;
      scores[type] = Math.max(scores[type], score);
    }
    return scores;
  }

  function utilityResilienceSeededType(point, event, road, scores, eventType = "") {
    const baseWeights = {
      electricity: 0.15,
      water: 0.34,
      telecoms: 0.1,
      gas: 0.18,
      drainage: 0.18,
      district_energy: 0.1,
    };
    const key = `${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}:${Math.round((point?.[0] || 0) * 10000)}:${Math.round((point?.[1] || 0) * 10000)}`;
    const routeText = [
      road?.properties?.name,
      road?.properties?.highway,
      road?.properties?.route,
      event?.title,
      event?.area,
    ].filter(Boolean).join(" ").toLowerCase();
    const weights = Object.entries(baseWeights).map(([type, base]) => {
      const textBoost =
        type === "water" && /water|river|quay|dock|lagan|canal|main/.test(routeText) ? 0.1
          : type === "drainage" && /drain|sewer|storm|flood|river|quay|dock|canal/.test(routeText) ? 0.11
            : type === "telecoms" && /exchange|mast|telecom|fibre|fiber|phone|data/.test(routeText) ? 0.12
              : type === "gas" && /gas|industrial|works|depot|yard/.test(routeText) ? 0.1
                : type === "district_energy" && /heat|energy|district|plant|hospital|university|station/.test(routeText) ? 0.1
                  : type === "electricity" && /power|electric|substation|station|rail|line/.test(routeText) ? 0.06
                    : 0;
      const eventBoost = eventType === type ? 0.04 : 0;
      return {
        type,
        weight: base + Math.min(0.18, Math.max(0, scores[type] || 0) * 0.2) + textBoost + eventBoost,
      };
    });
    const total = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
    let cursor = stableUnit(`resilience-seeded-type:${key}`) * total;
    for (const item of weights) {
      cursor -= item.weight;
      if (cursor <= 0) return item.type;
    }
    return weights[weights.length - 1]?.type || "water";
  }

  function utilityCapacityContextScores(point, anchors) {
    const scores = {
      electricity: 0,
      water: 0,
      telecoms: 0,
      gas: 0,
      drainage: 0,
      district_energy: 0,
    };
    for (const anchor of anchors) {
      const type = anchor.type || "";
      if (!(type in scores)) continue;
      const radius = utilityContextInfluenceRadius(type, { id: "utilities-capacity" });
      const distance = lngLatDistanceMeters(point, anchor.point);
      if (!Number.isFinite(distance) || distance > radius) continue;
      const typeScarcityBoost = type === "gas" ? 0.19
        : type === "telecoms" ? 0.07
          : type === "drainage" ? 0.1
            : type === "district_energy" ? 0.18
              : 0;
      const score = (1 - distance / radius) * 0.58
        + Number(anchor.intensity || 0.45) * 0.18
        + Math.min(0.14, Number(anchor.rank || 1) * 0.03)
        + typeScarcityBoost;
      scores[type] = Math.max(scores[type], score);
    }
    return scores;
  }

  function utilityCapacitySeededType(point, event, road, scores, eventType = "") {
    const baseWeights = {
      electricity: 0.18,
      water: 0.38,
      telecoms: 0.07,
      gas: 0.29,
      drainage: 0.16,
      district_energy: 0.12,
    };
    const key = `${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}:${Math.round((point?.[0] || 0) * 10000)}:${Math.round((point?.[1] || 0) * 10000)}`;
    const routeText = [
      road?.properties?.name,
      road?.properties?.highway,
      road?.properties?.route,
      event?.title,
      event?.area,
    ].filter(Boolean).join(" ").toLowerCase();
    const weights = Object.entries(baseWeights).map(([type, base]) => {
      const textBoost =
        type === "water" && /water|river|quay|dock|mill|lagan|canal/.test(routeText) ? 0.08
          : type === "drainage" && /drain|sewer|storm|flood|river|quay|dock/.test(routeText) ? 0.08
            : type === "telecoms" && /exchange|mast|telecom|fibre|fiber|phone|data/.test(routeText) ? 0.1
              : type === "gas" && /gas|industrial|works|depot/.test(routeText) ? 0.08
                : type === "electricity" && /power|electric|substation|station|rail|line/.test(routeText) ? 0.04
                  : 0;
      const eventBoost = eventType === type ? 0.035 : 0;
      return {
        type,
        weight: base + Math.min(0.16, Math.max(0, scores[type] || 0) * 0.18) + textBoost + eventBoost,
      };
    });
    const total = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
    let cursor = stableUnit(`capacity-seeded-type:${key}`) * total;
    for (const item of weights) {
      cursor -= item.weight;
      if (cursor <= 0) return item.type;
    }
    return weights[weights.length - 1]?.type || "water";
  }

  function utilityNetworkStreetFeatures(center, lens) {
    const roads = state.detailRoadFeatures || [];
    const events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === "utilities" && event.lngLat);
    const radiusM = Number(lens.radiusM || 800);
    const contextFeatures = utilityNetworkContextFlowFeatures(center, lens, events, radiusM);
    const traceFeatures = lens.id === "utilities-works"
      ? utilityWorksDetailTraceFlowFeatures(center, lens, events, radiusM)
      : [];
    if (!roads.length || !events.length) {
      return finalizeUtilityNetworkStreetFeatures(
        [...traceFeatures, ...contextFeatures].sort((a, b) => Number(b.properties.score) - Number(a.properties.score)),
        lens,
        center,
      );
    }
    const maxDistance = radiusM * (
      lens.id === "utilities-capacity" ? 2.22
        : lens.id === "utilities-resilience" ? 2.05
          : lens.id === "utilities-works" ? 2.05
            : 2.55
    );
    const clipRadiusM = utilityLensFlowClipRadius(lens, radiusM);
    const minIntensity = lens.id === "utilities-works" ? 0.18
      : lens.id === "utilities-resilience" ? 0.23
        : lens.id === "utilities-capacity" ? 0.2
          : 0.18;
    const contextAnchors = utilityNetworkContextAnchors(center, maxDistance + (lens.id === "utilities-capacity" ? 720 : 1200), lens);
    const features = [];
    for (const road of roads) {
      const distanceToFootprint = geometryDistanceToPointMeters(road.geometry, center, 10);
      if (distanceToFootprint > maxDistance + 180) continue;
      const clippedGeometry = clipUtilityLineLikeGeometryToRadius(road.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const nearestEvent = nearestGuideEvent(point, events, 980);
      const eventDensity = eventDensityIntensity(point, events, 960);
      const rank = Number(road.properties?.rank || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(0.18 + eventDensity * 0.5 + proximity * 0.16 + Math.min(0.12, rank * 0.025));
      if (intensity < minIntensity) continue;
      const type = utilityNetworkRoadUtilityType(point, nearestEvent, road, lens, contextAnchors);
      const worksStatus = lens.id === "utilities-works"
        ? utilityWorksStatusKey(nearestEvent, road.properties || {}, type)
        : "";
      const flowRole = lens.id === "utilities-capacity"
        ? intensity >= 0.52 ? "capacity_risk" : "utility_network_derived"
        : "street_context";
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_role: flowRole,
          flow_style: utilityGuideFlowStyle(lens, nearestEvent, road, intensity, distance, maxDistance),
          event_id: nearestEvent?.id || "",
          source_kind: "street_context",
          sublayer_id: worksStatus,
          works_status: worksStatus,
          works_symbol: worksStatus ? utilityWorksStatusSymbol(worksStatus) : "",
          utility_type: type,
          edge_offset: lens.id === "utilities-capacity"
            ? utilityCapacityTraceOffset(type, road.properties?.source_id || road.properties?.id || "")
            : lens.id === "utilities-works"
              ? utilityWorksThreadOffset(worksStatus, type, road.properties?.source_id || road.properties?.id || "")
            : 0,
          intensity: Number(intensity.toFixed(2)),
          color: worksStatus
            ? utilityWorksStatusBaseColor(worksStatus, type)
            : flowRole === "utility_network_derived"
              ? utilityTypeColor(type, "#438c64")
              : utilityNetworkGuideColor(lens, nearestEvent, road, intensity, type),
          score: Number((intensity + stableUnit(`${lens.id}:${road.properties?.source_id || road.properties?.id || ""}`) * 0.2).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    return finalizeUtilityNetworkStreetFeatures(
      [...traceFeatures, ...contextFeatures, ...features].sort((a, b) => Number(b.properties.score) - Number(a.properties.score)),
      lens,
      center,
    );
  }

  function finalizeUtilityNetworkStreetFeatures(features, lens, center) {
    const limit = lens.id === "utilities-capacity" ? 3450
      : lens.id === "utilities-resilience" ? 2050
      : lens.id === "utilities-works" ? 2350
          : 1450;
    const capped = features.slice(0, limit);
    if (lens.id === "utilities-works") return annotateUtilityWorksVisualPriority(capped, center);
    if (lens.id === "utilities-capacity") return annotateUtilityCapacityVisualPriority(capped, center);
    if (lens.id === "utilities-resilience") return annotateUtilityResilienceVisualPriority(capped, center);
    return capped;
  }

  function annotateUtilityCapacityVisualPriority(features, center) {
    const selected = selectUtilityVisualFlowFeatures(features, center, {
      total: 2450,
      bucketCount: 44,
      bucketCap: 4,
      typeTargets: {
        electricity: 520,
        water: 520,
        drainage: 500,
        telecoms: 360,
        gas: 330,
        district_energy: 220,
      },
      scoreFn: utilityCapacityVisualScore,
    });
    return annotateUtilityVisualPriority(features, center, selected, utilityCapacityVisualScore);
  }

  function annotateUtilityResilienceVisualPriority(features, center) {
    const selected = selectUtilityVisualFlowFeatures(features, center, {
      total: 1550,
      bucketCount: 40,
      bucketCap: 3,
      typeTargets: {
        water: 360,
        electricity: 320,
        telecoms: 250,
        drainage: 260,
        gas: 160,
        district_energy: 120,
      },
      scoreFn: utilityResilienceVisualScore,
    });
    return annotateUtilityVisualPriority(features, center, selected, utilityResilienceVisualScore);
  }

  function selectUtilityVisualFlowFeatures(features, center, opts = {}) {
    const selected = new Set();
    const counts = {};
    const buckets = new Map();
    const sorted = [...features].sort((a, b) => opts.scoreFn(b, center) - opts.scoreFn(a, center));
    const add = (feature, relaxed = false) => {
      if (selected.size >= opts.total) return false;
      const props = feature.properties || {};
      const key = featureKey(feature);
      if (selected.has(key)) return false;
      const type = props.utility_type || "utility";
      const typeTarget = opts.typeTargets?.[type] || 140;
      const typeCount = counts[type] || 0;
      if (!relaxed && typeCount >= typeTarget) return false;
      const point = geometryToLngLat(feature.geometry);
      const distance = point ? lngLatDistanceMeters(center, point) : 0;
      const ring = distance < 520 ? 0 : distance < 1240 ? 1 : distance < 2100 ? 2 : 3;
      const style = props.flow_style || "";
      const bucket = `${type}:${style}:${point ? transportAngleBucket(center, point, opts.bucketCount || 40) : 0}:${ring}`;
      const bucketHits = buckets.get(bucket) || 0;
      const bucketCap = opts.bucketCap || 3;
      if (!relaxed && bucketHits >= bucketCap) return false;
      selected.add(key);
      counts[type] = typeCount + 1;
      buckets.set(bucket, bucketHits + 1);
      return true;
    };
    for (const feature of sorted) {
      const role = feature.properties?.flow_role || "";
      if (role === "utility_network" || role === "capacity_risk") add(feature, true);
    }
    for (const feature of sorted) {
      if (selected.size >= opts.total) break;
      add(feature, false);
    }
    for (const feature of sorted) {
      if (selected.size >= opts.total) break;
      add(feature, true);
    }
    return selected;
  }

  function annotateUtilityVisualPriority(features, center, selected, scoreFn) {
    return features.map((feature) => {
      const key = featureKey(feature);
      const props = feature.properties || {};
      const score = scoreFn(feature, center);
      const visualPriority = selected.has(key)
        ? clamp01(0.5 + Math.min(0.4, score * 0.3))
        : Math.min(0.38, clamp01(0.12 + Math.min(0.16, score * 0.1)));
      return {
        ...feature,
        properties: {
          ...props,
          visual_priority: Number(visualPriority.toFixed(3)),
        },
      };
    });
  }

  function utilityCapacityVisualScore(feature, center) {
    const props = feature.properties || {};
    const point = geometryToLngLat(feature.geometry);
    const distance = point ? lngLatDistanceMeters(center, point) : 2400;
    const proximity = 1 - Math.min(distance, 3600) / 3600;
    const roleBoost = props.flow_role === "capacity_risk" ? 0.3
      : props.flow_role === "utility_network" ? 0.2
        : props.flow_role === "utility_network_derived" ? 0.08
          : 0;
    const typeBoost = props.utility_type === "electricity" ? 0.08
      : props.utility_type === "water" || props.utility_type === "drainage" ? 0.06
        : props.utility_type === "district_energy" ? 0.12
          : 0;
    return Number(props.score || 0) * 0.54 + Number(props.intensity || 0) * 0.28 + proximity * 0.24 + roleBoost + typeBoost;
  }

  function utilityResilienceVisualScore(feature, center) {
    const props = feature.properties || {};
    const point = geometryToLngLat(feature.geometry);
    const distance = point ? lngLatDistanceMeters(center, point) : 2600;
    const proximity = 1 - Math.min(distance, 3600) / 3600;
    const styleBoost = props.flow_style === "utility_primary" ? 0.24
      : props.flow_style === "utility_backup" ? 0.13
        : props.flow_style === "utility_inferred" ? 0.04
          : 0;
    const typeBoost = props.utility_type === "water" || props.utility_type === "electricity" ? 0.08
      : props.utility_type === "district_energy" ? 0.12
        : 0;
    return Number(props.score || 0) * 0.54 + Number(props.intensity || 0) * 0.24 + proximity * 0.22 + styleBoost + typeBoost;
  }

  function annotateUtilityWorksVisualPriority(features, center) {
    const lineTargets = {
      planned: 300,
      repair: 205,
      failure: 130,
      permit: 90,
      reinstatement: 65,
    };
    const lineTotalTarget = 760;
    const lineSelected = new Set();
    const lineCounts = {};
    const lineBuckets = new Map();
    const sorted = [...features].sort((a, b) => utilityWorksVisualScore(b, center) - utilityWorksVisualScore(a, center));
    const tryLine = (feature, relaxed = false) => {
      const props = feature.properties || {};
      const key = utilityWorksFeatureKey(feature);
      if (lineSelected.has(key)) return false;
      const status = props.works_status || props.sublayer_id || "planned";
      const statusTarget = lineTargets[status] || 120;
      const statusCount = lineCounts[status] || 0;
      if (!relaxed && statusCount >= statusTarget) return false;
      if (lineSelected.size >= lineTotalTarget) return false;
      const point = geometryToLngLat(feature.geometry);
      const distance = point ? lngLatDistanceMeters(center, point) : 0;
      const ring = distance < 520 ? 0 : distance < 1180 ? 1 : distance < 1960 ? 2 : 3;
      const bucket = `${status}:${point ? transportAngleBucket(center, point, 44) : 0}:${ring}`;
      const bucketCount = lineBuckets.get(bucket) || 0;
      const bucketCap = status === "planned" || status === "repair" ? 2 : 1;
      if (!relaxed && bucketCount >= bucketCap) return false;
      lineSelected.add(key);
      lineCounts[status] = statusCount + 1;
      lineBuckets.set(bucket, bucketCount + 1);
      return true;
    };
    for (const feature of sorted) {
      const role = feature.properties?.flow_role || "";
      if (role === "source_trace" || role === "utility_network") tryLine(feature, true);
    }
    for (const feature of sorted) {
      if (lineSelected.size >= lineTotalTarget) break;
      tryLine(feature, false);
    }
    for (const feature of sorted) {
      if (lineSelected.size >= lineTotalTarget) break;
      tryLine(feature, true);
    }

    const typeSymbolSelected = selectUtilityWorksSymbolFeatures(sorted, center, lineSelected, 220, 150, 38);
    const statusSymbolSelected = selectUtilityWorksSymbolFeatures(sorted, center, lineSelected, 175, 184, 34);
    return features.map((feature) => {
      const key = utilityWorksFeatureKey(feature);
      const props = feature.properties || {};
      const lineIsSelected = lineSelected.has(key);
      const score = utilityWorksVisualScore(feature, center);
      const visualPriority = lineIsSelected
        ? clamp01(0.54 + Math.min(0.42, score * 0.34))
        : clamp01(0.13 + Math.min(0.16, score * 0.07));
      const typeSymbolPriority = typeSymbolSelected.has(key)
        ? clamp01(0.58 + Math.min(0.38, score * 0.3))
        : 0;
      const statusSymbolPriority = statusSymbolSelected.has(key)
        ? clamp01(0.62 + Math.min(0.36, score * 0.28))
        : 0;
      return {
        ...feature,
        properties: {
          ...props,
          line_selected: lineIsSelected,
          visual_priority: Number(visualPriority.toFixed(3)),
          type_symbol_priority: Number(typeSymbolPriority.toFixed(3)),
          symbol_priority: Number(statusSymbolPriority.toFixed(3)),
        },
      };
    });
  }

  function utilityWorksFeatureKey(feature) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates?.[0] || feature.geometry?.coordinates || "";
    return [
      props.source_kind || "",
      props.flow_role || "",
      props.works_status || props.sublayer_id || "",
      props.utility_type || "",
      props.source_id || props.event_id || "",
      JSON.stringify(coords),
    ].join(":");
  }

  function utilityWorksVisualScore(feature, center) {
    const props = feature.properties || {};
    const point = geometryToLngLat(feature.geometry);
    const distance = point ? lngLatDistanceMeters(center, point) : 2200;
    const proximity = 1 - Math.min(distance, 3200) / 3200;
    const status = props.works_status || props.sublayer_id || "";
    const roleBoost = props.flow_role === "source_trace" ? 0.42 : props.flow_role === "utility_network" ? 0.24 : 0;
    const statusBoost = status === "failure" ? 0.18
      : status === "permit" ? 0.13
        : status === "reinstatement" ? 0.12
          : status === "repair" ? 0.08
            : 0.04;
    const typeBoost = props.utility_type === "water" || props.utility_type === "drainage" ? 0.08
      : props.utility_type === "gas" || props.utility_type === "telecoms" ? 0.04
        : 0;
    return Number(props.score || 0) * 0.58
      + Number(props.intensity || 0) * 0.18
      + proximity * 0.28
      + roleBoost
      + statusBoost
      + typeBoost;
  }

  function selectUtilityWorksSymbolFeatures(features, center, lineSelected, limit, minSpacingM, bucketCount) {
    const selected = new Set();
    const selectedPoints = [];
    const buckets = new Map();
    for (const feature of features) {
      if (selected.size >= limit) break;
      const key = utilityWorksFeatureKey(feature);
      if (!lineSelected.has(key)) continue;
      const point = geometryToLngLat(feature.geometry);
      if (!point) continue;
      const props = feature.properties || {};
      const status = props.works_status || props.sublayer_id || "";
      const distance = lngLatDistanceMeters(center, point);
      const ring = distance < 650 ? 0 : distance < 1350 ? 1 : 2;
      const bucket = `${status}:${transportAngleBucket(center, point, bucketCount)}:${ring}`;
      const bucketCap = status === "failure" || status === "permit" ? 2 : 3;
      const bucketHits = buckets.get(bucket) || 0;
      if (bucketHits >= bucketCap) continue;
      if (selectedPoints.some((item) => item.status === status && lngLatDistanceMeters(item.point, point) < minSpacingM)) continue;
      selected.add(key);
      selectedPoints.push({ point, status });
      buckets.set(bucket, bucketHits + 1);
    }
    return selected;
  }

  function utilityWorksDetailTraceFlowFeatures(center, lens, events, radiusM) {
    const traces = (state.lensDetailFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "utility_trace"
          && Number(props.visible_year || 9999) <= currentTimelineYear()
          && feature.geometry;
      });
    if (!traces.length) return [];
    const maxDistance = radiusM * 2.05;
    const clipRadiusM = utilityLensFlowClipRadius(lens, radiusM);
    const eventById = new Map(events.map((event) => [event.id, event]));
    const features = [];
    for (const trace of traces) {
      const props = trace.properties || {};
      const distanceToFootprint = geometryDistanceToPointMeters(trace.geometry, center, 10);
      if (distanceToFootprint > maxDistance + 160) continue;
      const clippedGeometry = clipUtilityLineLikeGeometryToRadius(trace.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry);
      if (!point) continue;
      const distance = lngLatDistanceMeters(center, point);
      if (distance > maxDistance) continue;
      const eventId = firstDetailEventId(props);
      const event = eventById.get(eventId) || nearestGuideEvent(point, events, 980);
      const type = String(props.utility_type || utilityEventType(event, { properties: props }) || "electricity");
      const worksStatus = utilityWorksStatusKey(event, props, type);
      const eventCount = Number(props.event_count || 1);
      const proximity = 1 - Math.min(maxDistance, distance) / maxDistance;
      const intensity = clamp01(Number(props.intensity || 0.5) * 0.74 + proximity * 0.2 + Math.min(0.22, eventCount * 0.009));
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_role: "source_trace",
          flow_style: "utility_work_thread",
          event_id: event?.id || eventId || "",
          source_kind: "utility_trace",
          source_id: props.source_ids || props.source_id || props.id || "",
          sublayer_id: worksStatus,
          works_status: worksStatus,
          works_symbol: utilityWorksStatusSymbol(worksStatus),
          works_status_basis: props.work_status === "mapped_asset" ? "derived_from_mapped_utility_trace" : "source_status",
          utility_type: type,
          network_role: props.work_status || "utility_trace",
          edge_offset: utilityWorksThreadOffset(worksStatus, type, props.road_source_id || props.id || ""),
          intensity: Number(intensity.toFixed(2)),
          color: utilityWorksStatusBaseColor(worksStatus, type),
          score: Number((intensity + Math.min(0.32, eventCount * 0.012) + Math.min(0.12, Number(props.rank || 1) * 0.028)).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    return features.sort((a, b) => Number(b.properties.score) - Number(a.properties.score)).slice(0, 300);
  }

  function utilityNetworkContextFlowFeatures(center, lens, events, radiusM) {
    const network = (state.utilityNetworkFeatures || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.layer === "utility_network" && props.network_geometry === "line" && feature.geometry;
      });
    if (!network.length) return [];
    const maxDistance = radiusM * (
      lens.id === "utilities-capacity" ? 1.9
        : lens.id === "utilities-resilience" ? 1.95
          : lens.id === "utilities-works" ? 1.9
            : 1.95
    );
    const clipRadiusM = utilityLensFlowClipRadius(lens, radiusM);
    const minIntensity = lens.id === "utilities-resilience" ? 0.18 : lens.id === "utilities-works" ? 0.16 : 0.18;
    const features = [];
    for (const feature of network) {
      const props = feature.properties || {};
      const distanceToFootprint = geometryDistanceToPointMeters(feature.geometry, center, 10);
      if (distanceToFootprint > maxDistance + 160) continue;
      const clippedGeometry = clipUtilityLineLikeGeometryToRadius(feature.geometry, center, clipRadiusM);
      if (!clippedGeometry) continue;
      const point = geometryToLngLat(clippedGeometry);
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
      const type = props.utility_type || "";
      const worksStatus = lens.id === "utilities-works"
        ? utilityWorksStatusKey(nearestEvent, props, type)
        : "";
      features.push({
        type: "Feature",
        properties: {
          kind: "flow",
          lens_id: lens.id,
          flow_role: "utility_network",
          flow_style: flowStyle,
          event_id: nearestEvent?.id || "",
          source_kind: "utility_network",
          source_id: props.source_id || "",
          sublayer_id: worksStatus,
          works_status: worksStatus,
          works_symbol: worksStatus ? utilityWorksStatusSymbol(worksStatus) : "",
          utility_type: type,
          network_role: props.network_role || "",
          edge_offset: lens.id === "utilities-capacity"
            ? utilityCapacityTraceOffset(type, props.source_id || props.id || "")
            : lens.id === "utilities-works"
              ? utilityWorksThreadOffset(worksStatus, type, props.source_id || props.id || "")
            : 0,
          intensity: Number(intensity.toFixed(2)),
          color: worksStatus ? utilityWorksStatusBaseColor(worksStatus, type) : utilityNetworkContextGuideColor(lens, props, intensity, flowStyle),
          score: Number((intensity + Math.min(0.24, rank * 0.024) + stableUnit(`${lens.id}:${props.source_id || props.id || ""}`) * 0.14).toFixed(3)),
        },
        geometry: clippedGeometry,
      });
    }
    return features
      .sort((a, b) => Number(b.properties.score) - Number(a.properties.score))
      .slice(0, lens.id === "utilities-capacity" ? 1240 : lens.id === "utilities-resilience" ? 900 : lens.id === "utilities-works" ? 540 : 620);
  }

  function utilityLensFlowClipRadius(lens, radiusM) {
    if (lens.id === "utilities-capacity") return radiusM * 2.42;
    if (lens.id === "utilities-resilience") return radiusM * 1.95;
    if (lens.id === "utilities-works") return radiusM * 1.88;
    return radiusM * 2;
  }

  function clipUtilityLineLikeGeometryToRadius(geometry, center, radiusM) {
    if (!geometry) return null;
    if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
      return clipLineGeometryToRadius(geometry, center, radiusM);
    }
    const rings = geometryPolygonCoordinateRings(geometry)
      .map((ring) => ring.filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1])))
      .filter((ring) => ring.length >= 2);
    if (!rings.length) return null;
    return clipLineGeometryToRadius({ type: "MultiLineString", coordinates: rings }, center, radiusM);
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

  function utilityTypeLabel(type) {
    if (type === "electricity") return "Power";
    if (type === "water") return "Water";
    if (type === "telecoms" || type === "telecom") return "Telecoms";
    if (type === "gas") return "Gas";
    if (type === "drainage") return "Drainage";
    if (type === "district_energy") return "District energy";
    return "Utility";
  }

  function utilityCapacityRiskColor(type, intensity) {
    if (type === "electricity") {
      if (intensity > 0.82) return "#d62d35";
      if (intensity > 0.64) return "#ef6b2a";
      return "#e8a620";
    }
    if (type === "water") return intensity > 0.72 ? "#0f6f9d" : "#2f85bd";
    if (type === "drainage") return intensity > 0.72 ? "#0f777a" : "#148a8d";
    if (type === "telecoms") return "#7a3b97";
    if (type === "gas") return "#d7a52b";
    if (type === "district_energy") return "#7a5438";
    return intensity > 0.7 ? "#8c7460" : "#438c64";
  }

  function utilityCapacityTraceOffset(type, key = "") {
    const base = {
      electricity: 1.6,
      water: -1.45,
      telecoms: 0.82,
      gas: -0.72,
      drainage: 0.24,
      district_energy: 2.2,
    }[type] || 0;
    return Number((base + (stableUnit(`capacity-offset:${type}:${key}`) - 0.5) * 0.5).toFixed(2));
  }

  function utilityNetworkContextGuideColor(lens, props, intensity, flowStyle) {
    const type = String(props.utility_type || "");
    if (lens.id === "utilities-capacity") {
      if (intensity > 0.94 && type === "electricity") return "#d62d35";
      return utilityTypeColor(type, "#438c64");
    }
    if (lens.id === "utilities-resilience") {
      if (flowStyle === "utility_primary") return "#1787b3";
      if (flowStyle === "utility_backup") {
        if (type === "electricity" || type === "gas") return "#d9a330";
        if (type === "telecoms") return "#7a4e9b";
        if (type === "district_energy") return "#8d6a4a";
        return "#2f9aa4";
      }
      if (flowStyle === "utility_inferred") {
        if (type === "electricity" || type === "gas") return "#d8ad66";
        if (type === "telecoms") return "#b894c5";
        return "#8bb2b7";
      }
      return utilityTypeColor(type, type === "electricity" ? "#d9a330" : "#1787b3");
    }
    if (lens.id === "utilities-works") {
      return utilityWorksStatusBaseColor(utilityWorksStatusKey(null, props, type), type);
    }
    return utilityWorksTypeColor(type, { id: props.source_id || "", title: props.title || "" }, { properties: props });
  }

  function utilityNetworkGuideColor(lens, event, road, intensity, preferredType = "") {
    if (lens.id === "utilities-capacity") {
      const type = preferredType || utilityEventType(intensity > 0.78 ? event : null, road);
      return utilityCapacityRiskColor(type, intensity);
    }
    const type = preferredType || utilityEventType(event, road);
    if (lens.id === "utilities-resilience") {
      const rank = Number(road?.properties?.rank || 1);
      const seed = stableUnit(`${event?.id || ""}:${road?.properties?.source_id || road?.properties?.id || ""}`);
      const flowStyle = rank >= 4 || intensity > 0.8
        ? "utility_primary"
        : seed < 0.62 || intensity > 0.56
          ? "utility_backup"
          : "utility_inferred";
      if (flowStyle === "utility_primary") return "#1787b3";
      if (flowStyle === "utility_backup") {
        if (type === "electricity" || type === "gas") return "#d9a330";
        if (type === "telecoms") return "#7a4e9b";
        return "#2f9aa4";
      }
      if (type === "electricity" || type === "gas") return "#d8ad66";
      if (type === "telecoms") return "#b894c5";
      return "#8bb2b7";
    }
    if (lens.id === "utilities-works") {
      return utilityWorksStatusBaseColor(utilityWorksStatusKey(event, road?.properties || {}, type), type);
    }
    if (type === "water" || type === "telecoms" || type === "electricity" || type === "gas" || type === "drainage") {
      return utilityWorksStatusColor("asset", type, event, road);
    }
    return intensity > 0.66 ? "#d66a3a" : "#8c7460";
  }

  function utilityWorksStatusKey(event, props = {}, type = "") {
    const text = [
      event?.title,
      event?.area,
      props.title,
      props.name,
      props.network_role,
      props.work_status,
      props.status,
      ...(event?.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/fail|outage|burst|emergency|disruption|closure/.test(text)) return "failure";
    if (/permit|consent|licen[cs]e|wayleave|statutory/.test(text)) return "permit";
    if (/reinstate|resurface|restore|reinstatement/.test(text)) return "reinstatement";
    if (/repair|replace|renewal|renew/.test(text)) return "repair";
    if (/planned|programme|program|scheme|maintenance|construction|install|upgrade/.test(text)) return "planned";
    const seedA = stableUnit(`works-status:${type}:${event?.id || ""}:${props.source_id || props.id || ""}:${props.network_role || ""}`);
    const seedB = stableUnit(`works-status-alt:${props.name || props.title || ""}:${props.source_url || ""}:${props.id || ""}`);
    const seed = (seedA * 0.41 + seedB * 0.59) % 1;
    if (type === "water" && /river|stream|canal/.test(String(props.network_role || ""))) {
      if (seed < 0.42) return "repair";
      if (seed < 0.62) return "planned";
      if (seed < 0.82) return "reinstatement";
      if (seed < 0.93) return "failure";
      return "permit";
    }
    if (type === "electricity" && /substation|generator|cable|line/.test(String(props.network_role || ""))) {
      if (seed < 0.34) return "planned";
      if (seed < 0.58) return "repair";
      if (seed < 0.76) return "permit";
      if (seed < 0.9) return "failure";
      return "reinstatement";
    }
    if (seed < 0.5) return "planned";
    if (seed < 0.72) return "repair";
    if (seed < 0.82) return "failure";
    if (seed < 0.93) return "permit";
    return "reinstatement";
  }

  function utilityWorksStatusBaseColor(status, type = "") {
    if (status === "planned") return "#248b94";
    if (status === "repair") return "#e8a620";
    if (status === "failure") return "#cf3337";
    if (status === "permit") return "#774a92";
    if (status === "reinstatement") return "#4f9a5b";
    return utilityWorksTypeColor(type, { id: status || "" }, { properties: {} });
  }

  function utilityWorksStatusSymbol(status) {
    if (status === "planned") return ">";
    if (status === "repair") return "+";
    if (status === "failure") return "x";
    if (status === "permit") return "[]";
    if (status === "reinstatement") return "|";
    return ".";
  }

  function utilityWorksThreadOffset(status, type = "", key = "") {
    const statusOffset = {
      planned: 1.15,
      repair: -1.1,
      failure: 2.45,
      permit: -2.35,
      reinstatement: 0.15,
    }[status] || 0;
    const typeOffset = {
      water: -0.34,
      electricity: 0.28,
      telecoms: 0.66,
      telecom: 0.66,
      gas: -0.62,
      drainage: -0.18,
      district_energy: 0.46,
    }[type] || 0;
    const jitter = (stableUnit(`works-offset:${status}:${type}:${key}`) - 0.5) * 0.36;
    return Number((statusOffset + typeOffset + jitter).toFixed(2));
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
    const explicitType = utilityEventTypeFromText(event, road);
    if (explicitType) return explicitType;
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
    const candidatePool = anchorCandidates.length >= 8
      ? [
        ...anchorCandidates,
        ...detailCandidates
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      ]
      : [...anchorCandidates, ...detailCandidates, ...eventCandidates];
    const selected = selectEconomyGravityCandidates(center, candidatePool, lens, anchorCandidates.length >= 8 ? 18 : 20);
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
            target_label: economyGravityTargetLabel(item.event),
            target_detail: `${economyGravitySectorLabel(sector)} / ${item.event.year || currentTimelineYear()}`,
            confidence: item.event.confidence || "",
            source_kind: "source_backed",
            intensity: Number(intensity.toFixed(2)),
            color: economyGravitySectorColor(sector),
          },
          geometry: { type: "LineString", coordinates: economyGravityArcLine(center, item.event.lngLat, { eventId: item.event.id, sector }, index, 0, 1) },
        };
      });
    }
    const features = [];
    selected.forEach((item, index) => {
      const laneCount = !item.isContextAnchor && (item.eventCount >= 8 || item.sourceCount >= 4 || item.intensity > 0.82) ? 2 : 1;
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
            target_label: economyGravityTargetLabel(item),
            target_detail: economyGravityTargetDetail(item),
            confidence: item.props?.confidence || (item.isContextAnchor ? "context" : ""),
            source_kind: item.isContextAnchor ? "current_context" : "source_backed",
            event_count: item.eventCount,
            source_count: item.sourceCount,
            intensity: Number(laneIntensity.toFixed(2)),
            color: economyGravitySectorColor(item.sublayerId),
            edge_offset: Number(((lane - (laneCount - 1) / 2) * 0.86).toFixed(2)),
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
    const anchorMaxDistance = Math.min(maxDistance * 1.04, Number(lens.radiusM || 1500) * 1.88);
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
        const anchorPriority = economyGravityAnchorPriority(props);
        const intensity = clamp01(0.26 + rank * 0.15 + ringFit * 0.16 + nameBoost + Math.max(0, anchorPriority) * 0.16);
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
          score: intensity * 0.36 + ringFit * 0.28 + Math.min(0.2, rank * 0.064) + radial * 0.08 + anchorPriority * 0.46 + stableUnit(`${props.source_id || ""}:${props.label || ""}`) * 0.035,
          isContextAnchor: true,
          anchorPriority,
        };
      })
      .filter(Boolean);
  }

  function economyGravityAnchorPriority(props = {}) {
    const label = String(props.label || props.name || props.title || "").toLowerCase();
    const osm = [
      props.osm_amenity,
      props.osm_tourism,
      props.osm_historic,
      props.osm_building,
      props.osm_shop,
      props.osm_office,
      props.osm_leisure,
      props.sector,
    ].filter(Boolean).join(" ").toLowerCase();
    let score = 0;
    if (/city hall|waterfront|titanic|queen'?s|university|market|arcade|museum|theatre|gallery|arena|castle|cathedral|botanic|ulster|conference|exhibition/.test(label)) score += 0.68;
    if (/townhall|theatre|cinema|museum|gallery|attraction|marketplace|events?_venue|mall|university|college|civic/.test(osm)) score += 0.36;
    if (/townhall|conference|exhibition|attraction|marketplace|mall/.test(osm)) score += 0.18;
    if (/supermarket|convenience|atm|bank|fast_food|parking|passport|spar|mace|eurospar/.test(`${label} ${osm}`)) score -= 0.24;
    if (/hotel|inn|hostel|backpacker|guest|voco|ibis|holiday inn|premier inn|hilton/.test(label)) score -= 0.16;
    if (/^market\/venue anchor$|^retail anchor$|^economy anchor$/.test(label)) score -= 0.18;
    return Math.max(-0.28, Math.min(1.18, score));
  }

  function selectEconomyGravityCandidates(center, candidates, lens, limit) {
    const economyGravity = lens?.id === "economy-gravity";
    const selected = [];
    const sectorCounts = new Map();
    const bucketCounts = new Map();
    const sorted = candidates
      .filter((item) => item.point && item.sublayerId)
      .sort((a, b) => b.score - a.score || b.distance - a.distance);
    for (const item of sorted) {
      if (selected.length >= limit) break;
      const sectorLimit = economyGravity
        ? (item.sublayerId === "economy" ? 4 : item.isContextAnchor ? 3 : 4)
        : item.sublayerId === "economy" ? 8 : item.isContextAnchor ? 5 : 6;
      if ((sectorCounts.get(item.sublayerId) || 0) >= sectorLimit) continue;
      const bucket = transportAngleBucket(center, item.point, 30);
      if ((bucketCounts.get(bucket) || 0) >= (economyGravity ? 2 : 3)) continue;
      const minSpacing = item.distance < 600 ? 80 : 112;
      if (selected.some((existing) => existing.sublayerId === item.sublayerId && lngLatDistanceMeters(existing.point, item.point) < minSpacing)) continue;
      selected.push(item);
      sectorCounts.set(item.sublayerId, (sectorCounts.get(item.sublayerId) || 0) + 1);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    }
    if (selected.length >= Math.min(economyGravity ? 12 : 15, limit)) return selected;
    const selectedKeys = new Set(selected.map((item) => `${item.eventId}:${item.sourceId}:${item.distance.toFixed(0)}`));
    for (const item of sorted) {
      if (selected.length >= limit) break;
      const key = `${item.eventId}:${item.sourceId}:${item.distance.toFixed(0)}`;
      if (selectedKeys.has(key)) continue;
      if (economyGravity && (sectorCounts.get(item.sublayerId) || 0) >= 4) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < 72)) continue;
      selected.push(item);
      selectedKeys.add(key);
      sectorCounts.set(item.sublayerId, (sectorCounts.get(item.sublayerId) || 0) + 1);
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
    const laneOffset = (laneIndex - (laneCount - 1) / 2) * Math.min(48, 18 + distance * 0.014);
    const sectorBias = {
      economy: -0.12,
      office: 0.1,
      hospitality: 0.2,
      visitor: -0.18,
      night: 0.28,
      markets: -0.24,
    }[item?.sublayerId || item?.sector || "economy"] || 0;
    const bucketSize = Math.PI / 4;
    const gatewayAngle = Math.round((angle + sectorBias) / bucketSize) * bucketSize
      + sectorBias * 0.7
      + (seed - 0.5) * 0.2;
    const signedDelta = Math.atan2(Math.sin(gatewayAngle - angle), Math.cos(gatewayAngle - angle));
    const fallbackSign = stableUnit(`${item?.sourceId || ""}:${item?.eventId || ""}:orbit:${index}`) < 0.5 ? -1 : 1;
    const orbitSign = Math.abs(signedDelta) > 0.12 ? (signedDelta >= 0 ? 1 : -1) : fallbackSign;
    const bendMagnitude = Math.min(distance * (0.16 + seed * 0.055 + clamp01(item?.intensity || 0.45) * 0.065), 520);
    const bend = bendMagnitude * orbitSign + laneOffset;
    const hubSpread = Math.min(78, 28 + distance * 0.014);
    const laneSpread = (laneIndex - (laneCount - 1) / 2) * 12;
    const sx = Math.cos(gatewayAngle) * hubSpread * 0.62 + px * laneSpread;
    const sy = Math.sin(gatewayAngle) * hubSpread * 0.62 + py * laneSpread;
    const gatewayPull = Math.min(280, distance * 0.22);
    const approachPull = Math.min(210, distance * 0.16);
    const c1 = [
      sx + Math.cos(gatewayAngle) * gatewayPull + px * bend * 0.24,
      sy + Math.sin(gatewayAngle) * gatewayPull + py * bend * 0.24,
    ];
    const c2 = [
      dx - Math.cos(angle) * approachPull + px * bend * 0.52,
      dy - Math.sin(angle) * approachPull + py * bend * 0.52,
    ];
    const coords = [];
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const inv = 1 - t;
      const x = inv * inv * inv * sx
        + 3 * inv * inv * t * c1[0]
        + 3 * inv * t * t * c2[0]
        + t * t * t * dx;
      const y = inv * inv * inv * sy
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

  function economyGravityTargetLabel(item) {
    const props = item?.props || item || {};
    const fallbackSector = item?.sublayerId || item?.sector || props.sublayer_id || props.sector || economyGravitySectorKey(props);
    const raw = props.label || props.name || props.title || props.road_name || economyGravitySectorLabel(fallbackSector);
    const cleaned = String(raw)
      .replace(/^\d+\s+source-backed economy records near\s*/i, "")
      .replace(/\s*\/\s*OSM context$/i, "")
      .split(/[.;]/)[0]
      .trim();
    return truncate(cleaned || economyGravitySectorLabel(fallbackSector), 32);
  }

  function economyGravityTargetDetail(item) {
    const props = item?.props || item || {};
    const sector = item?.sublayerId || item?.sector || props.sublayer_id || props.sector || economyGravitySectorKey(props);
    if (item?.isContextAnchor) return `${economyGravitySectorLabel(sector)} / OSM context`;
    const year = props.visible_year || props.year || currentTimelineYear();
    return `${economyGravitySectorLabel(sector)} / ${year}`;
  }

  function nodeGuideFeatures(center, lens) {
    if (lens.id.startsWith("transport-")) {
      return transportNodeGuideFeatures(center, lens);
    }
    const radiusM = Number(lens.radiusM || 800);
    const distributedNodeLenses = ["planning-pressure", "civic-access-gaps", "economy-vitality", "utilities-capacity", "utilities-resilience", "utilities-works"];
    const maxDistance = radiusM * (lens.id === "utilities-capacity" ? 2.12 : distributedNodeLenses.includes(lens.id) ? 2.35 : 1.18);
    const eventAnchorLimit = ["economy-vitality", "economy-gravity"].includes(lens.id) ? 0 : lens.id === "utilities-works" ? 8 : 10;
    const anchors = eventAnchorLimit
      ? nearbyLensEventAnchors(center, lens, {
        maxDistance,
        minDistance: 70,
        limit: eventAnchorLimit,
        distributed: distributedNodeLenses.includes(lens.id),
      })
      : [];
    const eventNodes = anchors
      .map((item, index) => {
        const intensity = clamp01(0.18 + (1 - Math.min(item.distance, maxDistance) / maxDistance) * 0.72);
        const sublayerId = lens.id === "economy-gravity"
          ? economyGravitySectorKey(item.event)
          : lens.id === "civic-catchment"
          ? civicServiceSublayerKey(item.event)
          : lens.id === "civic-demand"
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
          node_style: lens.id === "planning-pressure" ? "planning_document" : lens.id === "economy-vitality" ? "economy_notice" : lens.id === "civic-demand" ? "civic_anchor" : "",
          event_id: item.event.id,
          title: item.event.title,
          area: item.event.area || "",
          year: item.event.year || currentTimelineYear(),
          confidence: item.event.confidence || "",
          label: guideNodeLabel(item.event, lens),
          label_detail: guideNodeDetail(item.event, lens),
          label_rank: index + 1,
          layer_id: lens.id === "civic-access-gaps" || lens.id === "civic-demand" ? "facilities" : "",
          sublayer_id: sublayerId,
          intensity: Number(intensity.toFixed(2)),
          color: lens.id === "economy-gravity" && sublayerId
            ? economyGravitySectorColor(sublayerId)
            : lens.id === "civic-catchment" && sublayerId
            ? civicServiceSublayerColor(sublayerId)
            : lens.id === "civic-demand" && sublayerId
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
    const utilityCapacityContextNodes = lens.id === "utilities-capacity"
      ? utilityCapacityContextNodeGuideFeatures(center, lens, maxDistance, [...eventNodes, ...utilityTraceNodes])
      : [];
    const utilityResilienceContextNodes = lens.id === "utilities-resilience"
      ? utilityResilienceContextNodeGuideFeatures(center, lens, maxDistance, [...eventNodes, ...utilityTraceNodes])
      : [];
    const civicAccessStopNodes = lens.id === "civic-access-gaps"
      ? civicAccessStopNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const civicAccessServiceNodes = lens.id === "civic-access-gaps"
      ? civicAccessServiceAnchorNodeGuideFeatures(center, lens)
      : [];
    const economyAnchorNodes = lens.id === "economy-gravity"
      ? economyGravityAnchorNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const economyVitalityAnchorNodes = lens.id === "economy-vitality"
      ? economyVitalityAnchorNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const civicCatchmentAnchorNodes = lens.id === "civic-catchment"
      ? civicCatchmentAnchorNodeGuideFeatures(center, lens, maxDistance)
      : [];
    const civicDemandAnchorNodes = lens.id === "civic-demand"
      ? civicDemandAnchorNodeGuideFeatures(center, lens)
      : [];
    return [
      ...civicAccessStopNodes,
      ...civicAccessServiceNodes,
      ...civicCatchmentAnchorNodes,
      ...civicDemandAnchorNodes,
      ...economyAnchorNodes,
      ...economyVitalityAnchorNodes,
      ...eventNodes,
      ...utilityTraceNodes,
      ...utilityCapacityContextNodes,
      ...utilityResilienceContextNodes,
      ...lensDetailNodeGuideFeatures(center, lens, maxDistance, seenEventIds, eventNodes.length + utilityCapacityContextNodes.length + utilityResilienceContextNodes.length + economyAnchorNodes.length + economyVitalityAnchorNodes.length + civicCatchmentAnchorNodes.length + civicDemandAnchorNodes.length + civicAccessServiceNodes.length),
    ];
  }

  function civicAccessServiceAnchorNodeGuideFeatures(center, lens) {
    const year = currentTimelineYear();
    const selected = [];
    const buckets = new Map();
    const layerCounts = new Map();
    for (const item of civicAccessServiceAnchorCandidates(center, Number(lens.radiusM || 1500), year)) {
      if (selected.length >= 12) break;
      const bucket = transportAngleBucket(center, item.point, 24);
      const bucketCount = buckets.get(bucket) || 0;
      const layerCount = layerCounts.get(item.layerId) || 0;
      if (bucketCount >= 1) continue;
      if (layerCount >= 3) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < 230)) continue;
      selected.push(item);
      buckets.set(bucket, bucketCount + 1);
      layerCounts.set(item.layerId, layerCount + 1);
    }
    return selected.map((item, index) => ({
      type: "Feature",
      properties: {
        kind: "node",
        lens_id: lens.id,
        node_style: "civic_anchor",
        layer_id: "facilities",
        sublayer_id: item.layerId,
        source_id: item.sourceId || "",
        event_id: item.eventId || "",
        title: item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId),
        label: truncate(item.event?.title || item.props?.label || item.props?.name || civicServiceSublayerLabel(item.layerId), 28),
        label_detail: item.sourceKind === "osm"
          ? `${civicServiceSublayerLabel(item.layerId)} / OSM context`
          : `${civicServiceSublayerLabel(item.layerId)} / ${year}`,
        label_rank: index + 1,
        intensity: Number(item.intensity.toFixed(2)),
        color: civicServiceSublayerColor(item.layerId),
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
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

  function civicDemandAnchorNodeGuideFeatures(center, lens) {
    const year = currentTimelineYear();
    const sourceEvents = lensEventsForYear(year)
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const selected = selectCivicCatchmentCandidates(
      center,
      civicCatchmentCandidates(center, Number(lens.radiusM || 1500), lens, sourceEvents, year),
      lens,
      34,
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
          : `${civicServiceSublayerLabel(item.layerId)} / ${year}`,
        label_rank: index + 1,
        layer_id: "facilities",
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
        label_detail: economyGravitySectorLabel(item.sublayerId),
        label_rank: index + 1,
        sublayer_id: item.sublayerId,
        intensity: Number(item.intensity.toFixed(2)),
        color: economyGravitySectorColor(item.sublayerId),
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
  }

  function economyVitalityAnchorNodeGuideFeatures(center, lens, maxDistance) {
    const selected = selectEconomyVitalityAnchorCandidates(
      economyVitalityAnchorCandidates(center, lens, maxDistance * 1.08),
      center,
      7,
    );
    return selected.map((item, index) => {
      const label = item.props.label || economyVitalityLayerLabel(item.sublayerId);
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "economy_notice",
          source_id: item.sourceId || "",
          event_id: "",
          title: label,
          label: truncate(label, 30),
          label_detail: `${economyVitalityLayerLabel(item.sublayerId)} / OSM context`,
          label_rank: index + 1,
          sublayer_id: item.sublayerId,
          intensity: Number(item.intensity.toFixed(2)),
          color: economyVitalityLayerColor(item.sublayerId),
        },
        geometry: { type: "Point", coordinates: item.point },
      };
    });
  }

  function economyVitalityAnchorCandidates(center, lens, maxDistance) {
    const contextMaxDistance = Math.max(Number(lens.radiusM || 800), Number(maxDistance || 0));
    return (state.economyAnchorFeatures || [])
      .map((feature) => {
        const props = feature.properties || {};
        if (props.layer !== "economy_anchor" || !feature.geometry) return null;
        const point = geometryToLngLat(feature.geometry);
        if (!point) return null;
        const distance = lngLatDistanceMeters(center, point);
        if (!Number.isFinite(distance) || distance < 70 || distance > contextMaxDistance) return null;
        const rank = Number(props.anchor_rank || 1);
        const sublayerId = economyVitalityAnchorLayerKey(props);
        const proximity = 1 - Math.min(distance, contextMaxDistance) / Math.max(1, contextMaxDistance);
        const label = String(props.label || "").trim();
        const text = [
          props.label,
          props.sector,
          props.osm_shop,
          props.osm_amenity,
          props.osm_tourism,
          props.osm_building,
        ].filter(Boolean).join(" ").toLowerCase();
        const destinationBoost = /mall|arcade|market|square|department|hotel|theatre|cinema|museum|gallery|bank|restaurant|pub|bar|cafe|caf\u00e9/.test(text) ? 0.13 : 0;
        const vacancyPenalty = sublayerId === "vacancy" ? -0.05 : 0;
        const intensity = clamp01(
          0.28
          + Math.min(0.28, rank * 0.11)
          + proximity * 0.22
          + destinationBoost
          + (label ? 0.04 : 0)
          + vacancyPenalty
        );
        return {
          point,
          props,
          sublayerId,
          sourceId: props.source_id || props.id || "",
          distance,
          rank,
          intensity,
          score: intensity * 0.44
            + Math.min(0.24, rank * 0.075)
            + proximity * 0.24
            + destinationBoost
            + stableUnit(`${props.source_id || props.id || ""}:${label}`) * 0.045,
        };
      })
      .filter(Boolean);
  }

  function selectEconomyVitalityAnchorCandidates(candidates, center, limit = 7) {
    const selected = [];
    const layerCounts = new Map();
    const bucketCounts = new Map();
    const sorted = [...candidates].sort((a, b) => b.score - a.score || b.rank - a.rank || a.distance - b.distance);
    for (const item of sorted) {
      if (selected.length >= limit) break;
      const layerLimit = item.sublayerId === "spend" ? 3 : item.sublayerId === "footfall" ? 3 : 2;
      if ((layerCounts.get(item.sublayerId) || 0) >= layerLimit) continue;
      const bucket = transportAngleBucket(center, item.point, 18);
      if ((bucketCounts.get(bucket) || 0) >= 2) continue;
      const minSpacing = item.distance < 520 ? 160 : 225;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacing)) continue;
      selected.push(item);
      layerCounts.set(item.sublayerId, (layerCounts.get(item.sublayerId) || 0) + 1);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    }
    return selected;
  }

  function utilityCapacityContextNodeGuideFeatures(center, lens, maxDistance, existingNodes = []) {
    if (lens.id !== "utilities-capacity") return [];
    const targetByType = {
      electricity: 10,
      water: 11,
      telecoms: 7,
      gas: 5,
      drainage: 10,
      district_energy: 3,
    };
    const candidates = [];
    const contextMaxDistance = maxDistance * 1.18;
    for (const feature of state.utilityNetworkFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "utility_network" || !feature.geometry) continue;
      const type = String(props.utility_type || "");
      if (!targetByType[type]) continue;
      const networkGeometry = String(props.network_geometry || "");
      const rank = Number(props.rank || 1);
      const assetPriority = Number(props.asset_priority || 0);
      if (type === "electricity" && networkGeometry === "asset" && assetPriority < 2) continue;
      const sampleCount = networkGeometry === "asset" ? 1
        : type === "water" || type === "drainage" ? 3
          : rank >= 4 ? 2 : 1;
      const points = geometryCoordinateSamples(feature.geometry, sampleCount);
      for (const point of points) {
        const distance = lngLatDistanceMeters(center, point);
        if (!Number.isFinite(distance) || distance > contextMaxDistance) continue;
        const proximity = 1 - Math.min(distance, contextMaxDistance) / contextMaxDistance;
        const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.08, assetPriority * 0.02));
        const score = proximity * 0.48
          + intensity * 0.28
          + Math.min(0.16, rank * 0.032)
          + (networkGeometry === "asset" ? 0.12 : 0.04);
        candidates.push({
          point,
          type,
          props,
          distance,
          intensity,
          sourceKind: "utility_network",
          score,
        });
        const role = String(props.network_role || "").toLowerCase();
        if (type === "water" && /ditch|drain|stream|river|canal|flood|culvert/.test(role)) {
          candidates.push({
            point,
            type: "drainage",
            props,
            distance,
            intensity: clamp01(intensity * 0.94),
            sourceKind: "utility_network",
            score: score + 0.08,
          });
        }
      }
    }

    const derivedFlows = utilityNetworkStreetFeatures(center, lens)
      .filter((feature) => {
        const props = feature.properties || {};
        return props.flow_style === "utility_capacity_trace"
          && props.source_kind === "street_context"
          && targetByType[props.utility_type || ""];
      })
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, 520);
    for (const flow of derivedFlows) {
      const props = flow.properties || {};
      const type = String(props.utility_type || "");
      const intensity = Number(props.intensity || 0.45);
      if (intensity < (type === "gas" || type === "district_energy" ? 0.3 : 0.43)) continue;
      const points = geometryCoordinateSamples(flow.geometry, type === "gas" || type === "district_energy" ? 2 : 1);
      for (const point of points) {
        const distance = lngLatDistanceMeters(center, point);
        if (!Number.isFinite(distance) || distance > maxDistance) continue;
        const proximity = 1 - Math.min(distance, maxDistance) / maxDistance;
        const scarceTypeBoost = type === "gas" ? 0.18
          : type === "district_energy" ? 0.2
            : type === "drainage" ? 0.09
              : 0;
        candidates.push({
          point,
          type,
          props,
          distance,
          intensity: clamp01(intensity + scarceTypeBoost * 0.25),
          sourceKind: "derived_capacity_trace",
          score: proximity * 0.36 + intensity * 0.42 + Number(props.score || 0) * 0.16 + scarceTypeBoost,
        });
      }
    }

    const existingPoints = existingNodes
      .map((feature) => geometryToLngLat(feature.geometry))
      .filter(Boolean);
    const selected = [];
    const counts = {};
    const bucketCounts = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      const count = counts[item.type] || 0;
      if (count >= targetByType[item.type]) continue;
      const bucket = `${item.type}:${transportAngleBucket(center, item.point, 42)}:${Math.floor(item.distance / 420)}`;
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= (item.type === "gas" || item.type === "district_energy" ? 2 : 3)) continue;
      const minSpacing = item.sourceKind === "utility_network" ? 104 : 146;
      if (existingPoints.some((point) => lngLatDistanceMeters(point, item.point) < 62)) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacing)) continue;
      selected.push(item);
      existingPoints.push(item.point);
      counts[item.type] = count + 1;
      bucketCounts.set(bucket, bucketCount + 1);
    }

    return selected.map((item, index) => {
      const props = item.props || {};
      const inferred = item.sourceKind === "derived_capacity_trace";
      const title = props.title || (inferred ? `${utilityTypeLabel(item.type)} context trace` : `${utilityTypeLabel(item.type)} utility context`);
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "utility_trace",
          detail_layer: inferred ? "utility_capacity_trace" : "utility_network_context",
          utility_type: item.type,
          event_id: props.event_id || "",
          source_id: props.source_id || props.id || "",
          confidence: props.confidence || (inferred ? "inferred" : ""),
          title,
          label: truncate(title, 28),
          label_detail: inferred ? "Road-adjacent derived trace" : "OSM utility context",
          label_rank: index + 1,
          intensity: Number(item.intensity.toFixed(2)),
          color: utilityTypeColor(item.type, "#8c7460"),
        },
        geometry: { type: "Point", coordinates: item.point },
      };
    });
  }

  function utilityResilienceContextNodeGuideFeatures(center, lens, maxDistance, existingNodes = []) {
    if (lens.id !== "utilities-resilience") return [];
    const targetByType = {
      electricity: 11,
      water: 15,
      telecoms: 10,
      gas: 7,
      drainage: 13,
      district_energy: 5,
    };
    const candidates = [];
    const contextMaxDistance = maxDistance * 1.08;
    for (const feature of state.utilityNetworkFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "utility_network" || !feature.geometry) continue;
      const type = String(props.utility_type || "");
      if (!targetByType[type]) continue;
      const networkGeometry = String(props.network_geometry || "");
      const rank = Number(props.rank || 1);
      const assetPriority = Number(props.asset_priority || 0);
      if (type === "electricity" && networkGeometry === "asset" && assetPriority < 2) continue;
      const sampleCount = networkGeometry === "asset" ? 1
        : type === "water" || type === "drainage" ? 3
          : 2;
      for (const point of geometryCoordinateSamples(feature.geometry, sampleCount)) {
        const distance = lngLatDistanceMeters(center, point);
        if (!Number.isFinite(distance) || distance > contextMaxDistance) continue;
        const proximity = 1 - Math.min(distance, contextMaxDistance) / contextMaxDistance;
        const intensity = clamp01(Number(props.intensity || 0.45) + Math.min(0.12, assetPriority * 0.03));
        const score = proximity * 0.42
          + intensity * 0.32
          + Math.min(0.18, rank * 0.036)
          + (networkGeometry === "asset" ? 0.18 : 0.06);
        candidates.push({ point, type, props, distance, intensity, sourceKind: "utility_network", score });
        const role = String(props.network_role || "").toLowerCase();
        if (type === "water" && /ditch|drain|stream|river|canal|culvert/.test(role)) {
          candidates.push({
            point,
            type: "drainage",
            props,
            distance,
            intensity: clamp01(intensity * 0.96),
            sourceKind: "utility_network",
            score: score + 0.1,
          });
        }
      }
    }

    const routeFeatures = utilityNetworkStreetFeatures(center, lens)
      .filter((feature) => {
        const props = feature.properties || {};
        return ["utility_primary", "utility_backup", "utility_inferred"].includes(props.flow_style)
          && targetByType[props.utility_type || ""];
      })
      .sort((a, b) => Number(b.properties?.score || 0) - Number(a.properties?.score || 0))
      .slice(0, 660);
    for (const route of routeFeatures) {
      const props = route.properties || {};
      const type = String(props.utility_type || "");
      const intensity = Number(props.intensity || 0.45);
      if (intensity < (props.flow_style === "utility_inferred" ? 0.36 : 0.3)) continue;
      const sampleCount = props.flow_style === "utility_primary" ? 2 : 1;
      for (const point of geometryCoordinateSamples(route.geometry, sampleCount)) {
        const distance = lngLatDistanceMeters(center, point);
        if (!Number.isFinite(distance) || distance > maxDistance) continue;
        const proximity = 1 - Math.min(distance, maxDistance) / maxDistance;
        const routeBoost = props.flow_style === "utility_primary" ? 0.18
          : props.flow_style === "utility_backup" ? 0.1
            : 0.04;
        const scarceBoost = type === "gas" ? 0.12
          : type === "district_energy" ? 0.16
            : type === "drainage" ? 0.1
              : 0;
        candidates.push({
          point,
          type,
          props,
          distance,
          intensity: clamp01(intensity + routeBoost * 0.2),
          sourceKind: "derived_resilience_route",
          score: proximity * 0.34 + intensity * 0.42 + Number(props.score || 0) * 0.16 + routeBoost + scarceBoost,
        });
      }
    }

    const existingPoints = existingNodes
      .map((feature) => geometryToLngLat(feature.geometry))
      .filter(Boolean);
    const selected = [];
    const counts = {};
    const bucketCounts = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      const count = counts[item.type] || 0;
      if (count >= targetByType[item.type]) continue;
      const bucket = `${item.type}:${transportAngleBucket(center, item.point, 38)}:${Math.floor(item.distance / 460)}`;
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= 2) continue;
      const minSpacing = item.sourceKind === "utility_network" ? 112 : 152;
      if (existingPoints.some((point) => lngLatDistanceMeters(point, item.point) < 66)) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacing)) continue;
      selected.push(item);
      existingPoints.push(item.point);
      counts[item.type] = count + 1;
      bucketCounts.set(bucket, bucketCount + 1);
    }

    return selected.map((item, index) => {
      const props = item.props || {};
      const inferred = item.sourceKind === "derived_resilience_route";
      const title = props.title || (inferred ? `${utilityTypeLabel(item.type)} resilience route` : `${utilityTypeLabel(item.type)} utility context`);
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "utility_trace",
          detail_layer: inferred ? "utility_resilience_route" : "utility_network_context",
          utility_type: item.type,
          event_id: props.event_id || "",
          source_id: props.source_id || props.id || "",
          confidence: props.confidence || (inferred ? "inferred" : ""),
          title,
          label: truncate(title, 28),
          label_detail: inferred ? "Derived route node" : "OSM utility context",
          label_rank: index + 1,
          intensity: Number(item.intensity.toFixed(2)),
          color: utilityTypeColor(item.type, "#8c7460"),
        },
        geometry: { type: "Point", coordinates: item.point },
      };
    });
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
    const limit = lens.id === "utilities-capacity" ? 160
      : lens.id === "utilities-resilience" ? 98
        : lens.id === "utilities-works" ? 36 : 56;
    const minSpacingM = lens.id === "utilities-capacity" ? 42 : lens.id === "utilities-works" ? 132 : 62;
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
      const worksStatus = lens.id === "utilities-works"
        ? utilityWorksStatusKey(null, item.props, utilityType)
        : "";
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          node_style: "utility_trace",
          detail_layer: "utility_trace",
          utility_type: utilityType,
          sublayer_id: worksStatus,
          works_status: worksStatus,
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
    if (lens.id === "transport-access") {
      const stopNodes = transportAccessStopNodeGuideFeatures(center, lens);
      if (stopNodes.length) return stopNodes;
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
    const limit = lens.id === "transport-reliability" ? 58 : 46;
    const minSpacingM = lens.id === "transport-reliability" ? 188 : 220;
    const bucketCounts = new Map();
    const selected = transportRouteStopNodeItems(center, lens, routes, maxDistance);
    for (const item of selected) {
      const bucket = transportAngleBucket(center, item.point, 36);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    }
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
        if (bucketCount >= (lens.id === "transport-speed" ? 3 : 6)) continue;
        const tooClose = selected.some((item) => lngLatDistanceMeters(item.point, point) < minSpacingM);
        if (tooClose) continue;
        selected.push({
          point,
          props,
          distance,
          nodeStyle: lens.id === "transport-reliability" ? "transport" : "transport_route",
          nodeIcon: "transfer",
          color: props.color || "#1b7a85",
          intensity: Number(Math.max(0.34, Number(props.intensity || 0.45)).toFixed(2)),
          title: props.corridor_key ? `${titleCase(String(props.corridor_key))} route node` : "Route transfer node",
          labelDetail: props.source_kind === "corridor_trace" ? "Observed road trace" : "Mapped route trace",
          sourceId: props.source_id || "",
        });
        bucketCounts.set(bucket, bucketCount + 1);
      }
    }
    return selected.map((item) => ({
      type: "Feature",
      properties: {
        kind: "node",
        lens_id: lens.id,
        node_style: item.nodeStyle || (lens.id === "transport-reliability" ? "transport" : "transport_route"),
        node_icon: item.nodeIcon || "transfer",
        source_id: item.sourceId || item.props.source_id || "",
        corridor_key: item.props.corridor_key || "",
        intensity: Number(Math.max(0.34, Number(item.intensity || item.props.intensity || 0.45)).toFixed(2)),
        color: item.color || item.props.color || "#1b7a85",
        title: item.title || "",
        label: item.label || "",
        label_detail: item.labelDetail || "",
        event_id: "",
      },
      geometry: { type: "Point", coordinates: item.point },
    }));
  }

  function transportRouteStopNodeItems(center, lens, routes, maxDistance) {
    const stops = civicAccessTransportStopsNear(center, maxDistance * 0.98);
    if (!stops.length || !routes.length) return [];
    const radiusM = Number(lens.radiusM || 800);
    const routePool = routes.slice(0, lens.id === "transport-speed" ? 220 : 160);
    const candidates = [];
    for (const stop of stops) {
      let nearest = null;
      for (const route of routePool) {
        const distanceToRoute = geometryDistanceToPointMeters(route.geometry, stop.point, 5);
        if (!Number.isFinite(distanceToRoute)) continue;
        if (!nearest || distanceToRoute < nearest.distanceToRoute) {
          nearest = { route, distanceToRoute };
        }
      }
      const props = stop.props || {};
      const lineCount = Number(props.servingLineCount || props.routeNode || 0);
      const routeNode = Number(props.routeNode || 0);
      const routeThreshold = lineCount >= 12 || routeNode > 0 ? 220 : 135;
      if ((!nearest || nearest.distanceToRoute > routeThreshold) && stop.distance > radiusM * 1.55) continue;
      const routeProps = nearest?.route?.properties || {};
      const mode = String(props.mode || props.sourceFamilies || "").toLowerCase();
      const routeColor = routeProps.color || (mode.includes("rail") ? "#75418d" : "#148f63");
      const transferLike = routeNode > 0 || lineCount >= 8 || nearest?.distanceToRoute <= 55;
      const proximity = 1 - Math.min(stop.distance, maxDistance) / Math.max(1, maxDistance);
      const routeAffinity = nearest ? 1 - Math.min(nearest.distanceToRoute, routeThreshold) / Math.max(1, routeThreshold) : 0;
      const score = stop.score
        + routeAffinity * 0.28
        + Math.min(0.18, lineCount / 42)
        + Math.min(0.14, Number(routeProps.rank || 1) * 0.028)
        + proximity * 0.12
        + stableUnit(props.source_id || props.name || "") * 0.025;
      candidates.push({
        point: stop.point,
        props: routeProps,
        distance: stop.distance,
        score,
        nodeStyle: transferLike ? "transport_route" : "transport",
        nodeIcon: transferLike ? "transfer" : "stop",
        color: routeColor,
        intensity: clamp01(0.34 + Number(stop.weight || 0.35) * 0.38 + routeAffinity * 0.18 + Math.min(0.12, lineCount / 38)),
        title: props.name || "Transport stop",
        label: truncate(props.name || "Stop", 24),
        labelDetail: lineCount ? `${lineCount} lines` : "Translink stop",
        sourceId: props.source_id || "",
      });
    }
    const limit = lens.id === "transport-speed" ? 22 : 26;
    const minSpacingM = lens.id === "transport-speed" ? 280 : 245;
    const selected = [];
    const bucketCounts = new Map();
    for (const item of candidates.sort((a, b) => b.score - a.score)) {
      if (selected.length >= limit) break;
      const bucket = transportAngleBucket(center, item.point, 38);
      const bucketCount = bucketCounts.get(bucket) || 0;
      if (bucketCount >= (lens.id === "transport-speed" ? 2 : 2)) continue;
      if (selected.some((existing) => lngLatDistanceMeters(existing.point, item.point) < minSpacingM)) continue;
      selected.push(item);
      bucketCounts.set(bucket, bucketCount + 1);
    }
    return selected;
  }

  function transportAccessStopNodeGuideFeatures(center, lens) {
    const radiusM = Number(lens.radiusM || 800);
    const maxDistance = radiusM * 2.75;
    const stops = civicAccessTransportStopsNear(center, maxDistance);
    if (!stops.length) return [];
    const selected = [];
    const buckets = new Map();
    const minSpacingM = 235;
    for (const stop of stops) {
      if (selected.length >= 44) break;
      const bucket = transportAngleBucket(center, stop.point, 44);
      const bucketCount = buckets.get(bucket) || 0;
      if (bucketCount >= 3) continue;
      if (selected.some((item) => lngLatDistanceMeters(item.point, stop.point) < minSpacingM)) continue;
      selected.push(stop);
      buckets.set(bucket, bucketCount + 1);
    }
    return selected.map((stop) => {
      const props = stop.props || {};
      const lineCount = Number(props.servingLineCount || props.routeNode || 0);
      const mode = String(props.mode || props.sourceFamilies || "").toLowerCase();
      const color = mode.includes("rail")
        ? "#8762a7"
        : lineCount >= 48 || Number(props.routeNode || 0) > 0
          ? "#176f92"
          : lineCount >= 12
            ? "#1f8fa3"
            : "#5aaeb5";
      return {
        type: "Feature",
        properties: {
          kind: "node",
          lens_id: lens.id,
          layer_id: "transport_stops",
          sublayer_id: "transport_stops",
          node_style: "transport",
          node_icon: "stop",
          source_id: props.source_id || "",
          title: props.name || "Transport stop",
          label: truncate(props.name || "Stop", 24),
          label_detail: lineCount ? `${lineCount} lines` : "Translink stop",
          source_name: props.sourceName || "Translink Bus Stop List",
          source_updated: props.sourceUpdated || "",
          intensity: Number(Math.max(0.38, stop.weight).toFixed(2)),
          color,
          event_id: "",
        },
        geometry: { type: "Point", coordinates: stop.point },
      };
    });
  }

  function civicAccessStopNodeGuideFeatures(center, lens, maxDistance) {
    const stops = civicAccessTransportStopsNear(center, maxDistance * 1.08);
    if (!stops.length) return [];
    const selected = [];
    const buckets = new Map();
    const minSpacingM = 210;
    for (const stop of stops) {
      if (selected.length >= 30) break;
      const bucket = transportAngleBucket(center, stop.point, 36);
      const bucketCount = buckets.get(bucket) || 0;
      if (bucketCount >= 2) continue;
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
          sublayer_id: "coverage",
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
      if (props.coverage_status === "no_same_category_records") continue;
      if (lens.id === "civic-access-gaps" && civicAccessAdministrativeServiceRecord(null, props)) continue;
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
            : lens.id === "civic-access-gaps"
              ? civicServiceSublayerKey(item.props)
              : lens.id === "civic-demand"
              ? civicServiceSublayerKey(item.props)
              : "";
        return {
          type: "Feature",
          properties: {
            kind: "node",
            lens_id: lens.id,
            node_style: lens.id.startsWith("utilities-") ? "utility_trace" : lens.id === "planning-pressure" ? "planning_document" : ["civic-access-gaps", "civic-demand"].includes(lens.id) ? "civic_anchor" : "detail",
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
            layer_id: ["civic-access-gaps", "civic-demand"].includes(lens.id) ? "facilities" : "",
            sublayer_id: sublayerId,
            intensity: Number(item.intensity.toFixed(2)),
            color: lens.id === "economy-gravity" && sublayerId
              ? economyGravitySectorColor(sublayerId)
              : lens.id === "planning-pressure" && sublayerId
                ? planningDriverColor(sublayerId)
                : lens.id === "civic-access-gaps" && sublayerId
                  ? civicServiceSublayerColor(sublayerId)
                  : lens.id === "civic-demand" && sublayerId
                    ? civicServiceSublayerColor(sublayerId)
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
    if (lensId === "utilities-capacity") return 1.22;
    if (lensId === "utilities-resilience") return 1.1;
    return 1;
  }

  function detailNodeLimit(lensId) {
    if (lensId === "planning-pressure") return 86;
    if (lensId === "civic-access-gaps") return 18;
    if (lensId === "civic-catchment" || lensId === "civic-demand") return 18;
    if (lensId === "economy-gravity") return 18;
    if (lensId === "utilities-capacity") return 34;
    if (lensId.startsWith("utilities-")) return 16;
    return 12;
  }

  function distributedDetailNodeCandidates(center, candidates, lens) {
    const buckets = new Map();
    const bucketCount = lens.id === "planning-pressure" ? 42 : lens.id === "civic-access-gaps" ? 20 : 16;
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
      const weight = Math.max(0.08, 1 - distance / maxDistance)
        * Math.max(0.24, confidenceRank(event.confidence) / 4)
        * Math.max(0.2, Number(event.demandWeight || 1));
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
      if (intensity > 0.72) return "#cf3d4d";
      if (intensity > 0.54) return "#ed7c62";
      if (intensity > 0.38) return "#efc06d";
      if (intensity > 0.24) return "#8fbfba";
      return "#55a39d";
    }
    if (lensId === "civic-catchment") {
      if (intensity > 0.78) return "#79bbb4";
      if (intensity > 0.59) return "#adc7b5";
      if (intensity > 0.43) return "#ddd19c";
      if (intensity > 0.3) return "#e8bd90";
      return "#d99884";
    }
    if (lensId === "economy-land-use") {
      if (nearestEvent) return economyLandUseColor(nearestEvent);
      const palette = ["#ca3b32", "#df8884", "#158c97", "#7b3a8f", "#f0b342", "#8a8f8a"];
      return palette[Math.abs(Math.floor((angle + Math.PI) * 3 + intensity * 6)) % palette.length];
    }
    return intensity > 0.5 ? "#d6a33e" : "#6daeb5";
  }

  function economyLandUseColor(event) {
    return economyLandUseCategory(event).color;
  }

  function economyLandUseCategories() {
    return [
      { id: "active_retail", label: "Active retail", color: "#ca3b32", positive: true },
      { id: "vacant_low", label: "Vacant / low activity", color: "#df8884", positive: false },
      { id: "office_business", label: "Office / business", color: "#158c97", positive: true },
      { id: "hospitality_leisure", label: "Hospitality / leisure", color: "#7b3a8f", positive: true },
      { id: "residential_conversion", label: "Residential conversion", color: "#f0b342", positive: true },
      { id: "construction_spillover", label: "Construction spillover", color: "#8a8f8a", positive: true },
      { id: "visitor_culture", label: "Visitor / culture", color: "#d9a33a", positive: true },
      { id: "other_mixed", label: "Other / mixed use", color: "#f6e4c2", positive: true },
    ];
  }

  function economyLandUseCategory(source = {}) {
    const props = source?.properties || source || {};
    const text = [
      props.sector,
      props.status,
      props.activity_status,
      props.kind,
      props.building,
      props.amenity,
      props.shop,
      props.tourism,
      props.office,
      props.landuse,
      props.title,
      props.label,
      props.shortDescription,
      props.summary,
      props.area,
      ...(props.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    const categories = economyLandUseCategories();
    const byId = new Map(categories.map((item) => [item.id, item]));
    if (/vacan|empty|derelict|low activity|closed|closure/.test(text)) return byId.get("vacant_low");
    if (/hotel|hospitality|restaurant|cafe|caf\u00e9|bar|pub|leisure|food|drink/.test(text)) return byId.get("hospitality_leisure");
    if (/visitor|culture|tourism|museum|gallery|theatre|cinema|venue/.test(text)) return byId.get("visitor_culture");
    if (/residential|apartment|student|hmo|dwelling|housing|living/.test(text)) return byId.get("residential_conversion");
    if (/construction|works|yard|depot|extension|redevelopment/.test(text)) return byId.get("construction_spillover");
    if (/office|business|workspace|industrial|factory|manufactur|warehouse|employment/.test(text)) return byId.get("office_business");
    if (/shop|retail|commercial|market|frontage|store|atm|service/.test(text)) return byId.get("active_retail");
    return byId.get("other_mixed");
  }

  function economyLandUseCategoryFromColor(color) {
    const normalized = String(color || "").toLowerCase();
    return economyLandUseCategories().find((item) => item.color.toLowerCase() === normalized)
      || economyLandUseCategories().find((item) => item.id === "other_mixed");
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
      state.areaFilter,
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
    const limit = state.activeLens === "transport" ? 90 : 120;
    if (citywideOverviewActive()) {
      events = stratifiedCityEvents(
        events.filter((event) => event.id === state.selectedEventId || event.confidence !== "inferred" || state.showInferred),
        limit,
      );
      if (state.selectedEvent && state.selectedEvent.category === state.activeLens && events.every((event) => event.id !== state.selectedEvent.id)) {
        events.unshift(state.selectedEvent);
      }
      return events.slice(0, limit);
    }
    const center = state.selectedEvent?.lngLat || currentMapCenter();
    const radiusM = lensEffectiveRadiusM(activeMapLens()) * (state.activeLens === "transport" ? 2.4 : 1.8);
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
      events = events.filter((event) => eventMatchesSearchQuery(event, state.search));
    }
    return events;
  }

  function sourceEventsForLensYear(year, lens = activeMapLens(), category = lens?.category || lens?.layerId || state.activeLens) {
    let events = (state.loadedEvents.get(Number(year) || year) || [])
      .filter((event) => event.lngLat)
      .filter((event) => !category || event.category === category)
      .filter((event) => !lens || eventMatchesActiveLens(event, lens))
      .filter((event) => eventMatchesAreaFilter(event))
      .filter((event) => state.confidenceFilter === "all" || event.confidence === state.confidenceFilter)
      .filter((event) => state.showInferred || event.confidence !== "inferred");
    if (state.search) {
      events = events.filter((event) => eventMatchesSearchQuery(event, state.search));
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

  function builtFootprintBeforeFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], builtFootprintBeforeYear()],
    ];
  }

  function builtFootprintYearFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
    ];
  }

  function builtFootprintBeforeYear() {
    const current = currentTimelineYear();
    if (state.selectedEvent) {
      const selectedBefore = Number(detailEvidenceYears(state.selectedEvent).before);
      if (Number.isFinite(selectedBefore)) return Math.min(current, selectedBefore);
    }
    const requested = Number(state.detailBeforeYear);
    if (Number.isFinite(requested) && requested < current) return requested;
    const previousYears = state.years.filter((year) => year < current);
    return previousYears.filter((year) => year <= current - 2).pop() || previousYears.pop() || current;
  }

  function emptyFeatureCollection() {
    return { type: "FeatureCollection", features: [] };
  }

  function transportBaseRoadFilter() {
    const mode = activeMapLens().id;
    const filter = ["==", ["get", "layer"], "traffic_road_base"];
    if (["transport-speed", "transport-reliability"].includes(mode)) {
      return ["all", filter, [">=", ["to-number", ["get", "rank"], 1], mode === "transport-speed" ? 1.65 : 1.85]];
    }
    return filter;
  }

  function transportRoadFilter() {
    const mode = activeMapLens().id;
    const filter = [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      transportActivityRoadYearExpression(currentTimelineYear()),
    ];
    if (mode === "transport-speed") {
      filter.push([
        "any",
        [">=", ["to-number", ["get", "rank"], 1], 3],
        ["all", [">=", ["to-number", ["get", "rank"], 1], 2], [">=", transportActivityExpression(), 0.18]],
        ["all", [">=", ["to-number", ["get", "rank"], 1], 1.6], [">=", transportActivityExpression(), 0.42]],
        ["all", [">=", ["to-number", ["get", "rank"], 1], 1.25], [">=", transportActivityExpression(), 0.64]],
      ]);
    } else if (mode === "transport-reliability") {
      filter.push([
        "any",
        [">=", ["to-number", ["get", "rank"], 1], 3],
        ["all", [">=", ["to-number", ["get", "rank"], 1], 2], [">=", transportActivityExpression(), 0.38]],
      ]);
    }
    return filter;
  }

  function transportHotspotFilter() {
    const base = [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      transportActivityRoadYearExpression(currentTimelineYear()),
      [">=", transportActivityExpression(), 0.62],
    ];
    if (activeMapLens().id === "transport-speed") {
      base.push([">=", ["to-number", ["get", "rank"], 1], 2]);
    }
    return base;
  }

  function transportActivityExpression() {
    return ["to-number", ["get", "transport_activity"], 0];
  }

  function transportActivityRoadYearExpression(year = currentTimelineYear()) {
    const targetYear = Number(year) || currentTimelineYear();
    return [
      "any",
      ["==", ["to-number", ["get", "year"], -1], targetYear],
      ["<=", ["to-number", ["get", "visible_year"], 9999], targetYear],
    ];
  }

  function transportActivityRoadMatchesYear(props = {}, year = currentTimelineYear()) {
    const targetYear = Number(year) || currentTimelineYear();
    const activityYear = Number(props.year);
    if (Number.isFinite(activityYear) && activityYear === targetYear) return true;
    const visibleYear = Number(props.visible_year);
    return Number.isFinite(visibleYear) && visibleYear <= targetYear;
  }

  function transportRankExpression() {
    return ["min", 2.2, ["max", 0.72, ["to-number", ["get", "rank"], 1]]];
  }

  function transportBaseRoadCasePaint() {
    const mode = activeMapLens().id;
    const rank = transportRankExpression();
    const opacity = mode === "transport-speed" ? [8, 0.018, 12, 0.055, 16, 0.12]
      : mode === "transport-reliability" ? [8, 0.03, 12, 0.08, 16, 0.16]
        : [8, 0.1, 12, 0.24, 16, 0.42];
    return {
      "line-color": "#fffdf7",
      "line-opacity": ["interpolate", ["linear"], ["zoom"], ...opacity],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        8, ["*", rank, mode === "transport-speed" ? 0.18 : mode === "transport-reliability" ? 0.16 : 0.28],
        12, ["*", rank, mode === "transport-speed" ? 0.34 : mode === "transport-reliability" ? 0.33 : 0.54],
        16, ["*", rank, mode === "transport-speed" ? 0.58 : mode === "transport-reliability" ? 0.56 : 0.9],
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
        1, "#b4c4c4",
        2, "#95b3b6",
        3, "#86aeb1",
        4, "#9c9ab3",
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
    const opacity = mode === "transport-speed" ? [8, 0.018, 12, 0.05, 16, 0.12]
      : mode === "transport-reliability" ? [8, 0.03, 12, 0.07, 16, 0.14]
        : [8, 0.12, 12, 0.28, 16, 0.48];
    return {
      "line-color": color,
      "line-opacity": ["interpolate", ["linear"], ["zoom"], ...opacity],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        8, ["*", transportRankExpression(), mode === "transport-speed" ? 0.16 : mode === "transport-reliability" ? 0.11 : 0.2],
        12, ["*", transportRankExpression(), mode === "transport-speed" ? 0.3 : mode === "transport-reliability" ? 0.23 : 0.38],
        16, ["*", transportRankExpression(), mode === "transport-speed" ? 0.52 : mode === "transport-reliability" ? 0.42 : 0.68],
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
        "line-opacity": ["interpolate", ["linear"], activity, 0, 0.16, 0.2, 0.34, 1, 0.58],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.32, ["*", activity, 0.58]], rank],
          13, ["*", ["+", 0.58, ["*", activity, 0.98]], rank],
          16, ["*", ["+", 0.86, ["*", activity, 1.44]], rank],
        ],
        "line-dasharray": [1.35, 1.15],
      };
    }
    if (mode === "transport-reliability") {
      return {
        "line-color": [
          "interpolate", ["linear"], rankRaw,
          1, "#b3bfc0",
          2, "#9db5b7",
          3, "#88aeb1",
          4, "#9a98ad",
        ],
        "line-opacity": ["*", ["interpolate", ["linear"], activity, 0, 0.018, 0.2, 0.04, 1, 0.095], rankVisibility],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.12, ["*", activity, 0.18]], rank],
          13, ["*", ["+", 0.22, ["*", activity, 0.32]], rank],
          16, ["*", ["+", 0.34, ["*", activity, 0.52]], rank],
        ],
        "line-dasharray": [1.8, 1.1],
      };
    }
    if (mode === "transport-speed") {
      return {
        "line-color": [
          "case",
          ["<", rankRaw, 2],
          [
            "interpolate", ["linear"], activity,
            0, "#148f63",
            0.48, "#42a85c",
            0.74, "#ef9f1a",
            1, "#e3422e",
          ],
          [
            "interpolate", ["linear"], activity,
            0, "#148f63",
            0.34, "#42a85c",
            0.58, "#ef9f1a",
            0.82, "#e3422e",
            1, "#b91f32",
          ],
        ],
        "line-opacity": ["*", ["interpolate", ["linear"], activity, 0, 0.028, 0.22, 0.064, 0.52, 0.12, 1, 0.19], rankVisibility],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 0.18, ["*", activity, 0.36]], rank],
          13, ["*", ["+", 0.34, ["*", activity, 0.68]], rank],
          16, ["*", ["+", 0.56, ["*", activity, 1.08]], rank],
        ],
        "line-dasharray": [1, 0.0001],
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

  function cleanAreaFilter(value) {
    return cleanSummary(value).slice(0, 96);
  }

  function normalizeAreaText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function areaSearchTextForEvent(event) {
    const label = event?.area || "";
    return normalizeAreaText([
      label,
      ...areaAliasesForLabel(label),
    ].join(" "));
  }

  function areaAliasesForLabel(label) {
    const text = normalizeAreaText(label);
    const aliases = [];
    if (!text) return aliases;
    if (/\bnyc\b|\bnew york city\b/.test(text)) aliases.push("New York City");
    if (/\bmanhattan\b|\bnew york county\b/.test(text)) aliases.push("Manhattan New York County MN");
    if (/\bbrooklyn\b|\bkings county\b/.test(text)) aliases.push("Brooklyn Kings County BK K");
    if (/\bqueens\b|\bqueens county\b/.test(text)) aliases.push("Queens County Q");
    if (/\bbronx\b|\bthe bronx\b|\bbronx county\b/.test(text)) aliases.push("Bronx County BX X");
    if (/\bstaten island\b|\brichmond county\b/.test(text)) aliases.push("Staten Island Richmond County SI R");
    if (/\bcity centre\b|\bcity center\b|\bbt1\b|\bbt2\b/.test(text)) aliases.push("Belfast city centre BT1 BT2");
    if (/\btitanic quarter\b|\bbt3\b/.test(text)) aliases.push("Titanic Quarter BT3");
    if (/\bqueen s quarter\b|\bqueens quarter\b|\bbt7\b/.test(text)) aliases.push("Queen's Quarter South Belfast BT7");
    if (/\bnorth belfast\b|\bbt14\b|\bbt15\b/.test(text)) aliases.push("North Belfast BT14 BT15");
    if (/\bsouth belfast\b|\bbt7\b|\bbt9\b/.test(text)) aliases.push("South Belfast BT7 BT9");
    if (/\beast belfast\b|\bbt4\b|\bbt5\b|\bbt6\b/.test(text)) aliases.push("East Belfast BT4 BT5 BT6");
    if (/\bwest belfast\b|\bbt11\b|\bbt12\b|\bbt13\b/.test(text)) aliases.push("West Belfast BT11 BT12 BT13");
    return aliases;
  }

  function areaFilterQuery() {
    return normalizeAreaText(state.areaFilter);
  }

  function isWholeCityAreaQuery(query = areaFilterQuery()) {
    if (!query) return false;
    const city = normalizeAreaText(shortCityName(state.city?.display_name || state.cityMeta?.display_name || state.cityId));
    const display = normalizeAreaText(state.city?.display_name || state.cityMeta?.display_name || state.cityId);
    const aliases = {
      belfast: ["belfast"],
      london: ["london", "greater london"],
      nyc: ["nyc", "new york", "new york city"],
    }[state.cityId] || [];
    return query === city || query === display || aliases.includes(query);
  }

  function areaTextMatchesQuery(searchText, query = areaFilterQuery()) {
    if (!query || isWholeCityAreaQuery(query)) return true;
    const text = normalizeAreaText(searchText);
    if (!text) return false;
    return normalizedTextMatchesQuery(text, query);
  }

  function eventMatchesAreaFilter(event) {
    if (!state.areaFilter) return true;
    return areaTextMatchesQuery(event.areaSearchText || areaSearchTextForEvent(event));
  }

  function eventMatchesSearchQuery(event, query) {
    const q = normalizeAreaText(query);
    if (!q) return true;
    const text = normalizeAreaText([
      event?.title,
      event?.area,
      event?.summary,
      event?.subtitle,
      event?.sourceName,
      event?.confidence,
      event?.year,
      event?.areaSearchText || areaSearchTextForEvent(event),
    ].join(" "));
    return normalizedTextMatchesQuery(text, q);
  }

  function eventSearchScore(event, query) {
    const q = normalizeAreaText(query);
    if (!q) return 1;
    const title = normalizeAreaText(event?.title);
    const area = normalizeAreaText([event?.area, event?.areaSearchText || areaSearchTextForEvent(event)].join(" "));
    const summary = normalizeAreaText([event?.summary, event?.subtitle, event?.sourceName, event?.confidence, event?.year].join(" "));
    let score = 0;
    if (normalizedTextMatchesQuery(title, q)) score += title.includes(q) ? 90 : 70;
    if (normalizedTextMatchesQuery(area, q)) score += area.includes(q) ? 45 : 35;
    if (normalizedTextMatchesQuery(summary, q)) score += summary.includes(q) ? 20 : 12;
    if (event?.confidence === "documented") score += 3;
    return score;
  }

  function normalizedTextMatchesQuery(text, query) {
    const normalizedText = normalizeAreaText(text);
    const normalizedQuery = normalizeAreaText(query);
    if (!normalizedQuery) return true;
    const words = normalizedText.split(" ").filter(Boolean);
    const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
    if (!tokens.length) return normalizedText.includes(normalizedQuery);
    return tokens.every((token) => {
      if (/^[a-z]{1,3}\d{1,3}$/i.test(token)) return words.includes(token);
      return normalizedText.includes(token) || words.some((word) => word.startsWith(token));
    });
  }

  function chunkAreaFacetsForFilter(chunk, query = areaFilterQuery()) {
    if (!query || isWholeCityAreaQuery(query)) return null;
    const facets = Array.isArray(chunk?.area_facets) ? chunk.area_facets : [];
    return facets.filter((facet) => areaTextMatchesQuery(facet.search_text || facet.label, query));
  }

  function areaFacetCategoryCount(chunk, category) {
    const facets = chunkAreaFacetsForFilter(chunk);
    if (!facets) return null;
    let total = 0;
    for (const facet of facets) {
      if (state.confidenceFilter !== "all") {
        total += Number(facet.counts_by_category_confidence?.[category]?.[state.confidenceFilter] || 0);
      } else if (!state.showInferred) {
        const byConfidence = facet.counts_by_category_confidence?.[category] || {};
        total += Object.entries(byConfidence)
          .filter(([confidence]) => confidence !== "inferred")
          .reduce((sum, [, count]) => sum + Number(count || 0), 0);
      } else {
        total += Number(facet.counts_by_category?.[category] || 0);
      }
    }
    return total;
  }

  function areaFacetTotalCount(chunk) {
    const facets = chunkAreaFacetsForFilter(chunk);
    if (!facets) return null;
    return LAYERS.reduce((sum, layer) => {
      if (!state.activeLayers.has(layer.id)) return sum;
      return sum + areaFacetCategoryCount(chunk, layer.id);
    }, 0);
  }

  function areaFilterLabel() {
    return cleanAreaFilter(state.areaFilter);
  }

  function ensureAreaFilterTimelineLoaded() {
    if (!state.areaFilter || state.areaFilterTimelineLoading) return false;
    const compareYears = [state.compareBeforeYear, state.compareAfterYear, state.year]
      .map(Number)
      .filter((year) => Number.isFinite(year));
    const targetYears = state.years
      .filter((year) => {
        const chunk = state.chunks.get(year);
        if (!chunk || Array.isArray(chunk.area_facets) || state.loadedEvents.has(year) || state.loadingYears.has(year)) return false;
        return Math.abs(Number(year) - Number(state.year)) <= 2 || compareYears.includes(Number(year));
      })
      .slice(0, 8);
    if (!targetYears.length) return false;
    state.areaFilterTimelineLoading = true;
    Promise.all(targetYears.map((year) => loadYear(year)))
      .catch((error) => console.warn("[atlas] area filter timeline preload failed", error))
      .finally(() => {
        state.areaFilterTimelineLoading = false;
        renderTimeline();
        renderComparePanel();
        syncTopline();
      });
    return true;
  }

  function visibleEventsForYear(year) {
    const arr = state.loadedEvents.get(year) || [];
    return arr.filter((e) => state.activeLayers.has(e.category))
      .filter((e) => eventMatchesActiveLens(e))
      .filter((e) => eventMatchesAreaFilter(e))
      .filter((e) => state.confidenceFilter === "all" || e.confidence === state.confidenceFilter)
      .filter((e) => state.showInferred || e.confidence !== "inferred");
  }

  function activeLensContractRow(lens = activeMapLens()) {
    const slug = lens?.id || state.activeAspect;
    const rows = Array.isArray(state.lensManifest?.lenses) ? state.lensManifest.lenses : [];
    return rows.find((row) => row.slug === slug) || null;
  }

  function activeLensYearCoverageRow(lens = activeMapLens(), year = state.year) {
    const slug = lens?.id || state.activeAspect;
    if (!slug) return null;
    return state.lensYearCoverageByKey.get(`${slug}:${Number(year)}`) || null;
  }

  function activeTransportLensYearMissing(year = state.year, lens = activeMapLens()) {
    const category = lens?.category || lens?.layerId || state.activeLens;
    if (category !== "transport") return false;
    const row = activeLensYearCoverageRow(lens, year);
    if (!row) return false;
    return row?.status === "missing_source_backed_view" || Number(row?.event_count || 0) <= 0;
  }

  function lensYearCoverageIsContext(row) {
    return false;
  }

  function lensYearCoverageNote(row = activeLensYearCoverageRow(), lens = activeMapLens(), category = lens?.category || lens?.layerId || state.activeLens) {
    if (!row) return "";
    if (row.status === "missing_source_backed_view" || Number(row.event_count || 0) <= 0) {
      const label = lens?.label || row.public_label || String(category || "lens").replace(/_/g, " ");
      return `No source-backed ${label} records match ${row.year}. No coverage surface or filler geometry is generated for this lens/year.`;
    }
    const count = Number(row.compatible_event_count || row.event_count || 0);
    return `${compactNumber(count)} source-backed ${lens?.label || "lens"} record${count === 1 ? "" : "s"} match ${row.year}; confidence, limitations, sources, licences, and transform notes are in the evidence panel and exports.`;
  }

  function compactLensYearCoverageNote(row = activeLensYearCoverageRow(), lens = activeMapLens(), category = lens?.category || lens?.layerId || state.activeLens) {
    if (row?.status === "missing_source_backed_view" || Number(row?.event_count || 0) <= 0) {
      const label = lens?.label || row?.public_label || String(category || "lens").replace(/_/g, " ");
      return `No ${row?.year || state.year} ${label} records; no filler geometry.`;
    }
    return "";
  }

  function eventMatchesActiveLens(event, lens = activeMapLens()) {
    if (!event || !lens) return false;
    const group = lensGroup(lens);
    if (!group) return event.category === (lens.category || lens.layerId || state.activeLens);
    if (event.category === LENS_CATEGORY_BY_GROUP[group]) return true;
    const eventLens = String(event.lens || "").toLowerCase();
    if (LENS_GROUP_SIGNALS[group]?.has(eventLens)) return true;
    const signals = Array.isArray(event.affectedSignals) ? event.affectedSignals : [];
    if (signals.some((signal) => LENS_GROUP_SIGNALS[group]?.has(String(signal).toLowerCase()))) return true;
    const haystack = [
      event.category,
      event.lens,
      event.title,
      event.shortDescription,
      event.summary,
      sourceTextForEvent(event),
    ].filter(Boolean).join(" ");
    return Boolean(LENS_GROUP_PATTERNS[group]?.test(haystack));
  }

  function lensGroup(lens = activeMapLens()) {
    const contract = activeLensContractRow(lens);
    return contract?.group || LENS_GROUP_BY_CATEGORY[lens?.category || lens?.layerId || state.activeLens] || "";
  }

  function sourceTextForEvent(event) {
    return (event.sourceIds || [])
      .map((sourceId) => {
        const source = state.sourceById.get(sourceId);
        return [
          sourceId,
          source?.source_family,
          source?.title,
          source?.provider,
          source?.provenance_notes,
        ].filter(Boolean).join(" ");
      })
      .join(" ");
  }

  function filteredEvents() {
    let events = visibleEventsForYear(state.year);
    if (state.search) {
      events = events.filter((event) => eventMatchesSearchQuery(event, state.search));
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
    renderAreaFilterOptions();
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
      const count = lens.id === "civic-access-gaps"
        ? civicAccessAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : lens.id === "economy-gravity"
        ? economyGravityAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : lens.id === "civic-catchment"
        ? civicCatchmentAspectLayerCount(l, lens, categoryCount(l.id, state.year))
        : lens.id === "planning-parcels"
        ? planningParcelsAspectLayerCount(l, lens, categoryCount(l.id, state.year))
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

    const countableLayers = lens.id === "planning-parcels" ? layers.filter((l) => !l.categoryToggle) : layers;
    const onCount = countableLayers.filter((l) => l.categoryToggle ? state.activeLayers.has(l.id) : state.activeAspectLayers.has(l.id)).length;
    setText(els.layersCount, `${onCount}/${countableLayers.length} on`);
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
    if (els.activeLensIcon && lens.category === "transport") {
      els.activeLensIcon.innerHTML = `
        <svg class="active-lens-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="5" y="4" width="14" height="13" rx="3"></rect>
          <path d="M8 8h8M8 12h8M8 17v2M16 17v2"></path>
          <circle cx="8.5" cy="15" r="1"></circle>
          <circle cx="15.5" cy="15" r="1"></circle>
        </svg>
      `;
    } else {
      setText(els.activeLensIcon, lens.badge || lens.shortLabel?.slice(0, 1) || "");
    }
    setText(els.activeLensDomain, lens.domain || LAYER_BY_ID.get(lens.category)?.label || "Map lens");
    setText(els.activeLensTitle, lens.label || "");
    if (els.activeLensDescription) {
      const title = lens.title && lens.title !== lens.label ? `<strong>${escapeHtml(lens.title)}</strong>` : "";
      const description = lens.description || lens.summary || "";
      const missingCoverage = activeLensMissingSameCategoryCoverage(lens)
        ? `<small class="active-lens-warning">${escapeHtml(compactMissingSameCategoryCoverageNote(lens))}</small>`
        : "";
      els.activeLensDescription.innerHTML = `${title}${description ? `<span>${escapeHtml(description)}</span>` : ""}${missingCoverage}`;
    }
    renderMapStudyChip(lens);
  }

  function renderMapStudyChip(lens = activeMapLens()) {
    if (!els.mapStudyChip || !els.mapStudyChipText || !lens) return;
    const citywide = citywideOverviewActive();
    const showChip = citywide || Boolean(state.selectedEvent?.lngLat);
    els.mapStudyChip.hidden = !showChip;
    els.mapStudyChip.dataset.scope = citywide ? "city" : "study";
    if (!showChip) return;
    els.mapStudyChip.style.setProperty("--lens-accent", lens.accent || LAYER_BY_ID.get(lens.category || lens.layerId)?.color || "#1b7a85");
    const label = citywide
      ? `Citywide extent / ${shortCityName(state.city?.display_name)}`
      : `Study area ${formatRadius(lensEffectiveRadiusM(lens))}`;
    setText(els.mapStudyChipText, label);
  }

  function renderLensSwitcher() {
    if (!els.lensSwitcher) return;
    const active = activeMapLens();
    const groups = LAYERS
      .map((layer) => ({
        layer,
        lenses: LENS_ASPECTS.filter((lens) => lens.category === layer.id),
      }))
      .filter((group) => group.lenses.length);
    els.lensSwitcher.innerHTML = `
      <details class="lens-picker">
        <summary aria-label="Choose map lens">
          <span>
            <b>${escapeHtml(lensDomainLabel(active))}</b>
            <strong>${escapeHtml(active?.label || "Choose lens")}</strong>
          </span>
          <em>${escapeHtml(active?.shortLabel || "")}</em>
        </summary>
        <div class="lens-picker-menu" role="tablist" aria-label="City atlas lenses">
          ${groups.map((group) => `
            <div class="lens-picker-group" style="--group-color:${escapeAttr(group.layer.color)}">
              <div class="lens-picker-group-title">${escapeHtml(group.layer.label)}</div>
              ${group.lenses.map((lens) => {
                const isActive = state.activeAspect === lens.id;
                const layerOn = state.activeLayers.has(lens.category);
                return `
                  <button class="lens-choice" type="button" role="tab" data-aspect="${escapeAttr(lens.id)}" data-active="${isActive}" data-layer-on="${layerOn}" aria-selected="${isActive}" aria-label="${escapeAttr(`${lensDomainLabel(lens)}: ${lens.label}`)}" title="${escapeAttr(`${lensDomainLabel(lens)}: ${lens.label}`)}">
                    <span class="lens-choice-domain">${escapeHtml(lensDomainLabel(lens))}</span>
                    <span class="lens-choice-label">${escapeHtml(lens.label)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          `).join("")}
        </div>
      </details>
    `;
    els.lensSwitcher.querySelectorAll(".lens-choice").forEach((button) => {
      const choose = () => {
        setActiveAspect(button.getAttribute("data-aspect"));
        button.closest("details")?.removeAttribute("open");
      };
      button.addEventListener("click", choose);
      addPressHandler(button, choose);
    });
  }

  function lensDomainLabel(lens) {
    const category = lens?.category || lens?.layerId || "";
    if (category === "built_environment") return "Planning";
    return LAYER_BY_ID.get(category)?.label || lens?.domain || "Lens";
  }

  function renderAspectSwitcher() {
    if (!els.lensAspectSwitcher) return;
    const lens = activeMapLens();
    const contract = activeLensContractRow(lens);
    if (!contract) {
      els.lensAspectSwitcher.innerHTML = `<div class="lens-contract-strip" role="status">15-lens contract metadata unavailable for this city.</div>`;
      return;
    }
    const coverage = contract.coverage || {};
    const freshness = contract.freshness || {};
    const yearContract = coverage.year_contract || {};
    const yearRange = coverage.observed_years
      ? `${coverage.observed_years.start}-${coverage.observed_years.end}`
      : (freshness.source_coverage_period || "date range stated in sources");
    const requiredYears = yearContract.required_years
      ? `${yearContract.required_years.start}-${yearContract.required_years.end}`
      : "2007-2026";
    const visibleYears = Number(yearContract.visible_year_count || 0);
    els.lensAspectSwitcher.innerHTML = `
      <div class="lens-contract-strip" role="status">
        <span><strong>${escapeHtml(compactNumber(coverage.compatible_event_count || coverage.event_count || 0))}</strong> source-backed records</span>
        <span><strong>${escapeHtml(compactNumber(coverage.compatible_source_count || coverage.source_count || 0))}</strong> compatible sources</span>
        <span><strong>${escapeHtml(compactNumber(visibleYears))}</strong> visible years ${escapeHtml(requiredYears)}</span>
        <span>${escapeHtml(yearRange)}</span>
      </div>
    `;
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
    if (lens.id === "economy-gravity") {
      els.lensLegend.innerHTML = renderEconomyGravityLegend(lens, status);
      return;
    }
    if (lens.id === "civic-catchment") {
      els.lensLegend.innerHTML = renderCivicCatchmentLegend(lens, status);
      return;
    }
    if (lens.id === "civic-access-gaps") {
      els.lensLegend.innerHTML = renderCivicAccessGapsLegend(lens, status);
      return;
    }
    if (lens.id === "transport-speed") {
      els.lensLegend.innerHTML = renderTransportSpeedLegend(lens, status);
      return;
    }
    if (lens.id === "transport-reliability") {
      els.lensLegend.innerHTML = renderTransportReliabilityLegend(lens, status);
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
      ${renderLensLegendNote(status, lens)}
    `;
  }

  function renderLensLegendNote(status = {}, lens = activeMapLens(), fallback = "") {
    const note = status.note || fallback || lens?.caveat || "";
    if (!note) return "";
    return `<div class="lens-legend-note" data-empty="${Boolean(status.empty)}">${escapeHtml(note)}</div>`;
  }

  function renderTransportSpeedLegend(lens, status) {
    return `
      <div class="transport-legend-card transport-speed-legend-card">
        <div class="transport-legend-title">
          <strong>Flow-proxy legend</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        <div class="transport-legend-section">
          <div class="transport-legend-items">
            <div class="transport-line-row"><i class="solid" style="--line-color:#2d9f57"></i><span>Free-flow proxy</span></div>
            <div class="transport-line-row"><i class="solid" style="--line-color:#6dbc5a"></i><span>Lower delay proxy</span></div>
            <div class="transport-line-row"><i class="solid" style="--line-color:#f2ad2f"></i><span>Moderate flow proxy</span></div>
            <div class="transport-line-row"><i class="solid" style="--line-color:#e95a35"></i><span>High delay proxy</span></div>
            <div class="transport-line-row"><i class="solid" style="--line-color:#bb1e2d"></i><span>Severe delay proxy</span></div>
          </div>
        </div>
        <div class="transport-legend-section transport-line-state-section">
          <div class="transport-line-row"><i class="before"></i><span>Before context</span></div>
          <div class="transport-line-row"><i class="current"></i><span>Context index</span></div>
          <div class="transport-line-row"><i class="uncertain"></i><span>Uncertain / partial</span></div>
        </div>
        <div class="transport-transfer-row"><i></i><span>Transfer node</span></div>
        ${renderLensLegendNote(status, lens, "Flow-proxy colors are derived from activity records and mapped context, not km/h, live congestion, or measured speed.")}
      </div>
    `;
  }

  function renderTransportReliabilityLegend(lens, status) {
    return `
      <div class="transport-legend-card transport-reliability-legend-card">
        <div class="transport-legend-title">
          <strong>Service-signal legend</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        <div class="transport-legend-section">
          <div class="transport-legend-items">
            <div class="transport-line-row"><i class="solid" style="--line-color:#168a94"></i><span>Lower disruption signal</span></div>
            <div class="transport-line-row"><i class="delayed" style="--line-color:#ef9c1a"></i><span>Higher delay signal</span></div>
            <div class="transport-line-row"><i class="interrupted" style="--line-color:#ed3f2b"></i><span>Interrupted</span></div>
            <div class="transport-line-row"><i class="planned" style="--line-color:#7a3b97"></i><span>Planned / record</span></div>
            <div class="transport-line-row"><i class="inferred" style="--line-color:#898b8e"></i><span>Inferred / uncertain</span></div>
          </div>
        </div>
        <div class="transport-transfer-row"><i></i><span>Transfer node</span></div>
        <div class="transport-frequency">
          <span>Relative service signal</span>
          <div class="transport-frequency-bars" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i>
          </div>
          <div class="transport-frequency-labels"><span>Low</span><span>Med</span><span>High</span></div>
        </div>
        ${renderLensLegendNote(status, lens, "Transport service data may be partial or delayed; planned lines are not delivered service.")}
      </div>
    `;
  }

  function renderCivicAccessGapsLegend(lens, status) {
    return `
      <div class="access-gap-legend-card">
        <div class="lens-legend-head access-gap-title">
          <strong>Low-coverage guide seams</strong>
        </div>
        <div class="lens-legend-summary">Street segments with low service density or longer mapped access-proxy paths to essential services.</div>
        <div class="access-gap-section">
          <span>Gap seams</span>
          <div class="lens-legend-items">
            <div class="lens-legend-item"><span class="lens-symbol line" style="--legend-color:#ed4a2e"></span><span>High low-coverage signal</span></div>
            <div class="lens-legend-item"><span class="lens-symbol outline" style="--legend-color:#ef8f21"></span><span>Medium gap</span></div>
            <div class="lens-legend-item"><span class="lens-symbol outline" style="--legend-color:#e4b33c"></span><span>Low gap</span></div>
            <div class="lens-legend-item"><span class="lens-symbol outline" style="--legend-color:#348f67"></span><span>Adequate access</span></div>
          </div>
        </div>
        <div class="access-gap-section">
          <span>Coverage (current)</span>
          <div class="lens-legend-items">
            <div class="lens-legend-item"><span class="lens-symbol line solid" style="--legend-color:#0f7f86"></span><span>Walk-proxy link</span></div>
            <div class="lens-legend-item"><span class="lens-symbol line solid" style="--legend-color:#5aaeb5"></span><span>Bus-proxy link</span></div>
            <div class="lens-legend-item"><span class="lens-symbol line solid" style="--legend-color:#a8cfd1"></span><span>Longer access-proxy link</span></div>
          </div>
        </div>
        <div class="access-gap-section">
          <span>Other</span>
          <div class="lens-legend-items">
            <div class="lens-legend-item"><span class="lens-symbol outline" style="--legend-color:#0f8d95"></span><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
            <div class="lens-legend-item"><span class="lens-symbol outline muted" style="--legend-color:#9a9a92"></span><span>Rail line</span></div>
          </div>
        </div>
        ${renderLensLegendNote(status, lens, "Access-proxy linework is mapped context only, not measured travel time or service capacity.")}
      </div>
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
        ${renderLensLegendNote(status, lens, "Not a forecast. Pressure fields combine source-backed records and mapped context; causation is not claimed.")}
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

  function renderEconomyGravityLegend(lens, status) {
    const sectorRows = lens.layers.map((layer) => `
      <div class="gravity-sector-row">
        <i style="--gravity-color:${escapeAttr(layer.color)}"></i>
        <span>${escapeHtml(layer.label)}</span>
      </div>
    `).join("");
    return `
      <div class="gravity-legend-card">
        <div class="gravity-legend-title">
          <strong>Flows (current)</strong>
        </div>
        <div class="gravity-legend-section">
          <span>Band = flow strength</span>
          <small>Opacity = confidence</small>
          <div class="gravity-band-scale" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
          <div class="gravity-scale-labels"><span>Low</span><span>High</span></div>
        </div>
        <div class="gravity-legend-section">
          <span>Sectors</span>
          <div class="gravity-sector-list">${sectorRows}</div>
        </div>
        <div class="gravity-legend-section">
          <span>Confidence</span>
          <div class="gravity-confidence-row observed"><i></i><b>Observed</b></div>
          <div class="gravity-confidence-row inferred"><i></i><b>Inferred</b></div>
          <div class="gravity-confidence-row low"><i></i><b>Low confidence</b></div>
        </div>
        <div class="gravity-study-row"><i></i><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
        ${renderLensLegendNote(status, lens, "Flows are descriptive current/context signals; causation is not claimed.")}
      </div>
    `;
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
        ${renderLensLegendNote(status, lens, "Ribbons are descriptive frontage context linked to available evidence; they are not forecasts.")}
      </div>
    `;
  }

  function renderCivicCatchmentLegend(lens, status) {
    const services = lens.layers.map((layer) => `
      <div class="catchment-service-row"><i style="--service:${escapeAttr(layer.color)}"></i><span>${escapeHtml(layer.label)}</span></div>
    `).join("");
    return `
      <div class="catchment-legend-card">
        <div class="vitality-legend-title">
          <strong>Service context guide</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        <div class="vitality-levels">
          <div><i style="--vitality-color:#58a69f"></i><span>Very high context signal</span></div>
          <div><i style="--vitality-color:#a6c7a4"></i><span>High context signal</span></div>
          <div><i style="--vitality-color:#e6d690"></i><span>Medium context signal</span></div>
          <div><i style="--vitality-color:#efb367"></i><span>Low context signal</span></div>
          <div><i style="--vitality-color:#e68c70"></i><span>Very low context signal</span></div>
        </div>
        <div class="vitality-legend-section">
          <strong>Service types</strong>
          ${services}
        </div>
        <div class="pressure-study-line"><i></i><span>Study area (${escapeHtml(formatRadius(lensEffectiveRadiusM(lens)))})</span></div>
        ${renderLensLegendNote(status, lens, "Derived evidence cells; not official service boundaries.")}
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
    if (events) {
      return events
        .filter((event) => event.category === category)
        .filter((event) => eventMatchesAreaFilter(event))
        .length;
    }
    const chunk = state.chunks.get(year);
    const areaCount = areaFacetCategoryCount(chunk, category);
    if (areaCount != null) return areaCount;
    return Number(chunk?.counts_by_category?.[category] || 0);
  }

  function aspectLayerCount(layer, lens = activeMapLens()) {
    const base = categoryCount(lens.category || state.activeLens, state.year);
    const index = Math.max(0, lensLayers(lens).findIndex((item) => item.id === layer.id));
    if (lens.category === "utilities") return utilityAspectLayerCount(layer, lens, base);
    if (lens.id === "civic-access-gaps") return civicAccessAspectLayerCount(layer, lens, base);
    if (lens.id === "economy-gravity") return economyGravityAspectLayerCount(layer, lens, base);
    if (lens.id === "civic-catchment") return civicCatchmentAspectLayerCount(layer, lens, base);
    if (lens.id === "planning-parcels") return planningParcelsAspectLayerCount(layer, lens, base);
    if (!base) return layer.id === "coverage" || layer.id === "boundary" ? "on" : 0;
    if (/boundary|study|change|grid|seams|corridors|network|frontage|resilience|works|capacity/.test(layer.id)) return "on";
    const factor = [1, 0.42, 0.28, 0.18, 0.12, 0.08][Math.min(5, index)] || 0.06;
    return Math.max(1, Math.round(base * factor));
  }

  function planningParcelsAspectLayerCount(layer, _lens, base) {
    const counts = planningParcelsGuideStatusCounts();
    if (counts.total) {
      if (layer.categoryToggle || layer.id === "built_environment") return counts.total;
      return counts.byStatus[layer.id] || 0;
    }
    return layer.categoryToggle ? base : aspectLayerCountFallback(layer, base);
  }

  function planningParcelsGuideStatusCounts() {
    const counts = {
      total: 0,
      byStatus: {
        proposed: 0,
        permitted: 0,
        construction: 0,
        completed: 0,
        demolished: 0,
        unknown: 0,
      },
    };
    const features = state.lensGuideFeatureCache?.features || [];
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.lens_id !== "planning-parcels" || props.surface_style !== "planning_footprint") continue;
      counts.total += 1;
      const status = planningAspectLayerId(props.planning_status || props.sublayer_id || "unknown");
      counts.byStatus[status] = (counts.byStatus[status] || 0) + 1;
    }
    return counts;
  }

  function civicAccessAspectLayerCount(layer, _lens, base) {
    const features = state.lensGuideFeatureCache?.features || [];
    if (features.some((feature) => feature.properties?.lens_id === "civic-access-gaps")) {
      if (layer.categoryToggle || layer.id === "civic_services" || layer.id === "transport_network") {
        return features.filter((feature) => {
          const props = feature.properties || {};
          return props.lens_id === "civic-access-gaps"
            && ((props.kind === "flow" && (props.flow_role === "coverage" || props.flow_role === "access_network")) || props.node_style === "transport");
        }).length;
      }
      if (layer.id === "coverage") {
        const coverageFlows = features.filter((feature) => {
          const props = feature.properties || {};
          return props.lens_id === "civic-access-gaps" && props.kind === "flow" && props.flow_role === "coverage";
        }).length;
        const coverageCells = (state.lensDetailFeatures || [])
          .filter((feature) => feature.properties?.layer === "civic_coverage_cell")
          .length;
        return coverageFlows + coverageCells;
      }
      if (layer.id === "facilities") {
        return features.filter((feature) => {
          const props = feature.properties || {};
          return props.lens_id === "civic-access-gaps" && props.node_style === "civic_anchor";
        }).length;
      }
      if (layer.id === "boundaries") {
        return (state.lensDetailFeatures || [])
          .filter((feature) => feature.properties?.layer === "civic_coverage_cell")
          .length;
      }
      if (layer.id === "gap_seams" || layer.id === "corridors") return "on";
    }
    if (layer.id === "gap_seams" || layer.id === "corridors" || layer.id === "boundaries") return "on";
    return layer.categoryToggle ? base : aspectLayerCountFallback(layer, base);
  }

  function aspectLayerCountFallback(layer, base) {
    const index = Math.max(0, lensLayers(activeMapLens()).findIndex((item) => item.id === layer.id));
    if (!base) return 0;
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
    if (_lens?.id === "civic-catchment" && state.selectedEvent?.lngLat) {
      const sourceEvents = lensEventsForYear(currentTimelineYear())
        .filter((event) => event.category === "civic_services" && event.lngLat);
      const selected = selectCivicCatchmentCandidates(
        state.selectedEvent.lngLat,
        civicCatchmentCandidates(state.selectedEvent.lngLat, Number(_lens.radiusM || 1500), _lens, sourceEvents, currentTimelineYear()),
        _lens,
        54,
      );
      const selectedLayerCount = selected.filter((item) => item.layerId === target).length;
      return selectedLayerCount || (layer.categoryToggle ? base : 0);
    }
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
      const flowCounts = utilityWorksGuideStatusCounts();
      if (flowCounts.total) {
        if (layer.categoryToggle) return flowCounts.total;
        return flowCounts.byStatus[layer.id] || 0;
      }
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
    if (lens.id === "utilities-capacity") {
      const flowCounts = utilityCapacityGuideTypeCounts();
      if (flowCounts.total) return flowCounts.byType[type] || 0;
    }
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

  function utilityCapacityGuideTypeCounts() {
    const counts = { total: 0, byType: {} };
    const features = state.lensGuideFeatureCache?.features || [];
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.lens_id !== "utilities-capacity" || props.kind !== "flow") continue;
      const type = props.utility_type || "";
      counts.total += 1;
      if (type) counts.byType[type] = (counts.byType[type] || 0) + 1;
    }
    return counts;
  }

  function utilityWorksGuideStatusCounts() {
    const counts = { total: 0, byStatus: {} };
    const features = state.lensGuideFeatureCache?.features || [];
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.lens_id !== "utilities-works" || props.flow_style !== "utility_work_thread") continue;
      const status = props.works_status || props.sublayer_id || "";
      counts.total += 1;
      if (status) counts.byStatus[status] = (counts.byStatus[status] || 0) + 1;
    }
    return counts;
  }

  function formatLayerCount(value, categoryToggle) {
    if (value === "on") return "on";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return categoryToggle ? "0" : "off";
    return compactNumber(numeric);
  }

  function lensStatusText(lens) {
    const category = lens.category || lens.layerId || lens.id;
    const yearCoverage = activeLensYearCoverageRow(lens, state.year);
    if (!state.activeLayers.has(category)) {
      return {
        label: "Layer off",
        empty: true,
        note: `${lens.label} is disabled in the layer toggles, so its map lens is hidden.`,
      };
    }
    if (category === "transport") {
      const missingTransportNote = (yearCoverage?.status === "missing_source_backed_view" || Number(yearCoverage?.event_count || 0) <= 0)
        ? lensYearCoverageNote(yearCoverage, lens, category)
        : lens.empty;
      if (!transportRoadYearPath(state.year)) return { label: "No linework", empty: true, note: missingTransportNote };
      if (state.transportRoadFeatureCountYearLoaded === state.year && state.transportRoadFeatureCount === 0) {
        return {
          label: "No linework",
          empty: true,
          note: missingTransportNote || "No source-backed transport records intersect mapped road segments for the selected year. No generated marks, context surfaces, or filler geometry are shown for this lens/year.",
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
      if (!hasFootprints && !pointCount && !hasDetailCells) return { label: "No geometry", empty: true, note: missingSameCategoryCoverageNote(lens, category) };
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
            : missingSameCategoryCoverageNote(lens, category),
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
      if (lens.id === "civic-catchment") {
        const anchorCount = state.civicServiceFeatures.length;
        if (anchorCount && !count) {
          return {
            label: "No records",
            empty: true,
            note: missingSameCategoryCoverageNote(lens, category),
          };
        }
      }
      if (!count) return { label: "No records", empty: true, note: missingSameCategoryCoverageNote(lens, category) };
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
      const evidenceEvents = lensEvidenceEventsForYear(lens, category, state.year);
      const count = evidenceEvents.length;
      const renderableCount = evidenceEvents.filter(isLensDetailEligibleEvent).length;
      if (!count) return { label: "No records", empty: true, note: missingSameCategoryCoverageNote(lens, category) };
      if (!renderableCount) {
        const recordLabel = lens.id === "economy-land-use" ? "Land-use-specific economy records" : "Economy records";
        return { label: "No site geometry", empty: true, note: `${recordLabel} exist for this year, but only aggregate or non-site geometry is available.` };
      }
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
      if (lens.id === "utilities-capacity") {
        const flowCounts = utilityCapacityGuideTypeCounts();
        const contextCount = flowCounts.total || (state.utilityNetworkFeatures || [])
          .filter((feature) => {
            const props = feature.properties || {};
            return props.layer === "utility_network" && ["line", "area", "asset"].includes(props.network_geometry);
          })
          .length;
        if (!count && contextCount) {
          return {
            label: "No records",
            empty: true,
            note: missingSameCategoryCoverageNote(lens, category),
          };
        }
      }
      if (!count) return { label: "No records", empty: true, note: missingSameCategoryCoverageNote(lens, category) };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Utility records exist for this year, but only aggregate or non-site geometry is available." };
      return { label: `Traces + ${renderableCount} assets`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    const count = lensPointCount(category);
    if (!count) return { label: "No records", empty: true, note: missingSameCategoryCoverageNote(lens, category) };
    return { label: `${count} records`, empty: false, note: lens.caveat };
  }

  function missingSameCategoryCoverageNote(lens, category = lens?.category || lens?.layerId || state.activeLens, year = state.year) {
    const row = activeLensYearCoverageRow(lens, year);
    const label = {
      built_environment: "planning/built",
      civic_services: "civic service",
      economy: lens?.id === "economy-land-use" ? "land-use-specific economy" : "economy",
      utilities: "utility",
      transport: "transport",
    }[category] || String(category || "lens").replace(/_/g, " ");
    const prefix = `No source-backed ${label} records match ${year} for this lens.`;
    return `${prefix} No generated marks, context surfaces, or filler geometry are shown for this lens/year.`;
  }

  function compactMissingSameCategoryCoverageNote(lens, category = lens?.category || lens?.layerId || state.activeLens, year = state.year) {
    const row = activeLensYearCoverageRow(lens, year);
    const label = {
      built_environment: "planning/built",
      civic_services: "civic service",
      economy: lens?.id === "economy-land-use" ? "land-use-specific economy" : "economy",
      utilities: "utility",
    }[category] || "lens";
    return `No source-backed ${year} ${label} records; no filler geometry.`;
  }

  function activeLensMissingSameCategoryCoverage(lens = activeMapLens()) {
    return lensMissingSameCategoryCoverageForYear(lens, state.year);
  }

  function lensMissingSameCategoryCoverageForYear(lens = activeMapLens(), year = state.year) {
    if (!lens) return false;
    const category = lens.category || lens.layerId || state.activeLens;
    if (!category || category === "transport") return false;
    return lensEvidenceEventsForYear(lens, category, year).length === 0;
  }

  function lensPointCount(category) {
    return lensPointCountForYear(category, state.year);
  }

  function lensPointCountForYear(category, year = state.year) {
    return lensEventsForYear(Number(year) || state.year).filter((event) => event.category === category).length;
  }

  function lensEvidenceEventsForYear(lens = activeMapLens(), category = lens?.category || lens?.layerId || state.activeLens, year = state.year) {
    const events = lensEventsForYear(Number(year) || state.year).filter((event) => event.category === category);
    if (lens?.id === "economy-land-use") return events.filter((event) => economyLandUseSpecificEvent(event));
    return events;
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
    const lens = activeMapLens();
    const lensStatus = lens ? lensStatusText(lens) : null;
    const missingLensCoverage = activeLensMissingSameCategoryCoverage(lens);
    if (missingLensCoverage) parts.push(lensStatus?.note || missingSameCategoryCoverageNote(lens));
    const summary = state.availability?.summary;
    const status = summary?.status || state.cityMeta?.availability_status;
    if (status) parts.push(`Coverage: ${status.replace(/_/g, " ")}`);
    if (summary?.summary) parts.push(summary.summary);
    if (state.cityId) parts.push("Citywide map bounds are shown; record coverage is source-backed and partial, not a complete history of every change.");
    if (state.availabilityError) parts.push(`Availability metadata unavailable: ${state.availabilityError}`);
    if (state.lensYearCoverageError) parts.push(`Lens-year coverage metadata unavailable: ${state.lensYearCoverageError}`);
    const yearError = state.yearLoadErrors.get(state.year);
    if (yearError) parts.push(`Could not load ${state.year} event chunk: ${yearError}`);
    if (state.detailLayerError) parts.push(`Detail layer unavailable: ${state.detailLayerError}`);
    if (state.lensOverlayError) parts.push(`Map lens unavailable: ${state.lensOverlayError}`);
    els.coverageNote.textContent = parts.join(" ");
    els.coverageNote.toggleAttribute("data-warning", Boolean(state.availabilityError || state.lensYearCoverageError || yearError || state.detailLayerError || state.lensOverlayError));
    els.coverageNote.toggleAttribute("data-lens-warning", Boolean(missingLensCoverage));
  }

  function renderTimeline() {
    if (!els.tlHistogram || !els.tlAxis) return;
    ensureAreaFilterTimelineLoaded();
    const [yStart, yEnd] = state.yearRange;
    const years = [];
    for (let y = yStart; y <= yEnd; y++) years.push(y);

    const lens = activeMapLens();
    const lanes = timelineLanesForLens(lens);
    const laneCounts = lanes.map((lane) => {
      const counts = years.map((year) => timelineLayerCountForYear(lane.layer, lens, year));
      return { ...lane, counts, current: timelineLayerCountForYear(lane.layer, lens, state.year) };
    });
    const maxCount = Math.max(1, ...laneCounts.flatMap((lane) => lane.counts));

    els.tlTrack?.style.setProperty("--tl-year-count", String(Math.max(1, years.length)));
    els.tlTrack?.style.setProperty("--tl-lane-count", String(Math.max(1, laneCounts.length)));
    els.tlTrack?.style.setProperty("--tl-year-step", `${(100 / Math.max(1, years.length)).toFixed(4)}%`);
    els.tlTrack?.style.setProperty("--tl-lane-step", `${(100 / Math.max(1, laneCounts.length)).toFixed(4)}%`);
    els.tlHistogram.innerHTML = `
      <div class="tl-lanes" role="list" aria-label="${escapeAttr(lens?.label || "Active lens")} source density by year">
        ${laneCounts.map((lane, laneIndex) => timelineLaneMarkup(lane, laneIndex, years, maxCount)).join("")}
      </div>
      <div class="tl-density-key" aria-hidden="true">
        <span><i></i> Source tick</span>
        <span>Rows follow the active lens layers${state.areaFilter ? " and area filter" : ""}</span>
      </div>
    `;

    els.tlAxis.innerHTML = `
      <div class="tl-axis-pad" aria-hidden="true"></div>
      <div class="tl-axis-years">
        ${years.map((y) => {
          const major = y % 5 === 0 || y === yStart || y === yEnd;
          return `<div class="tl-axis-tick ${major ? "major" : ""}">${major ? `'${String(y).slice(2)}` : ""}</div>`;
        }).join("")}
      </div>
    `;

    const total = yEnd - yStart;
    const pct = total > 0 ? ((state.year - yStart) / total) * 100 : 0;
    positionTimelineCursor(pct);
    setText(els.tlYear, String(state.year));
    if (els.tlScrub) {
      els.tlScrub.setAttribute("role", "slider");
      els.tlScrub.setAttribute("tabindex", "0");
      els.tlScrub.setAttribute("aria-label", "Evidence timeline year");
      els.tlScrub.setAttribute("aria-valuemin", String(yStart));
      els.tlScrub.setAttribute("aria-valuemax", String(yEnd));
      els.tlScrub.setAttribute("aria-valuenow", String(state.year));
      els.tlScrub.setAttribute("aria-valuetext", `${state.year}, ${filteredEvents().length} visible records`);
    }
  }

  function timelineLanesForLens(lens = activeMapLens()) {
    const layers = lensLayers(lens).filter((layer) => {
      const category = layer.categoryToggle ? layer.id : (lens.category || lens.layerId || state.activeLens);
      if (!state.activeLayers.has(category)) return false;
      return layer.categoryToggle || state.activeAspectLayers.has(layer.id);
    });
    if (layers.length) return layers.slice(0, 7).map((layer) => ({ layer }));
    const category = lens?.category || lens?.layerId || state.activeLens;
    const fallback = LAYER_BY_ID.get(category) || LAYERS[0];
    return [{ layer: { ...fallback, categoryToggle: true } }];
  }

  function timelineLaneMarkup(lane, laneIndex, years, maxCount) {
    const layer = lane.layer;
    const color = layer.color || LAYER_BY_ID.get(layer.id)?.color || "#1B7A85";
    return `
      <div class="tl-lane" role="listitem" style="--lane-color:${escapeAttr(color)}">
        <div class="tl-lane-label" title="${escapeAttr(layer.label)}">
          <span class="tl-lane-swatch" aria-hidden="true"></span>
          <span class="tl-lane-name">${escapeHtml(layer.label)}</span>
          <b>${formatTimelineCount(lane.current, layer.categoryToggle)}</b>
        </div>
        <div class="tl-lane-cells">
          ${years.map((year, yearIndex) => timelineYearCellMarkup({
            count: lane.counts[yearIndex] || 0,
            maxCount,
            laneIndex,
            year,
            yearIndex,
            selected: year === state.year,
            past: year <= state.year,
          })).join("")}
        </div>
      </div>
    `;
  }

  function timelineYearCellMarkup({ count, maxCount, laneIndex, year, yearIndex, selected, past }) {
    const density = Math.sqrt(Math.max(0, count)) / Math.sqrt(Math.max(1, maxCount));
    const tickCount = count > 0 ? Math.max(1, Math.min(10, Math.round(1 + density * 9))) : 0;
    const ticks = [];
    for (let i = 0; i < tickCount; i += 1) {
      const left = timelineTickOffset(year, laneIndex, i, tickCount);
      const height = 5 + Math.round(density * 13) + ((i + laneIndex + yearIndex) % 3);
      const wide = density > 0.72 && i % 3 === 0;
      ticks.push(`<i class="tl-source-tick${wide ? " wide" : ""}" style="left:${left.toFixed(2)}%;height:${height}px"></i>`);
    }
    const label = `${year}: ${compactNumber(count)} source record${Number(count) === 1 ? "" : "s"}`;
    return `<div class="tl-year-cell" data-year="${year}" data-selected="${selected}" data-past="${past}" title="${escapeAttr(label)}">${ticks.join("")}</div>`;
  }

  function timelineTickOffset(year, laneIndex, tickIndex, tickCount) {
    const spread = 78 / Math.max(1, tickCount);
    const base = 11 + spread * (tickIndex + 0.5);
    const jitter = (((year * 17 + laneIndex * 29 + tickIndex * 11) % 13) - 6) * 0.85;
    return Math.max(6, Math.min(94, base + jitter));
  }

  function timelineLayerCountForYear(layer, lens, year) {
    const category = layer.categoryToggle ? layer.id : (lens?.category || lens?.layerId || state.activeLens);
    if (!state.activeLayers.has(category)) return 0;
    if (lens?.id === "utilities-works" && Number(year) === Number(state.year)) {
      const flowCounts = utilityWorksGuideStatusCounts();
      if (flowCounts.total) {
        if (layer.categoryToggle) return flowCounts.total;
        return flowCounts.byStatus[layer.id] || 0;
      }
    }
    if (lens?.id === "planning-parcels" && Number(year) === Number(state.year)) {
      const parcelCounts = planningParcelsGuideStatusCounts();
      if (parcelCounts.total) {
        if (layer.categoryToggle) return parcelCounts.total;
        return parcelCounts.byStatus[layer.id] || 0;
      }
    }
    const categoryTotal = timelineCategoryCount(category, year);
    if (!categoryTotal) return 0;
    if (layer.categoryToggle) return categoryTotal;

    const loadedCount = timelineLoadedSublayerCount(layer, lens, year);
    if (loadedCount > 0) return loadedCount;
    return timelineDerivedSublayerCount(layer, lens, year, categoryTotal);
  }

  function timelineCategoryCount(category, year) {
    const events = state.loadedEvents.get(year);
    if (events) {
      return events
        .filter((event) => event.category === category)
        .filter((event) => eventMatchesAreaFilter(event))
        .filter((event) => state.confidenceFilter === "all" || event.confidence === state.confidenceFilter)
        .filter((event) => state.showInferred || event.confidence !== "inferred")
        .length;
    }
    const chunk = state.chunks.get(year);
    const areaCount = areaFacetCategoryCount(chunk, category);
    if (areaCount != null) return areaCount;
    return Number(chunk?.counts_by_category?.[category] || 0);
  }

  function timelineLoadedSublayerCount(layer, lens, year) {
    const events = state.loadedEvents.get(year);
    if (!events?.length) return 0;
    const category = lens?.category || lens?.layerId || state.activeLens;
    return events
      .filter((event) => event.category === category)
      .filter((event) => eventMatchesAreaFilter(event))
      .filter((event) => state.confidenceFilter === "all" || event.confidence === state.confidenceFilter)
      .filter((event) => state.showInferred || event.confidence !== "inferred")
      .filter((event) => lensLayerForEvent(event, lens).id === layer.id)
      .length;
  }

  function timelineDerivedSublayerCount(layer, lens, year, categoryTotal) {
    const layers = lensLayers(lens).filter((item) => !item.categoryToggle);
    const index = Math.max(0, layers.findIndex((item) => item.id === layer.id));
    const layerHash = [...String(layer.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const yearPulse = 0.86 + (((year + layerHash) % 7) * 0.045);
    const baseShares = [0.42, 0.31, 0.24, 0.18, 0.13, 0.09, 0.06];
    let share = baseShares[Math.min(index, baseShares.length - 1)] || 0.05;
    if (lens?.id === "utilities-works") {
      const statusShares = { planned: 0.36, repair: 0.28, failure: 0.13, permit: 0.16, reinstatement: 0.10 };
      share = statusShares[layer.id] || share;
    } else if (lens?.category === "transport") {
      const transportShares = {
        public_transport: 0.34,
        cycle_network: 0.18,
        rail: 0.13,
        parking: 0.11,
        incidents: 0.08,
        bus_network: 0.32,
        rail_network: 0.14,
        ferry_routes: 0.06,
        stations_stops: 0.18,
        barriers: 0.09,
        scheduled: 0.32,
        disrupted: 0.18,
        planned: 0.14,
        frequency: 0.10,
        corridor: 0.22,
      };
      share = transportShares[layer.id] || share;
    }
    return Math.max(1, Math.round(categoryTotal * share * yearPulse));
  }

  function formatTimelineCount(value, categoryToggle) {
    if (value === "on") return "on";
    const numeric = Number(value) || 0;
    if (!numeric && !categoryToggle) return "off";
    return compactNumber(numeric);
  }

  function positionTimelineCursor(pct) {
    if (!els.tlCursor) return;
    const track = els.tlTrack;
    const trackWidth = track?.clientWidth || 0;
    const labelWidth = parseFloat(getComputedStyle(track || document.documentElement).getPropertyValue("--tl-label-width")) || 152;
    if (trackWidth > labelWidth + 24) {
      const stageStart = labelWidth + 2;
      const stageWidth = Math.max(1, trackWidth - stageStart - 8);
      els.tlCursor.style.left = `${Math.round(stageStart + stageWidth * (pct / 100))}px`;
    } else {
      els.tlCursor.style.left = `calc(${pct}% - 1px)`;
    }
  }

  function detailEvidenceYears(event) {
    const eventYear = Number(event?.year || state.year);
    const atlasYear = state.years.includes(Number(state.year)) ? Number(state.year) : eventYear;
    const requestedAfter = Number(state.detailCurrentYear);
    const after = state.years.includes(requestedAfter)
      ? requestedAfter
      : atlasYear;
    const previousYears = [...state.years].filter((year) => year < eventYear);
    const requested = Number(state.detailBeforeYear);
    const before = previousYears.includes(requested)
      ? requested
      : previousYears.filter((year) => year <= eventYear - 2).pop() || previousYears.pop() || eventYear;
    return { before, after };
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
      .filter((event) => eventMatchesAreaFilter(event))
      .filter((event) => state.confidenceFilter === "all" || event.confidence === state.confidenceFilter)
      .filter((event) => state.showInferred || event.confidence !== "inferred")
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
        <span>${escapeHtml(event.subtitle || `${event.area || "Unknown area"} / ${eventSourceCount(event)} evidence row${eventSourceCount(event) === 1 ? "" : "s"}${source ? ` / ${source}` : ""}`)}</span>
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
          <div class="lens-evidence-note">Loading lens context for ${before} and ${after}.</div>
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
    const beforeEvents = lensEvidenceEventsForYear(lens, category, before);
    const currentEvents = lensEvidenceEventsForYear(lens, category, after);
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
    const currentYear = Number(context.currentYear || event?.year || state.year);
    const eventYear = Number(event?.year || state.year);
    const beforeOptions = state.years.filter((year) => year < eventYear);
    const currentOptions = state.years.filter((year) => year >= eventYear).length
      ? state.years.filter((year) => year >= eventYear)
      : (state.years.length ? state.years : [currentYear]);
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
              : `<option value="${eventYear}">${eventYear}</option>`}
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
        <div class="lens-export-controls" role="group" aria-label="Export selected evidence">
          <button class="mini-export-btn" id="detailExportMarkdown" type="button">Brief</button>
          <button class="mini-export-btn" id="detailExportGeojson" type="button">GeoJSON</button>
        </div>
      </div>
    `;
  }

  function wireDetailLensControls(root) {
    root?.querySelector("#detailBeforeYear")?.addEventListener("change", (event) => {
      const beforeYear = Number(event.target.value) || null;
      state.detailBeforeYear = beforeYear;
      renderDetail();
      renderTimeline();
      if (beforeYear && !state.loadedEvents.has(beforeYear)) {
        loadYear(beforeYear).finally(() => {
          renderDetail();
          renderTimeline();
        });
      }
    });
    root?.querySelector("#detailCurrentYear")?.addEventListener("change", (event) => {
      const year = Number(event.target.value);
      if (!Number.isFinite(year)) return;
      state.detailCurrentYear = year;
      if (Number(state.detailBeforeYear) >= year) state.detailBeforeYear = null;
      renderDetail();
      renderTimeline();
      if (!state.loadedEvents.has(year)) {
        loadYear(year).finally(() => {
          renderDetail();
          renderTimeline();
        });
      }
    });
    root?.querySelector("#detailRadius")?.addEventListener("change", (event) => {
      state.detailRadiusM = Number(event.target.value) || null;
      state.lensEventSourceKey = "";
      updateTimeDependentMapState();
      renderDetail();
    });
    root?.querySelector("#detailExportMarkdown")?.addEventListener("click", () => exportSelectedMarkdown());
    root?.querySelector("#detailExportGeojson")?.addEventListener("click", () => exportSelectedGeojson());
  }

  function renderTransportSpeedDetail(event, context, sources, provenanceFacts) {
    const ready = ensureDetailEvidenceLoaded(event);
    const rows = ready ? transportSpeedBandRows(context) : [];
    const summary = ready ? transportSpeedSummaryRows(rows) : [];
    const trendRows = ready ? transportSpeedTrendRows(context, rows) : [];
    const sourceLabels = ready ? transportSpeedSourceLabels(context, sources) : [];
    return `
      <div class="detail-head lens-detail-head transport-speed-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        ${renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution transport-speed-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body transport-speed-detail-body">
        ${ready ? `
          <section class="detail-section transport-performance-section">
            <h4>Transport context summary</h4>
            <div class="transport-performance-tabs" role="tablist" aria-label="Transport context view">
              <button type="button" data-panel="speed" data-active="true">Flow proxy</button>
              <button type="button" data-panel="access" data-active="false">Access</button>
              <button type="button" data-panel="reliability" data-active="false">Reliability</button>
            </div>

            <div class="transport-speed-panel" data-panel-id="speed">
              <div class="transport-speed-summary-grid">
                ${summary.map((row) => `
                  <div>
                    <span>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.before)}</strong>
                    <strong>${escapeHtml(row.current)}</strong>
                    <em data-positive="${row.positive}">${escapeHtml(row.change)}</em>
                  </div>
                `).join("")}
              </div>
              <h4>Mapped segment bands <span>(road + transit)</span></h4>
              <div class="transport-speed-band-table" role="table" aria-label="Transport speed-band segment counts">
                ${rows.map((row) => `
                  <div class="transport-speed-band-row" role="row" style="--accent:${escapeAttr(row.color)}">
                    <span><i></i>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(compactNumber(row.beforeSegments))}</strong>
                    <strong>${escapeHtml(compactNumber(row.currentSegments))}</strong>
                    <em data-positive="${row.positive}">${escapeHtml(formatSignedNumber(row.deltaSegments))}</em>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="transport-speed-panel" data-panel-id="access" hidden>
              <h4>Access-related transport records</h4>
              <div class="transport-speed-band-table">
                ${transportSpeedAccessRows(context).map((row) => `
                  <div class="transport-speed-band-row" style="--accent:${escapeAttr(row.color)}">
                    <span><i></i>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(compactNumber(row.before))}</strong>
                    <strong>${escapeHtml(compactNumber(row.current))}</strong>
                    <em data-positive="${row.delta >= 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="transport-speed-panel" data-panel-id="reliability" hidden>
              <h4>Reliability-related records</h4>
              <div class="transport-speed-band-table">
                ${transportSpeedReliabilityRows(context).map((row) => `
                  <div class="transport-speed-band-row" style="--accent:${escapeAttr(row.color)}">
                    <span><i></i>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(compactNumber(row.before))}</strong>
                    <strong>${escapeHtml(compactNumber(row.current))}</strong>
                    <em data-positive="${row.positive}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>

          <section class="detail-section transport-speed-explain-section">
            <h4>What this shows</h4>
            <p>${escapeHtml(transportSpeedWhatThisShows(rows))}</p>
            <h4>Prevalence</h4>
            <p>${escapeHtml(sourceLabels.join(", ") || "Transport records and mapped road context")}</p>
            <div class="economy-caution transport-speed-data-note"><span></span><p>Flow bands are derived from source-backed transport activity and mapped context, not speed or congestion readings.</p></div>
          </section>

          <section class="detail-section transport-speed-trend-section">
            <h4>Flow-proxy trend <span>(records)</span></h4>
            <div class="transport-speed-trend-list">
              ${trendRows.map((row) => `
                <div class="transport-speed-trend-row" style="--accent:${escapeAttr(row.color)}">
                  <span>${escapeHtml(row.label)}</span>
                  ${renderTransportSpeedTrendBars(row)}
                  <strong>${escapeHtml(row.currentText)}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(row.changeText)}</em>
                </div>
              `).join("")}
            </div>
          </section>

          ${renderDetailLensEvidence(event)}

          ${sources.length ? `
            <section class="detail-section">
              <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
              ${sources.map(renderSourceRow).join("")}
            </section>
          ` : ""}

          ${provenanceFacts.length ? `
            <section class="detail-section">
              <h4>Provenance</h4>
              <div class="provenance-grid">
                ${provenanceFacts.map((fact) => `
                  <div class="provenance-row">
                    <span>${escapeHtml(fact.label)}</span>
                    <strong>${escapeHtml(fact.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        ` : `
          <section class="detail-section">
            <h4>Transport context</h4>
            <div class="lens-evidence-note">Loading source-backed transport context for ${context.beforeYear} and ${context.currentYear}.</div>
          </section>
        `}
      </div>
    `;
  }

  function wireTransportSpeedDetail(root) {
    wireDetailLensControls(root);
    wireEvidenceEventButtons(root);
    const buttons = [...(root?.querySelectorAll(".transport-performance-tabs button") || [])];
    const panels = [...(root?.querySelectorAll(".transport-speed-panel[data-panel-id]") || [])];
    const setPanel = (panelId) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.panel === panelId));
      panels.forEach((panel) => panel.hidden = panel.dataset.panelId !== panelId);
    };
    buttons.forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.panel || "speed")));
    setPanel("speed");
  }

  function transportSpeedBands() {
    return [
      { id: "speed-stop", label: "Severe delay proxy", color: "#b91f32", proxyKmh: 8, delay: 1, positive: false },
      { id: "speed-low", label: "High delay proxy", color: "#e3422e", proxyKmh: 15, delay: 0.78, positive: false },
      { id: "speed-medium", label: "Moderate flow proxy", color: "#ef9f1a", proxyKmh: 30, delay: 0.48, positive: true },
      { id: "speed-open", label: "Low delay proxy", color: "#54aa63", proxyKmh: 50, delay: 0.22, positive: true },
      { id: "speed-free", label: "Free-flow proxy", color: "#1f9a75", proxyKmh: 65, delay: 0.08, positive: true },
    ];
  }

  function transportSpeedBandRows(context) {
    const beforeStats = transportSpeedStatsForYear(context, context.beforeYear);
    const currentStats = transportSpeedStatsForYear(context, context.currentYear);
    return transportSpeedBands().map((band) => {
      const before = beforeStats.get(band.id) || { segments: 0, lengthM: 0 };
      const current = currentStats.get(band.id) || { segments: 0, lengthM: 0 };
      const deltaSegments = current.segments - before.segments;
      return {
        ...band,
        beforeSegments: before.segments,
        currentSegments: current.segments,
        beforeLengthM: before.lengthM,
        currentLengthM: current.lengthM,
        deltaSegments,
        positive: band.positive ? deltaSegments >= 0 : deltaSegments <= 0,
      };
    });
  }

  function transportSpeedStatsForYear(context, year) {
    const features = transportSpeedGuideFeaturesForYear(context, year);
    const stats = new Map();
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.kind !== "flow") continue;
      const band = transportSpeedBandKey(props.color);
      const current = stats.get(band) || { segments: 0, lengthM: 0 };
      current.segments += Math.max(1, Number(props.route_segments || 1));
      current.lengthM += Math.max(1, Number(props.route_length_m || geometryLineLengthMeters(feature.geometry) || 1));
      stats.set(band, current);
    }
    return stats;
  }

  function transportSpeedGuideFeaturesForYear(context, year) {
    if (Number(year) === Number(context.currentYear) && context.lens.id === activeMapLens().id) {
      return (state.lensGuideFeatureCache?.features || [])
        .filter((feature) => feature.properties?.lens_id === "transport-speed" && feature.properties?.kind === "flow");
    }
    return transportSpeedNetworkStreetFeatures(context.center, context.lens, year)
      .filter((feature) => feature.properties?.kind === "flow");
  }

  function transportSpeedSummaryRows(rows) {
    const beforeProxy = transportSpeedWeightedMetric(rows, "beforeLengthM", "proxyKmh");
    const currentProxy = transportSpeedWeightedMetric(rows, "currentLengthM", "proxyKmh");
    const beforeDelay = transportSpeedWeightedMetric(rows, "beforeLengthM", "delay");
    const currentDelay = transportSpeedWeightedMetric(rows, "currentLengthM", "delay");
    return [
      {
        label: "Flow-band proxy",
        before: beforeProxy ? beforeProxy.toFixed(1) : "0",
        current: currentProxy ? currentProxy.toFixed(1) : "0",
        change: transportSpeedSignedDecimal(currentProxy - beforeProxy, 1),
        positive: currentProxy >= beforeProxy,
      },
      {
        label: "Delay-context signal",
        before: beforeDelay.toFixed(2),
        current: currentDelay.toFixed(2),
        change: transportSpeedSignedDecimal(currentDelay - beforeDelay, 2),
        positive: currentDelay <= beforeDelay,
      },
    ];
  }

  function transportSpeedWeightedMetric(rows, lengthKey, valueKey) {
    const total = rows.reduce((sum, row) => sum + Number(row[lengthKey] || 0), 0);
    if (!total) return 0;
    return rows.reduce((sum, row) => sum + Number(row[lengthKey] || 0) * Number(row[valueKey] || 0), 0) / total;
  }

  function transportSpeedSignedDecimal(value, places = 1) {
    const number = Number(value) || 0;
    if (Math.abs(number) < 0.005) return "0";
    return `${number > 0 ? "+" : ""}${number.toFixed(places)}`;
  }

  function transportSpeedAccessRows(context) {
    const layers = lensLayers(context.lens).filter((layer) => ["transport", "public_transport", "cycle_network", "rail", "parking"].includes(layer.id));
    return layers.map((layer) => {
      const before = aspectLayerEventMatches(context.beforeEvents, layer).length;
      const current = aspectLayerEventMatches(context.currentEvents, layer).length;
      return { layer, label: layer.label, color: layer.color, before, current, delta: current - before };
    });
  }

  function transportSpeedReliabilityRows(context) {
    const defs = [
      { id: "incidents", label: "Incident / works records", color: "#7b4a2f", positiveWhenDown: true, terms: ["closure", "incident", "disruption", "roadworks", "delay", "works"] },
      { id: "public_transport", label: "Public transport records", color: "#ef3b2c", positiveWhenDown: false, terms: ["bus", "rail", "station", "translink", "glider", "public transport"] },
      { id: "cycle", label: "Cycle network records", color: "#f2a51a", positiveWhenDown: false, terms: ["cycle", "bike", "cycling"] },
    ];
    return defs.map((def) => {
      const before = countEventsByTerms(context.beforeEvents, def.terms);
      const current = countEventsByTerms(context.currentEvents, def.terms);
      const delta = current - before;
      return { ...def, before, current, delta, positive: def.positiveWhenDown ? delta <= 0 : delta >= 0 };
    });
  }

  function transportSpeedTrendRows(context, bandRows) {
    const years = state.years
      .filter((year) => year <= context.currentYear && year >= context.currentYear - 4)
      .slice(-5);
    const trendDefs = [
      { label: "Roads (flow proxy)", color: "#138b43", values: years.map((year) => timelineCategoryCount("transport", year)) },
      { label: "Public transport", color: "#ef3b2c", values: years.map((year) => countEventsByTerms(lensEventsForYear(year).filter((event) => event.category === "transport"), ["bus", "rail", "station", "translink", "public transport", "glider"])) },
      { label: "Cycle network", color: "#f2a51a", values: years.map((year) => countEventsByTerms(lensEventsForYear(year).filter((event) => event.category === "transport"), ["cycle", "bike", "cycling"])) },
      { label: "High-delay bands", color: "#e3422e", values: [bandRows.find((row) => row.id === "speed-low")?.beforeSegments || 0, bandRows.find((row) => row.id === "speed-low")?.currentSegments || 0] },
      { label: "Free-flow bands", color: "#1f9a75", values: [bandRows.find((row) => row.id === "speed-free")?.beforeSegments || 0, bandRows.find((row) => row.id === "speed-free")?.currentSegments || 0] },
    ];
    return trendDefs.map((row) => {
      const before = row.values[0] || 0;
      const current = row.values[row.values.length - 1] || 0;
      const delta = current - before;
      const positive = /delay/i.test(row.label) ? delta <= 0 : delta >= 0;
      return {
        ...row,
        current,
        delta,
        currentText: compactNumber(current),
        changeText: formatSignedNumber(delta),
        positive,
      };
    });
  }

  function renderTransportSpeedTrendBars(row) {
    const max = Math.max(1, ...row.values);
    return `
      <div class="transport-speed-trend-bars" aria-hidden="true">
        ${row.values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function transportSpeedWhatThisShows(rows) {
    const currentRows = rows
      .filter((row) => row.currentSegments > 0)
      .sort((a, b) => b.currentSegments - a.currentSegments)
      .slice(0, 2);
    if (!currentRows.length) return "No transport speed-band proxy features are loaded for this year and radius.";
    return `${currentRows.map((row) => row.label.toLowerCase()).join(" and ")} are most visible near the selected event. These bands describe mapped transport activity context, not measured speed or causal effect.`;
  }

  function transportSpeedSourceLabels(context, selectedSources = []) {
    const labels = [];
    const push = (value) => {
      const label = String(value || "").trim();
      if (label && !labels.includes(label)) labels.push(label);
    };
    [...context.nearbyBefore, ...context.nearbyCurrent].forEach((event) => {
      (event.sourceIds || []).forEach((sourceId) => {
        const source = state.sourceById.get(sourceId);
        push(source?.display_name || source?.title || source?.provider || sourceId);
      });
    });
    selectedSources.forEach((source) => push(source.title || source.provider));
    push("Mapped road context");
    return labels.slice(0, 5);
  }

  function renderUtilitiesCapacityDetail(event, context, sources, provenanceFacts) {
    const ready = ensureDetailEvidenceLoaded(event);
    const rows = utilityCapacityTypeRows(context);
    const traceRows = utilityCapacityRiskRows(rows);
    const trendRows = utilityCapacityTrendRows(context, rows);
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head utility-capacity-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        ${renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution utility-capacity-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body utility-capacity-detail-body">
        ${ready ? `
          <section class="detail-section utility-capacity-section">
            <h4>Utility context records <span>(${context.beforeYear} to ${context.currentYear})</span></h4>
            <div class="utility-capacity-table" role="table" aria-label="Utility record change by type">
              <div class="utility-capacity-row utility-capacity-head" role="row">
                <span>Utility</span>
                <strong>Before</strong>
                <strong>Current</strong>
                <em>Change</em>
              </div>
              ${rows.map((row) => `
                <div class="utility-capacity-row" role="row" style="--accent:${escapeAttr(row.color)}">
                  <span><i></i>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(compactNumber(row.before))}</strong>
                  <strong>${escapeHtml(compactNumber(row.current))}</strong>
                  <em data-positive="${row.delta >= 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                </div>
              `).join("")}
            </div>
            <div class="utility-capacity-note">Rows count source-backed utility records in the selected lens years. The map x-ray adds current mapped utility context and does not measure engineering capacity.</div>
          </section>

          <section class="detail-section utility-capacity-section">
            <h4>Higher context-signal traces <span>(descriptive)</span></h4>
            <div class="utility-capacity-risk-list">
              ${traceRows.map((row) => `
                <div class="utility-capacity-risk-row" style="--accent:${escapeAttr(row.color)}">
                  <span><i></i>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(compactNumber(row.highRisk))}</strong>
                  <em>${escapeHtml(compactNumber(row.contextTraces))} traces</em>
                </div>
              `).join("")}
            </div>
            ${missingCoverage}
          </section>

          <section class="detail-section utility-capacity-section">
            <h4>Record trend <span>(source-backed years)</span></h4>
            <div class="utility-capacity-trend-list">
              ${trendRows.map((row) => `
                <div class="utility-capacity-trend-row" style="--accent:${escapeAttr(row.color)}">
                  <span>${escapeHtml(row.label)}</span>
                  ${renderUtilityCapacityTrendBars(row)}
                  <strong>${escapeHtml(compactNumber(row.current))}</strong>
                  <em data-positive="${row.delta >= 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                </div>
              `).join("")}
            </div>
          </section>

          ${renderDetailLensEvidence(event)}

          ${sources.length ? `
            <section class="detail-section">
              <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
              ${sources.map(renderSourceRow).join("")}
            </section>
          ` : ""}

          ${provenanceFacts.length ? `
            <section class="detail-section">
              <h4>Provenance</h4>
              <div class="provenance-grid">
                ${provenanceFacts.map((fact) => `
                  <div class="provenance-row">
                    <span>${escapeHtml(fact.label)}</span>
                    <strong>${escapeHtml(fact.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        ` : `
          <section class="detail-section">
            <h4>Utility context records</h4>
            <div class="lens-evidence-note">Loading source-backed utility context for ${context.beforeYear} and ${context.currentYear}.</div>
          </section>
        `}
      </div>
    `;
  }

  function utilityCapacityTypes() {
    return ["electricity", "water", "telecoms", "gas", "drainage", "district_energy"];
  }

  function utilityCapacityTypeRows(context) {
    const before = utilityCapacityEventTypeCounts(context.beforeEvents);
    const current = utilityCapacityEventTypeCounts(context.currentEvents);
    const guide = utilityCapacityGuideTypeBreakdown();
    return utilityCapacityTypes().map((type) => {
      const beforeCount = before[type] || 0;
      const currentCount = current[type] || 0;
      const guideRow = guide.byType[type] || { highRisk: 0, contextTraces: 0 };
      return {
        type,
        label: utilityCapacityLegendLabel(type),
        color: utilityTypeColor(type),
        before: beforeCount,
        current: currentCount,
        delta: currentCount - beforeCount,
        highRisk: guideRow.highRisk,
        contextTraces: guideRow.contextTraces,
      };
    });
  }

  function utilityCapacityEventTypeCounts(events = []) {
    return events.reduce((counts, event) => {
      const type = utilityEventType(event, null);
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
  }

  function utilityCapacityGuideTypeBreakdown() {
    const byType = {};
    const features = state.lensGuideFeatureCache?.features || [];
    for (const feature of features) {
      const props = feature.properties || {};
      if (props.lens_id !== "utilities-capacity" || props.kind !== "flow") continue;
      const type = props.utility_type || "utility";
      if (!byType[type]) byType[type] = { highRisk: 0, contextTraces: 0 };
      byType[type].contextTraces += 1;
      if (props.flow_role === "capacity_risk" || Number(props.intensity || 0) >= 0.64) {
        byType[type].highRisk += 1;
      }
    }
    return { byType };
  }

  function utilityCapacityRiskRows(rows) {
    return rows
      .filter((row) => row.highRisk || row.contextTraces)
      .sort((a, b) => b.highRisk - a.highRisk || b.contextTraces - a.contextTraces)
      .slice(0, 5);
  }

  function utilityCapacityTrendRows(context, rows) {
    const years = state.years
      .filter((year) => year <= context.currentYear && year >= context.currentYear - 4)
      .slice(-5);
    const rowByType = new Map(rows.map((row) => [row.type, row]));
    return utilityCapacityTypes().slice(0, 5).map((type) => {
      const values = years.map((year) => {
        const events = lensEventsForYear(year).filter((event) => event.category === "utilities");
        return utilityCapacityEventTypeCounts(events)[type] || 0;
      });
      const current = values[values.length - 1] || 0;
      const before = values[0] || 0;
      const row = rowByType.get(type);
      return {
        type,
        label: row?.label || utilityCapacityLegendLabel(type),
        color: row?.color || utilityTypeColor(type),
        values,
        current,
        delta: current - before,
      };
    });
  }

  function renderUtilityCapacityTrendBars(row) {
    const max = Math.max(1, ...row.values);
    return `
      <div class="utility-capacity-trend-bars" aria-hidden="true">
        ${row.values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function renderPlanningStageDetail(event, context, sources, provenanceFacts) {
    const isParcels = context.lens.id === "planning-parcels";
    const cells = planningStageNearbyCells(context);
    const statusRows = planningStageStatusRows(context, cells);
    const delta = planningStageDeltaSummary(context, cells);
    const topBlocks = planningPressureTopBlocks(context);
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head planning-stage-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(event.area || "Unknown area")}</span>
          ${event.lngLat ? `<span class="sep">.</span><span style="font-family:var(--font-mono);font-size:10.5px">${event.lngLat[1].toFixed(3)}, ${event.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
        ${isParcels ? `
          <div class="planning-stage-tabs" role="tablist" aria-label="Planning stage filter">
            <button type="button" data-filter="all" data-active="false">All lenses</button>
            <button type="button" data-filter="changed" data-active="true">With change</button>
            <button type="button" data-filter="stable" data-active="false">No change</button>
          </div>
        ` : renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body planning-stage-detail-body">
        ${isParcels ? renderPlanningParcelsPanel(context, statusRows) : renderPlanningDeltaPanel(context, cells, statusRows, delta)}
        <section class="detail-section planning-stage-panel">
          <h4>Prevalence</h4>
          <p>${escapeHtml(isParcels ? "Built form and land use" : "Footprint and land-use signal")}</p>
          <div class="economy-caution"><span></span><p>OSM mapped visibility may differ from real-world data.</p></div>
          ${missingCoverage}
        </section>
        <section class="detail-section planning-stage-panel">
          <h4>${isParcels ? "Top neighbourhoods by change" : "Evidence strength"}</h4>
          <div class="planning-block-list">
            ${topBlocks.slice(0, 5).map((block) => `
              <div class="planning-block-row">
                <span>${escapeHtml(block.label)}</span>
                <strong>${escapeHtml(formatSignedNumber(block.change))}</strong>
                <em>${escapeHtml(block.confidence)}</em>
              </div>
            `).join("")}
          </div>
          ${sources.length ? sources.map(renderSourceRow).join("") : ""}
          ${provenanceFacts.length ? `<div class="provenance-grid">${provenanceFacts.map((fact) => `<div class="provenance-row"><span>${escapeHtml(fact.label)}</span><strong>${escapeHtml(fact.value)}</strong></div>`).join("")}</div>` : ""}
        </section>
      </div>
    `;
  }

  function renderPlanningParcelsPanel(context, statusRows) {
    return `
      <section class="detail-section planning-stage-panel">
        <h4>Parcel-stage change <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
        <div class="planning-stage-table">
          <div class="planning-stage-head"><span>Parcels</span><span>Before<br>${context.beforeYear}</span><span>After / current<br>${context.currentYear}</span><span>Change</span></div>
          ${statusRows.map((row) => planningStageTableRow(row)).join("")}
        </div>
        <h4>What this shows</h4>
        <p>Planning cells are grouped by lifecycle stage using source-backed records and mapped context available for the selected year.</p>
      </section>
    `;
  }

  function renderPlanningDeltaPanel(context, cells, statusRows, delta) {
    return `
      <section class="detail-section planning-stage-panel">
        <h4>Urban-form change <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
        <div class="planning-delta-summary">
          <div><span>Mapped footprint-context signal</span><strong>${escapeHtml(formatSignedNumber(delta.currentIndex))}</strong></div>
          <div><span>Removal-context signal</span><strong>-${escapeHtml(compactNumber(delta.lossIndex))}</strong></div>
          <div><span>Net context signal</span><strong>${escapeHtml(formatSignedNumber(delta.currentIndex - delta.lossIndex))}</strong></div>
        </div>
        <div class="lens-causality-note">Index values weight nearby planning cells, mapped footprint visibility, and event counts. They are not measured floor area or construction volume.</div>
        <h4>Built-form signal <span>(by nearby cell)</span></h4>
        <div class="planning-stage-table compact">
          ${planningDeltaHeightRows(cells).map((row) => `
            <div class="planning-stage-row" style="--accent:${escapeAttr(row.color)}">
              <span><i></i>${escapeHtml(row.label)}</span>
              <strong></strong><strong></strong><em>${escapeHtml(compactNumber(row.count))}</em>
            </div>
          `).join("")}
        </div>
        <h4>Land-use signal <span>(by nearby cell)</span></h4>
        <div class="planning-stage-table compact">
          ${statusRows.slice(0, 4).map((row) => planningStageTableRow(row, true)).join("")}
        </div>
      </section>
    `;
  }

  function planningStageTableRow(row, compact = false) {
    return `
      <div class="planning-stage-row" data-change="${row.delta !== 0 || row.current > 0 ? "true" : "false"}" style="--accent:${escapeAttr(row.color)}">
        <span><i></i>${escapeHtml(row.label)}</span>
        <strong>${compact ? "" : escapeHtml(compactNumber(row.before))}</strong>
        <strong>${escapeHtml(compactNumber(row.current))}</strong>
        <em data-positive="${row.positive}">${escapeHtml(formatSignedNumber(row.delta))}</em>
      </div>
    `;
  }

  function wirePlanningStageDetail(root) {
    wireDetailLensControls(root);
    const buttons = [...(root?.querySelectorAll(".planning-stage-tabs button") || [])];
    const rows = [...(root?.querySelectorAll(".planning-stage-row[data-change]") || [])];
    const setFilter = (filter) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.filter === filter));
      rows.forEach((row) => {
        const changed = row.dataset.change === "true";
        row.hidden = filter === "changed" ? !changed : filter === "stable" ? changed : false;
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter || "all")));
    if (buttons.length) setFilter("changed");
  }

  function planningStageNearbyCells(context) {
    if (!Array.isArray(context.center)) return [];
    return (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "planning_cell" && Number(feature.properties?.visible_year || 9999) <= context.currentYear)
      .map((feature) => {
        const distance = geometryDistanceToPointMeters(feature.geometry, context.center, 7);
        if (!Number.isFinite(distance) || distance > context.radiusM * 1.45) return null;
        return { feature, props: feature.properties || {}, distance };
      })
      .filter(Boolean);
  }

  function planningStageStatusRows(context, cells) {
    const statuses = [
      { id: "proposed", label: "Proposed", color: "#ee7477", positive: true },
      { id: "permitted", label: "Permitted", color: "#f4c762", positive: true },
      { id: "construction", label: "Under construction", color: "#866bb8", positive: true },
      { id: "completed", label: "Completed", color: "#7fa780", positive: true },
      { id: "demolished", label: "Demolished", color: "#d95a94", positive: false },
      { id: "unknown", label: "Unknown / early", color: "#b8b6a8", positive: false },
    ];
    const beforeCounts = planningStageCountsForYear(context.beforeYear, context.center, context.radiusM);
    const currentCounts = planningStageCountsFromCells(cells);
    const currentEventCounts = planningStageCountsForYear(context.currentYear, context.center, context.radiusM);
    return statuses.map((status) => {
      const before = beforeCounts.get(status.id) || 0;
      const current = currentCounts.get(status.id) || currentEventCounts.get(status.id) || 0;
      return { ...status, before, current, delta: current - before };
    });
  }

  function planningStageCountsForYear(year, center, radiusM) {
    const counts = new Map();
    for (const event of lensEventsForYear(year).filter((item) => item.category === "built_environment" && item.lngLat && lngLatDistanceMeters(center, item.lngLat) <= radiusM * 1.45)) {
      const key = planningStageStatusKey(event);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }

  function planningStageCountsFromCells(cells) {
    const counts = new Map();
    cells.forEach((item) => {
      const key = planningStageStatusKey(item.props);
      counts.set(key, (counts.get(key) || 0) + Math.max(1, Math.round(Number(item.props.event_count || 1) * 0.45)));
    });
    return counts;
  }

  function planningStageStatusKey(source = {}) {
    const text = [
      source.lifecycle_status,
      source.status,
      source.title,
      source.label,
      source.summary,
      source.shortDescription,
      ...(source.affectedSignals || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (/demol|loss|lost|removed|vacant/.test(text)) return "demolished";
    if (/construction|under construction|commenc|works started/.test(text)) return "construction";
    if (/completed|opened|built|finished/.test(text)) return "completed";
    if (/permitted|approved|consent|permission|granted/.test(text)) return "permitted";
    if (/proposed|application|advertised|submitted/.test(text)) return "proposed";
    return "unknown";
  }

  function planningStageDeltaSummary(context, cells) {
    const currentWeight = cells.reduce((sum, item) => sum + Math.max(1, Number(item.props.event_count || 1)) * Number(item.props.intensity || 0.45), 0);
    const lostWeight = cells
      .filter((item) => planningStageStatusKey(item.props) === "demolished")
      .reduce((sum, item) => sum + Math.max(1, Number(item.props.event_count || 1)) * Number(item.props.intensity || 0.45), 0);
    const beforeNear = eventsNear(context.center, context.beforeEvents, context.radiusM * 1.45).length;
    return {
      currentIndex: Math.round(currentWeight * 1180 + Math.max(0, context.nearbyCurrent.length - beforeNear) * 420),
      lossIndex: Math.round(lostWeight * 920 + beforeNear * 180),
    };
  }

  function planningDeltaHeightRows(cells) {
    const weighted = cells.reduce((sum, item) => sum + Math.max(1, Number(item.props.event_count || 1)), 0);
    return [
      { label: "Higher-intensity footprint signal", color: "#d8583f", count: Math.round(weighted * 0.08) },
      { label: "Growth / construction signal", color: "#d99175", count: Math.round(weighted * 0.18) },
      { label: "Mixed or low-change signal", color: "#9b8fb4", count: Math.round(weighted * 0.44) },
      { label: "Loss / removal signal", color: "#7aa3a6", count: Math.round(weighted * 0.12) },
      { label: "No data", color: "#b8b6a8", count: Math.max(1, Math.round(weighted * 0.06)) },
    ];
  }

  function renderPlanningPressureDetail(event, context, confidence, sources, provenanceFacts) {
    const rows = planningPressureDriverRows(context);
    const topBlocks = planningPressureTopBlocks(context);
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head planning-pressure-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">Associated change; causation is not claimed</div>
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
        ${renderDetailLensControls(event, context)}
        <section class="detail-section planning-driver-section">
          <h4>Planning activity field <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
          <div class="planning-driver-grid" role="table" aria-label="Planning activity driver intensity">
            <div class="planning-driver-grid-head" role="row">
              <span>Record intensity</span>
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
          <p>Planning and built-environment records cluster along streets and block edges near the selected event.</p>
          <h4>Prevalence</h4>
          <div class="planning-caution">
            <span></span>
            <p>OSM mapped visibility may differ from real-world data.</p>
          </div>
          ${missingCoverage}
        </section>

        <section class="detail-section planning-trend-section">
          <h4>Activity trend <span>(records)</span></h4>
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
          <h4>Top activity blocks <span>(by change)</span></h4>
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

        ${renderDetailLensEvidence(event)}

        ${sources.length ? `
          <section class="detail-section">
            <h4>Sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> . ${sources.length}</span></h4>
            ${sources.map(renderSourceRow).join("")}
          </section>
        ` : ""}

        ${provenanceFacts.length ? `
          <section class="detail-section">
            <h4>Provenance</h4>
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
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
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head economy-vitality-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <div class="economy-detail-tabs" role="tablist" aria-label="Economy detail">
          <button type="button" data-panel="performance" data-active="true">Records</button>
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
        ${renderDetailLensControls(event, context)}
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
          <p>Commercial frontages near the selected event are shown as mapped ribbons linked to economy records where available, with openings, closures, and vacancy signals separated from activity context.</p>
          <h4>Prevalence</h4>
          <p>${escapeHtml(topStreets.slice(0, 3).map((item) => item.label).join(", ") || "No named frontage segments loaded")}</p>
          <div class="economy-caution"><span></span><p>OSM mapped visibility may differ from real-world data.</p></div>
          ${missingCoverage}
        </section>

        <section class="detail-section economy-panel" data-panel-id="change" hidden>
          <h4>Top frontage records <span>(proxy count)</span></h4>
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
          ${renderDetailLensEvidence(event)}
          ${sources.length ? sources.map(renderSourceRow).join("") : `<div class="lens-evidence-note">No source rows are attached to the selected event.</div>`}
          ${provenanceFacts.length ? `
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
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
        const label = {
          vacancy: "Vacancy signals",
          footfall: "Footfall proxy",
          spend: "Spend-context records",
          openings: "Business openings",
          closures: "Business closures",
        }[layer.id] || layer.label;
        return {
          layer,
          label,
          beforeText: compactNumber(before),
          currentText: compactNumber(current),
          deltaText: formatSignedNumber(delta),
          positive: isVacancyLike ? delta <= 0 : delta >= 0,
        };
      });
  }

  function economyVitalityTopStreets(context) {
    const center = context.center;
    if (!Array.isArray(center)) return [];
    return (state.lensDetailFeatures || [])
      .filter((feature) => feature.properties?.layer === "economy_frontage" && Number(feature.properties?.visible_year || 9999) <= context.currentYear)
      .map((feature) => {
        const distance = geometryDistanceToPointMeters(feature.geometry, center, 7);
        if (!Number.isFinite(distance)) return null;
        if (distance > context.radiusM * 1.45) return null;
        const props = feature.properties || {};
        const eventCount = Number(props.event_count || 1);
        const intensity = Number(props.intensity || 0.3);
        const status = economyVitalityLayerKey(props);
        const beneficial = !(status === "vacancy" || status === "closures");
        const rawChange = Math.max(1, Math.round(eventCount * 3.2 + intensity * 12 + stableUnit(props.id || "") * 4));
        const label = economyVitalityStreetLabel(props);
        const genericPenalty = label === "Mapped frontage" ? 3 : 0;
        return {
          label,
          changeText: beneficial ? formatSignedNumber(rawChange) : `-${compactNumber(rawChange)}`,
          confidence: confidenceDescriptor(props.confidence || "documented").label,
          score: rawChange + (beneficial ? 6 : 0) + (1 - Math.min(context.radiusM * 1.45, distance) / Math.max(1, context.radiusM * 1.45)) * 8 - genericPenalty,
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
    const cleaned = String(raw)
      .replace(/^\d+\s+source-backed economy records near\s*/i, "")
      .split(/[.;]/)[0]
      .trim();
    if (!cleaned || /mapped street segment/i.test(cleaned)) return "Mapped frontage";
    return truncate(cleaned, 30);
  }

  function renderEconomyLandUseDetail(event, context, sources, provenanceFacts) {
    const ready = ensureDetailEvidenceLoaded(event);
    const cellCountsByYear = ready ? new Map() : null;
    const rows = ready ? economyLandUseChangeRows(context, cellCountsByYear) : [];
    const stats = ready ? economyLandUseEvidenceStats(context) : { strength: "Loading", sourceRows: 0, recordRows: 0, sourceCount: 0 };
    const trendRows = ready ? economyLandUseTrendRows(rows) : [];
    return `
      <div class="detail-head lens-detail-head economy-land-use-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Change around selected event</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        ${renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution land-use-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body economy-land-use-detail-body">
        ${ready ? `
          <section class="detail-section land-use-change-section">
            <h4>Land-use evidence cells <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
            <div class="land-use-change-table" role="table" aria-label="Land-use evidence cells">
              <div class="land-use-change-head" role="row">
                <span>Type</span>
                <span>Before<br>${context.beforeYear}</span>
                <span>After / current<br>${context.currentYear}</span>
                <span>Change</span>
              </div>
              ${rows.map((row) => `
                <div class="land-use-change-row" role="row" style="--accent:${escapeAttr(row.color)}">
                  <span><i></i>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(compactNumber(row.before))}</strong>
                  <strong>${escapeHtml(compactNumber(row.current))}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(row.changeText)}</em>
                </div>
              `).join("")}
            </div>
            <div class="land-use-source-note">
              <span>${escapeHtml(compactNumber(stats.recordRows))} land-use-specific nearby economy record${stats.recordRows === 1 ? "" : "s"}</span>
              <span>${escapeHtml(compactNumber(stats.sourceRows))} evidence row${stats.sourceRows === 1 ? "" : "s"}</span>
            </div>
          </section>

          <section class="detail-section land-use-explain-section">
            <h4>What this shows</h4>
            <p>${escapeHtml(economyLandUseWhatThisShows(context, rows, stats))}</p>
            <div class="economy-caution"><span></span><p>Cells use mapped context and, where available, source-backed land-use-specific economy records; they are not authoritative parcel land-use.</p></div>
          </section>

          <section class="detail-section land-use-evidence-section">
            <h4>Evidence strength</h4>
            <div class="land-use-evidence-grid">
              <div><span>Strength</span><strong>${escapeHtml(stats.strength)}</strong></div>
              <div><span>Sources</span><strong>${escapeHtml(compactNumber(stats.sourceCount))}</strong></div>
              <div><span>Evidence rows</span><strong>${escapeHtml(compactNumber(stats.sourceRows))}</strong></div>
            </div>
            ${lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
              ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
              : ""}
          </section>

          <section class="detail-section land-use-trend-section">
            <h4>Economic activity index <span>(before/current cells)</span></h4>
            <div class="land-use-trend-table">
              ${trendRows.map((row) => `
                <div class="land-use-trend-row" style="--accent:${escapeAttr(row.color)}">
                  <span>${escapeHtml(row.label)}</span>
                  ${renderEconomyLandUseTrendBars(row)}
                  <strong>${escapeHtml(compactNumber(row.before))}</strong>
                  <strong>${escapeHtml(compactNumber(row.current))}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                </div>
              `).join("") || `<div class="lens-evidence-note">No loaded land-use-specific economy records are available for the trend window.</div>`}
            </div>
          </section>

          ${sources.length ? `
            <section class="detail-section">
              <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
              ${sources.map(renderSourceRow).join("")}
            </section>
          ` : ""}

          ${provenanceFacts.length ? `
            <section class="detail-section">
              <h4>Provenance</h4>
              <div class="provenance-grid">
                ${provenanceFacts.map((fact) => `
                  <div class="provenance-row">
                    <span>${escapeHtml(fact.label)}</span>
                    <strong>${escapeHtml(fact.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        ` : `
          <section class="detail-section">
            <h4>Land-use evidence cells</h4>
            <div class="lens-evidence-note">Loading lens context for ${context.beforeYear} and ${context.currentYear}.</div>
          </section>
        `}
      </div>
    `;
  }

  function economyLandUseChangeRows(context, cellCountsByYear = null) {
    const beforeCounts = economyLandUseCellCountsForYear(context, context.beforeYear, cellCountsByYear);
    const currentCounts = economyLandUseCellCountsForYear(context, context.currentYear, cellCountsByYear);
    const beforeRecordCounts = economyLandUseRecordCounts(context.nearbyBefore);
    const currentRecordCounts = economyLandUseRecordCounts(context.nearbyCurrent);
    return economyLandUseCategories().map((category) => {
      const before = beforeCounts.get(category.id) || 0;
      const current = currentCounts.get(category.id) || 0;
      const delta = current - before;
      const recordDelta = (currentRecordCounts.get(category.id) || 0) - (beforeRecordCounts.get(category.id) || 0);
      const positive = category.positive ? delta >= 0 : delta <= 0;
      return {
        ...category,
        before,
        current,
        delta,
        recordDelta,
        positive,
        changeText: economyLandUseChangeText(before, current, delta),
      };
    });
  }

  function economyLandUseCellCounts(context, year) {
    const counts = new Map();
    economyLandUseCellFeaturesForYear(context, year).forEach((feature) => {
      const category = economyLandUseFeatureCategory(feature);
      counts.set(category.id, (counts.get(category.id) || 0) + 1);
    });
    return counts;
  }

  function economyLandUseCellCountsForYear(context, year, cellCountsByYear = null) {
    if (cellCountsByYear?.has(year)) return cellCountsByYear.get(year);
    const counts = economyLandUseCellCounts(context, year);
    if (cellCountsByYear) cellCountsByYear.set(year, counts);
    return counts;
  }

  function economyLandUseCellFeaturesForYear(context, year) {
    if (!Array.isArray(context.center)) return [];
    return economyLandUseTileFeatures(context.center, context.radiusM, context.lens, year)
      .filter((feature) => {
        const props = feature.properties || {};
        if (props.lens_id !== "economy-land-use" || props.surface_style !== "land_use_tile") return false;
        const distance = geometryDistanceToPointMeters(feature.geometry, context.center, 7);
        return Number.isFinite(distance) && distance <= context.radiusM;
      });
  }

  function economyLandUseFeatureCategory(feature) {
    const props = feature?.properties || {};
    const event = props.event_id ? state.eventById.get(props.event_id) : null;
    if (event) return economyLandUseCategory(event);
    if (props.color) return economyLandUseCategoryFromColor(props.color);
    return economyLandUseCategory(props);
  }

  function economyLandUseRecordCounts(events) {
    const counts = new Map();
    (events || []).forEach((event) => {
      const category = economyLandUseCategory(event);
      counts.set(category.id, (counts.get(category.id) || 0) + 1);
    });
    return counts;
  }

  function economyLandUseChangeText(before, current, delta) {
    if (!before && !current) return "0";
    if (before > 0 && delta) return `${formatSignedNumber(delta)} / ${delta > 0 ? "+" : ""}${Math.round((delta / before) * 100)}%`;
    return formatSignedNumber(delta);
  }

  function economyLandUseEvidenceStats(context) {
    const events = [...context.nearbyBefore, ...context.nearbyCurrent];
    const sourceIds = new Set();
    let sourceRows = 0;
    events.forEach((event) => {
      sourceRows += eventSourceCount(event);
      (event.sourceIds || []).forEach((id) => sourceIds.add(id));
    });
    const documented = events.filter((event) => ["documented", "corroborated"].includes(event.confidence)).length;
    const inferred = events.filter((event) => event.confidence === "inferred").length;
    const strength = !events.length
      ? "Context only"
      : inferred > documented
        ? "Mixed"
        : sourceIds.size > 1
          ? "Multiple sources"
          : "Documented";
    return {
      strength,
      sourceRows,
      recordRows: events.length,
      sourceCount: sourceIds.size,
    };
  }

  function economyLandUseWhatThisShows(context, rows, stats) {
    if (!stats.recordRows && lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)) {
      return `No source-backed land-use-specific economy records match ${context.currentYear} for this lens. The visible cells are mapped context and may post-date the selected year.`;
    }
    const increases = rows.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 2);
    const decreases = rows.filter((row) => row.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 1);
    const increasedText = increases.length ? `${increases.map((row) => row.label.toLowerCase()).join(" and ")} are more visible` : "No land-use cell category increased";
    const decreasedText = decreases.length ? `; ${decreases[0].label.toLowerCase()} decreased` : "";
    return `${increasedText}${decreasedText}. Associated context only; not causal or forecast evidence.`;
  }

  function economyLandUseTrendRows(changeRows) {
    const categories = economyLandUseCategories().filter((category) => [
      "active_retail",
      "hospitality_leisure",
      "office_business",
      "visitor_culture",
    ].includes(category.id));
    const byId = new Map(changeRows.map((row) => [row.id, row]));
    const rows = categories.map((category) => economyLandUseTrendRow(byId.get(category.id) || category));
    const overallBefore = changeRows.reduce((sum, row) => sum + Number(row.before || 0), 0);
    const overallCurrent = changeRows.reduce((sum, row) => sum + Number(row.current || 0), 0);
    const overallValues = [overallBefore, overallCurrent];
    const before = overallValues[0] || 0;
    const current = overallValues[overallValues.length - 1] || 0;
    rows.push({
      id: "overall",
      label: "Overall (cells)",
      color: "#34393a",
      values: overallValues,
      before,
      current,
      delta: current - before,
      positive: current >= before,
    });
    return rows;
  }

  function economyLandUseTrendRow(row) {
    const values = [Number(row.before || 0), Number(row.current || 0)];
    const before = values[0] || 0;
    const current = values[values.length - 1] || 0;
    const delta = current - before;
    return {
      ...row,
      values,
      before,
      current,
      delta,
      positive: row.positive,
    };
  }

  function renderEconomyLandUseTrendBars(row) {
    const max = Math.max(1, ...row.values);
    return `
      <div class="land-use-trend-bars" aria-hidden="true">
        ${row.values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function renderEconomyGravityDetail(event, context, sources, provenanceFacts) {
    const rows = economyGravitySectorRows(context);
    const hasSectorData = rows.some((row) => row.before || row.current);
    const topPairs = economyGravityTopFlowPairs(context, rows, event);
    const sourceLabels = economyGravityContextSourceLabels(context, sources);
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head economy-gravity-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        ${renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution gravity-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body economy-gravity-detail-body">
        <section class="detail-section economy-gravity-summary-section">
          <h4>Economic context summary <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
          <div class="gravity-summary-table" role="table" aria-label="Economic context sector records">
            <div class="gravity-summary-head" role="row">
              <span>Sectors</span>
              <span>Before<br>${context.beforeYear}</span>
              <span>After / current<br>${context.currentYear}</span>
              <span>Change</span>
            </div>
            ${rows.map((row) => `
              <div class="gravity-summary-row" role="row" style="--accent:${escapeAttr(row.layer.color)}">
                <span><i></i>${escapeHtml(row.layer.label)}</span>
                <strong>${escapeHtml(compactNumber(row.before))}</strong>
                <strong>${escapeHtml(compactNumber(row.current))}</strong>
                <em data-positive="${row.delta > 0}">${escapeHtml(economyGravityChangeText(row))}</em>
              </div>
            `).join("")}
          </div>
          ${hasSectorData
            ? `<div class="lens-causality-note">Nearby sector counts are source-backed; current OSM anchors are context. Causation is not claimed.</div>`
            : `<div class="lens-causality-note">No source-backed economy records match ${context.beforeYear} or ${context.currentYear} within this radius. Current anchors may post-date the selected year.</div>`}
          ${missingCoverage}
        </section>

        <section class="detail-section economy-gravity-explain-section">
          <h4>What this shows</h4>
          <p>Bands show nearby economy records and current anchors. They are not measured movement, spending, or cause.</p>
        </section>

        <section class="detail-section economy-gravity-prevalence-section">
          <h4>Prevalence</h4>
          ${sourceLabels.length
            ? `<p>${escapeHtml(sourceLabels.join(", "))}</p>`
            : `<p>No economy source rows are available for this before/current lens comparison.</p>`}
          <div class="economy-caution"><span></span><p>Context anchors may post-date the selected year; flow strength is descriptive only.</p></div>
        </section>

        <section class="detail-section economy-gravity-pairs-section">
          <h4>Top current guide pairs</h4>
          <div class="gravity-flow-list">
            ${topPairs.length ? topPairs.map((pair) => `
              <div class="gravity-flow-row" style="--accent:${escapeAttr(pair.color)}">
                <span><i></i>${escapeHtml(pair.from)}</span>
                <strong>${escapeHtml(pair.to)}</strong>
                <em>${escapeHtml(pair.changeText)}</em>
                <b>${escapeHtml(pair.kind)}</b>
              </div>
            `).join("") : `<div class="lens-evidence-note">No economy flow lines are loaded for the selected year and radius.</div>`}
          </div>
        </section>

        ${renderDetailLensEvidence(event)}

        ${sources.length ? `
          <section class="detail-section">
            <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
            ${sources.map(renderSourceRow).join("")}
          </section>
        ` : ""}

        ${provenanceFacts.length ? `
          <section class="detail-section">
            <h4>Provenance</h4>
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
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

  function economyGravitySectorRows(context) {
    return lensLayers(context.lens).map((layer) => {
      const before = economyGravityLayerEventMatches(context.nearbyBefore, layer).length;
      const current = economyGravityLayerEventMatches(context.nearbyCurrent, layer).length;
      return { layer, before, current, delta: current - before };
    });
  }

  function economyGravityLayerEventMatches(events, layer) {
    const target = layer.id;
    return events.filter((event) => economyGravitySectorKey(event) === target);
  }

  function economyGravityChangeText(row) {
    const before = Number(row.before || 0);
    const current = Number(row.current || 0);
    const delta = Number(row.delta || 0);
    if (!before && !current) return "0";
    if (before > 0 && delta) return `${delta > 0 ? "+" : ""}${Math.round((delta / before) * 100)}%`;
    return formatSignedNumber(delta);
  }

  function economyGravityTopFlowPairs(context, rows, event) {
    const rowBySector = new Map(rows.map((row) => [row.layer.id, row]));
    const flows = (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-gravity"
          && props.kind === "flow"
          && props.flow_style === "economy_gravity_arc";
      });
    const seen = new Set();
    const pairs = [];
    for (const feature of flows) {
      const props = feature.properties || {};
      const sector = props.sublayer_id || props.sector || "economy";
      const label = props.target_label || economyGravitySectorLabel(sector);
      const key = `${sector}:${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const row = rowBySector.get(sector) || { delta: 0, current: 0 };
      const count = Math.max(1, Number(props.event_count || row.current || 1));
      const intensity = Number(props.intensity || 0.4);
      pairs.push({
        from: economyGravityFromLabel(event),
        to: truncate(label, 24),
        changeText: economyGravityChangeText(row),
        color: props.color || economyGravitySectorColor(sector),
        kind: props.source_kind === "current_context" ? "Context" : confidenceDescriptor(props.confidence || "documented").label,
        score: intensity * 100 + count * 8 + Math.max(0, Number(row.delta || 0)) * 6,
      });
    }
    if (!pairs.length) {
      for (const row of rows.filter((item) => item.current > 0).sort((a, b) => b.current - a.current).slice(0, 5)) {
        pairs.push({
          from: economyGravityFromLabel(event),
          to: truncate(row.layer.label, 24),
          changeText: economyGravityChangeText(row),
          color: row.layer.color,
          kind: "Records",
          score: row.current * 10 + Math.max(0, row.delta) * 6,
        });
      }
    }
    return pairs.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  function economyGravityFromLabel(event) {
    const title = String(event?.title || event?.area || "Selected event");
    if (/Grand Central/i.test(title)) return "Grand Central";
    return truncate(title.replace(/\b(opened|approved|completed|variation)\b.*$/i, "").trim() || title, 18);
  }

  function economyGravityContextSourceLabels(context, selectedSources = []) {
    const labels = [];
    const pushLabel = (value) => {
      const label = String(value || "").trim();
      if (label && !labels.includes(label)) labels.push(label);
    };
    for (const event of [...context.nearbyCurrent, ...context.nearbyBefore]) {
      for (const sourceId of event.sourceIds || []) {
        const source = state.sourceById.get(sourceId);
        pushLabel(source?.display_name || source?.title || source?.provider || sourceId);
      }
    }
    if (state.economyAnchorFeatures.length) pushLabel("Current OSM economy anchors");
    for (const source of selectedSources) pushLabel(source.title || source.provider);
    return labels.slice(0, 5);
  }

  function renderCivicAccessGapsDetail(event, context, sources, provenanceFacts) {
    const ready = ensureDetailEvidenceLoaded(event);
    const gapRows = ready ? civicAccessGapRows() : [];
    const stats = ready ? civicAccessGuideStats(gapRows) : {};
    const summaryRows = ready ? civicAccessSummaryRows(context, stats) : [];
    const trendRows = ready ? civicAccessTrendRows(context) : [];
    const sourceLabels = ready ? civicAccessSourceLabels(context, sources) : [];
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head civic-access-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        ${renderDetailLensControls(event, context)}
        <div class="planning-caution stage-caution civic-access-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body civic-access-detail-body">
        ${ready ? `
          <section class="detail-section civic-access-summary-section">
            <h4>Access summary <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
            <div class="civic-access-summary-grid" role="table" aria-label="Civic access records and current guide summary">
              ${summaryRows.map((row) => `
                <div role="row">
                  <span>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(row.before)}</strong>
                  <strong>${escapeHtml(row.current)}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(row.change)}</em>
                </div>
              `).join("")}
            </div>
          </section>

          <section class="detail-section civic-access-gap-section">
            <h4>Underserved corridors <span>(current mapped guide)</span></h4>
            <div class="civic-access-gap-table" role="table" aria-label="Current access-gap guide segments by severity">
              ${gapRows.map((row) => `
                <div class="civic-access-gap-row" role="row" style="--accent:${escapeAttr(row.color)}">
                  <span><i></i>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(compactNumber(row.segments))}</strong>
                  <strong>${escapeHtml(formatCivicAccessLength(row.lengthM))}</strong>
                  <em>${escapeHtml(row.densityText)}</em>
                </div>
              `).join("")}
            </div>
            <div class="civic-access-note">Mapped guide lengths come from the current street/coverage geometry in this lens. They are descriptive linework, not measured travel-time or service-capacity results.</div>
            ${missingCoverage}
          </section>

          <section class="detail-section civic-access-explain-section">
            <h4>What this shows</h4>
            <p>${escapeHtml(civicAccessWhatThisShows(gapRows, stats))}</p>
            <h4>Prevalence</h4>
            <p>${escapeHtml(sourceLabels.join(", ") || "Civic-service records and current mapped service anchors")}</p>
            <div class="economy-caution civic-access-data-note"><span></span><p>Before/current counts are source-backed civic records. Current OSM anchors and guide seams may post-date the selected year when coverage is missing.</p></div>
          </section>

          <section class="detail-section civic-access-trend-section">
            <h4>Access trend <span>(source-backed records)</span></h4>
            <div class="civic-access-trend-list">
              ${trendRows.map((row) => `
                <div class="civic-access-trend-row" style="--accent:${escapeAttr(row.color)}">
                  <span>${escapeHtml(row.label)}</span>
                  ${renderCivicAccessTrendBars(row)}
                  <strong>${escapeHtml(compactNumber(row.current))}</strong>
                  <em data-positive="${row.delta >= 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
                </div>
              `).join("")}
            </div>
          </section>

          ${renderDetailLensEvidence(event)}

          ${sources.length ? `
            <section class="detail-section">
              <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
              ${sources.map(renderSourceRow).join("")}
            </section>
          ` : ""}

          ${provenanceFacts.length ? `
            <section class="detail-section">
              <h4>Provenance</h4>
              <div class="provenance-grid">
                ${provenanceFacts.map((fact) => `
                  <div class="provenance-row">
                    <span>${escapeHtml(fact.label)}</span>
                    <strong>${escapeHtml(fact.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        ` : `
          <section class="detail-section">
            <h4>Access summary</h4>
            <div class="lens-evidence-note">Loading source-backed civic context for ${context.beforeYear} and ${context.currentYear}.</div>
          </section>
        `}
      </div>
    `;
  }

  function civicAccessGuideFlows() {
    return (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "civic-access-gaps"
          && props.kind === "flow"
          && props.flow_role !== "gap_tick";
      });
  }

  function civicAccessGapRows() {
    const defs = civicAccessGapDefinitions();
    const byStyle = new Map(defs.map((def) => [def.id, {
      ...def,
      segments: 0,
      lengthM: 0,
      serviceDensityTotal: 0,
      densityCount: 0,
    }]));
    for (const feature of civicAccessGuideFlows()) {
      const props = feature.properties || {};
      if (props.flow_role !== "gap_seam") continue;
      const style = props.flow_style || "gap_low";
      const row = byStyle.get(style);
      if (!row) continue;
      row.segments += 1;
      row.lengthM += Math.max(0, geometryLineLengthMeters(feature.geometry) || 0);
      const density = Number(props.service_density);
      if (Number.isFinite(density)) {
        row.serviceDensityTotal += density;
        row.densityCount += 1;
      }
    }
    return defs.map((def) => {
      const row = byStyle.get(def.id) || def;
      const avgDensity = row.densityCount ? row.serviceDensityTotal / row.densityCount : 0;
      return {
        ...row,
        avgDensity,
        densityText: row.segments ? `${Math.round(avgDensity * 100)}% guide` : "no guide",
      };
    });
  }

  function civicAccessGapDefinitions() {
    return [
      { id: "gap_high", label: "High gap", color: "#df5138" },
      { id: "gap_medium", label: "Medium gap", color: "#ef8f21" },
      { id: "gap_low", label: "Low gap", color: "#e0b23f" },
      { id: "gap_adequate", label: "Adequate access", color: "#348f67" },
    ];
  }

  function civicAccessGuideStats(gapRows = civicAccessGapRows()) {
    const flows = civicAccessGuideFlows();
    let totalLengthM = 0;
    let serviceDensityTotal = 0;
    let stopDensityTotal = 0;
    let densityCount = 0;
    for (const feature of flows) {
      const props = feature.properties || {};
      totalLengthM += Math.max(0, geometryLineLengthMeters(feature.geometry) || 0);
      const serviceDensity = Number(props.service_density);
      const stopDensity = Number(props.stop_density);
      if (Number.isFinite(serviceDensity)) {
        serviceDensityTotal += serviceDensity;
        densityCount += 1;
      }
      if (Number.isFinite(stopDensity)) stopDensityTotal += stopDensity;
    }
    const underservedRows = gapRows.filter((row) => row.id === "gap_high" || row.id === "gap_medium");
    return {
      totalFlows: flows.length,
      totalLengthM,
      underservedSegments: underservedRows.reduce((sum, row) => sum + row.segments, 0),
      underservedLengthM: underservedRows.reduce((sum, row) => sum + row.lengthM, 0),
      avgServiceDensity: densityCount ? serviceDensityTotal / densityCount : 0,
      avgStopDensity: densityCount ? stopDensityTotal / densityCount : 0,
    };
  }

  function civicAccessSummaryRows(context, stats) {
    const categoryDelta = context.currentEvents.length - context.beforeEvents.length;
    const nearbyDelta = context.nearbyCurrent.length - context.nearbyBefore.length;
    return [
      {
        label: "Source-backed civic records",
        before: compactNumber(context.beforeEvents.length),
        current: compactNumber(context.currentEvents.length),
        change: formatSignedNumber(categoryDelta),
        positive: categoryDelta >= 0,
      },
      {
        label: "Nearby civic records",
        before: compactNumber(context.nearbyBefore.length),
        current: compactNumber(context.nearbyCurrent.length),
        change: formatSignedNumber(nearbyDelta),
        positive: nearbyDelta >= 0,
      },
      {
        label: "Mapped low-coverage length",
        before: "Guide",
        current: formatCivicAccessLength(stats.underservedLengthM),
        change: `${compactNumber(stats.underservedSegments)} seg`,
        positive: false,
      },
      {
        label: "Current guide lines",
        before: "Guide",
        current: compactNumber(stats.totalFlows),
        change: `${Math.round((stats.avgServiceDensity || 0) * 100)}% svc`,
        positive: (stats.avgServiceDensity || 0) >= 0.48,
      },
    ];
  }

  function civicAccessTrendRows(context) {
    const years = state.years
      .filter((year) => year <= context.currentYear && year >= context.currentYear - 4)
      .slice(-5);
    const defs = [
      { label: "All civic records", color: "#0f8d95", terms: null },
      { label: "Facilities / services", color: "#74449a", terms: ["facility", "service", "school", "centre", "center"] },
      { label: "Health / libraries", color: "#e85b1e", terms: ["health", "clinic", "hospital", "library"] },
      { label: "Access / coverage", color: "#ef8f21", terms: ["access", "coverage", "underserved", "gap", "walk", "bus"] },
    ];
    return defs.map((def) => {
      const values = years.map((year) => {
        const events = lensEventsForYear(year).filter((event) => event.category === "civic_services");
        return def.terms ? countEventsByTerms(events, def.terms) : events.length;
      });
      const current = values[values.length - 1] || 0;
      const before = values[0] || 0;
      return {
        ...def,
        values,
        current,
        delta: current - before,
      };
    });
  }

  function renderCivicAccessTrendBars(row) {
    const max = Math.max(1, ...row.values);
    return `
      <div class="civic-access-trend-bars" aria-hidden="true">
        ${row.values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function civicAccessWhatThisShows(gapRows, stats) {
    const strongest = gapRows
      .filter((row) => row.lengthM > 0)
      .sort((a, b) => b.lengthM - a.lengthM)
      .slice(0, 2);
    if (!strongest.length) return "No current access-gap guide seams are loaded for this selected area and year.";
    const labels = strongest.map((row) => row.label.toLowerCase()).join(" and ");
    return `${labels} account for the largest share of current mapped guide length near the selected event. The guide combines street geometry, civic-service records, and mapped service anchors; it does not claim measured travel time or causal impact.`;
  }

  function civicAccessSourceLabels(context, selectedSources = []) {
    const labels = [];
    const push = (value) => {
      const label = String(value || "").trim();
      if (label && !labels.includes(label)) labels.push(label);
    };
    [...context.nearbyBefore, ...context.nearbyCurrent].forEach((event) => {
      (event.sourceIds || []).forEach((sourceId) => {
        const source = state.sourceById.get(sourceId);
        push(source?.display_name || source?.title || source?.provider || sourceId);
      });
    });
    selectedSources.forEach((source) => push(source.title || source.provider));
    if (civicAccessGuideFlows().length) push("Current mapped service anchors");
    return labels.slice(0, 5);
  }

  function formatCivicAccessLength(value) {
    const meters = Math.max(0, Number(value) || 0);
    if (meters >= 1000) return `${(meters / 1000).toFixed(meters >= 10000 ? 1 : 2)} km`;
    return `${Math.round(meters)} m`;
  }

  function renderCivicDemandDetail(event, context, sources, provenanceFacts) {
    const ready = ensureDetailEvidenceLoaded(event);
    const serviceRows = ready ? civicDemandServiceRows(context) : [];
    const gapRows = ready ? civicDemandGapRows() : [];
    const shiftRows = ready ? civicDemandShiftRows(context) : [];
    const sourceLabels = ready ? civicDemandSourceLabels(context, sources) : [];
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head civic-demand-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Evidence brief</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        ${renderDetailLensControls(event, context)}
        <div class="civic-detail-tabs civic-demand-tabs" role="tablist" aria-label="Civic service-context filter">
          <button type="button" data-filter="all" data-active="true">All services</button>
          <button type="button" data-filter="changed" data-active="false">With change</button>
          <button type="button" data-filter="stable" data-active="false">No change</button>
        </div>
        <div class="planning-caution stage-caution civic-access-caution civic-demand-caution"><span></span><p>Associated nearby change; causation is not claimed <b>Not a forecast</b></p></div>
      </div>
      <div class="detail-body civic-demand-detail-body">
        ${ready ? `
          <section class="detail-section civic-demand-service-section">
            <h4>Service-context guide <span>(within ${escapeHtml(formatRadius(context.radiusM))})</span></h4>
            <div class="civic-demand-table" role="table" aria-label="Service-context guide by civic service type">
              <div class="civic-demand-head" role="row">
                <span>Service</span><span>Before rec.</span><span>Context index</span><span>Gap</span>
              </div>
              ${serviceRows.map((row) => `
                <div class="civic-demand-service-row" role="row" data-change="${row.changed ? "true" : "false"}" style="--accent:${escapeAttr(row.color)}">
                  <span><i></i>${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(row.beforeText)}</strong>
                  <strong>${escapeHtml(row.currentGuideText)}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(row.gapText)}</em>
                </div>
              `).join("")}
            </div>
            <div class="civic-demand-note">Index values come from visible service-context cells, context-flow guides, and mapped service anchors in this lens. They are descriptive proxy context, not measured service capacity.</div>
            ${missingCoverage}
          </section>

          <section class="detail-section civic-demand-explain-section">
            <h4>What this shows</h4>
            <p>${escapeHtml(civicDemandWhatThisShows(gapRows, serviceRows))}</p>
            <h4>Prevalence</h4>
            <p>${escapeHtml(sourceLabels.join(", ") || "Civic-service records and current mapped service anchors")}</p>
            <div class="economy-caution civic-access-data-note civic-demand-data-note"><span></span><p>Before/current records are source-backed civic rows. Current OSM anchors and service-context cells may post-date the selected year when same-category coverage is missing.</p></div>
          </section>

          <section class="detail-section civic-demand-gap-section">
            <h4>Context-signal band guide <span>(current mapped cells)</span></h4>
            <div class="civic-demand-gap-grid">
              ${renderCivicDemandDonut(gapRows)}
              <div class="civic-demand-gap-list" role="table" aria-label="Service-context cells by guide band">
                ${gapRows.map((row) => `
                  <div class="civic-demand-gap-row" role="row" style="--accent:${escapeAttr(row.color)}">
                    <span><i></i>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(compactNumber(row.cells))}</strong>
                    <em>${escapeHtml(row.shareText)}</em>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>

          <section class="detail-section civic-demand-shift-section">
            <h4>Top civic-service record/context changes <span>(source-backed records)</span></h4>
            <div class="civic-demand-shift-list">
              ${shiftRows.map((row) => `
                <div class="civic-demand-shift-row" style="--accent:${escapeAttr(row.color)}">
                  <span>${escapeHtml(row.label)}</span>
                  ${renderCivicDemandSpark(row)}
                  <strong>${escapeHtml(row.currentText)}</strong>
                  <em data-positive="${row.positive}">${escapeHtml(row.changeText)}</em>
                </div>
              `).join("") || `<div class="lens-evidence-note">No source-backed civic records are loaded near this selected event for the comparison years.</div>`}
            </div>
          </section>

          ${renderDetailLensEvidence(event)}

          ${sources.length ? `
            <section class="detail-section">
              <h4>Selected event sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> / ${sources.length}</span></h4>
              ${sources.map(renderSourceRow).join("")}
            </section>
          ` : ""}

          ${provenanceFacts.length ? `
            <section class="detail-section">
              <h4>Provenance</h4>
              <div class="provenance-grid">
                ${provenanceFacts.map((fact) => `
                  <div class="provenance-row">
                    <span>${escapeHtml(fact.label)}</span>
                    <strong>${escapeHtml(fact.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        ` : `
          <section class="detail-section">
            <h4>Service-context guide</h4>
            <div class="lens-evidence-note">Loading source-backed civic context for ${context.beforeYear} and ${context.currentYear}.</div>
          </section>
        `}
      </div>
    `;
  }

  function wireCivicDemandDetail(root) {
    wireDetailLensControls(root);
    wireEvidenceEventButtons(root);
    const buttons = [...(root?.querySelectorAll(".civic-demand-tabs button") || [])];
    const rows = [...(root?.querySelectorAll(".civic-demand-service-row") || [])];
    const setFilter = (filter) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.filter === filter));
      rows.forEach((row) => {
        const changed = row.dataset.change === "true";
        row.hidden = filter === "changed" ? !changed : filter === "stable" ? changed : false;
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter || "all")));
    setFilter("all");
  }

  function civicDemandGuideCells() {
    return (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "civic-demand" && props.surface_style === "demand_surface";
      });
  }

  function civicDemandGuideFlows() {
    return (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "civic-demand" && props.flow_style === "demand_displacement";
      });
  }

  function civicDemandGuideNodes() {
    return (state.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "civic-demand" && props.node_style === "civic_anchor";
      });
  }

  function civicDemandServiceDefs() {
    return ["civic_services", "health", "libraries", "leisure", "council", "safety"].map((id) => ({
      id,
      label: civicServiceSublayerLabel(id),
      color: civicServiceSublayerColor(id),
    }));
  }

  function civicDemandServiceRows(context) {
    const cells = civicDemandGuideCells();
    const flows = civicDemandGuideFlows();
    const nodes = civicDemandGuideNodes();
    const totalFlows = Math.max(1, flows.length);
    const totalNodes = Math.max(1, nodes.length);
    const totalCurrent = Math.max(1, context.currentEvents.length);
    return civicDemandServiceDefs().map((def) => {
      const before = context.beforeEvents.filter((event) => civicServiceSublayerKey(event) === def.id).length;
      const current = context.currentEvents.filter((event) => civicServiceSublayerKey(event) === def.id).length;
      const typeCells = cells.filter((feature) => (feature.properties || {}).service_type === def.id);
      const typeFlows = flows.filter((feature) => (feature.properties || {}).service_sublayer === def.id);
      const typeNodes = nodes.filter((feature) => (feature.properties || {}).sublayer_id === def.id);
      const avgDemand = civicDemandAverage(typeCells, "intensity");
      const avgDriver = civicDemandAverage(typeCells, "demand_driver_density");
      const avgService = civicDemandAverage(typeCells, "service_density");
      const demandIndex = Math.round(clamp01(
        avgDemand * 0.58
        + avgDriver * 0.22
        + (typeFlows.length / totalFlows) * 0.2,
      ) * 100);
      const provisionIndex = Math.round(clamp01(
        avgService * 0.5
        + (typeNodes.length / totalNodes) * 0.3
        + (current / totalCurrent) * 0.2,
      ) * 100);
      const gap = demandIndex - provisionIndex;
      return {
        ...def,
        before,
        current,
        demandIndex,
        provisionIndex,
        gap,
        beforeText: compactNumber(before),
        currentGuideText: `Index ${compactNumber(provisionIndex)}`,
        gapText: gap > 0 ? `+${compactNumber(gap)} idx` : gap < 0 ? `-${compactNumber(Math.abs(gap))} idx` : "0 idx",
        positive: gap <= 0,
        changed: current !== before || typeFlows.length > 0 || Math.abs(gap) >= 6,
      };
    });
  }

  function civicDemandAverage(features, property) {
    let total = 0;
    let count = 0;
    for (const feature of features || []) {
      const value = Number((feature.properties || {})[property]);
      if (!Number.isFinite(value)) continue;
      total += value;
      count += 1;
    }
    return count ? total / count : 0;
  }

  function civicDemandGapRows() {
    const defs = [
      { id: "very_high", label: "Very high context signal", color: "#cf3d4d" },
      { id: "high", label: "High context signal", color: "#ed7c62" },
      { id: "medium", label: "Medium context signal", color: "#efc06d" },
      { id: "low", label: "Low context signal", color: "#8fbfba" },
      { id: "surplus", label: "Provision context", color: "#55a39d" },
    ];
    const rows = new Map(defs.map((def) => [def.id, { ...def, cells: 0, intensityTotal: 0 }]));
    for (const feature of civicDemandGuideCells()) {
      const props = feature.properties || {};
      const intensity = Number(props.intensity || 0);
      const surplus = Number(props.service_surplus || 0);
      const color = String(props.color || "").toLowerCase();
      const id = surplus > 0.11 || color === "#55a39d" || color === "#8fbfba"
        ? "surplus"
        : intensity >= 0.72
        ? "very_high"
        : intensity >= 0.56
        ? "high"
        : intensity >= 0.38
        ? "medium"
        : "low";
      const row = rows.get(id);
      row.cells += 1;
      row.intensityTotal += Number.isFinite(intensity) ? intensity : 0;
    }
    const total = [...rows.values()].reduce((sum, row) => sum + row.cells, 0);
    return defs.map((def) => {
      const row = rows.get(def.id) || def;
      const share = total ? Math.round((row.cells / total) * 100) : 0;
      return {
        ...row,
        share,
        shareText: row.cells ? `${share}%` : "0%",
        avgIntensity: row.cells ? row.intensityTotal / row.cells : 0,
      };
    });
  }

  function renderCivicDemandDonut(gapRows) {
    const total = gapRows.reduce((sum, row) => sum + row.cells, 0);
    let cursor = 0;
    const segments = total
      ? gapRows
        .filter((row) => row.cells > 0)
        .map((row) => {
          const start = cursor;
          cursor += (row.cells / total) * 100;
          return `${row.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
        })
        .join(", ")
      : "#e4ded4 0% 100%";
    return `
      <div class="civic-demand-donut" style="--donut:${escapeAttr(segments)}" aria-label="${escapeAttr(`${compactNumber(total)} current service-context guide cells`)}">
        <strong>${escapeHtml(compactNumber(total))}</strong>
        <span>cells</span>
      </div>
    `;
  }

  function civicDemandShiftRows(context) {
    const years = state.years
      .filter((year) => year <= context.currentYear && year >= context.currentYear - 4)
      .slice(-5);
    const groups = new Map();
    const addEvent = (event, period) => {
      if (!event?.lngLat) return;
      const key = event.area || civicServiceSublayerKey(event);
      const layerId = civicServiceSublayerKey(event);
      const current = groups.get(key) || {
        key,
        label: truncate(event.area || civicServiceSublayerLabel(layerId), 28),
        color: civicServiceSublayerColor(layerId),
        before: 0,
        current: 0,
        layerId,
      };
      current[period] += 1;
      groups.set(key, current);
    };
    eventsNear(context.center, context.beforeEvents, context.radiusM * 1.55).forEach((event) => addEvent(event, "before"));
    eventsNear(context.center, context.currentEvents, context.radiusM * 1.55).forEach((event) => addEvent(event, "current"));
    let rows = [...groups.values()].map((row) => {
      const values = years.map((year) => {
        const events = lensEventsForYear(year).filter((event) =>
          event.category === "civic_services"
          && (event.area || civicServiceSublayerKey(event)) === row.key
          && event.lngLat
          && lngLatDistanceMeters(context.center, event.lngLat) <= context.radiusM * 1.55
        );
        return events.length;
      });
      const delta = row.current - row.before;
      return {
        ...row,
        values,
        delta,
        currentText: compactNumber(row.current),
        changeText: formatSignedNumber(delta),
        positive: delta <= 0 ? false : true,
        score: Math.abs(delta) * 4 + row.current * 2 + values.reduce((sum, value) => sum + value, 0),
      };
    });
    if (rows.length < 4) {
      const guideRows = civicDemandGuideServiceShiftRows(years);
      const existing = new Set(rows.map((row) => row.layerId));
      rows = [
        ...rows,
        ...guideRows.filter((row) => !existing.has(row.layerId)).slice(0, 4 - rows.length),
      ];
    }
    return rows
      .sort((a, b) => b.score - a.score || String(a.label).localeCompare(String(b.label)))
      .slice(0, 5);
  }

  function civicDemandGuideServiceShiftRows(years) {
    const serviceCounts = new Map();
    for (const feature of civicDemandGuideFlows()) {
      const layerId = (feature.properties || {}).service_sublayer || "civic_services";
      serviceCounts.set(layerId, (serviceCounts.get(layerId) || 0) + 1);
    }
    for (const feature of civicDemandGuideCells()) {
      const layerId = (feature.properties || {}).service_type || "";
      if (!layerId) continue;
      serviceCounts.set(layerId, (serviceCounts.get(layerId) || 0) + 1);
    }
    return [...serviceCounts.entries()].map(([layerId, count]) => {
      const values = years.map((year) => lensEventsForYear(year)
        .filter((event) => event.category === "civic_services" && civicServiceSublayerKey(event) === layerId)
        .length);
      return {
        label: civicServiceSublayerLabel(layerId),
        layerId,
        color: civicServiceSublayerColor(layerId),
        values: values.some(Boolean) ? values : [count],
        currentText: `${compactNumber(count)} guide`,
        changeText: "context",
        positive: true,
        guideOnly: true,
        score: count,
      };
    });
  }

  function renderCivicDemandSpark(row) {
    const values = row.values?.length ? row.values : [0];
    const max = Math.max(1, ...values);
    return `
      <div class="civic-demand-spark" aria-hidden="true">
        ${values.map((value) => `<i style="height:${Math.max(3, Math.round((value / max) * 18))}px"></i>`).join("")}
      </div>
    `;
  }

  function civicDemandWhatThisShows(gapRows, serviceRows) {
    const strongestGap = [...gapRows]
      .filter((row) => row.cells > 0)
      .sort((a, b) => b.cells - a.cells)[0];
    const strongestService = [...serviceRows]
      .sort((a, b) => b.demandIndex - a.demandIndex)[0];
    if (!strongestGap && !strongestService) return "No service-context guide cells are loaded for this selected area and year.";
    const gapText = strongestGap ? `${strongestGap.label.toLowerCase()} cells form the largest current guide band` : "The current guide has limited cell coverage";
    const serviceText = strongestService ? `${strongestService.label.toLowerCase()} has the strongest service-context signal` : "service-specific context is not available";
    return `${gapText}, while ${serviceText}. The guide combines source-backed civic records, current mapped service anchors, and nearby change context; it is a descriptive context index, not a population forecast or causal estimate.`;
  }

  function civicDemandSourceLabels(context, selectedSources = []) {
    const labels = [];
    const push = (value) => {
      const label = String(value || "").trim();
      if (label && !labels.includes(label)) labels.push(label);
    };
    [...context.nearbyBefore, ...context.nearbyCurrent].forEach((event) => {
      (event.sourceIds || []).forEach((sourceId) => {
        const source = state.sourceById.get(sourceId);
        push(source?.display_name || source?.title || source?.provider || sourceId);
      });
    });
    selectedSources.forEach((source) => push(source.title || source.provider));
    if (civicDemandGuideNodes().length) push("Current mapped civic-service anchors");
    if (civicDemandGuideCells().length) push("Service-context guide cells");
    return labels.slice(0, 5);
  }

  function renderCivicCatchmentDetail(event, context, sources, provenanceFacts) {
    const facilities = civicCatchmentClosestFacilities(context);
    const serviceRows = civicCatchmentServiceRows(context, facilities);
    const edges = civicCatchmentUnderservedEdges(context, facilities);
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
    return `
      <div class="detail-head lens-detail-head civic-catchment-detail-head" style="--accent:${context.lens.accent || context.layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-eyebrow">Change around this event</div>
        <div class="planning-detail-subtitle">${escapeHtml(eventSubtitleLine(event))}</div>
        <h2 class="detail-title">${escapeHtml(event.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(event.area || "Unknown area")}</span>
          ${event.lngLat ? `<span class="sep">.</span><span style="font-family:var(--font-mono);font-size:10.5px">${event.lngLat[1].toFixed(3)}, ${event.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
        <div class="civic-detail-tabs" role="tablist" aria-label="Civic service filter">
          <button type="button" data-filter="all" data-active="true">All services</button>
          <button type="button" data-filter="changed" data-active="false">With change</button>
          <button type="button" data-filter="stable" data-active="false">No change</button>
        </div>
      </div>
      <div class="detail-body civic-catchment-detail-body">
        ${renderDetailLensControls(event, context)}
        <section class="detail-section civic-facility-panel">
          <h4>Closest facilities <span>(straight-line)</span></h4>
          <div class="civic-facility-list">
            ${facilities.slice(0, 6).map((facility) => `
              <div class="civic-facility-row" data-change="${facility.changed ? "true" : "false"}" style="--accent:${escapeAttr(facility.color)}">
                <i aria-hidden="true"></i>
                <div>
                  <strong>${escapeHtml(facility.label)}</strong>
                  <span>${escapeHtml(facility.typeLabel)} · ${escapeHtml(formatDistanceMeters(facility.distance))}</span>
                </div>
                <em data-tone="${escapeAttr(facility.tone)}">${escapeHtml(facility.capacity)}</em>
                <b>${facility.changed ? "↗" : "→"}</b>
              </div>
            `).join("") || `<div class="lens-evidence-note">No nearby service anchors are loaded for this year.</div>`}
          </div>
        </section>

        <section class="detail-section civic-edge-panel">
          <h4>Low-context guide edges</h4>
          ${edges.map((edge) => `
            <div class="civic-edge-row">
              <span><i style="--edge:${escapeAttr(edge.color)}"></i>${escapeHtml(edge.label)}</span>
              <strong>${escapeHtml(edge.lengthText)}</strong>
            </div>
          `).join("")}
        </section>

        <section class="detail-section civic-service-panel">
          <h4>Prevalence</h4>
          <p>Civic service context</p>
          <div class="economy-caution civic-caution"><span></span><p>OSM mapped visibility may differ from real-world data.</p></div>
          ${missingCoverage}
          <h4>Service type context</h4>
          <div class="civic-service-table">
            <div class="civic-service-head">
              <span></span><span>Context index</span><span>Change</span>
            </div>
            ${serviceRows.map((row) => `
              <div class="civic-service-row" style="--accent:${escapeAttr(row.color)}">
                <span><i></i>${escapeHtml(row.label)}</span>
                <strong>${escapeHtml(row.coverageText)}</strong>
                <em data-positive="${row.delta >= 0}">${escapeHtml(formatSignedNumber(row.delta))}</em>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="detail-section civic-context-panel">
          <h4>Evidence context</h4>
          <p>Catchment cells are derived evidence areas around source-backed records and current mapped service anchors; they are not official service boundaries.</p>
          ${renderDetailLensEvidence(event)}
          ${sources.length ? sources.map(renderSourceRow).join("") : `<div class="lens-evidence-note">No source rows are attached to the selected event.</div>`}
          ${provenanceFacts.length ? `
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
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

  function wireCivicCatchmentDetail(root) {
    const buttons = [...(root?.querySelectorAll(".civic-detail-tabs button") || [])];
    const rows = [...(root?.querySelectorAll(".civic-facility-row") || [])];
    const setFilter = (filter) => {
      buttons.forEach((button) => button.dataset.active = String(button.dataset.filter === filter));
      rows.forEach((row) => {
        const changed = row.dataset.change === "true";
        row.hidden = filter === "changed" ? !changed : filter === "stable" ? changed : false;
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter || "all")));
    setFilter("all");
  }

  function civicCatchmentClosestFacilities(context) {
    const sourceEvents = lensEventsForYear(context.currentYear)
      .filter((event) => event.category === "civic_services" && event.lngLat);
    const candidates = civicCatchmentCandidates(context.center, context.radiusM, context.lens, sourceEvents, context.currentYear);
    return selectCivicCatchmentCandidates(context.center, candidates, context.lens, 54)
      .map((item) => {
        const label = truncate(item.event?.title || item.props?.label || item.props?.title || civicServiceSublayerLabel(item.layerId), 34);
        const capacity = item.intensity > 0.68 ? "High signal" : item.intensity > 0.48 ? "Medium signal" : "Low signal";
        return {
          label,
          typeLabel: civicServiceSublayerLabel(item.layerId).replace(/s$/, ""),
          distance: item.distance,
          changed: !item.currentContext || Boolean(item.event),
          color: civicServiceSublayerColor(item.layerId),
          capacity,
          tone: capacity.toLowerCase().replace(/\s+/g, "-"),
          layerId: item.layerId,
          intensity: item.intensity,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  function civicCatchmentServiceRows(context, facilities) {
    const facilityCounts = new Map();
    facilities.forEach((item) => facilityCounts.set(item.layerId, (facilityCounts.get(item.layerId) || 0) + 1));
    return lensLayers(context.lens).map((layer) => {
      const count = facilityCounts.get(layer.id) || 0;
      const before = aspectLayerEventMatches(context.beforeEvents, layer).length;
      const current = aspectLayerEventMatches(context.currentEvents, layer).length;
      const coverage = Math.max(32, Math.min(96, Math.round(48 + count * 4.8 + current * 0.8)));
      return {
        label: layer.label,
        color: layer.color,
        coverageText: `Index ${coverage}`,
        delta: current - before,
      };
    });
  }

  function civicCatchmentUnderservedEdges(context, facilities) {
    const low = facilities.filter((item) => item.intensity < 0.48).length;
    const veryLow = facilities.filter((item) => item.intensity < 0.34).length;
    const baseKm = Math.max(0.4, context.radiusM / 1000);
    return [
      { label: "Very low context signal", color: "#df7d65", lengthText: `${(veryLow * baseKm * 0.42 + 0.8).toFixed(1)} km` },
      { label: "Low context signal", color: "#e5b85f", lengthText: `${(low * baseKm * 0.36 + 1.4).toFixed(1)} km` },
    ];
  }

  function formatDistanceMeters(distance) {
    const value = Number(distance) || 0;
    if (value >= 1000) return `${(value / 1000).toFixed(2)} km`;
    return `${Math.round(value)} m`;
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
        { label: "Access radius", value: formatRadius(context.radiusM), hint: "generated access-proxy fabric", tone: "teal" },
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
        { label: "Context index", value: `${Math.min(160, 40 + nearbyIndex)}`, hint: "derived context" },
        common[1],
        common[0],
        common[2],
      ],
      "economy-vitality": [
        { label: "Record ribbons", value: detailStatus, hint: "frontage geometry" },
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
        { label: "Context traces", value: detailStatus, hint: "utility trace geometry" },
        common[1],
        common[0],
        common[2],
      ],
      "utilities-resilience": [
        { label: "Utility-context nodes", value: compactNumber(Math.min(5, Math.max(1, Math.round(context.nearbyCurrent.length / 3)))), hint: "generated route nodes" },
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
    const missingCoverage = lensMissingSameCategoryCoverageForYear(context.lens, context.currentYear)
      ? `<div class="lens-causality-note">${escapeHtml(missingSameCategoryCoverageNote(context.lens, context.category, context.currentYear))}</div>`
      : "";
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
        ${missingCoverage}
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
      els.detailPanel.setAttribute("aria-labelledby", "detailEmptyTitle");
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

    if (lens.id === "transport-speed") {
      els.detailInner.innerHTML = renderTransportSpeedDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireTransportSpeedDetail(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "utilities-capacity") {
      els.detailInner.innerHTML = renderUtilitiesCapacityDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "planning-pressure") {
      els.detailInner.innerHTML = renderPlanningPressureDetail(e, context, confidence, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      wirePlanningPressureDetail(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "planning-delta" || lens.id === "planning-parcels") {
      els.detailInner.innerHTML = renderPlanningStageDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wirePlanningStageDetail(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "economy-vitality") {
      els.detailInner.innerHTML = renderEconomyVitalityDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      wireEconomyVitalityDetail(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "economy-land-use") {
      els.detailInner.innerHTML = renderEconomyLandUseDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "economy-gravity") {
      els.detailInner.innerHTML = renderEconomyGravityDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "civic-access-gaps") {
      els.detailInner.innerHTML = renderCivicAccessGapsDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "civic-demand") {
      els.detailInner.innerHTML = renderCivicDemandDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireCivicDemandDetail(els.detailInner);
      finalizeDetailAccessibility();
      return;
    }
    if (lens.id === "civic-catchment") {
      els.detailInner.innerHTML = renderCivicCatchmentDetail(e, context, sources, provenanceFacts);
      els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
      wireDetailLensControls(els.detailInner);
      wireEvidenceEventButtons(els.detailInner);
      wireCivicCatchmentDetail(els.detailInner);
      finalizeDetailAccessibility();
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
        ${e.subtitle ? `<div class="planning-detail-subtitle">${escapeHtml(e.subtitle)}</div>` : ""}
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
            <strong>${escapeHtml(e.shortDescription || e.details || e.summary || e.title)}</strong>
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
          <button class="btn" id="detailExportMarkdownAction" style="flex:1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Export evidence brief
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
    els.detailInner.querySelector("#detailExportMarkdownAction")?.addEventListener("click", () => exportSelectedMarkdown());
    els.detailInner.querySelector("#detailShare")?.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("city", state.cityId);
      url.searchParams.set("year", String(state.year));
      url.searchParams.set("lens", state.activeAspect || state.activeLens);
      url.searchParams.set("event", state.selectedEventId);
      state.areaFilter ? url.searchParams.set("area", state.areaFilter) : url.searchParams.delete("area");
      state.search ? url.searchParams.set("q", state.search) : url.searchParams.delete("q");
      state.confidenceFilter !== "all" ? url.searchParams.set("confidence", state.confidenceFilter) : url.searchParams.delete("confidence");
      state.showInferred ? url.searchParams.delete("inferred") : url.searchParams.set("inferred", "0");
      await copyText(url.toString(), "Event permalink copied");
    });
    finalizeDetailAccessibility();
  }

  function finalizeDetailAccessibility() {
    const title = els.detailInner?.querySelector(".detail-title");
    if (!title) return;
    title.id = "detailTitle";
    title.setAttribute("tabindex", "-1");
    els.detailPanel?.setAttribute("aria-labelledby", "detailTitle");
    const body = els.detailInner?.querySelector(".detail-body");
    const event = state.selectedEvent;
    if (!body || !event) return;
    const context = buildLensContext(event);
    if (!body.querySelector(".detail-meaning-card")) {
      const card = document.createElement("section");
      card.className = "detail-meaning-card";
      card.innerHTML = renderDetailMeaningCard(event, context);
      body.insertBefore(card, body.firstChild);
    }
    if (!body.querySelector(".detail-cross-lens-card")) {
      ensureDetailEvidenceLoaded(event);
      const card = document.createElement("section");
      card.className = "detail-cross-lens-card";
      card.innerHTML = renderCrossLensChangeSnapshot(event, context);
      const meaningCard = body.querySelector(".detail-meaning-card");
      body.insertBefore(card, meaningCard?.nextSibling || body.firstChild);
      wireCrossLensSnapshot(card);
    }
  }

  function focusDetailPanel() {
    const target = els.detailInner?.querySelector(".detail-title") || els.detailInner?.querySelector(".detail-close");
    target?.focus?.({ preventScroll: true });
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

  function renderDetailMeaningCard(event, context = buildLensContext(event)) {
    const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
    const confidence = confidenceDescriptor(event.confidence);
    const sourceCount = eventSourceCount(event);
    const when = event.effectiveDate || String(event.year);
    const summary = event.shortDescription || event.details || event.summary || event.title;
    const caveat = event.confidence === "inferred"
      ? "This is an inferred mapped-visibility record. Treat the date as map evidence, not a confirmed construction or opening date."
      : "This is an observed record from public evidence. Nearby lens context is descriptive; it is evidence context only, not a causal claim.";
    const contextLine = context?.lens
      ? `${context.lens.label} shows nearby source-backed records and mapped context within ${formatRadius(context.radiusM)}.`
      : "The active lens shows nearby source-backed records and mapped context.";
    return `
      <div class="detail-meaning-head">
        <span style="--accent:${escapeAttr(context?.lens?.accent || layer.color)}"></span>
        <div>
          <strong>What this record means</strong>
          <p>${escapeHtml(summary)}</p>
        </div>
      </div>
      <dl class="detail-meaning-facts">
        <div><dt>When</dt><dd>${escapeHtml(when)}${event.datePrecision ? ` (${escapeHtml(event.datePrecision)})` : ""}</dd></div>
        <div><dt>Where</dt><dd>${escapeHtml(event.area || "Location not stated")}</dd></div>
        <div><dt>Evidence</dt><dd>${escapeHtml(confidence.label)} / ${sourceCount} source row${sourceCount === 1 ? "" : "s"}</dd></div>
        <div><dt>Lens context</dt><dd>${escapeHtml(contextLine)}</dd></div>
      </dl>
      <div class="detail-meaning-note">${escapeHtml(caveat)}</div>
    `;
  }

  function renderCrossLensChangeSnapshot(event, context = buildLensContext(event)) {
    const { before, after } = detailEvidenceYears(event);
    const loaded = [before, after]
      .filter((year) => state.chunks.has(year))
      .every((year) => state.loadedEvents.has(year));
    const activeCategory = context?.category || activeMapLens()?.category || state.activeLens;
    const rows = LAYERS.map((layer) => crossLensChangeRow(layer, event, before, after, loaded, activeCategory));
    const sourceText = loaded
      ? `Nearby source-backed records in ${before} and ${after}, using each lens study radius.`
      : `Loading nearby records for ${before} and ${after}.`;
    return `
      <div class="detail-cross-lens-head">
        <div>
          <strong>Changes by lens</strong>
          <p>${escapeHtml(sourceText)} Counts are descriptive context, not causal outcomes.</p>
        </div>
        <span>source counts</span>
      </div>
      <div class="cross-lens-grid" aria-label="Nearby source-backed changes by lens">
        <div class="cross-lens-header" aria-hidden="true">
          <span>Lens</span><span>${before}</span><span>${after}</span><span>Change</span>
        </div>
        ${rows.map(renderCrossLensRow).join("")}
      </div>
    `;
  }

  function crossLensChangeRow(layer, event, before, after, loaded, activeCategory) {
    const lenses = LENS_ASPECTS_BY_CATEGORY.get(layer.id) || [];
    const aspect = lenses[0] || null;
    const radiusM = aspect ? lensEffectiveRadiusM(aspect) : lensEffectiveRadiusM(activeMapLens());
    const center = event?.lngLat || currentMapCenter();
    const beforeEvents = loaded ? sourceEventsForLensYear(before, aspect, layer.id) : [];
    const afterEvents = loaded ? sourceEventsForLensYear(after, aspect, layer.id) : [];
    const beforeNear = loaded ? eventsNear(center, beforeEvents, radiusM).length : null;
    const afterNear = loaded ? eventsNear(center, afterEvents, radiusM).length : null;
    const change = loaded ? afterNear - beforeNear : null;
    return {
      layer,
      aspect,
      before: beforeNear,
      after: afterNear,
      change,
      radiusM,
      active: layer.id === activeCategory,
    };
  }

  function renderCrossLensRow(row) {
    const { layer, aspect } = row;
    const label = aspect ? `${layer.label}: ${aspect.label}` : layer.label;
    const disabled = aspect ? "" : "disabled";
    const title = aspect
      ? `Switch to ${lensDomainLabel(aspect)} / ${aspect.label} (${formatRadius(row.radiusM)} study radius)`
      : "No dedicated map lens is available for this category yet";
    const before = row.before === null ? "..." : compactNumber(row.before);
    const after = row.after === null ? "..." : compactNumber(row.after);
    const change = row.change === null ? "..." : formatSignedNumber(row.change);
    return `
      <button class="cross-lens-row" type="button" style="--accent:${escapeAttr(layer.color)}" data-aspect="${escapeAttr(aspect?.id || "")}" data-active="${row.active}" ${disabled} title="${escapeAttr(title)}" aria-label="${escapeAttr(`${label}. ${before} before, ${after} current, change ${change}. ${title}`)}">
        <span class="cross-lens-name"><i aria-hidden="true"></i><b>${escapeHtml(layer.label)}</b><small>${escapeHtml(aspect?.shortLabel || aspect?.label || "No lens")}</small></span>
        <span>${escapeHtml(before)}</span>
        <span>${escapeHtml(after)}</span>
        <strong data-positive="${row.change !== null && row.change >= 0}">${escapeHtml(change)}</strong>
      </button>
    `;
  }

  function wireCrossLensSnapshot(root) {
    root?.querySelectorAll(".cross-lens-row[data-aspect]").forEach((button) => {
      const aspectId = button.getAttribute("data-aspect");
      if (!aspectId) return;
      const choose = () => setActiveAspect(aspectId);
      button.addEventListener("click", choose);
      addPressHandler(button, choose);
    });
  }

  function renderSourceRow(source) {
    const meta = [
      source.provider,
      source.licence ? `Licence: ${source.licence}` : "",
      source.accessed ? `Retrieved: ${source.accessed}` : "",
      source.recordId ? `Record: ${source.recordId}` : "",
      source.filePath ? `File: ${source.filePath}` : "",
    ].filter(Boolean).map(displaySourceText);
    const body = `
      <div class="source-kind">${escapeHtml(displaySourceText(source.kind))}</div>
      <div class="source-title">
        <strong>${escapeHtml(displaySourceText(source.title))}</strong>
        ${meta.length ? `<span class="source-meta">${meta.map(escapeHtml).join(" / ")}</span>` : ""}
        ${source.attribution ? `<span class="source-note">${escapeHtml(displaySourceText(source.attribution))}</span>` : ""}
      </div>
      <div class="source-year">${escapeHtml(source.year)}</div>`;
    if (!source.url) return `<div class="source-row">${body}</div>`;
    return `<a class="source-row" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`;
  }

  function displaySourceText(value) {
    return String(value || "")
      .replace(/\bsatellite\b/gi, "aerial")
      .replace(/\bwayback\b/gi, "historic")
      .replace(/\bimagery\b/gi, "media");
  }

  function exportSelectedMarkdown() {
    const event = state.selectedEvent || (state.selectedEventId ? state.eventById.get(state.selectedEventId) : null);
    if (!event) {
      toast("Select a source-backed record before exporting a brief");
      return;
    }
    downloadText(
      `${safeFileToken(state.cityId)}-${safeFileToken(activeMapLens()?.id)}-${safeFileToken(event.id)}-evidence.md`,
      "text/markdown;charset=utf-8",
      markdownForEvent(event),
    );
    toast("Evidence brief exported");
  }

  function exportSelectedGeojson() {
    const event = state.selectedEvent || (state.selectedEventId ? state.eventById.get(state.selectedEventId) : null);
    if (!event) {
      toast("Select a source-backed record before exporting GeoJSON");
      return;
    }
    downloadText(
      `${safeFileToken(state.cityId)}-${safeFileToken(activeMapLens()?.id)}-${safeFileToken(event.id)}.geojson`,
      "application/geo+json;charset=utf-8",
      JSON.stringify(featureCollectionForEvents([event]), null, 2),
    );
    toast("Selected record GeoJSON exported");
  }

  function exportFilteredCsv() {
    const events = filteredEvents();
    if (!events.length) {
      toast("No filtered records to export");
      return;
    }
    const areaToken = state.areaFilter ? `-${safeFileToken(state.areaFilter)}` : "";
    downloadText(
      `${safeFileToken(state.cityId)}-${safeFileToken(activeMapLens()?.id)}-${state.year}${areaToken}-records.csv`,
      "text/csv;charset=utf-8",
      csvForEvents(events),
    );
    toast("Filtered CSV exported");
  }

  function exportFilteredGeojson() {
    const events = filteredEvents();
    if (!events.length) {
      toast("No filtered records to export");
      return;
    }
    const areaToken = state.areaFilter ? `-${safeFileToken(state.areaFilter)}` : "";
    downloadText(
      `${safeFileToken(state.cityId)}-${safeFileToken(activeMapLens()?.id)}-${state.year}${areaToken}-records.geojson`,
      "application/geo+json;charset=utf-8",
      JSON.stringify(featureCollectionForEvents(events), null, 2),
    );
    toast("Filtered GeoJSON exported");
  }

  function markdownForEvent(event) {
    const lens = activeMapLens();
    const contract = activeLensContractRow(lens);
    const rows = buildSourceRows(event);
    const facts = buildProvenanceFacts(event);
    const lines = [
      `# ${event.title}`,
      "",
      `- City: ${state.city?.display_name || state.cityId}`,
      `- Lens: ${lens?.label || lens?.id || state.activeAspect}`,
      `- Contract label: ${contract?.public_label || lens?.label || ""}`,
      `- Effective date: ${event.effectiveDate || String(event.year)}`,
      `- Date precision: ${event.datePrecision || "not stated"}`,
      `- Confidence: ${confidenceDescriptor(event.confidence).label}`,
      `- Area: ${event.area || "not stated"}`,
      `- Geometry: ${event.lngLat ? `${event.lngLat[1].toFixed(6)}, ${event.lngLat[0].toFixed(6)}` : "not supplied"}`,
      "",
      "## Summary",
      "",
      event.shortDescription || event.summary || "No plain-language summary supplied.",
      "",
      "## Provenance",
      "",
      ...facts.map((fact) => `- ${fact.label}: ${fact.value}`),
      "",
      "## Sources",
      "",
      ...(rows.length ? rows.flatMap((source, index) => [
        `${index + 1}. ${source.title}`,
        `   - Publisher: ${source.provider || "not stated"}`,
        `   - Licence: ${source.licence || "not stated"}`,
        `   - Accessed/reviewed: ${source.accessed || "not stated"}`,
        `   - URL: ${source.url || "not supplied"}`,
        `   - Record/file: ${source.recordId || source.filePath || "not stated"}`,
        source.attribution ? `   - Attribution: ${source.attribution}` : "",
      ].filter(Boolean)) : ["No source rows were available in the normalized event."]),
      "",
      "## Limitations",
      "",
      ...(event.caveats?.length ? event.caveats.map((caveat) => `- ${caveat}`) : ["- No event-specific limitation text supplied; review sources before reuse."]),
      "",
      "## Correction Path",
      "",
      "Use CONTRIBUTING.md#correction-flow and include the event id, source id, replacement evidence URL, date basis, licence, and geometry note.",
    ];
    return lines.join("\n");
  }

  function csvForEvents(events) {
    const headers = [
      "event_id",
      "title",
      "city_id",
      "lens",
      "filter_area",
      "year",
      "effective_date",
      "date_precision",
      "confidence",
      "area",
      "source_ids",
      "source_count",
      "licenses",
      "source_urls",
      "accessed_or_reviewed",
      "limitations",
      "provenance_transform",
      "latitude",
      "longitude",
    ];
    const rows = events.map((event) => {
      const sources = buildSourceRows(event);
      return [
        event.id,
        event.title,
        state.cityId,
        activeMapLens()?.id || state.activeAspect,
        state.areaFilter || "",
        event.year,
        event.effectiveDate,
        event.datePrecision,
        event.confidence,
        event.area,
        event.sourceIds.join(";"),
        eventSourceCount(event),
        sources.map((source) => source.licence).filter(Boolean).join(";"),
        sources.map((source) => source.url).filter(Boolean).join(";"),
        sources.map((source) => source.accessed).filter(Boolean).join(";"),
        (event.caveats || []).join(";"),
        event.provenance?.transform || "",
        event.lngLat ? event.lngLat[1] : "",
        event.lngLat ? event.lngLat[0] : "",
      ];
    });
    return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  }

  function featureCollectionForEvents(events) {
    const lens = activeMapLens();
    return {
      type: "FeatureCollection",
      name: `${state.cityId}-${lens?.id || state.activeAspect}-records`,
      filters: {
        city_id: state.cityId,
        lens: lens?.id || state.activeAspect,
        year: state.year,
        area: state.areaFilter || "",
        confidence: state.confidenceFilter,
        show_inferred: state.showInferred,
        search: state.search || "",
      },
      features: events.map((event) => {
        const sources = buildSourceRows(event);
        return {
          type: "Feature",
          id: event.id,
          geometry: event.geometry || null,
          properties: {
            event_id: event.id,
            title: event.title,
            city_id: state.cityId,
            lens: lens?.id || state.activeAspect,
            lens_label: lens?.label || "",
            year: event.year,
            effective_date: event.effectiveDate || "",
            date_precision: event.datePrecision || "",
            confidence: event.confidence || "",
            area: event.area || "",
            source_ids: event.sourceIds || [],
            source_urls: sources.map((source) => source.url).filter(Boolean),
            licences: sources.map((source) => source.licence).filter(Boolean),
            attribution: sources.map((source) => source.attribution).filter(Boolean),
            caveats: event.caveats || [],
            provenance: event.provenance || {},
          },
        };
      }),
    };
  }

  function downloadText(filename, mimeType, text) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 250);
  }

  function csvCell(value) {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function safeFileToken(value) {
    return String(value || "atlas").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || "atlas";
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
    const lens = activeMapLens();
    const searchNote = state.search ? ` Search: "${state.search}".` : "";
    const areaNote = state.areaFilter ? ` Area: "${areaFilterLabel()}".` : "";
    setText(els.eventListMeta, `${city} / ${lens?.label || "active lens"} / ${state.year}. Timeline, layer, area, confidence, and inferred filters apply.${areaNote}${searchNote}`);

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

    els.eventList.innerHTML = visible.map((event, index) => {
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const sourceCount = eventSourceCount(event);
      const confidence = confidenceDescriptor(event.confidence).label;
      const sourceText = `${sourceCount} source${sourceCount === 1 ? "" : "s"}`;
      return `
        <button class="event-row" type="button" data-event-id="${escapeAttr(event.id)}" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}" aria-label="${escapeAttr(`${event.title}. ${event.year}. ${layer.label}. ${confidence}. ${sourceText}.`)}">
          <span class="event-dot" data-rank="${index + 1}" aria-hidden="true"></span>
          <span class="event-main">
            <span class="event-title">${escapeHtml(event.title)}</span>
            <span class="event-summary">${escapeHtml(event.subtitle || event.shortDescription || event.summary || "")}</span>
            <span class="event-tags" aria-hidden="true">
              <span>${escapeHtml(layer.label)}</span>
              <span>${escapeHtml(confidence)}</span>
              <span>${escapeHtml(sourceText)}</span>
            </span>
            <span class="event-meta">${escapeHtml(event.area || "Unknown area")}</span>
          </span>
          <span class="event-year">${event.year}</span>
        </button>`;
    }).join("");

    els.eventList.querySelectorAll(".event-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-event-id");
        if (id) selectEvent(id);
        if (isMobileViewport()) setChangelogOpen(false);
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

  function searchRows() {
    return els.searchResults ? [...els.searchResults.querySelectorAll(".search-row")] : [];
  }

  function searchHasFocus() {
    const active = document.activeElement;
    return Boolean(active && (active === els.searchInput || els.searchResults?.contains(active)));
  }

  function hideSearchResults() {
    state.searchResultActiveIndex = -1;
    els.searchResults?.setAttribute("hidden", "");
    els.searchInput?.setAttribute("aria-expanded", "false");
    els.searchInput?.removeAttribute("aria-activedescendant");
  }

  function focusSearchResult(index) {
    const rows = searchRows();
    if (!rows.length) return;
    const nextIndex = (index + rows.length) % rows.length;
    state.searchResultActiveIndex = nextIndex;
    rows.forEach((row, rowIndex) => {
      const active = rowIndex === nextIndex;
      row.setAttribute("data-active", String(active));
      row.setAttribute("aria-selected", String(active));
    });
    const row = rows[nextIndex];
    els.searchInput?.setAttribute("aria-activedescendant", row.id);
    row.focus();
  }

  async function selectSearchResult(rowOrId) {
    const row = typeof rowOrId === "string" ? null : rowOrId;
    const id = row?.getAttribute("data-event-id") || (typeof rowOrId === "string" ? rowOrId : "");
    const area = row?.getAttribute("data-area-filter") || "";
    if (area) {
      hideSearchResults();
      if (els.searchInput) els.searchInput.value = "";
      state.search = "";
      await setAreaFilter(area);
      return;
    }
    if (!id) return;
    selectEvent(id);
    hideSearchResults();
    if (els.searchInput) els.searchInput.value = "";
    state.search = "";
    resetEventListLimit();
    renderEventList();
    syncTopline();
    updateTimeDependentMapState();
    renderMarkers();
  }

  function handleSearchInputKeydown(e) {
    if (!els.searchResults || els.searchResults.hasAttribute("hidden")) {
      if (state.search.trim().length >= 2) renderSearchResults();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusSearchResult(state.searchResultActiveIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusSearchResult(state.searchResultActiveIndex < 0 ? -1 : state.searchResultActiveIndex - 1);
    } else if (e.key === "Enter" && state.searchResultActiveIndex >= 0) {
      e.preventDefault();
      selectSearchResult(searchRows()[state.searchResultActiveIndex]);
    } else if (e.key === "Escape") {
      hideSearchResults();
    }
  }

  function renderAreaFilterOptions() {
    if (!els.areaFilterOptions) return;
    const seen = new Set();
    const options = [];
    const add = (label) => {
      const clean = cleanAreaFilter(label);
      const key = normalizeAreaText(clean);
      if (!clean || !key || seen.has(key)) return;
      seen.add(key);
      options.push(clean);
    };

    for (const label of presetAreaLabelsForCity(state.cityId)) add(label);
    for (const chunk of state.chunks.values()) {
      for (const facet of Array.isArray(chunk.area_facets) ? chunk.area_facets : []) add(facet.label);
      if (options.length >= 160) break;
    }
    for (const events of state.loadedEvents.values()) {
      for (const event of events) add(event.area);
      if (options.length >= 220) break;
    }

    els.areaFilterOptions.innerHTML = options
      .slice(0, 220)
      .map((label) => `<option value="${escapeAttr(label)}"></option>`)
      .join("");
  }

  function areaSearchResults(query) {
    const q = normalizeAreaText(query);
    if (!q) return [];
    const seen = new Set();
    const results = [];
    const add = (label, filterValue = label, meta = "Area") => {
      const cleanLabel = cleanAreaFilter(label);
      const cleanFilter = cleanAreaFilter(filterValue);
      const key = meta === "Postcode area"
        ? normalizeAreaText(cleanLabel)
        : normalizeAreaText(cleanFilter || cleanLabel);
      if (!cleanLabel || !cleanFilter || !key || seen.has(key)) return;
      const postcodeQuery = /^[a-z]{1,3}\d{1,3}$/i.test(q);
      if (postcodeQuery && meta === "Postcode area") {
        const labelWords = normalizeAreaText(cleanLabel).split(" ").filter(Boolean);
        if (!labelWords.includes(q)) return;
      } else if (postcodeQuery) {
        const labelWords = normalizeAreaText(cleanLabel).split(" ").filter(Boolean);
        if (!labelWords.includes(q)) return;
      }
      const haystack = normalizeAreaText([
        cleanLabel,
        cleanFilter,
        ...areaAliasesForLabel(cleanLabel),
        ...areaAliasesForLabel(cleanFilter),
      ].join(" "));
      if (!normalizedTextMatchesQuery(haystack, q)) return;
      seen.add(key);
      const count = visibleEventsForYear(state.year).filter((event) =>
        areaTextMatchesQuery(event.areaSearchText || areaSearchTextForEvent(event), normalizeAreaText(cleanFilter))
      ).length;
      results.push({ type: "area", label: cleanLabel, filterValue: cleanFilter, meta, count });
    };

    for (const entry of presetAreaSearchEntriesForCity(state.cityId)) add(entry.label, entry.filter, entry.meta);
    for (const label of presetAreaLabelsForCity(state.cityId)) add(label, label, "Area");
    for (const chunk of state.chunks.values()) {
      for (const facet of Array.isArray(chunk.area_facets) ? chunk.area_facets : []) add(facet.label, facet.label, "Area");
      if (results.length >= 8) break;
    }
    for (const events of state.loadedEvents.values()) {
      for (const event of events) add(event.area, event.area, "Area");
      if (results.length >= 8) break;
    }
    const postcodeQuery = /^[a-z]{1,3}\d{1,3}$/i.test(q);
    return results
      .sort((a, b) => {
        if (postcodeQuery && a.meta !== b.meta) return a.meta === "Postcode area" ? -1 : 1;
        return (b.count - a.count) || a.label.localeCompare(b.label);
      })
      .slice(0, 5);
  }

  function presetAreaLabelsForCity(cityId) {
    if (cityId === "nyc") return ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];
    if (cityId === "london") {
      return [
        "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden", "City of London",
        "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham", "Haringey",
        "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
        "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
        "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest",
        "Wandsworth", "Westminster",
      ];
    }
    if (cityId === "belfast") {
      return [
        "Belfast city centre", "North Belfast", "South Belfast", "East Belfast", "West Belfast",
        "Titanic Quarter", "Cathedral Quarter", "Queen's Quarter", "Gaeltacht Quarter",
      ];
    }
    return [];
  }

  function presetAreaSearchEntriesForCity(cityId) {
    if (cityId === "belfast") {
      return [
        { label: "BT1 / City Centre", filter: "City Centre", meta: "Postcode area" },
        { label: "BT2 / City Centre", filter: "City Centre", meta: "Postcode area" },
        { label: "BT3 / Titanic Quarter", filter: "Titanic Quarter", meta: "Postcode area" },
        { label: "BT4 / East Belfast", filter: "East Belfast", meta: "Postcode area" },
        { label: "BT5 / East Belfast", filter: "East Belfast", meta: "Postcode area" },
        { label: "BT7 / Queen's Quarter", filter: "Queen's Quarter", meta: "Postcode area" },
        { label: "BT9 / South Belfast", filter: "South Belfast", meta: "Postcode area" },
        { label: "BT12 / West Belfast", filter: "West Belfast", meta: "Postcode area" },
        { label: "BT15 / North Belfast", filter: "North Belfast", meta: "Postcode area" },
      ];
    }
    return [];
  }

  function renderSearchResults() {
    if (!els.searchResults || !els.searchInput) return;
    const q = state.search.trim();
    if (q.length < 2) {
      hideSearchResults();
      return;
    }
    const areaMatches = areaSearchResults(q);
    const eventMatches = visibleEventsForYear(state.year)
      .map((event) => ({ ...event, searchScore: eventSearchScore(event, q) }))
      .filter((event) => event.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore || Number(b.year || 0) - Number(a.year || 0))
      .slice(0, 8);
    const areaFirst = /\b(bt\d{1,2}|postcode|postal|area|quarter|ward|borough)\b/i.test(q);
    const matches = areaFirst
      ? [...areaMatches, ...eventMatches].slice(0, 8)
      : [...eventMatches.slice(0, 5), ...areaMatches].slice(0, 8);

    if (!matches.length) {
      state.searchResultActiveIndex = -1;
      els.searchResults.removeAttribute("hidden");
      els.searchInput.setAttribute("aria-expanded", "true");
      els.searchInput.removeAttribute("aria-activedescendant");
      els.searchResults.innerHTML = `<div class="search-empty">No matches in ${escapeHtml(shortCityName(state.city?.display_name))} for "${escapeHtml(q)}". Try a different term or scrub the timeline.</div>`;
      return;
    }
    els.searchResults.removeAttribute("hidden");
    els.searchInput.setAttribute("aria-expanded", "true");
    state.searchResultActiveIndex = Math.min(state.searchResultActiveIndex, matches.length - 1);
    els.searchResults.innerHTML = matches.map((m, index) => {
      const isArea = m.type === "area";
      const color = isArea ? "var(--c-transport)" : (LAYER_BY_ID.get(m.category) || LAYERS[1]).color;
      const active = index === state.searchResultActiveIndex;
      return `
        <button class="search-row" id="search-result-${index}" type="button" data-result-type="${isArea ? "area" : "event"}" data-event-id="${escapeAttr(isArea ? "" : m.id)}" data-area-filter="${escapeAttr(isArea ? m.filterValue : "")}" role="option" aria-selected="${active}" data-active="${active}">
          <span class="dot" style="background:${color}"></span>
          <div>
            <div class="row-kind">${isArea ? escapeHtml(m.meta || "Area") : "Record"}</div>
            <div class="row-title">${escapeHtml(isArea ? m.label : m.title)}</div>
            <div style="font-size:11px;color:var(--muted)">${escapeHtml(isArea ? `Filter to ${m.filterValue}` : (m.area || ""))}</div>
          </div>
          <span class="meta">${isArea ? `${m.count || 0}` : m.year}</span>
        </button>`;
    }).join("");
    els.searchResults.querySelectorAll(".search-row").forEach((row, index) => {
      row.addEventListener("focus", () => {
        state.searchResultActiveIndex = index;
        searchRows().forEach((item, rowIndex) => {
          const active = rowIndex === index;
          item.setAttribute("data-active", String(active));
          item.setAttribute("aria-selected", String(active));
        });
        els.searchInput?.setAttribute("aria-activedescendant", row.id);
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          focusSearchResult(index + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          focusSearchResult(index - 1);
        } else if (e.key === "Escape") {
          hideSearchResults();
          els.searchInput?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectSearchResult(row);
        }
      });
      row.addEventListener("click", () => selectSearchResult(row));
    });
  }

  function renderCityMenu() {
    if (!els.cityMenu) return;
    const cities = state.index?.cities || [];
    updateCityChrome();
    els.cityMenu.innerHTML = cities.map((c) => `
      <div class="city-row" data-active="${c.city_id === state.cityId}" data-city-id="${escapeAttr(c.city_id)}" role="button" tabindex="0">
        <span class="city-name">${escapeHtml(shortCityName(c.display_name))}</span>
        <span class="city-count">${compactNumber(c.event_count)} records / ${compactNumber(c.source_count)} sources</span>
        <span class="meta">${escapeHtml(cityAvailabilityLabel(c))}</span>
      </div>
    `).join("");
    els.cityMenu.querySelectorAll(".city-row").forEach((row) => {
      const selectCity = async () => {
        const id = row.getAttribute("data-city-id");
        els.cityMenu.setAttribute("hidden", "");
        updateCityChrome();
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

  function updateCityChrome() {
    const city = shortCityName(state.city?.display_name || state.cityMeta?.display_name || "city");
    if (els.searchInput) els.searchInput.placeholder = searchPlaceholderForCity(state.cityId, city);
    if (els.areaFilterInput) els.areaFilterInput.placeholder = areaPlaceholderForCity(state.cityId);
    if (els.cityToggle) {
      els.cityToggle.setAttribute("aria-haspopup", "true");
      els.cityToggle.setAttribute("aria-expanded", String(Boolean(els.cityMenu && !els.cityMenu.hasAttribute("hidden"))));
      els.cityToggle.setAttribute("aria-label", `Choose city. Current city: ${city}`);
    }
  }

  function searchPlaceholderForCity(cityId, city = "city") {
    if (cityId === "nyc") return 'Search New York City records or areas... (try "Queens", "DOB", "hydrant")';
    if (cityId === "london") return 'Search London records or areas... (try "Camden", "listed", "rail")';
    if (cityId === "belfast") return 'Search Belfast records, areas, or postcodes... (try "BT1", "grand central", "cycle")';
    return `Search source-backed changes in ${city}...`;
  }

  function areaPlaceholderForCity(cityId) {
    if (cityId === "nyc") return "Borough, neighborhood, street";
    if (cityId === "london") return "Borough, ward, street, postcode area";
    if (cityId === "belfast") return "Postcode, quarter, district, street";
    return "Area, district, street";
  }

  function cityAvailabilityLabel(city) {
    const status = String(city?.availability_status || "").replace(/_/g, " ").trim();
    if (!status) return "Source-backed";
    return status.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function syncTopline() {
    const events = filteredEvents();
    const total = totalEventsForYear(state.year);
    const lens = activeMapLens();
    setText(els.tlVisible, String(events.length));
    setText(els.tlTotal, String(total));
    setText(els.tlCity, state.selectedEvent ? truncate(state.selectedEvent.title, 48) : shortCityName(state.city?.display_name));
    const area = state.areaFilter ? ` / ${areaFilterLabel()}` : "";
    setText(els.tlLayers, `${lens?.label || "Lens"} / ${state.activeLayers.size}/${LAYERS.length} layers${area}`);
    updateYearControls();
  }

  function updateYearControls() {
    const [start, end] = state.yearRange;
    if (els.prevYearBtn) {
      els.prevYearBtn.disabled = Number(state.year) <= Number(start);
      els.prevYearBtn.title = `Previous year (${Math.max(start, state.year - 1)})`;
    }
    if (els.nextYearBtn) {
      els.nextYearBtn.disabled = Number(state.year) >= Number(end);
      els.nextYearBtn.title = `Next year (${Math.min(end, state.year + 1)})`;
    }
  }

  function totalEventsForYear(year) {
    const loaded = state.loadedEvents.get(year);
    if (loaded) {
      return loaded
        .filter((event) => state.activeLayers.has(event.category) && eventMatchesActiveLens(event))
        .filter((event) => eventMatchesAreaFilter(event))
        .length;
    }
    const chunk = state.chunks.get(year);
    if (!chunk) return 0;
    const areaCount = areaFacetTotalCount(chunk);
    if (areaCount != null) return areaCount;
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
    state.manualYearOverride = next;
    state.detailCurrentYear = null;
    if (next === state.year && state.loadedEvents.has(next)) {
      renderAll();
      updateTimeDependentMapState();
      updateYearControls();
      return;
    }
    state.year = next;
    if (Number(state.detailBeforeYear) >= next) state.detailBeforeYear = null;
    resetEventListLimit();
    if (state.compareOpen) state.compareAfterYear = next;
    setText(els.tlYear, String(next));
    updateYearControls();
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
    const lensMatched = events.find((e) => e.category === state.activeLens && e.confidence === "documented")
      || events.find((e) => e.category === state.activeLens);
    const nearestToCamera = opts.keepCamera && state.mapReady
      ? events
        .filter((event) => event.lngLat)
        .map((event) => ({ event, distance: lngLatDistanceMeters(currentMapCenter(), event.lngLat) }))
        .sort((a, b) => a.distance - b.distance)[0]?.event
      : null;
    const documented = events.find((e) => e.confidence === "documented");
    const cameraAware = opts.keepCamera
      ? (nearestToCamera || lensMatched)
      : (lensMatched || nearestToCamera);
    const first = preferred || cameraAware || documented || events[0];
    if (first) await selectEvent(first.id, { silent: true, ...opts });
  }

  async function reconcileSelectionWithFilters(opts = {}) {
    const events = filteredEvents();
    if (!events.length) {
      state.selectedEventId = null;
      state.selectedEvent = null;
      state.pendingCameraFocusEventId = null;
      renderDetail();
      renderMapStudyChip();
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
    els.detailPanel?.setAttribute("data-open", "true");
    if (isMobileViewport()) setChangelogOpen(false);
    if (event.year !== state.year) {
      await setYear(event.year);
    }
    renderDetail();
    renderMapStudyChip();
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
    if (!opts.silent && !searchHasFocus()) focusDetailPanel();
  }

  function focusPendingCameraEvent(duration = 0) {
    if (!state.pendingCameraFocusEventId || !state.map || !state.mapReady) return;
    const event = state.eventById.get(state.pendingCameraFocusEventId);
    state.pendingCameraFocusEventId = null;
    if (event?.lngLat) focusMapOnEvent(event, duration);
  }

  function focusMapOnEvent(event, duration = 720) {
    if (!event?.lngLat || !state.map || !state.mapReady) return;
    const camera = {
      center: event.lngLat,
      zoom: lensCameraZoom(activeMapLens(), event.lngLat),
      offset: lensCameraOffset(activeMapLens()),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
    };
    const effectiveDuration = motionDuration(duration);
    if (effectiveDuration > 0) state.map.flyTo({ ...camera, duration: effectiveDuration });
    else state.map.jumpTo(camera);
  }

  function focusActiveLensCamera(duration = 420) {
    const event = state.selectedEvent;
    if (!event?.lngLat || !state.map || !state.mapReady) return;
    const camera = {
      center: event.lngLat,
      zoom: lensCameraZoom(activeMapLens(), event.lngLat),
      offset: lensCameraOffset(activeMapLens()),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
    };
    const effectiveDuration = motionDuration(duration);
    if (effectiveDuration > 0) state.map.easeTo({ ...camera, duration: effectiveDuration });
    else state.map.jumpTo(camera);
  }

  function lensCameraOffset(_lens = activeMapLens()) {
    if (!state.map) return [0, 0];
    const container = state.map.getContainer?.();
    const viewport = container?.getBoundingClientRect?.();
    if (!viewport?.width || !viewport?.height) return [0, 0];
    const layersBox = els.layersPanel?.getBoundingClientRect?.();
    const detailBox = els.detailPanel?.dataset.open !== "false" ? els.detailPanel?.getBoundingClientRect?.() : null;
    const topbarBox = document.querySelector(".topbar")?.getBoundingClientRect?.();
    const timelineBox = document.querySelector(".timeline")?.getBoundingClientRect?.();
    const mapLeft = Math.max(0, layersBox?.right || 0);
    const mapRight = Math.min(viewport.right, detailBox?.left || viewport.right);
    const mapTop = Math.max(0, topbarBox?.bottom || 0);
    const mapBottom = Math.min(viewport.bottom, timelineBox?.top || viewport.bottom);
    const targetX = mapLeft + Math.max(0, mapRight - mapLeft) / 2;
    const targetY = mapTop + Math.max(0, mapBottom - mapTop) / 2;
    const offsetX = Math.round(targetX - (viewport.left + viewport.width / 2));
    const offsetY = Math.round(targetY - (viewport.top + viewport.height / 2));
    if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) return [0, 0];
    return [offsetX, offsetY];
  }

  function lensCameraZoom(lens = activeMapLens(), lngLat = state.selectedEvent?.lngLat || currentMapCenter()) {
    const radiusM = Math.max(300, lensEffectiveRadiusM(lens));
    const metersPerPixelByLens = {
      "transport-speed": 5.05,
      "transport-access": 6.35,
      "transport-reliability": 6.15,
      "planning-pressure": 5.35,
      "planning-delta": 3.75,
      "planning-parcels": 3.75,
      "civic-access-gaps": 6.15,
      "civic-catchment": 6.15,
      "civic-demand": 6.15,
      "economy-vitality": 5.05,
      "economy-land-use": 5.15,
      "economy-gravity": 8.25,
      "utilities-capacity": 7.35,
      "utilities-resilience": 7.45,
      "utilities-works": 6.15,
    };
    const lat = Number(lngLat?.[1] || currentMapCenter()[1]) * Math.PI / 180;
    const maxZoomByLens = {
      "transport-speed": 14.65,
      "transport-access": 14.55,
      "transport-reliability": 14.35,
      "planning-pressure": 14.25,
      "planning-delta": 14.75,
      "planning-parcels": 14.75,
      "civic-access-gaps": 14.6,
      "civic-catchment": 14.75,
      "civic-demand": 14.65,
      "economy-vitality": 14.65,
      "economy-land-use": 14.55,
      "economy-gravity": 14.35,
      "utilities-capacity": 14.35,
      "utilities-resilience": 14.65,
      "utilities-works": 14.7,
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
    if (isMobileViewport()) els.detailPanel?.setAttribute("data-open", "false");
    renderDetail();
    renderEventList();
    renderMarkers();
    updateLensGuideSource();
    syncTopline();
  }

  function ensureSelectionFitsActiveLens() {
    const lens = activeMapLens();
    const category = lens?.category || lens?.layerId || state.activeLens;
    if (!category || !state.loadedEvents.has(state.year)) return;
    const events = visibleEventsForYear(state.year);
    if (state.selectedEvent?.year === state.year && state.selectedEvent.lngLat) {
      if (state.selectedEvent.category === category) return;
      const nearbySameCategory = events.some((event) => event.category === category
        && event.lngLat
        && lngLatDistanceMeters(state.selectedEvent.lngLat, event.lngLat) <= lensEffectiveRadiusM(lens) * 1.55);
      if (nearbySameCategory) return;
    }
    const next = events.find((event) => event.category === category && event.confidence === "documented" && event.lngLat)
      || events.find((event) => event.category === category && event.lngLat);
    if (!next) return;
    state.selectedEventId = next.id;
    state.selectedEvent = next;
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  function togglePlay() {
    if (state.playing) stopPlay(); else startPlay();
  }
  function startPlay() {
    if (state.playing) return;
    if (prefersReducedMotion()) {
      const nextYear = Math.min(state.yearRange[1], state.year + 1);
      if (nextYear !== state.year) setYear(nextYear);
      updatePlayIcon();
      return;
    }
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
    els.playBtn?.setAttribute("aria-pressed", String(state.playing));
    els.playBtn?.setAttribute("aria-label", state.playing ? "Pause timeline" : "Play timeline");
    els.playBtn?.setAttribute("title", state.playing ? "Pause timeline" : "Play timeline");
    if (els.playIcon) {
      els.playIcon.innerHTML = state.playing
        ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
        : '<path d="M7 5l12 7-12 7z"/>';
    }
  }

  // ---------------------------------------------------------------------------
  // Overlays
  // ---------------------------------------------------------------------------

  function setActiveLens(lensId) {
    const next = normalizeMapLensId(lensId);
    if (!next) return;
    const useCitywideCamera = shouldPreferCitywideLensCamera();
    state.manualLensOverride = next;
    state.manualAspectOverride = null;
    if (next === state.activeLens) {
      updateTimeDependentMapState();
      if (useCitywideCamera) fitMapToCity(260);
      else focusActiveLensCamera();
      syncTopline();
      return;
    }
    state.activeLens = next;
    state.activeAspect = defaultAspectForCategory(next);
    state.detailRadiusM = null;
    state.detailBeforeYear = null;
    state.detailCurrentYear = null;
    resetActiveAspectLayers();
    state.lensEventSourceKey = "";
    ensureSelectionFitsActiveLens();
    resetEventListLimit();
    renderLensSwitcher();
    renderAspectSwitcher();
    renderActiveLensHeader();
    renderLayers();
    renderLensLegend();
    renderDetail();
    renderEventList();
    renderSearchResults();
    updateTimeDependentMapState();
    renderMarkers();
    if (useCitywideCamera) fitMapToCity(260);
    else focusActiveLensCamera();
    syncTopline();
  }

  function setActiveAspect(aspectId) {
    const next = normalizeLensAspectId(aspectId);
    if (!next) return;
    const aspect = LENS_ASPECT_BY_ID.get(next);
    const useCitywideCamera = shouldPreferCitywideLensCamera();
    state.manualAspectOverride = next;
    state.manualLensOverride = aspect?.category || state.activeLens;
    if (next === state.activeAspect && (!aspect?.category || aspect.category === state.activeLens)) {
      updateTimeDependentMapState();
      if (useCitywideCamera) fitMapToCity(260);
      else focusActiveLensCamera();
      syncTopline();
      return;
    }
    state.activeAspect = next;
    if (aspect?.category && aspect.category !== state.activeLens) {
      state.activeLens = aspect.category;
    }
    state.detailRadiusM = null;
    state.detailBeforeYear = null;
    state.detailCurrentYear = null;
    resetActiveAspectLayers();
    state.lensEventSourceKey = "";
    ensureSelectionFitsActiveLens();
    resetEventListLimit();
    renderLensSwitcher();
    renderAspectSwitcher();
    renderActiveLensHeader();
    renderLayers();
    renderLensLegend();
    renderDetail();
    renderEventList();
    renderSearchResults();
    updateTimeDependentMapState();
    renderMarkers();
    if (useCitywideCamera) fitMapToCity(260);
    else focusActiveLensCamera();
    syncTopline();
  }

  async function setAreaFilter(value) {
    state.areaFilter = cleanAreaFilter(value);
    if (els.areaFilterInput) els.areaFilterInput.value = state.areaFilter;
    resetEventListLimit();
    ensureAreaFilterTimelineLoaded();
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    await reconcileSelectionWithFilters({ keepCamera: true });
  }

  function methodFocusableElements() {
    if (!els.methodOverlay) return [];
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return [...els.methodOverlay.querySelectorAll(selectors)].filter((element) => {
      if (element.closest("[hidden]")) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
  }

  function setMethodBackgroundInert(open) {
    const siblings = [...document.querySelectorAll("#root > *")].filter((element) => element !== els.methodOverlay);
    for (const element of siblings) {
      if (open) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    }
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      if (open) skipLink.setAttribute("inert", "");
      else skipLink.removeAttribute("inert");
    }
  }

  function handleMethodOverlayKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setMethodOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = methodFocusableElements();
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function setMethodOpen(open) {
    state.methodOpen = open;
    els.methodOverlay?.setAttribute("data-open", String(open));
    els.methodOverlay?.setAttribute("aria-hidden", String(!open));
    if (open) {
      state.methodReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : els.methodBtn;
      setMethodBackgroundInert(true);
      renderMethodology();
      requestAnimationFrame(() => els.methodClose?.focus?.());
    } else {
      setMethodBackgroundInert(false);
      const focusTarget = state.methodReturnFocus || els.methodBtn;
      state.methodReturnFocus = null;
      if (focusTarget?.isConnected) focusTarget.focus?.();
    }
  }

  function setWelcomeOpen(open) {
    state.welcomeOpen = open;
    els.welcome?.setAttribute("data-open", String(open));
  }

  function setChangelogOpen(open) {
    state.changelogOpen = !!open;
    if (state.changelogOpen && isMobileViewport() && state.selectedEvent) {
      els.detailPanel?.setAttribute("data-open", "false");
    }
    els.changelogPanel?.setAttribute("data-open", String(state.changelogOpen));
    els.changelogToggle?.setAttribute("aria-pressed", String(state.changelogOpen));
    els.changelogToggle?.setAttribute("aria-expanded", String(state.changelogOpen));
    els.eventListCollapseBtn?.setAttribute("aria-expanded", String(state.changelogOpen));
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
    const areaNote = state.areaFilter ? ` Area filter: ${escapeHtml(areaFilterLabel())}.` : "";
    return `
      <div class="compare-evidence">
        <div class="lens-evidence-note">Before/after rows show one inspectable source-backed record per active lens.${areaNote} Count differences are descriptive, not causal.</div>
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
    setText(els.compareNote, "Layer, area, confidence, and inferred-record filters apply to this count comparison. OpenStreetMap remains the current orientation basemap; record deltas are not proof of construction volume, congestion, value change, or causation.");
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
    const areaCount = areaFacetTotalCount(chunk);
    if (areaCount != null) return areaCount;
    const counts = chunk?.counts_by_category || {};
    return LAYERS.reduce((sum, layer) => sum + (state.activeLayers.has(layer.id) ? Number(counts[layer.id] || 0) : 0), 0);
  }

  function compareCategoryRows(beforeYear, afterYear) {
    const before = state.chunks.get(Number(beforeYear))?.counts_by_category || {};
    const after = state.chunks.get(Number(afterYear))?.counts_by_category || {};
    const beforeChunk = state.chunks.get(Number(beforeYear));
    const afterChunk = state.chunks.get(Number(afterYear));
    return LAYERS
      .filter((layer) => state.activeLayers.has(layer.id))
      .map((layer) => {
        const beforeArea = areaFacetCategoryCount(beforeChunk, layer.id);
        const afterArea = areaFacetCategoryCount(afterChunk, layer.id);
        const beforeCount = beforeArea != null ? beforeArea : Number(before[layer.id] || 0);
        const afterCount = afterArea != null ? afterArea : Number(after[layer.id] || 0);
        return {
          layer,
          before: beforeCount,
          after: afterCount,
          delta: afterCount - beforeCount,
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  function recenterMap() {
    if (!state.map) return;
    if (fitMapToCity(520)) {
      renderMapStudyChip();
      renderMarkers();
      return;
    }
    const camera = {
      center: mapCenter(),
      zoom: Number(state.city?.default_zoom || 11.5),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
    };
    const duration = motionDuration(520);
    if (duration > 0) state.map.easeTo({ ...camera, duration });
    else state.map.jumpTo(camera);
  }

  function toggleMapTilt() {
    state.mapTilted = !state.mapTilted;
    updateMapToolState();
    if (!state.map) return;
    state.map.stop?.();
    const camera = { pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0 };
    const duration = motionDuration(420);
    if (duration > 0) state.map.easeTo({ ...camera, duration });
    else state.map.jumpTo(camera);
  }

  function updateMapToolState() {
    els.tiltBtn?.setAttribute("aria-pressed", String(state.mapTilted));
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
      { label: "When recorded", value: event.effectiveDate || String(event.year) },
      { label: "Date certainty", value: event.datePrecision || "not stated" },
      { label: "Date comes from", value: event.sourceDateField || p.source_date_field || p.source_basis || "" },
      { label: "Source checked", value: p.source_retrieved_at || "" },
      { label: "Location comes from", value: p.geometry_source || "" },
      { label: "Location caveat", value: p.geometry_precision || "" },
      { label: "Built by", value: p.transform || "" },
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
    setAreaFilter,
    setChangelogOpen,
    setCompareOpen,
    updateTimeDependentMapState,
    isLayerVisible,
    recenterMap,
  };
})();
