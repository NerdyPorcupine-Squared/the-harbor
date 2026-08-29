# Harbor RC2 UX Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an RC2 candidate that preserves working Media Bar/playback behavior while correcting Home hierarchy/navigation, detail-page composition, and browsing-card framing.

**Architecture:** Branch implementation from frozen RC1 `21b3ca6c0bdbcf6ba0aaf75e4d1a99abae5e31ab`. Keep Home ordering and Home navigation as separate idempotent adapters, and keep all visual work presentation-only so Jellyfin/plugin geometry remains authoritative. Every confirmed runtime mismatch gets a failing sanitized automated contract before production changes.

**Tech Stack:** Node.js >=20, vanilla JavaScript DOM adapters, CSS, Playwright 1.62.1, repository build/geometry/publication scripts, Jellyfin 10.11.11 fixtures.

**Spec:** `docs/superpowers/specs/2026-08-29-rc2-ux-remediation-design.md`

## Global Constraints

- RC1 `21b3ca6c0bdbcf6ba0aaf75e4d1a99abae5e31ab` remains immutable.
- Implementation branch: `feat/rc2-ux-remediation`, cut directly from frozen RC1.
- Do not commit owner screenshots or real media/library/server/account data.
- Root `theme.css` is generated only through `npm run build:css`.
- Jellyfin owns card/page/player/Media Bar geometry.
- Media Bar/trailer behavior is preserved, not redesigned.
- Playback production CSS is unchanged unless a new failing regression proves a required fix.
- New JavaScript adapters must be idempotent and fail closed when runtime cues are unavailable.

---

### Task 1: Reproduce and fix Home section hierarchy

**Files:**
- Create: `tests/fixtures/jellyfin/home-ordering.html`
- Create: `tests/visual/home-ordering.spec.mjs`
- Modify: `integrations/streaming-services.js`
- Modify: `publication-manifest.json`

**Interfaces:**
- Consumes: existing Streaming Services adapter entrypoint IIFE and `#homelabStreamingHub` custom section.
- Produces: Home order `Streaming Services -> My Media -> Continue Watching -> remaining native sections`, with rerender idempotence.

- [ ] **Step 1: Add a Jellyfin-like ordering fixture**

Create `tests/fixtures/jellyfin/home-ordering.html` containing a `.homeSectionsContainer` with these native sections in this initial order:

```html
<section class="verticalSection homeSection" data-harbor-fixture-section="my-media">
  <div class="sectionTitleContainer"><h2 class="sectionTitle">My Media</h2></div>
  <div class="itemsContainer">
    <a class="card" href="#movies">Movies</a>
    <a class="card" href="#shows">TV Shows</a>
  </div>
</section>
<section class="verticalSection homeSection" data-harbor-fixture-section="resume">
  <div class="sectionTitleContainer"><h2 class="sectionTitle">Continue Watching</h2></div>
  <div class="itemsContainer" data-monitor="videoplayback-progress"></div>
</section>
<section class="verticalSection homeSection" data-harbor-fixture-section="latest">
  <div class="sectionTitleContainer"><h2 class="sectionTitle">Latest</h2></div>
  <div class="itemsContainer"></div>
</section>
```

Load `../../../theme.css` but do not hard-code or pre-create the Harbor Streaming Services hub.

- [ ] **Step 2: Write the failing executable ordering test**

Create `tests/visual/home-ordering.spec.mjs` using `page.addScriptTag({ path: .../integrations/streaming-services.js })` and assert:

```js
const labels = await page.locator('.homeSectionsContainer > .verticalSection').evaluateAll((sections) =>
  sections.map((section) =>
    section.id === 'homelabStreamingHub'
      ? 'streaming'
      : section.dataset.harborFixtureSection,
  ),
);
expect(labels).toEqual(['streaming', 'my-media', 'resume', 'latest']);
expect(await page.locator('#homelabStreamingHub').count()).toBe(1);
```

Then replace `.homeSectionsContainer` inner content with a fresh My Media / Continue Watching / Latest sequence and assert the adapter restores the same order with exactly one `#homelabStreamingHub`.

- [ ] **Step 3: Run the focused test and prove RED**

Run:

```bash
npx playwright test tests/visual/home-ordering.spec.mjs --project=desktop
```

Expected: FAIL because the RC1 adapter moves Continue Watching directly after Streaming Services, leaving My Media after Continue Watching or otherwise violating the exact desired sequence.

