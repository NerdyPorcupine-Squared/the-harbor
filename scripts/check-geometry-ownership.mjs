import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CARD_PROTECTED_CLASSES = new Set([
  "card",
  "cardBox",
  "cardScalable",
  "cardContent",
  "cardImageContainer",
]);

const LAYOUT_PROTECTED_CLASSES = new Set([
  "homeSectionsContainer",
  "homeSection",
  "itemsContainer",
  "scrollSlider",
  "verticalSection",
  "libraryPage",
  "libraryToolbar",
  "libraryGrid",
  "searchPage",
  "searchForm",
  "searchState",
  "searchResults",
  "itemBackdrop",
  "detailPageWrapperContainer",
  "detailPagePrimaryContainer",
  "detailPagePrimaryContent",
  "detailPageSecondaryContainer",
  "detailPageContent",
  "mainDetailButtons",
  "videoPlayerContainer",
  "videoSurface",
  "videoOsdBottom",
  "videoOsdTop",
  "osdControls",
  "skinHeader",
  "headerTabs",
  "mainDrawer",
  "drawerContent",
]);

const MEDIA_LAYOUT_CLASSES = new Set([
  "slide",
  "backdrop-container",
  "backdrop",
  "video-backdrop",
  "backdrop-overlay",
  "gradient-overlay",
  "logo-container",
  "info-container",
  "genre",
  "plot-container",
  "button-container",
]);

const STRUCTURAL_PROPERTIES = new Set([
  "display",
  "position",
  "z-index",
  "inset",
  "inset-inline",
  "inset-block",
  "inset-inline-start",
  "inset-inline-end",
  "inset-block-start",
  "inset-block-end",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "aspect-ratio",
  "transform",
  "overflow",
  "overflow-x",
  "overflow-y",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-inline",
  "padding-block",
  "padding-inline-start",
  "padding-inline-end",
  "padding-block-start",
  "padding-block-end",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-inline",
  "margin-block",
  "margin-inline-start",
  "margin-inline-end",
  "margin-block-start",
  "margin-block-end",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "flex",
  "flex-basis",
  "flex-grow",
  "flex-shrink",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "justify-content",
  "place-items",
  "gap",
]);

const CARD_EXTRA_PROPERTIES = new Set([
  "background",
  "background-image",
  "background-size",
  "background-position",
  "border",
  "border-width",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
]);

const ARTWORK_MECHANIC_PROPERTIES = new Set([
  "background",
  "background-image",
  "background-size",
  "background-position",
]);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//gu, "");
}

function innermostRules(css) {
  const rules = [];
  const source = stripComments(css);
  const pattern = /([^{}]+)\{([^{}]*)\}/gu;

  for (const match of source.matchAll(pattern)) {
    const selector = match[1].trim();
    if (!selector || selector.startsWith("@")) continue;
    rules.push({ selector, body: match[2] });
  }

  return rules;
}

function declarationProperties(body) {
  const properties = [];

  for (const declaration of body.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    if (property) properties.push(property);
  }

  return properties;
}

function classNames(selector) {
  return [...selector.matchAll(/\.([a-z0-9_-]+)/giu)].map((match) => match[1]);
}

function targetsAnyClass(selector, classSet) {
  return classNames(selector).some((className) => classSet.has(className));
}

function targetsPadder(selector) {
  return classNames(selector).some((className) => className === "cardPadder" || className.startsWith("cardPadder-"));
}

function targetsMediaLayout(selector) {
  for (const part of selector.split(",")) {
    const lastRoot = part.lastIndexOf("#slides-container");
    if (lastRoot < 0) continue;

    const afterRoot = part.slice(lastRoot + "#slides-container".length).trim();
    if (!afterRoot) return true;
    if (targetsAnyClass(afterRoot, MEDIA_LAYOUT_CLASSES)) return true;
  }

  return false;
}

function targetsDetailsRoot(selector) {
  return /#itemDetailPage(?:\b|(?=[\s:>+~.#[]))/u.test(selector);
}

function targetsArtworkMechanics(selector) {
  const classes = new Set(classNames(selector));
  return (
    classes.has("cardImageContainer") ||
    classes.has("itemBackdrop") ||
    classes.has("videoSurface") ||
    classes.has("backdrop") ||
    classes.has("video-backdrop")
  );
}

export function checkGeometryOwnershipText(css, displayPath = "<css>") {
  const errors = [];

  for (const { selector, body } of innermostRules(css)) {
    const isCard = targetsAnyClass(selector, CARD_PROTECTED_CLASSES) || targetsPadder(selector);
    const isLayout =
      targetsAnyClass(selector, LAYOUT_PROTECTED_CLASSES) ||
      targetsDetailsRoot(selector) ||
      targetsMediaLayout(selector);
    if (!isCard && !isLayout) continue;

    for (const property of declarationProperties(body)) {
      if (STRUCTURAL_PROPERTIES.has(property)) {
        errors.push(
          `${displayPath}: ${selector} must not set Jellyfin-owned structural property ${property}`,
        );
      }
      if (isCard && CARD_EXTRA_PROPERTIES.has(property)) {
        errors.push(
          `${displayPath}: ${selector} must not set Jellyfin-owned card property ${property}`,
        );
      }
      if (targetsArtworkMechanics(selector) && ARTWORK_MECHANIC_PROPERTIES.has(property)) {
        errors.push(
          `${displayPath}: ${selector} must not replace Jellyfin/plugin artwork mechanics with ${property}`,
        );
      }
    }
  }

  return [...new Set(errors)];
}

async function findCssFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) files.push(...(await findCssFiles(entryPath)));
    if (entry.isFile() && extname(entry.name) === ".css") files.push(entryPath);
  }

  return files.sort();
}

async function run() {
  const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
  const sourceRoot = resolve(repositoryRoot, "src/css");
  const errors = [];

  for (const path of await findCssFiles(sourceRoot)) {
    const css = await readFile(path, "utf8");
    const displayPath = path.slice(repositoryRoot.length).replaceAll("\\", "/");
    errors.push(...checkGeometryOwnershipText(css, displayPath));
  }

  if (errors.length > 0) {
    throw new Error(`[Harbor geometry ownership]\n${errors.join("\n")}`);
  }
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await run();
}
