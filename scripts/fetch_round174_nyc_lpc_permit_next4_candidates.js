const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND = 174;
const ACCESSED_AT = "2026-05-19";
const START_DATE = "2008-01-01";
const END_DATE = ACCESSED_AT;
const MAX_CANDIDATES = 200;
const PAGE_SIZE = 50000;

const SOURCE_ID = "nyc-open-data-lpc-permit-application-information-dpm2-m9mq";
const SOURCE_DATASET_ID = "dpm2-m9mq";
const SOURCE_NAME = "NYC Open Data: LPC Permit Application Information";
const PUBLISHER = "NYC Landmarks Preservation Commission / NYC Open Data";
const DATASET_PAGE = "https://data.cityofnewyork.us/Housing-Development/LPC-Permit-Application-Information/dpm2-m9mq";
const METADATA_URL = "https://data.cityofnewyork.us/api/views/dpm2-m9mq";
const API_ENDPOINT = "https://data.cityofnewyork.us/resource/dpm2-m9mq.json";
const NYC_OPEN_DATA_TERMS = "https://opendata.cityofnewyork.us/overview/#termsofuse";

const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const CITY_ATLAS_NYC_DIR = path.join(ROOT, "web", "data", "city-atlas", "cities", "nyc");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round174_nyc_lpc_permit_next4");
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");

const PRIOR_PACK_PATHS = [
  "tmp/subagents/round112_nyc_lpc_permit_candidates.json",
  "tmp/subagents/round116_nyc_lpc_permits_official/candidates.json",
  "tmp/subagents/round122_nyc_lpc_permits_designations/candidates.json",
  "tmp/subagents/round130_heritage_designations_more/candidates.json",
  "tmp/subagents/round138_nyc_lpc_individual_landmark_gaps/candidates.json",
  "tmp/subagents/round142_nyc_lpc_designation_gaps/candidates.json",
  "tmp/subagents/round154_nyc_lpc_permit_deep/candidates.json",
  "tmp/subagents/round159_nyc_lpc_permit_next/candidates.json",
  "tmp/subagents/round163_nyc_lpc_permit_next2/candidates.json",
  "tmp/subagents/round168_nyc_lpc_permit_next3/candidates.json"
];

const SELECT_FIELDS = [
  "docket",
  "address",
  "received_date",
  "borough",
  "block",
  "lot",
  "lmnametype",
  "applicant_name",
  "applicant_co",
  "communityboard",
  "community_board",
  "worktypes",
  "regulation_type",
  "issue_date",
  "latitude",
  "longitude",
  "xcoordinate",
  "ycoordinate",
  "regulation_number",
  "expiration_date"
];

const REGULATION_TYPE_WEIGHTS = [
  [/certificate of appropriateness/i, 9],
  [/commission binding report/i, 8],
  [/commission advisory report/i, 7],
  [/commission denial/i, 5],
  [/staff binding report/i, 6],
  [/staff advisory report/i, 5],
  [/permit for minor work/i, 6],
  [/certificate of no effect/i, 5],
  [/authorization to proceed/i, 5],
  [/notice of review/i, 3],
  [/miscellaneous - amendment/i, 2],
  [/status update letter/i, 1],
  [/notice of compliance/i, -12],
  [/withdrawn at staff level/i, -5],
  [/sample|deactivation|revocation/i, -8]
];

const WORKTYPE_WEIGHTS = [
  [/new building|new structure|new construction/i, 18],
  [/rooftop addition|roof addition|rear yard addition|vertical enlargement|enlargement|\badditions?\b/i, 15],
  [/demolition|partial demolition|excavation|foundation|underpinning/i, 14],
  [/cofa filing drawings/i, 12],
  [/primary facades?|facade reconstruction|exterior repairs?: primary|local law 11|masonry|natural and cast stone|cast stone|historic material/i, 12],
  [/restorative work|restoration|reconstruction|repair of/i, 10],
  [/storefront infill|new storefront|storefront/i, 9],
  [/window repair\/replacement: primary|new windows|primary facades?: existing original\/historic openings|replace or modify door|openings/i, 8],
  [/barrier[- ]free|accessibility|accessible|ramp|lift|elevator/i, 7],
  [/roof work|green roof|solar|hvac equipment.*rooftops?|mechanical equipment.*rooftops?/i, 6],
  [/sign-off|notice of compliance request/i, -5],
  [/interior alterations/i, -4],
  [/sample|legacy- not available/i, -8]
];

function readTextIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function readJsonIfExists(file) {
  const text = readTextIfExists(file);
  if (!text) return null;
  return JSON.parse(text);
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function cleanText(value, limit) {
  const text = String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!limit || text.length <= limit) return text;
  return `${text.slice(0, limit - 3).trim()}...`;
}

function slugify(value, limit = 100) {
  const slug = cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
  return (slug || "lpc-permit").slice(0, limit).replace(/-+$/g, "");
}

