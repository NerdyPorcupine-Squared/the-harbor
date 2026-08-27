import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

function fixtureUrl(name) {
  return pathToFileURL(
    fileURLToPath(new URL(`../fixtures/jellyfin/${name}.html`, import.meta.url)),
  ).href;
}

async function computed(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      color: style.color,
    };
  });
}

test("home browsing is an aged map with non-sizing framed media cards", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("home-without-media-bar"));
  const surface = await computed(page, ".homeSectionsContainer");

  expect(surface.color).toBe("rgb(58, 45, 33)");
  expect(surface.backgroundImage).toContain("chart-grid.svg");
  if (testInfo.project.name === "mobile") {
    expect(surface.backgroundImage).not.toContain("coastline.svg");
    expect(surface.backgroundImage).not.toContain("route.svg");
  } else {
    expect(surface.backgroundImage).toContain("coastline.svg");
    expect(surface.backgroundImage).toContain("route.svg");
  }

  const frame = await computed(page, ".cardScalable");
  const label = await computed(page, ".cardText");
  expect(frame.boxShadow).toContain("184, 148, 75");
  expect(label.backgroundColor).toBe("rgb(234, 217, 174)");
  expect(label.color).toBe("rgb(58, 45, 33)");
});

test("library and search use the map canvas without covering media art", async ({ page }, testInfo) => {
  for (const [fixture, selector] of [
    ["library", ".libraryPage"],
    ["search", ".searchPage"],
  ]) {
    await page.goto(fixtureUrl(fixture));
    const surface = await computed(page, selector);
    expect(surface.color).toBe("rgb(58, 45, 33)");
    expect(surface.backgroundImage).toContain("chart-grid.svg");
    if (testInfo.project.name === "desktop") {
      expect(surface.backgroundImage).toContain("coastline.svg");
    }

    const art = await computed(page, ".cardImageContainer");
    expect(art.backgroundImage).not.toContain("cartography");
  }
});

test("details transition from cinematic art into parchment browsing content", async ({ page }) => {
  await page.goto(fixtureUrl("details"));
  const backdrop = await computed(page, "#itemDetailPage .itemBackdrop");
  const secondary = await computed(page, ".detailPageSecondaryContainer");
  const personArt = await computed(page, "#castCollapsible .cardImageContainer");
  const personLabel = await computed(page, "#castCollapsible .cardText");

  expect(backdrop.backgroundImage).not.toContain("cartography");
  expect(secondary.backgroundColor).toBe("rgb(234, 217, 174)");
  expect(secondary.color).toBe("rgb(58, 45, 33)");
  expect(personArt.backgroundImage).not.toContain("cartography");
  expect(personLabel.color).toBe("rgb(58, 45, 33)");
});

test("Media Bar stays cinematic while plugin geometry remains authoritative", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("home-with-media-bar"));
  const hero = await computed(page, "#slides-container");
  const row = await computed(page, ".homeSectionsContainer");

  expect(hero.backgroundImage).not.toContain("cartography");
  expect(row.backgroundImage).toContain("chart-grid.svg");
  if (testInfo.project.name === "desktop") {
    expect(row.backgroundImage).toContain("coastline.svg");
  }

  const viewport = page.viewportSize();
  const heroBox = await page.locator("#slides-container").boundingBox();
  expect(heroBox).not.toBeNull();
  const pluginHeroHeightSvh = (heroBox.height / viewport.height) * 100;
  expect(pluginHeroHeightSvh).toBeGreaterThanOrEqual(89);
  expect(pluginHeroHeightSvh).toBeLessThanOrEqual(91);

  const pluginRowTop = await page.locator(".homeSectionsContainer").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).top),
  );
  const pluginRowTopSvh = (pluginRowTop / viewport.height) * 100;
  expect(pluginRowTopSvh).toBeGreaterThanOrEqual(64);
  expect(pluginRowTopSvh).toBeLessThanOrEqual(66);
});

test("player never receives cartography", async ({ page }) => {
  await page.goto(fixtureUrl("player"));
  for (const selector of [".videoPlayerContainer", ".videoSurface", ".videoOsdBottom"]) {
    const style = await computed(page, selector);
    expect(style.backgroundImage).not.toContain("cartography");
    expect(style.backgroundImage).not.toContain("coastline.svg");
    expect(style.backgroundImage).not.toContain("chart-grid.svg");
  }
});

test("forced colors removes browsing decoration without removing content", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(fixtureUrl("home-without-media-bar"));

  const surface = await computed(page, ".homeSectionsContainer");
  expect(surface.backgroundImage).toBe("none");
  await expect(page.locator(".homeSection").first()).toBeVisible();
  await expect(page.locator(".cardOverlayButton").first()).toBeVisible();
});
