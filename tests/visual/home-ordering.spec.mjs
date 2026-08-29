import { fileURLToPath, pathToFileURL } from "node:url";

import { expect, test } from "playwright/test";

const fixturePath = fileURLToPath(
  new URL("../fixtures/jellyfin/home-ordering.html", import.meta.url),
);
const fixtureUrl = pathToFileURL(fixturePath).href;
const adapterPath = fileURLToPath(
  new URL("../../integrations/streaming-services.js", import.meta.url),
);

async function sectionOrder(page) {
  return page.locator(".homeSectionsContainer > .verticalSection").evaluateAll((sections) =>
    sections.map((section) =>
      section.id === "homelabStreamingHub"
        ? "streaming"
        : section.dataset.harborFixtureSection,
    ),
  );
}

async function waitForHarborOrder(page) {
  await expect.poll(() => sectionOrder(page)).toEqual([
    "streaming",
    "my-media",
    "resume",
    "latest",
  ]);
  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);
}

test("Streaming Services, My Media, and Continue Watching use the requested Home hierarchy", async ({ page }) => {
  await page.goto(fixtureUrl);
  await page.addScriptTag({ path: adapterPath });

  await waitForHarborOrder(page);
});

test("Home rerender restores the hierarchy without duplicating the Harbor hub", async ({ page }) => {
  await page.goto(fixtureUrl);
  await page.addScriptTag({ path: adapterPath });
  await waitForHarborOrder(page);

  await page.locator(".homeSectionsContainer").evaluate((container) => {
    container.innerHTML = `
      <section class="verticalSection homeSection" data-harbor-fixture-section="my-media">
        <div class="sectionTitleContainer sectionTitleContainer-cards">
          <h2 class="sectionTitle sectionTitle-cards">My Media</h2>
        </div>
        <div class="itemsContainer">
          <a class="card" href="#movies">Movies</a>
          <a class="card" href="#shows">TV Shows</a>
        </div>
      </section>
      <section class="verticalSection homeSection" data-harbor-fixture-section="resume">
        <div class="sectionTitleContainer sectionTitleContainer-cards">
          <h2 class="sectionTitle sectionTitle-cards">Continue Watching</h2>
        </div>
        <div class="itemsContainer" data-monitor="videoplayback-progress"></div>
      </section>
      <section class="verticalSection homeSection" data-harbor-fixture-section="latest">
        <div class="sectionTitleContainer sectionTitleContainer-cards">
          <h2 class="sectionTitle sectionTitle-cards">Latest</h2>
        </div>
        <div class="itemsContainer"></div>
      </section>
    `;
  });

  await waitForHarborOrder(page);
});
