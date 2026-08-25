import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { containsImportAtRule } from "./css-syntax.mjs";

const customPropertyDeclarationPattern = /(--[a-z][a-z0-9-]*)\s*:/giu;
const remoteUrlPattern = /url\(\s*["']?(?:https?:)?\/\//giu;
const localImportLinePattern = /^\s*@import\s+(?:url\()?(["'])\.\.?\/[^"']+\.css\1\)?\s*;\s*$/gmu;

function hasBalancedBraces(css) {
  let braceDepth = 0;
  let comment = false;
  let quote = null;

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    const nextCharacter = css[index + 1];

    if (comment) {
      if (character === "*" && nextCharacter === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      comment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "{") {
      braceDepth += 1;
    } else if (character === "}") {
      braceDepth -= 1;
      if (braceDepth < 0) return false;
    }
  }

  return braceDepth === 0;
}

export function checkCssText(css, displayPath, options = {}) {
  const errors = [];

  if (css.includes("\r")) {
    errors.push(`${displayPath}: use LF line endings`);
  }
  if (!css.endsWith("\n")) {
    errors.push(`${displayPath}: add one final newline`);
  }
  if (!options.allowImports && containsImportAtRule(css)) {
    errors.push(`${displayPath}: unresolved @import is not allowed`);
  }

  if (options.allowImports) {
    const withoutLocalImports = css.replace(localImportLinePattern, "");
    localImportLinePattern.lastIndex = 0;
    if (containsImportAtRule(withoutLocalImports)) {
      errors.push(`${displayPath}: only quoted relative .css imports are allowed`);
    }
  }

  for (const match of css.matchAll(customPropertyDeclarationPattern)) {
    if (!match[1].startsWith("--harbor-")) {
      errors.push(`${displayPath}: custom property ${match[1]} must use --harbor-`);
    }
  }

  if (remoteUrlPattern.test(css)) {
    errors.push(`${displayPath}: remote URL values are not allowed`);
  }
  remoteUrlPattern.lastIndex = 0;

  if (!hasBalancedBraces(css)) {
    errors.push(`${displayPath}: unbalanced braces`);
  }

  if (options.format) {
    css.split("\n").forEach((line, index) => {
      if (/\s$/u.test(line)) {
        errors.push(`${displayPath}:${index + 1}: remove trailing whitespace`);
      }
      if (line.includes("\t")) {
        errors.push(`${displayPath}:${index + 1}: use spaces instead of tabs`);
      }
    });
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
  const sourceFiles = await findCssFiles(sourceRoot);
  const checks = [
    ...sourceFiles.map((path) => ({ path, allowImports: true })),
    { path: resolve(repositoryRoot, "theme.css"), allowImports: false },
  ];
  const errors = [];

  for (const check of checks) {
    const css = await readFile(check.path, "utf8");
    const displayPath = check.path.slice(repositoryRoot.length).replaceAll("\\", "/");
    errors.push(
      ...checkCssText(css, displayPath, {
        allowImports: check.allowImports,
        format: process.argv.includes("--format"),
      }),
    );
  }

  if (errors.length > 0) {
    throw new Error(`[Harbor CSS]\n${errors.join("\n")}`);
  }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await run();
}
