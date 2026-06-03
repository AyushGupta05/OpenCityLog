const fs = require("fs");
const path = require("path");

const DEFAULT_GENERATED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const EVENT_SCHEMA_VERSION = "1.0.0";
const ATLAS_SCHEMA_VERSION = "1.0.0";
const BELFAST_AIR_QUALITY_SOURCE_ID = "ni-air-belfast-centre-hourly-2021-2024";
const BELFAST_AIR_QUALITY_CSV = "belfast_air_quality.csv";
const SUPPLEMENTAL_LENS_GAP_PACKAGE = "data/manual_drops/lens_gap_events/lens_gap_events_2007_2015.json";
const BELFAST_CENTRE_STATION = {
  code: "BEL2",
  name: "Belfast Centre",
  label: "Belfast Centre AURN site",
  coordinates: [-5.928833, 54.59965],
};
const BELFAST_AIR_QUALITY_POLLUTANTS = [
  {
    key: "o3",
    label: "Ozone",
    value: "Belfast Centre/ Ozone",
    status: "Belfast Centre/ Ozone/ Status",
    unit: "ug/m3",
  },
  {
    key: "no",
    label: "Nitric oxide",
    value: "Belfast Centre/ Nitric oxide",
    status: "Belfast Centre/ Nitric oxide/ Status",
    unit: "ug/m3",
  },
  {
    key: "no2",
    label: "Nitrogen dioxide",
    value: "Belfast Centre/ Nitrogen dioxide",
    status: "Belfast Centre/ Nitrogen dioxide/ Status",
    unit: "ug/m3",
  },
  {
    key: "nox_as_no2",
    label: "Nitrogen oxides as nitrogen dioxide",
    value: "Belfast Centre/ Nitrogen oxides as nitrogen dioxide",
    status: "Belfast Centre/ Nitrogen oxides as nitrogen dioxide/ Status",
    unit: "ug/m3",
  },
  {
    key: "so2",
    label: "Sulphur dioxide",
    value: "Belfast Centre/ Sulphur dioxide",
    status: "Belfast Centre/ Sulphur dioxide/ Status",
    unit: "ug/m3",
  },
  {
    key: "co",
    label: "Carbon monoxide",
    value: "Belfast Centre/ Carbon monoxide",
    status: "Belfast Centre/ Carbon monoxide/ Status",
    unit: "mg/m3",
  },
  {
    key: "pm10",
    label: "PM10 particulate matter",
    value: "Belfast Centre/ PM10 particulate matter (Hourly measured)",
    status: "Belfast Centre/ PM10 particulate matter (Hourly measured)/ Status",
    unit: "ug/m3",
  },
  {
    key: "pm25",
    label: "PM2.5 particulate matter",
    value: "Belfast Centre/ PM2.5 particulate matter (Hourly measured)",
    status: "Belfast Centre/ PM2.5 particulate matter (Hourly measured)/ Status",
    unit: "ug/m3",
  },
];

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    configDir: "config/cities",
    sourceRegistry: "config/source_registry.json",
    outputDir: "web/data/city-atlas",
    legacyCatalog: "data/derived/2026/belfast_infrastructure_events_2016_2026.json",
    generatedAt: process.env.BIMS_DATA_GENERATED_AT || DEFAULT_GENERATED_AT,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--config-dir") {
      args.configDir = next;
      index += 1;
    } else if (arg === "--source-registry") {
      args.sourceRegistry = next;
      index += 1;
    } else if (arg === "--output") {
      args.outputDir = next;
      index += 1;
    } else if (arg === "--legacy-catalog") {
      args.legacyCatalog = next;
      index += 1;
    } else if (arg === "--generated-at") {
      args.generatedAt = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => String(cell).trim())) rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows.shift().map((header) => String(header).replace(/^\uFEFF/, "").trim());
  return rows.map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] === undefined ? "" : cells[index];
    });
    return record;
  });
}

function sleep(ms) {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, ms);
}

function writeJson(filePath, payload, options = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = options.pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  const tmpPath = `${filePath}.tmp`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, `${body}\n`, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST"].includes(renameError.code)) {
          throw renameError;
        }
        try {
          fs.copyFileSync(tmpPath, filePath);
          fs.unlinkSync(tmpPath);
        } catch (copyError) {
          try {
            fs.rmSync(filePath, { force: true });
            fs.renameSync(tmpPath, filePath);
          } catch (_) {
            throw copyError;
          }
        }
      }
      return;
    } catch (error) {
      lastError = error;
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (_) {
        // Best-effort cleanup before retrying a generated artifact write.
      }
      sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeFromRoot(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function generatedArtifactPaths(root, cityOutputDir) {
  const artifactPaths = {};
  const knownFiles = {
    detail_layers: "detail_layers.geojson",
    lens_overlays: "lens_overlays.geojson",
    transport_roads_base: "transport_roads_base.geojson",
  };
  for (const [key, filename] of Object.entries(knownFiles)) {
    const filePath = path.join(cityOutputDir, filename);
    if (fs.existsSync(filePath)) artifactPaths[key] = relativeFromRoot(root, filePath);
  }
  if (fs.existsSync(cityOutputDir)) {
    const hasTransportRoadYears = fs.readdirSync(cityOutputDir).some((name) => /^transport_roads_\d{4}\.geojson$/.test(name));
    if (hasTransportRoadYears) {
      artifactPaths.transport_roads_template = toPosix(path.join(relativeFromRoot(root, cityOutputDir), "transport_roads_{year}.geojson"));
    }
    const hasLensDetailYears = fs.readdirSync(cityOutputDir).some((name) => /^lens_detail_\d{4}\.geojson$/.test(name));
    if (hasLensDetailYears) {
      artifactPaths.lens_detail_template = toPosix(path.join(relativeFromRoot(root, cityOutputDir), "lens_detail_{year}.geojson"));
    }
  }
  return artifactPaths;
}

function loadCityConfigs(root, configDir) {
  const dir = resolve(root, configDir);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)))
    .sort((a, b) => a.city_id.localeCompare(b.city_id));
}

