import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const docs = await readFile(new URL('../../docs/testing/runtime-capture.md', import.meta.url), 'utf8');

test('runtime capture docs define the real-server gate and required surface commands', () => {
  for (const marker of [
    'portrait-card',
    'landscape-card',
    'square-card',
    'home-no-media-bar',
    'home-media-bar',
    'movie-details',
    'series-details',
    'paused-player-osd',
    'navigation-header',
    'navigation-drawer',
    'menu-dialog'
  ]) {
    assert.match(docs, new RegExp(marker, 'u'));
  }
  assert.match(docs, /Harbor must be disabled for the vanilla captures/u);
  assert.match(docs, /makes no network requests/u);
  assert.match(docs, /portrait-card JSON/u);
  assert.match(docs, /landscape-card JSON/u);
});
