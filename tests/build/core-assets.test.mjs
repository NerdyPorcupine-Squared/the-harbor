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

function assertDeterministicDeepCurrentSvg(source, displayPath) {
  const root = source.match(/^<svg\b[^>]*>/u)?.[0];
  assert.ok(root, `${displayPath} must begin with an SVG root`);
  assert.match(root, /\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/u);
  assert.match(root, /\bviewBox="0 0 900 520"/u);
  assert.match(root, /\brole="img"/u);
  assert.match(root, /\baria-labelledby="title"/u);
  assert.match(
    source,
    /<title id="title">Invented deep current landscape artwork<\/title>/u,
  );

  const elementNames = Array.from(
    source.matchAll(/<(?!\/)([a-z][a-z0-9-]*)\b/gu),
    (match) => match[1],
  );

  assert.deepEqual(
    [...new Set(elementNames)],
    ["svg", "title", "rect"],
    `${displayPath} may use only SVG, title, and rect elements`,
  );
  assert.doesNotMatch(source, /\b(?:filter|opacity|transform)\s*=/iu);

  const rectangleOpenings = Array.from(source.matchAll(/<rect\b[^>]*>/gu));
  const rectangles = Array.from(source.matchAll(/<rect\b([^>]*)\/>/gu));
  assert.equal(
    rectangles.length,
    rectangleOpenings.length,
    `${displayPath} rects must use canonical self-closing form`,
  );
  assert.ok(rectangles.length > 1, `${displayPath} must contain layered artwork`);

  for (const [, attributes] of rectangles) {
    const attributeEntries = Array.from(
      attributes.matchAll(/\s+([a-z][a-z0-9-]*)="([^"]*)"/gu),
    );
    assert.equal(
      attributeEntries.map((entry) => entry[0]).join(""),
      attributes,
      `${displayPath} rect attributes must use canonical double-quoted syntax`,
    );

    const attributeNames = attributeEntries.map((entry) => entry[1]).sort();
    assert.deepEqual(
      attributeNames,
      ["fill", "height", "width", "x", "y"],
      `${displayPath} rects may declare only x, y, width, height, and fill`,
    );

    const values = Object.fromEntries(
      attributeEntries.map((entry) => [entry[1], entry[2]]),
    );
    for (const attribute of ["x", "y"]) {
      assert.match(
        values[attribute],
        /^(?:0|[1-9][0-9]*)$/u,
        `${displayPath} rect ${attribute} must be a nonnegative integer`,
      );
    }
    for (const attribute of ["width", "height"]) {
      assert.match(
        values[attribute],
        /^[1-9][0-9]*$/u,
        `${displayPath} rect ${attribute} must be a positive integer`,
      );
    }
    assert.match(
      values.fill,
      /^#[0-9a-f]{6}$/u,
      `${displayPath} rect fill must be an opaque six-digit hex color`,
    );
  }
}

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

test("deep-current screenshot artwork uses deterministic integer rectangles", async () => {
  const relativePath = "tests/fixtures/artwork-deep-current.svg";
  const source = await readFile(join(repositoryRoot, relativePath), "utf8");

  assertDeterministicDeepCurrentSvg(source, relativePath);
});

test("deep-current deterministic contract rejects rectangle bypasses", async () => {
  const relativePath = "tests/fixtures/artwork-deep-current.svg";
  const source = await readFile(join(repositoryRoot, relativePath), "utf8");
  const mutations = [
    [
      "explicit-closing forbidden attribute",
      source.replace(
        '<rect x="0" y="0" width="900" height="520" fill="#07131c"/>',
        '<rect x="0" y="0" width="900" height="520" fill="#07131c" rx="4"></rect>',
      ),
    ],
    [
      "explicit-closing capture bypass",
      source.replace(
        '<rect x="0" y="0" width="900" height="520" fill="#07131c"/>',
        '<rect x="0" y="0" width="900" height="520" fill="#07131c"></rect>',
      ),
    ],
    [
      "duplicate fill",
      source.replace(
        'fill="#07131c"/>',
        'fill="#07131c" fill="#0c1d29"/>',
      ),
    ],
    [
      "duplicate width",
      source.replace('width="900"', 'width="900" width="901"'),
    ],
    [
      "rounded corners",
      source.replace('fill="#07131c"/>', 'fill="#07131c" rx="4"/>'),
    ],
    [
      "stroke",
      source.replace('fill="#07131c"/>', 'fill="#07131c" stroke="#ffffff"/>'),
    ],
    [
      "style",
      source.replace('fill="#07131c"/>', 'fill="#07131c" style="color:red"/>'),
    ],
    [
      "transform",
      source.replace(
        'fill="#07131c"/>',
        'fill="#07131c" transform="translate(1 0)"/>',
      ),
    ],
    [
      "opacity",
      source.replace('fill="#07131c"/>', 'fill="#07131c" opacity="1"/>'),
    ],
    ["URL fill", source.replace('fill="#07131c"', 'fill="url(#paint)"')],
    ["zero width", source.replace('width="900"', 'width="0"')],
    ["negative position", source.replace('x="0"', 'x="-1"')],
    [
      "extra attribute",
      source.replace('fill="#07131c"/>', 'fill="#07131c" id="ocean"/>'),
    ],
    ["missing fill", source.replace(' fill="#07131c"', "")],
    ["none fill", source.replace('fill="#07131c"', 'fill="none"')],
    ["currentColor", source.replace('fill="#07131c"', 'fill="currentColor"')],
    ["alpha color", source.replace('fill="#07131c"', 'fill="#07131c80"')],
    [
      "CSS variable",
      source.replace('fill="#07131c"', 'fill="var(--harbor-navy-950)"'),
    ],
    ["fill whitespace", source.replace('fill="#07131c"', 'fill=" #07131c"')],
    [
      "event handler",
      source.replace(
        'fill="#07131c"/>',
        'fill="#07131c" onload="alert(1)"/>',
      ),
    ],
  ];

  for (const [label, mutatedSource] of mutations) {
    assert.notEqual(mutatedSource, source, `${label} mutation must change fixture`);
    assert.throws(
      () => assertDeterministicDeepCurrentSvg(mutatedSource, relativePath),
      undefined,
      `${label} must be rejected`,
    );
  }
});
