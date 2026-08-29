import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

function fixtureUrl(name) {
  return pathToFileURL(
    fileURLToPath(new URL(`../fixtures/jellyfin/${name}.html`, import.meta.url)),
  ).href;
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
}

async function expectMobileTargets(page, projectName) {
  if (projectName !== "mobile") return;

  const controls = page.locator("button:visible, input:visible, select:visible");
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  }
}

async function expectCardArtFitsScalable(page, cardSelector) {
  const card = page.locator(cardSelector).first();
  const scalable = card.locator(".cardScalable");
  const image = card.locator(".cardImageContainer");
  const scalableBox = await scalable.boundingBox();
  const imageBox = await image.boundingBox();

  expect(scalableBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(Math.abs(imageBox.width - scalableBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(imageBox.height - scalableBox.height)).toBeLessThanOrEqual(2);

  const imageAspectRatio = await image.evaluate(
    (element) => getComputedStyle(element).aspectRatio,
  );
  expect(imageAspectRatio).toBe("auto");
}

test("library supports mixed media and interaction states", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("library"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const selectedFrame = await page.locator(".card.selected .cardScalable").evaluate(
    (element) => {
      const style = getComputedStyle(element);
      return {
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
      };
    },
  );
  expect(selectedFrame.borderStyle).toBe("none");
  expect(selectedFrame.boxShadow).toContain("184, 148, 75");

  const disabledOpacity = await page.locator('.card[aria-disabled="true"]').evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity),
  );
  expect(disabledOpacity).toBeLessThan(1);

  await expectCardArtFitsScalable(page, ".card:has(.cardPadder-portrait)");
  await expectCardArtFitsScalable(page, ".card:has(.cardPadder-backdrop)");
});

test("search renders all states without reordering them", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("search"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const states = await page
    .locator("[data-search-state]")
    .evaluateAll((elements) => elements.map((element) => element.dataset.searchState));
  expect(states).toEqual(["populated", "empty", "loading", "error"]);
  await expect(page.locator('[data-search-state="error"] [role="alert"]')).toBeVisible();
  await expectCardArtFitsScalable(page, '[data-search-state="populated"] .card');
});

test("details preserve Jellyfin geometry, actions, and readable content", async ({
  page,
}, testInfo) => {
  await page.goto(fixtureUrl("details"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const detailPage = page.locator("#itemDetailPage");
  await expect(detailPage).toBeVisible();
  await expect(page.locator(".itemBackdrop")).toBeVisible();
  await expect(page.locator(".detailRibbon")).toBeVisible();
  await expect(page.locator(".detailPagePrimaryContent")).toBeVisible();
  await expect(page.locator(".detailPageSecondaryContainer")).toBeVisible();
  await expect(page.locator("#castCollapsible")).toBeVisible();
  await expect(page.locator("#childrenCollapsible")).toBeVisible();

  const play = page.locator("[data-detail-play]");
  await play.focus();
  await expect(play).toBeFocused();
  await expect(play).toBeEnabled();

  const primaryBackground = await page.locator(".detailPagePrimaryContent").evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const secondaryColor = await page.locator(".detailPageSecondaryContainer").evaluate(
    (element) => getComputedStyle(element).color,
  );
  expect(primaryBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(secondaryColor).toBe("rgb(58, 45, 33)");

  for (const selector of [".nameContainer", ".itemMiscInfo", ".mainDetailButtons"]) {
    const textAlign = await page.locator(`#itemDetailPage ${selector}`).evaluate(
      (element) => getComputedStyle(element).textAlign,
    );
    expect(textAlign).toBe("center");
  }

  const overviewTextAlign = await page.locator("#itemDetailPage .overview").evaluate(
    (element) => getComputedStyle(element).textAlign,
  );
  expect(overviewTextAlign).toBe("left");

  for (const selector of [".nextUpSection .cardText", "#childrenCollapsible .cardText"]) {
    const labelBackground = await page.locator(selector).first().evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(labelBackground).toBe("rgba(0, 0, 0, 0)");
  }

  const castHeadingOpacity = await page.locator("#castCollapsible .sectionTitle").evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity),
  );
  expect(castHeadingOpacity).toBeLessThanOrEqual(0.78);

  const visiblePoster =
    testInfo.project.name === "mobile"
      ? ".detailImageContainer.hide-desktop .card"
      : ".detailImageContainer.hide-mobile .card";
  await expectCardArtFitsScalable(page, visiblePoster);
  await expectCardArtFitsScalable(page, "#childrenCollapsible .card");

  const backdropBox = await page.locator(".itemBackdrop").boundingBox();
  const primaryBox = await page.locator(".detailPagePrimaryContainer").boundingBox();
  const secondaryBox = await page.locator(".detailPageSecondaryContainer").boundingBox();
  expect(backdropBox).not.toBeNull();
  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect(backdropBox.height).toBeGreaterThan(0);
  expect(primaryBox.y).toBeLessThan(secondaryBox.y);
});

test("content pages fit tablet 820x1180", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one tablet pass is sufficient");
  await page.setViewportSize({ width: 820, height: 1180 });

  for (const fixture of ["library", "search", "details"]) {
    await page.goto(fixtureUrl(fixture));
    await expectNoHorizontalOverflow(page);
  }
});

test("content pages fit the effective viewport at 200% zoom", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one zoom pass is sufficient");
  await page.setViewportSize({ width: 720, height: 450 });

  for (const fixture of ["library", "search", "details"]) {
    await page.goto(fixtureUrl(fixture));
    await expectNoHorizontalOverflow(page);
  }
});
