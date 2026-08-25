import assert from "node:assert/strict";
import test from "node:test";

import {
  desktopViewport,
  mobileViewport,
  openHarborFixture,
} from "./helpers.mjs";

test("desktop and mobile fixtures load Harbor without page errors", async () => {
  for (const viewport of [desktopViewport, mobileViewport]) {
    const { browser, page, errors } = await openHarborFixture(
      "home-without-media-bar.html",
      viewport,
    );

    try {
      assert.equal(errors.length, 0);
      assert.equal(
        await page
          .locator("body")
          .evaluate((node) => node.scrollWidth <= innerWidth),
        true,
      );
      assert.equal(
        await page.evaluate(
          () =>
            performance
              .getEntriesByType("resource")
              .filter(({ name }) => /^https?:/u.test(name)).length,
        ),
        0,
      );
    } finally {
      await browser.close();
    }
  }
});