function sourceAppliesToCity(source, cityId) {
  return Array.isArray(source.city_ids) && (source.city_ids.includes("*") || source.city_ids.includes(cityId));
}

function normalizeSourceForArtifact(source, generatedAt) {
  const caveats = Array.isArray(source.caveats) ? source.caveats.slice() : [];
  if (!source.accessed_at && !source.retrieved_at) {
    caveats.push("Exact source retrieval date is not recorded in the legacy source registry; review the linked publisher page before formal reuse.");
  }
  if (/requires source-level review|verify|terms|dataset-specific/i.test(String(source.licence || ""))) {
    caveats.push("Licence or terms require source-level review before redistribution or formal analytical reuse.");
  }
  return {
    ...source,
    accessed_at: source.accessed_at || source.retrieved_at || null,
    registry_reviewed_at: source.registry_reviewed_at || generatedAt,
    caveats: [...new Set(caveats)],
  };
}

function loadSupplementalLensGapPackage(root) {
  const absolutePath = resolve(root, SUPPLEMENTAL_LENS_GAP_PACKAGE);
  if (!fs.existsSync(absolutePath)) return { sources: [], events: [] };
  return readJson(absolutePath);
}

function supplementalSourcesForCity(root, cityId, generatedAt) {
  return (loadSupplementalLensGapPackage(root).sources || [])
    .filter((source) => sourceAppliesToCity(source, cityId))
    .map((source) => normalizeSourceForArtifact({
      ...source,
      caveats: Array.isArray(source.caveats)
        ? source.caveats
        : [source.limitations || "Supplemental source entry; inspect the cited publisher record before analytical reuse."],
    }, generatedAt));
}

