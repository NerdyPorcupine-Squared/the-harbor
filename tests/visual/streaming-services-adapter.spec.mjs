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

test("Streaming Services adapter survives Home rerenders without duplicates", async ({ page }) => {
  await page.goto(fixtureUrl);

  await page.evaluate(() => {
    const container = document.querySelector(".homeSectionsContainer");
    const resumeSection = container.firstElementChild;
    resumeSection.id = "resume-native";
    resumeSection.classList.add("verticalSection");
    resumeSection.querySelector(".itemsContainer").dataset.monitor = "videoplayback";

    const latestSection = document.createElement("section");
    latestSection.id = "latest-native";
    latestSection.className = "homeSection verticalSection";
    latestSection.innerHTML = '<h2 class="sectionTitle">Latest</h2><div class="itemsContainer"></div>';
    container.prepend(latestSection);
  });

  await page.addScriptTag({ content: adapterSource });

  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "resume-native",
    "latest-native",
  ]);
  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);
  await expect(page.locator("#homelabStreamingHub .stream-card")).toHaveCount(4);

  await page.evaluate(() => {
    const current = document.querySelector(".homeSectionsContainer");
    const latest = current.querySelector("#latest-native").cloneNode(true);
    const resume = current.querySelector("#resume-native").cloneNode(true);
    const replacement = document.createElement("div");
    replacement.className = "homeSectionsContainer";
    replacement.append(latest, resume);
    current.replaceWith(replacement);
  });

  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "resume-native",
    "latest-native",
  ]);
  await expect(page.locator("#homelabStreamingHub")).toHaveCount(1);

  await page.evaluate(() => {
    const container = document.querySelector(".homeSectionsContainer");
    const marker = document.createElement("span");
    marker.textContent = "rerender marker";
    container.append(marker);
    marker.remove();
  });

  await expect.poll(async () => page.locator("#homelabStreamingHub").count()).toBe(1);
  await expect.poll(() => homeSectionOrder(page)).toEqual([
    "homelabStreamingHub",
    "resume-native",
    "latest-native",
  ]);
});
