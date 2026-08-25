import assert from "node:assert/strict";
import test from "node:test";

import {
  assertHarborScreenshot,
  desktopViewport,
  mobileViewport,
  openHarborFixture,
} from "./helpers.mjs";

const productionControlSelector = [
  ".skinHeader .headerButton",
  ".skinHeader .emby-tab-button",
  ".paper-icon-button-light",
  ".cardOverlayButton",
  ".cardMenuButton",
  ".cardPlayButton",
  ".card-actions button",
].join(", ");

function parseRgb(color) {
  const channels = color.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `expected an RGB color, received ${color}`);
  return channels;
}

function relativeLuminance(color) {
  const channels = parseRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(firstColor, secondColor) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function assertSharedComponents(viewport, snapshotName) {
  const { browser, page, errors } = await openHarborFixture(
    "shared-components.html",
    viewport,
  );

  try {
    assert.equal(errors.length, 0);
    assert.equal(
      await page
        .locator("body")
        .evaluate((node) => node.scrollWidth <= innerWidth),
      true,
      "shared components must not create horizontal overflow",
    );

    const brand = page.locator(".headerLogo.pageTitleWithLogo");
    assert.equal(
      await brand.evaluate((element) =>
        getComputedStyle(element, "::after").content.replace(/^['"]|['"]$/gu, ""),
      ),
      "The Harbor",
    );
    const legacyLogoBox = await brand.locator(":scope > img").evaluate((image) => {
      const bounds = image.getBoundingClientRect();
      return {
        clientRectCount: image.getClientRects().length,
        height: bounds.height,
        width: bounds.width,
      };
    });
    assert.deepEqual(
      legacyLogoBox,
      { clientRectCount: 0, height: 0, width: 0 },
      "legacy header logo artwork must not consume layout space",
    );

    const parchmentControlColors = await page
      .locator(".skinHeader button")
      .evaluateAll((controls) =>
        controls.map((control) => {
          const color = getComputedStyle(control).color;
          const [red, green, blue] = color.match(/[\d.]+/gu).map(Number);
          return {
            color,
            luminance: (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255,
          };
        }),
      );
    assert.ok(parchmentControlColors.length > 0);
    for (const control of parchmentControlColors) {
      assert.ok(
        control.luminance < 0.35,
        `parchment control must use dark ink, received ${control.color}`,
      );
    }

    const headerControl = page.locator('.headerButton[aria-label="Search"]');
    await headerControl.focus();
    const headerFocus = await headerControl.evaluate((control) => {
      const style = getComputedStyle(control);
      return {
        backgroundColor: getComputedStyle(control.closest(".skinHeader"))
          .backgroundColor,
        outlineColor: style.outlineColor,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    assert.ok(
      headerFocus.outlineWidth >= 2,
      `focused header control outline must be at least 2px, received ${headerFocus.outlineWidth}px`,
    );
    assert.ok(
      contrastRatio(headerFocus.outlineColor, headerFocus.backgroundColor) >= 3,
      `header focus must contrast with parchment: ${headerFocus.outlineColor} on ${headerFocus.backgroundColor}`,
    );

    const artworkState = await page
      .locator(".cardImageContainer img")
      .evaluateAll((artwork) =>
        artwork.map((element) => ({
          complete: element.complete,
          naturalHeight: element.naturalHeight,
          naturalWidth: element.naturalWidth,
          objectFit: getComputedStyle(element).objectFit,
        })),
      );
    assert.ok(artworkState.length > 0);
    for (const artwork of artworkState) {
      assert.equal(artwork.complete, true, "poster artwork must finish loading");
      assert.ok(
        artwork.naturalWidth > 0 && artwork.naturalHeight > 0,
        `poster artwork must decode, received ${artwork.naturalWidth}x${artwork.naturalHeight}`,
      );
      assert.equal(artwork.objectFit, "cover");
    }

    const backgroundArtwork = await page
      .locator(".headerLogo.pageTitleWithLogo, .skinHeader")
      .evaluateAll(async (elements) => {
        const urls = elements.flatMap((element) =>
          Array.from(
            getComputedStyle(element).backgroundImage.matchAll(
              /url\(["']?([^"')]+)["']?\)/gu,
            ),
            (match) => match[1],
          ),
        );

        return Promise.all(
          urls.map(
            (url) =>
              new Promise((resolve) => {
                const image = new Image();
                const finish = () => {
                  resolve({
                    naturalHeight: image.naturalHeight,
                    naturalWidth: image.naturalWidth,
                    url,
                  });
                };
                image.addEventListener("load", finish, { once: true });
                image.addEventListener("error", finish, { once: true });
                image.src = url;
              }),
          ),
        );
      });
    assert.ok(
      backgroundArtwork.length >= 2,
      "Harbor mark and parchment texture must be external background artwork",
    );
    for (const artwork of backgroundArtwork) {
      assert.ok(
        artwork.naturalWidth > 0 && artwork.naturalHeight > 0,
        `background artwork must decode: ${artwork.url}`,
      );
    }

    const overlaySelectors = [
      ".favoriteIndicator",
      ".playedIndicator",
      ".countIndicator",
      ".mediaSourceIndicator",
      ".cardMenuButton",
      ".cardPlayButton",
      ".itemProgressBar",
    ];
    for (const selector of overlaySelectors) {
      const overlay = page.locator(selector).first();
      assert.equal(await overlay.count(), 1, `${selector} must remain present`);
      assert.equal(
        await overlay.evaluate((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number.parseFloat(style.opacity) > 0 &&
            bounds.width > 0 &&
            bounds.height > 0
          );
        }),
        true,
        `${selector} must remain visible`,
      );
    }

    const focusedControl = page.locator(".cardPlayButton").first();
    await focusedControl.focus();
    const outlineWidth = await focusedControl.evaluate((control) =>
      Number.parseFloat(getComputedStyle(control).outlineWidth),
    );
    assert.ok(
      outlineWidth >= 2,
      `focused control outline must be at least 2px, received ${outlineWidth}px`,
    );

    if (viewport === mobileViewport) {
      const shownControlSizes = await page
        .locator(productionControlSelector)
        .evaluateAll((controls) =>
          controls
            .filter((control) => {
              const style = getComputedStyle(control);
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                control.getClientRects().length > 0
              );
            })
            .map((control) => {
              const { height, width } = control.getBoundingClientRect();
              return {
                label:
                  control.getAttribute("aria-label") ?? control.textContent?.trim(),
                height,
                width,
              };
            }),
        );

      assert.ok(shownControlSizes.length > 0);
      for (const control of shownControlSizes) {
        assert.ok(
          control.width >= 40 && control.height >= 40,
          `${control.label} must be at least 40x40, received ${control.width}x${control.height}`,
        );
      }
    }

    await assertHarborScreenshot(page, snapshotName);
  } finally {
    await browser.close();
  }
}

test("shared components render on desktop", async () => {
  await assertSharedComponents(desktopViewport, "shared-components-desktop");
});

test("shared components remain accessible on mobile", async () => {
  await assertSharedComponents(mobileViewport, "shared-components-mobile");
});
