const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = __dirname;
const webDir = path.join(rootDir, "web");

loadLocalEnv(path.join(rootDir, ".env.local"));

const port = parsePort(process.env.PORT || "5173");
const host = process.env.HOST || "0.0.0.0";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
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

function parsePort(value) {
  const portNumber = Number(value);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return portNumber;
}

function sendJson(req, res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body)
  });
  res.end(req.method === "HEAD" ? undefined : body);
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
  if (pathname === "/" || pathname === "/index.html") return path.resolve(baseDir, "index.html");
  if (pathname === "/atlas" || pathname === "/atlas/") return path.resolve(baseDir, "atlas.html");
  const cleanPath = pathname;
  const decoded = normalizeUrlPath(cleanPath);
  if (decoded === null) return null;
  const relative = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(baseDir, relative);
  const base = path.resolve(baseDir);
  if (candidate !== base && !candidate.startsWith(base + path.sep)) return null;
  return candidate;
}

async function serveFile(req, res, filePath) {
  let stat = null;
  if (filePath) {
    try {
      stat = await fs.promises.stat(filePath);
    } catch (_error) {
      stat = null;
    }
  }
  if (!filePath || !stat?.isFile()) {
    sendText(res, 404, "Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const localAssetCache = ext === ".html" || ext === ".js" || ext === ".css" ? "no-store" : "public, max-age=60";
  const etag = `W/\"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}\"`;
  const lastModified = stat.mtime.toUTCString();
  const commonHeaders = {
    "content-type": mimeTypes[ext] || "application/octet-stream",
    "cache-control": localAssetCache,
    "content-length": stat.size,
    "last-modified": lastModified,
    "etag": etag,
    "accept-ranges": "bytes"
  };
  if (req.headers["if-none-match"] === etag || req.headers["if-modified-since"] === lastModified) {
    res.writeHead(304, {
      "cache-control": localAssetCache,
      "last-modified": lastModified,
      "etag": etag
    });
    res.end();
    return;
  }
  res.writeHead(200, commonHeaders);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on("error", (error) => {
    if (!res.headersSent) {
      sendText(res, 500, "Unable to read file");
      return;
    }
    res.destroy(error);
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  let requestUrl;
  try {
    requestUrl = new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);
  } catch (_error) {
    sendText(res, 400, "Invalid URL");
    return;
  }
  const pathname = requestUrl.pathname;
  const decodedPathname = normalizeUrlPath(pathname);
  if (decodedPathname === null) {
    sendText(res, 400, "Invalid URL path");
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && pathname === "/api/health") {
    sendJson(req, res, 200, {
      ok: true,
      product: "Open Citylog",
      mode: "city-change-atlas",
      atlasIndex: fs.existsSync(path.join(webDir, "data", "city-atlas", "index.json"))
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/proposal-impact/schema") {
    sendJson(req, res, 410, {
      ok: false,
      error: "Retired endpoint",
      detail: "Proposal/future analogue paths are quarantined by the current city-change atlas contract. Use the 15 historical/current lens manifests and evidence exports instead."
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/proposal-impact") {
    sendJson(req, res, 410, {
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

  serveFile(req, res, safeStaticPath(webDir, pathname)).catch((error) => {
    if (!res.headersSent) sendText(res, 500, "Unable to serve request");
    else res.destroy(error);
  });
});

server.on("clientError", (_error, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.on("error", (error) => {
  console.error(`Open Citylog server failed: ${error.message}`);
  process.exit(1);
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`Open Citylog atlas UI/API running at http://${displayHost}:${port} (bound to ${host}:${port})`);
});
