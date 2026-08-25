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

for (const fixture of ["login", "dashboard", "states"]) {
  test(`${fixture} remains responsive and keyboard accessible`, async ({
    page,
  }, testInfo) => {
    await page.goto(fixtureUrl(fixture));
    await expectNoHorizontalOverflow(page);
    await expectMobileTargets(page, testInfo.project.name);

    const firstControl = page.locator("button:visible, input:visible, select:visible").first();
    await firstControl.focus();
    await expect(firstControl).toBeFocused();
    await expect(firstControl).toBeEnabled();

    if (fixture === "login" || fixture === "dashboard") {
      const checkboxBox = await page.locator(".emby-checkbox").boundingBox();
      expect(checkboxBox).not.toBeNull();
      expect(checkboxBox.width).toBeGreaterThanOrEqual(40);
      expect(checkboxBox.width).toBeLessThanOrEqual(50);
      expect(checkboxBox.height).toBeGreaterThanOrEqual(40);
    }

    await expect(page).toHaveScreenshot(`${fixture}-${testInfo.project.name}.png`, {
      animations: "disabled",
      fullPage: true,
    });
  });
}

test("player keeps every essential control visible and clickable", async ({
  page,
}, testInfo) => {
  await page.goto(fixtureUrl("player"));
  await expectNoHorizontalOverflow(page);
  await expectMobileTargets(page, testInfo.project.name);

  const controls = page.locator(".videoOsdBottom button:visible, .videoOsdBottom input:visible");
  expect(await controls.count()).toBe(8);
  for (let index = 0; index < (await controls.count()); index += 1) {
    await expect(controls.nth(index)).toBeVisible();
    await expect(controls.nth(index)).toBeEnabled();
  }

  const play = page.locator("[data-player-primary]");
  await play.click();
  await play.focus();
  await expect(play).toBeFocused();

  await expect(page).toHaveScreenshot(`player-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
});

test("reducedMotion disables decorative loading animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(fixtureUrl("states"));
  const animationName = await page.locator(".loadingSpinner").evaluate(
    (element) => getComputedStyle(element).animationName,
  );
  expect(animationName).toBe("none");
});

test("forcedColors keeps controls and alerts distinguishable", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(fixtureUrl("dashboard"));
  const buttonBorder = await page.locator(".button-submit").evaluate(
    (element) => getComputedStyle(element).borderStyle,
  );
  expect(buttonBorder).not.toBe("none");
  await expect(page.locator(".alert")).toBeVisible();
});

test("system pages fit the effective viewport at 200% zoom", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one zoom pass is sufficient");
  await page.setViewportSize({ width: 720, height: 450 });

  for (const fixture of ["login", "dashboard", "states", "player"]) {
    await page.goto(fixtureUrl(fixture));
    await expectNoHorizontalOverflow(page);
  }
});