- [ ] **Step 4: Implement semantic My Media detection**

In `integrations/streaming-services.js`, add a helper that finds the native My Media section without private IDs:

```js
function findMyMediaSection(container) {
  return [...container.querySelectorAll(':scope > .verticalSection')].find((section) => {
    const heading = section.querySelector('.sectionTitle');
    if (!heading) return false;
    const text = heading.textContent?.trim().toLowerCase();
    if (text === 'my media') return true;

    const links = [...section.querySelectorAll('a[href]')];
    const hasMovieCue = links.some((link) => /movie/i.test(link.textContent ?? ''));
    const hasTvCue = links.some((link) => /tv|show|series/i.test(link.textContent ?? ''));
    return hasMovieCue && hasTvCue;
  }) ?? null;
}
```

Update `ensureHomeOrder()` so:

1. Harbor hub is first.
2. My Media, when found, is immediately after Harbor hub.
3. Continue Watching, when found, is immediately after My Media, otherwise immediately after Harbor hub.
4. No other native sections are reordered.

- [ ] **Step 5: Run the focused test and prove GREEN**

Run:

```bash
npx playwright test tests/visual/home-ordering.spec.mjs --project=desktop
```

Expected: PASS.

- [ ] **Step 6: Add new fixture/test paths to the publication manifest**

Add `tests/fixtures/jellyfin/home-ordering.html` and `tests/visual/home-ordering.spec.mjs` to `publication-manifest.json` in sorted order.

- [ ] **Step 7: Run publication and existing Streaming adapter tests**

Run:

```bash
node --test tests/build/streaming-services-adapter.test.mjs
npm run check:publication
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/fixtures/jellyfin/home-ordering.html tests/visual/home-ordering.spec.mjs integrations/streaming-services.js publication-manifest.json
git commit -m "fix: enforce Harbor Home section hierarchy"
```

---

### Task 2: Enlarge Streaming Services and detach Home heading plaques

**Files:**
- Modify: `src/css/integrations/streaming-services.css`
- Modify: `src/css/pages/home.css`
- Modify: `tests/visual/home-ordering.spec.mjs`
- Modify: `tests/visual/treasure-map.spec.mjs`

**Interfaces:**
- Consumes: Task 1 fixture/order.
- Produces: larger custom Streaming cards and detached compact Home title plaques without page/grid ownership.

- [ ] **Step 1: Add failing computed-style assertions for Streaming card scale**

Extend `home-ordering.spec.mjs` to evaluate the first `.stream-card` and assert desktop values:

```js
const box = await page.locator('.stream-card').first().boundingBox();
expect(box).not.toBeNull();
expect(box.width).toBeGreaterThanOrEqual(220);
expect(box.height).toBeGreaterThanOrEqual(84);
```

Also assert `.service-logo` computed `fontSize` is at least `17px` at the 1440px desktop viewport.

- [ ] **Step 2: Add failing Home heading plaque assertions**

In the same test, measure the My Media and Continue Watching `.sectionTitle` boxes and computed styles:

```js
for (const sectionName of ['my-media', 'resume']) {
  const title = page.locator(`[data-harbor-fixture-section="${sectionName}"] .sectionTitle`);
  const box = await title.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(16);
  const style = await title.evaluate((element) => getComputedStyle(element));
  expect(Number.parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(8);
  expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
}
```

- [ ] **Step 3: Run focused test and prove RED**

Run:

```bash
npx playwright test tests/visual/home-ordering.spec.mjs --project=desktop
```

Expected: FAIL because RC1 custom cards are only `10rem–14rem` wide / `4rem` high and native Home headings do not have the required detached offset in the new fixture.

- [ ] **Step 4: Enlarge custom Streaming cards**

Update `src/css/integrations/streaming-services.css`:

```css
#homelabStreamingHub .stream-row {
  grid-template-columns: repeat(auto-fit, minmax(14rem, 20rem));
  gap: 1rem;
}

#homelabStreamingHub .stream-card {
  min-height: 5.5rem;
  gap: 0.9rem;
  padding: 1rem 1.15rem;
  border-radius: var(--harbor-radius-md);
}

#homelabStreamingHub .service-logo {
  font-size: 1.1rem;
}
```

For `@media (max-width: 34rem)`, retain one-column layout and set `min-height: 4.75rem` so mobile remains compact.

