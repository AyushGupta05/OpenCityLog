const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round235_belfast_official_tail_next2";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-19";
const ACCESSED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json")
};

const MANUAL_CORPUS = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const SOURCE_TEMPLATES = {
  bcc: {
    publisher: "Belfast City Council",
    source_type: "official council news, project, minutes or current planning page",
    license:
      "UK Open Government Licence v3.0 where applicable to public-sector information; Belfast City Council website terms, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    update_frequency: "Council page or current planning list; may be updated by publisher."
  },
  dfc: {
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department news, regeneration page or publication",
    license:
      "Crown copyright / UK Open Government Licence v3.0 where applicable to public-sector information; publication attachments, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities.",
    update_frequency: "Departmental news or publication page; may be updated by publisher."
  },
  dfi: {
    publisher: "Department for Infrastructure, Northern Ireland",
    source_type: "official department news, consultation or active-travel/transport page",
    license:
      "Crown copyright / UK Open Government Licence v3.0 where applicable to public-sector information; publication attachments, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Infrastructure.",
    update_frequency: "Departmental news or consultation page; may be updated by publisher."
  },
  qub: {
    publisher: "Queen's University Belfast",
    source_type: "official university estate, project or news page",
    license:
      "Queen's University Belfast copyright / website terms require source-level rights review; factual metadata and source URL retained for audit only.",
    license_url: "https://www.qub.ac.uk/legal/",
    attribution: "Attribute Queen's University Belfast.",
    update_frequency: "University project or news page; may be updated by publisher."
  },
  ulster: {
    publisher: "Ulster University",
    source_type: "official university campus, estate, sport or news page",
    license:
      "Ulster University copyright / website terms require source-level rights review; factual metadata and source URL retained for audit only.",
    license_url: "https://www.ulster.ac.uk/legal",
    attribution: "Attribute Ulster University.",
    update_frequency: "University campus, facility or news page; may be updated by publisher."
  }
};

const SOURCES = {
  dfiSaltwaterSquare: source(
    "dfi",
    "dfi-saltwater-square-reflections-round235",
    "Community-inspired landmark sculpture unveiled as new Saltwater Square at Grand Central Station progresses",
    "https://www.infrastructure-ni.gov.uk/news/community-inspired-landmark-sculpture-unveiled-new-saltwater-square-grand-central-station-progresses",
    "DfI Saltwater Square / Belfast Grand Central Station public realm",
    "official department news page"
  ),
  bccCurrentPlanning: source(
    "bcc",
    "bcc-current-planning-applications-round235",
    "Current planning applications",
    "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    "BCC current planning application list",
    "official council current planning list"
  ),
  bccSandyRowHub: source(
    "bcc",
    "bcc-sandy-row-arts-digital-hub-round235",
    "Boost for Sandy Row as new Arts & Digital Hub opens",
    "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    "BCC Sandy Row capital projects and public realm",
    "official council news page"
  ),
  bccCathedralGardens: source(
    "bcc",
    "bcc-cathedral-gardens-round235",
    "Cathedral Gardens transformation gets underway",
    "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway",
    "BCC Cathedral Gardens public realm",
    "official council news page"
  ),
  bccMajorProjects: source(
    "bcc",
    "bcc-major-projects-round235",
    "Major projects in Belfast city centre",
    "https://www.belfastcity.gov.uk/city-centre/major-projects",
    "BCC city-centre major projects status page",
    "official council project status page"
  ),
  dfcShankillGateway: source(
    "dfc",
    "dfc-shankill-gateway-public-realm-round235",
    "Lyons announces start of construction on Shankill Gateway public realm scheme",
    "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    "DfC Belfast regeneration public realm",
    "official department news page"
  ),
  dfiRavenhillOrmeau: source(
    "dfi",
    "dfi-ravenhill-ormeau-embankment-round235",
    "Ravenhill Road and Ormeau Embankment Pedestrian and Cycling Improvements - Statutory Consultation",
    "https://www.infrastructure-ni.gov.uk/consultations/ravenhill-road-and-ormeau-embankment-pedestrian-and-cycling-improvements-statutory-consultation",
    "DfI active-travel statutory consultation",
    "official department consultation page"
  ),
  dfiGreenwaysFunding: source(
    "dfi",
    "dfi-greenway-funding-round235",
    "Kimmins announces over GBP1m for seven greenway projects",
    "https://www.infrastructure-ni.gov.uk/news/kimmins-announces-over-ps1m-seven-greenway-projects",
    "DfI active-travel greenway funding",
    "official department news page"
  ),
  qubMomentum: source(
    "qub",
    "qub-momentum-one-zero-contractor-round235",
    "Queen's announces Henry Brothers as contractor for new GBP37m Momentum One Zero innovation centre",
    "https://www.qub.ac.uk/News/Allnews/2025/QueensannouncesHenryBrothersascontractorfornew37mMomentumOneZeroinnovationcentre.html",
    "Queen's University Belfast estate / innovation centre project",
    "official university news page"
  ),
  ulsterStudioUlster: source(
    "ulster",
    "ulster-studio-ulster-launch-round235",
    "Studio Ulster's ground-breaking virtual production facility launches",
    "https://www.ulster.ac.uk/news/2025/june/ulster-university-leads-next-generation-of-virtual-film-production-with-studio-ulster-launch",
    "Ulster University Studio Ulster / Belfast Harbour Studios",
    "official university news page"
  ),
  ulsterSportsCentre: source(
    "ulster",
    "ulster-belfast-sports-centre-round235",
    "Belfast Sports Centre",
    "https://www.ulster.ac.uk/sport/facilities/belfast",
    "Ulster University Belfast campus sport facility",
    "official university facility page"
  )
};

