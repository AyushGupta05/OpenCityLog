const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round458_nyc_dob_now_next28_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round461_nyc_dob_now_next29_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round461_nyc_dob_now_next29");
const CORPUS_PATH = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");

const DOB_NOW_ROUNDS_THROUGH_458 = [
  "round117_nyc_dob_filings_permits",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round158",
  "round162",
  "round167",
  "round173",
  "round179",
  "round185",
  "round191",
  "round197",
  "round203",
  "round209",
  "round222",
  "round227",
  "round237",
  "round293",
  "round397",
  "round401",
  "round407",
  "round413",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round458"
];

const PRIOR_ROUND_REGEX_THROUGH_458 = [
  "round112",
  "round117",
  "round119",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round155",
  "round158",
  "round160",
  "round162",
  "round164",
  "round167",
  "round169",
  "round173",
  "round175",
  "round179",
  "round181",
  "round185",
  "round187",
  "round191",
  "round193",
  "round197",
  "round199",
  "round203",
  "round205",
  "round209",
  "round211",
  "round219",
  "round222",
  "round225",
  "round227",
  "round232",
  "round237",
  "round242",
  "round247",
  "round250",
  "round256",
  "round264",
  "round267",
  "round273",
  "round278",
  "round289",
  "round293",
  "round300",
  "round303",
  "round308",
  "round313",
  "round318",
  "round322",
  "round326",
  "round330",
  "round335",
  "round339",
  "round344",
  "round349",
  "round356",
  "round360",
  "round364",
  "round367",
  "round371",
  "round375",
  "round379",
  "round382",
  "round386",
  "round389",
  "round395",
  "round397",
  "round400",
  "round401",
  "round406",
  "round407",
  "round412",
  "round413",
  "round415",
  "round417",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round453",
  "round456",
  "round458"
].join("|");

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round461 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceRegexOnce(source, pattern, replacement, label) {
  let count = 0;
  const output = source.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  if (count !== 1) {
    throw new Error(`Round461 wrapper patch failed for ${label}: expected one regex match, found ${count}`);
  }
  return output;
}

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candidateArray(doc) {
  if (!doc) return [];
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function walkJsonCandidateFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  const ownOutDir = path.normalize(OUT_DIR).replace(/\\/g, "/");
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (normalized === ownOutDir) continue;
        stack.push(fullPath);
      } else if (
        entry.name === "candidates.json" ||
        /^round\d+_nyc_.*candidates.*\.json$/i.test(entry.name)
      ) {
        files.push(normalized);
      }
    }
  }
  return files.sort();
}

function isRequestedPriorDobFile(file) {
  const normalized = file.replace(/\\/g, "/");
  const round = Number(normalized.match(/round(\d+)/i)?.[1] || 0);
  if (!round || round > 458) return false;
  return /round\d+_nyc_dob/i.test(normalized) || /round117_nyc_local_dob/i.test(normalized);
}

function titleDateSiteKey(record) {
  const title = normalizeKey(record.title).replace(/[^a-z0-9]+/g, " ").trim();
  const date = parseDate(record.effective_date || record.date || record.issuance_date);
  const site = normalizeKey(record.address || record.affected_area?.label || record.site || "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return title && date && site ? `${title}|${date}|${site}` : "";
}

function addIdentifierToken(tokens, value) {
  const key = normalizeKey(value);
  if (key) tokens.add(key);
}

function addRecordToRequestedIndex(index, record) {
  for (const field of [
    "event_id",
    "source_record_id",
    "source_url",
    "candidate_id",
    "job_filing_number",
    "base_job_filing_number",
    "permit_job_filing_number",
    "work_permit",
    "tracking_number"
  ]) {
    addIdentifierToken(index.identifierTokens, record[field]);
  }

  const date = parseDate(record.effective_date || record.date || record.issuance_date);
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.work_permit ||
    record.tracking_number ||
    record.job_filing_number ||
    ""
  );
  if (sourceRecord && date) index.sourceDateKeys.add(`${sourceRecord}|${date}`.toLowerCase());

  const titleDateSite = titleDateSiteKey(record);
  if (titleDateSite) index.titleDateSiteKeys.add(titleDateSite);
}

function buildRequestedDuplicateScopeCheck(candidates) {
  const priorFiles = [
    CORPUS_PATH.replace(/\\/g, "/"),
    ...walkJsonCandidateFiles("tmp/subagents").filter(isRequestedPriorDobFile)
  ];
  const index = {
    identifierTokens: new Set(),
    sourceDateKeys: new Set(),
    titleDateSiteKeys: new Set()
  };

  for (const file of priorFiles) {
    if (!fs.existsSync(file)) continue;
    for (const record of candidateArray(readJson(file))) addRecordToRequestedIndex(index, record);
  }

  const overlaps = {
    identifier_token_records: 0,
    source_date_records: 0,
    title_date_site_records: 0
  };

  for (const candidate of candidates) {
    const localTokens = new Set();
    for (const field of [
      "event_id",
      "source_record_id",
      "source_url",
      "candidate_id",
      "job_filing_number",
      "base_job_filing_number",
      "permit_job_filing_number",
      "work_permit",
      "tracking_number"
    ]) {
      const token = normalizeKey(candidate[field]);
      if (token) localTokens.add(token);
    }
    if ([...localTokens].some((token) => index.identifierTokens.has(token))) {
      overlaps.identifier_token_records += 1;
    }

    const date = parseDate(candidate.effective_date || candidate.date || candidate.issuance_date);
    const sourceRecord = cleanText(
      candidate.source_record_id ||
      candidate.work_permit ||
      candidate.tracking_number ||
      candidate.job_filing_number ||
      ""
    );
    if (sourceRecord && date && index.sourceDateKeys.has(`${sourceRecord}|${date}`.toLowerCase())) {
      overlaps.source_date_records += 1;
    }

    const titleDateSite = titleDateSiteKey(candidate);
    if (titleDateSite && index.titleDateSiteKeys.has(titleDateSite)) {
      overlaps.title_date_site_records += 1;
    }
  }

  const priorDobFiles = priorFiles.filter((file) => file !== CORPUS_PATH.replace(/\\/g, "/"));
  return {
    scope: "Manual architecture corpus plus NYC DOB NOW/DOB permit/DOB CO candidate packs through tmp/subagents/round458_nyc_dob_now_next28/candidates.json.",
    manual_corpus_path: CORPUS_PATH.replace(/\\/g, "/"),
    prior_files_checked: priorFiles.length,
    prior_dob_files_checked: priorDobFiles.length,
    round458_candidates_checked: priorDobFiles.some((file) => /round458_nyc_dob_now_next28\/candidates\.json/i.test(file)),
    future_or_disjoint_rounds_required_for_requested_scope: false,
    prior_identifier_tokens_checked: index.identifierTokens.size,
    prior_source_date_keys_checked: index.sourceDateKeys.size,
    prior_title_date_site_keys_checked: index.titleDateSiteKeys.size,
    overlap_counts: overlaps,
    no_duplicate_event_source_job_permit_source_date_or_title_date_site_records: Object.values(overlaps).every((count) => count === 0)
  };
}

