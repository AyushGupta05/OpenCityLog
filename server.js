const fs = require("fs");
const http = require("http");
const path = require("path");
const proposalImpact = require("./lib/proposal-impact");

const rootDir = __dirname;
const webDir = path.join(rootDir, "web");
const manifestPath = path.join(rootDir, "api", "replay-manifest.json");
const port = Number(process.env.PORT || 5173);

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

function safeStaticPath(baseDir, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  let decoded;
  try {
    decoded = decodeURIComponent(cleanPath);
  } catch (_error) {
    return null;
  }
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
  res.writeHead(200, {
    "content-type": mimeTypes[ext] || "application/octet-stream",
    "cache-control": ext === ".html" ? "no-store" : "public, max-age=60"
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
    const result = proposalImpact.assessProposal(payload.proposal || payload, {
      rootDir,
      radius_m: Number(payload.radius_m || payload.radiusM || proposalImpact.DEFAULT_RADIUS_M)
    });
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

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      product: "Open Citylog",
      mode: "city-change-atlas",
      atlasIndex: fs.existsSync(path.join(webDir, "data", "city-atlas", "index.json")),
      legacyReplayManifest: fs.existsSync(manifestPath)
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

  if (req.method === "GET" && (pathname === "/api/manifest" || pathname === "/api/replay-manifest.json")) {
    serveFile(res, manifestPath);
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