const ACCEPTED = [];

const REVIEWED_REJECTS = [
  reject({
    key: "saltwater_square_public_realm_phase_duplicate",
    title: "Saltwater Square public-realm and Reflections sculpture phase",
    source: "dfiSaltwaterSquare",
    category: "duplicate_existing_event",
    date_basis: "DfI news page dated 1 May 2026",
    reason:
      "Already represented in the manual architecture milestone corpus by Saltwater Square public-realm / Reflections sculpture events. Retain only as a corroborating duplicate lead.",
    screen_terms: ["Saltwater Square", "Reflections sculpture", "Grand Central Station"]
  }),
  reject({
    key: "sandy_row_arts_digital_hub_opening_duplicate",
    title: "Sandy Row Arts and Digital Hub opening",
    source: "bccSandyRowHub",
    category: "duplicate_existing_event",
    date_basis: "BCC news page dated 18 February 2026",
    reason:
      "Opening and related letter-of-offer/progress milestones are already represented in the live corpus and round228 rejects.",
    screen_terms: ["Sandy Row Arts", "Arts & Digital Hub", "Flax Art"]
  }),
  reject({
    key: "coffee_culture_sandy_row_work_underway_duplicate",
    title: "Coffee Culture work underway in Sandy Row",
    source: "bccSandyRowHub",
    category: "duplicate_existing_event",
    date_basis: "BCC news page dated 18 February 2026",
    reason:
      "The Coffee Culture works-commencement and contractor/sod-cutting milestones are already present in the manual corpus and prior Belfast packs.",
    screen_terms: ["Coffee Culture", "barista training", "sod-cutting photo call"]
  }),
  reject({
    key: "sandy_row_open_space_blythefield_duplicate",
    title: "Sandy Row Open Space / Blythefield Park project",
    source: "bccSandyRowHub",
    category: "duplicate_existing_event",
    date_basis: "BCC news page dated 18 February 2026",
    reason:
      "The Sandy Row open-space/Blythefield Park lead is already represented as a public-realm candidate; the source did not add a stronger completion date.",
    screen_terms: ["Blythefield Park", "Sandy Row Open Space", "dog park"]
  }),
  reject({
    key: "current_planning_blackstaff_chambers_duplicate",
    title: "Blackstaff Chambers residential/retail current application",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0482/F",
    date_basis: "BCC current applications row advertised 8 May 2026",
    reason:
      "Current-planning row was already represented in prior/pending Belfast candidate packs or the live corpus; not a new physical milestone.",
    screen_terms: ["Blackstaff Chambers", "2 Amelia Street", "LA04/2026/0482/F"]
  }),
  reject({
    key: "current_planning_europa_bus_centre_padel_duplicate",
    title: "Former Europa Bus Centre temporary leisure/market extension",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0629/F",
    date_basis: "BCC current applications row advertised 8 May 2026",
    reason:
      "Current-planning row overlaps prior/pending Belfast packs; source documents an advertised application, not delivery.",
    screen_terms: ["former Europa Bus Centre", "LA04/2026/0629/F", "Great Victoria Street"]
  }),
  reject({
    key: "current_planning_mercy_college_sen_duplicate",
    title: "Mercy College SEN building current application",
    source: "bccCurrentPlanning",
    category: "duplicate_existing_event",
    source_record_id: "LA04/2026/0074/F",
    date_basis: "BCC current applications row advertised 15 May 2026",
    reason:
      "Mercy College SEN building row is already present in live/current-planning coverage and round228 duplicate rejects.",
    screen_terms: ["Mercy College", "Bilston Road", "LA04/2026/0074/F"]
  }),
  reject({
    key: "current_planning_bruce_street_structural_duplicate",
    title: "2-4 Bruce Street structural bracing current application",
    source: "bccCurrentPlanning",
    category: "duplicate_existing_event",
    source_record_id: "LA04/2026/0782/F",
    date_basis: "BCC current applications row advertised 15 May 2026",
    reason:
      "Bruce Street structural bracing row is already represented in the live corpus and round228 duplicate rejects.",
    screen_terms: ["2-4 Bruce Street", "structural bracing", "LA04/2026/0782/F"]
  }),
  reject({
    key: "current_planning_berry_street_shopfront_duplicate",
    title: "22-24 Berry Street shopfront/current application rows",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0809/F; LA04/2026/0810/DCA",
    date_basis: "BCC current applications rows advertised 15 May 2026",
    reason:
      "Berry Street shopfront/demolition-in-conservation-area rows are already represented in prior/pending Belfast packs or the live corpus.",
    screen_terms: ["22-24 Berry Street", "LA04/2026/0809/F", "LA04/2026/0810/DCA"]
  }),
  reject({
    key: "current_planning_upper_newtownards_duplicate",
    title: "512-516 Upper Newtownards Road mixed-use application",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0619/F",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "The Upper Newtownards Road current-planning row is already in prior Belfast candidate coverage; no new official delivery/opening evidence was found.",
    screen_terms: ["512-516 Upper Newtownards", "LA04/2026/0619/F"]
  }),
  reject({
    key: "current_planning_hamilton_street_duplicate_pending",
    title: "39 Hamilton Street listed-building/current application rows",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0780/F; LA04/2026/0708/LBC",
    date_basis: "BCC current applications rows advertised in May 2026",
    reason:
      "Hamilton Street rows are already in prior/pending Belfast candidate coverage and remain administrative planning adverts.",
    screen_terms: ["39 Hamilton Street", "LA04/2026/0780/F", "LA04/2026/0708/LBC"]
  }),
  reject({
    key: "current_planning_lisburn_road_pilates_duplicate_pending",
    title: "715-719 Lisburn Road pilates studio current application",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0792/F",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "Lisburn Road current-planning row is already in prior/pending candidate coverage and is not delivery evidence.",
    screen_terms: ["715-719 Lisburn Road", "LA04/2026/0792/F", "pilates"]
  }),
  reject({
    key: "current_planning_glen_road_cafe_duplicate_pending",
    title: "44E Glen Road cafe/restaurant current application",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2026/0748/F",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "Glen Road current-planning row is already in prior/pending candidate coverage and is not a confirmed change milestone.",
    screen_terms: ["44E Glen Road", "LA04/2026/0748/F"]
  }),
  reject({
    key: "current_planning_ormeau_road_change_duplicate_pending",
    title: "549 Ormeau Road change-of-use/listed-building rows",
    source: "bccCurrentPlanning",
    category: "duplicate_or_pending_existing_event",
    source_record_id: "LA04/2025/1864/F; LA04/2025/1865/LBC",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "Ormeau Road row is already in prior/pending Belfast candidate coverage; current advert does not document delivery.",
    screen_terms: ["549 Ormeau Road", "LA04/2025/1864/F", "LA04/2025/1865/LBC"]
  }),
  reject({
    key: "current_planning_shankill_road_duplicate_live",
    title: "398-400 Shankill Road current application",
    source: "bccCurrentPlanning",
    category: "duplicate_existing_event",
    source_record_id: "LA04/2024/1411/F",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "398-400 Shankill Road is already present in live or prior Belfast candidate coverage.",
    screen_terms: ["398-400 Shankill Road", "LA04/2024/1411/F"]
  }),
  reject({
    key: "current_planning_kings_road_minor_duplicate_pending",
    title: "35 King's Road listed-building/current application",
    source: "bccCurrentPlanning",
    category: "duplicate_or_low_signal_minor_development",
    source_record_id: "LA04/2026/0666/F",
    date_basis: "BCC current applications row advertised in May 2026",
    reason:
      "King's Road row is already in prior/pending coverage and is too minor for this deep-tail architecture/public-realm pass.",
    screen_terms: ["35 King's Road", "LA04/2026/0666/F"]
  }),
  reject({
    key: "current_planning_householder_and_minor_rows_rejected",
    title: "Householder and minor current-planning rows",
    source: "bccCurrentPlanning",
    category: "low_signal_minor_development",
    date_basis: "BCC current applications page reviewed 19 May 2026",
    reason:
      "Householder extensions, patios, sheds, local signage and small residential alterations were rejected as too low-signal for this pack.",
    screen_terms: ["householder", "single-storey extension", "patio", "shed"]
  }),
  reject({
    key: "cathedral_gardens_start_duplicate",
    title: "Cathedral Gardens public-realm works start",
    source: "bccCathedralGardens",
    category: "duplicate_existing_event",
    date_basis: "BCC news/project page reporting January 2026 works start",
    reason:
      "Cathedral Gardens approval, design and works-start milestones are already represented in the corpus and prior packs.",
    screen_terms: ["Cathedral Gardens", "Buoy Park", "transformation gets underway"]
  }),
  reject({
    key: "major_projects_status_page_admin_only",
    title: "City-centre major projects status page leads",
    source: "bccMajorProjects",
    category: "administrative_status_without_new_delivery_date",
    date_basis: "BCC major-projects status page reviewed 19 May 2026",
    reason:
      "Major-project status items either duplicate existing events or give future/administrative status without a direct new delivery/opening milestone.",
    screen_terms: ["Belfast Stories", "Cathedral Gardens", "Assembly Rooms", "public realm"]
  }),
  reject({
    key: "shankill_gateway_public_realm_duplicate",
    title: "Shankill Gateway public realm construction start",
    source: "dfcShankillGateway",
    category: "duplicate_existing_event",
    date_basis: "DfC news page dated 17 September 2025",
    reason:
      "Shankill Gateway public-realm construction start is already represented in the live corpus and round228 duplicate rejects.",
    screen_terms: ["Shankill Gateway", "public realm", "construction"]
  }),
  reject({
    key: "ravenhill_ormeau_consultation_weak_date",
    title: "Ravenhill Road and Ormeau Embankment active-travel consultation",
    source: "dfiRavenhillOrmeau",
    category: "weak_or_ambiguous_date_basis",
    date_basis: "DfI consultation page with future close date and no clear source publication date",
    reason:
      "Relevant active-travel lead, but the available page provides a consultation period rather than a clear observed physical-change milestone.",
    screen_terms: ["Ravenhill Road", "Ormeau Embankment", "Statutory Consultation"]
  }),
  reject({
    key: "sydenham_greenway_funding_overlap",
    title: "Sydenham Greenway funding item",
    source: "dfiGreenwaysFunding",
    category: "duplicate_or_overlapping_existing_event",
    date_basis: "DfI news page dated 30 January 2026",
    reason:
      "The Belfast item overlaps existing Sydenham Greenway committed/funding records and remains administrative funding evidence.",
    screen_terms: ["Sydenham Greenway", "greenway projects", "active travel"]
  }),
  reject({
    key: "qub_momentum_one_zero_duplicate",
    title: "Momentum One Zero contractor and construction-start announcement",
    source: "qubMomentum",
    category: "duplicate_existing_event",
    date_basis: "Queen's University Belfast news page dated 6 October 2025",
    reason:
      "Momentum One Zero contractor/construction-start milestone is already in the manual corpus and prior Belfast packs.",
    screen_terms: ["Momentum One Zero", "Henry Brothers", "construction commenced"]
  }),
  reject({
    key: "ulster_studio_ulster_launch_duplicate",
    title: "Studio Ulster facility launch/opening",
    source: "ulsterStudioUlster",
    category: "duplicate_existing_event",
    date_basis: "Ulster University news page dated 19 June 2025",
    reason:
      "Studio Ulster launch/opening is already represented in the manual corpus and prior Belfast packs.",
    screen_terms: ["Studio Ulster", "virtual production facility", "Belfast Harbour Studios"]
  }),
  reject({
    key: "ulster_belfast_sports_centre_duplicate",
    title: "Ulster University Belfast Sports Centre opening",
    source: "ulsterSportsCentre",
    category: "duplicate_existing_event",
    date_basis: "Ulster University facility/news pages report opening in September 2024",
    reason:
      "Belfast Sports Centre opening at Nelson Place is already represented in the manual corpus and prior Belfast packs.",
    screen_terms: ["Belfast Sports Centre", "Nelson Place", "opened in September 2024"]
  })
];

