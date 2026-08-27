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

test("imports auth, dashboard, state, player, and responsive layers", async () => {
  const indexCss = await readRepositoryFile("src/css/index.css");
  const imports = [
    "./pages/auth.css",
    "./pages/dashboard.css",
    "./pages/states.css",
    "./pages/player.css",
    "./responsive.css",
  ];

  let previousIndex = indexCss.indexOf('@import "./pages/details.css";');
  for (const importPath of imports) {
    const currentIndex = indexCss.indexOf(`@import "${importPath}";`);
    assert.ok(currentIndex > previousIndex, `${importPath} must be imported in order`);
    previousIndex = currentIndex;
  }
});

test("fixtures cover required system surfaces with sanitized content", async () => {
  const requirements = new Map([
    ["login.html", ["manualLoginForm", "emby-input", "button-submit"]],
    ["dashboard.html", ["dashboardPage", "dataTable", "emby-select", "alert"]],
    ["states.html", ["errorPage", "loadingState", "alert-error"]],
    ["player.html", ["videoOsdBottom", "osdControls", "slider", "playerButton"]],
  ]);

  for (const [name, markers] of requirements) {
    const fixture = await readRepositoryFile(`tests/fixtures/jellyfin/${name}`);
    for (const marker of markers) assert.match(fixture, new RegExp(marker, "u"));
    assert.doesNotMatch(fixture, /https?:\/\//iu);
    assert.doesNotMatch(fixture, /(?:jellyfin|plex|emby)\.(?:local|test)|@/iu);
    assert.doesNotMatch(fixture, /<(?:script|iframe|img)\b/iu);
  }
});

test("responsive layer limits itself to touch-target safeguards", async () => {
  const css = await readRepositoryFile("src/css/responsive.css");

  assert.match(css, /width <= 599px/u);
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/u);
  assert.match(css, /min-width:\s*2\.5rem/u);
  assert.match(css, /min-height:\s*2\.5rem/u);
  assert.doesNotMatch(css, /libraryPage|searchPage|homeSectionsContainer|itemDetailPage/u);
  assert.doesNotMatch(css, /env\(safe-area-inset-/u);
  assert.doesNotMatch(css, /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/u);
});

test("player presentation preserves controls without replacing OSD geometry", async () => {
  const css = await readRepositoryFile("src/css/pages/player.css");

  assert.doesNotMatch(css, /display:\s*none/u);
  assert.doesNotMatch(css, /pointer-events:\s*none/u);
  assert.doesNotMatch(css, /\.videoPlayerContainer\s*\{[^}]*(?:position|display|min-height|height|width|padding|transform)\s*:/su);
  assert.doesNotMatch(css, /\.videoOsdBottom\s*\{[^}]*(?:position|inset|padding|transform)\s*:/su);
  assert.match(css, /\.playerButton/u);
  assert.match(css, /min-width:\s*2\.5rem/u);
  assert.match(css, /min-height:\s*2\.5rem/u);
  assert.match(css, /\.slider/u);
  assert.match(css, /accent-color/u);
});

test("browser coverage verifies media preferences, zoom, focus, and controls", async () => {
  const spec = await readRepositoryFile("tests/visual/system-pages.spec.mjs");

  for (const marker of [
    "reducedMotion",
    "forcedColors",
    "200% zoom",
    "scrollWidth",
    "toBeFocused",
    "toBeEnabled",
    "toHaveScreenshot",
  ]) {
    assert.match(spec, new RegExp(marker, "u"));
  }
});
