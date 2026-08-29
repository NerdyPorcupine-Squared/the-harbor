import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);
const navigation = await readFile(
  new URL("../../src/css/components/navigation.css", import.meta.url),
  "utf8",
);

async function readRepositoryFile(path) {
  try {
    return await readFile(new URL(path, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

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

test("optional Harbor global navigation adapter is narrow, idempotent, and fail-closed", async () => {
  const source = await readRepositoryFile("integrations/home-navigation.js");

  assert.match(source, /headerTabs/u);
  assert.match(source, /data-harbor-global-nav/u);
  assert.match(source, /MutationObserver/u);
  assert.match(source, /Movies/u);
  assert.match(source, /TV Shows/u);
  assert.match(source, /Favorites/u);
  assert.match(source, /Home/u);
  assert.match(source, /href/u);
  assert.doesNotMatch(source, /topParentId\s*[:=]\s*["'][a-z0-9-]+/iu);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/iu);
});
