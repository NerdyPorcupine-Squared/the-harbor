import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);
const homeEnhancementsHeader =
  "/*! The Harbor Home Enhancements | streaming-services.js + home-navigation.js */";

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
  assert.match(source, /My Media|my media/u);
  assert.doesNotMatch(source, /data-monitor|videoplayback/iu);

  for (const service of ["Netflix", "Prime Video", "Disney+", "HBO Max"]) {
    assert.match(source, new RegExp(service.replace(/[+]/gu, "\\+"), "u"));
  }

  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/iu);
  assert.doesNotMatch(source, /innerHTML\s*=/u);
  assert.doesNotMatch(source, /ElganFlix|homelab-red/iu);
});

test("Home adapters expose versioned execution state and duplicate-injection guards", async () => {
  const streaming = await readRepositoryFile("integrations/streaming-services.js");
  const navigation = await readRepositoryFile("integrations/home-navigation.js");
  const combined = await readRepositoryFile("integrations/home-enhancements.js");

  assert.match(streaming, /core-v1-rc3/u);
  assert.match(streaming, /data-harbor-streaming-services-adapter/u);
  assert.match(streaming, /__harborStreamingServicesState/u);
  assert.match(streaming, /disconnect\s*\(/u);

  assert.match(navigation, /core-v1-rc3/u);
  assert.match(navigation, /data-harbor-home-navigation-adapter/u);
  assert.match(navigation, /__harborHomeNavigationState/u);
  assert.match(navigation, /disconnect\s*\(/u);

  assert.match(combined, /data-harbor-home-enhancements/u);
  assert.match(combined, /core-v1-rc3/u);
});

test("combined Home enhancements injector is an exact deterministic composition", async () => {
  const streaming = await readRepositoryFile("integrations/streaming-services.js");
  const navigation = await readRepositoryFile("integrations/home-navigation.js");
  const combined = await readRepositoryFile("integrations/home-enhancements.js");
  const expected = `${homeEnhancementsHeader}\n${streaming.trim()}\n\n${navigation.trim()}\n`;

  assert.equal(combined, expected);
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

test("Streaming Services cards have substantial Home-page presence without becoming full-width billboards", async () => {
  const css = await readRepositoryFile("src/css/integrations/streaming-services.css");
  const rowBlock = css.match(/#homelabStreamingHub\s+\.stream-row\s*\{([^}]*)\}/su)?.[1] ?? "";
  const cardBlock = css.match(/#homelabStreamingHub\s+\.stream-card\s*\{([^}]*)\}/su)?.[1] ?? "";
  const logoBlock = css.match(/#homelabStreamingHub\s+\.service-logo\s*\{([^}]*)\}/su)?.[1] ?? "";

  assert.doesNotMatch(rowBlock, /\b1fr\b/u);
  assert.match(
    rowBlock,
    /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(14rem,\s*20rem\)\)/u,
  );
  assert.match(rowBlock, /justify-content:\s*start/u);
  assert.match(cardBlock, /min-height:\s*5\.5rem/u);
  assert.match(cardBlock, /padding:\s*1rem\s+1\.15rem/u);
  assert.match(logoBlock, /font-size:\s*1\.1rem/u);
});

test("README makes one combined Home injector the release-candidate validation path", async () => {
  const readme = await readRepositoryFile("README.md");

  assert.match(readme, /Core remains CSS-only/iu);
  assert.match(readme, /Recommended Home Enhancements injector/iu);
  assert.match(readme, /integrations\/home-enhancements\.js/u);
  assert.match(readme, /one JavaScript Injector entry/iu);
  assert.match(readme, /Do not run the combined injector alongside either standalone adapter/iu);
  assert.match(readme, /data-harbor-streaming-services/u);
  assert.match(readme, /data-harbor-global-nav/u);
});
