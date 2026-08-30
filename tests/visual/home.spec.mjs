import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-without-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

async function optionalNavigationSource() {
  try {
    return await readFile(
      new URL("../../integrations/home-navigation.js", import.meta.url),
      "utf8",
    );
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

async function optionalHomeEnhancementsSource() {
  try {
    return await readFile(
      new URL("../../integrations/home-enhancements.js", import.meta.url),
      "utf8",
    );
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

async function prepareGlobalNavigationFixture(page, { withLibraryLinks = true } = {}) {
  await page.locator(".skinHeader").evaluate((header, options) => {
    header.innerHTML = `
      <nav class="headerTabs" aria-label="Global navigation">
        <a class="emby-tab-button emby-tab-button-active" href="#/home" aria-current="page">Home</a>
        <a class="emby-tab-button" href="#/favorites">Favorites</a>
      </nav>
    `;

    document.querySelector("#harbor-native-library-links")?.remove();
    if (!options.withLibraryLinks) return;

    const nativeLinks = document.createElement("aside");
    nativeLinks.id = "harbor-native-library-links";
    nativeLinks.hidden = true;
    nativeLinks.innerHTML = `
      <a class="lnkMediaFolder navMenuOption emby-button" href="#/movies?topParentId=movies-fixture&collectionType=movies">Movies</a>
      <a class="lnkMediaFolder navMenuOption emby-button" href="#/tv?topParentId=tv-fixture&collectionType=tvshows">TV Shows</a>
    `;
    document.body.append(nativeLinks);
  }, { withLibraryLinks });
}

async function globalTabLabels(page) {
  return page.locator(".skinHeader .headerTabs .emby-tab-button").allTextContents();
}

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

test("home stays compact and usable without Media Bar", async ({ page }, testInfo) => {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  const headingBox = await page.locator(".homeSection .sectionTitle").boundingBox();
  expect(headingBox).not.toBeNull();
  expect(headingBox.y).toBeLessThanOrEqual(500);

  const image = page.locator(".cardImageContainer").first();
  const scalable = page.locator(".cardScalable").first();
  const imageBox = await image.boundingBox();
  const scalableBox = await scalable.boundingBox();
  expect(imageBox).not.toBeNull();
  expect(scalableBox).not.toBeNull();
  expect(Math.abs(imageBox.width - scalableBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(imageBox.height - scalableBox.height)).toBeLessThanOrEqual(2);

  const imageAspectRatio = await image.evaluate(
    (element) => getComputedStyle(element).aspectRatio,
  );
  expect(imageAspectRatio).toBe("auto");

  const firstControl = page.locator(".cardOverlayButton").first();
  await expect(firstControl).toBeVisible();
  await expect(firstControl).toBeEnabled();
  await firstControl.focus();
  await expect(firstControl).toBeFocused();

  if (testInfo.project.name === "mobile") {
    const controls = page.locator("button:visible");
    for (let index = 0; index < (await controls.count()); index += 1) {
      const box = await controls.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeGreaterThanOrEqual(40);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  }
});

test("Harbor Home navigation reuses live-shaped native library routes and stays idempotent", async ({ page }) => {
  await prepareGlobalNavigationFixture(page);
  const source = await optionalNavigationSource();
  await page.addScriptTag({ content: source });

  await expect.poll(() => globalTabLabels(page)).toEqual([
    "Home",
    "Movies",
    "TV Shows",
    "Favorites",
  ]);

  const tabs = page.locator(".skinHeader .headerTabs .emby-tab-button");
  await expect(tabs.nth(1)).toHaveAttribute(
    "href",
    "#/movies?topParentId=movies-fixture&collectionType=movies",
  );
  await expect(tabs.nth(2)).toHaveAttribute(
    "href",
    "#/tv?topParentId=tv-fixture&collectionType=tvshows",
  );
  await expect(page.locator('[data-harbor-global-nav="movies"]')).toHaveCount(1);
  await expect(page.locator('[data-harbor-global-nav="tv"]')).toHaveCount(1);

  await page.locator(".skinHeader").evaluate((header) => {
    header.innerHTML = `
      <nav class="headerTabs" aria-label="Global navigation">
        <a class="emby-tab-button emby-tab-button-active" href="#/home" aria-current="page">Home</a>
        <a class="emby-tab-button" href="#/favorites">Favorites</a>
      </nav>
    `;
  });

  await expect.poll(() => globalTabLabels(page)).toEqual([
    "Home",
    "Movies",
    "TV Shows",
    "Favorites",
  ]);
  await expect(page.locator('[data-harbor-global-nav="movies"]')).toHaveCount(1);
  await expect(page.locator('[data-harbor-global-nav="tv"]')).toHaveCount(1);
});

test("Harbor Home navigation fails closed when native Movies or TV routes are unavailable", async ({ page }) => {
  await prepareGlobalNavigationFixture(page, { withLibraryLinks: false });
  const source = await optionalNavigationSource();
  await page.addScriptTag({ content: source });

  await expect.poll(() => globalTabLabels(page)).toEqual(["Home", "Favorites"]);
  await expect(page.locator("[data-harbor-global-nav]")).toHaveCount(0);
});

test("combined Home enhancements injector activates ordering and global navigation together", async ({ page }) => {
  await prepareGlobalNavigationFixture(page);
  const source = await optionalHomeEnhancementsSource();
  await page.addScriptTag({ content: source });

  await expect.poll(() => globalTabLabels(page)).toEqual([
    "Home",
    "Movies",
    "TV Shows",
    "Favorites",
  ]);
  await expect(page.locator("[data-harbor-global-nav]")).toHaveCount(2);

  const hub = page.locator("#homelabStreamingHub");
  await expect(hub).toHaveCount(1);
  await expect(hub).toHaveAttribute("data-harbor-streaming-services", "true");
  await expect.poll(async () =>
    page.locator(".homeSectionsContainer").evaluate(
      (container) => container.firstElementChild?.id ?? null,
    )
  ).toBe("homelabStreamingHub");
});

test("combined Home enhancements exposes an execution sentinel and does not duplicate observers", async ({ page }) => {
  await prepareGlobalNavigationFixture(page);
  const source = await optionalHomeEnhancementsSource();

  await page.evaluate(() => {
    const NativeMutationObserver = window.MutationObserver;
    window.__harborObserverConstructions = 0;
    window.MutationObserver = class HarborCountingMutationObserver extends NativeMutationObserver {
      constructor(callback) {
        super(callback);
        window.__harborObserverConstructions += 1;
      }
    };
  });

  await page.addScriptTag({ content: source });
  await page.addScriptTag({ content: source });

  await expect(page.locator("html")).toHaveAttribute(
    "data-harbor-home-enhancements",
    "core-v1-rc3",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-harbor-streaming-services-adapter",
    "core-v1-rc3",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-harbor-home-navigation-adapter",
    "core-v1-rc3",
  );

  await expect.poll(() =>
    page.evaluate(() => window.__harborObserverConstructions)
  ).toBe(2);

  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);
  await expect(page.locator("[data-harbor-global-nav]")).toHaveCount(2);
});
