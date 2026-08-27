import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jf-10.11.11/cards/runtime.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

for (const shape of ["portrait", "backdrop"]) {
  test(`real ${shape} card keeps Jellyfin-owned artwork geometry`, async ({ page }) => {
    const probe = page.locator(`[data-probe="${shape}"]`);
    const scalable = probe.locator(".cardScalable");
    const padder = probe.locator(".cardPadder");
    const image = probe.locator(".cardImageContainer");

    const [scalableBox, padderBox, imageBox] = await Promise.all([
      scalable.boundingBox(),
      padder.boundingBox(),
      image.boundingBox(),
    ]);

    expect(scalableBox).not.toBeNull();
    expect(padderBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    expect(Math.abs(imageBox.width - padderBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBox.height - padderBox.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBox.width - scalableBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBox.height - scalableBox.height)).toBeLessThanOrEqual(1);

    const computed = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        backgroundImage: style.backgroundImage,
        backgroundSize: style.backgroundSize,
        backgroundPosition: style.backgroundPosition,
        aspectRatio: style.aspectRatio,
      };
    });

    expect(computed.position).toBe("absolute");
    expect(computed.backgroundImage).toContain("linear-gradient");
    expect(computed.backgroundSize).toBe("cover");
    expect(computed.backgroundPosition).toBe("50% 50%");
    expect(computed.aspectRatio).toBe("auto");
  });
}
