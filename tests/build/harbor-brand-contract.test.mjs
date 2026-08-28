import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const FORMER_BRAND = ['Elgan', 'Flix'].join('');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

test('Harbor production and public output contains no former brand string', async () => {
  const files = [...await walk('src/css'), 'theme.css', 'README.md'];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.equal(text.includes(FORMER_BRAND), false, `${file} still contains former branding`);
  }
});
