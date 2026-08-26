import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-without-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

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
