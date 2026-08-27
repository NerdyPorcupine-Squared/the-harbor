import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROTECTED_CARD_SELECTOR = /\.(?:card|cardBox|cardScalable|cardContent|cardImageContainer|cardPadder(?:[\w-]+)?)\b/u;
const FORBIDDEN_CARD_PROPERTIES = new Set([
  "aspect-ratio",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "position",
  "inset",
  "top",
  "right",
  "bottom",
  "left",
  "transform",
  "overflow",
  "overflow-x",
  "overflow-y",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
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

export function checkGeometryOwnershipText(css, displayPath = "<css>") {
  const errors = [];

  for (const { selector, body } of innermostRules(css)) {
    if (!PROTECTED_CARD_SELECTOR.test(selector)) continue;

    for (const property of declarationProperties(body)) {
      if (!FORBIDDEN_CARD_PROPERTIES.has(property)) continue;
      errors.push(
        `${displayPath}: ${selector} must not set Jellyfin-owned card geometry property ${property}`,
      );
    }
  }

  return errors;
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
