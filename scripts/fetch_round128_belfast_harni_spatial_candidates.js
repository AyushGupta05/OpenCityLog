const fs = require("fs");
const path = require("path");

const retrievedAt = "2026-05-19";
const outDir = "tmp/subagents/round128_belfast_harni_spatial";
const outPath = path.join(outDir, "candidates.json");

const sourceId = "dfc-harni-belfast";
const serviceUrl = "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/3";
const harniPage = "https://apps.communities-ni.gov.uk/HARNI/";

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value) {
  const text = cleanText(value);
  let match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return "";
}

function sourceUrlFor(objectId) {
  return `${serviceUrl}/query?where=OBJECTID%3D${encodeURIComponent(objectId)}&outFields=HB_Ref,BHARNI_Ref,Address,Category,Ownership,Date_Added,LGD,County,OBJECTID,Main_ID&returnGeometry=true&f=geojson`;
}

function projectTypeFor(category) {
  const categoryText = cleanText(category);
  if (/saved/i.test(categoryText)) return "heritage-at-risk saved-status record";
  if (/demolished/i.test(categoryText)) return "heritage-at-risk demolished-status record";
  return "heritage-at-risk status record";
}

function candidateFor(feature) {
  const properties = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const date = parseDate(properties.Date_Added);
  if (!date || date < "2008-01-01" || date > retrievedAt) return null;
  const category = cleanText(properties.Category || "Heritage at Risk");
  const address = cleanText(properties.Address || "Belfast heritage-at-risk record");
  const bhRef = cleanText(properties.BHARNI_Ref || properties.OBJECTID);
  const hbRef = cleanText(properties.HB_Ref);
  const objectId = cleanText(properties.OBJECTID);
  const ownership = cleanText(properties.Ownership || "not supplied");
  const projectType = projectTypeFor(category);
  const safeRef = `${bhRef || objectId}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  return {
    city_id: "belfast",
    candidate_id: `belfast-harni-spatial-${safeRef}-date-added-${date}`,
    date,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_at_risk",
    title: `HARNI spatial layer recorded ${category} status for ${address}`,
    summary: `The Department for Communities HED Heritage at Risk spatial layer records ${address} in Belfast with category '${category}', Date_Added ${cleanText(properties.Date_Added)}, BHARNI reference ${bhRef || "not supplied"}, HB reference ${hbRef || "not supplied"}, and ownership '${ownership}'.`,
    observed_change: `Official HARNI spatial-layer milestone: the record carries Date_Added ${cleanText(properties.Date_Added)} and category '${category}' for ${address}. This is a heritage register/status record, not a physical works observation.`,
    area: address,
    latitude,
    longitude,
    source_ids: [sourceId],
    source_name: "Heritage at Risk in Northern Ireland Belfast ArcGIS spatial layer",
    publisher: "Department for Communities Historic Environment Division",
    source_url: sourceUrlFor(objectId),
    source_record_id: `BHARNI:${bhRef || "not supplied"}; HB:${hbRef || "not supplied"}; OBJECTID:${objectId || "not supplied"}; Main_ID:${cleanText(properties.Main_ID) || "not supplied"}`,
    source_type: "official HED ArcGIS REST heritage-at-risk feature row",
    accessed_at: retrievedAt,
    source_date_field: "Date_Added",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectType,
    geometry_source: "Point geometry from the Department for Communities HED ArcGIS Heritage at Risk layer.",
    geometry_precision: "Official heritage-at-risk point for the register entry; not a measured building footprint, parcel boundary, or condition-survey extent.",
    license_or_terms_note: "OpenDataNI / UK Open Government Licence v3.0 applies to the ArcGIS factual dataset; HARNI website content and imagery may have separate terms.",
    attribution: "Department for Communities Historic Environment Division / Heritage at Risk in Northern Ireland",
    limitations: "HARNI condition/risk records are heritage register/status observations and may lag physical condition. Date_Added is a register/source date, not construction, repair completion, vacancy, occupancy, demolition date, ownership-transfer date, or causal evidence unless separately documented.",
    raw_row: {
      HB_Ref: properties.HB_Ref,
      BHARNI_Ref: properties.BHARNI_Ref,
      Address: properties.Address,
      Category: properties.Category,
      Ownership: properties.Ownership,
      Date_Added: properties.Date_Added,
      LGD: properties.LGD,
      County: properties.County,
      OBJECTID: properties.OBJECTID,
      Main_ID: properties.Main_ID
    }
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const url = `${serviceUrl}/query?where=${encodeURIComponent("LGD='Belfast'")}&outFields=HB_Ref,BHARNI_Ref,Address,Category,Ownership,Date_Added,LGD,County,OBJECTID,Main_ID&returnGeometry=true&f=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HARNI ArcGIS fetch failed: ${response.status} ${response.statusText}`);
  const geojson = await response.json();
  const candidates = [];
  const rejected = [];
  for (const feature of geojson.features || []) {
    const candidate = candidateFor(feature);
    if (candidate) candidates.push(candidate);
    else rejected.push({
      object_id: feature.properties?.OBJECTID || "",
      bharni_ref: feature.properties?.BHARNI_Ref || "",
      date_added: feature.properties?.Date_Added || "",
      reason: "Missing coordinates or Date_Added outside 2008-01-01 through 2026-05-19."
    });
  }
  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  fs.writeFileSync(outPath, `${JSON.stringify({
    generated_at: retrievedAt,
    source_audits: [
      {
        source_id: sourceId,
        source_name: "Heritage at Risk in Northern Ireland Belfast ArcGIS spatial layer",
        publisher: "Department for Communities Historic Environment Division",
        source_url: harniPage,
        api_endpoint: serviceUrl,
        license_or_terms_note: "OpenDataNI / UK Open Government Licence v3.0 applies to the ArcGIS factual dataset; HARNI website content and imagery may have separate terms.",
        coverage_years_checked: "Belfast HARNI ArcGIS rows with Date_Added from 2008-01-01 through 2026-05-19.",
        update_frequency: "HED spatial service update cadence; verify current service metadata before each release.",
        geographic_scope: "Belfast heritage-at-risk point records in the HED ArcGIS service.",
        key_fields_used: "HB_Ref, BHARNI_Ref, Address, Category, Ownership, Date_Added, OBJECTID, Main_ID, point geometry.",
        reliability: "strong for register/status observations; usable with caveats for city-change events",
        ingestion_recommendation: "Use Date_Added/category as heritage-register/status milestones only. Do not infer construction, restoration, demolition date, ownership change, or condition improvement from the status row alone."
      }
    ],
    candidates,
    rejected
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    features: geojson.features?.length || 0,
    candidates: candidates.length,
    rejected: rejected.length,
    outPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
