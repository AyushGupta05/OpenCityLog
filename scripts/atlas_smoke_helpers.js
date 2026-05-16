const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const baseUrl = (process.env.URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const atlasUrl = (process.env.ATLAS_URL || `${baseUrl}/atlas`).replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function waitForPaperAtlas(page) {
  await page.waitForSelector("#map .maplibregl-canvas", { timeout: 45000 });
  await page.waitForSelector("#layersList .layer-row", { timeout: 45000 });
  await page.waitForSelector(".pin", { timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelector("#appStatus")?.textContent.trim() === "",
    null,
    { timeout: 45000 }
  );
}

async function closeWelcome(page) {
  const welcome = page.locator("#welcome[data-open='true']");
  if (await welcome.count()) {
    await page.getByText("Start exploring", { exact: false }).click();
    await page.waitForFunction(
      () => document.querySelector("#welcome")?.getAttribute("data-open") === "false"
        && getComputedStyle(document.querySelector("#welcome")).visibility === "hidden",
      null,
      { timeout: 10000 }
    );
  }
}

async function openAtlas(page, targetUrl = atlasUrl) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForPaperAtlas(page);
  await closeWelcome(page);
}

async function atlasState(page) {
  return page.evaluate(() => {
    const pins = [...document.querySelectorAll(".pin")].map((pin) => {
      const rect = pin.getBoundingClientRect();
      return {
        text: pin.textContent.trim(),
        active: pin.getAttribute("data-active") === "true",
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        inViewport: rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight,
      };
    });
    return {
      title: document.title,
      url: location.href,
      appStatus: document.querySelector("#appStatus")?.textContent.trim() || "",
      city: document.querySelector("#cityNameLabel")?.textContent.trim() || "",
      year: document.querySelector("#tlYear")?.textContent.trim() || "",
      visibleText: document.querySelector("#tlVisible")?.textContent.trim() || "",
      totalText: document.querySelector("#tlTotal")?.textContent.trim() || "",
      layersCount: document.querySelector("#layersCount")?.textContent.trim() || "",
      transportOn: document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") || "",
      detailTitle: document.querySelector(".detail-title")?.textContent.trim() || "",
      detailOpen: !document.querySelector("#detailInner")?.hasAttribute("hidden"),
      eventRows: document.querySelectorAll("#eventList .event-row").length,
      changelogOpen: document.querySelector("#changelogPanel")?.getAttribute("data-open") || "",
      compareOpen: document.querySelector("#comparePanel")?.getAttribute("data-open") || "",
      compareStats: document.querySelector("#compareStats")?.textContent.trim() || "",
      mapTools: document.querySelectorAll(".map-tools button").length,
      tiltPressed: document.querySelector("#tiltBtn")?.getAttribute("aria-pressed") || "",
      bimsAtlasApi: typeof window.BimsAtlas === "object",
      mapPitch: Math.round(window.BimsAtlas?.state?.map?.getPitch?.() || 0),
      pinCount: pins.length,
      visiblePinCount: pins.filter((pin) => pin.inViewport).length,
      activePin: pins.find((pin) => pin.active) || null,
      mapCanvas: document.querySelectorAll(".maplibregl-canvas").length,
      zoomButtons: document.querySelectorAll(".maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out").length,
      attribution: document.querySelector(".maplibregl-ctrl-attrib")?.textContent.trim() || "",
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      welcomeOpen: document.querySelector("#welcome")?.getAttribute("data-open"),
      welcomeVisibility: getComputedStyle(document.querySelector("#welcome")).visibility,
      bodyText: document.body.innerText,
    };
  });
}

async function pinPosition(page, text) {
  return page.evaluate((needle) => {
    const pin = [...document.querySelectorAll(".pin")].find((candidate) => candidate.textContent.includes(needle));
    const rect = pin?.getBoundingClientRect();
    return rect ? {
      text: pin.textContent.trim(),
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    } : null;
  }, text);
}

async function clickPin(page, text) {
  const pin = await pinPosition(page, text);
  assert(pin, `Could not find map pin containing "${text}".`);
  await page.mouse.click(pin.x, pin.y);
  return pin;
}

function attachConsoleCapture(page, consoleMessages, pageErrors) {
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
}

function actionableConsoleMessages(messages) {
  return messages.filter((message) => !/WebGL.*GPU stall|ReadPixels|favicon|ERR_CACHE_WRITE_FAILURE/i.test(message.text));
}

module.exports = {
  assert,
  assertDetailedPng,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  actionableConsoleMessages,
  baseUrl,
  chromium,
  clickPin,
  closeWelcome,
  ensureOutputDir,
  openAtlas,
  outputDir,
  pinPosition,
  waitForPaperAtlas,
};
