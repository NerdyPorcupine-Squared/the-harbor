# Harbor Runtime Recovery V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Harbor's failing real-runtime surfaces against sanitized Jellyfin 10.11.11 evidence while preserving the working library/card experience and reducing JavaScript Injector to Streaming Services DOM creation only.

**Architecture:** Real Jellyfin and Media Bar Enhanced own structure and media mechanics. Harbor owns presentation only. Every broken surface receives a sanitized real-runtime fixture and a RED regression test before CSS changes. Media Bar settings are locked to a deterministic validation profile during recovery, and the optional Streaming Services integration is isolated behind a minimal DOM-only script.

**Tech Stack:** Jellyfin Web 10.11.11, Media Bar Enhanced, JavaScript Injector, File Transformation where already required by installed plugins, CSS, vanilla JavaScript, Node.js, Playwright Chromium, GitHub Actions on Windows.

**Spec:** `docs/superpowers/specs/2026-08-28-runtime-recovery-v2-design.md`

## Global Constraints

- Jellyfin owns card, player, navigation, detail-page, home-section, and application-header structural geometry.
- Media Bar Enhanced owns slideshow geometry, video/backdrop playback, pagination mechanics, timing, and plugin state.
- Harbor may not replace media `background-image`, video visibility, protected widths/heights, positions, transforms, overflow, padding, margin, or aspect ratios.
- Real-runtime evidence outranks synthetic fixtures.
- JavaScript Injector may create Streaming Services DOM only. It may not own branding, layout, Media Bar behavior, navigation, player behavior, colors, or hover presentation.
- No stable tag before the browser and Jellyfin Media Player owner matrix passes on the same immutable SHA.

---

### Task 1: Freeze the diagnostic baseline and lock Media Bar validation settings

**Files:**
- Create: `docs/testing/media-bar-validation-profile.md`
- Modify: `docs/compatibility.md`
- Test: `tests/build/media-bar-validation-profile.test.mjs`

**Interfaces:**
- Consumes: Current failed real-server screenshots and the design spec.
- Produces: A single deterministic Media Bar configuration profile used by every later runtime capture and owner validation.

- [ ] **Step 1: Write the failing settings-profile contract test**

Create `tests/build/media-bar-validation-profile.test.mjs` and assert that the profile documents these exact recovery settings:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile('docs/testing/media-bar-validation-profile.md', 'utf8');

