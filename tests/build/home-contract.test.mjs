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

test("imports the optional home and Media Bar layers into Core", async () => {
  const indexCss = await readRepositoryFile("src/css/index.css");
  const homeIndex = indexCss.indexOf('@import "./pages/home.css";');
  const mediaBarIndex = indexCss.indexOf(
    '@import "./integrations/media-bar-enhanced.css";',
  );

  assert.ok(homeIndex > 0, "home.css must be imported");
  assert.ok(mediaBarIndex > homeIndex, "Media Bar presentation follows home.css");
});

test("live Jellyfin Home card headings become detached parchment bubbles", async () => {
  const css = await readRepositoryFile("src/css/pages/home.css");

  assert.doesNotMatch(
    css,
    /\.homeSection \.sectionTitle\s*\{[^}]*(?:border:\s*0|background:\s*none|box-shadow:\s*none)/su,
  );

  const detachedBlock =
    css.match(
      /\.homeSectionsContainer\s*>\s*\.verticalSection\s*>\s*\.sectionTitle\.sectionTitle-cards\s*,\s*\.homeSectionsContainer\s*>\s*\.verticalSection\s*>\s*\.sectionTitleContainer-cards\s+\.sectionTitle\.sectionTitle-cards\s*\{([^}]*)\}/su,
    )?.[1] ?? "";

  assert.match(
    css,
    /\.homeSectionsContainer\s*>\s*\.verticalSection\s*>\s*\.sectionTitle\.sectionTitle-cards/u,
    "direct My Media / Continue Watching titles must be targeted",
  );
  assert.match(
    css,
    /\.sectionTitleContainer-cards\s+\.sectionTitle\.sectionTitle-cards/u,
    "nested Next Up / Recently Added titles must be targeted",
  );
  assert.match(detachedBlock, /margin-inline-start:\s*var\(--harbor-space-4\)/u);
  assert.match(detachedBlock, /border-radius:\s*999px/u);
  assert.doesNotMatch(detachedBlock, /(?:position|width|height|transform)\s*:/u);
});

test("keeps Media Bar selectors scoped while leaving plugin geometry untouched", async () => {
  const css = await readRepositoryFile(
    "src/css/integrations/media-bar-enhanced.css",
  );

  for (const family of [
    "backdrop",
    "video-backdrop",
    "backdrop-overlay",
    "logo-title-fallback",
    "play-button",
    "arrow",
    "pause-button",
    "mute-button",
  ]) {
    assert.match(css, new RegExp(`#slides-container[^\\{]*\\.${family}`, "u"));
  }

  assert.doesNotMatch(css, /!important/u);
  assert.doesNotMatch(css, /homeSectionsContainer/u);
  assert.doesNotMatch(css, /#slides-container\s*\{[^}]*(?:position|width|height|inset|overflow|transform)\s*:/su);
  assert.doesNotMatch(css, /\.video-backdrop\s*\{[^}]*(?:position|width|height|inset|transform|object-fit|background-size)\s*:/su);
});

test("Harbor never resizes or reflows Media Bar controls", async () => {
  const css = await readRepositoryFile(
    "src/css/integrations/media-bar-enhanced.css",
  );
  const protectedFamilies = [
    ".play-button",
    ".trailer-button",
    ".detail-button",
    ".favorite-button",
    ".arrow",
    ".pause-button",
    ".mute-button",
    ".dot",
  ];
  const structuralProperty = /^(?:min-|max-)?(?:width|height)$|^(?:padding|margin)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$|^(?:position|top|right|bottom|left|inset|transform|display|gap|box-sizing|border|border-width)$/u;
  const offending = [];

  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const selector = match[1].trim();
    if (!protectedFamilies.some((family) => selector.includes(family))) continue;

    for (const declaration of match[2].split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 0) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      if (structuralProperty.test(property)) {
        offending.push(`${selector}: ${property}`);
      }
    }
  }

  assert.deepEqual(offending, []);
});

test("Harbor does not stack the same hero gradient across both plugin overlay layers", async () => {
  const css = await readRepositoryFile(
    "src/css/integrations/media-bar-enhanced.css",
  );

  assert.doesNotMatch(
    css,
    /#slides-container \.backdrop-overlay\s*,\s*#slides-container \.gradient-overlay\s*\{[^}]*background-image\s*:/su,
  );
  assert.match(
    css,
    /#slides-container \.gradient-overlay\s*\{[^}]*background-image\s*:/su,
  );
});

test("fixtures are local, sanitized, and represent both home modes", async () => {
  const absent = await readRepositoryFile(
    "tests/fixtures/jellyfin/home-without-media-bar.html",
  );
  const present = await readRepositoryFile(
    "tests/fixtures/jellyfin/home-with-media-bar.html",
  );

  assert.doesNotMatch(absent, /id="slides-container"/u);
  assert.match(present, /id="slides-container"/u);
  assert.match(absent, /homeSectionsContainer/u);
  assert.match(present, /homeSectionsContainer/u);

  for (const family of [
    "slide",
    "backdrop-container",
    "backdrop",
    "video-backdrop",
    "backdrop-overlay",
    "logo-container",
    "logo-title-fallback",
    "info-container",
    "genre",
    "plot-container",
    "button-container",
    "arrow",
    "left-arrow",
    "right-arrow",
    "pause-button",
    "mute-button",
    "dots-container",
    "dot",
  ]) {
    assert.match(
      present,
      new RegExp(`class="[^"]*\\b${family}\\b`, "u"),
      `Media Bar fixture must include .${family}`,
    );
  }

  for (const fixture of [absent, present]) {
    assert.doesNotMatch(fixture, /https?:\/\//iu);
    assert.doesNotMatch(fixture, /<(?:img|script|iframe)\b/iu);
    assert.doesNotMatch(fixture, /(?:jellyfin|plex|emby)\.(?:local|test)|@/iu);
    assert.match(fixture, /Beacon Shoal|Lantern|Tide|Cartographer/u);
  }
});

test("visual specs assert real card geometry and plugin-owned Media Bar geometry", async () => {
  const homeSpec = await readRepositoryFile("tests/visual/home.spec.mjs");
  const mediaBarSpec = await readRepositoryFile("tests/visual/media-bar.spec.mjs");
  const runtimeCardSpec = await readRepositoryFile("tests/visual/runtime-cards.spec.mjs");

  assert.match(homeSpec, /scrollWidth/u);
  assert.match(homeSpec, /cardScalable/u);
  assert.match(homeSpec, /cardImageContainer/u);
  assert.doesNotMatch(homeSpec, /toHaveScreenshot/u);

  assert.match(runtimeCardSpec, /backgroundSize/u);
  assert.match(runtimeCardSpec, /backgroundPosition/u);
  assert.match(runtimeCardSpec, /aspectRatio/u);
  assert.match(runtimeCardSpec, /boundingBox/u);

  assert.match(mediaBarSpec, /pluginHeroHeightSvh/u);
  assert.match(mediaBarSpec, /pluginRowTopSvh/u);
  assert.match(mediaBarSpec, /video-backdrop/u);
  assert.match(mediaBarSpec, /toBeEnabled/u);
  assert.match(mediaBarSpec, /toBeFocused/u);
  assert.doesNotMatch(mediaBarSpec, /toHaveScreenshot/u);
});