function dedupeSourcesById(sources) {
  const byId = new Map();
  for (const source of sources) {
    if (!source?.source_id || byId.has(source.source_id)) continue;
    byId.set(source.source_id, source);
  }
  return [...byId.values()].sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function sourceRegistryForCity(registry, cityId, generatedAt, root = path.resolve(__dirname, "..")) {
  const registrySources = registry.sources
    .filter((source) => sourceAppliesToCity(source, cityId))
    .map((source) => normalizeSourceForArtifact(source, generatedAt));
  return dedupeSourcesById([
    ...registrySources,
    ...supplementalSourcesForCity(root, cityId, generatedAt),
  ]);
}

function sourceAccessedAt(source) {
  return source?.accessed_at || source?.retrieved_at || null;
}

function sourceRegistryReviewedAt(source) {
  return source?.registry_reviewed_at || null;
}

function sourceCanonicalUrl(source) {
  return source?.url || source?.access_url || source?.source_url || null;
}

function evidenceUrlForSource(item, source) {
  const registryUrl = sourceCanonicalUrl(source);
  const currentUrl = item?.url || null;
  if (!registryUrl) return currentUrl;
  if (!currentUrl) return registryUrl;
  const sourceId = String(item?.source_id || "");
  if (
    sourceId.startsWith("dfi-planning-statistics-2024-25-round")
    && /\/articles\/planning-activity-statistics\b/.test(currentUrl)
  ) {
    return registryUrl;
  }
  return currentUrl;
}

function enrichEventSourceAccess(event, sourceById) {
  const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
  const exactAccessBySource = new Map();
  for (const sourceId of sourceIds) {
    const exactAccess = sourceAccessedAt(sourceById.get(sourceId));
    if (exactAccess) exactAccessBySource.set(sourceId, exactAccess);
  }

  const firstExactAccess = event.provenance?.source_retrieved_at || [...exactAccessBySource.values()][0] || null;
  const firstRegistryReview = event.provenance?.source_registry_reviewed_at
    || sourceIds.map((sourceId) => sourceRegistryReviewedAt(sourceById.get(sourceId))).find(Boolean)
    || null;

  return {
    ...event,
    evidence: (event.evidence || []).map((item) => {
      const source = sourceById.get(item.source_id);
      return {
        ...item,
        url: evidenceUrlForSource(item, source),
        accessed_at: item.accessed_at || exactAccessBySource.get(item.source_id) || null,
      };
    }),
    provenance: {
      ...(event.provenance || {}),
      ...(firstExactAccess ? { source_retrieved_at: firstExactAccess } : {}),
      ...(firstRegistryReview ? { source_registry_reviewed_at: firstRegistryReview } : {}),
    },
  };
}

function yearRange(start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function sourceIdForLegacyEvent(event) {
  if (event.sourceRegistryId) return String(event.sourceRegistryId);
  const sourceName = String(event.sourceName || "");
  const sourceBasis = String(event.sourceBasis || "");
  if (/openstreetmap|overpass/i.test(sourceName) || /osm/i.test(sourceBasis)) return "osm-overpass";
  if (/planning statistics/i.test(sourceName) || /planning statistics/i.test(sourceBasis)) return "ni-planning-statistics";
  if (/ulster university/i.test(sourceName)) return "ulster-university-public-pages";
  if (/belfast city council/i.test(sourceName)) return "belfast-city-council-public-pages";
  if (/department for infrastructure/i.test(sourceName)) return "dfi-ni-public-project-pages";
  if (/translink|weavers cross/i.test(sourceName)) return "translink-public-project-pages";
  return "belfast-public-project-pages";
}

function categoryForLegacyEvent(event) {
  const value = String(event.category || event.signal || "").toLowerCase();
  if (value === "traffic") return "transport";
  if (value === "jobs") return "economy";
  if (value === "electricity") return "utilities";
  if (value === "services") return "civic_services";
  if (value === "buildings") return "built_environment";
  return value || "observed_change";
}

function lensForLegacyEvent(event) {
  const signal = String(event.signal || event.category || "").toLowerCase();
  const bySignal = {
    traffic: "mobility",
    jobs: "economic_opportunity",
    electricity: "utilities",
    services: "civic_services",
    buildings: "built_environment",
  };
  return bySignal[signal] || "city_change";
}

function affectedSignalsForLegacyEvent(event) {
  const signal = lensForLegacyEvent(event);
  const result = new Set([signal]);
  const tags = event.tags || {};
  if (tags.highway || event.category === "traffic") result.add("mobility");
  if (tags.building || event.category === "buildings") result.add("built_environment");
  if (tags.shop || tags.amenity || event.signal === "jobs") result.add("economic_opportunity");
  if (tags.power || event.category === "electricity") result.add("utilities");
  if (event.category === "services" || tags.amenity || tags.leisure) result.add("civic_services");
  return [...result].sort();
}

function confidenceForLegacyEvent(event) {
  const sourceId = sourceIdForLegacyEvent(event);
  if (sourceId === "osm-overpass") return "inferred";
  if (/corroborated/i.test(String(event.confidence || ""))) return "corroborated";
  if (/disputed/i.test(String(event.confidence || ""))) return "disputed";
  return "documented";
}

function validPoint(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}

function numericCell(value) {
  const normalized = String(value || "").replace(/[^0-9.+-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDateFromDmy(value) {
  const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1700 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function roundStat(value) {
  return Number(value.toFixed(2));
}

function emptyPollutantStats() {
  return Object.fromEntries(
    BELFAST_AIR_QUALITY_POLLUTANTS.map((pollutant) => [
      pollutant.key,
      {
        label: pollutant.label,
        unit: pollutant.unit,
        valid_hours: 0,
        sum: 0,
        min: null,
        max: null,
      },
    ]),
  );
}

function finalizePollutantStats(stats) {
  const result = {};
  for (const [key, stat] of Object.entries(stats)) {
    if (!stat.valid_hours) continue;
    result[key] = {
      label: stat.label,
      unit: stat.unit,
      valid_hours: stat.valid_hours,
      mean: roundStat(stat.sum / stat.valid_hours),
      min: roundStat(stat.min),
      max: roundStat(stat.max),
    };
  }
  return result;
}

function summarizeBelfastAirQualityRows(rows) {
  const byYear = new Map();
  for (const row of rows) {
    const isoDate = isoDateFromDmy(row.Date);
    if (!isoDate) continue;
    const year = Number(isoDate.slice(0, 4));
    if (year < 2000 || year > 2026) continue;
    if (!byYear.has(year)) {
      byYear.set(year, {
        year,
        row_count: 0,
        start_date: isoDate,
        end_date: isoDate,
        pollutants: emptyPollutantStats(),
      });
    }
    const summary = byYear.get(year);
    summary.row_count += 1;
    if (isoDate < summary.start_date) summary.start_date = isoDate;
    if (isoDate > summary.end_date) summary.end_date = isoDate;

    for (const pollutant of BELFAST_AIR_QUALITY_POLLUTANTS) {
      const value = numericCell(row[pollutant.value]);
      const status = String(row[pollutant.status] || "");
      if (value === null || !/^V\b/i.test(status)) continue;
      const stat = summary.pollutants[pollutant.key];
      stat.valid_hours += 1;
      stat.sum += value;
      stat.min = stat.min === null ? value : Math.min(stat.min, value);
      stat.max = stat.max === null ? value : Math.max(stat.max, value);
    }
  }

  return [...byYear.values()]
    .map((summary) => ({
      ...summary,
      pollutants: finalizePollutantStats(summary.pollutants),
    }))
    .filter((summary) => Object.keys(summary.pollutants).length > 0)
    .sort((a, b) => a.year - b.year);
}

function eventForBelfastAirQualitySummary(summary, csvRelativePath) {
  const recordId = `${BELFAST_CENTRE_STATION.code}-${summary.year}`;
  const pollutantNames = Object.values(summary.pollutants)
    .map((pollutant) => pollutant.label)
    .slice(0, 6)
    .join(", ");
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    city_id: "belfast",
    record_kind: "event",
    event_id: `ni_air_belfast_centre_${summary.year}_hourly_observations`,
    title: `${BELFAST_CENTRE_STATION.name} ${summary.year} monitored air-quality observations`,
    short_description: sentenceLimit(
      `Hourly ${BELFAST_CENTRE_STATION.name} monitoring data records valid ${summary.year} observations for ${pollutantNames}.`,
    ),
    year: summary.year,
    effective_date: String(summary.year),
    effective_date_range: {
      start: summary.start_date,
      end: summary.end_date,
    },
    date_precision: "range",
    source_date_field: "Date and Time",
    category: "environment",
    lens: "environment",
    geometry: {
      type: "Point",
      coordinates: BELFAST_CENTRE_STATION.coordinates,
    },
    affected_area: {
      label: BELFAST_CENTRE_STATION.label,
    },
    source_ids: [BELFAST_AIR_QUALITY_SOURCE_ID],
    evidence: [
      {
        source_id: BELFAST_AIR_QUALITY_SOURCE_ID,
        label: "Northern Ireland Air download data page",
        kind: "source_url",
        url: "https://www.airqualityni.co.uk/download-data",
        file_path: null,
        record_id: recordId,
      },
      {
        source_id: BELFAST_AIR_QUALITY_SOURCE_ID,
        label: "Local Belfast Centre hourly CSV",
        kind: "local_file",
        url: null,
        file_path: csvRelativePath,
        record_id: recordId,
      },
    ],
    confidence: "documented",
    affected_signals: ["air_quality", "environment"],
    explanation: `The local CSV contains hourly observations for ${BELFAST_CENTRE_STATION.name} during ${summary.year}. This is station monitoring evidence, not citywide exposure or outcome evidence.`,
    caveats: [
      "One monitoring station cannot represent every neighbourhood in Belfast.",
      "Hourly observations are monitoring context; do not use them as evidence that a nearby planning, transport, or development event changed air quality.",
      "Modelled wind fields in the CSV are retained as context only; this event summarizes pollutant measurements.",
    ],
    observed_summary: {
      station_code: BELFAST_CENTRE_STATION.code,
      station_name: BELFAST_CENTRE_STATION.name,
      row_count: summary.row_count,
      date_range: {
        start: summary.start_date,
        end: summary.end_date,
      },
      pollutants: summary.pollutants,
    },
    provenance: {
      transform: "scripts/build_data.js#eventForBelfastAirQualitySummary",
      source_path: csvRelativePath,
      source_record_id: recordId,
      source_url: "https://www.airqualityni.co.uk/download-data",
      source_retrieved_at: null,
      source_dataset_id: "belfast-centre-hourly-air-quality-local-csv",
      source_basis: "Hourly automatic air-quality monitoring observations from Belfast Centre.",
      source_date_field: "Date and Time",
      geometry_source: "Belfast Centre AURN site station coordinate from public monitoring-site metadata.",
      geometry_precision: "Monitoring-station point for map navigation; not a citywide exposure surface or modelled pollution area.",
    },
  };
}

function loadBelfastAirQualityEvents(root, csvRelativePath = BELFAST_AIR_QUALITY_CSV) {
  const absolutePath = resolve(root, csvRelativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const rows = parseCsv(fs.readFileSync(absolutePath, "utf8"));
  return summarizeBelfastAirQualityRows(rows).map((summary) =>
    eventForBelfastAirQualitySummary(summary, toPosix(csvRelativePath)),
  );
}

function yearFromSupplementalDate(value, fallback = null) {
  const match = String(value || "").match(/(16|17|18|19|20)\d{2}/);
  if (match) return Number(match[0]);
  return Number.isInteger(fallback) ? fallback : null;
}

function datePrecisionForSupplementalEvent(item, effectiveDate, effectiveDateRange) {
  if (item.date_precision) return String(item.date_precision);
  if (effectiveDateRange) return "range";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(effectiveDate || ""))) return "day";
  if (/^\d{4}-\d{2}$/.test(String(effectiveDate || ""))) return "month";
  return "year";
}

function dateFieldsForSupplementalEvent(item) {
  const start = item.date_start || item.date || item.effective_date || item.year;
  const end = item.date_end || null;
  const effectiveDate = start === undefined || start === null ? null : String(start);
  const effectiveDateRange = end
    ? { start: effectiveDate, end: String(end) }
    : (item.effective_date_range && typeof item.effective_date_range === "object" ? item.effective_date_range : null);
  return {
    effective_date: effectiveDate,
    effective_date_range: effectiveDateRange,
    date_precision: datePrecisionForSupplementalEvent(item, effectiveDate, effectiveDateRange),
    source_date_field: item.source_date_field || "source supplied date",
    year: Number(item.year) || yearFromSupplementalDate(effectiveDate, yearFromSupplementalDate(effectiveDateRange?.start)),
  };
}

function geometryForSupplementalEvent(item) {
  const coordinates = Array.isArray(item.coordinates)
    ? item.coordinates
    : [Number(item.longitude ?? item.lng), Number(item.latitude ?? item.lat)];
  return validPoint(coordinates)
    ? {
        type: "Point",
        coordinates: [Number(coordinates[0].toFixed(6)), Number(coordinates[1].toFixed(6))],
      }
    : null;
}

function evidenceForSupplementalEvent(item, sourceIds) {
  const urlsBySource = item.source_urls && typeof item.source_urls === "object" ? item.source_urls : {};
  const recordIdsBySource = item.source_record_ids && typeof item.source_record_ids === "object" ? item.source_record_ids : {};
  return sourceIds.map((sourceId) => ({
    source_id: sourceId,
    label: item.source_name || sourceId,
    kind: (urlsBySource[sourceId] || item.source_url) ? "source_url" : "source_record",
    url: urlsBySource[sourceId] || item.source_url || null,
    file_path: null,
    record_id: recordIdsBySource[sourceId] || item.source_record_id || item.event_id || null,
    accessed_at: item.source_retrieved_at || null,
  }));
}

function normalizeSupplementalLensGapEvent(item, sourcePath) {
  const dates = dateFieldsForSupplementalEvent(item);
  const sourceIds = Array.isArray(item.source_ids) ? item.source_ids.map(String).filter(Boolean) : [];
  if (!Number.isInteger(dates.year)) {
    throw new Error(`Supplemental lens-gap event ${item.event_id || item.title || "unknown"} is missing a usable year.`);
  }
  if (!sourceIds.length) {
    throw new Error(`Supplemental lens-gap event ${item.event_id || item.title || "unknown"} is missing source_ids.`);
  }
  const geometry = geometryForSupplementalEvent(item);
  const title = String(item.title || "Source-backed city change record");
  const area = String(item.area || item.location || item.affected_area || "Belfast");
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    city_id: "belfast",
    record_kind: "event",
    event_id: String(item.event_id),
    title,
    short_description: sentenceLimit(item.short_description || item.summary || item.observed_change || title),
    year: dates.year,
    effective_date: dates.effective_date,
    effective_date_range: dates.effective_date_range,
    date_precision: dates.date_precision,
    source_date_field: dates.source_date_field,
    category: item.atlas_category || item.category || "observed_change",
    lens: item.atlas_lens || item.lens || "city_change",
    geometry,
    affected_area: { label: area },
    source_ids: sourceIds,
    evidence: evidenceForSupplementalEvent(item, sourceIds),
    confidence: item.confidence || "documented",
    affected_signals: Array.isArray(item.affected_signals) ? item.affected_signals.map(String).sort() : [],
    excluded_lens_slugs: Array.isArray(item.excluded_lens_slugs) ? item.excluded_lens_slugs.map(String).sort() : [],
    exclude_transport_road_scoring: item.exclude_transport_road_scoring === true,
    explanation: String(item.observed_change || item.summary || title),
    caveats: [
      String(item.limitations || "Source-backed supplemental event; inspect cited source before reuse."),
      "No before/after outcome metric is inferred unless a source adapter supplies observed measurements.",
    ],
    provenance: {
      transform: "scripts/build_data.js#normalizeSupplementalLensGapEvent",
      source_path: sourcePath,
      source_record_id: item.source_record_id || item.event_id || null,
      source_url: item.source_url || null,
      source_retrieved_at: item.source_retrieved_at || null,
      source_dataset_id: item.source_dataset_id || sourceIds[0],
      source_basis: item.source_name || null,
      source_date_field: dates.source_date_field,
      geometry_source: item.geometry_source || "Curated supplemental point geometry.",
      geometry_precision: item.geometry_precision || "Approximate point for atlas navigation; inspect source for spatial details.",
    },
  };
}

function loadSupplementalLensGapEvents(root, cityId) {
  const sourcePath = toPosix(SUPPLEMENTAL_LENS_GAP_PACKAGE);
  return (loadSupplementalLensGapPackage(root).events || [])
    .filter((event) => event.city_id === cityId)
    .map((event) => normalizeSupplementalLensGapEvent(event, sourcePath));
}

function geometryForLegacyEvent(event) {
  return validPoint(event.coordinates)
    ? {
        type: "Point",
        coordinates: [Number(event.coordinates[0].toFixed(6)), Number(event.coordinates[1].toFixed(6))],
      }
    : null;
}

function geometryProvenanceForLegacyEvent(event, sourceId) {
  if (!validPoint(event.coordinates)) {
    return {
      geometry_source: "No row-level point geometry was available in the source catalog; the event is located by affected_area label only.",
      geometry_precision: "No map point; use the affected-area label and source link for spatial interpretation.",
    };
  }
  if (sourceId === "osm-overpass") {
    return {
      geometry_source: "OpenStreetMap/Overpass element coordinates or derived point stored in the Belfast infrastructure event catalog.",
      geometry_precision: "OSM mapped feature point/centroid; edit timestamp is mapped visibility and not a confirmed construction/opening date.",
    };
  }
  if (sourceId === "ni-planning-statistics") {
    return {
      geometry_source: "Planning statistics source location normalized into the Belfast infrastructure event catalog.",
      geometry_precision: "Approximate site/address or grid-reference point; planning decision location is not evidence of completed works.",
    };
  }
  if (event.geometrySource || event.geometryPrecision) {
    return {
      geometry_source: event.geometrySource || "Curated public-source point stored in the Belfast infrastructure event catalog.",
      geometry_precision: event.geometryPrecision || "Approximate point for map navigation; inspect the cited source for exact boundaries.",
    };
  }
  return {
    geometry_source: "Curated public-source point stored in the Belfast infrastructure event catalog.",
    geometry_precision: "Approximate public project/facility point for map navigation; inspect the cited source for exact boundaries.",
  };
}

function parseMonthYear(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!match) return null;
  const months = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    sept: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };
  const month = months[match[1].toLowerCase()];
  return month ? `${match[2]}-${month}` : null;
}

function dateFieldsForLegacyEvent(event) {
  const effective = String(event.effectiveDate || event.date || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(effective)) {
    return {
      effective_date: effective.slice(0, 10),
      effective_date_range: null,
      date_precision: "day",
      source_date_field: event.sourceDateField || "effectiveDate",
    };
  }
  if (/^\d{4}-\d{2}$/.test(effective)) {
    return {
      effective_date: effective,
      effective_date_range: null,
      date_precision: "month",
      source_date_field: event.sourceDateField || "effectiveDate",
    };
  }
  if (/^\d{4}$/.test(effective)) {
    return {
      effective_date: effective,
      effective_date_range: null,
      date_precision: "year",
      source_date_field: event.sourceDateField || "effectiveDate",
    };
  }
  if (event.osmTimestamp && /^\d{4}-\d{2}-\d{2}/.test(event.osmTimestamp)) {
    return {
      effective_date: event.osmTimestamp.slice(0, 10),
      effective_date_range: null,
      date_precision: "day",
      source_date_field: "osmTimestamp (mapped-visibility/edit timestamp)",
    };
  }
  if (event.planningDecisionDate && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(event.planningDecisionDate))) {
    const [day, month, year] = String(event.planningDecisionDate).split("/").map(Number);
    return {
      effective_date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      effective_date_range: null,
      date_precision: "day",
      source_date_field: "planningDecisionDate",
    };
  }
  const month = parseMonthYear(event.month);
  if (month) {
    return {
      effective_date: month,
      effective_date_range: null,
      date_precision: "month",
      source_date_field: "month",
    };
  }
  return {
    effective_date: String(event.year),
    effective_date_range: null,
    date_precision: "year",
    source_date_field: "year",
  };
}

