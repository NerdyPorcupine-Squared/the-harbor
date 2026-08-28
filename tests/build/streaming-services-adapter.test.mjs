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

test("Harbor supplies complete responsive layout for its custom Streaming Services section", async () => {
  const css = await readRepositoryFile("src/css/integrations/streaming-services.css");

  assert.match(css, /#homelabStreamingHub\s+\.stream-row\s*\{[^}]*display:\s*grid/su);
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(/u);
  assert.match(css, /#homelabStreamingHub\s+\.stream-card\s*\{[^}]*display:\s*flex/su);
  assert.match(css, /#homelabStreamingHub\s+\.stream-card\s*\{[^}]*min-height:/su);
  assert.match(css, /text-decoration:\s*none/u);
  assert.match(css, /@media\s*\(max-width:/u);
});
