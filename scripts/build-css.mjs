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

async function replaceOutput(sourceUrl, destinationUrl) {
  const retryableCodes = new Set(["EACCES", "EBUSY", "EPERM"]);
  const attempts = process.platform === "win32" ? 50 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await rename(sourceUrl, destinationUrl);
      return;
    } catch (error) {
      if (!retryableCodes.has(error?.code) || attempt === attempts - 1) throw error;
      await new Promise((resolveRetry) => {
        setTimeout(resolveRetry, 10 + attempt * 2);
      });
    }
  }
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

    await replaceOutput(temporaryUrl, outputUrl);
    temporaryFileExists = false;
  } finally {
    if (temporaryFileExists) await rm(temporaryUrl, { force: true });
  }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await buildCss();
}
