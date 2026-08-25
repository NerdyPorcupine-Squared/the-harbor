import { randomUUID } from "node:crypto";
import { open, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleCss } from "./css-imports.mjs";

const repositoryRoot = new URL("../", import.meta.url);
const entryUrl = new URL("src/css/index.css", repositoryRoot);
const outputUrl = new URL("theme.css", repositoryRoot);

export function normalizeCss(css) {
  return `${css.replace(/\r\n?/gu, "\n").trimEnd()}\n`;
}

export async function buildCss() {
  const temporaryUrl = new URL(
    `.theme.css.${process.pid}.${randomUUID()}.tmp`,
    repositoryRoot,
  );
  const bundledCss = await bundleCss(entryUrl);
  const normalizedCss = normalizeCss(bundledCss);
  let temporaryFileExists = false;

  try {
    const temporaryFile = await open(temporaryUrl, "wx");
    temporaryFileExists = true;

    try {
      await temporaryFile.writeFile(normalizedCss, "utf8");
    } finally {
      await temporaryFile.close();
    }

    await rename(temporaryUrl, outputUrl);
    temporaryFileExists = false;
  } finally {
    if (temporaryFileExists) await rm(temporaryUrl, { force: true });
  }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await buildCss();
}
