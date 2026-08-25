import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeCss } from "./build-css.mjs";
import { bundleCss } from "./css-imports.mjs";
import { containsImportAtRule } from "./css-syntax.mjs";

const repositoryUrl = new URL("../", import.meta.url);
const repositoryPath = fileURLToPath(repositoryUrl);
const textExtensions = new Set([
  ".css",
  ".html",
  ".json",
  ".md",
  ".mdc",
  ".mjs",
  ".svg",
  ".yml",
]);
const privatePathPatterns = [
  /(?:^|\/)\.superpowers(?:\/|$)/u,
  /(?:^|\/)docs\/superpowers(?:\/|$)/u,
  /(?:^|\/)(?:playwright-report|test-results)(?:\/|$)/u,
  /\.(?:env|log)$/iu,
];
const sensitiveTextPatterns = [
  { label: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/u },
  {
    label: "credential assignment",
    pattern:
      /(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password)\s*[:=]\s*["'][^"'\s]{8,}["']/iu,
  },
  { label: "bearer token", pattern: /\bBearer\s+[a-z0-9._~+/=-]{16,}/iu },
  {
    label: "private server address",
    pattern:
      /https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?/iu,
  },
  {
    label: "machine-specific path",
    pattern: /(?:[a-z]:\\Users\\[^\\\r\n]+|\/Users\/[^/\r\n]+|\/home\/[^/\r\n]+)/iu,
  },
];

function extension(path) {
  const match = path.match(/(\.[^./]+)$/u);
  return match?.[1].toLowerCase() ?? "";
}

function candidateFiles() {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryPath, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(`Unable to list publication candidate:\n${result.stderr}`);
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replaceAll("\\", "/"))
    .sort();
}

function assertInsideRepository(path, displayValue) {
  const relativePath = relative(repositoryPath, path);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new Error(`URL escapes repository: ${displayValue}`);
  }
}

async function checkTheme(errors) {
  const themeUrl = new URL("theme.css", repositoryUrl);
  const theme = await readFile(themeUrl, "utf8");
  if (containsImportAtRule(theme)) errors.push("theme.css contains unresolved @import");

  const generated = normalizeCss(
    await bundleCss(new URL("src/css/index.css", repositoryUrl)),
  );
  if (theme !== generated) errors.push("theme.css is not the generated Core artifact");

  const urls = [
    ...theme.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)'"]+))\s*\)/giu),
  ].map((match) => match[1] ?? match[2] ?? match[3]);

  for (const value of urls) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/iu.test(value)) {
      errors.push(`theme.css contains nonlocal URL: ${value}`);
      continue;
    }

    const assetUrl = new URL(value, themeUrl);
    const assetPath = fileURLToPath(assetUrl);
    try {
      assertInsideRepository(assetPath, value);
      if (!(await stat(assetUrl)).isFile()) errors.push(`URL is not a file: ${value}`);
    } catch (error) {
      errors.push(error?.code === "ENOENT" ? `URL does not exist: ${value}` : error.message);
    }
  }
}

async function run() {
  const errors = [];
  const files = candidateFiles();
  const manifest = JSON.parse(
    await readFile(new URL("publication-manifest.json", repositoryUrl), "utf8"),
  );
  const listedFiles = [...(manifest.files ?? [])].sort();

  if (manifest.version !== 1) errors.push("publication manifest version must be 1");
  if (new Set(listedFiles).size !== listedFiles.length) {
    errors.push("publication manifest contains duplicate files");
  }
  if (JSON.stringify(files) !== JSON.stringify(listedFiles)) {
    const unlisted = files.filter((path) => !listedFiles.includes(path));
    const missing = listedFiles.filter((path) => !files.includes(path));
    if (unlisted.length > 0) errors.push(`unlisted files: ${unlisted.join(", ")}`);
    if (missing.length > 0) errors.push(`listed files missing: ${missing.join(", ")}`);
  }

  for (const path of files) {
    if (privatePathPatterns.some((pattern) => pattern.test(path))) {
      errors.push(`private path is not publishable: ${path}`);
      continue;
    }

    if (!textExtensions.has(extension(path)) && !["LICENSE", ".gitattributes", ".gitignore"].includes(path)) {
      continue;
    }

    const text = await readFile(resolve(repositoryPath, path), "utf8");
    for (const check of sensitiveTextPatterns) {
      if (check.pattern.test(text)) errors.push(`${path}: contains ${check.label}`);
    }
  }

  await checkTheme(errors);

  if (errors.length > 0) {
    throw new Error(`[Harbor publication]\n${errors.join("\n")}`);
  }

  process.stdout.write(`Harbor publication candidate: ${files.length} files verified\n`);
}

await run();
