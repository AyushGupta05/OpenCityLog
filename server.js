const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = __dirname;
const webDir = path.join(rootDir, "web");
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

function sendText(res, status, message) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(message);
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
    sendJson(res, 410, {
      ok: false,
      error: "Retired endpoint",
      detail: "Proposal/future analogue paths are quarantined by the current city-change atlas contract. Use the 15 historical/current lens manifests and evidence exports instead."
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/proposal-impact") {
    sendJson(res, 410, {
      ok: false,
      error: "Retired endpoint",
      detail: "Proposal/future analogue paths are quarantined by the current city-change atlas contract. Use the 15 historical/current lens manifests and evidence exports instead."
    });
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
