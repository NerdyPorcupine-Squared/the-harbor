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

function declarationBlock(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = css.match(
    new RegExp(`(?:^|\\})\\s*[^{}]*${escapedSelector}[^{}]*\\{([^{}]*)\\}`, "mu"),
  );
  return match?.[1] ?? "";
}

test("declares the public Playwright runner and visual test commands", async () => {
  const packageJson = JSON.parse(await readRepositoryFile("package.json"));
  assert.equal(packageJson.devDependencies?.playwright, "1.62.1");
  assert.equal(packageJson.scripts?.["test:visual"], "playwright test");
  assert.equal(packageJson.scripts?.["test:visual:update"], "playwright test --update-snapshots");
});

test("keeps the sanitized fixture local and representative of Jellyfin components", async () => {
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/shared-components.html");
  const requiredClasses = ["skinHeader", "headerTabs", "emby-tab-button", "mainDrawer", "card", "cardBox", "cardScalable", "cardPadder", "cardContent", "cardImageContainer", "cardOverlayContainer", "itemProgressBar", "itemProgressBarForeground", "button-flat", "button-submit", "emby-input", "emby-select", "emby-checkbox", "actionSheet", "dialog", "toast"];
  for (const className of requiredClasses) assert.match(fixture, new RegExp(`class="[^"]*\\b${className}\\b`, "u"));
  assert.match(fixture, /data-harbor-control/u);
  assert.match(fixture, /data-harbor-focused/u);
  assert.match(fixture, /data-harbor-parchment-control/u);
  assert.match(fixture, /Voyage to Beacon Shoal/u);
  assert.doesNotMatch(fixture, /https?:\/\//iu);
  assert.doesNotMatch(fixture, /(?:jellyfin|plex|emby)\.(?:local|test)|@/iu);
  assert.doesNotMatch(fixture, /<(?:img|video|audio|iframe|script)\b/iu);
});

test("configures deterministic file-backed desktop and mobile visual projects", async () => {
  const config = await readRepositoryFile("playwright.config.mjs");
  const spec = await readRepositoryFile("tests/visual/shared-components.spec.mjs");
  assert.match(config, /name:\s*"desktop"/u);
  assert.match(config, /viewport:\s*\{\s*width:\s*1440,\s*height:\s*900\s*\}/u);
  assert.match(config, /name:\s*"mobile"/u);
  assert.match(config, /viewport:\s*\{\s*width:\s*390,\s*height:\s*844\s*\}/u);
  assert.match(config, /trace:\s*"on-first-retry"/u);
  assert.match(config, /screenshot:\s*"only-on-failure"/u);
  assert.match(config, /snapshotPathTemplate:\s*"\{testDir\}\/snapshots\/\{platform\}\/\{arg\}\{ext\}"/u);
  assert.doesNotMatch(config, /webServer/u);
  assert.match(spec, /pathToFileURL/u);
  assert.match(spec, /scrollWidth/u);
  assert.match(spec, /button:visible, input:visible, select:visible/u);
  assert.match(spec, /outlineWidth/u);
  assert.match(spec, /data-harbor-parchment-control/u);
  assert.match(spec, /cardScalable/u);
  assert.match(spec, /cardImageContainer/u);
  assert.match(spec, /boundingBox/u);
  assert.doesNotMatch(spec, /toHaveScreenshot/u);
  assert.doesNotMatch(spec, /https?:\/\//iu);
});

test("imports every shared component layer into the release entrypoint", async () => {
  const indexCss = await readRepositoryFile("src/css/index.css");
  const imports = ["./components/navigation.css", "./components/cards.css", "./components/progress.css", "./components/buttons.css", "./components/forms.css", "./components/menus.css", "./components/dialogs.css", "./accessibility.css"];
  let previousIndex = -1;
  for (const importPath of imports) {
    const currentIndex = indexCss.indexOf(`@import "${importPath}";`);
    assert.ok(currentIndex > previousIndex, `${importPath} must be imported in order`);
    previousIndex = currentIndex;
  }
});

test("preserves mobile touch targets and visible interaction states", async () => {
  const componentPaths = ["src/css/components/navigation.css", "src/css/components/cards.css", "src/css/components/progress.css", "src/css/components/buttons.css", "src/css/components/forms.css", "src/css/components/menus.css", "src/css/components/dialogs.css"];
  const componentCss = (await Promise.all(componentPaths.map((path) => readRepositoryFile(path)))).join("\n");
  for (const selector of [".emby-tab-button", ".navMenuOption", ".button-flat", ".button-submit", ".emby-input", ".emby-select", ".emby-checkbox", ".actionSheetMenuItem", ".dialog button"]) {
    const block = declarationBlock(componentCss, selector);
    assert.match(block, /min-height:\s*(?:2\.5rem|40px)/u, `${selector} height`);
    assert.match(block, /min-width:\s*(?:2\.5rem|40px|100%)/u, `${selector} width`);
  }
  for (const selector of [".button-flat", ".button-submit", ".emby-input", ".emby-select", ".emby-checkbox"]) {
    for (const state of [":hover", ":active", ":disabled", ":focus-visible"]) assert.match(componentCss, new RegExp(`\\${selector}${state}`, "u"));
  }
});

test("uses non-sizing brass card framing for focus and selection", async () => {
  const cards = await readRepositoryFile("src/css/components/cards.css");
  assert.match(cards, /\.card:focus-within[^}]*\.card\.selected[^{}]*\.cardScalable\s*\{[^}]*box-shadow:/su);
  assert.doesNotMatch(cards, /\.cardScalable\s*\{[^}]*(?:border|transform|overflow)\s*:/su);
  assert.doesNotMatch(cards, /\.card:hover[^{}]*\.cardScalable\s*\{[^}]*transform:/su);
});

test("real action sheets and dialogs own their parchment backgrounds", async () => {
  const menus = await readRepositoryFile("src/css/components/menus.css");
  const dialogs = await readRepositoryFile("src/css/components/dialogs.css");
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/shared-components.html");
  const spec = await readRepositoryFile("tests/visual/shared-components.spec.mjs");
  for (const [selector, css] of [[".actionSheet", menus], [".dialog", dialogs]]) {
    const block = declarationBlock(css, selector);
    assert.match(block, /background-color:\s*var\(--harbor-parchment-100\)/u);
    assert.match(block, /background-image:\s*var\(--harbor-papyrus-image\)/u);
    assert.match(block, /background-repeat:\s*var\(--harbor-papyrus-repeat\)/u);
    assert.match(block, /background-size:\s*var\(--harbor-papyrus-size\)/u);
  }
  assert.doesNotMatch(fixture, /class="[^"]*(?:actionSheet|dialog)[^"]*harbor-parchment-surface/u);
  assert.match(spec, /\.actionSheet, \.dialog, \.sectionTitle, \.mediaInfoItem, \.harbor-metadata-panel/u);
  assert.match(spec, /backgroundColor/u);
  assert.match(spec, /backgroundImage/u);
  assert.match(spec, /fibers\.svg/u);
  assert.match(spec, /mottle\.svg/u);
});

test("keeps parchment ink dark and global focus and motion preferences accessible", async () => {
  const menus = await readRepositoryFile("src/css/components/menus.css");
  const dialogs = await readRepositoryFile("src/css/components/dialogs.css");
  const accessibility = await readRepositoryFile("src/css/accessibility.css");
  assert.match(declarationBlock(menus, ".actionSheet"), /color:\s*var\(--harbor-ink-900\)/u);
  assert.match(declarationBlock(dialogs, ".dialog"), /color:\s*var\(--harbor-ink-900\)/u);
  assert.match(declarationBlock(dialogs, ".toast"), /color:\s*var\(--harbor-parchment-100\)/u);
  assert.match(accessibility, /:focus-visible[^{]*\{[^}]*outline:\s*(?:0\.125rem|2px)/su);
  assert.match(accessibility, /@media\s*\(forced-colors:\s*active\)/u);
  assert.match(accessibility, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.match(accessibility, /transition:\s*none/u);
  assert.match(accessibility, /\.hideForScreenReader\b/u);
  assert.doesNotMatch(accessibility, /display:\s*none[^}]*prefers-reduced-motion/su);
});
