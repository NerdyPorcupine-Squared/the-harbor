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

test("approved repository rule uses parchment-dominant browsing while preserving dark media", async () => {
  const rules = await readRepositoryFile(".cursor/rules/harbor.mdc");

  assert.match(rules, /parchment-dominant browsing/u);
  assert.match(rules, /header and drawer navigation structurally dark/u);
  assert.match(rules, /player dark and unobstructed/u);
  assert.doesNotMatch(rules, /content grids, and the application frame dark/u);
});

test("declares semantic cartography tokens and imports them before map composition", async () => {
  const colors = await readRepositoryFile("src/css/tokens/colors.css");
  const cartography = await readRepositoryFile("src/css/tokens/cartography.css");
  const combined = `${colors}\n${cartography}`;

  for (const token of [
    "--harbor-map-paper",
    "--harbor-map-paper-highlight",
    "--harbor-map-paper-edge",
    "--harbor-map-ink",
    "--harbor-map-ink-faded",
    "--harbor-map-stain",
    "--harbor-cinematic-navy",
    "--harbor-map-cartography-image",
    "--harbor-map-cartography-repeat",
    "--harbor-map-cartography-size",
  ]) {
    assert.match(combined, new RegExp(`${token}\\s*:`, "u"), `${token} is required`);
  }

  for (const asset of ["chart-grid", "coastline", "route"]) {
    assert.match(cartography, new RegExp(`assets/cartography/${asset}\\.svg`, "u"));
  }

  const indexCss = await readRepositoryFile("src/css/index.css");
  const parchment = indexCss.indexOf('@import "./tokens/parchment.css";');
  const cartographyImport = indexCss.indexOf('@import "./tokens/cartography.css";');
  const texture = indexCss.indexOf('@import "./base/texture.css";');
  const mapSurface = indexCss.indexOf('@import "./base/map-surface.css";');
  const navigation = indexCss.indexOf('@import "./components/navigation.css";');

  assert.ok(parchment >= 0 && parchment < cartographyImport, "cartography follows parchment");
  assert.ok(texture >= 0 && texture < mapSurface, "map surface follows base texture");
  assert.ok(mapSurface < navigation, "map surface loads before components");
});

test("ships only local sanitized decorative cartography assets", async () => {
  const assets = [
    "anchor.svg",
    "chart-grid.svg",
    "coastline.svg",
    "flourish.svg",
    "route.svg",
    "ship.svg",
  ];
  const readme = await readRepositoryFile("assets/README.md");

  for (const name of assets) {
    const path = `assets/cartography/${name}`;
    const svg = await readRepositoryFile(path);
    assert.match(svg, /<svg\b/u, `${path} exists`);
    assert.doesNotMatch(svg, /<script\b|<image\b|\son[a-z]+\s*=|https?:\/\/|data:|javascript:/iu);
    assert.match(readme, new RegExp(`assets/cartography/${name.replace(".", "\\.")}`, "u"));
  }
});

test("map surface scopes cartography to browsing and never player source", async () => {
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");
  const player = await readRepositoryFile("src/css/pages/player.css");

  for (const selector of [
    ".homeSectionsContainer",
    ".libraryPage",
    ".searchPage",
    ".detailPageContent",
    ".statePage",
  ]) {
    assert.match(mapSurface, new RegExp(selector.replace(".", "\\."), "u"), selector);
  }

  assert.match(mapSurface, /background-color:\s*var\(--harbor-map-paper\)/u);
  assert.match(mapSurface, /var\(--harbor-map-cartography-image\)/u);
  assert.match(mapSurface, /var\(--harbor-papyrus-image\)/u);
  assert.match(mapSurface, /color:\s*var\(--harbor-map-ink\)/u);
  assert.doesNotMatch(mapSurface, /videoPlayerContainer|videoSurface/u);
  assert.doesNotMatch(player, /assets\/cartography|harbor-map-cartography/u);
});

test("framed cards preserve art inside timber and parchment metadata", async () => {
  const cards = await readRepositoryFile("src/css/components/cards.css");

  assert.match(cards, /\.cardBox\s*\{[^}]*background-color:\s*var\(--harbor-timber-900\)/su);
  assert.match(cards, /\.cardText\s*\{[^}]*background-color:\s*var\(--harbor-map-paper\)/su);
  assert.match(cards, /\.cardText\s*\{[^}]*color:\s*var\(--harbor-map-ink\)/su);
  assert.match(cards, /\.cardImageContainer\s*\{/u);
  assert.doesNotMatch(cards, /\.cardImageContainer\s*\{[^}]*assets\/cartography/su);
});

test("release-candidate documentation describes the new hierarchy without claiming stable validation", async () => {
  const readme = await readRepositoryFile("README.md");
  const changelog = await readRepositoryFile("CHANGELOG.md");
  const compatibility = await readRepositoryFile("docs/compatibility.md");
  const matrix = await readRepositoryFile("docs/testing/core-manual-matrix.md");

  assert.match(readme, /treasure map|parchment-dominant/iu);
  assert.match(readme, /cinematic/iu);
  assert.match(readme, /playback|player/iu);
  assert.match(changelog, /treasure map|cartograph/iu);
  assert.match(compatibility, /not yet.*real.*server/isu);
  assert.match(matrix, /parchment.*map|map.*brows/iu);
  assert.match(matrix, /player.*cartograph|cartograph.*player/iu);
  assert.doesNotMatch(matrix, /\bPass(?:ed)?\b/iu);
});
