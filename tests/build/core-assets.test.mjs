import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const expectedAssets = [
  "assets/logos/harbor-mark.svg",
  "assets/parchment/fibers.svg",
  "assets/icons/compass-rose.svg",
];

test("public SVG assets declare the standalone SVG namespace", async () => {
  const manifest = JSON.parse(
    await readFile(join(repositoryRoot, "publication-manifest.json"), "utf8"),
  );
  const publicSvgAssets = manifest.publicFiles.filter((path) =>
    path.endsWith(".svg"),
  );

  assert.ok(publicSvgAssets.length > 0);
  for (const relativePath of publicSvgAssets) {
    const source = await readFile(join(repositoryRoot, relativePath), "utf8");
    const root = source.match(/^<svg\b[^>]*>/u)?.[0];

    assert.ok(root, `${relativePath} must begin with an SVG root`);
    assert.match(
      root,
      /\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/u,
      `${relativePath} must declare the standalone SVG namespace`,
    );
  }
});

test("Harbor Core assets are original, local, and resolvable", async () => {
  for (const relativePath of expectedAssets) {
    const source = await readFile(join(repositoryRoot, relativePath), "utf8");
    const sourceWithoutNamespace = source.replace(
      'xmlns="http://www.w3.org/2000/svg"',
      "",
    );

    assert.match(source, /^<svg\b/u);
    assert.doesNotMatch(
      sourceWithoutNamespace,
      /<script\b|https?:|javascript:/iu,
    );
    assert.match(source, /<title\b/u);
  }

  const css = await readFile(join(repositoryRoot, "theme.css"), "utf8");
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/gu)) {
    assert.doesNotMatch(match[1], /^(?:https?:|\/\/|data:|javascript:)/iu);
    await access(join(repositoryRoot, match[1]));
  }
});

test("Harbor mark viewBox includes its lower anchor", async () => {
  const source = await readFile(
    join(repositoryRoot, "assets/logos/harbor-mark.svg"),
    "utf8",
  );
  const viewBox = source.match(/\bviewBox="([0-9.\s-]+)"/u);

  assert.ok(viewBox, "Harbor mark must declare a viewBox");

  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox[1]
    .trim()
    .split(/\s+/u)
    .map(Number);

  assert.ok(
    Number.isFinite(viewBoxX) &&
      Number.isFinite(viewBoxY) &&
      Number.isFinite(viewBoxWidth) &&
      Number.isFinite(viewBoxHeight),
    "Harbor mark viewBox must have four numeric values",
  );
  assert.ok(
    viewBoxY + viewBoxHeight >= 180,
    "Harbor mark viewBox must include the anchor through y=180",
  );
});
