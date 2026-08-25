import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const fixturesPath = fileURLToPath(new URL("../fixtures/", import.meta.url));
const snapshotsPath = fileURLToPath(new URL("./snapshots/", import.meta.url));
const fixtureNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/u;
const snapshotNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const remoteUrlPattern = /^https?:/iu;

export const desktopViewport = Object.freeze({ width: 1440, height: 900 });
export const mobileViewport = Object.freeze({ width: 390, height: 844 });

function validateName(name, pattern, label) {
  if (typeof name !== "string" || !pattern.test(name)) {
    throw new TypeError(`Invalid Harbor ${label} name: ${String(name)}`);
  }
}

export async function openHarborFixture(name, viewport) {
  validateName(name, fixtureNamePattern, "fixture");
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage();
  const errors = [];

  try {
    await page.setViewportSize(viewport);
    page.on("pageerror", (error) => {
      errors.push(error);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(new Error(`Console error: ${message.text()}`));
      }
    });
    page.on("request", (request) => {
      if (remoteUrlPattern.test(request.url())) {
        errors.push(new Error(`Remote request attempted: ${request.url()}`));
      }
    });
    await page.route(remoteUrlPattern, (route) => route.abort());

    const fixtureUrl = pathToFileURL(join(fixturesPath, name));
    await page.goto(fixtureUrl.href, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images, (image) => {
          if (image.complete) {
            return undefined;
          }
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    });

    return { browser, page, errors };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function assertHarborScreenshot(page, name) {
  validateName(name, snapshotNamePattern, "snapshot");
  await mkdir(snapshotsPath, { recursive: true });

  const snapshotPath = join(snapshotsPath, `${name}.png`);
  const temporaryPath = join(
    snapshotsPath,
    `.${name}.${process.pid}.${randomUUID()}.tmp.png`,
  );

  try {
    await page.screenshot({ path: temporaryPath, fullPage: true });

    if (process.env.HARBOR_UPDATE_SNAPSHOTS === "1") {
      await rename(temporaryPath, snapshotPath);
      return;
    }

    const [actual, expected] = await Promise.all([
      readFile(temporaryPath),
      readFile(snapshotPath),
    ]);
    assert.equal(
      actual.equals(expected),
      true,
      `Harbor screenshot differs from tests/visual/snapshots/${name}.png`,
    );
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