- [ ] **Step 5: Add Home-only detached plaque presentation**

In `src/css/pages/home.css`, keep `.homeSectionsContainer` geometry untouched and style only titles:

```css
.homeSectionsContainer > .homeSection .sectionTitle,
.homeSectionsContainer > .verticalSection .sectionTitle {
  border: var(--harbor-papyrus-border);
  border-radius: 999px;
  padding: var(--harbor-space-2) var(--harbor-space-4);
  margin-inline-start: var(--harbor-space-4);
  background-color: var(--harbor-parchment-100);
  background-image: var(--harbor-papyrus-image);
  box-shadow: var(--harbor-papyrus-edge), var(--harbor-shadow-parchment);
}
```

Retain the existing ink color and avoid applying width/position/transform to Home sections or containers.

- [ ] **Step 6: Run focused desktop and mobile tests**

Run:

```bash
npx playwright test tests/visual/home-ordering.spec.mjs --project=desktop
npx playwright test tests/visual/home-ordering.spec.mjs --project=mobile
```

Expected: PASS with no horizontal overflow.

- [ ] **Step 7: Run geometry ownership**

Run:

```bash
npm run lint:geometry
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/css/integrations/streaming-services.css src/css/pages/home.css tests/visual/home-ordering.spec.mjs tests/visual/treasure-map.spec.mjs
git commit -m "style: rebalance Harbor Home hierarchy"
```

---

### Task 3: Add narrow Home global navigation adapter

**Files:**
- Create: `integrations/home-navigation.js`
- Create: `tests/fixtures/jellyfin/home-navigation.html`
- Create: `tests/visual/home-navigation.spec.mjs`
- Modify: `src/css/components/navigation.css`
- Modify: `README.md`
- Modify: `publication-manifest.json`

**Interfaces:**
- Consumes: native header tab container and discoverable native Movies/TV library anchors.
- Produces: idempotent Home header `Home | Movies | TV Shows | Favorites`; no route invention.

- [ ] **Step 1: Add sanitized navigation fixture**

Create `home-navigation.html` with:

```html
<header class="skinHeader">
  <nav class="headerTabs" aria-label="Global">
    <a class="emby-tab-button emby-tab-button-active" href="#/home.html">Home</a>
    <a class="emby-tab-button" href="#/favorites.html">Favorites</a>
  </nav>
</header>
<aside hidden>
  <a data-native-library-kind="movies" href="#/movies.html?topParentId=movies-fixture">Movies</a>
  <a data-native-library-kind="tv" href="#/tv.html?topParentId=tv-fixture">TV Shows</a>
</aside>
```

The IDs in fixture URLs are synthetic and must not correspond to real server IDs.

- [ ] **Step 2: Write failing navigation behavior test**

Create `home-navigation.spec.mjs` and inject the future adapter. Assert:

```js
await expect(page.locator('.headerTabs .emby-tab-button')).toHaveText([
  'Home', 'Movies', 'TV Shows', 'Favorites',
]);
expect(await page.locator('.headerTabs a').nth(1).getAttribute('href'))
  .toBe('#/movies.html?topParentId=movies-fixture');
expect(await page.locator('.headerTabs a').nth(2).getAttribute('href'))
  .toBe('#/tv.html?topParentId=tv-fixture');
```

Re-run the adapter script and mutate/recreate `.headerTabs`; assert no duplicate Movies/TV tabs after observer recovery.

Add a second test that removes the native library anchors before injection and asserts the header remains exactly `Home | Favorites`.

- [ ] **Step 3: Run focused test and prove RED**

Run:

```bash
npx playwright test tests/visual/home-navigation.spec.mjs --project=desktop
```

Expected: FAIL because `integrations/home-navigation.js` does not exist.

- [ ] **Step 4: Implement fail-closed navigation discovery**

Create `integrations/home-navigation.js` with an IIFE. Implement helpers:

```js
const HEADER_SELECTOR = '.skinHeader .headerTabs';
const INJECTED_ATTR = 'data-harbor-global-nav';

function normalize(text) {
  return text?.trim().toLowerCase() ?? '';
}

function discoverLibraryHref(kind) {
  const candidates = [...document.querySelectorAll('a[href]')];
  const patterns = kind === 'movies'
    ? [/^movies?$/i, /movie/i]
    : [/^tv shows?$/i, /^shows?$/i, /series/i];

  return candidates.find((anchor) =>
    patterns.some((pattern) => pattern.test(anchor.textContent?.trim() ?? '')) &&
    !anchor.closest('.headerTabs')
  )?.getAttribute('href') ?? null;
}
```

