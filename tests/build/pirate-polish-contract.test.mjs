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

test("Core imports Harbor header polish and Streaming Services presentation", async () => {
  const index = await readRepositoryFile("src/css/index.css");
  const branding = await readRepositoryFile("src/css/components/branding.css");
  const streaming = await readRepositoryFile("src/css/integrations/streaming-services.css");

  assert.match(index, /@import "\.\/components\/branding\.css";/u);
  assert.match(index, /@import "\.\/integrations\/streaming-services\.css";/u);
  assert.match(branding, /\.skinHeader/u);
  assert.match(branding, /\.headerUserButton/u);
  assert.doesNotMatch(branding, /\.pageTitle(?:WithDefaultLogo|WithLogo)?\s*::(?:before|after)/u);
  assert.doesNotMatch(branding, /content:\s*"[^"]+"/u);
  assert.doesNotMatch(branding, /:not\(\.osdHeader\)|\.osdHeader/u);
  assert.match(streaming, /#homelabStreamingHub/u);
  assert.match(streaming, /\.stream-card/u);
  assert.match(streaming, /\.service-logo/u);
  assert.match(streaming, /\.open-label/u);
  assert.doesNotMatch(streaming, /https?:\/\//u);
});

test("active Jellyfin tabs are explicitly Harbor brass and not inherited red", async () => {
  const navigation = await readRepositoryFile("src/css/components/navigation.css");

  assert.match(navigation, /\.emby-tab-button\.emby-tab-button-active/su);
  assert.match(navigation, /background(?:-color)?:[^;]+!important/u);
  assert.match(navigation, /var\(--harbor-brass-500\)|var\(--harbor-focus\)/u);
  assert.doesNotMatch(navigation, /#e50914|#f10d18|229\s+9\s+20/iu);
});

test("details read as a captain dossier without taking artwork geometry", async () => {
  const details = await readRepositoryFile("src/css/pages/details.css");

  assert.match(details, /assets\/cartography\/(?:flourish|route)\.svg/u);
  assert.match(details, /#itemDetailPage\s+\.itemName/su);
  assert.match(details, /#itemDetailPage\s+\.mediaInfoItem/su);
  assert.match(details, /#itemDetailPage\s+\.overview/su);
  assert.match(details, /outline|box-shadow/u);
  assert.doesNotMatch(details, /\.itemBackdrop\s*\{[^}]*background-image/su);
  assert.doesNotMatch(
    details,
    /\.detailPagePrimaryContent\s*\{[^}]*(?:^|\n)\s*(?:padding|margin|position|height|width)\s*:/msu,
  );
});

test("home hero blending stays cosmetic and plugin geometry stays external", async () => {
  const mapSurface = await readRepositoryFile("src/css/base/map-surface.css");
  const mediaBar = await readRepositoryFile("src/css/integrations/media-bar-enhanced.css");

  assert.match(mapSurface, /body:has\(#slides-container\)\s+\.homeSectionsContainer/su);
  assert.match(mapSurface, /box-shadow:/u);
  assert.match(mediaBar, /#slides-container\s*\{[^}]*box-shadow:/su);
  assert.doesNotMatch(mediaBar, /#slides-container\s*\{[^}]*(?:height|top|left|position|width)\s*:/su);
  assert.doesNotMatch(mediaBar, /\.homeSectionsContainer\s*\{[^}]*(?:top|position|height)\s*:/su);
});
