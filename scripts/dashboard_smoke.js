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
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 });
  desktop.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  desktop.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));
  await desktop.goto(url, { waitUntil: "commit", timeout: 30000 });
  await waitForAtlas(desktop);

  const desktopState = await desktop.evaluate(() => ({
    apiReady: Boolean(window.BimsAtlas),
    markers: document.querySelectorAll(".map-marker").length,
    eventCards: document.querySelectorAll(".event-card").length,
    deltaCards: document.querySelectorAll(".delta-card").length,
    layerButtons: document.querySelectorAll(".map-layer-btn").length,
    mapCopy: document.querySelector(".map-footer")?.textContent || "",
    visibleText: document.body.innerText,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));
  assert(desktopState.apiReady, "BimsAtlas test API was not exposed.");
  assert(desktopState.markers > 0, "Desktop map has no markers.");
  assert(desktopState.eventCards > 0, "Desktop changelog has no event cards.");
  assert(desktopState.deltaCards >= 4, "Year compare delta cards did not render.");
  assert(desktopState.layerButtons === 3, "Map layer toggles did not render.");
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, `Desktop layout overflows vertically: ${desktopState.scrollHeight} > ${desktopState.clientHeight}.`);
  assert(/Imagery|Esri World Imagery/i.test(desktopState.mapCopy), "Real imagery map footer copy is missing.");
  assert(!/\bRun Simulation\b|\bSolana\b|\bScenario Studio\b|\bbranch workspace\b/i.test(desktopState.visibleText), "Legacy simulator language is visible.");
  assert(/not a prediction engine/i.test(desktopState.visibleText), "Evidence-map caveat is not visible.");

  await desktop.locator(".lens-button", { hasText: "Traffic" }).click();
  await desktop.waitForFunction(() => window.BimsAtlas.state.lens === "transport", null, { timeout: 10000 });
  const trafficState = await desktop.evaluate(() => ({
    count: window.BimsAtlas.filteredEvents().length,
    text: document.querySelector("#listMeta")?.textContent || "",
  }));
  assert(trafficState.count > 0, "Traffic lens should show London transport records.");
  assert(/records/i.test(trafficState.text), "Lens result count did not update.");

  await desktop.locator("#mapMode2d").click();
  const mode2d = await desktop.locator("#mapStage").evaluate((node) => node.classList.contains("mode-2d"));
  assert(mode2d, "2D map toggle did not activate.");
  await desktop.locator("#mapMode3d").click();
  const mode3d = await desktop.locator("#mapStage").evaluate((node) => node.classList.contains("mode-3d"));
  assert(mode3d, "3D map toggle did not activate.");
  await desktop.locator(".map-layer-btn", { hasText: "Evidence" }).click();
  const evidenceLayer = await desktop.locator("#mapStage").evaluate((node) => node.classList.contains("layer-evidence"));
  assert(evidenceLayer, "Evidence layer toggle did not activate.");

  await desktop.keyboard.press("Tab");
  const focusVisible = await desktop.evaluate(() => Boolean(document.activeElement && document.activeElement !== document.body));
  assert(focusVisible, "Keyboard focus did not move to an interactive control.");

  await desktop.screenshot({ path: path.join(outputDir, "atlas-desktop-smoke.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2, isMobile: true });
  mobile.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  mobile.on("pageerror", (error) => consoleErrors.push("mobile pageerror: " + error.message));
  await mobile.goto(url, { waitUntil: "commit", timeout: 30000 });
  await waitForAtlas(mobile);

  const mobileState = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    mapHeight: Math.round(document.querySelector(".map-stage")?.getBoundingClientRect().height || 0),
    lensDisplay: getComputedStyle(document.querySelector(".lens-group")).display,
    visibleText: document.body.innerText,
  }));
  assert(mobileState.scrollWidth <= mobileState.clientWidth + 4, `Mobile layout overflows horizontally: ${mobileState.scrollWidth} > ${mobileState.clientWidth}.`);
  assert(mobileState.mapHeight >= 320, `Mobile map is too short: ${mobileState.mapHeight}.`);
  assert(mobileState.lensDisplay === "flex", "Lens filters did not render as scrollable controls.");
  assert(/Timeline|Selected event|Compare years|Open Citylog/i.test(mobileState.visibleText), "Mobile product sections are missing.");

  await mobile.screenshot({ path: path.join(outputDir, "atlas-mobile-smoke.png"), fullPage: true });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("Atlas dashboard smoke OK: desktop/mobile layout, map fallback, lenses, compare, and legacy-copy guard.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
