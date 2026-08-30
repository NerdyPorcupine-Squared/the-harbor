import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-without-media-bar.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;
const adapterSource = await readFile(
  new URL("../../integrations/streaming-services.js", import.meta.url),
  "utf8",
);

async function homeSectionOrder(page) {
  return page
    .locator(
      ".homeSectionsContainer > .verticalSection, .homeSectionsContainer > #homelabStreamingHub",
    )
    .evaluateAll((sections) => sections.map((section) => section.id));
}

async function expectRequestedOrder(page) {
  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "my-media-native",
    "resume-native",
    "next-up-native",
    "latest-native",
  ]);
  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);
}

async function prepareLiveNativeHomeSections(page, { withLegacyHub = false } = {}) {
  await page.evaluate(({ includeLegacyHub }) => {
    const container = document.querySelector(".homeSectionsContainer");
    container.innerHTML = `
      <div id="my-media-native" class="verticalSection section0 emby-scroller-container">
        <h2 class="sectionTitle sectionTitle-cards padded-left">My Media</h2>
        <div class="itemsContainer">
          <a class="card" href="#/movies?topParentId=movies-fixture&collectionType=movies">Movies</a>
          <a class="card" href="#/tv?topParentId=tv-fixture&collectionType=tvshows">TV Shows</a>
        </div>
      </div>
      <div id="resume-native" class="verticalSection section1 emby-scroller-container">
        <h2 class="sectionTitle sectionTitle-cards padded-left">Continue Watching</h2>
        <div class="itemsContainer" data-monitor="videoplayback-progress"></div>
      </div>
      <div id="next-up-native" class="verticalSection section4 emby-scroller-container">
        <div class="sectionTitleContainer sectionTitleContainer-cards padded-left">
          <a class="button-flat button-flat-mini sectionTitleTextButton emby-button" href="#/nextup">
            <h2 class="sectionTitle sectionTitle-cards">Next Up</h2>
          </a>
        </div>
        <div class="itemsContainer"></div>
      </div>
      <div id="latest-native" class="verticalSection section5 emby-scroller-container">
        <div class="sectionTitleContainer sectionTitleContainer-cards padded-left">
          <a class="more button-flat button-flat-mini sectionTitleTextButton emby-button" href="#/movies?topParentId=movies-fixture&collectionType=movies">
            <h2 class="sectionTitle sectionTitle-cards">Recently Added in Movies</h2>
          </a>
        </div>
        <div class="itemsContainer"></div>
      </div>
    `;

    if (!includeLegacyHub) return;

    const legacyHub = document.createElement("section");
    legacyHub.id = "homelabStreamingHub";
    legacyHub.innerHTML = `
      <div class="stream-header">
        <h2 class="sectionTitle sectionTitle-cards stream-title">Streaming Services</h2>
      </div>
      <div class="stream-row">
        <a class="stream-card"><span class="service-logo">Netflix</span></a>
        <a class="stream-card"><span class="service-logo">Prime Video</span></a>
        <a class="stream-card"><span class="service-logo">Disney+</span></a>
        <a class="stream-card"><span class="service-logo">HBO Max</span></a>
      </div>
    `;
    container.insertBefore(legacyHub, container.querySelector("#latest-native"));
  }, { includeLegacyHub: withLegacyHub });
}

test("Streaming Services adapter preserves requested Home hierarchy through live-shaped rerenders", async ({ page }) => {
  await page.goto(fixtureUrl);
  await prepareLiveNativeHomeSections(page);
  await page.addScriptTag({ content: adapterSource });

  await expectRequestedOrder(page);
  await expect(page.locator("#homelabStreamingHub .stream-card")).toHaveCount(4);
  await expect(page.locator("#homelabStreamingHub")).toHaveAttribute(
    "data-harbor-streaming-services",
    "true",
  );

  await page.evaluate(() => {
    const current = document.querySelector(".homeSectionsContainer");
    const replacement = document.createElement("div");
    replacement.className = "sections homeSectionsContainer";
    for (const id of ["my-media-native", "resume-native", "next-up-native", "latest-native"]) {
      replacement.append(current.querySelector(`#${id}`).cloneNode(true));
    }
    current.replaceWith(replacement);
  });

  await expectRequestedOrder(page);
  await expect(page.locator("#homelabStreamingHub")).toHaveAttribute(
    "data-harbor-streaming-services",
    "true",
  );
});

test("Streaming Services adapter preserves native relative order after My Media", async ({ page }) => {
  await page.goto(fixtureUrl);
  await prepareLiveNativeHomeSections(page);

  await page.evaluate(() => {
    const container = document.querySelector(".homeSectionsContainer");
    const resume = container.querySelector("#resume-native");
    const nextUp = container.querySelector("#next-up-native");
    container.insertBefore(nextUp, resume);
  });

  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "my-media-native",
    "next-up-native",
    "resume-native",
    "latest-native",
  ]);

  await page.addScriptTag({ content: adapterSource });

  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "my-media-native",
    "next-up-native",
    "resume-native",
    "latest-native",
  ]);
});

test("Streaming Services adapter replaces legacy hub markup before managing Home order", async ({ page }) => {
  await page.goto(fixtureUrl);
  await prepareLiveNativeHomeSections(page, { withLegacyHub: true });

  await expect(page.locator("#homelabStreamingHub")).not.toHaveAttribute(
    "data-harbor-streaming-services",
    "true",
  );

  await page.addScriptTag({ content: adapterSource });

  await expectRequestedOrder(page);
  await expect(page.locator("#homelabStreamingHub")).toHaveAttribute(
    "data-harbor-streaming-services",
    "true",
  );
  await expect(page.locator("#homelabStreamingHub")).toHaveClass(/harbor-streaming-services/u);
  await expect(page.locator("#homelabStreamingHub .stream-card")).toHaveCount(4);
});

test("Streaming Services cards and live native Home headings carry the requested visual weight", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl);
  await prepareLiveNativeHomeSections(page);
  await page.addScriptTag({ content: adapterSource });
  await expectRequestedOrder(page);

  const streamCard = page.locator("#homelabStreamingHub .stream-card").first();
  const cardBox = await streamCard.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox.height).toBeGreaterThanOrEqual(testInfo.project.name === "mobile" ? 72 : 84);
  if (testInfo.project.name === "desktop") {
    expect(cardBox.width).toBeGreaterThanOrEqual(280);
  }

  const logoFontSize = await streamCard.locator(".service-logo").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(logoFontSize).toBeGreaterThanOrEqual(17);

  for (const sectionId of ["my-media-native", "resume-native"]) {
    const title = page.locator(`#${sectionId} > .sectionTitle`);
    const presentation = await title.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        radius: Number.parseFloat(style.borderTopLeftRadius),
        clipPath: style.clipPath,
      };
    });
    expect(presentation.radius).toBeGreaterThanOrEqual(100);
    expect(presentation.clipPath).toContain("inset(");
    expect(presentation.clipPath).not.toBe("none");
  }

  for (const sectionId of ["next-up-native", "latest-native"]) {
    const button = page.locator(`#${sectionId} .sectionTitleTextButton`);
    const wrapperPresentation = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: Number.parseFloat(style.borderTopWidth),
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(wrapperPresentation.borderWidth).toBe(0);
    expect(wrapperPresentation.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(wrapperPresentation.boxShadow).toBe("none");

    const title = button.locator(".sectionTitle");
    const radius = await title.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    );
    expect(radius).toBeGreaterThanOrEqual(100);
  }
});