function source(kind, source_id, source_name, source_url, source_family, source_type) {
  const template = SOURCE_TEMPLATES[kind];
  return {
    source_id,
    source_name,
    publisher: template.publisher,
    source_url,
    source_type: source_type || template.source_type,
    source_family,
    license: template.license,
    license_url: template.license_url,
    attribution: template.attribution,
    update_frequency: template.update_frequency
  };
}

function reject(input) {
  return {
    ...input,
    city_id: "belfast",
    rejected_at: GENERATED_AT
  };
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return null;
  }
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        out.push(full);
      }
    }
  }
  return out;
}

function roundNumberFor(file) {
  const normalized = file.replace(/\\/g, "/");
  const numbers = Array.from(normalized.matchAll(/round(\d+)/gi)).map((match) => Number(match[1]));
  if (!numbers.length) return null;
  return Math.max(...numbers);
}

function isPriorBelfastCandidateFile(file) {
  const normalized = file.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes(`/tmp/subagents/${ROUND_ID.toLowerCase()}/`)) return false;
  if (!normalized.includes("belfast")) return false;
  const round = roundNumberFor(file);
  if (round !== null && round > 228) return false;
  const base = path.basename(file).toLowerCase();
  return (
    base === "candidates.json" ||
    base.includes("candidate") ||
    base.includes("architecture_milestones")
  );
}

