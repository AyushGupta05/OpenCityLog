const fs = require("fs");
const path = require("path");
const proposalImpact = require("../lib/proposal-impact");

const rootDir = path.resolve(__dirname, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) walkStrings(item, out);
  }
  return out;
}

function assertNoOverclaims(label, payload) {
  const joined = walkStrings(payload)
    .join("\n")
    .toLowerCase()
    .replace(/\bdoes not prove\b/g, "does not establish")
    .replace(/\bnot proof\b/g, "not evidence");
  const banned = [
    /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b/,
    /\bcaused?\b/,
    /\bproves?\b/,
    /\bpredicts?\b/,
    /\bpredicted\b/,
    /\bprediction\b/,
    /\bforecast(ed|s|ing)?\b/,
    /\bsimulation result\b/,
    /\bai[- ]powered impact\b/,
  ];
  for (const regex of banned) {
    assert(!regex.test(joined), `${label} contains overclaiming language: ${regex}`);
  }
}

const schema = readJson(path.join(rootDir, "schemas", "proposal.schema.json"));
assert(schema.title === "Bims Proposal Lens Input", "Proposal schema title is incorrect.");
const categoryEnum = schema.properties?.category?.enum || [];
for (const category of proposalImpact.VALID_CATEGORIES) {
  assert(categoryEnum.includes(category), `Proposal schema missing category ${category}`);
}

const sampleProposals = [
  {
    category: "building_development",
    title: "Mixed-use block near city centre",
    description: "A medium mixed-use building with homes and ground-floor services.",
    location: { lng: -5.93, lat: 54.597 },
    scale: "medium",
  },
  {
    category: "road_transport_change",
    title: "Bus priority and junction change",
    description: "A road and bus priority change on an existing corridor.",
    location: { lng: -5.939, lat: 54.594 },
    scale: "small",
  },
  {
    category: "energy_infrastructure",
    title: "Local energy infrastructure",
    description: "An energy-infrastructure proposal to support local connection needs.",
    location: { lng: -5.923, lat: 54.609 },
    scale: "small",
  },
  {
    category: "green_public_space",
    title: "Pocket park",
    description: "A small public-space and planting intervention.",
    location: { lng: -5.934, lat: 54.584 },
    scale: "small",
  },
  {
    category: "service_civic_infrastructure",
    title: "Community service hub",
    description: "A civic service facility with public access.",
    location: { lng: -5.962, lat: 54.596 },
    scale: "medium",
  },
];

for (const proposal of sampleProposals) {
  const validation = proposalImpact.validateProposalInput(proposal);
  assert(validation.ok, `${proposal.category} should validate: ${validation.errors.join("; ")}`);
  const result = proposalImpact.assessProposal(proposal, { rootDir });
  assert(result.ok === true, `${proposal.category} result not ok.`);
  assert(result.mode === "proposal_impact_sketch", `${proposal.category} has wrong mode.`);
  assert(/may affect/i.test(result.summary), `${proposal.category} summary should use may affect.`);
  assert(Array.isArray(result.affected_signals) && result.affected_signals.length > 0, `${proposal.category} missing affected signals.`);
  assert(Array.isArray(result.similar_events) && result.similar_events.length > 0, `${proposal.category} missing similar events.`);
  assert(result.local_context?.current_signals?.length > 0, `${proposal.category} missing current context signals.`);
  assert(result.local_context?.context_basis, `${proposal.category} missing local-context basis.`);
  assert(result.confidence?.label, `${proposal.category} missing confidence label.`);
  assert(Array.isArray(result.design_review_basis) && result.design_review_basis.length >= 4, `${proposal.category} missing design review basis.`);
  assert((result.caveats || []).some((item) => /not a calibrated outcome model/i.test(item)), `${proposal.category} missing calibrated-model caveat.`);
  assert((result.similar_events[0].match_factors || []).length > 0, `${proposal.category} similar event missing match factors.`);
  for (const signal of result.affected_signals) {
    assert(["positive", "negative", "mixed", "unknown"].includes(signal.direction), `${proposal.category} signal ${signal.signal} direction invalid.`);
    assert(["low", "medium", "high"].includes(signal.strength), `${proposal.category} signal ${signal.signal} strength invalid.`);
    assert(["low", "medium", "high"].includes(signal.confidence), `${proposal.category} signal ${signal.signal} confidence invalid.`);
    assert(Array.isArray(signal.evidence) && signal.evidence.length > 0, `${proposal.category} signal ${signal.signal} missing evidence.`);
    assert(Array.isArray(signal.caveats), `${proposal.category} signal ${signal.signal} missing caveats.`);
  }
  assertNoOverclaims(proposal.category, result);
}

const missingLocation = proposalImpact.assessProposal({
  category: "service_civic_infrastructure",
  title: "Service hub without a mapped site",
  description: "A civic service idea without a supplied point.",
}, { rootDir });
assert(missingLocation.confidence.label !== "high", "Missing-location proposal should not have high confidence.");
assert((missingLocation.warnings || []).some((item) => /No usable location/i.test(item)), "Missing-location proposal should warn about location.");
assert((missingLocation.caveats || []).some((item) => /Missing location/i.test(item)), "Missing-location proposal should caveat location.");
assertNoOverclaims("missing-location", missingLocation);

if (failures.length) {
  console.error("Proposal impact verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Proposal impact OK: ${sampleProposals.length} categories, ${proposalImpact.MODEL_VERSION}.`);
