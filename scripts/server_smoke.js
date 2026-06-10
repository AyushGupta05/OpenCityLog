const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function request({ method = "GET", port, pathname = "/", headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers,
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function waitForHealth(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await request({ port, pathname: "/api/health" });
      if (response.statusCode === 200) return response;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Server did not become healthy on port ${port}: ${lastError?.message || "timeout"}`);
}

async function main() {
  const port = 5400 + Math.floor(Math.random() * 800);
  const rootDir = path.resolve(__dirname, "..");
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForHealth(port);

    const healthHead = await request({ method: "HEAD", port, pathname: "/api/health" });
    assert(healthHead.statusCode === 200, `HEAD /api/health expected 200, got ${healthHead.statusCode}`);
    assert(healthHead.body === "", "HEAD /api/health should not return a body");
    assert(/application\/json/.test(healthHead.headers["content-type"] || ""), "HEAD /api/health should expose JSON content type");

    const atlasSlash = await request({ port, pathname: "/atlas/" });
    assert(atlasSlash.statusCode === 200, `GET /atlas/ expected 200, got ${atlasSlash.statusCode}`);
    assert(/text\/html/.test(atlasSlash.headers["content-type"] || ""), "GET /atlas/ should serve atlas HTML");

    const atlasHead = await request({ method: "HEAD", port, pathname: "/atlas" });
    assert(atlasHead.statusCode === 200, `HEAD /atlas expected 200, got ${atlasHead.statusCode}`);
    assert(Number(atlasHead.headers["content-length"] || 0) > 0, "HEAD /atlas should include content-length");
    assert(atlasHead.headers.etag, "HEAD /atlas should include an etag");
    assert(atlasHead.headers["last-modified"], "HEAD /atlas should include last-modified");

    const conditional = await request({ port, pathname: "/atlas", headers: { "if-none-match": atlasHead.headers.etag } });
    assert(conditional.statusCode === 304, `Conditional GET /atlas expected 304, got ${conditional.statusCode}`);
    assert(conditional.body === "", "304 response should not return a body");

    assert(stdout.includes(`127.0.0.1:${port}`), `Startup log should include configured host and port. stdout=${stdout}`);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }

  if (stderr.trim()) console.warn(stderr.trim());
  console.log("Server smoke OK: host binding, health HEAD, atlas trailing slash, and static cache validators work.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