function collectPriorFiles() {
  const files = [];
  if (fs.existsSync(MANUAL_CORPUS)) files.push(MANUAL_CORPUS);
  const tmpFiles = walkJsonFiles(path.join(ROOT, "tmp", "subagents")).filter(isPriorBelfastCandidateFile);
  for (const file of tmpFiles) {
    if (!files.includes(file)) files.push(file);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function rowsFromJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.candidates)) return value.candidates;
  if (Array.isArray(value.events)) return value.events;
  if (Array.isArray(value.records)) return value.records;
  if (Array.isArray(value.milestones)) return value.milestones;
  if (Array.isArray(value.features)) {
    return value.features.map((feature) => ({
      ...(feature.properties || {}),
      geometry: feature.geometry
    }));
  }
  return [];
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value).trim());
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value).trim().replace(/\/$/, "").toLowerCase();
  }
}

function firstValue(row, keys) {
  for (const key of keys) {
    const value = row && row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function sourceUrlFor(row) {
  const direct = firstValue(row, ["source_url", "url", "sourceUrl"]);
  if (direct) return direct;
  if (row && row.provenance && row.provenance.source_url) return row.provenance.source_url;
  if (row && Array.isArray(row.evidence)) {
    const found = row.evidence.find((entry) => entry && entry.url);
    if (found) return found.url;
  }
  return "";
}

function dateFor(row) {
  const direct = firstValue(row, [
    "effective_date",
    "date",
    "event_date",
    "milestone_date",
    "decision_date",
    "published_at",
    "source_date_value"
  ]);
  if (direct) return String(direct).slice(0, 10);
  if (row && row.effective_date_range && row.effective_date_range.start) {
    return String(row.effective_date_range.start).slice(0, 10);
  }
  return "";
}

function idFor(row) {
  return firstValue(row, [
    "id",
    "candidate_id",
    "event_id",
    "source_id",
    "legacy_event_id",
    "source_record_id",
    "application_reference"
  ]);
}

function compactHit(record) {
  return {
    file: path.relative(ROOT, record.file).replace(/\\/g, "/"),
    id: record.id || null,
    title: record.title || null,
    date: record.date || null,
    source_url: record.source_url || null,
    source_record_id: record.source_record_id || null
  };
}

function buildPriorIndex(files) {
  const index = {
    files,
    file_count: files.length,
    record_count: 0,
    ids: new Map(),
    urls: new Map(),
    sourceDateKeys: new Map(),
    titleDateKeys: new Map(),
    textRecords: []
  };

  for (const file of files) {
    const json = readJson(file);
    const rows = rowsFromJson(json);
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const title = String(firstValue(row, ["title", "name", "source_name"]) || "");
      const summary = String(firstValue(row, ["summary", "short_description", "observed_change", "description"]) || "");
      const area = String(firstValue(row, ["area", "address", "affected_area", "site_address"]) || "");
      const id = String(idFor(row) || "");
      const source_record_id = String(firstValue(row, ["source_record_id", "application_reference", "planning_application_id"]) || "");
      const source_url = sourceUrlFor(row);
      const date = dateFor(row);
      const record = {
        file,
        id,
        title,
        summary,
        area,
        source_record_id,
        source_url,
        date,
        text: normalizeText([title, summary, area, source_record_id, source_url].join(" "))
      };
      index.record_count += 1;
      index.textRecords.push(record);
      if (id) addMap(index.ids, normalizeText(id), record);
      if (source_url) addMap(index.urls, normalizeUrl(source_url), record);
      if (source_url && date) addMap(index.sourceDateKeys, `${normalizeUrl(source_url)}|${date}`, record);
      if (source_record_id && date) addMap(index.sourceDateKeys, `${normalizeText(source_record_id)}|${date}`, record);
      if (title && date) addMap(index.titleDateKeys, `${normalizeText(title)}|${date}`, record);
    }
  }

  return index;
}

function addMap(map, key, value) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

function findOverlap(lead, index) {
  const hits = [];
  const seen = new Set();
  const addHits = (items) => {
    for (const item of items || []) {
      const key = `${item.file}|${item.id}|${item.title}|${item.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(compactHit(item));
      if (hits.length >= 8) break;
    }
  };

  const source = SOURCES[lead.source];
  if (source) addHits(index.urls.get(normalizeUrl(source.source_url)));
  if (lead.source_record_id && lead.date) {
    addHits(index.sourceDateKeys.get(`${normalizeText(lead.source_record_id)}|${lead.date}`));
  }

  for (const term of lead.screen_terms || []) {
    const normalized = normalizeText(term);
    if (!normalized || normalized.length < 4) continue;
    addHits(index.textRecords.filter((record) => record.text.includes(normalized)).slice(0, 5));
    if (hits.length >= 8) break;
  }

  return hits;
}

async function retrieve(sourceRecord) {
  const started = Date.now();
  try {
    const response = await fetch(sourceRecord.source_url, {
      headers: {
        "user-agent": `${ROUND_ID}/1.0 (+https://openai.com/codex; public-source-audit)`
      }
    });
    const text = await response.text();
    return {
      retrieved_at: ACCESSED_AT,
      http_status: response.status,
      ok: response.ok,
      elapsed_ms: Date.now() - started,
      final_url: response.url,
      content_sha256: crypto.createHash("sha256").update(text).digest("hex"),
      bytes: Buffer.byteLength(text),
      error: null
    };
  } catch (error) {
    return {
      retrieved_at: ACCESSED_AT,
      http_status: null,
      ok: false,
      elapsed_ms: Date.now() - started,
      final_url: null,
      content_sha256: null,
      bytes: 0,
      error: error.message
    };
  }
}

