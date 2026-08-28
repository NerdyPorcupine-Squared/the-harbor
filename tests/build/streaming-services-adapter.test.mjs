import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  try {
    return await readFile(new URL(path, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

test("optional Streaming Services adapter owns only its custom home section", async () => {
  const source = await readRepositoryFile("integrations/streaming-services.js");

  assert.match(source, /homelabStreamingHub/u);
  assert.match(source, /homeSectionsContainer/u);
  assert.match(source, /MutationObserver/u);
  assert.match(source, /data-monitor/u);
  assert.match(source, /videoplayback/u);

  for (const service of ["Netflix", "Prime Video", "Disney+", "HBO Max"]) {
    assert.match(source, new RegExp(service.replace(/[+]/gu, "\\+"), "u"));
  }

  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/iu);
  assert.doesNotMatch(source, /innerHTML\s*=/u);
  assert.doesNotMatch(source, /ElganFlix|homelab-red/iu);
});
