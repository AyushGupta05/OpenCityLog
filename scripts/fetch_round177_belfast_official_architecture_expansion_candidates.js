const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ROUND_ID = "round177_belfast_official_architecture_expansion";
const OUT_DIR = path.join(ROOT_DIR, "tmp", "subagents", ROUND_ID);
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");
const CORPUS_PATH = path.join(
  ROOT_DIR,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const RETRIEVED_AT = "2026-05-19";
const DATE_START = "2008-01-01";
const DATE_END = "2026-05-19";
const BELFAST_BBOX = {
  minLat: 54.52,
  maxLat: 54.70,
  minLon: -6.08,
  maxLon: -5.78
};
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const SOURCE_FAMILIES = {
  bccMinutes: {
    source_id: "bcc-democratic-services-minutes-round177",
    source_name: "Belfast City Council Democratic Services minutes",
    publisher: "Belfast City Council",
    source_type: "official council committee minute / report page",
    license: "UK Open Government Licence (OGL) where applicable to public-sector information; verify page-specific copyright and third-party attachments before production import.",
    attribution: "Contains public sector information from Belfast City Council.",
    license_url: OGL_URL
  },
  bccNews: {
    source_id: "bcc-news-public-facilities-round177",
    source_name: "Belfast City Council news pages",
    publisher: "Belfast City Council",
    source_type: "official council news release",
    license: "UK Open Government Licence (OGL) where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    attribution: "Contains public sector information from Belfast City Council.",
    license_url: OGL_URL
  }
};

const SEEDS = [
  {
    key: "belfast_bikes_launch_2015",
    date: "2015-04-27",
    date_precision: "day",
    milestone_type: "public_bike_hire_infrastructure_launch",
    title: "Belfast Bikes docking-station network was formally launched",
    summary: "Belfast City Council minutes record that the Belfast Bike Share Scheme was formally launched on 27 April 2015 with 30 docking stations and 300 bikes across the city centre.",
    observed_change: "Official council minute records the launch of a public bike-hire infrastructure network. This is a transport/public-realm infrastructure milestone, not evidence about later station condition, usage outcomes or cycling impacts.",
    area: "Belfast city centre bike-share network",
    latitude: 54.596391,
    longitude: -5.930182,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=2810",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 May 2015: Belfast Bike Share Scheme formally launched on 27 April 2015",
    source_date_field: "minute text: formally launched on 27 April 2015",
    geometry_source: "Approximate representative point at Belfast City Hall for the original city-centre network; the source records a distributed network rather than one surveyed feature.",
    geometry_precision: "representative city-centre network point, not a docking-station coordinate set",
    limitations: "Distributed network candidate. Do not use this point as a specific docking station or infer ridership, safety, health, emissions or economic outcomes."
  },
  {
    key: "belfast_bikes_ebikes_2025",
    date: "2025-09-17",
    date_precision: "day",
    milestone_type: "public_bike_hire_fleet_infrastructure_update",
    title: "Belfast Bikes e-bikes were introduced to the public hire fleet",
    summary: "Belfast City Council announced that 100 e-bikes were introduced to the Belfast Bikes fleet, with the existing 60 docking stations remaining in place and further pedal bikes due later.",
    observed_change: "Official council news records an active-travel fleet and network update. This is not evidence of future usage, mode shift, health outcomes or station availability.",
    area: "Belfast Bikes network",
    latitude: 54.596391,
    longitude: -5.930182,
    source_family: "bccNews",
    source_url: "https://www.belfastcity.gov.uk/news/100-state-of-the-art-e-bikes-introduced-to-belfast",
    source_record_id: "BCC news, 17 September 2025: 100 state-of-the-art e-bikes introduced to Belfast Bikes fleet",
    source_date_field: "news date and launch statement: 17 September 2025",
    geometry_source: "Approximate representative point at Belfast City Hall for the citywide Belfast Bikes network; source describes a network/fleet update.",
    geometry_precision: "representative citywide network point, not a docking-station coordinate set",
    limitations: "Network/fleet milestone only. Do not infer usage, operating performance, scheme success, station availability or active-travel impact."
  },
  {
    key: "cs_lewis_square_opening_2016",
    date: "2016-11",
    date_precision: "month",
    milestone_type: "public_realm_opening_reported",
    title: "C.S. Lewis Square opening was reported in Connswater Community Greenway update",
    summary: "Belfast City Council's Capital Programme update records the opening of C.S. Lewis Square as a major Connswater Community Greenway work in November 2016.",
    observed_change: "Official council minute records a public-realm opening. This candidate uses the month-level source statement and does not claim a surveyed boundary or any cultural, economic or social outcome.",
    area: "C.S. Lewis Square, east Belfast",
    latitude: 54.60045,
    longitude: -5.86755,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=38080",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 24 March 2017: opening of C.S. Lewis Square in November 2016",
    source_date_field: "minute text: opening of C.S. Lewis Square in November",
    geometry_source: "Approximate public-space point from named C.S. Lewis Square location at the Connswater and Comber Greenways.",
    geometry_precision: "approximate named public-space point, not a public-realm boundary",
    limitations: "Month-level reported opening. Do not infer visitor numbers, regeneration impact, public-art condition or completed Greenway extent."
  },
  {
    key: "james_ellis_bridge_greenway_section_2017",
    date: "2017-03",
    date_precision: "month",
    milestone_type: "greenway_bridge_section_opening_reported",
    title: "Connswater Greenway section including James Ellis Bridge opened",
    summary: "Belfast City Council minutes record the opening earlier in March 2017 of a major new Connswater Community Greenway section linking C.S. Lewis Square, Mersey Street and Victoria Park, including the new James Ellis Bridge.",
    observed_change: "Official council minute records the opening of a greenway section and bridge. This is not a claim about the whole Connswater Community Greenway being complete.",
    area: "Connswater Community Greenway between C.S. Lewis Square, Mersey Street and Victoria Park",
    latitude: 54.6008,
    longitude: -5.8763,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=38080",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 24 March 2017: major new section linking C.S. Lewis Square, Mersey Street and Victoria Park including James Ellis Bridge",
    source_date_field: "minute text: opening earlier this month",
    geometry_source: "Approximate midpoint for the named Connswater Greenway link between Mersey Street and Victoria Park.",
    geometry_precision: "approximate corridor midpoint, not bridge survey geometry or path alignment",
    limitations: "The source describes a section opening. Do not treat it as completion of all Greenway works, flood infrastructure, bridges or wider regeneration outcomes."
  },
  {
    key: "north_foreshore_infrastructure_completion_2016",
    date: "2016-10",
    date_precision: "month",
    milestone_type: "infrastructure_works_completion_reported",
    title: "North Foreshore ERDF infrastructure works were reported completed",
    summary: "Belfast City Council's Capital Programme update records that ERDF-funded North Foreshore infrastructure works were completed at the end of October 2016, with further infrastructure for development sites continuing.",
    observed_change: "Official council minute records an infrastructure-works completion milestone at North Foreshore. It does not imply completion of later development plots or their uses.",
    area: "North Foreshore, Belfast",
    latitude: 54.6346,
    longitude: -5.9228,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=38080",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 24 March 2017: North Foreshore ERDF infrastructure works completed at end of October 2016",
    source_date_field: "minute text: completed at the end of October",
    geometry_source: "Approximate point for Belfast North Foreshore development lands.",
    geometry_precision: "approximate site-area point, not engineering asset geometry",
    limitations: "Completion relates to the ERDF infrastructure works described in the minute. Later development-site infrastructure, buildings, tenants, jobs or environmental outcomes require separate evidence."
  },
  {
    key: "innovation_factory_handover_2016",
    date: "2016-04-22",
    date_precision: "day",
    milestone_type: "building_handover_reported",
    title: "Innovation Factory was reported handed over",
    summary: "Belfast City Council's April 2016 Capital Programme update records that the Innovation Factory at Forthriver had been handed over that week.",
    observed_change: "Official council minute records a handover-stage building milestone. This is distinct from later opening/use milestones and does not claim occupancy or business outcomes.",
    area: "Innovation Factory, Forthriver Business Park",
    latitude: 54.608,
    longitude: -5.977,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=43575",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 April 2016: Innovation Factory handed over this week",
    source_date_field: "committee date and minute text: handed over this week",
    geometry_source: "Approximate named-site point for Innovation Factory at Forthriver.",
    geometry_precision: "approximate site point, not a building footprint",
    limitations: "Handover-stage record only. Do not infer opening, tenant occupation, employment, business growth or economic impact."
  },
  {
    key: "waterfront_parallel_works_completion_2016",
    date: "2016-04-22",
    date_precision: "day",
    milestone_type: "facility_works_completion_reported",
    title: "Waterfront parallel works were reported complete before first major conference",
    summary: "Belfast City Council minutes record completion of parallel works at the Waterfront in time for the opening and the first major conference in May 2016.",
    observed_change: "Official council minute records a facilities-works completion status for the Waterfront. The event does not quantify venue performance or wider visitor effects.",
    area: "Belfast Waterfront",
    latitude: 54.59615,
    longitude: -5.91772,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=43575",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 April 2016: completion of parallel works at the Waterfront in time for opening and first major conference",
    source_date_field: "committee date and minute text: completed in time for the opening and first major conference in May",
    geometry_source: "Approximate point for Belfast Waterfront Hall.",
    geometry_precision: "approximate venue point, not a works extent",
    limitations: "Facilities-works status only. Do not infer complete conference-centre performance, attendance, revenue or regeneration outcomes."
  },
  {
    key: "woodlands_3g_pitch_completed_2016",
    date: "2016-04-22",
    date_precision: "day",
    milestone_type: "sports_pitch_completion_reported",
    title: "Woodlands 3G pitch was reported recently completed",
    summary: "Belfast City Council's April 2016 Capital Programme update lists the new 3G pitch at Woodlands among pitch projects recently completed under the Pitches Strategy.",
    observed_change: "Official council minute records a recently completed sports-infrastructure milestone. It does not claim usage levels, sports participation outcomes or long-term condition.",
    area: "Woodlands playing fields, Belfast",
    latitude: 54.5654,
    longitude: -5.9965,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=43575",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 April 2016: new 3G pitch at Woodlands recently completed",
    source_date_field: "committee date; source reports recently completed",
    geometry_source: "Approximate point for Woodlands playing fields from named-site geocoding.",
    geometry_precision: "approximate sports-site point, not pitch footprint",
    limitations: "Reported-completion status only. Exact handover/opening date, pitch dimensions, usage and condition require separate source evidence."
  },
  {
    key: "ormeau_3g_pitch_completed_2016",
    date: "2016-04-22",
    date_precision: "day",
    milestone_type: "sports_pitch_completion_reported",
    title: "Ormeau 3G pitch was reported recently completed",
    summary: "Belfast City Council's April 2016 Capital Programme update lists the new 3G pitch at Ormeau among pitch projects recently completed under the Pitches Strategy.",
    observed_change: "Official council minute records a recently completed sports-infrastructure milestone. It does not claim usage levels, sports participation outcomes or long-term condition.",
    area: "Ormeau Park, Belfast",
    latitude: 54.5798,
    longitude: -5.9137,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=43575",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 April 2016: new 3G pitch at Ormeau recently completed",
    source_date_field: "committee date; source reports recently completed",
    geometry_source: "Approximate point for Ormeau Park sports area from named-site geocoding.",
    geometry_precision: "approximate park/sports-site point, not pitch footprint",
    limitations: "Reported-completion status only. Exact handover/opening date, pitch dimensions, usage and condition require separate source evidence."
  },
  {
    key: "cliftonville_3g_pitch_completed_2016",
    date: "2016-04-22",
    date_precision: "day",
    milestone_type: "sports_pitch_completion_reported",
    title: "Cliftonville 3G pitch was reported recently completed",
    summary: "Belfast City Council's April 2016 Capital Programme update lists the new 3G pitch at Cliftonville, as part of the wider Bunscoil Bheann Mhadagain development, among recently completed pitch projects.",
    observed_change: "Official council minute records a sports-infrastructure completion status. It is separate from the school-building opening and does not claim sports participation outcomes.",
    area: "Cliftonville / Bunscoil Bheann Mhadagain area",
    latitude: 54.6202,
    longitude: -5.945,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=43575",
    source_record_id: "BCC Strategic Policy and Resources Committee item 4a, 22 April 2016: new 3G pitch at Cliftonville as part of Bunscoil Bheann Mhadagain development recently completed",
    source_date_field: "committee date; source reports recently completed",
    geometry_source: "Approximate point for the Cliftonville / Bunscoil Bheann Mhadagain area.",
    geometry_precision: "approximate sports/school-site point, not pitch footprint",
    limitations: "Reported-completion status only. Exact handover/opening date, pitch dimensions, usage and condition require separate source evidence."
  },
  {
    key: "finlay_park_community_garden_opened_2013",
    date: "2013-11-22",
    date_precision: "day",
    milestone_type: "community_garden_opening_reported",
    title: "Finlay Park community garden opening was reported",
    summary: "Belfast City Council's Investment Programme half-year update records that three community gardens had opened across the city, including Finlay Park.",
    observed_change: "Official council minute records a community-garden opening milestone. It does not state the exact opening day for this individual garden.",
    area: "Finlay Park, Belfast",
    latitude: 54.582,
    longitude: -5.99,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=22475",
    source_record_id: "BCC Strategic Policy and Resources Committee item 2a, 22 November 2013: community garden opened at Finlay Park",
    source_date_field: "committee date; source reports gardens opened",
    geometry_source: "Approximate named-park point for Finlay Park.",
    geometry_precision: "approximate park point, not garden boundary",
    limitations: "Reported-open status only. Exact opening date, garden layout, management arrangements and ongoing condition require separate evidence."
  },
  {
    key: "knocknagoney_linear_park_community_garden_opened_2013",
    date: "2013-11-22",
    date_precision: "day",
    milestone_type: "community_garden_opening_reported",
    title: "Knocknagoney Linear Park community garden opening was reported",
    summary: "Belfast City Council's Investment Programme half-year update records that three community gardens had opened across the city, including Knocknagoney Linear Park.",
    observed_change: "Official council minute records a community-garden opening milestone. It does not state the exact opening day for this individual garden.",
    area: "Knocknagoney Linear Park, Belfast",
    latitude: 54.6012,
    longitude: -5.8179,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=22475",
    source_record_id: "BCC Strategic Policy and Resources Committee item 2a, 22 November 2013: community garden opened at Knocknagoney Linear Park",
    source_date_field: "committee date; source reports gardens opened",
    geometry_source: "Approximate named-park point for Knocknagoney Linear Park.",
    geometry_precision: "approximate park point, not garden boundary",
    limitations: "Reported-open status only. Exact opening date, garden layout, management arrangements and ongoing condition require separate evidence."
  },
  {
    key: "whiterock_community_garden_opened_2013",
    date: "2013-11-22",
    date_precision: "day",
    milestone_type: "community_garden_opening_reported",
    title: "Whiterock community garden opening was reported",
    summary: "Belfast City Council's Investment Programme half-year update records that three community gardens had opened across the city, including Whiterock.",
    observed_change: "Official council minute records a community-garden opening milestone. It does not state the exact opening day for this individual garden.",
    area: "Whiterock, Belfast",
    latitude: 54.5867,
    longitude: -5.9796,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=22475",
    source_record_id: "BCC Strategic Policy and Resources Committee item 2a, 22 November 2013: community garden opened at Whiterock",
    source_date_field: "committee date; source reports gardens opened",
    geometry_source: "Approximate area point for Whiterock, Belfast.",
    geometry_precision: "approximate neighbourhood point, not garden boundary",
    limitations: "Reported-open status only. Exact opening date, garden layout, management arrangements and ongoing condition require separate evidence."
  },
  {
    key: "duncrue_fuel_station_reported_2013",
    date: "2013-11-22",
    date_precision: "day",
    milestone_type: "operational_facility_completion_reported",
    title: "Duncrue council fuel station was reported as a new facility",
    summary: "Belfast City Council's Investment Programme half-year update records a new fuel station at Duncrue for Council vehicles among recent physical projects.",
    observed_change: "Official council minute records a new operational facility. This is a municipal infrastructure record, not evidence of fleet emissions, service performance or public access.",
    area: "Duncrue, Belfast",
    latitude: 54.6227,
    longitude: -5.9239,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=22475",
    source_record_id: "BCC Strategic Policy and Resources Committee item 2a, 22 November 2013: new fuel station at Duncrue for Council vehicles",
    source_date_field: "committee date; source reports new facility",
    geometry_source: "Approximate point for the Duncrue industrial/municipal-services area.",
    geometry_precision: "approximate area point, not facility footprint",
    limitations: "Municipal facility status only. Exact commissioning date, asset footprint, fuel types, usage and environmental effects require separate evidence."
  },
  {
    key: "blackstaff_square_bsa_phase5_progressed_2018",
    date: "2018-01-10",
    date_precision: "day",
    milestone_type: "public_realm_design_programme_decision",
    title: "Blackstaff Square public realm project was moved under Belfast Streets Ahead Phase 5",
    summary: "Belfast City Council's City Growth and Regeneration Committee agreed that the Blackstaff Square public realm project should be taken forward under Phase 5 of the Belfast Streets Ahead programme, led by DfC.",
    observed_change: "Official council minute records a public-realm programme/design governance decision. This is not evidence that construction started or that the public realm was delivered.",
    area: "Blackstaff Square, Belfast",
    latitude: 54.5953,
    longitude: -5.9341,
    source_family: "bccMinutes",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=41911",
    source_record_id: "BCC City Growth and Regeneration Committee item 5b, 10 January 2018: Blackstaff Square Public Realm project taken forward under BSA Phase 5",
    source_date_field: "committee date and adopted recommendation",
    geometry_source: "Approximate point for Blackstaff Square.",
    geometry_precision: "approximate public-space point, not design boundary or works extent",
    limitations: "Design/programme decision only. Do not infer planning approval, construction start, completion, final design or public-realm quality change."
  }
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100) || "record";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function inDateWindow(date) {
  const normalized = date.length === 7 ? `${date}-01` : date;
  return normalized >= DATE_START && normalized <= DATE_END;
}

function inBelfastEnvelope(latitude, longitude) {
  return latitude >= BELFAST_BBOX.minLat &&
    latitude <= BELFAST_BBOX.maxLat &&
    longitude >= BELFAST_BBOX.minLon &&
    longitude <= BELFAST_BBOX.maxLon;
}

function sourceDateKey(record) {
  return [
    cleanText(record.source_record_id).toLowerCase(),
    cleanText(record.date || record.effective_date).toLowerCase()
  ].join("|");
}

function eventIdsFromRecord(record) {
  return [
    record.event_id,
    record.event_id_suggestion,
    record.candidate_id
  ].filter(Boolean).map((value) => cleanText(value).toLowerCase());
}

function extractRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.candidates)) return payload.candidates;
  return [];
}

