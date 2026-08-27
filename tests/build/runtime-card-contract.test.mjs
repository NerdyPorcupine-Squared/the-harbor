import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  return readFile(new URL(path, repositoryUrl), "utf8");
}

test("real Jellyfin 10.11.11 portrait fixture preserves runtime card hierarchy and artwork owner", async () => {
  const fixture = await readRepositoryFile(
    "tests/fixtures/jf-10.11.11/cards/portrait.html",
  );

  assert.match(fixture, /overflowPortraitCard/u);
  assert.match(fixture, /cardPadder-overflowPortrait/u);
  assert.match(fixture, /cardImageContainer coveredImage cardContent/u);
  assert.match(
    fixture,
    /style='background-image: url\("\[REDACTED_URL\]"\);'/u,
  );
  assert.ok(
    fixture.indexOf("cardPadder-overflowPortrait") <
      fixture.indexOf("cardImageContainer"),
  );
});

test("real Jellyfin 10.11.11 backdrop fixture preserves runtime card hierarchy and artwork owner", async () => {
  const fixture = await readRepositoryFile(
    "tests/fixtures/jf-10.11.11/cards/backdrop.html",
  );

  assert.match(fixture, /overflowBackdropCard/u);
  assert.match(fixture, /cardPadder-overflowBackdrop/u);
  assert.match(fixture, /class="cardImageContainer cardContent/u);
  assert.match(
    fixture,
    /style='background-image: url\("\[REDACTED_URL\]"\);'/u,
  );
  assert.ok(
    fixture.indexOf("cardPadder-overflowBackdrop") <
      fixture.indexOf("cardImageContainer"),
  );
});

test("captured geometry proves Jellyfin owns ratio and artwork fill", async () => {
  const metadata = JSON.parse(
    await readRepositoryFile(
      "tests/fixtures/jf-10.11.11/metadata/capture.json",
    ),
  );

  assert.equal(metadata.jellyfinVersion, "10.11.11");

  for (const shape of ["portrait", "backdrop"]) {
    const card = metadata.cards[shape];
    assert.equal(
      card.artwork.owner,
      "cardImageContainer inline background-image",
    );
    assert.equal(card.artwork.backgroundSize, "cover");
    assert.equal(card.nativeGeometry.imageWidth, card.nativeGeometry.width);
    assert.equal(
      card.nativeGeometry.imageHeight,
      card.nativeGeometry.padderPaddingBottom,
    );
  }
});
