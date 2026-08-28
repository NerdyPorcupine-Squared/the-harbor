import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-with-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

test("Media Bar remains plugin-owned when plugin CSS loads after Harbor", async ({
  page,
}) => {
  const viewport = page.viewportSize();
  const hero = page.locator("#slides-container");
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();

  const pluginHeroHeightSvh = (heroBox.height / viewport.height) * 100;
  expect(pluginHeroHeightSvh).toBeGreaterThanOrEqual(89);
  expect(pluginHeroHeightSvh).toBeLessThanOrEqual(91);

  const videoBox = await page.locator("#slides-container .video-backdrop").boundingBox();
  expect(videoBox).not.toBeNull();
  expect(Math.abs(videoBox.width - heroBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(videoBox.height - heroBox.height)).toBeLessThanOrEqual(1);

  const pluginRowTop = await page.locator(".homeSectionsContainer").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).top),
  );
  const pluginRowTopSvh = (pluginRowTop / viewport.height) * 100;
  expect(pluginRowTopSvh).toBeGreaterThanOrEqual(64);
  expect(pluginRowTopSvh).toBeLessThanOrEqual(66);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  const controls = page.locator("#slides-container button:visible");
  expect(await controls.count()).toBeGreaterThanOrEqual(8);
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    await expect(control).toBeVisible();
    await expect(control).toBeEnabled();
    expect(await control.boundingBox()).not.toBeNull();
  }

  const arrows = page.locator("#slides-container .arrow:visible");
  expect(await arrows.count()).toBe(2);
  for (let index = 0; index < (await arrows.count()); index += 1) {
    const box = await arrows.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(39);
    expect(box.width).toBeLessThanOrEqual(41);
    expect(box.height).toBeGreaterThanOrEqual(39);
    expect(box.height).toBeLessThanOrEqual(41);
  }

  const primaryControl = page.locator("[data-hero-primary]");
  await primaryControl.focus();
  await expect(primaryControl).toBeFocused();
  const outlineWidth = await primaryControl.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).outlineWidth),
  );
  expect(outlineWidth).toBeGreaterThanOrEqual(2);
});
