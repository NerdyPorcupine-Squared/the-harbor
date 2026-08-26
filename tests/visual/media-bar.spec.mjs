import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-with-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

test("Media Bar forms a responsive, accessible trailer hero when plugin CSS loads after Harbor", async ({
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

  const metadataSelectors = [
    ".logo-container",
    ".info-container",
    ".genre",
    ".plot-container",
    ".button-container",
  ];
  const metadataBoxes = [];
  for (const selector of metadataSelectors) {
    const box = await page.locator(`#slides-container ${selector}`).boundingBox();
    expect(box).not.toBeNull();
    metadataBoxes.push(box);
    expect(box.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(box.x + box.width).toBeLessThanOrEqual(heroBox.x + heroBox.width);
    expect(box.y).toBeGreaterThanOrEqual(heroBox.y);
    expect(box.y + box.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
  }

  for (let index = 1; index < metadataBoxes.length; index += 1) {
    const previous = metadataBoxes[index - 1];
    const current = metadataBoxes[index];
    expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height - 1);
  }

  const logoBox = metadataBoxes[0];
  if (testInfo.project.name === "desktop") {
    expect(logoBox.width / heroBox.width).toBeLessThanOrEqual(0.48);
  }

  const plotBox = metadataBoxes[3];
  expect(plotBox.x).toBeGreaterThanOrEqual(heroBox.x);
  expect(plotBox.x + plotBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width);

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
