import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navigation = await readFile(
  new URL("../../src/css/components/navigation.css", import.meta.url),
  "utf8",
);

test("Jellyfin tab presentation is scoped to the real app header tab container", () => {
  const blockPattern = /([^{}]+)\{/gu;
  const offending = [];

  for (const match of navigation.matchAll(blockPattern)) {
    const prelude = match[1].trim();
    if (!prelude.includes(".emby-tab-button")) continue;

    for (const selector of prelude.split(",")) {
      if (!selector.includes(".emby-tab-button")) continue;
      const normalized = selector.replace(/\s+/gu, " ").trim();
      if (!normalized.includes(".skinHeader") || !normalized.includes(".headerTabs")) {
        offending.push(normalized);
      }
    }
  }

  assert.deepEqual(offending, []);
  assert.match(navigation, /\.skinHeader\s+\.headerTabs[^{]*\.emby-tab-button/u);
});

test("navigation does not hide library tabs by positional data-index", () => {
  assert.doesNotMatch(navigation, /\[data-index\s*=\s*["']?4["']?\][^{]*\{[^}]*display\s*:\s*none/su);
});
