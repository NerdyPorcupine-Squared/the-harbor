# The Harbor Runtime Recovery V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild The Harbor against clean Jellyfin 10.11.11 runtime evidence, retire obsolete injected branding/navigation behavior, move Streaming Services to the top of Home, fix navigation/player/Media Bar/details failures, and make the final theme primarily a single CSS import plus one minimal Streaming Services DOM adapter.

**Architecture:** Jellyfin and Media Bar Enhanced retain structural and media ownership. Harbor owns presentation and narrowly scoped visibility only. Every broken surface is captured after legacy injector cleanup, converted into a real-DOM fixture, driven RED first, then fixed with the smallest scoped production change. JavaScript Injector is reduced to a DOM-only Streaming Services adapter unless the clean runtime proves a second adapter is absolutely required.

**Tech Stack:** Jellyfin Web 10.11.11, Jellyfin Media Player/web shell, Media Bar Enhanced 3.6.x, JavaScript Injector, CSS, vanilla JavaScript, Node.js 20+, Playwright Chromium, GitHub Actions Windows CI.

**Spec:** `docs/superpowers/specs/2026-08-28-runtime-recovery-v3-design.md`

## Global Constraints

- The product name is **The Harbor**. Production/public output must not contain the former brand string.
- Jellyfin owns card, player, navigation, detail-page, home-section, and application-header structural geometry.
- Media Bar Enhanced owns slideshow geometry, video/backdrop playback, pagination mechanics, timing, and plugin state.
- Harbor may not replace protected media `background-image`, video visibility, widths/heights, positions, transforms, overflow, padding, margin, or aspect ratios.
- Runtime evidence outranks synthetic fixtures.
- JavaScript Injector may create Streaming Services DOM only unless a later explicit decision gate approves a second minimal navigation adapter.
- Legacy branding and legacy Media Top Navigation injectors never return.
- No stable tag before Chrome/Edge Jellyfin Web and Jellyfin Media Player pass the same immutable SHA.

---

### Task 1: Establish a clean owner baseline and enforce Harbor naming

**Files:**
- Create: `docs/testing/runtime-recovery-v3-owner-checklist.md`
- Create: `tests/build/harbor-brand-contract.test.mjs`
- Modify: `docs/compatibility.md`

**Interfaces:**
- Consumes: V3 design spec and current live Jellyfin configuration.
- Produces: A clean-runtime checklist and a build gate that prevents legacy branding from returning to production output.

- [ ] **Step 1: Write the RED Harbor naming test**

Create `tests/build/harbor-brand-contract.test.mjs`:

```js
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

test('production and public Harbor output contains no former brand string', async () => {
  const roots = ['src/css', 'theme.css', 'README.md'];
  const files = [];
  for (const root of roots) {
    if (root.endsWith('.css') || root.endsWith('.md')) files.push(root);
    else files.push(...await walk(root));
  }

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.equal(text.includes(FORMER_BRAND), false, `${file} still contains former branding`);
  }
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/harbor-brand-contract.test.mjs
```

Expected: FAIL against the current candidate because legacy branding remains in production CSS/output.

- [ ] **Step 3: Create the owner cleanup checklist**

`docs/testing/runtime-recovery-v3-owner-checklist.md` must require the owner to do this before any V3 runtime capture:

```text
JavaScript Injector:
- Legacy Branding: DISABLED
- Media Top Navigation: DISABLED
- Existing Streaming Services: temporarily ENABLED only until Task 9 replacement is ready

Custom CSS:
- one current Harbor test import only
- no separate branding/navigation CSS appended after the import

Media Bar:
- record installed version
- apply Task 2 deterministic validation profile
- capture Custom Content, Custom Overlay, and Advanced settings before modifying them

Client:
- hard refresh browser
- fully restart Jellyfin Media Player before comparison captures
```

The checklist must explicitly say the clean DOM baseline is invalid if either retired injector is still active.

- [ ] **Step 4: Remove legacy product naming from production/public files**

Replace production wordmark copy with `The Harbor` or `Harbor` as context requires. Do not modify geometry while doing this naming-only cleanup.

