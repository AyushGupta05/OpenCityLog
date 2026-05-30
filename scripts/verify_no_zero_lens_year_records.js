const fs = require("fs");
const path = require("path");

const REQUIRED_YEARS = Array.from({ length: 20 }, (_, index) => 2007 + index);

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const root = path.resolve(__dirname, "..");
  const indexPath = resolve(root, "web/data/city-atlas/index.json");
  const index = readJson(indexPath);
  const failures = [];
  const summaries = [];

  for (const city of index.cities || []) {
    const cityDir = path.dirname(resolve(root, city.artifact_paths?.city || `web/data/city-atlas/cities/${city.city_id}/city.json`));
    const coveragePath = path.join(cityDir, "lens_year_coverage.json");
    if (!fs.existsSync(coveragePath)) {
      failures.push(`${city.city_id}: missing lens_year_coverage.json`);
      continue;
    }
    const coverage = readJson(coveragePath);
    const rows = coverage.rows || [];
    const zeroRows = rows.filter((row) => (
      row.required_year === true
      && REQUIRED_YEARS.includes(Number(row.year))
      && Number(row.event_count || 0) <= 0
    ));
    const contextRows = rows.filter((row) => row.status === "source_backed_context_no_year_records");
    summaries.push(`${city.city_id}: ${rows.length} lens-year rows, ${zeroRows.length} zero-event row(s), ${contextRows.length} context-only row(s)`);
    for (const row of zeroRows) {
      const validContext = row.status === "source_backed_context_no_year_records"
        && row.visible_map_contract === true
        && Number(row.coverage_context_feature_count || 0) > 0
        && Number(row.headline_count_excluded_context_features || 0) >= Number(row.coverage_context_feature_count || 0);
      if (!validContext) {
        failures.push(`${city.city_id} ${row.lens_slug} ${row.year}: expected compatible source-backed events or explicit excluded coverage context, found ${row.status}`);
      }
    }
  }

  if (failures.length) {
    console.error("Lens-year record/context verification failed:");
    for (const summary of summaries) console.error(`- ${summary}`);
    for (const failure of failures.slice(0, 120)) console.error(`- ${failure}`);
    if (failures.length > 120) console.error(`- ... ${failures.length - 120} more`);
    process.exit(1);
  }

  console.log(`Lens-year records/context OK: ${summaries.join("; ")}`);
}

if (require.main === module) {
  main();
}
