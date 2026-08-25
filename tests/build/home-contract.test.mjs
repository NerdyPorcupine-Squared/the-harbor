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
  assert.ok(mediaBarIndex > homeIndex, "Media Bar overrides must follow home.css");
});

test("keeps Media Bar selectors scoped and displacement presence-dependent", async () => {
  const css = await readRepositoryFile(
    "src/css/integrations/media-bar-enhanced.css",
  );

  for (const family of [
    "slide",
    "backdrop",
    "video",
    "loading",
    "progress",
    "arrow",
    "pause",
    "mute",
    "dot",
  ]) {
    assert.match(css, new RegExp(`#slides-container[^\\{]*\\.${family}`, "u"));
  }

  assert.match(
    css,
    /body:has\(#slides-container\)\s+\.homeSectionsContainer\s*\{/u,
  );
  assert.doesNotMatch(
    css.replace(
      /body:has\(#slides-container\)\s+\.homeSectionsContainer\s*\{[^}]*\}/gu,
      "",
    ),
    /\.homeSectionsContainer\s*\{[^}]*margin-block-start/gu,
    "hero displacement must never affect the plugin-absent home page",
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
  assert.match(present, /class="[^"]*\bslide\b/u);
  assert.match(present, /class="[^"]*\bbackdrop\b/u);
  assert.match(present, /class="[^"]*\bvideo\b/u);
  assert.match(present, /class="[^"]*\bloading\b/u);
  assert.match(present, /class="[^"]*\bprogress\b/u);
  assert.match(present, /class="[^"]*\barrow\b/u);
  assert.match(present, /class="[^"]*\bpause\b/u);
  assert.match(present, /class="[^"]*\bmute\b/u);
  assert.match(present, /class="[^"]*\bdot\b/u);

  for (const fixture of [absent, present]) {
    assert.doesNotMatch(fixture, /https?:\/\//iu);
    assert.doesNotMatch(fixture, /<(?:img|script|iframe)\b/iu);
    assert.doesNotMatch(fixture, /(?:jellyfin|plex|emby)\.(?:local|test)|@/iu);
    assert.match(fixture, /Beacon Shoal|Lantern|Tide|Cartographer/u);
  }
});

test("visual specs assert layout, interaction, and screenshots", async () => {
  const homeSpec = await readRepositoryFile("tests/visual/home.spec.mjs");
  const mediaBarSpec = await readRepositoryFile("tests/visual/media-bar.spec.mjs");

  assert.match(homeSpec, /scrollWidth/u);
  assert.match(homeSpec, /toBeLessThanOrEqual\(500\)/u);
  assert.match(homeSpec, /toHaveScreenshot/u);

  assert.match(mediaBarSpec, /58/u);
  assert.match(mediaBarSpec, /67/u);
  assert.match(mediaBarSpec, /48/u);
  assert.match(mediaBarSpec, /boundingBox/u);
  assert.match(mediaBarSpec, /toBeEnabled/u);
  assert.match(mediaBarSpec, /toBeFocused/u);
  assert.match(mediaBarSpec, /toHaveScreenshot/u);
});