- [ ] **Step 5: Run naming and core gates**

```bash
node --test tests/build/harbor-brand-contract.test.mjs
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/testing/runtime-recovery-v3-owner-checklist.md docs/compatibility.md tests/build/harbor-brand-contract.test.mjs src/css theme.css README.md
git commit -m "chore: establish clean Harbor runtime baseline"
```

---

### Task 2: Lock Media Bar Enhanced to a deterministic Harbor validation profile

**Files:**
- Create: `docs/testing/media-bar-v3-validation-profile.md`
- Create: `tests/build/media-bar-v3-profile.test.mjs`
- Modify: `docs/testing/runtime-recovery-v3-owner-checklist.md`

**Interfaces:**
- Consumes: Owner screenshots of current Media Bar settings.
- Produces: One exact Media Bar configuration used for all capture/fix cycles until Media Bar passes on both clients.

- [ ] **Step 1: Write the RED profile test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile('docs/testing/media-bar-v3-validation-profile.md', 'utf8');

const required = [
  'Client-Side Settings: OFF',
  'Trailer Backdrops: ON',
  'Start Muted: ON',
  'Full Width Video: ON',
  'Constrain Plot Width: ON',
  'Random Trailer Start Position: OFF',
  'Slide Animations: OFF during diagnosis',
  'Show Slide Progress Bar: OFF during diagnosis',
  'Sync Page Backdrop: OFF',
  'Default Trailer Volume: 10%',
  'Backdrop Video Delay: 2000 ms',
  'Mobile Aspect Ratio / Height: 16:9 Compact Wide',
  'SponsorBlock Preview: OFF',
];

