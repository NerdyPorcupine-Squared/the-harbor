import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-with-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

test("Media Bar forms a responsive, accessible trailer hero", async ({
  page,
}, testInfo) => {
  const viewport = page.viewportSize();
  const hero = page.locator("#slides-container");
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();

  const heroHeightSvh = (heroBox.height / viewport.height) * 100;
  if (testInfo.project.name === "desktop") {
    expect(heroHeightSvh).toBeGreaterThanOrEqual(58);
    expect(heroHeightSvh).toBeLessThanOrEqual(67);
  } else {
    expect(heroHeightSvh).toBeLessThanOrEqual(48);
  }

  const rowBox = await page.locator(".homeSectionsContainer").boundingBox();
  expect(rowBox).not.toBeNull();
  const rowOffsetFromHeroBottom = rowBox.y - (heroBox.y + heroBox.height);
  expect(rowOffsetFromHeroBottom).toBeGreaterThanOrEqual(-40);
  expect(rowOffsetFromHeroBottom).toBeLessThanOrEqual(80);

  const metadataBox = await page
    .locator("#slides-container .harbor-metadata-panel")
    .boundingBox();
  expect(metadataBox).not.toBeNull();
  if (testInfo.project.name === "desktop") {
    expect(metadataBox.width / heroBox.width).toBeLessThanOrEqual(0.48);
  }

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  const header = page.locator(".skinHeader");
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox.y).toBeGreaterThanOrEqual(0);

  const controls = page.locator("#slides-container button:visible");
  expect(await controls.count()).toBeGreaterThanOrEqual(8);
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    await expect(control).toBeVisible();
    await expect(control).toBeEnabled();
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  }

  const primaryControl = page.locator("[data-hero-primary]");
  await primaryControl.click();
  await primaryControl.focus();
  await expect(primaryControl).toBeFocused();
  const outlineWidth = await primaryControl.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).outlineWidth),
  );
  expect(outlineWidth).toBeGreaterThanOrEqual(2);

  await expect(page).toHaveScreenshot(`media-bar-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
});