function loadCorpusAndPriorKeys() {
  const indexed = [];
  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  let corpusEvents = 0;
  let priorCandidates = 0;

  function indexFile(file, kind) {
    if (!fs.existsSync(file)) return;
    const records = extractRecords(readJson(file));
    indexed.push({
      kind,
      path: path.relative(ROOT_DIR, file).replace(/\\/g, "/"),
      record_count: records.length
    });
    if (kind === "corpus") corpusEvents += records.length;
    if (kind === "prior_pack") priorCandidates += records.length;

    for (const record of records) {
      if (record.city_id && record.city_id !== "belfast") continue;
      for (const id of eventIdsFromRecord(record)) eventIds.add(id);
      if (record.source_record_id && (record.date || record.effective_date)) {
        sourceDateKeys.add(sourceDateKey(record));
      }
      if (record.title && (record.date || record.effective_date)) {
        titleDateKeys.add(`${cleanText(record.title).toLowerCase()}|${cleanText(record.date || record.effective_date).toLowerCase()}`);
      }
    }
  }

  indexFile(CORPUS_PATH, "corpus");

  const subagentsDir = path.join(ROOT_DIR, "tmp", "subagents");
  if (fs.existsSync(subagentsDir)) {
    for (const dirent of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      if (dirent.name === ROUND_ID) continue;
      if (!/belfast/i.test(dirent.name)) continue;
      const candidatePath = path.join(subagentsDir, dirent.name, "candidates.json");
      if (fs.existsSync(candidatePath)) indexFile(candidatePath, "prior_pack");
    }
  }

  return {
    eventIds,
    sourceDateKeys,
    titleDateKeys,
    indexed,
    corpusEvents,
    priorCandidates
  };
}

