const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://localhost:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.filteredEvents),
    null,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 30000 });
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1600, height: 980 }, deviceScaleFactor: 1 });
  desktop.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  desktop.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));
  await desktop.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(desktop);
  await desktop.waitForTimeout(600);

  const desktopState = await desktop.evaluate(() => {
    const map = document.querySelector("#mapViewport").getBoundingClientRect();
    const afterTiles = Array.from(document.querySelectorAll("#afterTileLayer img")).map((img) => img.getBoundingClientRect());
    const maxRight = Math.max(...afterTiles.map((rect) => rect.right), 0);
    const maxBottom = Math.max(...afterTiles.map((rect) => rect.bottom), 0);
    const firstCard = document.querySelector(".event-card");
    const thumb = firstCard?.querySelector(".event-thumb")?.getBoundingClientRect();
    const main = firstCard?.querySelector(".event-main")?.getBoundingClientRect();
    return {
      markers: document.querySelectorAll(".map-marker").length,
      eventCards: document.querySelectorAll(".event-card").length,
      eventThumbImages: document.querySelectorAll(".event-thumb img").length,
      evidenceFrames: document.querySelectorAll(".mini-frame").length,
      layerButtons: document.querySelectorAll(".layer-button").length,
      tileCount: document.querySelectorAll(".tile-layer img").length,
      tileSrc: document.querySelector("#afterTileLayer img")?.getAttribute("src") || "",
      mapCopy: document.querySelector("#mapAttribution")?.textContent || "",
      visibleText: document.body.innerText,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      mapWidth: Math.round(map.width),
      mapHeight: Math.round(map.height),
      tileCoversRight: maxRight >= map.right - 2,
      tileCoversBottom: maxBottom >= map.bottom - 2,
      thumbWidth: Math.round(thumb?.width || 0),
      thumbHeight: Math.round(thumb?.height || 0),
      thumbBeforeText: Boolean(thumb && main && thumb.right <= main.left - 6),
    };
  });

  assert(desktopState.markers > 0, "Desktop map has no markers.");
  assert(desktopState.eventCards > 0, "Desktop changelog has no event cards.");
  assert(desktopState.eventThumbImages > 0, "Desktop event thumbnails did not render imagery tiles.");
  assert(desktopState.thumbWidth >= 80 && desktopState.thumbHeight >= 90, "Desktop event thumbnails are too small.");
  assert(desktopState.thumbBeforeText, "Desktop event thumbnail overlaps event text.");
  assert(desktopState.evidenceFrames === 2, "Desktop before/after evidence frames missing.");
  assert(desktopState.layerButtons >= 5, "Layer controls did not render.");
  assert(desktopState.tileCount >= 24, "Imagery basemap tiles did not render.");
  assert(/World_Imagery/i.test(desktopState.tileSrc), "Basemap is not using the imagery tile service.");
  assert(desktopState.tileCoversRight && desktopState.tileCoversBottom, "Basemap tiles do not cover the map viewport.");
  assert(desktopState.scrollWidth <= desktopState.clientWidth + 4, `Desktop layout overflows horizontally: ${desktopState.scrollWidth} > ${desktopState.clientWidth}.`);
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, `Desktop layout overflows vertically: ${desktopState.scrollHeight} > ${desktopState.clientHeight}.`);
  assert(/Esri World Imagery|source-backed event overlays/i.test(desktopState.mapCopy), "Map attribution/footer copy is missing.");
  assert(!/\bRun Simulation\b|\bSolana\b|\bScenario Studio\b|\bbranch workspace\b/i.test(desktopState.visibleText), "Legacy simulator language is visible.");
  assert(/not a prediction engine/i.test(desktopState.visibleText), "Evidence-map caveat is not visible.");

  await desktop.screenshot({ path: path.join(outputDir, "civicreplay-desktop-smoke.png"), fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2, isMobile: true });
  mobile.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  mobile.on("pageerror", (error) => consoleErrors.push("mobile pageerror: " + error.message));
  await mobile.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(mobile);
  await mobile.waitForTimeout(600);

  const mobileState = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    mapHeight: Math.round(document.querySelector("#mapStage")?.getBoundingClientRect().height || 0),
    visibleText: document.body.innerText,
    railTop: Math.round(document.querySelector(".rail-tabs")?.getBoundingClientRect().top || 0),
    cityBottom: Math.round(document.querySelector(".city-picker")?.getBoundingClientRect().bottom || 0),
    firstCardHeight: Math.round(document.querySelector(".event-card")?.getBoundingClientRect().height || 0),
    eventThumbImages: document.querySelectorAll(".event-thumb img").length,
    thumbWidth: Math.round(document.querySelector(".event-thumb")?.getBoundingClientRect().width || 0),
    thumbHeight: Math.round(document.querySelector(".event-thumb")?.getBoundingClientRect().height || 0),
    thumbBeforeText: (() => {
      const firstCard = document.querySelector(".event-card");
      const thumb = firstCard?.querySelector(".event-thumb")?.getBoundingClientRect();
      const main = firstCard?.querySelector(".event-main")?.getBoundingClientRect();
      return Boolean(thumb && main && thumb.right <= main.left - 6);
    })(),
  }));

  assert(mobileState.scrollWidth <= mobileState.clientWidth + 4, `Mobile layout overflows horizontally: ${mobileState.scrollWidth} > ${mobileState.clientWidth}.`);
  assert(mobileState.mapHeight >= 640, `Mobile map is too short: ${mobileState.mapHeight}.`);
  assert(mobileState.railTop > mobileState.cityBottom, "Mobile topbar overlaps the change-log tabs.");
  assert(mobileState.firstCardHeight >= 110, "Mobile event cards are too cramped.");
  assert(mobileState.eventThumbImages > 0, "Mobile event thumbnails did not render imagery tiles.");
  assert(mobileState.thumbWidth <= 92 && mobileState.thumbHeight >= 100, "Mobile event thumbnail sizing is wrong.");
  assert(mobileState.thumbBeforeText, "Mobile event thumbnail overlaps event text.");
  assert(/Change log|Timeline|Evidence brief|Before \/ after|CivicReplay/i.test(mobileState.visibleText), "Mobile product sections are missing.");

  await mobile.screenshot({ path: path.join(outputDir, "civicreplay-mobile-smoke.png"), fullPage: true });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("CivicReplay dashboard smoke OK: desktop/mobile layout, map coverage, filters, timeline, and evidence brief.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
