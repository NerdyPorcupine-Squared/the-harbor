import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { containsImportAtRule } from "./css-syntax.mjs";

const localImportPattern = /^\s*@import\s+(?:url\()?(["'])([^"']+)\1\)?\s*;\s*$/gmu;

function harborError(message, cause) {
  return new Error(`[Harbor CSS] ${message}`, cause ? { cause } : undefined);
}

function normalizeFileUrl(value) {
  return value instanceof URL ? value : pathToFileURL(resolve(value));
}

function assertInsideRoot(filePath, rootPath) {
  const relativePath = relative(rootPath, filePath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativePath)
  ) {
    throw harborError(`Import resolves outside the configured source root: ${filePath}`);
  }
}

async function resolveImports(fileUrl, rootPath, activeFiles) {
  if (fileUrl.protocol !== "file:") {
    throw harborError(`Only local CSS imports are allowed: ${fileUrl.href}`);
  }

  const filePath = fileURLToPath(fileUrl);
  assertInsideRoot(filePath, rootPath);

  let canonicalFilePath;

  try {
    canonicalFilePath = await realpath(filePath);
  } catch (error) {
    throw harborError(`Unable to read imported stylesheet ${filePath}`, error);
  }

  assertInsideRoot(canonicalFilePath, rootPath);

  if (activeFiles.includes(canonicalFilePath)) {
    const cycle = [...activeFiles, canonicalFilePath].map((path) =>
      path.split(/[\\/]/u).at(-1),
    );
    throw harborError(`Import cycle detected: ${cycle.join(" -> ")}`);
  }

  let source;

  try {
    source = await readFile(canonicalFilePath, "utf8");
  } catch (error) {
    throw harborError(`Unable to read imported stylesheet ${filePath}`, error);
  }

  const sourceWithoutSupportedImports = source.replace(localImportPattern, "");
  localImportPattern.lastIndex = 0;
  if (containsImportAtRule(sourceWithoutSupportedImports)) {
    throw harborError(`Found unsupported @import syntax in ${filePath}`);
  }

  const nextActiveFiles = [...activeFiles, canonicalFilePath];
  const chunks = [];
  let lastIndex = 0;

  for (const match of source.matchAll(localImportPattern)) {
    chunks.push(source.slice(lastIndex, match.index));

    const importedUrl = new URL(match[2], fileUrl);
    if (importedUrl.protocol !== "file:") {
      throw harborError(`Only local CSS imports are allowed: ${match[2]}`);
    }
    if (!importedUrl.pathname.endsWith(".css")) {
      throw harborError(`Imported files must use the .css extension: ${match[2]}`);
    }

    const importedCss = await resolveImports(importedUrl, rootPath, nextActiveFiles);
    chunks.push(importedCss.trim());
    lastIndex = match.index + match[0].length;
  }

  chunks.push(source.slice(lastIndex));
  return chunks.join("");
}

export async function bundleCss(entryPath, options = {}) {
  const entryUrl = normalizeFileUrl(entryPath);
  const rootUrl = options.rootDir ? normalizeFileUrl(options.rootDir) : new URL("./", entryUrl);

  if (rootUrl.protocol !== "file:") {
    throw harborError(`The configured source root must be local: ${rootUrl.href}`);
  }

  let rootPath;

  try {
    rootPath = await realpath(fileURLToPath(rootUrl));
  } catch (error) {
    throw harborError(`Unable to read configured source root ${rootUrl.href}`, error);
  }

  return resolveImports(entryUrl, rootPath, []);
}