function sourceAuditRow(sourceRecord, retrieval) {
  return {
    source_id: sourceRecord.source_id,
    source_name: sourceRecord.source_name,
    publisher: sourceRecord.publisher,
    url: sourceRecord.source_url,
    final_url: retrieval.final_url,
    source_type: sourceRecord.source_type,
    source_family: sourceRecord.source_family,
    license: sourceRecord.license,
    license_url: sourceRecord.license_url,
    attribution: sourceRecord.attribution,
    coverage_years: `Reviewed official Belfast leads dated between ${DATE_MIN} and ${DATE_MAX}.`,
    update_frequency: sourceRecord.update_frequency,
    geographic_scope: "Belfast city, Belfast neighbourhoods, named university estate sites, or named public-realm/application areas.",
    granularity:
      "Source page, news item, current-planning row, consultation page, project page, funding/status item, or facility page.",
    key_fields: [
      "title",
      "publication, advertised, meeting, consultation or source-reported milestone date",
      "publisher",
      "source URL",
      "source record text or application reference",
      "license/attribution"
    ],
    reliability_assessment: "usable with caveats",
    required_caveats: [
      "Use as administrative/source-reported evidence unless the source explicitly documents physical works or opening.",
      "Do not infer completion, occupation, final design, usage, regeneration impact, environmental outcome, funding drawdown or causation.",
      "Planning adverts and programme pages are not delivery/opening evidence.",
      "Representative or approximate points are not surveyed boundaries, parcels, footprints, routes or legal planning red lines."
    ],
    ingestion_recommendation:
      "No round235 lead from this source was accepted unless separately listed in candidates.json; rejected leads are retained for audit.",
    retrieval
  };
}