`ensureGlobalNav()` must:

1. Return if `.headerTabs` is absent.
2. Remove stale Harbor-injected duplicates.
3. Discover both destinations. If either is missing, leave the native header unchanged.
4. Find native Home and Favorites tabs by visible text.
5. Insert native-compatible anchor clones for Movies and TV Shows between Home and Favorites with `data-harbor-global-nav="movies"` / `"tv"`.
6. Preserve native Home/Favorites nodes.

Use a single `MutationObserver` with microtask coalescing, matching the Streaming Services adapter pattern.

- [ ] **Step 5: Add navigation styling only if needed**

In `src/css/components/navigation.css`, add presentation for `[data-harbor-global-nav]` using the existing `.emby-tab-button` vocabulary only. Do not add structural width/position properties to `.headerTabs` or `.skinHeader`.

- [ ] **Step 6: Document optional adapter**

Add a README subsection explaining that `integrations/home-navigation.js` is an optional JavaScript Injector adapter that derives Movies/TV destinations from existing native links and fails closed when they cannot be discovered.

- [ ] **Step 7: Add files to publication manifest**

Add the adapter, fixture, and visual test in sorted order.

- [ ] **Step 8: Run focused tests, publication, and geometry checks**

Run:

```bash
npx playwright test tests/visual/home-navigation.spec.mjs --project=desktop
npm run lint:geometry
npm run check:publication
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add integrations/home-navigation.js tests/fixtures/jellyfin/home-navigation.html tests/visual/home-navigation.spec.mjs src/css/components/navigation.css README.md publication-manifest.json
git commit -m "feat: add Harbor Home navigation adapter"
```

---

### Task 4: Recompose movie/series details and remove double-box secondary cards

**Files:**
- Modify: `tests/fixtures/jellyfin/details.html`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `tests/visual/treasure-map.spec.mjs`
- Modify: `src/css/pages/details.css`

**Interfaces:**
- Consumes: existing Jellyfin details fixture and native detail containers.
- Produces: centered identity cluster, left-aligned supporting prose, single-frame Next Up/Seasons cards, quieter Cast & Crew.

- [ ] **Step 1: Extend sanitized detail fixture structure**

Ensure the fixture contains within `#itemDetailPage`:

```html
<div class="detailPagePrimaryContent">
  <div class="nameContainer"><h1 class="itemName">Fixture Title</h1></div>
  <div class="itemMiscInfo"><span class="mediaInfoItem">2026</span><span class="mediaInfoItem">PG</span></div>
  <div class="mainDetailButtons"><button class="button-submit">Play</button><button class="button-flat">More</button></div>
  <div class="overview">Fixture overview text remains readable and left aligned.</div>
</div>
<div class="detailPageSecondaryContainer">
  <section id="nextUpCollapsible" class="detailVerticalSection">
    <h2 class="sectionTitle">Next Up</h2>
    <article class="card"><div class="cardScalable"><div class="cardImageContainer"></div></div><div class="cardText">Episode</div></article>
  </section>
  <section id="seasonsCollapsible" class="detailVerticalSection">
    <h2 class="sectionTitle">Seasons</h2>
    <article class="card"><div class="cardScalable"><div class="cardImageContainer"></div></div><div class="cardText">Season 1</div></article>
  </section>
  <section id="castCollapsible" class="detailVerticalSection">
    <h2 class="sectionTitle">Cast & Crew</h2>
    <article class="card"><div class="cardScalable"><div class="cardImageContainer"></div></div><div class="cardText">Fixture Person</div></article>
  </section>
</div>
```

- [ ] **Step 2: Add failing composition assertions**

In `content-pages.spec.mjs`, assert:

