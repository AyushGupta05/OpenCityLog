const { spawn } = require("child_process");
const http = require("http");

const DEFAULT_URL = "http://127.0.0.1:5173";
const HEALTH_PATH = "/api/health";
const START_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 250;

async function main() {
  const command = process.argv.slice(2);
  if (!command.length) {
    throw new Error("Usage: node scripts/with_smoke_server.js <command> [args...]");
  }

  const baseUrl = normalizeBaseUrl(process.env.URL || DEFAULT_URL);
  const healthUrl = new URL(HEALTH_PATH, baseUrl);
  const canManageServer = isLocalHost(healthUrl.hostname);

  let server = null;
  let exitCode = 1;
  if (!(await isHealthy(healthUrl))) {
    if (!canManageServer) {
      throw new Error(`Smoke target is not reachable and cannot be auto-started: ${baseUrl}`);
    }
    server = startServer(healthUrl);
  }

  try {
    if (server) await waitForHealth(healthUrl);
    exitCode = await runCommand(command);
  } finally {
    if (server) await stopServer(server);
  }
  process.exit(exitCode);
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function isLocalHost(hostname) {
  return ["127.0.0.1", "localhost", "::1"].includes(hostname);
}

function isHealthy(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });
    req.setTimeout(1000, () => req.destroy());
    req.on("error", () => resolve(false));
  });
}

function startServer(healthUrl) {
  const env = {
    ...process.env,
    HOST: healthUrl.hostname === "::1" ? "::1" : "127.0.0.1",
    PORT: healthUrl.port || (healthUrl.protocol === "https:" ? "443" : "80"),
  };
  let stopping = false;
  const server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "inherit", "inherit"],
  });
  server.on("exit", (code, signal) => {
    if (stopping) return;
    if (code !== null && code !== 0) {
      console.error(`Smoke server exited early with code ${code}.`);
    } else if (signal) {
      console.error(`Smoke server exited early with signal ${signal}.`);
    }
  });
  server.markStopping = () => {
    stopping = true;
  };
  return server;
}

async function waitForHealth(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    if (await isHealthy(url)) return;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for smoke server at ${url.href}`);
}

function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.on("exit", (code, signal) => {
      if (signal) {
        console.error(`Smoke command terminated with signal ${signal}.`);
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    if (server.exitCode !== null || server.signalCode !== null) {
      resolve();
      return;
    }
    server.markStopping?.();
    const timeout = setTimeout(() => {
      server.kill("SIGKILL");
      resolve();
    }, 2000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    server.kill("SIGTERM");
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
