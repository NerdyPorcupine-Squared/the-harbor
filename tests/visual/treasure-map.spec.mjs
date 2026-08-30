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
      borderBottomColor: style.borderBottomColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      color: style.color,
      outlineColor: style.outlineColor,
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

test("synthetic library fixture keeps native header content while selected tabs use Harbor brass", async ({ page }) => {
  await page.goto(fixtureUrl("library"));

  const injectedWordmark = await page.locator(".pageTitleWithDefaultLogo").evaluate(
    (element) => getComputedStyle(element, "::after").content,
  );
  expect(injectedWordmark).toBe("none");

  const active = await computed(page, ".emby-tab-button-active");
  expect(active.backgroundColor).not.toContain("229, 9, 20");
  expect(active.color).toBe("rgb(242, 213, 138)");
  expect(active.borderBottomColor).toBe("rgb(184, 148, 75)");
});

test("injected Streaming Services inherit Harbor presentation over legacy red styling", async ({ page }) => {
  await page.goto(fixtureUrl("streaming-services"));

  const surface = await computed(page, ".homeSectionsContainer");
  const card = await computed(page, ".stream-card");
  const label = await computed(page, ".open-label");

  expect(surface.backgroundImage).toContain("chart-grid.svg");
  expect(card.backgroundColor).toBe("rgb(12, 29, 41)");
  expect(card.borderColor).toContain("184, 148, 75");
  expect(card.borderColor).not.toContain("229, 9, 20");
  expect(label.color).toBe("rgb(216, 189, 130)");

  const firstCard = page.locator(".stream-card").first();
  await firstCard.focus();
  await expect(firstCard).toBeFocused();
  const focused = await computed(page, ".stream-card:focus");
  expect(focused.outlineColor).toBe("rgb(242, 213, 138)");
});

test("details transition from captain dossier into parchment browsing content", async ({ page }) => {
  await page.goto(fixtureUrl("details"));
  const backdrop = await computed(page, "#itemDetailPage .itemBackdrop");
  const primary = await computed(page, ".detailPagePrimaryContent");
  const overview = await computed(page, ".overview");
  const metadata = await computed(page, ".mediaInfoItem");
  const secondary = await computed(page, ".detailPageSecondaryContainer");
  const personArt = await computed(page, "#castCollapsible .cardImageContainer");
  const personLabel = await computed(page, "#castCollapsible .cardText");

  expect(backdrop.backgroundImage).not.toContain("cartography");
  expect(primary.backgroundImage).toContain("route.svg");
  expect(overview.backgroundImage).toBe("none");
  expect(overview.boxShadow).toBe("none");
  expect(metadata.backgroundColor).toContain("184, 148, 75");
  expect(secondary.backgroundColor).toBe("rgb(234, 217, 174)");
  expect(secondary.backgroundImage).toContain("chart-grid.svg");
  expect(secondary.color).toBe("rgb(58, 45, 33)");
  expect(personArt.backgroundImage).not.toContain("cartography");
  expect(personLabel.color).toBe("rgb(58, 45, 33)");
});

test("Media Bar stays cinematic while plugin geometry remains authoritative", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("home-with-media-bar"));
  const hero = await computed(page, "#slides-container");
  const row = await computed(page, ".homeSectionsContainer");

  expect(hero.backgroundImage).not.toContain("cartography");
  expect(hero.boxShadow).not.toBe("none");
  expect(row.backgroundImage).toContain("chart-grid.svg");
  expect(row.boxShadow).not.toBe("none");
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

test("synthetic player fixture receives no cartography or browsing pseudo branding", async ({ page }) => {
  await page.goto(fixtureUrl("player"));
  for (const selector of [".videoPlayerContainer", ".videoSurface", ".videoOsdBottom"]) {
    const style = await computed(page, selector);
    expect(style.backgroundImage).not.toContain("cartography");
    expect(style.backgroundImage).not.toContain("coastline.svg");
    expect(style.backgroundImage).not.toContain("chart-grid.svg");
  }

  const osdBrand = await page.locator(".osdHeader .pageTitleWithDefaultLogo").evaluate(
    (element) => getComputedStyle(element, "::after").content,
  );
  expect(osdBrand).toBe("none");
});

test("forced colors removes browsing decoration without removing content", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(fixtureUrl("home-without-media-bar"));

  const surface = await computed(page, ".homeSectionsContainer");
  expect(surface.backgroundImage).toBe("none");
  await expect(page.locator(".homeSection").first()).toBeVisible();
  await expect(page.locator(".cardOverlayButton").first()).toBeVisible();
});
