import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../../tools/runtime-capture/harbor-capture.js', import.meta.url), 'utf8');

function loadCapture() {
  const context = vm.createContext({ console: { info() {} }, setTimeout() {}, URL, Blob });
  vm.runInContext(source, context, { filename: 'harbor-capture.js' });
  return context.HarborCapture;
}

test('capture helper exposes local-only browser capture API', () => {
  const capture = loadCapture();
  for (const name of ['capture', 'download', 'captureSelector', 'downloadSelector', 'closest']) {
    assert.equal(typeof capture[name], 'function', `${name} is available`);
  }
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/iu);
  assert.match(source, /schemaVersion:\s*SCHEMA_VERSION/u);
  assert.match(source, /jellyfinVersion/u);
  assert.match(source, /devicePixelRatio/u);
  assert.match(source, /mediaBarEnhancedDetected/u);
});

test('capture helper redacts private addresses, URLs, ids, email and CSS artwork URLs', () => {
  const capture = loadCapture();
  const raw = 'http://192.168.1.64:8096/Items/0123456789abcdef0123456789abcdef/Images/Primary?tag=abc user@example.com';
  const url = capture.sanitizeUrl(raw);
  assert.doesNotMatch(url, /192\.168\.1\.64|0123456789abcdef|user@example\.com/u);
  assert.match(url, /REDACTED_URL/u);

  const style = capture.sanitizeStyle('background-image:url("http://10.0.0.64:8096/Items/0123456789abcdef0123456789abcdef/Images/Primary")');
  assert.doesNotMatch(style, /10\.0\.0\.64|0123456789abcdef/u);
  assert.match(style, /url\("\[REDACTED_URL\]"\)/u);

  assert.equal(capture.sanitizeAttribute('data-item-id', '0123456789abcdef0123456789abcdef'), '[REDACTED_ID]');
  assert.equal(capture.sanitizeAttribute('aria-label', 'Play Private Movie Title'), '[REDACTED_TEXT]');
});

test('capture helper preserves structural class information while redacting content', () => {
  const capture = loadCapture();
  assert.equal(capture.sanitizeAttribute('class', 'card cardPadder-portrait'), 'card cardPadder-portrait');
  assert.equal(capture.sanitizeText('Private Movie Title'), '[REDACTED_TEXT]');
  assert.equal(capture.sanitizeAttribute('href', '/web/#/details?id=0123456789abcdef0123456789abcdef'), '[REDACTED_URL]');
});
