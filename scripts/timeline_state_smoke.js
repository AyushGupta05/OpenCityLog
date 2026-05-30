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
  const initial = await atlasState(page);
  assert(initial.year === "2024", `Expected default year 2024, got ${initial.year}.`);
  assert(initial.pinCount > 0 && initial.activePin?.inViewport, "Initial selected event pin is not visible.");
  assert(initial.visibleText && initial.totalText, "Timeline visible/total counts are missing.");

  const early = await scrubTo(page, 0.30);
  assert(early.year !== "2024", "Timeline state did not change after scrubbing earlier.");
  assert(early.pinCount > 0 && early.visiblePinCount > 0, "Early year has no visible map pins.");
  assert(early.detailTitle.length > 8, "Early year did not keep a selected evidence detail.");
  assert(early.visibleText && Number(early.visibleText.replace(/,/g, "")) > 0, "Early year visible count is empty.");

  const late = await scrubTo(page, 0.90);
  assert(late.year !== early.year, "Timeline state did not change after scrubbing later.");
  assert(late.pinCount > 0 && late.visiblePinCount > 0, "Later year has no visible map pins.");
  assert(late.detailTitle.length > 8, "Later year did not keep a selected evidence detail.");
  assert(late.visibleText && Number(late.visibleText.replace(/,/g, "")) > 0, "Later year visible count is empty.");

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  const filtered = await atlasState(page);
  assert(filtered.layersCount === "5/6 on", "Layer state count did not update after toggling transport.");
  assert(filtered.transportOn === "false", "Transport layer state did not persist after click.");
  assert(filtered.visiblePinCount <= late.visiblePinCount, "Layer filtering unexpectedly increased visible pins.");

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Timeline state page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Timeline state console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("Timeline state smoke OK: year labels, selected details, visible counts, pins, and layer state update together.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
