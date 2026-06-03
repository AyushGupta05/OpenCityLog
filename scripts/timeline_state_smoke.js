const {
  actionableConsoleMessages,
  assert,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  chromium,
  chromiumLaunchOptions,
  openAtlas,
} = require("./atlas_smoke_helpers");

async function scrubTo(page, ratio) {
  const before = await atlasState(page);
  const scrub = await page.locator("#tlScrub").boundingBox();
  assert(scrub, "Timeline scrub element is missing.");
  await page.mouse.click(scrub.x + scrub.width * ratio, scrub.y + scrub.height / 2);
  await page.waitForFunction(
    (oldYear) => {
      const atlas = window.BimsAtlas;
      const pins = [...document.querySelectorAll(".pin")];
      const visiblePins = pins.filter((pin) => {
        const rect = pin.getBoundingClientRect();
        return rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight;
      }).length;
      return atlas?.state
        && String(atlas.state.year) !== oldYear
        && document.querySelector("#appStatus")?.textContent.trim() === ""
        && pins.length > 0
        && visiblePins > 0
        && (document.querySelector(".detail-title")?.textContent.trim().length || 0) > 8;
    },
    before.year,
    { timeout: 15000 }
  );
  await page.waitForTimeout(950);
  await page.waitForFunction(
    () => {
      const pins = [...document.querySelectorAll(".pin")];
      const visiblePins = pins.filter((pin) => {
        const rect = pin.getBoundingClientRect();
        return rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight;
      });
      return visiblePins.length > 0 && visiblePins.some((pin) => pin.getAttribute("data-active") === "true");
    },
    null,
    { timeout: 10000 }
  );
  return atlasState(page);
}

(async () => {
  const browser = await chromium.launch(chromiumLaunchOptions);
  const page = await browser.newPage({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  attachConsoleCapture(page, consoleMessages, pageErrors);

  await openAtlas(page, atlasUrl);
  const defaultState = await atlasState(page);
  assert(defaultState.year === "2007", `Expected source-compatible default year 2007, got ${defaultState.year}.`);
  assert(defaultState.activeAspect === "transport-speed", `Expected source-compatible default transport-speed lens, got ${defaultState.activeAspect}.`);
  assert(defaultState.pinCount > 0 && defaultState.activePin?.inViewport, "Default selected event pin is not visible.");

  await openAtlas(page, `${atlasUrl}?city=nyc&year=2010&lens=planning-delta`);
  const initial = await atlasState(page);
  assert(initial.year === "2010", `Expected NYC timeline state year 2010, got ${initial.year}.`);
  assert(initial.activeAspect === "planning-delta", `Expected NYC planning-delta lens, got ${initial.activeAspect}.`);
  assert(initial.pinCount > 0 && initial.visiblePinCount > 0, "Initial NYC timeline pins are not visible.");
  assert(initial.detailTitle.length > 8, "Initial NYC timeline detail is missing.");
  assert(initial.visibleText && initial.totalText, "Timeline visible/total counts are missing.");

  const early = await scrubTo(page, 0.75);
  assert(early.year !== initial.year, "Timeline state did not change after scrubbing earlier.");
  assert(early.pinCount > 0 && early.visiblePinCount > 0, "Early year has no visible map pins.");
  assert(early.detailTitle.length > 8, "Early year did not keep a selected evidence detail.");
  assert(early.visibleText && Number(early.visibleText.replace(/,/g, "")) > 0, "Early year visible count is empty.");

  const late = await scrubTo(page, 0.95);
  assert(late.year !== early.year, "Timeline state did not change after scrubbing later.");
  assert(late.pinCount > 0 && late.visiblePinCount > 0, "Later year has no visible map pins.");
  assert(late.detailTitle.length > 8, "Later year did not keep a selected evidence detail.");
  assert(late.visibleText && Number(late.visibleText.replace(/,/g, "")) > 0, "Later year visible count is empty.");

  await page.locator(".layer-row[data-layer='built_environment']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='built_environment']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  const filtered = await atlasState(page);
  assert(filtered.layersCount === "5/6 on", "Layer state count did not update after toggling the active category.");
  assert(filtered.visiblePinCount <= late.visiblePinCount, "Layer filtering unexpectedly increased visible pins.");

  await browser.close();
  const tileFetchFailed = consoleMessages.some((message) => /tile\.openstreetmap\.org|AJAXError: Failed to fetch \(0\): https:\/\/tile\.openstreetmap\.org/i.test(message.text));
  const actionable = actionableConsoleMessages(consoleMessages).filter((message) => {
    if (/tile\.openstreetmap\.org|AJAXError: Failed to fetch \(0\): https:\/\/tile\.openstreetmap\.org/i.test(message.text)) return false;
    if (tileFetchFailed && /^TypeError: Failed to fetch$/i.test(message.text)) return false;
    return true;
  });
  assert(pageErrors.length === 0, `Timeline state page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Timeline state console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("Timeline state smoke OK: year labels, selected details, visible counts, pins, and layer state update together.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