function dateOnly(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nycPoint(row) {
  const latitude = numberOrNull(row.latitude);
  const longitude = numberOrNull(row.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < 40.4774 || latitude > 40.9176 || longitude < -74.2591 || longitude > -73.7004) return null;
  return {
    latitude: Number(latitude.toFixed(8)),
    longitude: Number(longitude.toFixed(8))
  };
}

function normalizeBorough(value) {
  const text = cleanText(value).toUpperCase();
  return {
    MANHATTAN: "Manhattan",
    NEWYORK: "Manhattan",
    "NEW YORK": "Manhattan",
    MN: "Manhattan",
    BROOKLYN: "Brooklyn",
    BK: "Brooklyn",
    BRONX: "Bronx",
    BX: "Bronx",
    QUEENS: "Queens",
    QN: "Queens",
    "STATEN ISLAND": "Staten Island",
    STATENISLAND: "Staten Island",
    SI: "Staten Island"
  }[text] || cleanText(value);
}

function normalizeRegulationNumber(value) {
  return cleanText(value).toUpperCase();
}

function titleDateKey(cityId, title, date) {
  return `${cityId}|${cleanText(title).toLowerCase()}|${date}`;
}

function sourceDateKey(sourceId, sourceRecordId, date) {
  return `${cleanText(sourceId).toLowerCase()}|${normalizeRegulationNumber(sourceRecordId)}|${date}`;
}

function recordDateKey(sourceRecordId, date) {
  return `${normalizeRegulationNumber(sourceRecordId)}|${date}`;
}

function recordUrl(regulationNumber) {
  return `${API_ENDPOINT}?regulation_number=${encodeURIComponent(regulationNumber)}`;
}

function addRegexMatches(text, regex, set) {
  let match = regex.exec(text);
  while (match) {
    set.add(normalizeRegulationNumber(match[0]));
    match = regex.exec(text);
  }
}

function collectExistingKeys() {
  const eventIds = new Set();
  const recordIds = new Set();
  const titleDates = new Set();
  const sourceUrls = new Set();
  const sourceDateKeys = new Set();
  const recordDateKeys = new Set();
  const scannedFiles = [];
  const missingFiles = [];
  const corpusFiles = [CORPUS_PATH];

  try {
    for (const entry of fs.readdirSync(CITY_ATLAS_NYC_DIR, { withFileTypes: true })) {
      if (entry.isFile() && /^events_\d{4}\.json$/.test(entry.name)) {
        corpusFiles.push(path.join(CITY_ATLAS_NYC_DIR, entry.name));
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    missingFiles.push(path.relative(ROOT, CITY_ATLAS_NYC_DIR));
  }

  for (const corpusFile of corpusFiles) {
    const corpus = readJsonIfExists(corpusFile);
    if (!corpus) {
      missingFiles.push(path.relative(ROOT, corpusFile));
      continue;
    }
    scannedFiles.push(path.relative(ROOT, corpusFile));
    for (const event of corpus.events || []) {
      if (event.city_id && event.city_id !== "nyc") continue;
      if (event.event_id || event.id) eventIds.add(cleanText(event.event_id || event.id));
      const provenance = event.provenance || {};
      const evidence = Array.isArray(event.evidence) ? event.evidence[0] || {} : {};
      const eventSourceRecordId = event.source_record_id || provenance.source_record_id || evidence.record_id;
      const eventDate = event.date || event.effective_date;
      const eventSourceId = event.source_id || event.source_dataset_id || provenance.source_dataset_id || evidence.source_id || event.source_name;
      if (eventSourceRecordId) recordIds.add(normalizeRegulationNumber(eventSourceRecordId));
      if (event.source_url || provenance.source_url || evidence.url) sourceUrls.add(cleanText(event.source_url || provenance.source_url || evidence.url).toLowerCase());
      if (event.title && eventDate) titleDates.add(titleDateKey(event.city_id || "nyc", event.title, eventDate));
      if (eventSourceRecordId && eventDate) {
        recordDateKeys.add(recordDateKey(eventSourceRecordId, eventDate));
      }
      if (eventSourceId && eventSourceRecordId && eventDate) {
        sourceDateKeys.add(sourceDateKey(eventSourceId, eventSourceRecordId, eventDate));
      }
      const eventText = JSON.stringify({
        event_id: event.event_id || event.id,
        source_record_id: eventSourceRecordId,
        source_url: event.source_url || provenance.source_url || evidence.url,
        evidence_fields: event.evidence_fields,
        raw_context: event.raw_context,
        provenance: event.provenance,
        evidence: event.evidence,
        title: event.title,
        summary: event.summary
      });
      addRegexMatches(eventText, /\b(?:COFA|CNE|PMW|CRB|CD|SBR|SAR|CAR|ATP|NOR|NOC|SUL|MISC|WSL|MOD|TDR|REV)-\d{2}-\d{3,6}\b/gi, recordIds);
    }
  }

  for (const relative of PRIOR_PACK_PATHS) {
    const file = path.join(ROOT, relative);
    const text = readTextIfExists(file);
    if (!text) {
      missingFiles.push(relative);
      continue;
    }
    scannedFiles.push(relative);
    addRegexMatches(text, /\b(?:COFA|CNE|PMW|CRB|CD|SBR|SAR|CAR|ATP|NOR|NOC|SUL|MISC|WSL|MOD|TDR|REV)-\d{2}-\d{3,6}\b/gi, recordIds);
    const parsed = JSON.parse(text);
    const candidates = Array.isArray(parsed) ? parsed : parsed.candidates || [];
    for (const candidate of candidates) {
      if (candidate.event_id || candidate.candidate_id || candidate.id) eventIds.add(cleanText(candidate.event_id || candidate.candidate_id || candidate.id));
      const candidateSourceRecordId = candidate.source_record_id || candidate.raw_row_subset?.regulation_number || candidate.evidence_fields?.regulation_number;
      const candidateDate = candidate.date || candidate.effective_date || candidate.evidence_fields?.issue_date;
      const candidateSourceId = candidate.source_id || candidate.source_dataset_id || candidate.source_name;
      if (candidateSourceRecordId) recordIds.add(normalizeRegulationNumber(candidateSourceRecordId));
      if (candidate.source_url) sourceUrls.add(cleanText(candidate.source_url).toLowerCase());
      if (candidate.title && candidate.date) titleDates.add(titleDateKey(candidate.city_id || "nyc", candidate.title, candidate.date));
      if (candidateSourceRecordId && candidateDate) {
        recordDateKeys.add(recordDateKey(candidateSourceRecordId, candidateDate));
      }
      if (candidateSourceId && candidateSourceRecordId && candidateDate) {
        sourceDateKeys.add(sourceDateKey(candidateSourceId, candidateSourceRecordId, candidateDate));
      }
    }
  }

  return { eventIds, recordIds, titleDates, sourceUrls, sourceDateKeys, recordDateKeys, scannedFiles, missingFiles };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Bims-5 round174 NYC LPC permit candidate fetcher" }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fetch failed for ${url}: ${response.status} ${response.statusText} ${body.slice(0, 500)}`);
  }
  return response.json();
}

async function fetchMetadata() {
  return fetchJson(METADATA_URL);
}

async function fetchRows() {
  const rows = [];
  const baseWhere = [
    `issue_date between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
    "regulation_number IS NOT NULL",
    "worktypes IS NOT NULL"
  ].join(" AND ");

  let offset = 0;
  let firstPageUrl = "";
  while (true) {
    const params = new URLSearchParams({
      "$select": SELECT_FIELDS.join(","),
      "$where": baseWhere,
      "$order": "issue_date ASC, regulation_number ASC",
      "$limit": String(PAGE_SIZE),
      "$offset": String(offset)
    });
    const url = `${API_ENDPOINT}?${params.toString()}`;
    if (!firstPageUrl) firstPageUrl = url;
    const batch = await fetchJson(url);
    if (!Array.isArray(batch)) throw new Error(`Expected Socrata row array at offset ${offset}`);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      return { rows, query_url: firstPageUrl };
    }
    offset += PAGE_SIZE;
  }
}

function uniqueClean(values) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function collapseRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const regulationNumber = normalizeRegulationNumber(row.regulation_number);
    if (!regulationNumber) continue;
    if (!groups.has(regulationNumber)) {
      groups.set(regulationNumber, {
        ...row,
        regulation_number: regulationNumber,
        __representative: row,
        __rows: [],
        __worktypes: [],
        __landmarks: [],
        __addresses: [],
        __community_boards: []
      });
    }
    const group = groups.get(regulationNumber);
    group.__rows.push(row);
    group.__worktypes.push(row.worktypes);
    group.__landmarks.push(row.lmnametype);
    group.__addresses.push(row.address);
    group.__community_boards.push(row.community_board || row.communityboard);

    const rowIssueDate = dateOnly(row.issue_date);
    const groupIssueDate = dateOnly(group.issue_date);
    const currentRepresentative = group.__representative || group;
    const rowQuality = scoreRow({ ...row, regulation_number: regulationNumber });
    const representativeQuality = scoreRow({ ...currentRepresentative, regulation_number: regulationNumber });
    if (
      rowQuality > representativeQuality ||
      (rowQuality === representativeQuality && rowIssueDate && (!groupIssueDate || rowIssueDate > groupIssueDate))
    ) {
      Object.assign(group, row);
      group.regulation_number = regulationNumber;
      group.__representative = row;
    }
  }

  return [...groups.values()].map((group) => ({
    ...group,
    worktypes: uniqueClean(group.__worktypes).join(", "),
    lmnametype: cleanText(group.__representative?.lmnametype || group.lmnametype),
    address: cleanText(group.__representative?.address || group.address),
    borough: normalizeBorough(group.__representative?.borough || group.borough),
    community_board: cleanText(group.__representative?.community_board || group.__representative?.communityboard || group.community_board || group.communityboard),
    related_addresses_for_regulation_number: uniqueClean(group.__addresses),
    related_landmark_contexts_for_regulation_number: uniqueClean(group.__landmarks),
    row_count_for_regulation_number: group.__rows.length
  }));
}

function weightFromRules(text, rules) {
  return rules.reduce((sum, [regex, weight]) => sum + (regex.test(text) ? weight : 0), 0);
}

function classifyBucket(regulationType, worktypes) {
  const combined = `${regulationType} ${worktypes}`;
  if (/new building|new structure|new construction/i.test(combined)) return "heritage_permit_new_building";
  if (/addition|enlargement|rooftop|rear yard/i.test(combined)) return "heritage_permit_addition";
  if (/demolition|excavation|foundation|underpinning/i.test(combined)) return "heritage_permit_structural_scope";
  if (/facade|restor|masonry|cast stone|local law 11|exterior repairs?/i.test(combined)) return "heritage_permit_facade_restoration";
  if (/storefront/i.test(combined)) return "heritage_permit_storefront";
  if (/window|door|opening/i.test(combined)) return "heritage_permit_openings";
  return "heritage_permit_application";
}

function actionVerb(regulationType) {
  const text = cleanText(regulationType);
  if (/denial/i.test(text)) return "recorded";
  if (/report|letter|review|notice/i.test(text)) return "issued";
  if (/withdrawn/i.test(text)) return "recorded";
  return "issued";
}

function scoreRow(row) {
  const worktypes = cleanText(row.worktypes);
  const regulationType = cleanText(row.regulation_type);
  const landmark = cleanText(row.lmnametype);
  const combined = `${worktypes} ${regulationType} ${landmark}`;
  let score = weightFromRules(combined, WORKTYPE_WEIGHTS) + weightFromRules(regulationType, REGULATION_TYPE_WEIGHTS);

  if (/individual landmark|interior landmark|scenic landmark/i.test(landmark)) score += 3;
  if (/historic district/i.test(landmark)) score += 1;
  if (/filing any work/i.test(worktypes) && !/(new building|addition|facade|restor|storefront|demolition|window|door|roof)/i.test(worktypes)) score -= 5;
  if (!/(new building|addition|enlargement|demolition|foundation|facade|restor|storefront|window|door|opening|roof|masonry|stone|local law|accessibility|ramp|elevator|solar|hvac)/i.test(worktypes)) score -= 8;
  if (/withdrawn at staff level/i.test(regulationType) && !/new building|demolition|addition|rooftop|rear yard/i.test(worktypes)) score -= 8;

  return score;
}

function candidateFrom(row) {
  const date = dateOnly(row.issue_date);
  const receivedDate = dateOnly(row.received_date);
  const expirationDate = dateOnly(row.expiration_date);
  const point = nycPoint(row);
  const regulationNumber = normalizeRegulationNumber(row.regulation_number);
  const regulationType = cleanText(row.regulation_type);
  const worktypes = cleanText(row.worktypes);
  const address = cleanText(row.address);
  const borough = cleanText(row.borough);
  const communityBoard = cleanText(row.community_board || row.communityboard);
  const landmarkContext = cleanText(row.lmnametype);
  const titleAddress = address || "an LPC-regulated site";
  const eventId = `nyc-lpc-permit-round174-${slugify(regulationNumber, 48)}`;
  const areaParts = [borough, communityBoard, landmarkContext].filter(Boolean);
  const issueClause = date ? ` issued on ${date}` : "";
  const sourceUrl = recordUrl(regulationNumber);

  return {
    city_id: "nyc",
    event_id: eventId,
    candidate_id: eventId,
    date,
    effective_date: date,
    date_precision: "day",
    bucket: classifyBucket(regulationType, worktypes),
    category: "planning/development/architecture/historic-preservation",
    subcategory: `lpc-${slugify(regulationType, 64)}`,
    title: `LPC ${actionVerb(regulationType)} ${regulationType || "permit/application action"} for ${titleAddress}`,
    summary: `The official LPC Permit Application Information row records ${regulationNumber} as ${regulationType || "an LPC permit/application action"}${issueClause} for ${titleAddress}${borough ? `, ${borough}` : ""}. Source WorkTypes: ${worktypes || "not supplied"}.`,
    observed_change: `Official LPC administrative permit/application processing milestone: ${regulationType || "LPC action"} for a protected-site record. This does not assert that proposed work started, was completed, complied with approvals, or changed the final physical condition.`,
    area: areaParts.length ? areaParts.join("; ") : "New York City landmark or historic district context from LPC permit row",
    location_name: [address, borough, "New York City"].filter(Boolean).join(", "),
    latitude: point.latitude,
    longitude: point.longitude,
    source_ids: [SOURCE_ID],
    source_id: SOURCE_ID,
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: sourceUrl,
    source_record_id: regulationNumber,
    source_type: "official NYC Open Data Socrata API permit/application row",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    source_date_field: "issue_date",
    source_dataset_id: SOURCE_DATASET_ID,
    confidence: "documented",
    architect: cleanText(row.applicant_name) || "Source row does not name a project architect.",
    project_type: `LPC ${regulationType || "permit/application"} administrative action`,
    geometry_source: `Latitude/longitude fields from official dpm2-m9mq row for regulation_number ${regulationNumber}; address=${address || "not supplied"}; block=${cleanText(row.block) || "not supplied"}; lot=${cleanText(row.lot) || "not supplied"}.`,
    geometry_precision: "Official row point/geocode for the permit address or parcel context; not the geometry of proposed work and not a landmark boundary.",
    license_or_terms_note: "NYC Open Data / NYC.gov terms apply; dataset metadata licenseId/license is null. Attribute LPC/NYC Open Data, preserve row identifiers, and re-check metadata before redistribution.",
    license_url: NYC_OPEN_DATA_TERMS,
    attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
    limitations: "LPC permit/application processing is an administrative preservation action. It is not construction start, completion, compliance sign-off, final physical condition, preservation outcome, or full approved-work geometry evidence. WorkTypes are source category text and may summarize rather than fully describe the scope; rows can be refreshed or corrected after retrieval.",
    transformation_method: `scripts/fetch_round174_nyc_lpc_permit_next4_candidates.js queried official NYC Open Data dpm2-m9mq rows with issue_date from ${START_DATE} through ${END_DATE}, required official latitude/longitude and regulation_number, scored architecture-facing WorkTypes/regulation_type values, deduplicated against the current corpus plus prior LPC permit/designation packs through round168, and selected up to ${MAX_CANDIDATES} high-signal administrative milestones without inferring physical work.`,
    permit_application_ids: {
      regulation_number: regulationNumber,
      docket: cleanText(row.docket)
    },
    evidence_fields: {
      docket: cleanText(row.docket),
      regulation_number: regulationNumber,
      regulation_type: regulationType,
      worktypes,
      landmark_name_type: landmarkContext,
      address,
      borough,
      block: cleanText(row.block),
      lot: cleanText(row.lot),
      community_board: communityBoard,
      received_date: receivedDate,
      issue_date: date,
      expiration_date: expirationDate
    },
    raw_row_subset: {
      docket: cleanText(row.docket),
      address,
      received_date: cleanText(row.received_date),
      borough,
      block: cleanText(row.block),
      lot: cleanText(row.lot),
      lmnametype: landmarkContext,
      applicant_name: cleanText(row.applicant_name),
      applicant_co: cleanText(row.applicant_co),
      communityboard: cleanText(row.communityboard),
      community_board: communityBoard,
      worktypes,
      regulation_type: regulationType,
      issue_date: cleanText(row.issue_date),
      latitude: cleanText(row.latitude),
      longitude: cleanText(row.longitude),
      xcoordinate: cleanText(row.xcoordinate),
      ycoordinate: cleanText(row.ycoordinate),
      regulation_number: regulationNumber,
      expiration_date: cleanText(row.expiration_date),
      row_count_for_regulation_number: row.row_count_for_regulation_number || 1,
      related_addresses_for_regulation_number: row.related_addresses_for_regulation_number || [address].filter(Boolean),
      related_landmark_contexts_for_regulation_number: row.related_landmark_contexts_for_regulation_number || [landmarkContext].filter(Boolean)
    },
    selection_score: scoreRow(row)
  };
}

function reject(rejected, reason, row, extra = {}) {
  rejected.counts[reason] = (rejected.counts[reason] || 0) + 1;
  if (rejected.examples.length < 600) {
    rejected.examples.push({
      reason,
      source_record_id: normalizeRegulationNumber(row.regulation_number),
      date: dateOnly(row.issue_date),
      regulation_type: cleanText(row.regulation_type),
      worktypes: cleanText(row.worktypes, 180),
      address: cleanText(row.address, 140),
      ...extra
    });
  }
}

function byCount(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function selectCandidates(rows, existing) {
  const rejected = { counts: {}, examples: [] };
  const candidates = [];
  const seenEventIds = new Set();
  const seenRecordIds = new Set();
  const seenTitleDates = new Set();
  const seenRecordDateKeys = new Set();
  const seenSourceDateKeys = new Set();

  for (const row of collapseRows(rows)) {
    const regulationNumber = normalizeRegulationNumber(row.regulation_number);
    const date = dateOnly(row.issue_date);
    const point = nycPoint(row);
    if (!date || date < START_DATE || date > END_DATE) {
      reject(rejected, "outside_date_window_or_missing_issue_date", row);
      continue;
    }
    if (!point) {
      reject(rejected, "missing_or_outside_nyc_geometry", row);
      continue;
    }
    if (!regulationNumber) {
      reject(rejected, "missing_regulation_number", row);
      continue;
    }
    if (existing.recordIds.has(regulationNumber) || seenRecordIds.has(regulationNumber)) {
      reject(rejected, "duplicate_regulation_number_in_corpus_or_prior_pack", row);
      continue;
    }
    const candidate = candidateFrom(row);
    const candidateSourceDateKeys = [
      sourceDateKey(candidate.source_id, candidate.source_record_id, candidate.date),
      sourceDateKey(candidate.source_dataset_id, candidate.source_record_id, candidate.date),
      sourceDateKey("nyc-lpc-permit-application-information", candidate.source_record_id, candidate.date),
      sourceDateKey(SOURCE_DATASET_ID, candidate.source_record_id, candidate.date)
    ];
    const candidateRecordDateKey = recordDateKey(candidate.source_record_id, candidate.date);
    if (existing.eventIds.has(candidate.event_id) || seenEventIds.has(candidate.event_id)) {
      reject(rejected, "duplicate_event_id_in_corpus_or_prior_pack", row);
      continue;
    }
    if (existing.recordDateKeys.has(candidateRecordDateKey) || seenRecordDateKeys.has(candidateRecordDateKey)) {
      reject(rejected, "duplicate_source_record_date_in_corpus_or_prior_pack", row);
      continue;
    }
    if (candidateSourceDateKeys.some((key) => existing.sourceDateKeys.has(key) || seenSourceDateKeys.has(key))) {
      reject(rejected, "duplicate_source_date_key_in_corpus_or_prior_pack", row);
      continue;
    }
    const candidateTitleDate = titleDateKey(candidate.city_id, candidate.title, candidate.date);
    if (existing.titleDates.has(candidateTitleDate) || seenTitleDates.has(candidateTitleDate)) {
      reject(rejected, "duplicate_title_date_in_corpus_or_prior_pack", row);
      continue;
    }
    if (existing.sourceUrls.has(candidate.source_url.toLowerCase())) {
      reject(rejected, "duplicate_source_url_in_corpus_or_prior_pack", row);
      continue;
    }
    if (candidate.selection_score < 16) {
      reject(rejected, "below_high_signal_threshold", row, { selection_score: candidate.selection_score });
      continue;
    }
    if (/notice of compliance|withdrawn at staff level|sample|deactivation|final decision of revocation/i.test(candidate.evidence_fields.regulation_type)) {
      reject(rejected, "excluded_non_candidate_regulation_type", row);
      continue;
    }
    candidates.push(candidate);
    seenEventIds.add(candidate.event_id);
    seenRecordIds.add(regulationNumber);
    seenTitleDates.add(candidateTitleDate);
    seenRecordDateKeys.add(candidateRecordDateKey);
    for (const key of candidateSourceDateKeys) seenSourceDateKeys.add(key);
  }

  const selected = balancedSelection(candidates);
  const selectedIds = new Set(selected.map((candidate) => candidate.source_record_id));
  for (const candidate of candidates) {
    if (!selectedIds.has(candidate.source_record_id)) {
      reject(rejected, "eligible_but_not_selected_after_cap", candidate, { selection_score: candidate.selection_score });
    }
  }

  return {
    candidates: selected.map(({ selection_score, ...candidate }) => candidate),
    rejected,
    eligible_before_cap: candidates.length
  };
}

function balancedSelection(candidates) {
  const selected = [];
  const selectedIds = new Set();
  const perYear = new Map();
  const typePerYear = new Map();
  const sorted = [...candidates].sort(compareCandidateQuality);

  for (const candidate of sorted) {
    if (selected.length >= MAX_CANDIDATES) break;
    const year = candidate.date.slice(0, 4);
    const type = candidate.evidence_fields.regulation_type || "unknown";
    const yearCount = perYear.get(year) || 0;
    const typeYearKey = `${year}|${type}`;
    const typeYearCount = typePerYear.get(typeYearKey) || 0;
    if (yearCount >= 10) continue;
    if (typeYearCount >= 4) continue;
    select(candidate);
  }

  for (const candidate of sorted) {
    if (selected.length >= MAX_CANDIDATES) break;
    if (!selectedIds.has(candidate.source_record_id)) select(candidate);
  }

  return selected.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  function select(candidate) {
    selected.push(candidate);
    selectedIds.add(candidate.source_record_id);
    const year = candidate.date.slice(0, 4);
    const type = candidate.evidence_fields.regulation_type || "unknown";
    perYear.set(year, (perYear.get(year) || 0) + 1);
    typePerYear.set(`${year}|${type}`, (typePerYear.get(`${year}|${type}`) || 0) + 1);
  }
}

function compareCandidateQuality(a, b) {
  return b.selection_score - a.selection_score ||
    regulationPriority(b.evidence_fields.regulation_type) - regulationPriority(a.evidence_fields.regulation_type) ||
    b.date.localeCompare(a.date) ||
    a.source_record_id.localeCompare(b.source_record_id);
}

function regulationPriority(value) {
  const text = cleanText(value);
  if (/certificate of appropriateness/i.test(text)) return 8;
  if (/commission binding report/i.test(text)) return 7;
  if (/permit for minor work/i.test(text)) return 6;
  if (/certificate of no effect/i.test(text)) return 5;
  if (/staff binding report/i.test(text)) return 4;
  if (/authorization to proceed/i.test(text)) return 3;
  if (/commission denial/i.test(text)) return 2;
  return 1;
}

function buildSourceAudit(metadata, queryUrl, sourceStats, existing) {
  const columnNames = (metadata.columns || [])
    .filter((column) => !String(column.name || "").startsWith(":"))
    .map((column) => ({
      name: column.name,
      field_name: column.fieldName,
      type: column.dataTypeName
    }));
  return {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    audit_scope: "Official NYC LPC Permit Application Information source audit for round174 high-signal permit/application candidate extraction.",
    sources: [
      {
        source_id: SOURCE_ID,
        source_dataset_id: SOURCE_DATASET_ID,
        source_name: SOURCE_NAME,
        publisher: PUBLISHER,
        official: true,
        source_url: DATASET_PAGE,
        metadata_url: METADATA_URL,
        api_endpoint: API_ENDPOINT,
        api_query: queryUrl,
        source_type: "Official NYC Open Data Socrata dataset containing permit applications for work submitted to and processed by LPC at landmark sites.",
        description_from_metadata: cleanText(metadata.description) || "Contains information pertaining to permit applications for work to landmark sites submitted to and processed by LPC.",
        attribution: metadata.attribution || "Landmarks Preservation Commission (LPC)",
        license_or_terms_note: "Dataset metadata licenseId/license is null. NYC Open Data Terms of Use and NYC.gov Terms of Use apply; public datasets may be updated, corrected, or refreshed by the submitting agency.",
        license_url: NYC_OPEN_DATA_TERMS,
        accessed_at: ACCESSED_AT,
        rows_updated_at_utc: metadata.rowsUpdatedAt ? new Date(metadata.rowsUpdatedAt * 1000).toISOString() : null,
        coverage_years_checked: `${START_DATE} through ${END_DATE} using issue_date.`,
        row_counts: sourceStats,
        geographic_scope: "New York City landmark properties, individual/interior/scenic landmarks, and historic districts represented in LPC permit/application rows.",
        granularity: "One regulation_number-level permit/application administrative row after collapsing duplicate rows with the same regulation_number.",
        key_fields_used: SELECT_FIELDS,
        available_columns: columnNames,
        reliability: "usable_with_caveats",
        required_caveats: [
          "issue_date is an administrative action date, not a construction start or completion date.",
          "regulation_type and WorkTypes describe LPC permit/application processing categories and should not be promoted to physical outcome claims.",
          "Coordinates are row point/geocode fields and should not be treated as exact work geometry, landmark boundaries, or approved-work geometry.",
          "Rows may be updated, corrected, or refreshed after the access date.",
          "Notice of Compliance, if present in the source, is not treated here as independent proof of compliance sign-off or final physical condition."
        ],
        ingestion_recommendation: "Append selected rows only as documented LPC administrative preservation milestones after duplicate screening, retaining regulation_number, issue_date, address/BBL, landmark context, WorkTypes, coordinates, source URL, and explicit non-completion caveats.",
        dedupe_inputs: {
          scanned_files: existing.scannedFiles,
          missing_optional_files: existing.missingFiles,
          record_ids_seen: existing.recordIds.size,
          title_date_keys_seen: existing.titleDates.size,
          source_urls_seen: existing.sourceUrls.size,
          source_date_keys_seen: existing.sourceDateKeys.size,
          record_date_keys_seen: existing.recordDateKeys.size
        }
      }
    ]
  };
}

function validateCandidates(candidates, existing) {
  const errors = [];
  const ids = new Set();
  const sourceRecords = new Set();
  const sourceDateKeys = new Set();
  const recordDateKeys = new Set();
  for (const [index, candidate] of candidates.entries()) {
    const label = candidate.source_record_id || `index ${index}`;
    for (const field of [
      "city_id",
      "event_id",
      "candidate_id",
      "title",
      "summary",
      "observed_change",
      "date",
      "latitude",
      "longitude",
      "source_id",
      "source_name",
      "publisher",
      "source_url",
      "source_record_id",
      "source_type",
      "accessed_at",
      "source_date_field",
      "source_dataset_id",
      "confidence",
      "geometry_source",
      "geometry_precision",
      "license_or_terms_note",
      "limitations",
      "transformation_method",
      "raw_row_subset"
    ]) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${label}: missing ${field}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`${label}: city_id must be nyc`);
    if (candidate.date < START_DATE || candidate.date > END_DATE) errors.push(`${label}: date outside target window`);
    if (!nycPoint({ latitude: candidate.latitude, longitude: candidate.longitude })) errors.push(`${label}: coordinates outside NYC envelope`);
    if (candidate.source_dataset_id !== SOURCE_DATASET_ID) errors.push(`${label}: unexpected source_dataset_id`);
    if (!/administrative|not construction start|not evidence of construction start|not construction/i.test(candidate.limitations)) {
      errors.push(`${label}: limitations missing administrative/non-construction caveat`);
    }
    if (/caused|will increase|will decrease|forecast|simulate|prediction|was completed|is completed/i.test(`${candidate.title} ${candidate.summary}`)) {
      errors.push(`${label}: possible overclaiming language in displayed fields`);
    }
    if (ids.has(candidate.event_id)) errors.push(`${label}: duplicate event_id`);
    if (sourceRecords.has(candidate.source_record_id)) errors.push(`${label}: duplicate source_record_id`);
    if (existing.eventIds.has(candidate.event_id)) errors.push(`${label}: event_id already exists in corpus or prior packs`);
    const candidateRecordDateKey = recordDateKey(candidate.source_record_id, candidate.date);
    const candidateSourceDateKeys = [
      sourceDateKey(candidate.source_id, candidate.source_record_id, candidate.date),
      sourceDateKey(candidate.source_dataset_id, candidate.source_record_id, candidate.date),
      sourceDateKey("nyc-lpc-permit-application-information", candidate.source_record_id, candidate.date),
      sourceDateKey(SOURCE_DATASET_ID, candidate.source_record_id, candidate.date)
    ];
    if (recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: duplicate source_record/date key in candidate pack`);
    if (existing.recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: source_record/date key already exists in corpus or prior packs`);
    for (const key of candidateSourceDateKeys) {
      if (sourceDateKeys.has(key)) errors.push(`${label}: duplicate source/date key in candidate pack`);
      if (existing.sourceDateKeys.has(key)) errors.push(`${label}: source/date key already exists in corpus or prior packs`);
    }
    ids.add(candidate.event_id);
    sourceRecords.add(candidate.source_record_id);
    recordDateKeys.add(candidateRecordDateKey);
    for (const key of candidateSourceDateKeys) sourceDateKeys.add(key);
  }
  if (errors.length) {
    throw new Error(`Candidate validation failed:\n${errors.slice(0, 80).join("\n")}`);
  }
}

function markdownNotes(summary) {
  return [
    "# Round174 NYC LPC Permit Application Information Next4 Candidates",
    "",
    `Generated: ${summary.generated_at}`,
    `Source: ${SOURCE_NAME} (${SOURCE_DATASET_ID})`,
    `Window: ${START_DATE} through ${END_DATE}, using issue_date.`,
    "",
    "## Selection",
    "",
    `Fetched ${summary.rows_fetched.toLocaleString("en-US")} rows and collapsed them to ${summary.collapsed_regulation_numbers.toLocaleString("en-US")} regulation_number records.`,
    `Retained ${summary.candidate_count} high-signal, non-duplicate administrative preservation milestones out of ${summary.eligible_before_cap.toLocaleString("en-US")} eligible records before the cap.`,
    "",
    "Rows were scored for architecture/preservation signal in WorkTypes and regulation_type, then balanced across years and regulation types. Dedupe checked the current corpus files and prior LPC permit/designation candidate packs through round168.",
    "",
    "## Caveat",
    "",
    "LPC permit/application processing is an administrative preservation action. These records are not construction starts, completions, compliance sign-offs, final physical condition observations, preservation outcomes, or full approved-work geometries.",
    "",
    "## Files",
    "",
    "- candidates.json",
    "- source_audit.json",
    "- summary.json",
    "- rejected.json",
    "- notes.md"
  ].join("\n");
}

async function main() {
  const existing = collectExistingKeys();
  const [metadata, fetched] = await Promise.all([fetchMetadata(), fetchRows()]);
  const collapsedCount = collapseRows(fetched.rows).length;
  const { candidates, rejected, eligible_before_cap } = selectCandidates(fetched.rows, existing);
  validateCandidates(candidates, existing);

  const summary = {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    task: "Round174 NYC LPC Permit Application Information next4 candidate pack",
    source_id: SOURCE_ID,
    source_dataset_id: SOURCE_DATASET_ID,
    start_date: START_DATE,
    end_date: END_DATE,
    rows_fetched: fetched.rows.length,
    collapsed_regulation_numbers: collapsedCount,
    eligible_before_cap,
    candidate_count: candidates.length,
    date_range: {
      start: candidates[0]?.date || null,
      end: candidates[candidates.length - 1]?.date || null
    },
    by_year: byCount(candidates, (candidate) => candidate.date.slice(0, 4)),
    by_regulation_type: byCount(candidates, (candidate) => candidate.evidence_fields.regulation_type),
    by_bucket: byCount(candidates, (candidate) => candidate.bucket),
    by_borough: byCount(candidates, (candidate) => candidate.evidence_fields.borough),
    dedupe_inputs: {
      scanned_files: existing.scannedFiles,
      missing_optional_files: existing.missingFiles,
      existing_record_ids: existing.recordIds.size,
      existing_title_date_keys: existing.titleDates.size,
      existing_source_urls: existing.sourceUrls.size,
      existing_source_date_keys: existing.sourceDateKeys.size,
      existing_record_date_keys: existing.recordDateKeys.size,
      existing_event_ids: existing.eventIds.size
    },
    selection: {
      max_candidates: MAX_CANDIDATES,
      minimum_score: 16,
      balance_rule: "First pass selected at most 10 candidates per issue year and at most 4 candidates per regulation type per year; second pass filled remaining capacity by score.",
      caveat: "Administrative LPC permit/application processing only; no construction, completion, compliance, condition, outcome, causality, or geometry-of-work claim is made."
    }
  };

  const sourceAudit = buildSourceAudit(metadata, fetched.query_url, {
    fetched_rows: fetched.rows.length,
    collapsed_regulation_numbers: collapsedCount,
    candidates: candidates.length,
    eligible_before_cap
  }, existing);

  const candidatesPayload = {
    generated_at: summary.generated_at,
    task: summary.task,
    source_id: SOURCE_ID,
    source_dataset_id: SOURCE_DATASET_ID,
    candidate_count: candidates.length,
    candidates
  };
  const rejectedPayload = {
    generated_at: summary.generated_at,
    source_id: SOURCE_ID,
    rejected_counts: rejected.counts,
    rejected_examples: rejected.examples
  };

  writeJson(CANDIDATES_PATH, candidatesPayload);
  writeJson(SOURCE_AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTED_PATH, rejectedPayload);
  writeText(NOTES_PATH, markdownNotes(summary));

  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR),
    candidate_count: candidates.length,
    date_range: summary.date_range,
    by_regulation_type: summary.by_regulation_type,
    rows_fetched: fetched.rows.length,
    collapsed_regulation_numbers: collapsedCount,
    eligible_before_cap
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

