import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/shared-components.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

async function expectCardArtFitsScalable(page, cardSelector) {
  const card = page.locator(cardSelector).first();
  const scalableBox = await card.locator(".cardScalable").boundingBox();
  const imageBox = await card.locator(".cardImageContainer").boundingBox();
  expect(scalableBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(Math.abs(imageBox.width - scalableBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(imageBox.height - scalableBox.height)).toBeLessThanOrEqual(2);
}

test("shared Harbor components preserve responsive and accessible contracts", async ({
  page,
}, testInfo) => {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  if (testInfo.project.name === "mobile") {
    const controls = page.locator(
      'button:visible, input:visible, select:visible, textarea:visible, [role="button"]:visible, [role="menuitem"]:visible',
    );
    const controlCount = await controls.count();

    for (let index = 0; index < controlCount; index += 1) {
      const control = controls.nth(index);
      const box = await control.boundingBox();
      expect(box, `control ${index} has a box`).not.toBeNull();
      expect(box.width, `control ${index} is at least 40px wide`).toBeGreaterThanOrEqual(40);
      expect(box.height, `control ${index} is at least 40px tall`).toBeGreaterThanOrEqual(40);
    }
  }

  const focusedControl = page.locator("[data-harbor-focused]");
  await focusedControl.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outlineWidth = await focusedControl.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).outlineWidth),
  );
  expect(outlineWidth).toBeGreaterThanOrEqual(2);

  const parchmentControls = page.locator(
    "[data-harbor-parchment-control]:visible",
  );
  const parchmentControlCount = await parchmentControls.count();

  for (let index = 0; index < parchmentControlCount; index += 1) {
    const color = await parchmentControls.nth(index).evaluate(
      (element) => getComputedStyle(element).color,
    );
    expect(color).toBe("rgb(42, 33, 24)");
  }

  const parchmentSurfaces = page.locator(
    ".actionSheet, .dialog, .sectionTitle, .mediaInfoItem, .harbor-metadata-panel",
  );
  const parchmentSurfaceCount = await parchmentSurfaces.count();
  expect(parchmentSurfaceCount).toBeGreaterThan(0);

  for (let index = 0; index < parchmentSurfaceCount; index += 1) {
    const surfaceStyle = await parchmentSurfaces.nth(index).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        color: style.color,
      };
    });
    expect(surfaceStyle.backgroundColor).toBe("rgb(234, 217, 174)");
    expect(surfaceStyle.backgroundImage).toContain("fibers.svg");
    expect(surfaceStyle.backgroundImage).toContain("mottle.svg");
    expect(surfaceStyle.color).toBe("rgb(42, 33, 24)");
  }

  await expectCardArtFitsScalable(page, ".card:has(.cardPadder-portrait)");
  await expectCardArtFitsScalable(page, ".card:has(.cardPadder-backdrop)");
});
