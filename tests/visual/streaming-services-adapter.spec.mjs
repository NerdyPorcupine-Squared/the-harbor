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
  return page.locator(".homeSectionsContainer > section").evaluateAll((sections) =>
    sections.map((section) => section.id),
  );
}

async function expectRequestedOrder(page) {
  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "my-media-native",
    "resume-native",
    "latest-native",
  ]);
  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);
}

async function prepareNativeHomeSections(page) {
  await page.evaluate(() => {
    const container = document.querySelector(".homeSectionsContainer");
    const resumeSection = container.firstElementChild;
    resumeSection.id = "resume-native";
    resumeSection.classList.add("verticalSection");
    const resumeHeading = resumeSection.querySelector(".sectionTitle");
    resumeHeading.textContent = "Continue Watching";
    const resumeTitleContainer = document.createElement("div");
    resumeTitleContainer.className = "sectionTitleContainer sectionTitleContainer-cards";
    resumeHeading.replaceWith(resumeTitleContainer);
    resumeTitleContainer.append(resumeHeading);
    resumeSection.querySelector(".itemsContainer").dataset.monitor = "videoplayback";

    const myMediaSection = document.createElement("section");
    myMediaSection.id = "my-media-native";
    myMediaSection.className = "homeSection verticalSection";
    myMediaSection.innerHTML = `
      <div class="sectionTitleContainer sectionTitleContainer-cards">
        <h2 class="sectionTitle">My Media</h2>
      </div>
      <div class="itemsContainer">
        <a class="card" href="#movies">Movies</a>
        <a class="card" href="#shows">TV Shows</a>
      </div>
    `;

    const latestSection = document.createElement("section");
    latestSection.id = "latest-native";
    latestSection.className = "homeSection verticalSection";
    latestSection.innerHTML = `
      <div class="sectionTitleContainer sectionTitleContainer-cards">
        <h2 class="sectionTitle padded-left">Latest</h2>
      </div>
      <div class="itemsContainer"></div>
    `;

    container.prepend(myMediaSection);
    container.append(latestSection);
  });
}

test("Streaming Services adapter preserves requested Home hierarchy through rerenders", async ({ page }) => {
  await page.goto(fixtureUrl);
  await prepareNativeHomeSections(page);
  await page.addScriptTag({ content: adapterSource });

  await expectRequestedOrder(page);
  await expect(page.locator("#homelabStreamingHub .stream-card")).toHaveCount(4);

  await page.evaluate(() => {
    const current = document.querySelector(".homeSectionsContainer");
    const myMedia = current.querySelector("#my-media-native").cloneNode(true);
    const resume = current.querySelector("#resume-native").cloneNode(true);
    const latest = current.querySelector("#latest-native").cloneNode(true);
    const replacement = document.createElement("div");
    replacement.className = "homeSectionsContainer";
    replacement.append(myMedia, resume, latest);
    current.replaceWith(replacement);
  });

  await expectRequestedOrder(page);

  await page.evaluate(() => {
    const container = document.querySelector(".homeSectionsContainer");
    const marker = document.createElement("span");
    marker.textContent = "rerender marker";
    container.append(marker);
    marker.remove();
  });

  await expect.poll(async () => page.locator("#homelabStreamingHub").count()).toBe(1);
  await expectRequestedOrder(page);
});

test("Streaming Services cards and native Home headings carry the requested visual weight", async ({ page }, testInfo) => {
  await page.goto(fixtureUrl);
  await prepareNativeHomeSections(page);
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
    const title = page.locator(`#${sectionId} .sectionTitle`);
    const titleBox = await title.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(titleBox.x).toBeGreaterThanOrEqual(16);

    const radius = await title.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    );
    expect(radius).toBeGreaterThanOrEqual(100);
  }
});
