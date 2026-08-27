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

  assert.doesNotMatch(
    cards,
    /\.cardImageContainer\s*\{[^}]*aspect-ratio\s*:/su,
    "Jellyfin 10.11.11 owns card ratios through .cardPadder-*",
  );
  assert.doesNotMatch(
    cards,
    /\.cardImageContainer\s*\{[^}]*background-size\s*:/su,
    "Jellyfin owns artwork sizing and Harbor must not restate it",
  );
  assert.doesNotMatch(
    cards,
    /\.cardPadder[^,{]*\{[^}]*(?:padding|height|aspect-ratio)\s*:/su,
    "Harbor must not alter Jellyfin's padding-based card ratio owner",
  );
});

test("versioned fixtures preserve captured Jellyfin 10.11.11 card structure", async () => {
  const portrait = await readRepositoryFile(
    "tests/fixtures/jf-10.11.11/cards/portrait.html",
  );
  const backdrop = await readRepositoryFile(
    "tests/fixtures/jf-10.11.11/cards/backdrop.html",
  );

  for (const fixture of [portrait, backdrop]) {
    assert.match(fixture, /class="[^"]*\bcardScalable\b/u);
    assert.match(fixture, /class="[^"]*\bcardPadder\b/u);
    assert.match(fixture, /class="[^"]*\bcardContent\b/u);
    assert.match(fixture, /class="[^"]*\bcardImageContainer\b/u);
    assert.match(fixture, /background-image: url\("\[REDACTED_URL\]"\)/u);
  }

  assert.match(portrait, /cardPadder-overflowPortrait/u);
  assert.match(portrait, /overflowPortraitCard/u);
  assert.match(backdrop, /cardPadder-overflowBackdrop/u);
  assert.match(backdrop, /overflowBackdropCard/u);
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

test("item detail pages are excluded from the broad library map surface", async () => {
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");

  assert.match(mapSurface, /\.libraryPage:not\(\.itemDetailPage\)/u);
  assert.doesNotMatch(
    mapSurface,
    /(?:^|,)\s*\.libraryPage\s*(?:,|\n)/mu,
    "Jellyfin item details also carry .libraryPage and must remain cinematic at the root",
  );
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