function candidateSourceMix(candidates) {
  const mix = {};
  for (const candidate of candidates) {
    const publisher = candidate.publisher || candidate.source_publisher || "unknown";
    mix[publisher] = (mix[publisher] || 0) + 1;
  }
  return mix;
}

function auditSourceMix(auditRows) {
  const mix = {};
  for (const row of auditRows) {
    mix[row.publisher] = (mix[row.publisher] || 0) + 1;
  }
  return mix;
}

function validationFor(candidates, index) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  const required = [
    "id",
    "title",
    "summary",
    "effective_date",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "license",
    "accessed_at",
    "transformation_method",
    "confidence",
    "limitations"
  ];

  for (const candidate of candidates) {
    for (const field of required) {
      if (!candidate[field]) errors.push(`${candidate.id || candidate.title || "candidate"} missing ${field}`);
    }
    const id = candidate.id;
    if (ids.has(id)) errors.push(`duplicate candidate id ${id}`);
    ids.add(id);

    const date = String(candidate.effective_date || "").slice(0, 10);
    if (date < DATE_MIN || date > DATE_MAX) errors.push(`${id} date ${date} outside ${DATE_MIN}..${DATE_MAX}`);

    const geometry = candidate.geometry || {};
    const coords = geometry.coordinates || [candidate.lon, candidate.lat];
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!(lat >= 54.45 && lat <= 54.75 && lon >= -6.15 && lon <= -5.65)) {
      errors.push(`${id} coordinate outside Belfast sanity envelope`);
    }

    const sourceDateKey = `${normalizeUrl(candidate.source_url)}|${date}`;
    const titleDateKey = `${normalizeText(candidate.title)}|${date}`;
    if (sourceDateKeys.has(sourceDateKey)) errors.push(`duplicate source-date key ${sourceDateKey}`);
    if (titleDateKeys.has(titleDateKey)) errors.push(`duplicate title-date key ${titleDateKey}`);
    sourceDateKeys.add(sourceDateKey);
    titleDateKeys.add(titleDateKey);

    const overlap = findOverlap(
      {
        source: null,
        source_record_id: candidate.source_record_id,
        date,
        screen_terms: [candidate.title, candidate.source_record_id, candidate.source_url]
      },
      index
    );
    if (overlap.length) {
      errors.push(`${id} overlaps prior corpus: ${overlap.map((hit) => hit.title || hit.id).join("; ")}`);
    }
  }

  if (!candidates.length) {
    warnings.push("No accepted candidates survived duplicate/date/source screening; rejected leads carry the audit trail.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_provenance: true,
      unique_candidate_ids: true,
      unique_source_date_keys: true,
      unique_title_date_keys: true,
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      belfast_coordinate_sanity: true,
      no_overlap_against_prior_index: true
    }
  };
}

