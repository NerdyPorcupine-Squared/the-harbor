# The Harbor Runtime Recovery V3 Final Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild The Harbor against clean Jellyfin 10.11.11 runtime evidence, permanently retire obsolete injected branding/navigation behavior, place Streaming Services before Continue Watching, fix player/Media Bar/navigation/details failures, and converge on one Harbor CSS import plus one minimal Streaming Services DOM adapter.

**Architecture:** Jellyfin and Media Bar Enhanced retain all structural/media ownership. Harbor owns presentation and one narrowly scoped visibility rule for the unwanted TV Networks tab. Every failed surface is captured after legacy injector cleanup, converted into a real-DOM fixture, driven RED first, then fixed with the smallest scoped change. JavaScript Injector is reduced to a DOM-only Streaming Services adapter; a navigation adapter is not permitted unless Task 6 reaches its explicit stop gate and a separate decision is approved.

**Tech Stack:** Jellyfin Web 10.11.11, Jellyfin Media Player/web shell, Media Bar Enhanced 3.6.x, JavaScript Injector, CSS, vanilla JavaScript, Node.js 20+, Playwright Chromium, GitHub Actions Windows CI.

**Spec:** `docs/superpowers/specs/2026-08-28-runtime-recovery-v3-design.md`

## Global Constraints

- The product name is **The Harbor**. Production/public output must not contain the former brand string.
- Jellyfin owns card, player, navigation, detail-page, home-section, and application-header structural geometry.
- Media Bar Enhanced owns slideshow geometry, video/backdrop playback, pagination mechanics, timing, and plugin state.
- Harbor may not replace protected media `background-image`, video visibility, widths/heights, positions, transforms, overflow, padding, margin, or aspect ratios.
- Runtime evidence outranks synthetic fixtures.
- Legacy branding and legacy Media Top Navigation injectors never return.
- JavaScript Injector may create Streaming Services DOM only unless a later separately approved navigation-adapter decision is made.
- No stable tag before Chrome/Edge Jellyfin Web and Jellyfin Media Player pass the same immutable SHA.

---

### Task 1: Clean the customization stack and enforce Harbor naming

**Files:**
- Create: `docs/testing/runtime-recovery-v3-owner-checklist.md`
- Create: `tests/build/harbor-brand-contract.test.mjs`
- Modify: `docs/compatibility.md`
- Modify as required by the test: `src/css/**`, `theme.css`, `README.md`

**Interfaces:**
- Consumes: V3 design spec and current live Jellyfin configuration.
- Produces: A clean baseline with no legacy branding/top-navigation injector and a build gate preventing old branding from re-entering production.

- [ ] **Step 1: Write the RED Harbor naming contract**

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

