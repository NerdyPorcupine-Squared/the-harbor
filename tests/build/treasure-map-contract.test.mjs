import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(filePath) {
  try {
    return await readFile(new URL(filePath, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

async function listSvgFiles(directory) {
  const absoluteDirectory = new URL(directory, repositoryUrl);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name) === ".svg")
    .map((entry) => `${directory}${entry.name}`)
    .sort();
}

test("approved repository rule uses parchment-dominant browsing while preserving dark media", async () => {
  const rule = await readRepositoryFile(".cursor/rules/harbor.mdc");

  assert.match(rule, /parchment/iu);
  assert.match(rule, /card artwork/iu);
  assert.match(rule, /details/iu);
  assert.match(rule, /player/iu);
  assert.match(rule, /Media Bar Enhanced/u);
});

test("declares semantic cartography tokens and imports them before map composition", async () => {
  const index = await readRepositoryFile("src/css/index.css");
  const cartographyTokens = await readRepositoryFile("src/css/tokens/cartography.css");
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");

  assert.match(index, /@import "\.\/tokens\/cartography\.css";/u);
  assert.match(index, /@import "\.\/base\/map-surface\.css";/u);
  assert.ok(
    index.indexOf('@import "./tokens/cartography.css";') <
      index.indexOf('@import "./base/map-surface.css";'),
  );

  for (const token of [
    "--harbor-map-paper",
    "--harbor-map-ink",
    "--harbor-map-coastline-opacity",
    "--harbor-map-grid-opacity",
    "--harbor-map-route-opacity",
  ]) {
    assert.match(cartographyTokens, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }

  assert.match(mapSurface, /assets\/cartography\/chart-grid\.svg/u);
  assert.match(mapSurface, /assets\/cartography\/coastline\.svg/u);
  assert.match(mapSurface, /assets\/cartography\/route\.svg/u);
});

test("ships only local sanitized decorative cartography assets", async () => {
  const files = await listSvgFiles("assets/cartography/");
  assert.ok(files.length >= 5, "expected original cartography assets");

  for (const file of files) {
    const source = await readRepositoryFile(file);
    assert.match(source, /<svg/u, `${file} must be SVG`);
    assert.doesNotMatch(source, /https?:\/\//iu, `${file} cannot reference remote resources`);
    assert.doesNotMatch(source, /<script|onload=|onclick=|javascript:/iu, `${file} cannot execute script`);
    assert.doesNotMatch(source, /metadata|sodipodi|inkscape|creator|author/iu, `${file} must be sanitized`);
  }
});

test("map surface scopes cartography to browsing and never player or cinematic detail roots", async () => {
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");

  assert.match(mapSurface, /\.homeSectionsContainer/u);
  assert.match(mapSurface, /\.libraryPage:not\(\.itemDetailPage\)/u);
  assert.match(mapSurface, /\.searchPage/u);
  assert.doesNotMatch(mapSurface, /#itemDetailPage\s*[,\{]/u);
  assert.doesNotMatch(mapSurface, /\.videoPlayerContainer\s*[,\{]/u);
  assert.doesNotMatch(mapSurface, /\.osdControls/u);
});

test("framed cards preserve artwork with non-sizing framing and parchment metadata", async () => {
  const cards = await readRepositoryFile("src/css/components/cards.css");

  assert.match(cards, /\.cardScalable\s*\{[^}]*box-shadow:/su);
  assert.doesNotMatch(cards, /\.cardScalable\s*\{[^}]*(?:border|transform|overflow)\s*:/su);
  assert.match(cards, /\.cardText\s*\{[^}]*background-color:\s*var\(--harbor-map-paper\)/su);
  assert.match(cards, /\.cardText\s*\{[^}]*color:\s*var\(--harbor-map-ink\)/su);
  assert.match(cards, /\.cardImageContainer\s*\{/u);
  assert.doesNotMatch(cards, /\.cardImageContainer\s*\{[^}]*(?:background-size|background-position|assets\/cartography)/su);
});

test("release-candidate documentation records real failures without claiming stable validation", async () => {
  const readme = await readRepositoryFile("README.md");
  const changelog = await readRepositoryFile("CHANGELOG.md");
  const compatibility = await readRepositoryFile("docs/compatibility.md");
  const matrix = await readRepositoryFile("docs/testing/core-manual-matrix.md");

  assert.match(readme, /treasure map|parchment-dominant/iu);
  assert.match(readme, /cinematic/iu);
  assert.match(readme, /playback|player/iu);
  assert.match(changelog, /treasure map|cartograph/iu);
  assert.match(compatibility, /Real Jellyfin 10\.11\.11 testing has already disproved/iu);
  assert.match(compatibility, /active recovery evidence, not release validation/iu);
  assert.doesNotMatch(compatibility, /real-server validated/iu);
  assert.match(matrix, /parchment.*map|map.*brows/iu);
  assert.match(matrix, /player.*cartograph|cartograph.*player/iu);
  assert.doesNotMatch(matrix, /\bPass(?:ed)?\b/iu);
});