function candidateFor(seed) {
  const family = SOURCE_FAMILIES[seed.source_family];
  if (!family) throw new Error(`Unknown source family ${seed.source_family}`);
  const eventId = `round177_belfast_${slugify(seed.key)}`;

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: eventId,
    event_id: eventId,
    event_id_suggestion: `bfs_arch_${eventId}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: null,
    date_precision: seed.date_precision,
    bucket: seed.milestone_type.includes("public_realm") || seed.milestone_type.includes("greenway")
      ? "planning/development/architecture/public_realm"
      : "planning/development/architecture/public_facilities",
    event_family: "architecture/official-public-record",
    milestone_type: seed.milestone_type,
    title: seed.title,
    summary: seed.summary,
    observed_change: seed.observed_change,
    area: seed.area,
    latitude: seed.latitude,
    longitude: seed.longitude,
    geometry: {
      type: "Point",
      coordinates: [seed.longitude, seed.latitude]
    },
    geometry_ref: seed.source_url,
    source_id: family.source_id,
    source_ids: [family.source_id],
    source_name: family.source_name,
    publisher: family.publisher,
    source_url: seed.source_url,
    source_record_id: seed.source_record_id,
    source_type: family.source_type,
    license: family.license,
    license_url: family.license_url,
    attribution: family.attribution,
    accessed_at: RETRIEVED_AT,
    retrieved_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.date,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: seed.milestone_type.replace(/_/g, " "),
    geometry_source: seed.geometry_source,
    geometry_precision: seed.geometry_precision,
    limitations: seed.limitations,
    transformation_method: `Seeded from official Belfast City Council public minute/news records in ${path.basename(__filename)}; dates are source-stated opening/launch/status dates where available, otherwise source report dates with explicit caveats; coordinates are approximate review points and not authoritative geometries.`,
    raw_source_hint: {
      seed_key: seed.key,
      source_family: seed.source_family,
      source_record_id: seed.source_record_id
    }
  };
}

function sourceAudits() {
  return [
    {
      source_id: SOURCE_FAMILIES.bccMinutes.source_id,
      source_name: SOURCE_FAMILIES.bccMinutes.source_name,
      publisher: SOURCE_FAMILIES.bccMinutes.publisher,
      url: "https://minutes.belfastcity.gov.uk/",
      api_endpoint: null,
      license: SOURCE_FAMILIES.bccMinutes.license,
      license_url: OGL_URL,
      coverage_years_checked: "Selected Belfast committee minute/report pages from 2013 through 2025; candidate dates retained only inside 2008-01-01 to 2026-05-19.",
      update_frequency: "Meeting-by-meeting publication; historical pages can be amended or republished by Democratic Services.",
      geographic_scope: "Belfast City Council projects, public realm, facilities and programme decisions.",
      granularity: "Committee item/report paragraph; many records are programme-level rather than row-level GIS features.",
      key_fields_used: "Meeting date, item title, official minute/report text, named project/site, source URL and committee item ID.",
      reliability: "usable with caveats",
      required_caveats: "Council minutes are strong evidence that a decision/status/opening was reported to committee, but they are not authoritative surveyed geometry and may report prior work without exact per-site completion dates.",
      ingestion_recommendation: "Recommended for a small official public-record tail when candidates are clearly labelled as minute-reported milestones and not used for physical completion/outcome claims beyond the source wording.",
      next_checks: "For production import, resolve official project pages or capital-programme attachments where available, and replace approximate points with authoritative site geometries."
    },
    {
      source_id: SOURCE_FAMILIES.bccNews.source_id,
      source_name: SOURCE_FAMILIES.bccNews.source_name,
      publisher: SOURCE_FAMILIES.bccNews.publisher,
      url: "https://www.belfastcity.gov.uk/news",
      api_endpoint: null,
      license: SOURCE_FAMILIES.bccNews.license,
      license_url: OGL_URL,
      coverage_years_checked: "Selected Belfast City Council news records through 2026-05-19.",
      update_frequency: "Page-specific publication.",
      geographic_scope: "Belfast council public facilities, active travel and civic projects.",
      granularity: "Official news release.",
      key_fields_used: "News date, title, named project/network, source URL.",
      reliability: "strong for official announcement dates; usable with caveats for network-level geometry",
      required_caveats: "News releases can document launch/announcement milestones but should not be used to infer usage outcomes, causality or long-term condition.",
      ingestion_recommendation: "Use as source evidence for small factual public-facility/network milestones; retain source URL and avoid reproducing media."
    },
    {
      source_id: "not-emitted-ni-planning-statistics-round177",
      source_name: "Northern Ireland planning activity statistics",
      publisher: "Department for Infrastructure, Northern Ireland",
      url: "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics",
      license: "Open Government Licence v3.0 where applicable to public-sector statistical releases.",
      coverage_years_checked: "Previously mined Belfast planning-statistics rounds 131, 134, 137, 145, 151, 165 and 171 were treated as near-exhausted.",
      reliability: "strong for administrative planning decisions, but exhausted for this worker",
      required_caveats: "Planning records remain administrative records and are not evidence of construction, occupation, opening or final built form.",
      ingestion_recommendation: "Not mined in round177 to avoid low-value duplicates."
    },
    {
      source_id: "not-emitted-dfc-hed-harni-round177",
      source_name: "DfC/HED HARNI and public GIS heritage layers",
      publisher: "Department for Communities Historic Environment Division",
      url: "https://www.communities-ni.gov.uk/services/historic-environment-map-viewer",
      license: "UK Open Government Licence (OGL) via OpenDataNI/HED public GIS where applicable.",
      coverage_years_checked: "Prior Belfast HED/HARNI rounds 128, 130, 141 and 156 were treated as already covered for date-bearing rows.",
      reliability: "strong for official heritage register/status/source dates",
      required_caveats: "Heritage source dates are register/status/inspection dates, not construction, repair, vacancy, demolition timing or causal evidence.",
      ingestion_recommendation: "Not mined in round177 except noted as compatible but currently exhausted."
    }
  ];
}

function writeNotes(summary) {
  const notes = `# Round 177 Belfast Official Architecture Expansion

## Scope

Scratch-only candidate pack for additional Belfast architecture-related city-change evidence from official Belfast City Council public minutes and news pages. Belfast NI Planning Statistics and HED/HARNI date-bearing rows were treated as nearly exhausted by prior rounds, so this pass focuses on a small public-realm/facilities tail.

## Method

- Read the live manual architecture corpus and every prior Belfast \`tmp/subagents/*/candidates.json\` pack.
- Built duplicate indexes for event IDs and source-record/date keys.
- Emitted only candidates inside the 2008-01-01 to 2026-05-19 window with Belfast-envelope coordinates.
- Used committee/news source dates or explicit source-stated milestone dates.
- Kept planning/programme/status records administrative and avoided construction, completion or outcome claims unless directly stated by the source.

## Caveats

Most geometries are approximate review points for named public spaces, sites, or distributed networks. They are not parcel boundaries, surveyed asset geometries, works extents, or proof of delivery beyond the source wording.

## Headroom

Round177 intentionally emits fewer than 80 candidates because high-volume Belfast planning statistics and HED/HARNI records are already heavily mined. Remaining headroom is likely in deeper committee report PDFs, DfC Belfast Streets Ahead project pages with clearer stage dates, and official project attachments that expose better geometry.

## Output

- Candidates: ${summary.output_files.candidates}
- Source audit: ${summary.output_files.source_audit}
- Summary: ${summary.output_files.summary}
- Rejected: ${summary.output_files.rejected}
`;
  fs.writeFileSync(NOTES_PATH, notes);
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dedupe = loadCorpusAndPriorKeys();
  const accepted = [];
  const rejected = [];

  for (const seed of SEEDS) {
    let candidate;
    try {
      candidate = candidateFor(seed);
      const idKeys = eventIdsFromRecord(candidate);
      const duplicateEventId = idKeys.find((id) => dedupe.eventIds.has(id));
      const candidateSourceDateKey = sourceDateKey(candidate);
      const titleDateKey = `${cleanText(candidate.title).toLowerCase()}|${cleanText(candidate.date).toLowerCase()}`;
      const reasons = [];

      if (!inDateWindow(candidate.date)) reasons.push("outside_date_window");
      if (!inBelfastEnvelope(candidate.latitude, candidate.longitude)) reasons.push("outside_belfast_envelope");
      if (duplicateEventId) reasons.push(`duplicate_event_id:${duplicateEventId}`);
      if (dedupe.sourceDateKeys.has(candidateSourceDateKey)) reasons.push("duplicate_source_record_date_key");
      if (dedupe.titleDateKeys.has(titleDateKey)) reasons.push("duplicate_title_date_key");

      if (reasons.length) {
        rejected.push({
          seed_key: seed.key,
          title: seed.title,
          source_record_id: seed.source_record_id,
          date: seed.date,
          reasons
        });
        continue;
      }

      accepted.push(candidate);
      for (const id of idKeys) dedupe.eventIds.add(id);
      dedupe.sourceDateKeys.add(candidateSourceDateKey);
      dedupe.titleDateKeys.add(titleDateKey);
    } catch (error) {
      rejected.push({
        seed_key: seed.key,
        title: seed.title,
        date: seed.date,
        reasons: ["candidate_build_failed"],
        error: error.message
      });
    }
  }

  accepted.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare) return dateCompare;
    return a.event_id.localeCompare(b.event_id);
  });

  const countsByYear = {};
  const countsBySource = {};
  const countsByMilestone = {};
  for (const candidate of accepted) {
    const year = candidate.date.slice(0, 4);
    countsByYear[year] = (countsByYear[year] || 0) + 1;
    for (const sourceId of candidate.source_ids) {
      countsBySource[sourceId] = (countsBySource[sourceId] || 0) + 1;
    }
    countsByMilestone[candidate.milestone_type] = (countsByMilestone[candidate.milestone_type] || 0) + 1;
  }

  const sourceUrls = [...new Set(accepted.map((candidate) => candidate.source_url))].sort();
  const candidatePayload = {
    schema_version: "round177.belfast_official_architecture_expansion.candidates.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    candidate_count: accepted.length,
    source_ids: Object.values(SOURCE_FAMILIES).map((family) => family.source_id),
    source_urls: sourceUrls,
    deduped_against: dedupe.indexed.map((item) => item.path),
    scope_note: "Official/public Belfast architecture-related source-record candidates. Dates are source-stated or committee-reported milestones, not inferred outcomes.",
    candidates: accepted
  };

  const summary = {
    schema_version: "round177.belfast_official_architecture_expansion.summary.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    target_candidate_cap: 80,
    seed_count: SEEDS.length,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    date_window: {
      start: DATE_START,
      end: DATE_END
    },
    emitted_date_range: accepted.length ? {
      min: accepted[0].date,
      max: accepted[accepted.length - 1].date
    } : null,
    counts_by_year: countsByYear,
    counts_by_source_id: countsBySource,
    counts_by_milestone_type: countsByMilestone,
    source_mix: {
      "Belfast City Council minutes": countsBySource[SOURCE_FAMILIES.bccMinutes.source_id] || 0,
      "Belfast City Council news": countsBySource[SOURCE_FAMILIES.bccNews.source_id] || 0
    },
    dedupe: {
      corpus_path: path.relative(ROOT_DIR, CORPUS_PATH).replace(/\\/g, "/"),
      corpus_events_seen: dedupe.corpusEvents,
      prior_belfast_candidate_records_seen: dedupe.priorCandidates,
      indexed_files: dedupe.indexed,
      duplicate_rejects: rejected.filter((item) => item.reasons.some((reason) => reason.includes("duplicate"))).length
    },
    output_files: {
      candidates: path.relative(ROOT_DIR, CANDIDATES_PATH).replace(/\\/g, "/"),
      source_audit: path.relative(ROOT_DIR, SOURCE_AUDIT_PATH).replace(/\\/g, "/"),
      summary: path.relative(ROOT_DIR, SUMMARY_PATH).replace(/\\/g, "/"),
      notes: path.relative(ROOT_DIR, NOTES_PATH).replace(/\\/g, "/"),
      rejected: path.relative(ROOT_DIR, REJECTED_PATH).replace(/\\/g, "/")
    },
    caveat: "Committee/news records document official reported milestones. Approximate points are for review only and must not be treated as surveyed geometries, construction extents, completion proof beyond the source wording, or evidence of causal outcomes."
  };

  writeJson(CANDIDATES_PATH, candidatePayload);
  writeJson(SOURCE_AUDIT_PATH, {
    schema_version: "round177.belfast_official_architecture_expansion.source_audit.v1",
    generated_at: RETRIEVED_AT,
    audits: sourceAudits()
  });
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTED_PATH, {
    schema_version: "round177.belfast_official_architecture_expansion.rejected.v1",
    generated_at: RETRIEVED_AT,
    rejected_count: rejected.length,
    rejected
  });
  writeNotes(summary);

  console.log(JSON.stringify({
    accepted: accepted.length,
    rejected: rejected.length,
    output_dir: path.relative(ROOT_DIR, OUT_DIR).replace(/\\/g, "/"),
    date_range: summary.emitted_date_range
  }, null, 2));
}

main();
