import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readProfile() {
  try {
    return await readFile('docs/testing/media-bar-v3-validation-profile.md', 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

test('Media Bar V3 recovery profile is deterministic', async () => {
  const profile = await readProfile();
  for (const line of [
    'Media Bar Enhanced version: 3.6.0.0 or newer compatible 3.6.x',
    'Enable Client-Side Settings: OFF',
    'Enable Trailer Backdrops: ON',
    'Start Muted: ON',
    'Full Width Video: ON',
    'Constrain Plot Width: ON',
    'Enable Slide Animations: OFF during diagnosis',
    'Show Slide Progress Bar: OFF during diagnosis',
    'Random Trailer Start Position: OFF',
    'Default Trailer Volume: 10%',
    'Backdrop Video Delay: 2000 ms',
    'Mobile Aspect Ratio / Height: 16:9 Compact Wide',
    'Custom Overlay: OFF',
    'Pagination Dots: ON',
    'Pagination Counter: ON',
  ]) {
    assert.ok(profile.includes(line), `missing profile line: ${line}`);
  }
});

test('Media Bar V3 profile keeps the captured Advanced settings explicit', async () => {
  const profile = await readProfile();
  for (const line of [
    'Shuffle Interval: 15000 ms',
    'Transition Fade Duration: 500 ms',
    'Retry Delay: 500 ms',
    'Loading Check Interval: 100 ms',
    'Swipe Threshold: 50 px',
    'Transition Type: Crossfade',
    'Max Total Items: 10',
    'Max Movies: 10',
    'Max TV Shows: 10',
    'Preload Count: 3',
    'Max Pagination Dots: 10',
    'Plot Length: 220',
  ]) {
    assert.ok(profile.includes(line), `missing captured Advanced line: ${line}`);
  }
});
