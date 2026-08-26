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

test("imports library, search, and details page layers", async () => {
  const indexCss = await readRepositoryFile("src/css/index.css");
  const imports = [
    "./pages/library.css",
    "./pages/search.css",
    "./pages/details.css",
  ];

  let previousIndex = indexCss.indexOf('@import "./pages/home.css";');
  for (const importPath of imports) {
    const currentIndex = indexCss.indexOf(`@import "${importPath}";`);
    assert.ok(currentIndex > previousIndex, `${importPath} must be imported in order`);
    previousIndex = currentIndex;
  }
});

test("library fixture covers real Jellyfin scalable cards and control states", async () => {
  const fixture = await readRepositoryFile(
    "tests/fixtures/jellyfin/library.html",
  );

  for (const marker of [
    "cardScalable",
    "cardPadder-portrait",
    "cardPadder-backdrop",
    "cardContent",
    "cardImageContainer",
    "itemProgressBar",
    "selected",
    "disabled",
    "emby-select",
    "emby-checkbox",
  ]) {
    assert.match(fixture, new RegExp(marker, "u"));
  }
});

test("search fixture keeps populated, empty, loading, and error states in order", async () => {
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/search.html");
  const states = [
    'data-search-state="populated"',
    'data-search-state="empty"',
    'data-search-state="loading"',
    'data-search-state="error"',
  ];

  let previousIndex = -1;
  for (const state of states) {
    const currentIndex = fixture.indexOf(state);
    assert.ok(currentIndex > previousIndex, `${state} must remain in fixture order`);
    previousIndex = currentIndex;
  }
  assert.doesNotMatch(fixture, /<(?:script|iframe|img)\b/iu);
});

test("details fixture covers Jellyfin 10.11.11 detail structure", async () => {
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/details.html");

  for (const marker of [
    "itemDetailPage",
    "itemBackdrop",
    "detailPagePrimaryContainer",
    "detailImageContainer",
    "detailRibbon",
    "detailPagePrimaryContent",
    "detailPageSecondaryContainer",
    "detailPageContent",
    "mainDetailButtons",
    "overview",
    "castCollapsible",
    "childrenCollapsible",
  ]) {
    assert.match(fixture, new RegExp(marker, "u"));
  }
  assert.match(fixture, /UnbrokenChartReferenceWithoutAnyNaturalBreakPoints/u);
});

test("content browser coverage includes tablet, zoom, overflow, state, and screenshots", async () => {
  const spec = await readRepositoryFile("tests/visual/content-pages.spec.mjs");

  assert.match(spec, /820/u);
  assert.match(spec, /1180/u);
  assert.match(spec, /200% zoom/u);
  assert.match(spec, /scrollWidth/u);
  assert.match(spec, /data-search-state/u);
  assert.match(spec, /itemDetailPage/u);
  assert.match(spec, /detailPageSecondaryContainer/u);
  assert.match(spec, /toHaveScreenshot/u);
});

test("all content fixtures are sanitized and repository-local", async () => {
  for (const path of [
    "tests/fixtures/jellyfin/library.html",
    "tests/fixtures/jellyfin/search.html",
    "tests/fixtures/jellyfin/details.html",
  ]) {
    const fixture = await readRepositoryFile(path);
    assert.doesNotMatch(fixture, /https?:\/\//iu);
    assert.doesNotMatch(fixture, /(?:jellyfin|plex|emby)\.(?:local|test)|@/iu);
    assert.match(fixture, /Beacon|Lantern|Tide|Cartographer|Harbor/u);
  }
});
