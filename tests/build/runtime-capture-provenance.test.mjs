import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('tools/runtime-capture/harbor-capture.js', 'utf8');

test('runtime capture classifies matched rule ownership without network access', () => {
  assert.match(source, /function classifyStylesheetSource/u);
  assert.match(source, /sourceKind/u);
  assert.match(source, /sourceIndex/u);
  assert.match(source, /sourcePath/u);
  for (const kind of ['harbor', 'media-bar', 'jellyfin', 'unknown']) {
    assert.ok(source.includes(`'${kind}'`), `missing stylesheet source kind ${kind}`);
  }
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/u);
});

test('runtime capture records rule provenance for root and ancestors', () => {
  assert.match(source, /matchedRules:\s*matchedRules\(element\)/u);
  assert.match(source, /matchedRules:\s*matchedRules\(current\)/u);
  assert.match(source, /schemaVersion:\s*SCHEMA_VERSION/u);
  assert.match(source, /const SCHEMA_VERSION = 2;/u);
  assert.match(source, /version:\s*'1\.1\.0'/u);
});

test('stylesheet provenance stores sanitized paths instead of raw URLs or query strings', () => {
  assert.match(source, /function sanitizeStylesheetPath/u);
  assert.match(source, /new URL\(/u);
  assert.doesNotMatch(source, /sourceHref\s*:/u);
});

test('stylesheet provenance descends through CSS imports and attributes rules to the imported sheet', () => {
  assert.match(source, /rule\.styleSheet/u);
  assert.match(source, /walkStyleSheet/u);
  assert.match(source, /classifyStylesheetSource\(sheet\)/u);
  assert.match(source, /sanitizeStylesheetPath\(sheet\.href\)/u);
});
