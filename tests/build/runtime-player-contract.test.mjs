import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  return readFile(new URL(path, repositoryUrl), "utf8");
}

test("real Jellyfin 10.11.11 player fixture preserves the captured video OSD root", async () => {
  const fixture = await readRepositoryFile("tests/fixtures/jf-10.11.11/player/runtime.html");

  assert.match(fixture, /id="videoOsdPage"/u);
  assert.match(fixture, /class="page libraryPage mainAnimatedPage"/u);
  assert.match(fixture, /data-type="video-osd"/u);
  assert.match(fixture, /class="videoPlayerContainer"/u);
  assert.match(fixture, /class="htmlvideoplayer"/u);
});

test("browsing map surface explicitly excludes Jellyfin video OSD pages", async () => {
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");

  assert.match(
    mapSurface,
    /\.libraryPage[^\n]*:not\(\[data-type=["']video-osd["']\]\)/u,
    "library browsing selector must exclude the real video OSD page",
  );
});

test("player layer does not need a compensating parchment reset", async () => {
  const player = await readRepositoryFile("src/css/pages/player.css");

  assert.doesNotMatch(player, /harbor-map-cartography|harbor-papyrus-image|assets\/cartography/u);
  assert.doesNotMatch(player, /#videoOsdPage\s*\{[^}]*(?:background|padding)\s*:/su);
});