```js
const identitySelectors = ['.nameContainer', '.itemMiscInfo', '.mainDetailButtons'];
for (const selector of identitySelectors) {
  const style = await page.locator(`#itemDetailPage ${selector}`).evaluate((element) => getComputedStyle(element));
  expect(style.textAlign).toBe('center');
}
const overview = await page.locator('#itemDetailPage .overview').evaluate((element) => getComputedStyle(element));
expect(overview.textAlign).toBe('left');
```

For Next Up and Seasons `.cardText`, assert the background is transparent or sufficiently non-opaque and that the card uses only one visible framing layer. For Cast & Crew heading, assert lower opacity/color contrast than the Next Up heading.

- [ ] **Step 3: Run focused tests and prove RED**

Run:

```bash
npx playwright test tests/visual/content-pages.spec.mjs --project=desktop
```

Expected: FAIL on centered identity and/or secondary card presentation.

- [ ] **Step 4: Center only the identity cluster**

In `src/css/pages/details.css` add:

```css
#itemDetailPage :where(.nameContainer, .itemMiscInfo, .mainDetailButtons) {
  text-align: center;
}

#itemDetailPage .itemMiscInfo,
#itemDetailPage .mainDetailButtons {
  justify-content: center;
}

#itemDetailPage :where(.overview, .itemDetailsGroup) {
  text-align: left;
}
```

Only apply `justify-content` if the actual fixture/runtime elements are native flex containers and the geometry linter permits it. If the linter treats those classes as protected, use text alignment and child margins instead, preserving Jellyfin structural ownership.

- [ ] **Step 5: Simplify Next Up and Seasons labels**

Add detail-specific rules:

```css
#itemDetailPage :where(#nextUpCollapsible, #seasonsCollapsible) .cardText,
#itemDetailPage :where(#nextUpCollapsible, #seasonsCollapsible) .cardText-secondary {
  background: transparent;
  box-shadow: none;
  color: var(--harbor-map-ink);
}

#itemDetailPage :where(#nextUpCollapsible, #seasonsCollapsible) .cardScalable {
  box-shadow:
    0 0 0 2px rgb(120 82 43 / 54%),
    0 0.45rem 1rem rgb(42 33 24 / 24%);
}
```

Do not add border widths or sizing to protected card structures.

- [ ] **Step 6: De-emphasize Cast & Crew**

Add:

```css
#itemDetailPage #castCollapsible {
  color: rgb(58 45 33 / 72%);
}

#itemDetailPage #castCollapsible .sectionTitle {
  color: rgb(58 45 33 / 74%);
  box-shadow: none;
}