test('Harbor production and public output contains no former brand string', async () => {
  const files = [...await walk('src/css'), 'theme.css', 'README.md'];
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

Expected: FAIL on current production/public branding.

- [ ] **Step 3: Owner disables conflicting JavaScript Injector entries**

Before any V3 capture:

```text
Legacy Branding: DISABLED
Media Top Navigation: DISABLED
Existing Streaming Services: temporarily ENABLED until Task 9 replacement
```

Also remove any separate post-import branding/navigation CSS from Jellyfin Custom CSS. Leave one current Harbor import only.

- [ ] **Step 4: Replace production/public old-brand copy with The Harbor / Harbor**

This step changes naming only. Do not alter geometry while doing it.

- [ ] **Step 5: Write the owner checklist**

The checklist must mark any capture invalid if legacy branding or Media Top Navigation is active.

- [ ] **Step 6: Run GREEN and core gate**

```bash
node --test tests/build/harbor-brand-contract.test.mjs
npm run verify:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/testing/runtime-recovery-v3-owner-checklist.md docs/compatibility.md tests/build/harbor-brand-contract.test.mjs src/css theme.css README.md
git commit -m "chore: establish clean Harbor runtime baseline"
```

---

### Task 2: Lock Media Bar Enhanced to a deterministic validation profile

**Files:**
- Create: `docs/testing/media-bar-v3-validation-profile.md`
- Create: `tests/build/media-bar-v3-profile.test.mjs`
- Modify: `docs/testing/runtime-recovery-v3-owner-checklist.md`

**Interfaces:**
- Consumes: Current owner settings screenshots.
- Produces: One fixed Media Bar profile used until browser and Media Player validation both pass.

- [ ] **Step 1: Write RED profile test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile('docs/testing/media-bar-v3-validation-profile.md', 'utf8');

for (const expected of [
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
]) {
  test(`Media Bar V3 profile contains ${expected}`, () => assert.ok(profile.includes(expected)));
}
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/media-bar-v3-profile.test.mjs
```

Expected: FAIL because the profile file does not exist.

- [ ] **Step 3: Write the exact validation profile**

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

Record the installed Media Bar version. Do not upgrade/downgrade it inside one capture/fix cycle. Capture Custom Content, Custom Overlay, and Advanced settings before changing them. Final Harbor validation prefers Custom Overlay empty/disabled.

- [ ] **Step 4: Owner applies profile and restarts browser/Media Player**

Client-side settings must be OFF before Task 3.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/build/media-bar-v3-profile.test.mjs
npm run verify:core
```

- [ ] **Step 6: Commit**

```bash
git add docs/testing/media-bar-v3-validation-profile.md docs/testing/runtime-recovery-v3-owner-checklist.md tests/build/media-bar-v3-profile.test.mjs
git commit -m "docs: lock Harbor Media Bar validation profile"
```

---

### Task 3: Upgrade runtime capture provenance and capture the clean V3 DOM

**Files:**
- Modify: `tools/runtime-capture/harbor-capture.js`
- Modify: `docs/testing/runtime-capture.md`
- Create: `tests/build/runtime-capture-v3.test.mjs`
- Create after capture: `tests/fixtures/jf-10.11.11/runtime-captures-v3/**/*.json`
- Create after capture: `tests/fixtures/jf-10.11.11/contracts/runtime-selector-map.json`

**Interfaces:**
- Consumes: Tasks 1-2 clean configuration.
- Produces: Sanitized runtime evidence plus stable selector candidates used by later tasks.

- [ ] **Step 1: Write RED provenance test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('tools/runtime-capture/harbor-capture.js', 'utf8');

test('V3 capture records provenance and selector candidates', () => {
  assert.match(source, /classifyStylesheetSource/u);
  assert.match(source, /sourceKind/u);
  assert.match(source, /stableSelectorCandidates/u);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/runtime-capture-v3.test.mjs
```

- [ ] **Step 3: Add local-only stylesheet provenance**

```js
function classifyStylesheetSource(href = '', ownerText = '') {
  const value = `${href} ${ownerText}`.toLowerCase();
  if (value.includes('the-harbor') || value.includes('/harbor')) return 'harbor';
  if (value.includes('media-bar') || value.includes('mediabarenhanced')) return 'media-bar';
  if (!href || value.includes('/web/') || value.includes('jellyfin')) return 'jellyfin';
  return 'unknown';
}
```

Do not collect cookies, storage, auth headers, private hosts, item/session/server IDs, or raw media URLs.

- [ ] **Step 4: Add stable selector candidate extraction**

Capture candidates in this order: unique non-sensitive id, stable class combination, sanitized stable href route, role + aria-current/aria-selected, verified parent + child selector. The helper may not mutate the page.

- [ ] **Step 5: Run helper tests GREEN**

```bash
node --test tests/build/runtime-capture-v3.test.mjs tests/build/runtime-capture-contract.test.mjs
```

- [ ] **Step 6: Owner captures all required clean surfaces**

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

Every JSON is manually opened before sharing/commit to confirm sanitization.

- [ ] **Step 7: Create selector map from captured candidates**

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

Every array is copied from sanitized capture output. No selector is guessed.

- [ ] **Step 8: Extend sanitization/publication gates for V3 captures**

Reject private IPv4s, localhost URLs, email-like strings, raw media URLs, user/item/session/server IDs, and token-bearing query strings.

- [ ] **Step 9: Commit tooling and evidence separately**

```bash
git add tools/runtime-capture/harbor-capture.js docs/testing/runtime-capture.md tests/build/runtime-capture-v3.test.mjs
git commit -m "test: add Harbor V3 runtime provenance"

git add tests/fixtures/jf-10.11.11/runtime-captures-v3 tests/fixtures/jf-10.11.11/contracts tests/build
git commit -m "test: add clean Harbor V3 runtime evidence"
```

---

### Task 4: Build real-DOM fixtures and RED contracts

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
- Consumes: Task 3 captures/selector map.
- Produces: RED tests matching the real failures rather than simplified mocks.

- [ ] **Step 1: Copy sanitized hierarchy into fixtures**

Preserve real classes, parent order, attributes, and relevant inline styles. Add no test-only wrapper selectors that production CSS can target.

- [ ] **Step 2: Write RED player assertions**

Assert no cartography/parchment on captured player roots, no `The Harbor` pseudo-content in OSD, and visible video surface.

- [ ] **Step 3: Write RED navigation assertions**

Assert no selected state resolves to `rgb(229, 9, 20)`, inactive global items share a consistent treatment, TV Networks is hidden in the TV Shows local row, and only one local selected state exists.

- [ ] **Step 4: Write RED home-order assertions**

Streaming Services must precede Continue Watching. Continue Watching heading must have visual left/right separation while the native rail retains its captured overflow/scroll geometry.

- [ ] **Step 5: Write RED Media Bar assertions**

Backdrop/video remain visible; Harbor must not force width/height/min-width/min-height on plugin dots/controls; Harbor must not replace plugin media `background-image`.

- [ ] **Step 6: Write RED details assertions**

Backdrop remains visible and Next Up/Seasons/secondary headings have readable foreground/background contrast.

- [ ] **Step 7: Narrow old test wording to actual evidence scope**

Fixture tests must say `captured Jellyfin 10.11.11` rather than claiming universal real-server behavior. Assertions remain strict.

- [ ] **Step 8: Run RED suite and commit tests only**

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs tests/visual/runtime-v3-media-bar.spec.mjs tests/visual/runtime-v3-details.spec.mjs
```

Expected: targeted failures against current production CSS.

```bash
git add tests/fixtures/jf-10.11.11 tests/visual
git commit -m "test: reproduce Harbor V3 live-runtime failures"
```

---

### Task 5: Fix P0 player isolation

**Files:**
- Modify: `src/css/base/map-surface.css`
- Modify: `src/css/base/texture.css` only if capture provenance proves leakage there
- Modify: `src/css/components/branding.css`
- Modify: `src/css/pages/player.css`
- Test: `tests/visual/runtime-v3-player.spec.mjs`

**Interfaces:**
- Consumes: Real V3 player fixture and selector map.
- Produces: Playback that cannot receive Harbor browsing parchment/cartography or browsing wordmark.

- [ ] **Step 1: Confirm RED**

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs --project=desktop
```

- [ ] **Step 2: Narrow originating browsing selectors using captured player roots**

Fix leakage at source. Do not add a broad player reset.

- [ ] **Step 3: Scope `The Harbor` browsing wordmark away from OSD**

Use captured parent/page-state scope, not a large OSD undo block.

- [ ] **Step 4: Keep `player.css` cosmetic-only**

Allowed: native control color/focus treatment. Forbidden: video visibility, media background replacement, OSD geometry, page cartography.

- [ ] **Step 5: Run focused tests and core gates**

```bash
npx playwright test tests/visual/runtime-v3-player.spec.mjs tests/visual/system-pages.spec.mjs
npm run lint:geometry
npm run verify:core
```

- [ ] **Step 6: Owner validates playing and paused states in browser and Media Player**

Both clients must show visible video, dark native player, intact OSD, and no browsing parchment/cartography/wordmark.

- [ ] **Step 7: Commit**

```bash
git add src/css/base src/css/components/branding.css src/css/pages/player.css tests/visual/runtime-v3-player.spec.mjs
git commit -m "fix: isolate Harbor browsing from playback"
```

---

### Task 6: Rebuild navigation and home hierarchy without the legacy navigation injector

**Files:**
- Modify: `src/css/components/navigation.css`
- Modify: `src/css/pages/home.css`
- Modify: `src/css/integrations/streaming-services.css`
- Test: `tests/visual/runtime-v3-navigation.spec.mjs`
- Test: `tests/visual/runtime-v3-home.spec.mjs`

**Interfaces:**
- Consumes: Clean native header/local-tab fixtures and selector map.
- Produces: Home/Favorites left, Movies/TV Shows right when native DOM safely supports it, consistent inactive states, brass/navy active states, TV Networks hidden, Streaming Services first, and isolated Continue Watching heading.

- [ ] **Step 1: Confirm RED**

```bash
npx playwright test tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs --project=desktop
```

- [ ] **Step 2: Remove legacy red/yellow interaction assumptions**

Inactive global/local navigation gets one subdued neutral/parchment treatment. Active global and active local states use related Harbor navy/brass/parchment treatments with distinct weight.

- [ ] **Step 3: Test native right-side global grouping feasibility**

Read `runtime-selector-map.json`. If native global Movies and TV Shows elements exist in the same captured flex/header group as Home/Favorites, position the native elements using the smallest verified order/alignment rule and no duplicated DOM.

If either native global Movies or TV Shows is absent, STOP this sub-step. Record `navigation-adapter-required` in the results document and do not recreate the legacy injector without a separate approval.

- [ ] **Step 4: Hide only captured TV Networks local tab**

Use the first stable `tvNetworksTab` candidate scoped to the captured TV Shows local row. No global text matching.

- [ ] **Step 5: Isolate Continue Watching heading from the left viewport edge**

Style only heading/container cosmetics. Keep native rail width/overflow/transform/scroll behavior unchanged.

- [ ] **Step 6: Run focused tests and core gates**

```bash
npx playwright test tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs
npm run lint:geometry
npm run verify:core
```

- [ ] **Step 7: Owner validates Home, Movies, and TV Shows in both clients**

Required: no duplicate injected navigation, no red selected states, TV Networks absent, Streaming Services above Continue Watching, Continue Watching heading isolated.

- [ ] **Step 8: Commit**

```bash
git add src/css/components/navigation.css src/css/pages/home.css src/css/integrations/streaming-services.css tests/visual/runtime-v3-navigation.spec.mjs tests/visual/runtime-v3-home.spec.mjs
git commit -m "fix: simplify Harbor navigation and home hierarchy"
```

---

### Task 7: Repair Media Bar Enhanced while preserving plugin mechanics

**Files:**
- Modify: `src/css/integrations/media-bar-enhanced.css`
- Modify: `src/css/pages/home.css`
- Modify: `scripts/check-geometry-ownership.mjs`
- Test: `tests/visual/runtime-v3-media-bar.spec.mjs`

**Interfaces:**
- Consumes: Clean Media Bar captures under Task 2 profile.
- Produces: Visible media, plugin-native controls/pagination, and cosmetic hero-to-parchment blend.

- [ ] **Step 1: Confirm RED**

```bash
npx playwright test tests/visual/runtime-v3-media-bar.spec.mjs --project=desktop
```

- [ ] **Step 2: Remove Harbor geometry from plugin dots/arrows/pause/mute/media containers**

Delete width/height/min-width/min-height/position/transform/spacing ownership where provenance shows Harbor wins.

- [ ] **Step 3: Extend geometry guard for Media Bar mechanic selectors**

Protect the captured plugin selectors from future structural declarations.

- [ ] **Step 4: Fix black/obscured hero only from matched-rule evidence**

Adjust/remove only Harbor overlay/backdrop rules proven to obscure media. Do not replace plugin media `background-image`.

- [ ] **Step 5: Add cosmetic lower-edge blend on a verified non-media owner**

The blend cannot cover controls or media.

- [ ] **Step 6: Run focused tests and core gates**

```bash
npx playwright test tests/visual/runtime-v3-media-bar.spec.mjs
npm run lint:geometry
npm run verify:core
```

- [ ] **Step 7: Owner validates static backdrop, playing trailer, controls, and seam in both clients**

After first pass succeeds, re-enable Slide Animations and retest. Keep them ON only if both clients stay correct. Progress bar remains OFF until separately tested.

- [ ] **Step 8: Commit**

```bash
git add src/css/integrations/media-bar-enhanced.css src/css/pages/home.css scripts/check-geometry-ownership.mjs tests/visual/runtime-v3-media-bar.spec.mjs
git commit -m "fix: respect Media Bar runtime ownership"
```

---

### Task 8: Rebuild Details as Harbor captain-log presentation

**Files:**
- Modify: `src/css/pages/details.css`
- Modify: `src/css/components/metadata.css`
- Modify: `src/css/components/headings.css`
- Test: `tests/visual/runtime-v3-details.spec.mjs`

**Interfaces:**
- Consumes: Captured movie/series detail fixtures.
- Produces: Cinematic identity, captain-log information treatment, and readable parchment browsing sections without structural ownership.

- [ ] **Step 1: Confirm RED**

```bash
npx playwright test tests/visual/runtime-v3-details.spec.mjs --project=desktop
```

- [ ] **Step 2: Preserve native backdrop/poster/action geometry**

Use cosmetic gradients, typography, text shadows, and non-sizing frames only.

- [ ] **Step 3: Implement captain-log cosmetics using existing detail content containers**

No new DOM required.

- [ ] **Step 4: Fix Next Up/Seasons/Cast/Episodes/More Like This contrast**

Tests must assert readable foreground/background values.

- [ ] **Step 5: Run details tests and core gates**

```bash
npx playwright test tests/visual/runtime-v3-details.spec.mjs tests/visual/content-pages.spec.mjs
npm run lint:geometry
npm run verify:core
```

- [ ] **Step 6: Owner validates one movie and one series in both clients**

- [ ] **Step 7: Commit**

```bash
git add src/css/pages/details.css src/css/components/metadata.css src/css/components/headings.css tests/visual/runtime-v3-details.spec.mjs
git commit -m "feat: refine Harbor captain-log details"
```

---

### Task 9: Replace Streaming Services injector with one minimal Harbor DOM adapter

**Files:**
- Create: `integrations/javascript-injector/harbor-streaming-services.js`
- Create: `docs/integrations/javascript-injector.md`
- Create: `tests/build/streaming-services-adapter.test.mjs`
- Modify: `src/css/integrations/streaming-services.css`
- Modify: `tests/visual/runtime-v3-home.spec.mjs`

**Interfaces:**
- Consumes: Task 3 capture verifying `.homeSectionsContainer` is the real Jellyfin home sections container and Task 6 home presentation.
- Produces: One DOM-only injector entry mounting Streaming Services before native home sections.

- [ ] **Step 1: Require Task 3 to verify `.homeSectionsContainer`**

If the clean capture does not contain `.homeSectionsContainer` as the actual native home sections container, STOP Task 9 and revise this plan before writing the adapter. Do not guess a replacement selector.

- [ ] **Step 2: Write RED adapter contract**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('integrations/javascript-injector/harbor-streaming-services.js', 'utf8');

test('Streaming Services adapter is DOM-only and Harbor-scoped', () => {
  assert.match(source, /harborStreamingHub/u);
  assert.match(source, /\.homeSectionsContainer/u);
  assert.match(source, /Netflix/u);
  assert.match(source, /Prime Video/u);
  assert.match(source, /Disney\+/u);
  assert.match(source, /Max/u);
  assert.doesNotMatch(source, /\.style\.|style=/u);
  assert.doesNotMatch(source, /MediaBar|videoPlayer|osdHeader/u);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest/u);
});
```

- [ ] **Step 3: Run RED**

```bash
node --test tests/build/streaming-services-adapter.test.mjs
```

- [ ] **Step 4: Implement the minimal adapter**

```js
(() => {
  'use strict';

  const HUB_ID = 'harborStreamingHub';
  const HOME_CONTAINER_SELECTOR = '.homeSectionsContainer';
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

No visual inline styles, Media Bar code, player code, network requests, or global input interception.

- [ ] **Step 5: If SPA navigation removes the hub, prove it before adding an observer**

Only then add one observer scoped to the captured home page/container. Do not observe `document.body` globally.

- [ ] **Step 6: Update Harbor CSS to new classes**

Use only `#harborStreamingHub`, `.harborStreamingTitle`, `.harborStreamingRow`, and `.harborStreamingCard`. Remove dependencies on old `homelab*`, `stream-card`, or other legacy injector classes.

- [ ] **Step 7: Run GREEN**

```bash
node --test tests/build/streaming-services-adapter.test.mjs
npx playwright test tests/visual/runtime-v3-home.spec.mjs
npm run verify:core
```

- [ ] **Step 8: Owner replaces old Streaming Services injector**

Expected final injector list:

```text
Harbor Streaming Services: ENABLED
Legacy Branding: REMOVED/DISABLED
Media Top Navigation: REMOVED/DISABLED
Old Streaming Services: REMOVED/DISABLED
```

If Task 6 reached `navigation-adapter-required`, no second script is added until separately approved.

- [ ] **Step 9: Commit**

```bash
git add integrations/javascript-injector/harbor-streaming-services.js docs/integrations/javascript-injector.md tests/build/streaming-services-adapter.test.mjs src/css/integrations/streaming-services.css tests/visual/runtime-v3-home.spec.mjs
git commit -m "feat: add minimal Harbor streaming services adapter"
```

---

### Task 10: Cross-client validation, credibility audit, independent review, and release gate

**Files:**
- Modify: `docs/compatibility.md`
- Modify: `docs/testing/manual-matrix.md`
- Create: `docs/testing/runtime-recovery-v3-results.md`
- Modify: tests whose names overclaim fixture scope
- Generated: `theme.css`

**Interfaces:**
- Consumes: Passing Tasks 1-9.
- Produces: One immutable V3 candidate with automation, real-server evidence, and independent review aligned.

- [ ] **Step 1: Run complete automated gate**

```bash
npm run verify:core
npm run check:publication
npm run test:visual
```

Expected: zero unexpected failures.

- [ ] **Step 2: Audit evidence language**

Classify relevant checks as `synthetic presentation`, `captured Jellyfin 10.11.11 contract`, or `real-server owner validation`. Rename overclaiming tests without weakening them.

- [ ] **Step 3: Run same-SHA owner matrix in Chrome/Edge and Jellyfin Media Player**

```text
Home without Media Bar
Home with Media Bar static backdrop
Home with Media Bar trailer playing
Streaming Services first
Continue Watching second and isolated
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

- [ ] **Step 4: Record exact versions/results**

`runtime-recovery-v3-results.md` records candidate SHA, Jellyfin version, Media Bar version, browser result, Media Player result, and limitations.

- [ ] **Step 5: Independent reviewer checks**

```text
selector breadth
!important usage
geometry ownership
player leakage
Media Bar ownership
navigation duplication/right grouping
TV Networks hiding scope
Streaming Services JS scope
home section order
accessibility/contrast
privacy/publication
legacy-brand leakage
generated theme.css parity
```

Blocking findings require fixes and a full rerun.

- [ ] **Step 6: Commit generated `theme.css` at exact candidate SHA and rerun read-only CI**

- [ ] **Step 7: Release decision**

No stable tag unless automation, both clients, and independent review are green. Any real-server/fixture disagreement returns to Task 3 rather than broad CSS overrides.

---

## Owner checkpoints

After Task 2: disable retired injectors, apply Media Bar validation settings, and restart clients.

After Task 3: provide sanitized clean runtime captures.

After Task 5: validate player before other polish is considered trustworthy.

After Tasks 6-9: validate each subsystem on the live server before moving its status to complete.

Task 10 is the only release decision point.
