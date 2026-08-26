import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  try {
    return await readFile(new URL(path, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

test("does not replace Jellyfin card aspect-ratio geometry", async () => {
  const cards = await readRepositoryFile("src/css/components/cards.css");

  const imageBlock = cards.match(/\.cardImageContainer\s*\{([^}]*)\}/su)?.[1] ?? "";
  assert.doesNotMatch(
    imageBlock,
    /aspect-ratio\s*:/u,
    "Jellyfin 10.11.11 owns card ratios through .cardPadder-*; Harbor must not add a second ratio to .cardImageContainer",
  );
  assert.match(
    cards,
    /\.cardScalable\s*\{/u,
    "visual framing belongs on Jellyfin's scalable media box instead of changing image geometry",
  );
});

test("fixtures model Jellyfin 10.11.11 card structure", async () => {
  for (const path of [
    "tests/fixtures/jellyfin/home-without-media-bar.html",
    "tests/fixtures/jellyfin/home-with-media-bar.html",
    "tests/fixtures/jellyfin/library.html",
  ]) {
    const fixture = await readRepositoryFile(path);
    assert.match(fixture, /class="[^"]*\bcardScalable\b/u, `${path}: cardScalable`);
    assert.match(fixture, /class="[^"]*\bcardPadder(?:-portrait|-overflowPortrait|-backdrop|-square)\b/u, `${path}: cardPadder shape`);
    assert.match(fixture, /class="[^"]*\bcardContent\b/u, `${path}: cardContent`);
    assert.match(fixture, /class="[^"]*\bcardImageContainer\b/u, `${path}: cardImageContainer`);
  }
});

test("details styling is rooted in the real Jellyfin 10.11.11 detail page", async () => {
  const details = await readRepositoryFile("src/css/pages/details.css");
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/details.html");

  for (const selector of [
    "#itemDetailPage .itemBackdrop",
    "#itemDetailPage .detailRibbon",
    "#itemDetailPage .detailImageContainer .card",
    "#itemDetailPage .detailPagePrimaryContent",
    "#itemDetailPage .detailPageSecondaryContainer",
    "#itemDetailPage .detailPageContent",
  ]) {
    assert.match(details, new RegExp(selector.replaceAll(".", "\\."), "u"), selector);
  }

  assert.match(fixture, /id="itemDetailPage"/u);
  assert.match(fixture, /class="[^"]*\bitemBackdrop\b/u);
  assert.match(fixture, /class="[^"]*\bdetailRibbon\b/u);
  assert.match(fixture, /class="[^"]*\bdetailImageContainer\b/u);
  assert.match(fixture, /class="[^"]*\bdetailPagePrimaryContent\b/u);
  assert.match(fixture, /class="[^"]*\bdetailPageSecondaryContainer\b/u);
});

test("Media Bar integration targets the plugin's current video backdrop class", async () => {
  const mediaBar = await readRepositoryFile(
    "src/css/integrations/media-bar-enhanced.css",
  );
  const fixture = await readRepositoryFile(
    "tests/fixtures/jellyfin/home-with-media-bar.html",
  );

  assert.match(
    mediaBar,
    /#slides-container[^{}]*\.video-backdrop/u,
    "Media Bar Enhanced uses .video-backdrop for trailer/video backgrounds",
  );
  assert.match(fixture, /class="[^"]*\bvideo-backdrop\b/u);
  assert.match(fixture, /class="[^"]*\bbackdrop-overlay\b/u);
});
