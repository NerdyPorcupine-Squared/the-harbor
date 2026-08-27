import assert from "node:assert/strict";
import test from "node:test";

import { checkGeometryOwnershipText } from "../../scripts/check-geometry-ownership.mjs";

test("rejects card geometry ownership", () => {
  const unsafe = `.cardPadder-overflowPortrait { padding-bottom: 150%; }\n.cardImageContainer { background-size: cover; }\n.cardScalable { border: 1px solid red; transform: translateY(-2px); }\n`;
  const errors = checkGeometryOwnershipText(unsafe, "unsafe.css");

  assert.equal(errors.length, 4);
  assert.match(errors.join("\n"), /padding-bottom/u);
  assert.match(errors.join("\n"), /background-size/u);
  assert.match(errors.join("\n"), /border/u);
  assert.match(errors.join("\n"), /transform/u);
});

test("allows cosmetic card presentation that does not change native geometry", () => {
  const safe = `.card { color: var(--harbor-map-ink); }\n.cardScalable { border-radius: .5rem; box-shadow: 0 0 0 1px currentColor; }\n.cardImageContainer { background-color: black; }\n`;

  assert.deepEqual(checkGeometryOwnershipText(safe, "safe.css"), []);
});