#itemDetailPage #castCollapsible .cardScalable {
  box-shadow: 0 0 0 1px rgb(120 82 43 / 28%);
}
```

Keep all cards and links present.

- [ ] **Step 7: Run focused tests and geometry ownership**

Run:

```bash
npx playwright test tests/visual/content-pages.spec.mjs --project=desktop
npm run lint:geometry
```

Expected: PASS.

- [ ] **Step 8: Run mobile detail visual tests**

Run:

```bash
npx playwright test tests/visual/content-pages.spec.mjs --project=mobile
```

Expected: PASS with no horizontal overflow.

- [ ] **Step 9: Commit**

```bash
git add tests/fixtures/jellyfin/details.html tests/visual/content-pages.spec.mjs tests/visual/treasure-map.spec.mjs src/css/pages/details.css
git commit -m "style: clean up Harbor detail composition"
```

---

### Task 5: Strengthen browsing-card frame without taking geometry ownership

**Files:**
- Modify: `src/css/components/cards.css`
- Modify: `tests/visual/runtime-cards.spec.mjs`
- Modify: `tests/visual/treasure-map.spec.mjs`

**Interfaces:**
- Consumes: Jellyfin-native `.cardScalable` geometry.
- Produces: clearly visible resting brass/timber frame plus stronger hover/focus/selected frame.

- [ ] **Step 1: Add failing frame-strength assertions**

In `runtime-cards.spec.mjs`, read `.cardScalable` computed `boxShadow` at rest and after focus. Assert resting shadow contains a brass RGB component with opacity/strength exceeding the RC1 fixture expectation and contains at least two comma-separated shadow layers. Assert focused shadow has a stronger outer line than resting state.

A robust assertion example:

```js
const resting = await card.evaluate((element) => getComputedStyle(element).boxShadow);
expect(resting.split('),').length).toBeGreaterThanOrEqual(2);
expect(resting).toContain('184, 148, 75');
```

- [ ] **Step 2: Run focused test and prove RED**

Run:

```bash
npx playwright test tests/visual/runtime-cards.spec.mjs --project=desktop
```

Expected: FAIL on the strengthened frame contract.

- [ ] **Step 3: Strengthen non-sizing card frame**

Update `src/css/components/cards.css` resting frame to:

```css
.cardScalable {
  border-radius: var(--harbor-radius-md);
  box-shadow:
    0 0 0 2px rgb(184 148 75 / 66%),
    0 0 0 3px rgb(42 33 24 / 24%),
    0 0.45rem 1.1rem rgb(42 33 24 / 32%);
}
```

Update hover/focus/selected states with the same three-layer vocabulary at stronger brass opacity, without `transform`, border-width, padding, width, or height changes.

- [ ] **Step 4: Run focused desktop/mobile tests**

Run:

```bash
npx playwright test tests/visual/runtime-cards.spec.mjs --project=desktop
npx playwright test tests/visual/runtime-cards.spec.mjs --project=mobile
```

Expected: PASS.

- [ ] **Step 5: Run geometry ownership**

Run:

```bash
npm run lint:geometry
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/css/components/cards.css tests/visual/runtime-cards.spec.mjs tests/visual/treasure-map.spec.mjs
git commit -m "style: strengthen Harbor browsing card frames"
```

---

### Task 6: Full RC2 verification and generated artifact reconciliation

**Files:**
- Regenerate: `theme.css`
- Review: `publication-manifest.json`
- Review: `.github/workflows/ci.yml`
- Review: all files changed in Tasks 1-5

**Interfaces:**
- Consumes: completed RC2 feature work.
- Produces: deterministic release-preparation head eligible for CI and manual review.

- [ ] **Step 1: Build generated CSS**

Run:

```bash
npm run build:css
```

Expected: generated `theme.css` reflects only source CSS changes.

- [ ] **Step 2: Run canonical release verification**

Run:

```bash
npm run verify:release
```

Expected: all build, geometry, publication, and Chromium tests pass.

- [ ] **Step 3: Prove deterministic CSS**

Run:

```bash
npm run build:css
git diff --exit-code -- theme.css
```

Expected: no diff after the second build.

- [ ] **Step 4: Review changed runtime surface**

Compare RC1 to RC2 head. Runtime changes should be limited to:

- `theme.css`
- intended `src/css/**` files
- `integrations/streaming-services.js`
- new `integrations/home-navigation.js`

plus tests/docs/manifest. No player or Media Bar production file should change.

- [ ] **Step 5: Commit generated artifact**

```bash
git add theme.css
git commit -m "build: sync RC2 generated Harbor CSS"
```

- [ ] **Step 6: Push and require CI success**

Expected CI steps: Core verification PASS, publication PASS, Chromium PASS, release-branch drift behavior applicable when later moved to `release/*`.

---

### Task 7: Review, create release branch, and freeze RC2 candidate

**Files:**
- No production changes unless review finds a defect.
- Create branch: `release/core-v1-rc2` from the fully verified feature head.
- Create GitHub validation ledger for exact RC2 SHA.

**Interfaces:**
- Consumes: green feature head.
- Produces: immutable RC2 candidate for real Jellyfin validation.

- [ ] **Step 1: Perform release-blocker review**

Review geometry ownership, selector scope, Home adapter idempotence, navigation fail-closed behavior, details isolation, Media Bar/player non-regression, accessibility, and publication safety.

- [ ] **Step 2: If review finds Important/Critical defect, return to the corresponding TDD task**

Do not waive a finding. Add a failing test before any corrective production change.

- [ ] **Step 3: Create `release/core-v1-rc2` from the green reviewed feature head**

Do not add new feature changes on the release branch.

- [ ] **Step 4: Run/observe full CI on the exact release head**

Expected: all gates PASS including generated CSS drift rejection.

- [ ] **Step 5: Freeze exact SHA and create RC2 validation ledger**

Ledger must include affected manual rows:

- Streaming Services first, My Media second, Continue Watching third;
- Home header Home/Movies/TV Shows/Favorites;
- no duplicate Home/nav injection after SPA rerender;
- Streaming card scale desktop/mobile;
- detached Home headings;
- movie and series detail identity composition;
- Next Up/Seasons single-frame appearance;
- Cast & Crew de-emphasis;
- browsing-card frame visibility;
- Media Bar/trailer regression;
- player isolation regression;
- mobile overflow/touch/focus checks.

- [ ] **Step 6: Mark RC1 ledger superseded by RC2 for release purposes without deleting its historical evidence**

Add a comment to issue #3. Do not rewrite RC1 history.
