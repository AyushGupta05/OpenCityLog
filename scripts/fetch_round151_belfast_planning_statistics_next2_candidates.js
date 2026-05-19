const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_SCRIPT_PATH = path.join(
  ROOT_DIR,
  "scripts",
  "fetch_round145_belfast_planning_statistics_next_candidates.js"
);
const CORPUS_PATH = path.join(
  ROOT_DIR,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const OUT_DIR = path.join(
  ROOT_DIR,
  "tmp",
  "subagents",
  "round151_belfast_planning_statistics_next2"
);
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const REJECTIONS_PATH = path.join(OUT_DIR, "rejections.json");

const ROUND_ID = "round151_belfast_planning_statistics_next2";
const SOURCE_ID = "ni-planning-statistics";
const SOURCE_NAME = "Northern Ireland planning activity statistics";
const PUBLISHER = "Department for Infrastructure, Northern Ireland";
const SOURCE_URL = "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const LICENSE = "Open Government Licence v3.0, where the statistical release is published as public-sector information; verify per release.";
const LICENSE_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const ATTRIBUTION = "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0, where applicable.";
const ACCESSED_AT = "2026-05-19";
const DATE_START = "2016-01-01";
const DATE_END = "2025-12-31";
const MIN_SCORE = 55;
const MAX_CANDIDATES = 30;
const REJECTION_DETAIL_CAP = 500;

const PRIOR_PACKS = [
  {
    round_id: "round131_belfast_planning_statistics",
    path: path.join(ROOT_DIR, "tmp", "subagents", "round131_belfast_planning_statistics", "candidates.json")
  },
  {
    round_id: "round134_belfast_planning_statistics_deep",
    path: path.join(ROOT_DIR, "tmp", "subagents", "round134_belfast_planning_statistics_deep", "candidates.json")
  },
  {
    round_id: "round137_belfast_planning_statistics_more",
    path: path.join(ROOT_DIR, "tmp", "subagents", "round137_belfast_planning_statistics_more", "candidates.json")
  },
  {
    round_id: "round145_belfast_planning_statistics_next",
    path: path.join(ROOT_DIR, "tmp", "subagents", "round145_belfast_planning_statistics_next", "candidates.json")
  }
];

function loadRound145Helpers() {
  if (!fs.existsSync(BASE_SCRIPT_PATH)) {
    throw new Error(`Missing base helper script: ${BASE_SCRIPT_PATH}`);
  }

  const expose = [
    "readRows",
    "extractPlanningApplicationId",
    "cleanText",
    "truncate",
    "slugify",
    "sourceRecordIdFor",
    "assessQuality",
    "niGridToApproxPoint",
    "inBelfastEnvelope",
    "isBelfast",
    "candidateFor",
    "countBy"
  ].join(",");
  const source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8")
    .replace(
      /main\(\);\s*$/,
      `globalThis.__round145_helpers = {${expose}};`
    );
  const sandbox = {
    require,
    console,
    __dirname: path.join(ROOT_DIR, "scripts")
  };
  vm.runInNewContext(source, sandbox, { filename: BASE_SCRIPT_PATH });
  return sandbox.__round145_helpers;
}

const helpers = loadRound145Helpers();

function cleanText(value) {
  return helpers.cleanText(value);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function allPlanningApplicationIds(value) {
  const ids = [];
  const pattern = /\b(?:LA04|[A-Z])\/\d{4}\/\d{4,5}\/[A-Z0-9]+(?:\/[A-Z0-9]+)?\b/gi;
  for (const match of String(value || "").matchAll(pattern)) {
    ids.push(match[0].toUpperCase());
  }
  return [...new Set(ids)];
}

function sourceRecordAliases(value) {
  const text = cleanText(value);
  if (!text) return [];

  const aliases = new Set([text.toUpperCase()]);
  const appId = helpers.extractPlanningApplicationId(text);
  const fileMatch = text.match(/(?:FILE:)?\s*(?:data\/raw\/planning_statistics\/)?(planning-statistics-[^;\s]+\.csv)/i);
  const rowMatch = text.match(/\bROW:?\s*(\d+)\b/i) || text.match(/\brow\s+(\d+)\b/i);

  if (appId && fileMatch && rowMatch) {
    const file = fileMatch[1];
    const row = rowMatch[1];
    aliases.add(`APP_ID:${appId}; FILE:data/raw/planning_statistics/${file}; ROW:${row}`.toUpperCase());
    aliases.add(`APP_ID:${appId}; FILE:${file}; ROW:${row}`.toUpperCase());
    aliases.add(`${appId}; data/raw/planning_statistics/${file} row ${row}`.toUpperCase());
    aliases.add(`${appId}; ${file} row ${row}`.toUpperCase());
  }

  return [...aliases];
}

function liveCorpusKeys() {
  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Missing manual corpus for dedupe: ${CORPUS_PATH}`);
  }

  const corpus = readJson(CORPUS_PATH);
  const corpusApps = new Set();
  const planningStatisticsApps = new Set();
  const planningStatisticsSourceRecords = new Set();
  const planningStatisticsSourceRecordValues = new Set();
  let corpusPlanningEventCount = 0;

  for (const event of corpus.events || []) {
    const eventText = [
      event.planning_application_id,
      event.source_record_id,
      event.event_id,
      event.title,
      event.summary,
      event.observed_change,
      event.transformation_method
    ].join(" ");
    for (const appId of allPlanningApplicationIds(eventText)) {
      corpusApps.add(appId);
    }

    const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
    const sourceText = [
      event.source_id,
      event.source_dataset_id,
      event.source_record_id,
      event.transformation_method
    ].join(" ");
    const isPlanningStatistics = sourceIds.includes(SOURCE_ID) ||
      event.source_id === SOURCE_ID ||
      event.source_dataset_id === SOURCE_ID ||
      /planning.statistics/i.test(sourceText);
    if (!isPlanningStatistics) continue;

    corpusPlanningEventCount += 1;
    for (const appId of allPlanningApplicationIds(eventText)) {
      planningStatisticsApps.add(appId);
    }
    if (event.source_record_id) {
      planningStatisticsSourceRecordValues.add(cleanText(event.source_record_id).toUpperCase());
    }
    for (const alias of sourceRecordAliases(event.source_record_id)) {
      planningStatisticsSourceRecords.add(alias);
    }
  }

  return {
    corpusApps,
    planningStatisticsApps,
    planningStatisticsSourceRecords,
    planningStatisticsSourceRecordValues,
    corpusEventCount: (corpus.events || []).length,
    corpusPlanningEventCount
  };
}

function priorPackKeys(pack) {
  if (!fs.existsSync(pack.path)) {
    throw new Error(`Missing prior Belfast planning-statistics pack for dedupe: ${pack.path}`);
  }

  const payload = readJson(pack.path);
  const candidates = Array.isArray(payload) ? payload : (payload.candidates || []);
  const apps = new Set();
  const sourceRecords = new Set();
  const sourceRecordValues = new Set();

  for (const candidate of candidates) {
    const candidateText = [
      candidate.planning_application_id,
      candidate.source_record_id,
      candidate.candidate_id,
      candidate.event_id,
      candidate.title,
      candidate.summary,
      candidate.observed_change
    ].join(" ");
    for (const appId of allPlanningApplicationIds(candidateText)) {
      apps.add(appId);
    }
    if (candidate.source_record_id) {
      sourceRecordValues.add(cleanText(candidate.source_record_id).toUpperCase());
    }
    for (const alias of sourceRecordAliases(candidate.source_record_id)) {
      sourceRecords.add(alias);
    }
  }

  return {
    round_id: pack.round_id,
    path: path.relative(ROOT_DIR, pack.path).replace(/\\/g, "/"),
    candidate_count: candidates.length,
    application_ids: apps.size,
    source_rows: sourceRecordValues.size,
    source_record_aliases: sourceRecords.size,
    apps,
    sourceRecords,
    sourceRecordValues
  };
}

function hasExistingLinkedApp(record, existingApps) {
  const linked = allPlanningApplicationIds(record.proposal)
    .filter((appId) => appId !== record.appIdKey && existingApps.has(appId));
  return [...new Set(linked)];
}

function assessNext2Quality(record, baseAssessment, existingApps) {
  if (!baseAssessment.passesGate) {
    return { passes: false, reason: "does_not_pass_base_high_signal_gate" };
  }
  if (baseAssessment.score < MIN_SCORE) {
    return { passes: false, reason: "below_round151_score_floor" };
  }
  if (baseAssessment.adminOrMinor || baseAssessment.smallDomestic || baseAssessment.lowSignalWorks) {
    return { passes: false, reason: "base_minor_admin_or_low_signal_exclusion" };
  }

  const linkedExistingAppIds = hasExistingLinkedApp(record, existingApps);
  if (linkedExistingAppIds.length) {
    return {
      passes: false,
      reason: "references_existing_application_id",
      linkedExistingAppIds
    };
  }

  const proposal = cleanText(record.proposal);
  const combined = [
    proposal,
    record.address,
    record.statsCategory,
    record.appType
  ].map(cleanText).join(" ");
  const signals = baseAssessment.qualitySignals;
  const strongScale = (baseAssessment.scale.units || 0) >= 3 ||
    (baseAssessment.scale.storeys || 0) >= 3;
  const domesticOrPrivatePavilion = /\b(existing|residential|single) dwelling\b|\bto dwelling\b|\bgarden pavilion\b|\bpool pavilion\b|\bart studio\b|\bdomestic\b|\brenovation of existing dwelling\b/i.test(combined) &&
    !/\b(?:apartments?|flats?|residential units?|student accommodation|nursing home|care home|hotel|mortuary building)\b/i.test(proposal);
  const amendmentWithoutIndependentScale = /\b(amendments? to (?:previously )?(?:approved|accepted)|amended description|amended plans?|alteration to an extant approval|extant approval|relocation of|removal of lift|replacement with ramped access)\b/i.test(combined) &&
    !strongScale;
  const minorInternalFrontageOrSiteworks = /\b(minor internal|internal (?:alterations? only|works|refurbishment|alterations? to)|fit[- ]?out|gas heating|extract(?:ion)? flue|flue to rear|shopfront|shop front|cafe to office|cafe unit into a restaurant|yoga studio|partition walls?|meeting room|store converted|public house|barbers|beer garden|drive thru|coffee pod|car park|parking facilities|telecoms?|antenna|dish(?:es)?|cabinet|CCTV|gates?|fence|boundary|sensory garden|play equipment|strength and conditioning centre|single storey modular classroom|platform lift)\b/i.test(combined);
  const majorListedSignal = /\b(courthouse|boutique hotel|warehouse|bank building|convent|mortuary|serviced office|studio space|community hall|parochial house|hotel|nursing home|upper floors|roof level|3 apartments|4no\. serviced apartments|7 no apartments|12 in total)\b/i.test(proposal);
  const adaptiveOrFacilitySignal = /\b(retention and conversion|conversion|convert|change of use|redevelopment|restoration|roof level|roof top extension|extension at roof|demolition of existing community hall|construction of sports dome|nursing home|gp surgery|community centre|community hall|parochial house|university campus|former farmyard buildings|warehouse|workshop|bank building|courthouse|convent|mortuary|serviced office|studio space|boutique hotel|hotel)\b/i.test(proposal);

  if (domesticOrPrivatePavilion) {
    return { passes: false, reason: "domestic_or_single_property_pavilion" };
  }
  if (amendmentWithoutIndependentScale) {
    return { passes: false, reason: "amendment_or_extant_approval_without_scale" };
  }
  if (
    minorInternalFrontageOrSiteworks &&
    !strongScale &&
    !/\b(courthouse|boutique hotel|warehouse|bank building|convent|mortuary|community hall|nursing home|gp surgery|sports dome)\b/i.test(proposal)
  ) {
    return { passes: false, reason: "minor_internal_frontage_services_or_siteworks" };
  }

  if (signals.includes("multi-unit residential") && strongScale) {
    return {
      passes: true,
      qualityGate: "multi_unit_or_student_residential_next2",
      qualityReasons: ["multi-unit residual residential approval"]
    };
  }
  if (
    signals.includes("listed high-signal conversion") &&
    adaptiveOrFacilitySignal &&
    (strongScale || majorListedSignal)
  ) {
    return {
      passes: true,
      qualityGate: "listed_adaptive_reuse_or_built_use_next2",
      qualityReasons: ["listed adaptive reuse or built-use conversion"]
    };
  }
  if (
    signals.includes("civic facility works") &&
    adaptiveOrFacilitySignal &&
    !/\bcar park|parking|telecom|antenna|fence|gate|CCTV|sensory garden|play equipment\b/i.test(combined)
  ) {
    return {
      passes: true,
      qualityGate: "civic_or_public_facility_next2",
      qualityReasons: ["civic/community facility physical or use-change works"]
    };
  }
  if (
    signals.includes("industrial or production-space works") &&
    adaptiveOrFacilitySignal &&
    !minorInternalFrontageOrSiteworks
  ) {
    return {
      passes: true,
      qualityGate: "industrial_or_production_space_next2",
      qualityReasons: ["industrial/workshop built-use conversion"]
    };
  }

  return { passes: false, reason: "not_substantial_enough_for_round151" };
}

function countBy(items, selector) {
  return helpers.countBy(items, selector);
}

function addRejection(rejections, counts, record, reason, extra = {}) {
  counts[reason] = (counts[reason] || 0) + 1;
  if (!record || !record.appId || reason === "not_belfast") return;
  if (rejections.length >= REJECTION_DETAIL_CAP) return;

  rejections.push({
    reason,
    app_id: cleanText(record.appId),
    source_file: record.localPath || record.file,
    source_row_number: record.rowNumber,
    decision_date: record.date || cleanText(record.decisionIssuedDate),
    category: cleanText(record.statsCategory),
    classification: cleanText(record.classification),
    app_type: cleanText(record.appType),
    proposal: helpers.truncate(record.proposal, 240),
    ...extra
  });
}

function limitationsFor() {
  return [
    "Planning statistics rows are administrative planning records, not direct observations of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, or public use.",
    "The selected date is DecisionIssuedDate from the CSV; DateReceived and DateValid are retained as source fields but are not treated as physical-change dates.",
    "Coordinates are approximate WGS84 points converted from source Easting/Northing values for atlas navigation; they are not surveyed footprints, red-line boundaries, legal boundaries, or parcel geometry.",
    "Round151 keeps only rows that are post-dedupe against the live manual corpus and the round131, round134, round137, and round145 Belfast planning-statistics packs, approved, in the Belfast coordinate envelope, and strong enough for a second-pass civic, industrial, listed adaptive-reuse, or built-use gate.",
    "Approval is not evidence that the proposal was built, opened, occupied, completed, delivered, or linked to any outcome."
  ].join(" ");
}

function candidateFor(record) {
  const candidate = helpers.candidateFor(record);
  const candidateId = `${ROUND_ID}_${helpers.slugify(record.appId, 48)}_${record.date}`;

  return {
    ...candidate,
    candidate_id: candidateId,
    event_id: candidateId,
    limitations: limitationsFor(),
    transformation_method: "scripts/fetch_round151_belfast_planning_statistics_next2_candidates.js reused the round145 local DfI planning-statistics CSV parser, deduped against all planning application IDs in the live manual architecture corpus plus round131, round134, round137, and round145 Belfast planning-statistics candidate application IDs/source rows, rejected residual rows that referenced already-used application IDs, kept only approved 2016-2025 Belfast rows with approximate in-city coordinates and second-pass substantial civic, industrial, listed adaptive-reuse, or built-use signals, excluded domestic/minor/admin/signage/telecom/frontage-only/internal-fitout rows, and preserved file/row provenance."
  };
}

function validateCandidates(candidates, existingApps, existingSourceRecords) {
  const required = [
    "candidate_id",
    "city_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "date_precision",
    "bucket",
    "area",
    "source_easting",
    "source_northing",
    "latitude",
    "longitude",
    "source_ids",
    "source_url",
    "source_file",
    "source_row_number",
    "source_record_id",
    "source_date_field",
    "source_type",
    "source_name",
    "publisher",
    "license",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "planning_application_id",
    "planning_approval_caveat",
    "planning_quality_gate",
    "geometry_precision",
    "coordinate_conversion",
    "transformation_method"
  ];
  const candidateIds = new Set();
  const appIds = new Set();
  const sourceRows = new Set();
  const banned = /\b(proves?|proof|predicts?|forecasts?|simulates?|caused|will increase|will decrease|impact score)\b/i;

  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (candidateIds.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);

    const appId = helpers.extractPlanningApplicationId(candidate.planning_application_id);
    if (!appId) throw new Error(`Missing parseable app id for ${candidate.candidate_id}`);
    if (appIds.has(appId)) throw new Error(`Duplicate planning app id in pack: ${appId}`);
    if (existingApps.has(appId)) throw new Error(`Candidate app already represented: ${appId}`);
    appIds.add(appId);

    for (const linkedAppId of allPlanningApplicationIds(candidate.raw_row && candidate.raw_row.Proposal)) {
      if (linkedAppId !== appId && existingApps.has(linkedAppId)) {
        throw new Error(`Candidate references already represented app ${linkedAppId}: ${candidate.candidate_id}`);
      }
    }

    for (const alias of sourceRecordAliases(candidate.source_record_id)) {
      if (sourceRows.has(alias)) throw new Error(`Duplicate source row in pack: ${candidate.source_record_id}`);
      if (existingSourceRecords.has(alias)) throw new Error(`Candidate source row already represented: ${candidate.source_record_id}`);
      sourceRows.add(alias);
    }

    if (candidate.confidence !== "documented") throw new Error(`Unexpected confidence for ${candidate.candidate_id}`);
    if (candidate.source_ids[0] !== SOURCE_ID) throw new Error(`Unexpected source id for ${candidate.candidate_id}`);
    if (candidate.planning_score < MIN_SCORE) throw new Error(`Candidate below score threshold: ${candidate.candidate_id}`);
    if (candidate.date < DATE_START || candidate.date > DATE_END) {
      throw new Error(`Candidate outside date window: ${candidate.candidate_id}`);
    }
    if (!helpers.inBelfastEnvelope({ longitude: Number(candidate.longitude), latitude: Number(candidate.latitude) })) {
      throw new Error(`Candidate outside Belfast envelope: ${candidate.candidate_id}`);
    }

    const checked = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.planning_approval_caveat,
      candidate.geometry_precision,
      candidate.transformation_method
    ].join(" ");
    if (banned.test(checked)) {
      throw new Error(`Overclaim wording found for ${candidate.candidate_id}`);
    }
  }
}

function sourceAudit(fileAudits, summary, decision) {
  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: SOURCE_URL,
    source_type: "official annual planning-statistics CSV release",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: LICENSE,
    attribution: ATTRIBUTION,
    coverage_checked: `Local planning statistics CSV rows filtered for approved Belfast decisions from ${DATE_START} through ${DATE_END}, after dedupe against ${summary.corpus_all_application_ids} live-corpus application IDs and ${summary.prior_pack_application_ids} prior-pack application IDs from round131, round134, round137, and round145.`,
    date_fields_observed: "DecisionIssuedDate is used as the candidate date; DateReceived and DateValid are retained for context.",
    geometry_fields_observed: "Easting and Northing from source CSV rows converted to approximate WGS84 points.",
    reliability_assessment: "strong for official administrative planning-decision records; usable with explicit caveats for architecture-change candidate discovery",
    required_caveats: "Planning approval is an administrative decision record. It is not evidence of construction start, completion, opening, occupation, final built form, delivery, demolition completion, public use, or causal impact.",
    ingestion_recommendation: decision,
    transformation_method: "Live manual-corpus app-ID/source-row dedupe, explicit round131/round134/round137/round145 candidate app-ID/source-row dedupe, linked-application rejection, Belfast authority/LPA and coordinate-envelope check, approved decision filter, 2016-2025 date window, second-pass high-signal scoring, exclusion of minor domestic/admin/signage/telecom/frontage-only/internal-fitout rows, deterministic sorting, and required-provenance validation.",
    scoring_summary: {
      min_score: MIN_SCORE,
      max_candidates: MAX_CANDIDATES,
      emitted_candidates: summary.accepted_candidates,
      quality_gate: "A residual row must clear the broad round145 high-signal gate and then pass one stricter round151 gate: multi-unit residual residential, listed adaptive reuse or built-use conversion, civic/public-facility physical or use-change works, or industrial/workshop built-use conversion."
    },
    prior_packs_checked: summary.prior_packs_checked,
    files: fileAudits,
    source_audits: [
    {
        source_id: SOURCE_ID,
        source_name: SOURCE_NAME,
        publisher: PUBLISHER,
        source_url: SOURCE_URL,
        source_type: "official annual planning-statistics CSV release",
        license: LICENSE,
        license_url: LICENSE_URL,
        license_or_terms_note: LICENSE,
        attribution: ATTRIBUTION,
        coverage_years_checked: `${DATE_START} through ${DATE_END}; local files cover releases present in data/raw/planning_statistics.`,
        geographic_scope: "Belfast planning authority / Belfast LPA rows in Northern Ireland planning statistics CSVs.",
        key_fields_used: "ID/Id, DecisionIssuedDate, Authority, LPA19NM, AppType, Classification/AppCategory, StatsCategory, Proposal, SiteAddress/Location, Easting, Northing, Decision_Withdrawal, Status@31Mar, source file and source row number.",
        reliability: "strong for administrative planning-decision records; usable with caveats for architecture candidate discovery",
        required_caveats: "Do not treat approval as evidence that development was built, opened, occupied, completed, delivered, demolished, or causally linked to any outcome.",
        ingestion_recommendation: decision
      }
    ]
  };
}

function buildPack() {
  const corpusKeys = liveCorpusKeys();
  const priorKeys = PRIOR_PACKS.map(priorPackKeys);
  const existingApps = new Set(corpusKeys.corpusApps);
  const existingSourceRecords = new Set(corpusKeys.planningStatisticsSourceRecords);
  for (const prior of priorKeys) {
    for (const appId of prior.apps) existingApps.add(appId);
    for (const sourceRecord of prior.sourceRecords) existingSourceRecords.add(sourceRecord);
  }

  const { rows, fileAudits } = helpers.readRows();
  const rejections = [];
  const rejectionCounts = {};
  const selectedRecords = [];
  const selectedAppIds = new Set();

  for (const record of rows) {
    if (!helpers.isBelfast(record)) {
      addRejection(rejections, rejectionCounts, record, "not_belfast");
      continue;
    }

    const status = `${cleanText(record.decisionWithdrawal)} ${cleanText(record.statusAt31Mar)}`;
    if (!/approved/i.test(status)) {
      addRejection(rejections, rejectionCounts, record, "not_approved");
      continue;
    }

    if (!record.date || record.date < DATE_START || record.date > DATE_END) {
      addRejection(rejections, rejectionCounts, record, "outside_round151_window");
      continue;
    }

    const point = helpers.niGridToApproxPoint(record.easting, record.northing);
    if (!helpers.inBelfastEnvelope(point)) {
      addRejection(rejections, rejectionCounts, record, "missing_or_outside_belfast_geometry");
      continue;
    }

    if (!record.appIdKey) {
      addRejection(rejections, rejectionCounts, record, "missing_application_id");
      continue;
    }

    if (existingApps.has(record.appIdKey)) {
      addRejection(rejections, rejectionCounts, record, "already_in_live_corpus_or_prior_pack_app_id");
      continue;
    }

    const sourceRecordId = helpers.sourceRecordIdFor(record);
    const sourceAliases = sourceRecordAliases(sourceRecordId);
    if (sourceAliases.some((alias) => existingSourceRecords.has(alias))) {
      addRejection(rejections, rejectionCounts, record, "already_in_live_corpus_or_prior_pack_source_row");
      continue;
    }

    if (selectedAppIds.has(record.appIdKey)) {
      addRejection(rejections, rejectionCounts, record, "duplicate_app_id_in_round151_selection");
      continue;
    }

    const baseAssessment = helpers.assessQuality(record);
    const next2Assessment = assessNext2Quality(record, baseAssessment, existingApps);
    if (!next2Assessment.passes) {
      addRejection(rejections, rejectionCounts, record, next2Assessment.reason, {
        score: baseAssessment.score,
        reasons: baseAssessment.qualitySignals,
        linked_existing_application_ids: next2Assessment.linkedExistingAppIds
      });
      continue;
    }

    selectedAppIds.add(record.appIdKey);
    selectedRecords.push({
      ...record,
      score: baseAssessment.score,
      scale: baseAssessment.scale,
      qualitySignals: [...new Set([
        ...baseAssessment.qualitySignals,
        ...next2Assessment.qualityReasons
      ])],
      qualityGate: next2Assessment.qualityGate
    });
  }

  selectedRecords.sort((left, right) =>
    right.score - left.score ||
    right.date.localeCompare(left.date) ||
    cleanText(left.appId).localeCompare(cleanText(right.appId))
  );

  for (const record of selectedRecords.slice(MAX_CANDIDATES)) {
    addRejection(rejections, rejectionCounts, record, "ranked_below_candidate_cap", {
      score: record.score,
      reasons: record.qualitySignals
    });
  }

  const cappedRecords = selectedRecords.slice(0, MAX_CANDIDATES);
  const candidates = cappedRecords
    .map(candidateFor)
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.source_record_id.localeCompare(right.source_record_id)
    );

  validateCandidates(candidates, existingApps, existingSourceRecords);

  const priorPackSummaries = priorKeys.map((prior) => ({
    round_id: prior.round_id,
    path: prior.path,
    candidate_count: prior.candidate_count,
    application_ids: prior.application_ids,
    source_rows: prior.source_rows,
    source_record_aliases: prior.source_record_aliases
  }));

  const summary = {
    schema_version: `${ROUND_ID}.summary.v1`,
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    input_rows: rows.length,
    corpus_events_seen: corpusKeys.corpusEventCount,
    corpus_planning_statistics_events_seen: corpusKeys.corpusPlanningEventCount,
    corpus_all_application_ids: corpusKeys.corpusApps.size,
    corpus_planning_statistics_app_ids: corpusKeys.planningStatisticsApps.size,
    corpus_planning_statistics_source_rows: corpusKeys.planningStatisticsSourceRecordValues.size,
    corpus_planning_statistics_source_record_aliases: corpusKeys.planningStatisticsSourceRecords.size,
    prior_packs_checked: priorPackSummaries,
    prior_pack_application_ids: new Set(priorKeys.flatMap((prior) => [...prior.apps])).size,
    prior_pack_source_rows: new Set(priorKeys.flatMap((prior) => [...prior.sourceRecordValues])).size,
    prior_pack_source_record_aliases: new Set(priorKeys.flatMap((prior) => [...prior.sourceRecords])).size,
    dedupe_application_ids_total: existingApps.size,
    dedupe_source_record_aliases_total: existingSourceRecords.size,
    accepted_candidates: candidates.length,
    eligible_before_cap: selectedRecords.length,
    candidate_cap: MAX_CANDIDATES,
    min_score: MIN_SCORE,
    date_window: {
      start: DATE_START,
      end: DATE_END,
      source_date_field: "DecisionIssuedDate"
    },
    counts_by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    counts_by_bucket: countBy(candidates, (candidate) => candidate.bucket),
    counts_by_category: countBy(candidates, (candidate) => candidate.category),
    counts_by_quality_gate: countBy(candidates, (candidate) => candidate.planning_quality_gate),
    counts_by_classification: countBy(candidates, (candidate) => candidate.planning_classification),
    counts_by_app_type: countBy(candidates, (candidate) => candidate.planning_application_type),
    rejection_counts: Object.fromEntries(Object.entries(rejectionCounts).sort(([left], [right]) => left.localeCompare(right))),
    audit_decision: candidates.length > 0
      ? "pack_generated_high_quality_post_round145_rows"
      : "no_pack_generated_after_live_corpus_and_prior_pack_dedupe",
    caveat: "Planning approvals are administrative records and are not evidence of construction, opening, completion, occupation, delivery, final built form, or causal outcomes."
  };

  const decision = candidates.length > 0
    ? "Generate this candidate pack for review only; keep the planning-approval caveat visible and do not append without reviewer acceptance."
    : "Do not append another pack from this tranche; remaining post-dedupe rows did not clear the second-pass high-signal quality gate.";

  return {
    candidates,
    rejections,
    summary,
    audit: sourceAudit(fileAudits, summary, decision)
  };
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { candidates, rejections, summary, audit } = buildPack();
  const output = {
    schema_version: `${ROUND_ID}.candidates.v1`,
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    candidate_count: candidates.length,
    audit_decision: summary.audit_decision,
    scope_note: "Second post-dedupe Belfast planning-statistics pack limited to approved rows with substantial civic, industrial, listed adaptive-reuse, or built-use evidence beyond the live manual corpus and round131/round134/round137/round145 outputs. Approval is not evidence of construction, opening, occupation, completion, delivery, final built form, or causal effects.",
    source_audits: audit.source_audits,
    candidates
  };

  writeJson(CANDIDATES_PATH, output);
  writeJson(SOURCE_AUDIT_PATH, audit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTIONS_PATH, {
    schema_version: `${ROUND_ID}.rejections.v1`,
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    rejected_count: Object.values(summary.rejection_counts).reduce((total, count) => total + count, 0),
    detailed_rejected_count: rejections.length,
    detail_scope: "Detailed rows are capped for reviewability; rejection_counts retains full exclusion counts.",
    rejection_counts: summary.rejection_counts,
    rejected: rejections
  });

  console.log(JSON.stringify({
    candidates: candidates.length,
    audit_decision: summary.audit_decision,
    counts_by_year: summary.counts_by_year,
    counts_by_category: summary.counts_by_category,
    counts_by_quality_gate: summary.counts_by_quality_gate,
    candidates_path: path.relative(ROOT_DIR, CANDIDATES_PATH).replace(/\\/g, "/"),
    source_audit_path: path.relative(ROOT_DIR, SOURCE_AUDIT_PATH).replace(/\\/g, "/"),
    summary_path: path.relative(ROOT_DIR, SUMMARY_PATH).replace(/\\/g, "/"),
    rejections_path: path.relative(ROOT_DIR, REJECTIONS_PATH).replace(/\\/g, "/")
  }, null, 2));
}

main();