function normalizedYearForLegacyEvent(event, dates) {
  const dateYear = Number(String(dates.effective_date || "").slice(0, 4));
  if (Number.isInteger(dateYear) && dateYear >= 2000 && dateYear <= 2026) return dateYear;
  return Number(event.year);
}

function evidenceForLegacyEvent(event, sourceId, legacyCatalogPath) {
  const accessedAt = event.sourceAccessedAt || event.retrievedAt || null;
  const evidence = [];
  if (event.sourceUrl) {
    evidence.push({
      source_id: sourceId,
      label: event.sourceName || sourceId,
      kind: "source_url",
      url: event.sourceUrl,
      file_path: null,
      record_id: event.sourceId || event.id || null,
      accessed_at: accessedAt,
    });
  }
  if (event.osmChangesetUrl) {
    evidence.push({
      source_id: "osm-overpass",
      label: "OpenStreetMap changeset",
      kind: "changeset",
      url: event.osmChangesetUrl,
      file_path: null,
      record_id: event.osmChangeset ? String(event.osmChangeset) : null,
      accessed_at: accessedAt,
    });
  }
  evidence.push({
    source_id: sourceId,
    label: "Belfast infrastructure event catalog",
    kind: "local_file",
    url: null,
    file_path: legacyCatalogPath,
    record_id: event.id || null,
    accessed_at: accessedAt,
  });
  return evidence;
}

