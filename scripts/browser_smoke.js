const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || process.env.MODE_A_URL || "http://localhost:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.state?.eventsIndex),
    null,
    { timeout: 30000 }
  );
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (_error) {}
  });

  await page.goto(url, { waitUntil: "commit", timeout: 30000 });
  await waitForAtlas(page);

  const initial = await page.evaluate(() => ({
    productName: document.querySelector("#productName")?.textContent?.trim(),
    cityOptions: Array.from(document.querySelectorAll("#citySelect option")).map((option) => option.value),
    lensLabels: Array.from(document.querySelectorAll(".lens-button")).map((button) => button.textContent),
    bodyText: document.body.innerText,
    eventCount: window.BimsAtlas.filteredEvents().length,
    year: window.BimsAtlas.state.year,
  }));

  assert(initial.productName === "Open Citylog", "Product name did not render.");
  for (const cityId of ["london", "nyc"]) {
    assert(initial.cityOptions.includes(cityId), `Missing city selector option ${cityId}.`);
  }
  assert(!initial.cityOptions.includes("belfast"), "Belfast should not be exposed in the city selector.");
  for (const label of ["Development", "Traffic", "Housing", "Environment", "Economy/jobs", "Energy/infra", "Services/equity"]) {
    assert(initial.lensLabels.some((text) => text.includes(label)), `Missing lens ${label}.`);
  }
  assert(!/Run Simulation|Solana|Scenario Studio|2036 Scenario|Branch Workspace/i.test(initial.bodyText), "Legacy simulator UI copy is still visible.");
  assert(initial.eventCount > 0, "London should load curated events by default.");

  await page.locator("#citySelect").selectOption("nyc");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "nyc", null, { timeout: 10000 });
  const nycState = await page.evaluate(() => ({
    city: window.BimsAtlas.state.city.display_name,
    eventText: document.querySelector("#eventList")?.textContent || "",
  }));
  assert(nycState.city.includes("New York"), "City selector did not switch to New York.");
  assert(/Congestion pricing|Second Avenue|Hudson Yards|Times Square/i.test(nycState.eventText), "NYC curated events did not render.");

  await page.locator("#citySelect").selectOption("london");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "london", null, { timeout: 10000 });
  await page.evaluate(() => window.BimsAtlas.setYear(2022));
  await page.waitForFunction(() => window.BimsAtlas.state.year === 2022, null, { timeout: 10000 });
  await page.locator(".lens-button", { hasText: "Traffic" }).click();
  await page.waitForFunction(() => window.BimsAtlas.state.lens === "transport" && window.BimsAtlas.filteredEvents().length > 0, null, { timeout: 10000 });

  await page.locator(".event-card").first().click();
  await page.waitForFunction(() => window.BimsAtlas.state.selectedEventId && document.querySelector("#detailTitle")?.textContent !== "Select a record", null, { timeout: 10000 });
  const detail = await page.evaluate(() => ({
    title: document.querySelector("#detailTitle")?.textContent || "",
    body: document.querySelector("#detailBody")?.textContent || "",
    confidence: document.querySelector("#detailConfidence")?.textContent || "",
    selectedEventId: window.BimsAtlas.state.selectedEventId,
  }));
  assert(detail.title.length > 5, "Event detail title did not render.");
  for (const section of ["Observed change", "Affected signals"]) {
    assert(detail.body.includes(section), `Event detail missing ${section}.`);
  }
  assert(/documented|corroborated|inferred|disputed/i.test(detail.confidence), "Event confidence was not visible.");
  assert(await page.locator("#mapCallout").isVisible(), "Selecting an event did not show the map callout.");
  const zoomed = await page.locator("#mapStage").evaluate((node) => node.classList.contains("zoomed"));
  assert(zoomed, "Selecting an event did not zoom the map.");
  assert(await page.locator("#trafficCompareCard").isVisible(), "Traffic before/after evidence card did not render.");
  await page.locator(".map-layer-btn", { hasText: "Evidence" }).click();
  const evidenceLayer = await page.locator("#mapStage").evaluate((node) => node.classList.contains("layer-evidence"));
  assert(evidenceLayer, "Evidence map layer toggle did not activate.");
  await page.locator(".map-layer-btn", { hasText: "Before/after" }).click();
  const compareLayer = await page.locator("#mapStage").evaluate((node) => node.classList.contains("layer-compare"));
  assert(compareLayer, "Before/after map layer toggle did not activate.");

  await page.locator(".detail-tab", { hasText: "Evidence" }).click();
  await page.waitForFunction(() => /Evidence|Source caveats/i.test(document.querySelector("#detailBody")?.textContent || ""), null, { timeout: 10000 });
  await page.locator(".detail-tab", { hasText: "Details" }).click();
  await page.waitForFunction(() => /Where and when|Related or similar events/i.test(document.querySelector("#detailBody")?.textContent || ""), null, { timeout: 10000 });

  await page.locator("#sourcesButton").click();
  await page.waitForSelector("#sourceDrawer:not([hidden])", { timeout: 10000 });
  const sourceText = await page.locator("#sourceDrawerBody").textContent();
  assert(/Sources and provenance|Licence|Attribution|Coverage|event records/i.test(sourceText || ""), "Source drawer did not expose provenance details.");
  await page.locator("#closeSourcesButton").click();
  await page.waitForFunction(() => document.querySelector("#sourceDrawer")?.hasAttribute("hidden"), null, { timeout: 10000 });

  await page.locator("#compareBefore").selectOption("2021");
  await page.locator("#compareAfter").selectOption("2022");
  await page.waitForFunction(() => document.querySelectorAll(".delta-card").length >= 4, null, { timeout: 10000 });
  const compareText = await page.locator(".compare-card").textContent();
  assert(/Compare years|Before|After/i.test(compareText || ""), "Year compare controls are missing.");

  await page.locator("#impactButton").click();
  await page.waitForSelector("#impactPanel:not([hidden])", { timeout: 10000 });
  await page.locator("#proposalCategory").selectOption("building_development");
  await page.locator("#impactForm .primary-btn").click();
  await page.waitForSelector("#impactResults .impact-summary", { timeout: 30000 });
  const impactText = await page.locator("#impactResults").textContent();
  assert(/Confidence/i.test(impactText || ""), "Impact sketch did not render confidence.");
  assert(/Similar events/i.test(impactText || ""), "Impact sketch did not render historical analogues.");
  assert(/Caveats|calibrated outcome model|screening signals|not measured outcomes/i.test(impactText || ""), "Impact sketch did not render caveats.");

  const markerCount = await page.locator(".map-marker").count();
  assert(markerCount > 0, "Static map did not render event markers.");

  await page.screenshot({ path: path.join(outputDir, "atlas-browser-smoke.png"), fullPage: true });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log(`Atlas browser smoke OK: city, year, lens, detail, provenance, compare, and impact sketch.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
