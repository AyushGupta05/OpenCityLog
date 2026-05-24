const fs = require("fs");
const http = require("http");
const path = require("path");
const proposalImpact = require("./lib/proposal-impact");

const rootDir = __dirname;
const webDir = path.join(rootDir, "web");
const port = Number(process.env.PORT || 5173);
const proposalResponseCache = new Map();
const eventDetailCache = new Map();

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

function setEventDetailCache(key, value) {
  eventDetailCache.set(key, value);
  while (eventDetailCache.size > 48) {
    eventDetailCache.delete(eventDetailCache.keys().next().value);
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
  if (pathname === "/") return path.resolve(baseDir, "index.html");
  if (pathname === "/atlas") return path.resolve(baseDir, "atlas.html");
  const cleanPath = pathname;
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
      error: "Could not assess proposal analogues",
      detail: error.message,
      validation: error.validation || null
    });
  }
}

function safeEventFilePath(city, year) {
  if (!/^[A-Za-z0-9_-]+$/.test(city)) return null;
  if (!/^\d{4}$/.test(String(year))) return null;
  const base = path.resolve(webDir, "data", "city-atlas", "cities");
  const candidate = path.resolve(base, city, `events_${year}.json`);
  if (!candidate.startsWith(base + path.sep)) return null;
  return candidate;
}

function eventIdFromRecord(record) {
  const props = record?.properties || record || {};
  return String(props.event_id || record?.id || props.id || "");
}

function readEventDetail(city, year, id) {
  const cacheKey = `${city}:${year}:${id}`;
  if (eventDetailCache.has(cacheKey)) return eventDetailCache.get(cacheKey);
  const filePath = safeEventFilePath(city, year);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const events = Array.isArray(payload.events)
    ? payload.events
    : (Array.isArray(payload.features) ? payload.features : []);
  const event = events.find((record) => eventIdFromRecord(record) === id) || null;
  if (event) setEventDetailCache(cacheKey, event);
  return event;
}

function handleEventDetailGet(_req, res, requestUrl) {
  try {
    const city = String(requestUrl.searchParams.get("city") || "");
    const year = String(requestUrl.searchParams.get("year") || "");
    const id = String(requestUrl.searchParams.get("id") || "");
    if (!city || !year || !id || id.length > 512) {
      sendJson(res, 400, { ok: false, error: "Missing or invalid event detail parameters" });
      return;
    }
    const event = readEventDetail(city, year, id);
    if (!event) {
      sendJson(res, 404, { ok: false, error: "Event not found" });
      return;
    }
    sendJson(res, 200, { ok: true, event });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: "Could not load event detail", detail: error.message });
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

  if (req.method === "GET" && pathname === "/api/proposal-impact/schema") {
    handleProposalImpactSchema(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/event-detail") {
    handleEventDetailGet(req, res, requestUrl);
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
