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
  const index = css.indexOf(`${selector} {`);
  assert.ok(index >= 0, `${selector} declaration block exists`);
  const start = css.indexOf("{", index) + 1;
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

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

test("preserves Harbor-owned mobile touch targets and visible interaction states", async () => {
  const componentPaths = ["src/css/components/navigation.css", "src/css/components/cards.css", "src/css/components/progress.css", "src/css/components/buttons.css", "src/css/components/forms.css", "src/css/components/menus.css", "src/css/components/dialogs.css"];
  const componentCss = (await Promise.all(componentPaths.map((path) => readRepositoryFile(path)))).join("\n");
  for (const selector of [".navMenuOption", ".button-flat", ".button-submit", ".emby-input", ".emby-select", ".emby-checkbox", ".actionSheetMenuItem", ".dialog button"]) {
    const block = declarationBlock(componentCss, selector);
    assert.match(block, /min-height:\s*(?:2\.5rem|40px)/u, `${selector} height`);
    assert.match(block, /min-width:\s*(?:2\.5rem|40px|100%)/u, `${selector} width`);
  }
  for (const selector of [".button-flat", ".button-submit", ".emby-input", ".emby-select", ".emby-checkbox"]) {
    for (const state of [":hover", ":active", ":disabled", ":focus-visible"]) assert.match(componentCss, new RegExp(`\\${selector}${state}`, "u"));
  }
});

test("Jellyfin header tabs retain native dimensions while Harbor paints interaction state", async () => {
  const navigation = await readRepositoryFile("src/css/components/navigation.css");
  const block = declarationBlock(navigation, ".skinHeader .headerTabs .emby-tab-button");

  assert.doesNotMatch(block, /(?:min-|max-)?(?:width|height)\s*:/u);
  assert.match(block, /border-block-end:/u);
  assert.match(navigation, /\.skinHeader \.headerTabs \.emby-tab-button:hover/u);
  assert.match(navigation, /\.skinHeader \.headerTabs \.emby-tab-button:active/u);
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
    assert.match(block, /color:\s*var\(--harbor-ink-900\)/u);
  }
  assert.match(fixture, /class="actionSheet"/u);
  assert.match(fixture, /class="dialog"/u);
  assert.match(spec, /actionSheet/u);
  assert.match(spec, /dialog/u);
});

test("keeps parchment ink dark and global focus and motion preferences accessible", async () => {
  const accessibility = await readRepositoryFile("src/css/accessibility.css");
  const fixture = await readRepositoryFile("tests/fixtures/jellyfin/shared-components.html");
  assert.match(accessibility, /:focus-visible/u);
  assert.match(accessibility, /prefers-reduced-motion/u);
  assert.match(accessibility, /forced-colors/u);
  assert.match(fixture, /focus-probe/u);
});