test('Media Bar recovery profile is deterministic', () => {
  for (const line of [
    'Enable Client-Side Settings: OFF',
    'Enable Slide Animations: OFF',
    'Show Slide Progress Bar: OFF',
    'Enable Trailer Backdrops: ON',
    'Start Muted: ON',
    'Full Width Video: ON',
    'Constrain Plot Width: ON',
    'Random Trailer Start Position: OFF',
    'Default Trailer Volume: 10%',
    'Backdrop Video Delay: 2000 ms',
    'Mobile Aspect Ratio / Height: 16:9 Compact Wide',
  ]) assert.match(profile, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
node --test tests/build/media-bar-validation-profile.test.mjs
```

Expected: FAIL because `docs/testing/media-bar-validation-profile.md` does not exist.

- [ ] **Step 3: Add the configuration profile**

Document the visible current settings and the recovery changes. The profile must tell the owner to use:

```text
Enable Media Bar Enhanced Plugin: ON
Enable Loading Screen: keep current value for first capture, then OFF if it obstructs validation
Enable Client-Side Settings: OFF
Client Settings Menu Location: irrelevant while client settings are OFF
Enable Trailer Backdrops: ON
Prefer Local Trailers: OFF
Only Play Local Trailers: OFF
Prefer Local Backdrops / Theme Videos: OFF
Wait For Trailer To End: OFF
Enable Trailer On Mobile: OFF
Show Trailer Button: ON
Start Muted: ON
Randomize Backdrop Video: OFF
Randomize Local Trailer: OFF
Hover Audio Fade: OFF
Random Trailer Start Position: OFF
Use SponsorBlock: ON
SponsorBlock Intro: ON
SponsorBlock Outro: ON
SponsorBlock Preview: OFF
All other SponsorBlock categories: OFF
Default Trailer Volume: 10%
Backdrop Video Delay: 2000 ms
Trailer Start Offset: 0 ms
Trailer End Offset: 0 ms
Full Width Video: ON
Constrain Plot Width: ON
Always Show Arrow Navigation: OFF
Hide Arrows on Mobile: ON
Enable Keyboard Controls: ON
Enable Slide Animations: OFF during recovery
Show Slide Progress Bar: OFF during recovery
Sync Page Backdrop: OFF
Yo-Yo Progress Bar Animation: OFF
Mobile Aspect Ratio / Height: 16:9 Compact Wide
```

State explicitly that unseen Custom Content, Custom Overlay, and Advanced values remain unchanged until captured. Custom Overlay should be empty/disabled for the final Harbor profile.

- [ ] **Step 4: Run the focused test to GREEN**

Run:

```bash
node --test tests/build/media-bar-validation-profile.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run core docs/build verification**

Run:

```bash
npm run verify:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/testing/media-bar-validation-profile.md docs/compatibility.md tests/build/media-bar-validation-profile.test.mjs
git commit -m "docs: lock Media Bar recovery profile"
```

---

### Task 2: Upgrade runtime capture provenance and capture every failed surface

**Files:**
- Modify: `tools/runtime-capture/harbor-capture.js`
- Modify: `docs/testing/runtime-capture.md`
- Create: `tests/build/runtime-capture-provenance.test.mjs`
- Create after owner capture: `tests/fixtures/jf-10.11.11/runtime-captures/player/*.json`
- Create after owner capture: `tests/fixtures/jf-10.11.11/runtime-captures/media-bar/*.json`
- Create after owner capture: `tests/fixtures/jf-10.11.11/runtime-captures/navigation/*.json`
- Create after owner capture: `tests/fixtures/jf-10.11.11/runtime-captures/details/*.json`
- Create after owner capture: `tests/fixtures/jf-10.11.11/runtime-captures/home/*.json`

**Interfaces:**
- Consumes: Existing `HarborCapture.capture()`/`download()` API and validation profile from Task 1.
- Produces: Sanitized captures with matched-rule provenance sufficient to distinguish Jellyfin, Harbor, Media Bar, and unknown stylesheets.

- [ ] **Step 1: Write a RED provenance test**

Add a contract asserting capture output includes a source label for matched rules:

```js
test('matched rules include sanitized stylesheet provenance', async () => {
  const source = await readFile('tools/runtime-capture/harbor-capture.js', 'utf8');
  assert.match(source, /classifyStylesheetSource/u);
  assert.match(source, /sourceKind/u);
  assert.match(source, /jellyfin|harbor|media-bar|unknown/u);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/build/runtime-capture-provenance.test.mjs
```

Expected: FAIL until provenance exists.

- [ ] **Step 3: Implement stylesheet-source classification without network requests**

Add a pure local helper inside the capture script:

```js
function classifyStylesheetSource(href, ownerNodeText = '') {
  const value = `${href || ''} ${ownerNodeText || ''}`.toLowerCase();
  if (value.includes('the-harbor') || value.includes('harbor')) return 'harbor';
  if (value.includes('media-bar') || value.includes('mediabarenhanced')) return 'media-bar';
  if (!href || value.includes('/web/') || value.includes('jellyfin')) return 'jellyfin';
  return 'unknown';
}
```

Store only sanitized href/path metadata. Never store query tokens, private hosts, cookies, localStorage, sessionStorage, authorization headers, item IDs, or raw media URLs.

- [ ] **Step 4: Run provenance and sanitizer tests**

```bash
node --test tests/build/runtime-capture-provenance.test.mjs tests/build/runtime-capture-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Capture the exact live failures using the deterministic profile**

Required labels:

```text
player-page-root
player-video-container
player-osd-header
player-osd-bottom
home-media-bar
home-media-bar-seam
navigation-active-tvshows
movie-details-full
series-details-full
home-streaming-services
```

Every JSON file must be manually opened before commit to verify no private server/user/media information escaped sanitization.

- [ ] **Step 6: Add a fixture-sanitization gate for the new captures**

Extend the existing publication/runtime sanitizer tests to reject private IPv4 addresses, localhost URLs, email-like strings, media API URLs, user/item/session/server IDs, and external query strings.

- [ ] **Step 7: Commit capture tooling and sanitized evidence separately**

```bash
git add tools/runtime-capture/harbor-capture.js docs/testing/runtime-capture.md tests/build/runtime-capture-provenance.test.mjs
git commit -m "test: add runtime stylesheet provenance"

git add tests/fixtures/jf-10.11.11/runtime-captures tests/build
git commit -m "test: add failed real-runtime surface captures"
```

---

### Task 3: Replace false-confidence synthetic tests with real-DOM contracts

**Files:**
- Create: `tests/fixtures/jf-10.11.11/player/real-player.html`
- Create: `tests/fixtures/jf-10.11.11/media-bar/real-home.html`
- Create: `tests/fixtures/jf-10.11.11/navigation/real-tvshows.html`
- Create: `tests/fixtures/jf-10.11.11/details/real-movie.html`
- Create: `tests/fixtures/jf-10.11.11/details/real-series.html`
- Create: `tests/visual/runtime-player.spec.mjs`
- Create: `tests/visual/runtime-media-bar.spec.mjs`
- Create: `tests/visual/runtime-navigation.spec.mjs`
- Create: `tests/visual/runtime-details.spec.mjs`
- Modify: `tests/visual/treasure-map.spec.mjs`

**Interfaces:**
- Consumes: Sanitized captures from Task 2.
- Produces: Fixture contracts whose names explicitly say they validate captured Jellyfin 10.11.11 DOM, not arbitrary real servers.

- [ ] **Step 1: Build fixtures by preserving captured hierarchy**

Copy only the sanitized hierarchy/classes/attributes required for the failing states. Do not invent alternate wrappers to make selectors convenient.

- [ ] **Step 2: Write RED player leakage assertions**

```js
test('captured 10.11.11 player does not receive Harbor browsing surface', async ({ page }) => {
  await loadFixture(page, 'tests/fixtures/jf-10.11.11/player/real-player.html');
  const player = page.locator('.videoPlayerContainer').first();
  const style = await player.evaluate((el) => getComputedStyle(el));
  expect(style.backgroundImage).not.toContain('cartography');
  expect(await page.locator('.osdHeader .pageTitle').evaluate((el) => getComputedStyle(el, '::after').content)).not.toContain('ElganFlix');
});
```

Run and expect FAIL against the current candidate.

- [ ] **Step 3: Write RED Media Bar mechanic assertions**

Assert captured `.backdrop` and `.video-backdrop` remain visible and that `.dot`/pagination dimensions are not forced to Harbor's generic 2.5rem control size.

- [ ] **Step 4: Write RED navigation assertion**

Assert the captured active TV Shows element resolves to Harbor brass/navy and not `#e50914`/`rgb(229, 9, 20)`.

- [ ] **Step 5: Write RED details contrast assertions**

Assert captured Next Up/Seasons/secondary headings have readable foreground/background contrast and that the backdrop remains visible.

- [ ] **Step 6: Rename/relax inaccurate global claims in old tests**

Change wording such as `player never receives cartography` to `captured Jellyfin 10.11.11 player fixture does not receive cartography`. Do not weaken behavioral assertions.

- [ ] **Step 7: Commit only the RED fixture-contract layer**

```bash
git add tests/fixtures/jf-10.11.11 tests/visual
git commit -m "test: model failed Jellyfin runtime surfaces"
```

---

### Task 4: Fix P0 player isolation before any cosmetic work

**Files:**
- Modify: `src/css/base/map-surface.css`
- Modify: `src/css/base/texture.css` only if capture proves leakage originates there
- Modify: `src/css/components/branding.css`
- Modify: `src/css/pages/player.css`
- Test: `tests/visual/runtime-player.spec.mjs`
- Test: `tests/build/pirate-polish-contract.test.mjs`

**Interfaces:**
- Consumes: Real captured player selectors from Tasks 2-3.
- Produces: A player where Harbor presentation is opt-in cosmetic styling and browsing surfaces/branding cannot match the OSD or video surface.

- [ ] **Step 1: Run the player test alone and verify RED**

```bash
npx playwright test tests/visual/runtime-player.spec.mjs --project=desktop
```

Expected: FAIL showing parchment/cartography or ElganFlix pseudo-branding on the captured player DOM.

- [ ] **Step 2: Narrow the originating browsing selectors**

Prefer exclusions at the source, for example only after the real root is known:

```css
.libraryPage:not(#itemDetailPage):not(.videoPlayerPage) { /* browsing cosmetics */ }
```

Do not add a broad player reset that tries to undo dozens of browsing properties.

- [ ] **Step 3: Restrict branding to the confirmed application browsing header**

If the captured OSD shares `.skinHeader`, add the smallest verified page-state exclusion to the branding selector. Keep pseudo branding out of `.osdHeader` by selector scope rather than reset rules.

- [ ] **Step 4: Ensure `player.css` is cosmetic-only**

It may color native controls/focus states but must not set video/background artwork mechanics or OSD geometry.

- [ ] **Step 5: Run focused player tests on desktop and mobile**

```bash
npx playwright test tests/visual/runtime-player.spec.mjs tests/visual/system-pages.spec.mjs
```

Expected: PASS.

- [ ] **Step 6: Run geometry lint and core gate**

```bash
npm run lint:geometry
npm run verify:core
```

Expected: PASS.

- [ ] **Step 7: Perform real-server player owner gate**

Validate in Chrome/Edge and Jellyfin Media Player:

```text
playing: video visible, no parchment, no ElganFlix wordmark
paused: OSD visible, native geometry intact, no parchment, no ElganFlix wordmark
```

Stop if browser/app disagree.

- [ ] **Step 8: Commit**

```bash
git add src/css tests/visual/runtime-player.spec.mjs tests/build
git commit -m "fix: isolate Harbor from playback surfaces"
```

---

### Task 5: Repair Media Bar mechanics and blend the hero without owning geometry

**Files:**
- Modify: `src/css/integrations/media-bar-enhanced.css`
- Modify: `src/css/pages/home.css`
- Modify: `scripts/check-geometry-ownership.mjs`
- Test: `tests/visual/runtime-media-bar.spec.mjs`
- Test: `tests/build/media-bar-validation-profile.test.mjs`

**Interfaces:**
- Consumes: Real Media Bar capture and Task 1 settings profile.
- Produces: Visible backdrop/trailer, plugin-native controls/pagination, and a cosmetic hero-to-parchment transition.

- [ ] **Step 1: Run the captured Media Bar test and verify RED**

```bash
npx playwright test tests/visual/runtime-media-bar.spec.mjs --project=desktop
```

- [ ] **Step 2: Remove generic control geometry from plugin dots/pagination**

The current integration assigns `min-width` and `min-height` to `.dot`; remove sizing from dots and any other plugin-native indicator. Extend the geometry guard so Media Bar pagination/control mechanic selectors cannot receive width/height/min-width/min-height from Harbor.

- [ ] **Step 3: Diagnose the black hero from matched-rule evidence**

Change `.backdrop`, `.video-backdrop`, overlays, or parent backgrounds only if the capture identifies a Harbor rule obscuring media. Never replace plugin `background-image`, video source, opacity state, or positioning blindly.

- [ ] **Step 4: Keep the seam cosmetic**

Use shadow/gradient treatment that does not change `#slides-container` height, plugin offsets, or `.homeSectionsContainer` position.

- [ ] **Step 5: Run Media Bar fixture tests with plugin CSS loaded after Harbor**

```bash
npx playwright test tests/visual/runtime-media-bar.spec.mjs tests/visual/media-bar.spec.mjs
```

Expected: PASS.

- [ ] **Step 6: Apply the Task 1 settings profile on the real server and validate**

Confirm static backdrop is visible during the 2000 ms delay, then trailer/video appears when available, controls remain normally sized, and the parchment transition does not obscure the media.

- [ ] **Step 7: Optional animation re-enable gate**

Only after browser and Jellyfin Media Player pass with animations OFF, turn `Enable Slide Animations` ON and repeat Home/Media Bar validation. If it reintroduces composition problems, leave it OFF for the Harbor recommended profile.

- [ ] **Step 8: Commit**

```bash
git add src/css/integrations/media-bar-enhanced.css src/css/pages/home.css scripts/check-geometry-ownership.mjs tests
git commit -m "fix: respect Media Bar runtime mechanics"
```

---

### Task 6: Fix real selected navigation states without reworking the library

**Files:**
- Modify: `src/css/components/navigation.css`
- Test: `tests/visual/runtime-navigation.spec.mjs`

**Interfaces:**
- Consumes: Captured red TV Shows element and matched-rule source.
- Produces: Distinct brass selected states for global and library-local navigation without changing tab geometry.

- [ ] **Step 1: Verify RED**

```bash
npx playwright test tests/visual/runtime-navigation.spec.mjs
```

- [ ] **Step 2: Add only the captured selected-state selector**

Use the real class/attribute from the capture. Do not add speculative selectors. Presentation target:

```text
background: deep Harbor navy
selected indicator/border: Harbor brass
text: warm parchment
red: absent except tiny ElganFlix brand signal
```

- [ ] **Step 3: Preserve two levels of navigation hierarchy**

Global Home/Favorites/Shows/Movies should read stronger than library-local TV Shows/Suggestions/Favorites/Upcoming/Genres/Networks/Episodes through color/typography only, not dimensions or positioning.

- [ ] **Step 4: Run library and navigation tests**

```bash
npx playwright test tests/visual/runtime-navigation.spec.mjs tests/visual/content-pages.spec.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/css/components/navigation.css tests/visual/runtime-navigation.spec.mjs
git commit -m "fix: cover real Jellyfin selected tabs"
```

---

### Task 7: Rebuild details presentation against real movie and series DOM

**Files:**
- Modify: `src/css/pages/details.css`
- Modify: `src/css/components/headings.css` only if shared contrast behavior is proven relevant
- Modify: `src/css/components/metadata.css` only if shared metadata styling is proven relevant
- Test: `tests/visual/runtime-details.spec.mjs`

**Interfaces:**
- Consumes: Real movie and series detail fixtures.
- Produces: Cinematic identity, captain's-log information treatment, and parchment browsing transition without changing detail geometry.

- [ ] **Step 1: Verify RED details assertions**

```bash
npx playwright test tests/visual/runtime-details.spec.mjs
```

- [ ] **Step 2: Preserve backdrop visibility**

Remove or narrow any Harbor background/overlay that hides the native `.itemBackdrop`. Do not change its position, dimensions, image source, or transform.

- [ ] **Step 3: Build the cinematic identity layer cosmetically**

Use text color, shadows, borders, non-sizing gradients, and typography on existing title/metadata/action elements.

- [ ] **Step 4: Build the captain's-log layer cosmetically**

Style the existing overview/metadata containers as an aged logbook inset without forcing a new grid or flex arrangement.

- [ ] **Step 5: Fix secondary-section contrast**

Ensure Next Up, Seasons, Cast, Episodes, and More Like This heading states use dark ink on parchment or parchment on dark navy. Add an automated contrast threshold check for the captured states.

- [ ] **Step 6: Run movie, series, mobile, and 200% zoom fixture tests**

```bash
npx playwright test tests/visual/runtime-details.spec.mjs tests/visual/content-pages.spec.mjs
```

- [ ] **Step 7: Commit**

```bash
git add src/css/pages/details.css src/css/components tests/visual/runtime-details.spec.mjs
git commit -m "feat: rebuild captain dossier on real details DOM"
```

---

### Task 8: Reduce JavaScript Injector to a minimal Streaming Services DOM adapter

**Files:**
- Create: `docs/integrations/streaming-services-injector.js`
- Modify: `src/css/integrations/streaming-services.css`
- Create: `tests/build/streaming-services-injector.test.mjs`
- Create: `tests/visual/runtime-streaming-services.spec.mjs`

**Interfaces:**
- Consumes: Confirmed `.homeSectionsContainer` runtime contract.
- Produces: `window.HarborStreamingServices.mount()` and `unmount()` behavior that only creates/removes external service-link DOM.

- [ ] **Step 1: Write RED injector-scope tests**

Assert the script contains no style assignments and no Media Bar/player/navigation selectors:

```js
test('Streaming Services injector is DOM-only', async () => {
  const source = await readFile('docs/integrations/streaming-services-injector.js', 'utf8');
  assert.doesNotMatch(source, /\.style\b|style=|#slides-container|videoPlayer|osdHeader|pageTitle/u);
  assert.match(source, /homelabStreamingHub/u);
  assert.match(source, /homeSectionsContainer/u);
});
```

- [ ] **Step 2: Implement the minimal script**

Use this structure as the implementation target:

```js
(() => {
  'use strict';

  const SERVICES = [
    ['Netflix', 'https://www.netflix.com/'],
    ['Prime Video', 'https://www.primevideo.com/'],
    ['Disney+', 'https://www.disneyplus.com/'],
    ['Max', 'https://www.max.com/'],
  ];

  function isHome() {
    return !!document.querySelector('.homeSectionsContainer');
  }

  function createHub() {
    const section = document.createElement('section');
    section.id = 'homelabStreamingHub';
    section.setAttribute('aria-labelledby', 'harborStreamingTitle');

    const heading = document.createElement('h2');
    heading.id = 'harborStreamingTitle';
    heading.className = 'stream-title';
    heading.textContent = 'Streaming Services';

    const row = document.createElement('div');
    row.className = 'stream-row';

    for (const [name, url] of SERVICES) {
      const link = document.createElement('a');
      link.className = 'stream-card';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Open ${name}`);

      const label = document.createElement('span');
      label.className = 'service-logo';
      label.textContent = name;
      link.append(label);
      row.append(link);
    }

    section.append(heading, row);
    return section;
  }

  function mount() {
    const host = document.querySelector('.homeSectionsContainer');
    if (!host || document.getElementById('homelabStreamingHub')) return;
    host.prepend(createHub());
  }

  function unmount() {
    document.getElementById('homelabStreamingHub')?.remove();
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (isHome()) mount();
      else unmount();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  mount();

  window.HarborStreamingServices = { mount, unmount };
})();
```

If Task 2 proves the home section persists across SPA navigation without an observer, remove the observer and use the simpler mount-only form. YAGNI wins.

- [ ] **Step 3: Make CSS own all layout/presentation of the custom section**

`streaming-services.css` may size and lay out `.stream-row`/`.stream-card` because they are Harbor-created elements, but it must not alter `.homeSectionsContainer` geometry. Reduce card scale so Streaming Services is secondary to Continue Watching/Recently Added.

- [ ] **Step 4: Run injector and visual tests**

```bash
node --test tests/build/streaming-services-injector.test.mjs
npx playwright test tests/visual/runtime-streaming-services.spec.mjs
```

Expected: PASS.

- [ ] **Step 5: Document zero-JS alternative without changing V2 behavior**

Document Jellyfin native `menuLinks` as the supported alternative for users willing to move external links into navigation and remove the home row. Do not implement a Harbor companion plugin in V2.

- [ ] **Step 6: Commit**

```bash
git add docs/integrations/streaming-services-injector.js src/css/integrations/streaming-services.css tests
git commit -m "refactor: isolate Streaming Services injector"
```

---

### Task 9: Home hierarchy polish after the functional surfaces pass

**Files:**
- Modify: `src/css/pages/home.css`
- Modify: `src/css/components/headings.css`
- Modify: `src/css/integrations/streaming-services.css`
- Test: `tests/visual/runtime-streaming-services.spec.mjs`
- Test: `tests/visual/home.spec.mjs`

**Interfaces:**
- Consumes: Working Media Bar and minimal Streaming Services integration.
- Produces: A balanced home page where Jellyfin content is primary and external services are secondary.

- [ ] **Step 1: Write RED hierarchy assertions**

Assert Streaming Services cards do not exceed the intended custom-section size token and section headings are not styled like filled action buttons.

- [ ] **Step 2: Reduce service-card emphasis**

Use smaller Harbor-owned custom card dimensions and restrained brass/navy styling. Do not change native Jellyfin media card geometry.

- [ ] **Step 3: Reduce section-heading plaque weight**

Use ink/brass typography and a subtle divider/underline instead of filled parchment-button treatment where the real home capture shows clunky plaques.

- [ ] **Step 4: Run home tests**

```bash
npx playwright test tests/visual/home.spec.mjs tests/visual/runtime-streaming-services.spec.mjs tests/visual/runtime-media-bar.spec.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/css/pages/home.css src/css/components/headings.css src/css/integrations/streaming-services.css tests/visual
git commit -m "style: rebalance Harbor home hierarchy"
```

---

### Task 10: Credibility audit, cross-client owner matrix, and release candidate

**Files:**
- Modify: `docs/compatibility.md`
- Modify: `docs/testing/manual-matrix.md`
- Modify: `CHANGELOG.md`
- Modify: `README.md` only after owner validation supports the claims
- Modify: `theme.css` generated output only through the normal build/publish process

**Interfaces:**
- Consumes: Passing Tasks 1-9.
- Produces: An immutable release candidate with evidence-separated automated and real-server validation.

- [ ] **Step 1: Audit every runtime claim in tests/docs**

Classify claims as:

```text
synthetic presentation contract
captured Jellyfin 10.11.11 DOM contract
real-server browser validated
real-server Jellyfin Media Player validated
```

Remove wording that promotes fixture coverage into universal runtime proof.

- [ ] **Step 2: Run the complete automated gate**

```bash
npm run verify:core
npm run check:publication
npm run test:visual
```

Expected: all runnable tests PASS; intentional skips documented.

- [ ] **Step 3: Run the real-server owner matrix on the exact candidate SHA**

Validate:

```text
Home without Media Bar
Home with static Media Bar backdrop
Home with trailer playing
Streaming Services
Movies library
TV Shows active local tab
movie details
series details
player playing
player paused with OSD
menu/dialog
mobile/narrow web
200% zoom where applicable
```

Run browser and Jellyfin Media Player against the same commit.

- [ ] **Step 4: Independent spec-compliance review**

Review for missing requirements, especially player isolation, Media Bar ownership, JS injector scope, selected red state, details contrast, and home hierarchy.

- [ ] **Step 5: Independent code-quality/cascade review**

Review selector breadth, `!important`, protected geometry, background/media mechanics, accessibility, plugin/client differences, publication privacy, and stale ElganFlix red rules.

- [ ] **Step 6: Fix review findings and rerun focused + complete gates**

No review finding is closed by weakening tests.

- [ ] **Step 7: Generate and commit the exact `theme.css` candidate**

Use the established generated-artifact workflow, restore CI to `contents: read`, and run one final clean CI job on the immutable SHA.

- [ ] **Step 8: Only after the owner matrix passes, prepare stable release/tag**

Do not tag if any browser/app surface still differs from the validated fixture or if the user has unresolved visual objections.