function buildRejected(index) {
  return REVIEWED_REJECTS.map((lead) => {
    const src = SOURCES[lead.source];
    const overlap_hits = findOverlap(lead, index);
    return {
      key: lead.key,
      city_id: "belfast",
      title: lead.title,
      reason: lead.reason,
      category: lead.category,
      source_name: src.source_name,
      publisher: src.publisher,
      source_url: src.source_url,
      source_type: src.source_type,
      license: src.license,
      license_url: src.license_url,
      accessed_at: ACCESSED_AT,
      source_record_id: lead.source_record_id || null,
      date_basis: lead.date_basis,
      screened_terms: lead.screen_terms || [],
      duplicate_or_overlap_hits: overlap_hits,
      rejected_at: lead.rejected_at
    };
  });
}

function buildNotes({ candidates, rejected, sourceAudit, priorFiles, index, validation }) {
  const sourceLines = sourceAudit
    .map((row) => `- ${row.publisher}: ${row.source_name} (${row.retrieval.ok ? "retrieved" : "retrieval failed"})`)
    .join("\n");
  const rejectLines = rejected
    .slice(0, 12)
    .map((row) => `- ${row.key}: ${row.category} - ${row.reason}`)
    .join("\n");

  return `# ${ROUND_ID}

Generated: ${GENERATED_AT}

## Scope

Official-source Belfast deep-tail pass for architecture, building, planning and public-realm milestones dated ${DATE_MIN} through ${DATE_MAX}. Reviewed sources were limited to Belfast City Council, Department for Communities, Department for Infrastructure, Queen's University Belfast, and Ulster University official public pages.

## Result

- Accepted candidates: ${candidates.length}
- Rejected leads: ${rejected.length}
- Prior files screened: ${priorFiles.length}
- Prior records indexed: ${index.record_count}
- Validation: ${validation.ok ? "passed" : "failed"}

No new candidate survived duplicate and date-basis screening. This is intentional for this tail pass: the official pages found either duplicate live/manual entries, duplicate prior or pending candidate packs, current-planning adverts, funding/status records, or weak-date consultation pages.

## Source Audit

${sourceLines}

## Rejection Highlights

${rejectLines}

See rejected.json for the complete rejected-lead list with source URLs, date bases and overlap hits.

## Gaps

- No new non-overlapping official completion/opening, planning-decision or works-start milestone was found after screening against the manual corpus and Belfast packs through round228.
- Current planning rows remain mutable and administrative; production import should verify against NI Planning Portal records before use.
- University estate pages often summarize facility status without parcel geometry or separate design/construction/operation dates.
- Programme pages and funding announcements were retained as rejects unless direct delivery/opening was sourced.
`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const priorFiles = collectPriorFiles();
  const index = buildPriorIndex(priorFiles);

  const audit = [];
  for (const sourceRecord of Object.values(SOURCES)) {
    const retrieval = await retrieve(sourceRecord);
    audit.push(sourceAuditRow(sourceRecord, retrieval));
  }

  const rejected = buildRejected(index);
  const validation = validationFor(ACCEPTED, index);

  const candidatesPayload = {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    candidate_count: ACCEPTED.length,
    accepted_count: ACCEPTED.length,
    candidates: ACCEPTED,
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: priorFiles.length,
      prior_record_count: index.record_count,
      prior_files: priorFiles.map((file) => path.relative(ROOT, file).replace(/\\/g, "/"))
    },
    validation
  };

  const sourceAuditPayload = {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    audit_count: audit.length,
    source_mix: auditSourceMix(audit),
    audit
  };

  const rejectedPayload = {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count: rejected.length,
    rejected
  };

  const summaryPayload = {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    accepted_count: ACCEPTED.length,
    rejected_count: rejected.length,
    source_audit_count: audit.length,
    candidate_source_mix: candidateSourceMix(ACCEPTED),
    audited_source_mix: auditSourceMix(audit),
    accepted_date_range: null,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    retrieval: {
      ok: audit.filter((row) => row.retrieval.ok).length,
      failed: audit.filter((row) => !row.retrieval.ok).length
    },
    dedupe_index: {
      prior_file_count: priorFiles.length,
      prior_record_count: index.record_count,
      unique_ids: index.ids.size,
      unique_urls: index.urls.size,
      unique_source_date_keys: index.sourceDateKeys.size,
      unique_title_date_keys: index.titleDateKeys.size
    },
    validation,
    notes:
      "Zero accepted candidates after screening. Rejected leads document duplicate live/manual entries, prior/pending Belfast pack coverage, administrative planning adverts, funding/status-only pages and weak-date consultation records."
  };

  const notes = buildNotes({
    candidates: ACCEPTED,
    rejected,
    sourceAudit: audit,
    priorFiles,
    index,
    validation
  });

  writeJson(OUTPUTS.candidates, candidatesPayload);
  writeJson(OUTPUTS.sourceAudit, sourceAuditPayload);
  writeJson(OUTPUTS.summary, summaryPayload);
  writeJson(OUTPUTS.rejected, rejectedPayload);
  fs.writeFileSync(OUTPUTS.notes, notes);

  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        accepted_count: ACCEPTED.length,
        rejected_count: rejected.length,
        source_audit_count: audit.length,
        prior_file_count: priorFiles.length,
        prior_record_count: index.record_count,
        validation_ok: validation.ok,
        outputs: Object.fromEntries(
          Object.entries(OUTPUTS).map(([key, file]) => [key, path.relative(ROOT, file).replace(/\\/g, "/")])
        )
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
