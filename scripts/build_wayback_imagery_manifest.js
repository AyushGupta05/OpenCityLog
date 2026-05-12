const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/1.0.0/WMTSCapabilities.xml";
const OUTPUT_PATH = path.resolve(__dirname, "..", "web", "data", "wayback-imagery.json");

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function toXyzTemplate(template) {
  return decodeEntities(template)
    .replace("{TileMatrixSet}", "GoogleMapsCompatible")
    .replace("{TileMatrix}", "{z}")
    .replace("{TileRow}", "{y}")
    .replace("{TileCol}", "{x}");
}

function parseLayers(xml) {
  const layers = [];
  const layerPattern = /<Layer>([\s\S]*?)<\/Layer>/g;
  let match;
  while ((match = layerPattern.exec(xml))) {
    const block = match[1];
    const title = block.match(/<ows:Title>World Imagery \(Wayback ([0-9-]+)\)<\/ows:Title>/)?.[1];
    const id = block.match(/<ows:Identifier>([^<]+)<\/ows:Identifier>/)?.[1];
    const template = block.match(/<ResourceURL[^>]+template="([^"]+)"/)?.[1];
    if (!title || !id || !template) continue;
    const tileTemplate = toXyzTemplate(template);
    const itemId = tileTemplate.match(/\/tile\/([^/]+)\/\{z\}\//)?.[1] || "";
    layers.push({
      id,
      date: title,
      year: Number(title.slice(0, 4)),
      item_id: itemId,
      tile_template: tileTemplate,
    });
  }
  return layers.sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const xml = await response.text();
  const layers = parseLayers(xml);
  if (!layers.length) throw new Error("No Wayback imagery layers found in WMTS capabilities.");

  const manifest = {
    schema_version: "1.0.0",
    provider: "Esri World Imagery Wayback",
    source_url: SOURCE_URL,
    source_note: "Wayback layers are dated World Imagery basemap publication versions. Publication date can differ from underlying image acquisition date.",
    generated_at: new Date().toISOString(),
    earliest_date: layers[0].date,
    latest_date: layers[layers.length - 1].date,
    layers,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${layers.length} Wayback imagery layers to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