function explanationForLegacyEvent(event, sourceId) {
  const area = event.area || "Belfast";
  if (sourceId === "osm-overpass") {
    return `OpenStreetMap metadata records this feature as publicly mapped near ${area}. This is an observed mapped-change record, not a confirmed real-world opening or construction date.`;
  }
  if (sourceId === "ni-planning-statistics") {
    return `The planning statistics record documents a planning decision associated with ${area}. It is administrative evidence of a planning decision, not evidence that works were completed.`;
  }
  return `Public source material documents this event near ${area}. Related local changes should be treated as associated context, not causal claims.`;
}

function caveatsForLegacyEvent(event, sourceId) {
  const caveats = [];
  if (sourceId === "osm-overpass") {
    caveats.push("OSM timestamps are edit or mapped-visibility dates and can differ from real-world effective dates.");
    caveats.push("Mapper activity and source availability can affect when a feature appears in OSM history.");
  } else if (sourceId === "ni-planning-statistics") {
    caveats.push("Planning approval is not evidence that construction started or completed.");
    caveats.push("Coordinates may be approximate where source records use grid references or site addresses.");
  } else {
    caveats.push("Public project pages can change; keep source URL and access date with citation records.");
    caveats.push("This event is not used as evidence of causal outcomes.");
  }
  if (event.subtitle && /not a confirmed construction|not construction/i.test(event.subtitle)) {
    caveats.push(event.subtitle);
  }
  if (event.limitations) {
    caveats.push(String(event.limitations));
  }
  return [...new Set(caveats)];
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceLimit(value, maxLength = 220) {
  let text = compactText(value);
  if (text.length < 12) {
    text = compactText(text ? `${text} source-backed city change record.` : "Source-backed city change record.");
  }
  if (text.length <= maxLength) return text;
  const sentence = text.slice(0, maxLength + 1).match(/^(.+?[.!?])\s/);
  if (sentence && sentence[1].length >= 40 && sentence[1].length <= maxLength) return sentence[1];
  const suffix = "...";
  const clipped = text.slice(0, maxLength - suffix.length);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length).trim().replace(/[ .,;:]+$/, "")}${suffix}`;
}

function shortDescriptionForLegacyEvent(event, sourceId) {
  if (event.shortDescription) return sentenceLimit(event.shortDescription);
  if (event.observed_change || event.observedChange) return sentenceLimit(event.observed_change || event.observedChange);
  if (event.subtitle && !/use the .* lens/i.test(String(event.subtitle))) return sentenceLimit(event.subtitle);
  if (sourceId === "osm-overpass") {
    return sentenceLimit(`${event.title || "Mapped feature"} is an OpenStreetMap visibility record near ${event.area || "Belfast"}.`);
  }
  if (sourceId === "ni-planning-statistics") {
    return sentenceLimit(`${event.title || "Planning decision"} is an administrative planning record for ${event.area || "Belfast"}.`);
  }
  return sentenceLimit(event.title || "Source-backed city change record.");
}

function normalizeLegacyBelfastEvent(event, legacyCatalogPath) {
  const sourceId = sourceIdForLegacyEvent(event);
  const dates = dateFieldsForLegacyEvent(event);
  const year = normalizedYearForLegacyEvent(event, dates);
  const geometryProvenance = geometryProvenanceForLegacyEvent(event, sourceId);
  const sourceDatasetId = event.sourceDatasetId || event.sourceRegistryId || null;
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    city_id: "belfast",
    record_kind: "event",
    event_id: String(event.id || event.event_id),
    title: String(event.title || "Observed city change"),
    short_description: shortDescriptionForLegacyEvent(event, sourceId),
    year,
    effective_date: dates.effective_date,
    effective_date_range: dates.effective_date_range,
    date_precision: dates.date_precision,
    source_date_field: dates.source_date_field,
    category: categoryForLegacyEvent(event),
    lens: lensForLegacyEvent(event),
    geometry: geometryForLegacyEvent(event),
    affected_area: {
      label: String(event.area || "Belfast"),
    },
    source_ids: [sourceId],
    evidence: evidenceForLegacyEvent(event, sourceId, legacyCatalogPath),
    confidence: confidenceForLegacyEvent(event),
    affected_signals: affectedSignalsForLegacyEvent(event),
    explanation: explanationForLegacyEvent(event, sourceId),
    caveats: caveatsForLegacyEvent(event, sourceId),
    provenance: {
      transform: "scripts/build_data.js#normalizeLegacyBelfastEvent",
      source_path: legacyCatalogPath,
      legacy_catalog_path: legacyCatalogPath,
      legacy_event_id: String(event.id || event.event_id),
      legacy_source_id: event.sourceId || null,
      source_record_id: event.sourceId || event.planningApplicationId || event.id || null,
      source_url: event.sourceUrl || event.osmChangesetUrl || null,
      source_retrieved_at: event.sourceAccessedAt || event.retrievedAt || null,
      ...(sourceDatasetId ? { source_dataset_id: sourceDatasetId } : {}),
      source_basis: event.sourceBasis || null,
      source_date_field: dates.source_date_field,
      geometry_source: geometryProvenance.geometry_source,
      geometry_precision: geometryProvenance.geometry_precision,
      osm_timestamp: event.osmTimestamp || null,
      osm_version: event.osmVersion || null,
      osm_changeset: event.osmChangeset || null,
      osm_changeset_url: event.osmChangesetUrl || null,
      planning_application_id: event.planningApplicationId || null,
    },
  };
}

function loadBelfastLegacyEvents(root, legacyCatalogPath) {
  const absolute = resolve(root, legacyCatalogPath);
  if (!fs.existsSync(absolute)) return { events: [], migration: null };
  const payload = readJson(absolute);
  const events = (payload.events || [])
    .map((event) => normalizeLegacyBelfastEvent(event, toPosix(legacyCatalogPath)))
    .filter((event) => Number.isInteger(event.year) && event.event_id)
    .sort((a, b) => a.year - b.year || a.event_id.localeCompare(b.event_id));

  return {
    events,
    migration: {
      source_kind: payload.kind || "belfast.infrastructureEventCatalog",
      source_schema_version: payload.schemaVersion || null,
      source_path: toPosix(legacyCatalogPath),
      source_event_count: payload.eventCount || events.length,
      normalized_event_count: events.length,
      basis: payload.basis || [],
      notes: [
        "Belfast infrastructure events are normalized into the event-first atlas schema.",
        "OSM-derived records remain labelled as mapped visibility, not real-world construction dates.",
      ],
    },
  };
}

function loadBelfastEvents(root, legacyCatalogPath) {
  const legacy = loadBelfastLegacyEvents(root, legacyCatalogPath);
  const airQualityEvents = loadBelfastAirQualityEvents(root);
  const supplementalEvents = loadSupplementalLensGapEvents(root, "belfast");
  const events = [...legacy.events, ...airQualityEvents, ...supplementalEvents].sort(
    (a, b) => a.year - b.year || a.event_id.localeCompare(b.event_id),
  );
  const migration = legacy.migration
    ? {
        ...legacy.migration,
        source_event_count: (legacy.migration.source_event_count || legacy.events.length) + airQualityEvents.length + supplementalEvents.length,
        normalized_event_count: events.length,
        additional_source_paths: [
          ...(airQualityEvents.length ? [BELFAST_AIR_QUALITY_CSV] : []),
          ...(supplementalEvents.length ? [SUPPLEMENTAL_LENS_GAP_PACKAGE] : []),
        ],
        notes: [
          ...(legacy.migration.notes || []),
          ...(airQualityEvents.length
            ? [
                "Local Belfast Centre hourly air-quality CSV rows are annualized into station-level environment monitoring events.",
                "Air-quality observations are monitoring context from one station, not citywide exposure or outcome evidence.",
              ]
            : []),
          ...(supplementalEvents.length
            ? [
                "Supplemental lens-gap events are curated source-backed milestones for 2007-2026 lens-year rows that previously had only coverage context.",
                "Supplemental events are administrative, facility, utility, or regeneration records; they are not completeness, capacity, causation, or outcome claims.",
              ]
            : []),
        ],
      }
    : null;
  return { events, migration };
}

function eventsForCity(root, city, legacyCatalogPath) {
  if (city.city_id === "belfast") {
    return loadBelfastEvents(root, legacyCatalogPath);
  }
  return {
    events: [],
    migration: {
      source_kind: "adapter_placeholder",
      source_schema_version: null,
      source_path: null,
      source_event_count: 0,
      normalized_event_count: 0,
      basis: [],
      notes: ["No local adapter has been implemented for this city yet."],
    },
  };
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function countByPair(items, firstKeyFn, secondKeyFn) {
  const counts = {};
  for (const item of items) {
    const firstKey = firstKeyFn(item);
    const secondKey = secondKeyFn(item);
    if (!firstKey || !secondKey) continue;
    counts[firstKey] = counts[firstKey] || {};
    counts[firstKey][secondKey] = (counts[firstKey][secondKey] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)))]),
  );
}

function featureForEvent(event) {
  const properties = {
    city_id: event.city_id,
    event_id: event.event_id,
    title: event.title,
    year: event.year,
    effective_date: event.effective_date,
    date_precision: event.date_precision,
    short_description: event.short_description,
    category: event.category,
    lens: event.lens,
    confidence: event.confidence,
    source_ids: event.source_ids,
    affected_area_label: event.affected_area?.label || null,
    explanation: event.explanation,
  };
  if (Array.isArray(event.excluded_lens_slugs) && event.excluded_lens_slugs.length) {
    properties.excluded_lens_slugs = event.excluded_lens_slugs;
  }
  if (event.exclude_transport_road_scoring === true) {
    properties.exclude_transport_road_scoring = true;
  }
  return {
    type: "Feature",
    id: event.event_id,
    properties,
    geometry: event.geometry || null,
  };
}

function availabilityMatrix(city, events) {
  return (city.source_families || []).map((family) => ({
    family_id: family.family_id,
    label: family.label,
    availability: family.availability,
    years: family.years || [],
    source_ids: family.source_ids || [],
    event_count: eventCountForFamily(family, events),
    notes: family.notes,
  }));
}

function eventCountForFamily(family, events) {
  const sourceIds = new Set(family.source_ids || []);
  if (!sourceIds.size) return 0;
  return events.filter((event) => (event.source_ids || []).some((sourceId) => sourceIds.has(sourceId))).length;
}

function existingGeneratedCitySummary(root, outputDir, city) {
  if (city.city_id === "belfast") return null;
  const cityOutputDir = path.join(outputDir, "cities", city.city_id);
  const cityPath = path.join(cityOutputDir, "city.json");
  const sourcesPath = path.join(cityOutputDir, "sources.json");
  const eventsPath = path.join(cityOutputDir, "events.json");
  if (!fs.existsSync(cityPath) || !fs.existsSync(sourcesPath) || !fs.existsSync(eventsPath)) return null;
  const cityPayload = readJson(cityPath);
  const sourcesPayload = readJson(sourcesPath);
  const eventsIndex = readJson(eventsPath);
  if (!Number.isInteger(eventsIndex.event_count) || eventsIndex.event_count <= 0) return null;
  return {
    city_id: city.city_id,
    display_name: cityPayload.display_name || city.display_name,
    event_count: eventsIndex.event_count,
    source_count: sourcesPayload.source_count || (sourcesPayload.sources || []).length,
    availability_status: cityPayload.data_availability?.status || city.data_availability?.status || "unknown",
    artifact_paths: cityPayload.artifact_paths || {
      city: relativeFromRoot(root, cityPath),
      sources: relativeFromRoot(root, sourcesPath),
      events: relativeFromRoot(root, eventsPath),
      availability: relativeFromRoot(root, path.join(cityOutputDir, "availability.json")),
      ...generatedArtifactPaths(root, cityOutputDir),
    },
  };
}

function buildCityArtifacts(root, outputDir, city, citySources, legacyCatalogPath, generatedAt) {
  const existing = existingGeneratedCitySummary(root, outputDir, city);
  if (existing) return existing;
  const cityOutputDir = path.join(outputDir, "cities", city.city_id);
  const { events, migration } = eventsForCity(root, city, legacyCatalogPath);
  const sourceById = new Map(citySources.map((source) => [source.source_id, source]));
  for (let index = 0; index < events.length; index += 1) {
    events[index] = enrichEventSourceAccess(events[index], sourceById);
  }
  const eventsByYear = new Map();
  for (const event of events) {
    if (!eventsByYear.has(event.year)) eventsByYear.set(event.year, []);
    eventsByYear.get(event.year).push(event);
  }

  const chunks = [];
  for (const year of [...eventsByYear.keys()].sort((a, b) => a - b)) {
    const yearEvents = eventsByYear.get(year).sort((a, b) => a.event_id.localeCompare(b.event_id));
    const jsonPath = path.join(cityOutputDir, `events_${year}.json`);
    const geojsonPath = path.join(cityOutputDir, `events_${year}.geojson`);
    writeJson(jsonPath, {
      schema_version: ATLAS_SCHEMA_VERSION,
      city_id: city.city_id,
      year,
      event_count: yearEvents.length,
      events: yearEvents,
    });
    writeJson(geojsonPath, {
      type: "FeatureCollection",
      schema_version: ATLAS_SCHEMA_VERSION,
      city_id: city.city_id,
      year,
      features: yearEvents.map(featureForEvent),
    });
    chunks.push({
      year,
      event_count: yearEvents.length,
      counts_by_category: countBy(yearEvents, (event) => event.category),
      counts_by_confidence: countBy(yearEvents, (event) => event.confidence),
      counts_by_category_confidence: countByPair(yearEvents, (event) => event.category, (event) => event.confidence),
      json_path: relativeFromRoot(root, jsonPath),
      geojson_path: relativeFromRoot(root, geojsonPath),
    });
  }

  const availability = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    summary: city.data_availability,
    matrix: availabilityMatrix(city, events),
    event_counts_by_year: countBy(events, (event) => String(event.year)),
    event_counts_by_category: countBy(events, (event) => event.category),
  };

  const eventsIndex = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    event_count: events.length,
    event_years: [...eventsByYear.keys()].sort((a, b) => a - b),
    chunks,
    migration,
  };

  const sourcePayload = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    source_count: citySources.length,
    sources: citySources,
  };

  const cityPath = path.join(cityOutputDir, "city.json");
  const sourcesPath = path.join(cityOutputDir, "sources.json");
  const eventsPath = path.join(cityOutputDir, "events.json");
  const availabilityPath = path.join(cityOutputDir, "availability.json");
  const cityPayload = {
    ...city,
    schema_version: city.schema_version || ATLAS_SCHEMA_VERSION,
    artifact_paths: {
      city: relativeFromRoot(root, cityPath),
      sources: relativeFromRoot(root, sourcesPath),
      events: relativeFromRoot(root, eventsPath),
      availability: relativeFromRoot(root, availabilityPath),
      ...generatedArtifactPaths(root, cityOutputDir),
    },
  };

  writeJson(cityPath, cityPayload);
  writeJson(sourcesPath, sourcePayload);
  writeJson(eventsPath, eventsIndex);
  writeJson(availabilityPath, availability);

  return {
    city_id: city.city_id,
    display_name: city.display_name,
    event_count: events.length,
    source_count: citySources.length,
    availability_status: city.data_availability?.status || "unknown",
    artifact_paths: cityPayload.artifact_paths,
  };
}

function buildAtlas(args) {
  const root = args.root;
  const outputDir = resolve(root, args.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const cityConfigs = loadCityConfigs(root, args.configDir);
  const registry = readJson(resolve(root, args.sourceRegistry));
  const citySummaries = cityConfigs.map((city) =>
    buildCityArtifacts(
      root,
      outputDir,
      city,
      sourceRegistryForCity(registry, city.city_id, args.generatedAt, root),
      args.legacyCatalog,
      args.generatedAt,
    ),
  );

  const index = {
    schema_version: ATLAS_SCHEMA_VERSION,
    generated_at: args.generatedAt,
    default_city_id: "belfast",
    city_count: citySummaries.length,
    cities: citySummaries,
    contracts: {
      city_schema: "schemas/city.schema.json",
      source_schema: "schemas/source.schema.json",
      event_schema: "schemas/event.schema.json",
      availability_schema: "schemas/availability.schema.json",
    },
  };
  writeJson(path.join(outputDir, "index.json"), index);
  return index;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const index = buildAtlas(args);
    console.log(
      `Wrote city atlas artifacts for ${index.city_count} city config(s) to ${toPosix(args.outputDir)}.`,
    );
    for (const city of index.cities) {
      console.log(`- ${city.city_id}: ${city.event_count} event(s), ${city.source_count} source(s)`);
    }
  } catch (error) {
    console.error(`build:data failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAtlas,
  loadBelfastAirQualityEvents,
  normalizeLegacyBelfastEvent,
  parseArgs,
  summarizeBelfastAirQualityRows,
};
