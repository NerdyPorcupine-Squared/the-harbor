import assert from "node:assert/strict";
import test from "node:test";

import { checkGeometryOwnershipText } from "../../scripts/check-geometry-ownership.mjs";

test("rejects card geometry ownership", () => {
  const unsafe = `.cardPadder-overflowPortrait { padding-bottom: 150%; }\n.cardImageContainer { background-size: cover; }\n.cardScalable { border: 1px solid red; transform: translateY(-2px); }\n`;
  const errors = checkGeometryOwnershipText(unsafe, "unsafe.css");
  const output = errors.join("\n");

  assert.ok(errors.length >= 4);
  assert.match(output, /padding-bottom/u);
  assert.match(output, /background-size/u);
  assert.match(output, /border/u);
  assert.match(output, /transform/u);
});

test("rejects structural ownership on home, details, player, navigation, and Media Bar", () => {
  const unsafe = `
.homeSectionsContainer { padding: 2rem; }
.itemsContainer { display: grid; }
#itemDetailPage .itemBackdrop { position: relative; background-size: cover; }
.videoPlayerContainer { min-height: 100svh; }
.videoOsdBottom { position: absolute; }
.skinHeader { position: relative; }
.headerTabs { display: flex; }
#slides-container { height: 64svh !important; }
#slides-container .video-backdrop { transform: translate(-50%, -50%) !important; }
body:has(#slides-container) .homeSectionsContainer { margin-block-start: -2rem; }
`;
  const errors = checkGeometryOwnershipText(unsafe, "unsafe-core.css");
  const output = errors.join("\n");

  for (const property of [
    "padding",
    "display",
    "position",
    "background-size",
    "min-height",
    "height",
    "transform",
    "margin-block-start",
  ]) {
    assert.match(output, new RegExp(property, "u"), property);
  }
});

test("allows cosmetic presentation without replacing native geometry", () => {
  const safe = `
.card { color: var(--harbor-map-ink); }
.cardScalable { border-radius: .5rem; box-shadow: 0 0 0 1px currentColor; }
.cardImageContainer { background-color: black; }
.homeSectionsContainer { background-color: parchment; color: ink; }
#itemDetailPage { background-color: navy; color: white; }
#itemDetailPage .detailPageSecondaryContainer { background-color: parchment; color: ink; }
.videoPlayerContainer { background-color: black; color: white; }
.skinHeader { background-color: navy; box-shadow: 0 1px 2px black; }
#slides-container { background-color: navy; color: white; }
#slides-container .video-backdrop { background-color: transparent; }
#slides-container .play-button { min-width: 2.5rem; min-height: 2.5rem; }
`;

  assert.deepEqual(checkGeometryOwnershipText(safe, "safe.css"), []);
});