test('Media Bar V3 profile is deterministic', () => {
  for (const line of required) assert.ok(profile.includes(line), `missing ${line}`);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/media-bar-v3-profile.test.mjs
```

Expected: FAIL because the profile does not exist.

- [ ] **Step 3: Write the exact profile**

Document:

```text
Media Bar Enhanced: ON
Client-Side Settings: OFF
Trailer Backdrops: ON
Show Trailer Button: ON
Start Muted: ON
Full Width Video: ON
Constrain Plot Width: ON
Randomize Backdrop Video: OFF
Randomize Local Trailer: OFF
Random Trailer Start Position: OFF
Wait For Trailer To End: OFF
Enable Trailer On Mobile: OFF
Hide Arrows on Mobile: ON
Always Show Arrow Navigation: OFF
Enable Keyboard Controls: ON
Slide Animations: OFF during diagnosis
Show Slide Progress Bar: OFF during diagnosis
Sync Page Backdrop: OFF
Yo-Yo Progress Bar Animation: OFF
Default Trailer Volume: 10%
Backdrop Video Delay: 2000 ms
Trailer Start Offset: 0 ms
Trailer End Offset: 0 ms
Mobile Aspect Ratio / Height: 16:9 Compact Wide
SponsorBlock Intro: ON
SponsorBlock Outro: ON
SponsorBlock Preview: OFF
```

Also require:

```text
- record installed Media Bar version before capture
- do not upgrade/downgrade Media Bar during one capture/fix cycle
- capture Custom Content, Custom Overlay, and Advanced settings before changing them
- final Harbor profile prefers Custom Overlay empty/disabled
```

- [ ] **Step 4: Owner applies the profile and restarts both clients**

No code change occurs in this step. The executor records the exact Media Bar version and confirms client-side settings are disabled before Task 3 captures.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/build/media-bar-v3-profile.test.mjs
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/testing/media-bar-v3-validation-profile.md docs/testing/runtime-recovery-v3-owner-checklist.md tests/build/media-bar-v3-profile.test.mjs
git commit -m "docs: lock Harbor Media Bar validation profile"
```

---

### Task 3: Upgrade runtime capture provenance and collect the clean V3 surface set

**Files:**
- Modify: `tools/runtime-capture/harbor-capture.js`
- Modify: `docs/testing/runtime-capture.md`
- Create: `tests/build/runtime-capture-v3.test.mjs`
- Create after capture: `tests/fixtures/jf-10.11.11/runtime-captures-v3/**/*.json`
- Create after capture: `tests/fixtures/jf-10.11.11/contracts/runtime-selector-map.json`

**Interfaces:**
- Consumes: Clean owner baseline from Tasks 1-2.
- Produces: Sanitized DOM/computed-style captures and one selector map used by later tasks.

- [ ] **Step 1: Write RED provenance/selector-map tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('tools/runtime-capture/harbor-capture.js', 'utf8');

test('V3 capture records stylesheet provenance and stable selector candidates', () => {
  assert.match(source, /classifyStylesheetSource/u);
  assert.match(source, /sourceKind/u);
  assert.match(source, /stableSelectorCandidates/u);
  assert.match(source, /jellyfin|harbor|media-bar|unknown/u);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/runtime-capture-v3.test.mjs
```

Expected: FAIL until the capture helper exposes both provenance and stable selector candidates.

- [ ] **Step 3: Add local-only stylesheet provenance**

Implement:

```js
function classifyStylesheetSource(href = '', ownerText = '') {
  const value = `${href} ${ownerText}`.toLowerCase();
  if (value.includes('the-harbor') || value.includes('/harbor')) return 'harbor';
  if (value.includes('media-bar') || value.includes('mediabarenhanced')) return 'media-bar';
  if (!href || value.includes('/web/') || value.includes('jellyfin')) return 'jellyfin';
  return 'unknown';
}
```

Only sanitized stylesheet path/origin information may be stored. Never store cookies, storage values, auth headers, media query tokens, private hosts, item/session/server IDs, or raw image/video URLs.

- [ ] **Step 4: Add stable selector candidate extraction**

For each selected target, capture candidates in this order without inventing selectors:

```text
1. unique id, if non-sensitive
2. exact stable class combination
3. stable href route with sensitive/query content stripped
4. role + aria-current / aria-selected state
5. nearest verified parent selector + child selector
```

Store candidates only in the sanitized JSON. The helper must not mutate the page.

- [ ] **Step 5: Run capture-helper tests GREEN**

```bash
node --test tests/build/runtime-capture-v3.test.mjs tests/build/runtime-capture-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Capture the exact clean V3 surface set**

Required labels:

```text
home-clean-header
home-streaming-first
home-continue-watching
movies-clean-header
tvshows-clean-header
tvshows-networks-tab
navigation-active-movies
navigation-active-tvshows
home-media-bar
home-media-bar-static
home-media-bar-playing
home-media-bar-seam
home-media-bar-controls
player-page-root
player-video-container
player-osd-header
player-osd-bottom
movie-details-full
series-details-full
home-streaming-services-current
```

The owner manually opens every JSON before sharing/commit to confirm sanitization.

- [ ] **Step 7: Build `runtime-selector-map.json` from the sanitized captures**

The map must use these exact keys:

```json
{
  "globalHome": [],
  "globalFavorites": [],
  "globalMovies": [],
  "globalTvShows": [],
  "tvShowsLocalTabs": [],
  "tvNetworksTab": [],
  "homeSectionsContainer": [],
  "continueWatchingSection": [],
  "playerRoots": [],
  "mediaBarRoot": [],
  "detailsRoots": []
}
```

Each value is an ordered array of selector candidates copied from sanitized runtime output. No value may be guessed.

- [ ] **Step 8: Extend privacy/publication tests for the V3 capture directory**

Reject private IPv4s, localhost URLs, email-like strings, raw media URLs, user/item/session/server IDs, and query strings containing tokens.

- [ ] **Step 9: Commit tooling separately from captured evidence**

```bash
git add tools/runtime-capture/harbor-capture.js docs/testing/runtime-capture.md tests/build/runtime-capture-v3.test.mjs
git commit -m "test: add Harbor V3 runtime provenance"

git add tests/fixtures/jf-10.11.11/runtime-captures-v3 tests/fixtures/jf-10.11.11/contracts tests/build
git commit -m "test: add clean Jellyfin V3 runtime evidence"
```

---

### Task 4: Convert clean captures into real-DOM fixtures and RED contracts

**Files:**
- Create: `tests/fixtures/jf-10.11.11/player/real-v3-player.html`
- Create: `tests/fixtures/jf-10.11.11/media-bar/real-v3-home.html`
- Create: `tests/fixtures/jf-10.11.11/navigation/real-v3-home.html`
- Create: `tests/fixtures/jf-10.11.11/navigation/real-v3-tvshows.html`
- Create: `tests/fixtures/jf-10.11.11/details/real-v3-movie.html`
- Create: `tests/fixtures/jf-10.11.11/details/real-v3-series.html`
- Create: `tests/fixtures/jf-10.11.11/home/real-v3-home.html`
- Create: `tests/visual/runtime-v3-player.spec.mjs`
- Create: `tests/visual/runtime-v3-navigation.spec.mjs`
- Create: `tests/visual/runtime-v3-media-bar.spec.mjs`
- Create: `tests/visual/runtime-v3-details.spec.mjs`
- Create: `tests/visual/runtime-v3-home.spec.mjs`
- Modify: `tests/visual/treasure-map.spec.mjs`

**Interfaces:**
- Consumes: Task 3 sanitized captures and selector map.
- Produces: RED regression contracts matching the exact failure classes seen on the live server.

- [ ] **Step 1: Build fixtures by copying sanitized hierarchy only**

Preserve real classes, parent order, attributes, and relevant inline styles. Do not introduce test-only wrapper classes that production CSS can target.

- [ ] **Step 2: Write RED player isolation contract**

Assert on the captured player fixture:

```js
expect(playerBackgroundImage).not.toMatch(/cartography|parchment/u);
expect(osdAfterContent).not.toMatch(/Harbor/u);
expect(videoVisibility).not.toBe('hidden');
expect(videoOpacity).not.toBe('0');
```

Run:

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs --project=desktop
```

Expected: FAIL against the current candidate.

- [ ] **Step 3: Write RED navigation contracts**

The test reads `runtime-selector-map.json` and asserts:

```text
- no selected global/local nav color resolves to rgb(229, 9, 20)
- inactive global items use one consistent treatment
- global Movies/TV Shows are visually separated from left Home/Favorites when native structure permits
- TV Networks is not displayed in the TV Shows local row
- only one local selected state exists
```

- [ ] **Step 4: Write RED home-order contracts**

Assert DOM order:

```text
Streaming Services index < Continue Watching index
```

and assert Continue Watching heading has nonzero left/right visual inset without modifying the native rail's scroll geometry.

- [ ] **Step 5: Write RED Media Bar contracts**

Assert:

```text
- backdrop/video elements remain visible
- Harbor does not force plugin dot width/height/min-width/min-height
- Harbor does not replace plugin media background-image
- hero controls remain within captured plugin-owned geometry
```

- [ ] **Step 6: Write RED details contracts**

Assert backdrop visibility, readable primary actions, and contrast for Next Up/Seasons/secondary headings.

- [ ] **Step 7: Rename inaccurate synthetic test claims**

Any old test wording that says Harbor behavior is universally true must be narrowed to `captured Jellyfin 10.11.11 fixture` language. Assertions stay strict.

- [ ] **Step 8: Commit the RED fixture layer without production fixes**

```bash
git add tests/fixtures/jf-10.11.11 tests/visual
git commit -m "test: reproduce Harbor V3 live-runtime failures"
```

---

### Task 5: Fix P0 player isolation first

**Files:**
- Modify: `src/css/base/map-surface.css`
- Modify: `src/css/base/texture.css` only if provenance proves it owns leakage
- Modify: `src/css/components/branding.css`
- Modify: `src/css/pages/player.css`
- Test: `tests/visual/runtime-v3-player.spec.mjs`

**Interfaces:**
- Consumes: Real V3 player fixture and selector map.
- Produces: Playback that cannot receive browsing parchment/cartography or Harbor browsing branding.

- [ ] **Step 1: Re-run the focused RED player test**

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs --project=desktop
```

Expected: FAIL for the captured leakage.

- [ ] **Step 2: Narrow the originating browsing selectors**

Fix leakage at its source. Use verified player-root exclusions derived from `runtime-selector-map.json`. Do not create a broad `player { background: ... !important; }` reset layer.

- [ ] **Step 3: Scope Harbor wordmark to confirmed browsing header context**

The wordmark must say `The Harbor` and must not match OSD header/title roots. Use parent/page-state scoping proved by the capture.

- [ ] **Step 4: Keep `player.css` cosmetic-only**

Allowed: native-control color/focus treatment.

Forbidden: video visibility, media background replacement, OSD position/dimensions, page background cartography.

- [ ] **Step 5: Run focused desktop/mobile player tests**

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs tests/visual/system-pages.spec.mjs
npm run lint:geometry
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Real-server player gate**

Chrome/Edge and Jellyfin Media Player must both pass:

```text
playing: video visible, dark native player, no parchment/cartography, no browsing wordmark
paused: OSD visible, controls intact, no parchment/cartography, no browsing wordmark
```

Stop if clients disagree.

- [ ] **Step 7: Commit**

```bash
git add src/css/base src/css/components/branding.css src/css/pages/player.css tests/visual/runtime-v3-player.spec.mjs
git commit -m "fix: isolate Harbor browsing from playback"
```

---

### Task 6: Rebuild navigation and home ordering without the legacy navigation injector

**Files:**
- Modify: `src/css/components/navigation.css`
- Modify: `src/css/pages/home.css`
- Modify: `src/css/integrations/streaming-services.css`
- Test: `tests/visual/runtime-v3-navigation.spec.mjs`
- Test: `tests/visual/runtime-v3-home.spec.mjs`
- Test: `tests/build/harbor-brand-contract.test.mjs`

**Interfaces:**
- Consumes: Clean native navigation fixture and selector map.
- Produces: Consistent Harbor navigation, right-side Movies/TV Shows when native DOM supports it, hidden TV Networks, Streaming Services before Continue Watching, and isolated Continue Watching heading treatment.

- [ ] **Step 1: Run navigation/home RED tests**

```bash
npx playwright test tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs --project=desktop
```

Expected: FAIL for red selected states, section order, heading attachment, and TV Networks visibility.

- [ ] **Step 2: Remove red/yellow legacy interaction assumptions**

All global/local inactive navigation receives one subdued neutral/parchment treatment. Selected global and local states use related Harbor navy/brass/parchment treatments with distinct weight.

Do not use the former red accent for selected navigation.

- [ ] **Step 3: Position native Movies/TV Shows on the right only if the captured DOM supports safe CSS grouping**

Use the selector map to determine whether the native header group is a flex container containing the four global items.

If yes, implement grouping using cosmetic ordering/alignment only on the verified global header container. Do not duplicate nodes.

If no native Movies/TV Shows elements exist in the clean header, STOP this sub-step and record the decision gate. Do not silently recreate the legacy navigation injector.

- [ ] **Step 4: Hide only the verified TV Networks local tab**

Use the first stable candidate in `runtime-selector-map.json -> tvNetworksTab` that is scoped to the TV Shows local tab row. Do not use global text matching such as `*:contains("TV Networks")`.

- [ ] **Step 5: Isolate Continue Watching heading from the left edge**

Style only the captured section heading/container cosmetics. Do not change the native horizontal rail width, overflow, transform, or scroll behavior.

- [ ] **Step 6: Ensure Streaming Services precedes Continue Watching in fixture order**

This task styles the order expectation. The actual DOM creation/mount behavior is finalized in Task 9.

- [ ] **Step 7: Run focused and core tests GREEN**

```bash
npx playwright test tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs
npm run lint:geometry
npm run verify:core
```

Expected: PASS for all behavior supported by native DOM.

- [ ] **Step 8: Real-server navigation gate**

Verify Home, Movies, and TV Shows in browser and Media Player:

```text
Home/Favorites left
Movies/TV Shows right when native structure supports it
inactive global items consistent
selected states brass/navy, not red
TV Networks absent from TV Shows local tabs
no duplicate navigation injected
Streaming Services above Continue Watching
Continue Watching heading visually isolated
```

- [ ] **Step 9: Commit**

```bash
git add src/css/components/navigation.css src/css/pages/home.css src/css/integrations/streaming-services.css tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs
git commit -m "fix: simplify Harbor navigation and home hierarchy"
```

---

### Task 7: Repair Media Bar Enhanced without owning plugin mechanics

**Files:**
- Modify: `src/css/integrations/media-bar-enhanced.css`
- Modify: `src/css/pages/home.css`
- Modify: `scripts/check-geometry-ownership.mjs`
- Test: `tests/visual/runtime-v3-media-bar.spec.mjs`

**Interfaces:**
- Consumes: Clean Media Bar captures under the Task 2 deterministic profile.
- Produces: Visible backdrop/trailer, plugin-native controls/pagination, and a cosmetic hero-to-parchment blend.

- [ ] **Step 1: Run RED**

```bash
npx playwright test tests/visual/runtime-v3-media-bar.spec.mjs --project=desktop
```

Expected: FAIL for black/obscured media or Harbor-owned control sizing.

- [ ] **Step 2: Remove Harbor geometry from plugin controls**

Remove `min-width`, `min-height`, width/height, position, transform, and spacing ownership from plugin dots, arrows, pause, mute, and video/backdrop containers wherever the captured provenance shows Harbor currently wins.

- [ ] **Step 3: Extend geometry guard for Media Bar mechanic selectors**

Add protected selector/property combinations so future changes cannot reintroduce plugin control/media geometry ownership.

- [ ] **Step 4: Diagnose the black hero from provenance before changing media styling**

Only remove/adjust a Harbor backdrop/overlay property when the captured matched-rule provenance proves it contributes to obscuring the media. Do not replace `background-image` on plugin media owners.

- [ ] **Step 5: Implement a cosmetic lower-edge blend**

Use overlay/box-shadow/gradient cosmetics on a non-media owner verified by capture. The blend must not cover clickable controls or the trailer/backdrop.

- [ ] **Step 6: Run focused tests and geometry gate**

```bash
npx playwright test tests/visual/runtime-v3-media-bar.spec.mjs
npm run lint:geometry
npm run verify:core
```

Expected: PASS.

- [ ] **Step 7: Real-server Media Bar gate**

Validate browser and Media Player:

```text
static backdrop visible before 2000 ms delay
trailer visible when available
metadata readable over media
plugin-native dots/arrows/pause/mute geometry
no giant white indicators
smooth dark-to-parchment lower transition
```

If this passes, re-enable Slide Animations and test again. Keep them ON only if both clients remain correct. Progress bar remains optional and must receive a separate test before re-enabling.

- [ ] **Step 8: Commit**

```bash
git add src/css/integrations/media-bar-enhanced.css src/css/pages/home.css scripts/check-geometry-ownership.mjs tests/visual/runtime-v3-media-bar.spec.mjs
git commit -m "fix: respect Media Bar runtime ownership"
```

---

### Task 8: Rebuild Details as a real-DOM captain-log presentation

**Files:**
- Modify: `src/css/pages/details.css`
- Modify: `src/css/components/metadata.css`
- Modify: `src/css/components/headings.css`
- Test: `tests/visual/runtime-v3-details.spec.mjs`

**Interfaces:**
- Consumes: Captured movie/series detail DOM.
- Produces: Three cosmetic zones without changing Jellyfin's detail geometry.

- [ ] **Step 1: Run RED**

```bash
npx playwright test tests/visual/runtime-v3-details.spec.mjs --project=desktop
```

Expected: FAIL for weak backdrop presentation and section-label contrast.

- [ ] **Step 2: Preserve native cinematic identity zone**

Use only cosmetic dark gradients, typography, text shadows, and non-sizing framing around the verified detail content. Do not resize/reposition poster/backdrop/action containers.

- [ ] **Step 3: Implement captain-log cosmetics**

Apply restrained parchment/ink/brass treatment to overview and metadata surfaces using existing detail content containers. No new DOM is required.

- [ ] **Step 4: Fix browsing-section contrast**

Ensure Next Up, Seasons, Cast, Episodes, More Like This, and equivalent section headings resolve to readable dark ink/brass on parchment. Tests must assert contrast-relevant foreground/background values.

- [ ] **Step 5: Run desktop/mobile details tests and core gates**

```bash
npx playwright test tests/visual/runtime-v3-details.spec.mjs tests/visual/content-pages.spec.mjs
npm run lint:geometry
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Real-server details gate**

Verify one movie and one series in browser and Media Player. Stop if backdrop visibility, action readability, or section contrast differs between clients.

- [ ] **Step 7: Commit**

```bash
git add src/css/pages/details.css src/css/components/metadata.css src/css/components/headings.css tests/visual/runtime-v3-details.spec.mjs
git commit -m "feat: refine Harbor captain-log details"
```

---

### Task 9: Replace Streaming Services injector with a minimal Harbor DOM adapter

**Files:**
- Create: `integrations/javascript-injector/harbor-streaming-services.js`
- Create: `docs/integrations/javascript-injector.md`
- Create: `tests/build/streaming-services-adapter.test.mjs`
- Modify: `src/css/integrations/streaming-services.css`
- Modify: `tests/visual/runtime-v3-home.spec.mjs`

**Interfaces:**
- Consumes: Captured home container selector candidates from Task 3 and CSS behavior from Task 6.
- Produces: One copy-paste JavaScript Injector entry that creates only the Streaming Services DOM at the top of Jellyfin home sections.

- [ ] **Step 1: Write RED adapter contract**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('integrations/javascript-injector/harbor-streaming-services.js', 'utf8');

test('Streaming Services adapter is DOM-only and Harbor-scoped', () => {
  assert.match(source, /harborStreamingHub/u);
  assert.match(source, /Netflix/u);
  assert.match(source, /Prime Video/u);
  assert.match(source, /Disney\+/u);
  assert.match(source, /Max/u);
  assert.doesNotMatch(source, /\.style\.|style=/u);
  assert.doesNotMatch(source, /MediaBar|videoPlayer|osdHeader/u);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest/u);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/streaming-services-adapter.test.mjs
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the minimal adapter**

Use this structure, substituting the first verified home container selector from `runtime-selector-map.json` into `HOME_CONTAINER_SELECTOR` during execution:

```js
(() => {
  'use strict';

  const HUB_ID = 'harborStreamingHub';
  const HOME_CONTAINER_SELECTOR = '<verified selector from runtime-selector-map.json>';
  const services = [
    ['Netflix', 'https://www.netflix.com/'],
    ['Prime Video', 'https://www.primevideo.com/'],
    ['Disney+', 'https://www.disneyplus.com/'],
    ['Max', 'https://www.max.com/'],
  ];

  function createHub() {
    const section = document.createElement('section');
    section.id = HUB_ID;
    section.className = 'harborStreamingHub';
    section.setAttribute('aria-labelledby', `${HUB_ID}-title`);

    const heading = document.createElement('h2');
    heading.id = `${HUB_ID}-title`;
    heading.className = 'harborStreamingTitle';
    heading.textContent = 'Streaming Services';

    const row = document.createElement('div');
    row.className = 'harborStreamingRow';

    for (const [name, href] of services) {
      const link = document.createElement('a');
      link.className = 'harborStreamingCard';
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = name;
      row.append(link);
    }

    section.append(heading, row);
    return section;
  }

  function mount() {
    if (document.getElementById(HUB_ID)) return;
    const home = document.querySelector(HOME_CONTAINER_SELECTOR);
    if (!home) return;
    home.prepend(createHub());
  }

  mount();
  window.addEventListener('hashchange', () => queueMicrotask(mount));
  window.addEventListener('popstate', () => queueMicrotask(mount));
})();
```

If clean runtime testing proves Jellyfin SPA navigation removes the section without firing those events, add one observer scoped to the verified home page/container only. Do not observe `document.body` globally unless separately justified by capture evidence.

- [ ] **Step 4: Update Harbor CSS selectors to the new adapter classes**

Style `#harborStreamingHub`, `.harborStreamingTitle`, `.harborStreamingRow`, and `.harborStreamingCard`. Remove dependencies on the old `homelab*`, `stream-card`, or other legacy injector class names.

- [ ] **Step 5: Run adapter and home tests GREEN**

```bash
node --test tests/build/streaming-services-adapter.test.mjs
npx playwright test tests/visual/runtime-v3-home.spec.mjs
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Owner replaces the old Streaming Services injector**

Disable/delete the old entry, paste only the new `harbor-streaming-services.js` content, restart/hard-refresh, and confirm Streaming Services appears before Continue Watching.

- [ ] **Step 7: Verify no other JavaScript Injector entries are required**

Expected end state:

```text
Harbor Streaming Services: ENABLED
legacy branding: REMOVED/DISABLED
legacy Media Top Navigation: REMOVED/DISABLED
old Streaming Services: REMOVED/DISABLED
```

If native navigation in Task 6 could not provide the requested right-side Movies/TV Shows links, STOP and request a separate navigation-adapter decision before adding another injector script.

- [ ] **Step 8: Commit**

```bash
git add integrations/javascript-injector/harbor-streaming-services.js docs/integrations/javascript-injector.md tests/build/streaming-services-adapter.test.mjs src/css/integrations/streaming-services.css tests/visual/runtime-v3-home.spec.mjs
git commit -m "feat: add minimal Harbor streaming services adapter"
```

---

### Task 10: Cross-client owner validation, credibility audit, and release-candidate gate

**Files:**
- Modify: `docs/compatibility.md`
- Modify: `docs/testing/manual-matrix.md`
- Create: `docs/testing/runtime-recovery-v3-results.md`
- Modify: tests whose names overclaim fixture scope
- Generated: `theme.css`

**Interfaces:**
- Consumes: Passing Tasks 1-9.
- Produces: One immutable V3 candidate that is proven by automation and separately validated on real browser/app clients.

- [ ] **Step 1: Run the complete automated gate**

```bash
npm run verify:core
npm run check:publication
npm run test:visual
```

Expected: PASS with zero unexpected failures.

- [ ] **Step 2: Audit test names for evidence scope**

Classify every relevant assertion as one of:

```text
synthetic presentation
captured Jellyfin 10.11.11 contract
real-server owner validation
```

Rename tests that imply universal real-server truth when they only load fixtures. Do not weaken assertions.

- [ ] **Step 3: Run the real owner matrix on the same immutable commit**

Chrome/Edge Jellyfin Web and Jellyfin Media Player must each validate:

```text
Home without Media Bar
Home with Media Bar static backdrop
Home with Media Bar trailer playing
Streaming Services first
Continue Watching second and visually isolated
Movies global/local navigation
TV Shows global/local navigation with TV Networks absent
Movie details
Series details
Player playing
Player paused + OSD
menu/dialog
narrow/mobile web
200% browser zoom where applicable
```

- [ ] **Step 4: Record results separately from automated claims**

`docs/testing/runtime-recovery-v3-results.md` must identify exact candidate SHA, Jellyfin version, Media Bar version, browser result, Media Player result, and any intentional limitations.

- [ ] **Step 5: Independent review pass**

A fresh reviewer checks:

```text
selector breadth
!important usage
geometry ownership
player leakage
Media Bar mechanics ownership
navigation duplication
right-side global grouping
TV Networks hiding scope
Streaming Services JS scope
home section order
accessibility/contrast
privacy/publication
former-brand leakage
generated theme.css parity
```

All blocking findings are fixed and the full automated + owner matrix rerun.

- [ ] **Step 6: Commit exact generated CSS and verify that immutable SHA again**

Generate `theme.css`, commit it, then rerun the normal read-only CI on the exact SHA intended for owner testing/release.

- [ ] **Step 7: Release decision**

Do not create a stable tag unless every automated gate, browser/app owner row, and independent review is green. If any row differs between browser and Media Player, return to the corresponding runtime-capture task instead of adding broad CSS overrides.

---

## Execution checkpoints

After Task 2, the owner performs configuration cleanup.

After Task 3, the owner supplies sanitized runtime captures.

After Task 5, the owner validates player behavior before any other visual polish proceeds.

After Tasks 6-9, the owner validates each surface on the live server before the next subsystem is treated as complete.

Task 10 is the only point where a stable release can be considered.