function patchRequestedDuplicateScope() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  if (!fs.existsSync(candidatesPath)) return;
  const candidates = candidateArray(readJson(candidatesPath));
  const requestedScope = buildRequestedDuplicateScopeCheck(candidates);

  for (const [name, patch] of [
    ["validation_report.json", (doc) => {
      doc.checks = {
        ...(doc.checks || {}),
        requested_duplicate_scope_check: requestedScope
      };
    }],
    ["validation.json", (doc) => {
      doc.checks = {
        ...(doc.checks || {}),
        requested_duplicate_scope_check: requestedScope
      };
    }],
    ["readback.json", (doc) => {
      doc.prior_screening = {
        ...(doc.prior_screening || {}),
        requested_duplicate_scope_check: requestedScope
      };
    }],
    ["summary.json", (doc) => {
      doc.duplicate_screening = {
        ...(doc.duplicate_screening || {}),
        requested_duplicate_scope_check: requestedScope
      };
    }],
    ["source_audit.json", (doc) => {
      doc.selection_summary = {
        ...(doc.selection_summary || {}),
        requested_duplicate_scope_check: requestedScope
      };
    }]
  ]) {
    const file = path.join(OUT_DIR, name);
    if (!fs.existsSync(file)) continue;
    const doc = readJson(file);
    patch(doc);
    writeJson(file, doc);
  }

  const notesPath = path.join(OUT_DIR, "notes.md");
  if (fs.existsSync(notesPath)) {
    const notes = fs.readFileSync(notesPath, "utf8").replace(/\s+$/, "");
    const extra = [
      "",
      "## Requested Duplicate Scope Check",
      "",
      `Checked ${requestedScope.prior_dob_files_checked} prior DOB administrative candidate files plus the manual corpus through Round458.`,
      `Identifier tokens checked: ${requestedScope.prior_identifier_tokens_checked}; source/date keys checked: ${requestedScope.prior_source_date_keys_checked}; title/date/site keys checked: ${requestedScope.prior_title_date_site_keys_checked}.`,
      `Overlap counts: event/source/job/permit tokens ${requestedScope.overlap_counts.identifier_token_records}, source/date ${requestedScope.overlap_counts.source_date_records}, title/date/site ${requestedScope.overlap_counts.title_date_site_records}.`
    ].join("\n");
    if (!notes.includes("## Requested Duplicate Scope Check")) {
      fs.writeFileSync(notesPath, `${notes}\n${extra}\n`);
    }
  }
}

function transformRound458Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round458/g, "Round461")
    .replace(/round458/g, "round461")
    .replace(/Next28/g, "Next29")
    .replace(/next28/g, "next29")
    .replace(/DOB_NOW_ROUNDS_THROUGH_449/g, "DOB_NOW_ROUNDS_THROUGH_458")
    .replace(/PRIOR_ROUND_REGEX_THROUGH_449/g, "PRIOR_ROUND_REGEX_THROUGH_458")
    .replace(/Round449/g, "Round458")
    .replace(/round449/g, "round458");

  transformed = replaceRegexOnce(
    transformed,
    /const DOB_NOW_ROUNDS_THROUGH_458 = \[[\s\S]*?\];/,
    `const DOB_NOW_ROUNDS_THROUGH_458 = ${JSON.stringify(DOB_NOW_ROUNDS_THROUGH_458, null, 2)};`,
    "DOB NOW prior-round list"
  );

  transformed = replaceRegexOnce(
    transformed,
    /const PRIOR_ROUND_REGEX_THROUGH_458 = \[[\s\S]*?\]\.join\("\|"\);/,
    `const PRIOR_ROUND_REGEX_THROUGH_458 = ${JSON.stringify(PRIOR_ROUND_REGEX_THROUGH_458.split("|"), null, 2)}.join("|");`,
    "DOB prior-round summary regex"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
}

async function main() {
  const source = transformRound458Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
  const sandbox = {
    Buffer,
    URL,
    clearTimeout,
    console,
    fetch,
    module: { exports: {} },
    process,
    require,
    setTimeout,
    __dirname: path.dirname(path.resolve(SCRIPT_PATH)),
    __filename: path.resolve(SCRIPT_PATH)
  };

  vm.runInNewContext(source, sandbox, { filename: SCRIPT_PATH });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed Round461 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
  patchRequestedDuplicateScope();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
