const fs = require("fs");
const http = require("http");
const path = require("path");
const proposalImpact = require("./lib/proposal-impact");

const rootDir = __dirname;
const webDir = path.join(rootDir, "web");
const port = Number(process.env.PORT || 5173);
const proposalResponseCache = new Map();
const waybackTileCache = new Map();
const MAX_WAYBACK_TILE_CACHE_ITEMS = 512;

loadLocalEnv(path.join(rootDir, ".env.local"));

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".tif": "image/tiff"
};

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    let value = match[2] || "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function proposalCacheKey(payload) {
  return stableJson({
    proposal: payload.proposal || payload,
    radius_m: Number(payload.radius_m || payload.radiusM || proposalImpact.DEFAULT_RADIUS_M)
  });
}

function setProposalCache(key, value) {
  proposalResponseCache.set(key, value);
  while (proposalResponseCache.size > 96) {
    proposalResponseCache.delete(proposalResponseCache.keys().next().value);
  }
}

function setWaybackTileCache(key, value) {
  waybackTileCache.set(key, value);
  while (waybackTileCache.size > MAX_WAYBACK_TILE_CACHE_ITEMS) {
    waybackTileCache.delete(waybackTileCache.keys().next().value);
  }
}

function sendText(res, status, message) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(message);
}

function readRequestBody(req, limitBytes = 64_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readJsonRequest(req, limitBytes = 512_000) {
  const raw = await readRequestBody(req, limitBytes);
  return raw ? JSON.parse(raw) : {};
}

function normalizeUrlPath(pathname) {
  try {
    const decoded = decodeURIComponent(pathname).replace(/\\/g, "/");
    return path.posix.normalize("/" + decoded.replace(/^\/+/, ""));
  } catch (_error) {
    return null;
  }
}

function safeStaticPath(baseDir, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const decoded = normalizeUrlPath(cleanPath);
  if (decoded === null) return null;
  const relative = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(baseDir, relative);
  const base = path.resolve(baseDir);
  if (candidate !== base && !candidate.startsWith(base + path.sep)) return null;
  return candidate;
}

function serveFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const localAssetCache = ext === ".html" || ext === ".js" || ext === ".css" ? "no-store" : "public, max-age=60";
  res.writeHead(200, {
    "content-type": mimeTypes[ext] || "application/octet-stream",
    "cache-control": localAssetCache
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleWaybackTile(req, pathname, res) {
  const match = pathname.match(/^\/api\/imagery\/wayback\/([0-9]+)\/([0-9]{1,2})\/([0-9]+)\/([0-9]+)$/);
  if (!match) {
    sendText(res, 404, "Not found");
    return;
  }
  const [, itemId, z, y, x] = match;
  const zoom = Number(z);
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 18) {
    sendText(res, 400, "Invalid tile zoom");
    return;
  }
  const cacheKey = `${itemId}/${z}/${y}/${x}`;
  const cached = waybackTileCache.get(cacheKey);
  if (cached) {
    res.writeHead(200, {
      "content-type": cached.contentType,
      "cache-control": "public, max-age=86400",
      "access-control-allow-origin": "*"
    });
    res.end(cached.body);
    return;
  }
  const upstream = `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/GoogleMapsCompatible/MapServer/tile/${itemId}/${z}/${y}/${x}`;
  res.writeHead(302, {
    location: upstream,
    "cache-control": "public, max-age=86400",
    "access-control-allow-origin": "*"
  });
  res.end();
  return;

  const controller = new AbortController();
  req.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  try {
    const response = await fetch(upstream, { signal: controller.signal });
    if (!response.ok) {
      sendText(res, response.status, `Imagery tile unavailable: ${response.statusText}`);
      return;
    }
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    setWaybackTileCache(cacheKey, { body, contentType });
    if (res.writableEnded) return;
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": "public, max-age=86400",
      "access-control-allow-origin": "*"
    });
    res.end(body);
  } catch (error) {
    if (error.name === "AbortError" || res.writableEnded) return;
    sendText(res, 502, `Imagery tile proxy failed: ${error.message}`);
  }
}

function handleProposalImpactSchema(_req, res) {
  try {
    const schema = JSON.parse(fs.readFileSync(path.join(rootDir, "schemas", "proposal.schema.json"), "utf8"));
    sendJson(res, 200, {
      ok: true,
      schema,
      categories: Array.from(proposalImpact.VALID_CATEGORIES),
      endpoint: "/api/proposal-impact"
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: "Could not load proposal schema", detail: error.message });
  }
}

async function handleProposalImpactPost(req, res) {
  try {
    const payload = await readJsonRequest(req, 700_000);
    const cacheKey = proposalCacheKey(payload);
    const cached = proposalResponseCache.get(cacheKey);
    if (cached) {
      sendJson(res, 200, cached);
      return;
    }
    const result = proposalImpact.assessProposal(payload.proposal || payload, {
      rootDir,
      radius_m: Number(payload.radius_m || payload.radiusM || proposalImpact.DEFAULT_RADIUS_M)
    });
    setProposalCache(cacheKey, result);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: "Could not assess proposal impact",
      detail: error.message,
      validation: error.validation || null
    });
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
  const pathname = requestUrl.pathname;
  const decodedPathname = normalizeUrlPath(pathname);
  if (decodedPathname === null) {
    sendText(res, 400, "Invalid URL path");
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      product: "Open Citylog",
      mode: "city-change-atlas",
      atlasIndex: fs.existsSync(path.join(webDir, "data", "city-atlas", "index.json"))
    });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/imagery/wayback/")) {
    handleWaybackTile(req, pathname, res).catch((error) => {
      if (!res.writableEnded) sendText(res, 502, `Imagery tile proxy failed: ${error.message}`);
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/proposal-impact/schema") {
    handleProposalImpactSchema(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/proposal-impact") {
    handleProposalImpactPost(req, res);
    return;
  }

  if (decodedPathname === "/data/mode-a" || decodedPathname.startsWith("/data/mode-a/")) {
    sendText(res, 410, "Retired Mode A replay data is not a public atlas path.");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method not allowed");
    return;
  }

  serveFile(res, safeStaticPath(webDir, pathname));
});

server.listen(port, () => {
  console.log(`Open Citylog atlas UI/API running at http://localhost:${port}`);
});
