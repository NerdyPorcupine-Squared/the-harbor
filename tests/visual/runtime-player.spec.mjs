import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixtureUrl = pathToFileURL(
  fileURLToPath(new URL("../fixtures/jf-10.11.11/player/runtime.html", import.meta.url)),
).href;

async function computed(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      objectFit: style.objectFit,
      position: style.position,
    };
  });
}

test("real video OSD page never inherits Harbor browsing parchment", async ({ page }) => {
  await page.goto(fixtureUrl);

  const osdPage = await computed(page, "#videoOsdPage");
  expect(osdPage.backgroundImage).toBe("none");
  expect(osdPage.backgroundColor).not.toBe("rgb(234, 217, 174)");

  const player = await computed(page, ".videoPlayerContainer");
  const video = await computed(page, "video.htmlvideoplayer");
  expect(player.position).toBe("fixed");
  expect(player.backgroundColor).toBe("rgb(0, 0, 0)");
  expect(video.objectFit).toBe("contain");
});
