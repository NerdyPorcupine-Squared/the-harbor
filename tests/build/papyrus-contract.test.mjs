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

function customPropertyValue(css, property) {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;]*);`, "su"));
  return match?.[1] ?? "";
}

function splitTopLevelLayers(value) {
  const layers = [];
  let depth = 0;
  let current = "";

  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;

    if (character === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }

  if (current.trim() !== "") layers.push(current.trim());
  return layers;
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foregroundHex, backgroundHex) {
  const foreground = relativeLuminance(foregroundHex);
  const background = relativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);

  return (lighter + 0.05) / (darker + 0.05);
}

test("builds the papyrus surface from layered fiber and mottle artwork", async () => {
  const parchmentTokens = await readRepositoryFile("src/css/tokens/parchment.css");
  const papyrusImage = customPropertyValue(parchmentTokens, "--harbor-papyrus-image");

  assert.match(papyrusImage, /url\("\.\/assets\/parchment\/fibers\.svg"\)/u);
  assert.match(papyrusImage, /url\("\.\/assets\/parchment\/mottle\.svg"\)/u);
  assert.ok(
    papyrusImage.split("url(").length - 1 >= 2,
    "the papyrus stack must layer both original parchment textures",
  );
  assert.ok(
    (papyrusImage.match(/gradient\(/gu) ?? []).length >= 2,
    "the papyrus stack must add tonal depth on top of the flat parchment colour",
  );

  const repeat = customPropertyValue(parchmentTokens, "--harbor-papyrus-repeat");
  const size = customPropertyValue(parchmentTokens, "--harbor-papyrus-size");
  const layerCount = splitTopLevelLayers(papyrusImage).length;

  assert.ok(layerCount >= 4, "papyrus needs tonal, mottled, and fibrous layers");
  assert.equal(
    splitTopLevelLayers(repeat).length,
    layerCount,
    "every papyrus layer needs a repeat mode",
  );
  assert.equal(
    splitTopLevelLayers(size).length,
    layerCount,
    "every papyrus layer needs a size",
  );
  assert.match(
    customPropertyValue(parchmentTokens, "--harbor-papyrus-edge"),
    /inset/u,
    "papyrus needs an aged inset edge",
  );
});

test("shares one papyrus recipe across every parchment surface", async () => {
  const surfaces = [
    ["src/css/base/texture.css", ".harbor-parchment-surface"],
    ["src/css/components/menus.css", ".actionSheet"],
    ["src/css/components/dialogs.css", ".dialog"],
    ["src/css/components/headings.css", ".sectionTitle"],
    ["src/css/components/metadata.css", ".mediaInfoItem"],
  ];

  for (const [path, selector] of surfaces) {
    const block = declarationBlock(await readRepositoryFile(path), selector);

    assert.match(
      block,
      /background-color:\s*var\(--harbor-parchment-100\)/u,
      `${selector} parchment base`,
    );
    assert.match(
      block,
      /background-image:\s*var\(--harbor-papyrus-image\)/u,
      `${selector} papyrus layers`,
    );
    assert.match(
      block,
      /background-repeat:\s*var\(--harbor-papyrus-repeat\)/u,
      `${selector} papyrus repeat`,
    );
    assert.match(
      block,
      /background-size:\s*var\(--harbor-papyrus-size\)/u,
      `${selector} papyrus size`,
    );
    assert.match(block, /color:\s*var\(--harbor-ink-900\)/u, `${selector} ink`);
  }
});

test("keeps dark ink legible on the papyrus surface", async () => {
  const colors = await readRepositoryFile("src/css/tokens/colors.css");
  const parchment = customPropertyValue(colors, "--harbor-parchment-100").trim();
  const ink = customPropertyValue(colors, "--harbor-ink-900").trim();

  assert.match(parchment, /^#[0-9a-f]{6}$/iu);
  assert.match(ink, /^#[0-9a-f]{6}$/iu);
  assert.ok(
    contrastRatio(ink, parchment) >= 7,
    `ink on papyrus must reach AAA body contrast, got ${contrastRatio(ink, parchment).toFixed(2)}:1`,
  );
});

test("section headings and metadata chips wrap instead of overflowing narrow screens", async () => {
  const headings = await readRepositoryFile("src/css/components/headings.css");
  const metadata = await readRepositoryFile("src/css/components/metadata.css");

  const sectionTitle = declarationBlock(headings, ".sectionTitle");
  assert.match(sectionTitle, /max-width:\s*100%/u);
  assert.match(sectionTitle, /overflow-wrap:\s*anywhere/u);

  const misc = declarationBlock(metadata, ".itemMiscInfo");
  assert.match(misc, /flex-wrap:\s*wrap/u);
  assert.doesNotMatch(metadata, /white-space:\s*nowrap/u);
});

test("controls inherit dark ink inside every papyrus context", async () => {
  const forms = await readRepositoryFile("src/css/components/forms.css");

  for (const context of [
    ".harbor-parchment-surface",
    ".actionSheet",
    ".dialog",
    ".harbor-metadata-panel",
  ]) {
    assert.ok(
      forms.includes(context),
      `${context} must style the controls it contains with parchment ink`,
    );
  }

  assert.match(
    forms,
    /:where\([^)]*\.harbor-metadata-panel[^)]*\)\s*:where\([^)]*\.emby-input[^)]*\)[^{]*\{[^}]*color:\s*var\(--harbor-ink-900\)/su,
  );
});

test("imports the papyrus token and parchment component layers in order", async () => {
  const indexCss = await readRepositoryFile("src/css/index.css");
  const orderedImports = [
    "./tokens/parchment.css",
    "./base/texture.css",
    "./components/headings.css",
    "./components/metadata.css",
  ];

  let previousIndex = -1;
  for (const importPath of orderedImports) {
    const currentIndex = indexCss.indexOf(`@import "${importPath}";`);
    assert.ok(currentIndex > previousIndex, `${importPath} must be imported in order`);
    previousIndex = currentIndex;
  }
});
