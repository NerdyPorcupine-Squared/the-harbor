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

test("library supports mixed media and interaction states", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("library"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const selectedBorder = await page.locator(".card.selected .cardBox").evaluate(
    (element) => getComputedStyle(element).borderColor,
  );
  expect(selectedBorder).toBe("rgba(184, 148, 75, 0.78)");

  const disabledOpacity = await page.locator('.card[aria-disabled="true"]').evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity),
  );
  expect(disabledOpacity).toBeLessThan(1);

  await expect(page).toHaveScreenshot(`library-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
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

  await expect(page).toHaveScreenshot(`search-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
});

test("details preserve actions and wrap long metadata", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl("details"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const play = page.locator("[data-detail-play]");
  await play.focus();
  await expect(play).toBeFocused();
  await expect(play).toBeEnabled();
  await expect(page.locator(".peopleSection")).toBeVisible();
  await expect(page.locator(".seasonSection")).toBeVisible();
  await expect(page.locator(".episodeList")).toBeVisible();

  await expect(page).toHaveScreenshot(`details-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
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
