# Harbor Treasure Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Harbor so browsing surfaces read as a restrained aged treasure map while navigation remains dark, media-focused surfaces remain cinematic, playback remains dark and unobstructed, and the release continues to ship as one generated CSS-only `theme.css` entry point.

**Architecture:** Extend the existing tokenized CSS system with a small repository-local cartography asset family and semantic cartography tokens. Apply those tokens through a reusable browsing map-surface layer, then refine cards, navigation, content pages, and Media Bar without changing Jellyfin behavior. Keep the generated root `theme.css` as the only install entry point and preserve the current source-order regression fixture for Media Bar Enhanced.

**Tech Stack:** CSS, original sanitized SVG assets, Node.js 20, Node test runner, Playwright 1.62.1 Chromium, GitHub Actions on Windows.

**Spec:** `docs/superpowers/specs/2026-08-25-treasure-map-redesign-design.md` on branch `design/treasure-map-redesign`.

## Global Constraints

- Implement release-candidate code on a fresh branch named `feat/treasure-map-rc` from the current head of `fix/rc-media-bar-cascade`, not from `design/treasure-map-redesign`. The design branch contains private Superpowers documentation that the publication checker intentionally rejects.
- Read `CURSOR_HANDOFF.md` before implementation. The approved redesign supersedes only the old visual rule that browsing/content grids must remain dark. CSS-only architecture, generated `theme.css`, privacy boundaries, accessibility requirements, Media Bar optionality, and manual-validation boundaries remain binding.
- Never hand-edit `theme.css`. Run `npm run build:css` after source CSS changes.
- Follow TDD. Each functional or contract change starts with a meaningful RED test before production CSS or asset implementation.
- Do not weaken existing interaction, overflow, accessibility, Media Bar, or publication assertions to obtain a pass.
- Decorative map artwork is non-functional, repository-local, sanitized, non-interactive, and optional. Missing artwork must degrade to readable flat parchment.
- Preserve full-color media artwork. Do not overlay map texture on posters, backdrops, or video.
- Keep `.skinHeader`, drawer/navigation, cinematic detail hero regions, Media Bar hero content, and player surfaces dark.
- Keep the player free of cartography assets.
- Preserve the Media Bar source-order fixture where plugin CSS is declared after Harbor.
- Keep mobile touch targets at least 40 by 40 CSS pixels, preserve keyboard focus, 200 percent zoom, forced colors, reduced motion, safe areas, and coarse-pointer behavior.
- Do not commit real server URLs, addresses, account data, real media/library names, private artwork, screenshots, logs, plugin inventories, or machine paths.
- Do not tag `v1.0.0`, move a stable import to `main`, merge to `main`, or claim real-server validation.
- Consolidate pushes. Run local functional/core gates before publishing a coherent batch. Use Windows CI for the deliberate final snapshot cycle, not as an iterative CSS editor.

---

## Task 1: Reconcile project rules and establish the cartography asset contract

**Files:**
- Modify: `.cursor/rules/harbor.mdc`
- Create: `tests/build/cartography-contract.test.mjs`
- Modify: `tests/build/core-assets.test.mjs`
- Modify: `tests/build/release-contract.test.mjs`
- Create: `src/css/tokens/cartography.css`
- Modify: `src/css/tokens/colors.css`
- Modify: `src/css/index.css`
- Create: `assets/cartography/anchor.svg`
- Create: `assets/cartography/chart-grid.svg`
- Create: `assets/cartography/coastline.svg`
- Create: `assets/cartography/flourish.svg`
- Create: `assets/cartography/route.svg`
- Create: `assets/cartography/ship.svg`
- Modify: `assets/README.md`

- [ ] **Step 1: Add RED contract tests for the approved visual architecture**

Create `tests/build/cartography-contract.test.mjs` with tests that require the new semantic tokens and import order:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  try {
    return await readFile(new URL(path, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

test("declares semantic cartography artwork and strength tokens", async () => {
  const css = await readRepositoryFile("src/css/tokens/cartography.css");
  for (const token of [
    "--harbor-map-cartography-image",
    "--harbor-map-cartography-repeat",
    "--harbor-map-cartography-size",
    "--harbor-map-panel-image",
    "--harbor-map-panel-repeat",
    "--harbor-map-panel-size",
    "--harbor-map-ink",
    "--harbor-map-ink-faded",
    "--harbor-map-paper-edge",
  ]) {
    assert.match(css, new RegExp(`${token}\\s*:`, "u"), token);
  }

  for (const asset of ["chart-grid", "coastline", "route", "flourish"]) {
    assert.match(css, new RegExp(`assets/cartography/${asset}\\.svg`, "u"));
  }
});

test("imports cartography after parchment and before base composition", async () => {
  const css = await readRepositoryFile("src/css/index.css");
  const parchment = css.indexOf('@import "./tokens/parchment.css";');
  const cartography = css.indexOf('@import "./tokens/cartography.css";');
  const reset = css.indexOf('@import "./base/reset.css";');
  assert.ok(parchment >= 0 && parchment < cartography && cartography < reset);
});
```

Update `tests/build/core-assets.test.mjs` so `assetPaths` includes all six `assets/cartography/*.svg` files. Update `tests/build/release-contract.test.mjs` with a rule test requiring `.cursor/rules/harbor.mdc` to contain both `parchment-dominant browsing` and `player`/`dark` language and to no longer contain the old `content grids, and the application frame dark` sentence.

- [ ] **Step 2: Run the focused tests and verify RED**

```text
node --test tests/build/cartography-contract.test.mjs tests/build/core-assets.test.mjs tests/build/release-contract.test.mjs
```

Expected: failures because `src/css/tokens/cartography.css` and the new SVG assets do not exist and the repository rule still encodes the superseded dark-grid direction.

- [ ] **Step 3: Update the binding repo rule**

Replace the old visual bullet in `.cursor/rules/harbor.mdc` with this exact intent:

```text
- Use parchment-dominant browsing surfaces with restrained cartography; keep
  header and drawer navigation structurally dark, preserve full-color artwork,
  keep cinematic media regions dark, and keep the player dark and unobstructed.
```

Do not change the CSS-only, TDD, privacy, generated-entrypoint, or stable-release restrictions.

- [ ] **Step 4: Add semantic color and cartography tokens**

Extend `src/css/tokens/colors.css` with semantic values built from the approved palette:

```css
  --harbor-map-paper: #ead9ae;
  --harbor-map-paper-highlight: #f2e5c2;
  --harbor-map-paper-edge: #b9945d;
  --harbor-map-ink: #3a2d21;
  --harbor-map-ink-faded: rgb(58 45 33 / 24%);
  --harbor-map-stain: rgb(120 82 43 / 16%);
  --harbor-cinematic-navy: #07131c;
```

Create `src/css/tokens/cartography.css` with two reusable stacks. The browsing stack uses coastline, route, chart grid, and the existing papyrus stack. The panel stack uses the flourish plus papyrus. Keep repeat and size counts aligned with image-layer counts.

```css
:root {
  --harbor-map-cartography-image:
    url("./assets/cartography/coastline.svg"),
    url("./assets/cartography/route.svg"),
    url("./assets/cartography/chart-grid.svg");
  --harbor-map-cartography-repeat: no-repeat, no-repeat, repeat;
  --harbor-map-cartography-size: min(46rem, 76vw) auto, min(54rem, 88vw) auto, 24rem 24rem;
  --harbor-map-panel-image:
    url("./assets/cartography/flourish.svg"),
    var(--harbor-papyrus-image);
  --harbor-map-panel-repeat: no-repeat, var(--harbor-papyrus-repeat);
  --harbor-map-panel-size: 9rem auto, var(--harbor-papyrus-size);
}
```

If nested comma-list custom properties prove invalid in Chromium for `background-repeat` or `background-size`, keep the same semantic token names but expand them into explicit complete lists. Record that as an implementation ruling rather than removing the token abstraction.

Import `./tokens/cartography.css` immediately after `./tokens/parchment.css`.

- [ ] **Step 5: Draw the original decorative SVG family**

Create six simple monochrome SVGs using only `svg`, `g`, `path`, `circle`, `line`, and `polyline` geometry with `fill="none"`, `stroke="currentColor"` only if CSS usage supports it, or baked neutral ink opacity otherwise. No scripts, `<image>`, remote references, fonts, data URLs, or copied reference geometry.

Asset roles:

```text
anchor.svg      small harbor mark, 96x96 viewBox
chart-grid.svg  sparse curved longitude/latitude-style lines, 512x512 viewBox
coastline.svg   irregular abstract coastline/depth contours, 900x520 viewBox
flourish.svg    hand-drawn divider/corner flourish, 420x96 viewBox
route.svg       dotted/dashed voyage path with two small waypoints, 900x420 viewBox
ship.svg        tiny side-profile sailing mark, 128x96 viewBox
```

Mark every new asset `Decorative: yes` in `assets/README.md` with original-Harbor provenance and its purpose.

- [ ] **Step 6: Run the focused contracts GREEN**

```text
node --test tests/build/cartography-contract.test.mjs tests/build/core-assets.test.mjs tests/build/release-contract.test.mjs
npm run build:css
npm run verify:core
```

Expected: all focused tests pass, the CSS build succeeds, and existing core tests remain green.

---

## Task 2: Add the reusable parchment-map browsing surface without leaking into playback

**Files:**
- Modify: `tests/build/cartography-contract.test.mjs`
- Modify: `tests/visual/home.spec.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `tests/visual/system-pages.spec.mjs`
- Create: `src/css/base/map-surface.css`
- Modify: `src/css/index.css`
- Modify: `src/css/base/shell.css`
- Modify: `src/css/accessibility.css`

- [ ] **Step 1: Add RED containment and surface tests**

Extend `tests/build/cartography-contract.test.mjs` to require `./base/map-surface.css` after `./base/texture.css` and to require browsing selectors for `.homeSectionsContainer`, `.libraryPage`, `.searchPage`, `.detailPageContent`, and `.statePage`. Assert that `src/css/pages/player.css` does not reference `/assets/cartography/`.

In Playwright, add computed-style assertions before screenshots:

```js
const mapStyle = await page.locator(".homeSectionsContainer").evaluate((element) => {
  const style = getComputedStyle(element);
  return { color: style.color, backgroundImage: style.backgroundImage };
});
expect(mapStyle.color).toBe("rgb(58, 45, 33)");
expect(mapStyle.backgroundImage).toContain("coastline.svg");
expect(mapStyle.backgroundImage).toContain("chart-grid.svg");
```

For library/search, assert their root `backgroundImage` contains `coastline.svg`. For player, assert `.videoPlayerContainer` and `.videoSurface` background images do not contain `cartography`.

- [ ] **Step 2: Run focused tests RED**

```text
node --test tests/build/cartography-contract.test.mjs
npx playwright test tests/visual/home.spec.mjs tests/visual/content-pages.spec.mjs tests/visual/system-pages.spec.mjs --grep "home stays compact|library supports|search renders|player keeps"
```

Expected: new browsing map assertions fail. Existing screenshots may also differ later, but RED must be caused by the new functional assertions first.

- [ ] **Step 3: Create `src/css/base/map-surface.css`**

Use direct CSS backgrounds rather than foreground pseudo-elements so decorative art can never receive pointer input:

```css
:where(
  .homeSectionsContainer,
  .libraryPage,
  .searchPage,
  .detailPageContent,
  .statePage
) {
  background-color: var(--harbor-map-paper);
  background-image:
    var(--harbor-map-cartography-image),
    var(--harbor-papyrus-image);
  background-repeat:
    var(--harbor-map-cartography-repeat),
    var(--harbor-papyrus-repeat);
  background-size:
    var(--harbor-map-cartography-size),
    var(--harbor-papyrus-size);
  color: var(--harbor-map-ink);
  box-shadow: var(--harbor-papyrus-edge);
}

.homeSectionsContainer,
.detailPageContent {
  background-position:
    96% 2rem,
    18% 15rem,
    50% 0,
    0 0;
}
```

Adjust position-list length to the final expanded image stack. Ensure the CSS remains valid if an image is missing because `background-color` and text color still provide a usable interface.

- [ ] **Step 4: Keep the global shell and navigation dark**

Keep `html`, `body`, `.backgroundContainer`, `.skinHeader`, `.mainDrawer`, and `.drawerContent` dark in `src/css/base/shell.css`. Refine the shell only enough to read as timber/navy framing around the parchment browsing surface. Do not make `.backgroundContainer` the parchment canvas because that would leak into login/player/system areas.

- [ ] **Step 5: Reduce decorative behavior in accessibility modes**

In `src/css/accessibility.css`, under `forced-colors: active`, remove decorative browsing images while preserving text and borders:

```css
:where(
  .homeSectionsContainer,
  .libraryPage,
  .searchPage,
  .detailPageContent,
  .statePage
) {
  background-image: none;
}
```

No cartography layer may have animation, focusability, or pointer behavior.

- [ ] **Step 6: Build and rerun functional tests**

```text
npm run build:css
node --test tests/build/cartography-contract.test.mjs
npx playwright test tests/visual/home.spec.mjs tests/visual/content-pages.spec.mjs tests/visual/system-pages.spec.mjs --grep "home stays compact|library supports|search renders|player keeps"
```

Expected: all new computed-style and containment assertions pass. Snapshot comparisons are allowed to remain stale until Task 8.

---

## Task 3: Convert cards and shared components to the framed-map visual language

**Files:**
- Modify: `tests/build/shared-components-contract.test.mjs`
- Modify: `tests/build/papyrus-contract.test.mjs`
- Modify: `tests/visual/shared-components.spec.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `src/css/components/cards.css`
- Modify: `src/css/components/headings.css`
- Modify: `src/css/components/metadata.css`
- Modify: `src/css/components/menus.css`
- Modify: `src/css/components/dialogs.css`
- Modify: `src/css/components/forms.css`
- Modify: `src/css/components/navigation.css`

- [ ] **Step 1: Update tests first for framed cards and integrated map panels**

Keep the existing exact selected-card border contract `rgba(184, 148, 75, 0.78)`. Add contract assertions that `.cardBox` uses `var(--harbor-timber-900)` or equivalent dark timber framing, `.cardText` uses `var(--harbor-map-paper)` with `var(--harbor-map-ink)`, and normal hover does not switch to the selected brass border.

Change the papyrus contract so `.sectionTitle` is no longer required to own a full papyrus background. It should instead assert that section headings are transparent/integrated and use map ink plus a rule/divider. Keep `.actionSheet`, `.dialog`, `.mediaInfoItem`, and `.harbor-metadata-panel` as readable parchment/map panels.

In `tests/visual/shared-components.spec.mjs`, remove `.sectionTitle` from the list that must have the old full papyrus stack. Add assertions that `.sectionTitle` has transparent background and dark map ink, while menu/dialog/metadata surfaces remain light with dark ink.

- [ ] **Step 2: Run RED**

```text
node --test tests/build/shared-components-contract.test.mjs tests/build/papyrus-contract.test.mjs
npx playwright test tests/visual/shared-components.spec.mjs tests/visual/content-pages.spec.mjs --grep "shared Harbor|library supports"
```

Expected: framed-card, integrated-heading, and updated panel assertions fail against the old component styling.

- [ ] **Step 3: Implement framed map cards**

Refactor `src/css/components/cards.css` so artwork remains untouched inside a restrained timber/brass frame:

```css
.card {
  min-width: 0;
  color: var(--harbor-map-ink);
}

.cardBox {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(184 148 75 / 44%);
  border-radius: var(--harbor-radius-md);
  padding: var(--harbor-space-1);
  background-color: var(--harbor-timber-900);
  box-shadow: 0 0.35rem 1rem rgb(42 33 24 / 26%);
}

.cardText {
  padding: var(--harbor-space-2) var(--harbor-space-3) 0;
  background-color: var(--harbor-map-paper);
  color: var(--harbor-map-ink);
}

.cardText-secondary {
  padding-block: var(--harbor-space-1) var(--harbor-space-2);
  color: rgb(58 45 33 / 76%);
}
```

Preserve image aspect ratios, overlays, progress, hit targets, selected border color, focus behavior, and reduced-motion hover behavior.

- [ ] **Step 4: Integrate headings into the chart instead of separate scroll cards**

Make `.sectionTitle` transparent, borderless, and shadowless on map browsing surfaces. Keep the display font, ink color, wrapping, and a brass/ink divider in `::after`. Do not use giant scroll-shaped boxes.

- [ ] **Step 5: Refine map panels and dark navigation**

Use `--harbor-map-panel-image`, `--harbor-map-panel-repeat`, and `--harbor-map-panel-size` for menus/dialogs and larger metadata panels. Keep their base paper color and dark ink. Keep metadata chips smaller and simpler so they do not become decorative clutter.

Keep navigation dark. Add only restrained linework or a low-opacity chart-grid/compass treatment that never interferes with tab overflow or selected states. Active navigation remains brass and text-based, not symbol-only.

- [ ] **Step 6: Preserve form readability in each context**

On parchment/map panels, inputs remain light with dark ink. On cinematic/dark surfaces, inputs remain dark with parchment text. Do not make global form rules assume a parchment parent.

- [ ] **Step 7: Build and rerun focused checks GREEN**

```text
npm run build:css
node --test tests/build/shared-components-contract.test.mjs tests/build/papyrus-contract.test.mjs
npx playwright test tests/visual/shared-components.spec.mjs tests/visual/content-pages.spec.mjs --grep "shared Harbor|library supports"
```

Expected: functional/style assertions pass. Screenshot baselines remain intentionally deferred.

---

## Task 4: Tune Home, Library, Search, and responsive cartography density

**Files:**
- Modify: `tests/build/content-pages-contract.test.mjs`
- Modify: `tests/visual/home.spec.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `src/css/pages/home.css`
- Modify: `src/css/pages/library.css`
- Modify: `src/css/pages/search.css`
- Modify: `src/css/responsive.css`

- [ ] **Step 1: Add RED browsing-page assertions**

Add Playwright checks that Home, Library, and Search use dark map ink on their browsing roots, retain no horizontal overflow, and keep full-color fixture art visible. On mobile, assert the computed map stack is reduced by checking that the large coastline layer is absent or uses a smaller background-size token while `chart-grid.svg` remains allowed.

Keep existing state order, heading position, touch target, card selection, and disabled-state assertions intact.

- [ ] **Step 2: Run RED**

```text
npx playwright test tests/visual/home.spec.mjs tests/visual/content-pages.spec.mjs --grep "home stays compact|library supports|search renders|content pages fit"
```

Expected: mobile density and integrated browsing assertions fail before page-specific refinement.

- [ ] **Step 3: Tune Home composition**

In `src/css/pages/home.css`, keep the compact plugin-absent flow. Give `.homeSectionsContainer` enough vertical and horizontal breathing room for the map field without introducing a fake hero gap. Preserve the existing card grid and max-width behavior.

- [ ] **Step 4: Integrate Library toolbar and Search states**

Refine `.libraryToolbar` and `.searchMessage` so they use the map-panel recipe without looking like unrelated floating scroll cards. Preserve flex/grid behavior, state ordering, form accessibility, and error borders.

- [ ] **Step 5: Reduce decoration on narrow screens**

In `src/css/responsive.css` or `map-surface.css`, set a mobile map composition that removes the largest coastline/route decorations and retains only low-density grid/papyrus texture. Do not remove content or controls. Keep card frames thin and preserve safe-area padding.

- [ ] **Step 6: Verify responsive and zoom contracts**

```text
npm run build:css
npx playwright test tests/visual/home.spec.mjs tests/visual/content-pages.spec.mjs --grep "home stays compact|library supports|search renders|content pages fit"
```

Expected: desktop, mobile, tablet, and effective 200 percent zoom functional assertions pass without horizontal overflow.

---

## Task 5: Build the cinematic details-to-map transition

**Files:**
- Modify: `tests/build/content-pages-contract.test.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `src/css/pages/details.css`
- Modify: `src/css/components/metadata.css`

- [ ] **Step 1: Add RED transition assertions**

In the details Playwright test, assert:

```js
const backdrop = await page.locator(".detailBackdrop").evaluate((element) =>
  getComputedStyle(element).backgroundColor,
);
expect(backdrop).toBe("rgb(12, 29, 41)");

const content = await page.locator(".detailPageContent").evaluate((element) =>
  getComputedStyle(element).backgroundImage,
);
expect(content).toContain("coastline.svg");
```

Also assert that `.detailPagePrimaryContainer .harbor-metadata-panel` does not use the browsing cartography coastline/route stack. It may use a restrained parchment panel over the dark hero, but it must remain readable and visually subordinate to artwork.

- [ ] **Step 2: Run RED**

```text
npx playwright test tests/visual/content-pages.spec.mjs --grep "details preserve"
```

Expected: details secondary content does not yet provide the approved cinematic-to-map transition.

- [ ] **Step 3: Implement the transition**

Keep `.detailBackdrop` dark and full-color. Strengthen its protective navy gradients where needed. Make `.detailPageContent` the parchment-map continuation, with the top edge visually blending from cinematic navy to parchment rather than switching at an arbitrary hard rectangle.

Move people/season/episode framing toward map ink, timber, and parchment while leaving person and episode artwork full-color. Do not apply cartography textures to `.detailBackdrop`, `.personCardPortrait`, or `.episodeImage`.

- [ ] **Step 4: Verify details behavior GREEN**

```text
npm run build:css
npx playwright test tests/visual/content-pages.spec.mjs --grep "details preserve|content pages fit"
```

Expected: details actions remain focusable/enabled, people/seasons/episodes remain visible, no overflow occurs, hero remains dark, and secondary content carries the map surface.

---

## Task 6: Finish Media Bar Enhanced as a cinematic hero that lands into the map surface

**Files:**
- Modify: `tests/build/home-contract.test.mjs`
- Modify: `tests/visual/media-bar.spec.mjs`
- Modify: `src/css/integrations/media-bar-enhanced.css`
- Modify: `src/css/pages/home.css`

- [ ] **Step 1: Preserve the live-server cascade regression as RED/guard assertions**

Do not move or remove the plugin CSS block that appears after Harbor in `tests/fixtures/jellyfin/home-with-media-bar.html`.

Extend `tests/build/home-contract.test.mjs` to require presence-dependent selectors that override both `#slides-container` geometry and `.homeSectionsContainer` displacement. In Playwright, add computed checks that the hero stays dark and the first browsing row has the cartography background after the hero.

Keep existing geometry thresholds unchanged:

```text
desktop hero: 58 to 67 svh
mobile hero: <= 48 svh
row offset from hero bottom: -40 to 80 px
all visible hero buttons: >= 40x40 CSS px
```

- [ ] **Step 2: Run focused Media Bar test before visual refinement**

```text
node --test tests/build/home-contract.test.mjs
npx playwright test tests/visual/media-bar.spec.mjs
```

If the existing source-order fix already satisfies the functional assertions, record that as the baseline guard. The screenshot is expected to remain stale. If any geometry assertion fails, fix that regression before changing visual decoration.

- [ ] **Step 3: Implement the cinematic-to-map lower transition**

Keep Media Bar backdrop/video untouched and dark. Refine `#slides-container .slide::after` with a dark left readability gradient plus a lower gradient that visually meets the parchment browsing row. Keep metadata/action controls readable.

Do not add compass roses, route lines, or parchment texture over video/backdrop. Decorative map graphics begin in `.homeSectionsContainer` below the hero.

- [ ] **Step 4: Verify the source-order regression remains fixed**

```text
npm run build:css
node --test tests/build/home-contract.test.mjs
npx playwright test tests/visual/media-bar.spec.mjs
```

Expected: every non-snapshot geometry, control, focus, overflow, and source-order assertion passes. Snapshot mismatch is acceptable only until Task 8.

---

## Task 7: Protect player, accessibility, and system-surface behavior

**Files:**
- Modify: `tests/build/system-pages-contract.test.mjs`
- Modify: `tests/visual/system-pages.spec.mjs`
- Modify: `src/css/accessibility.css`
- Modify: `src/css/pages/player.css` only if a containment fix is required
- Modify: `src/css/pages/auth.css` only for visual consistency if required
- Modify: `src/css/pages/dashboard.css` only for visual consistency if required
- Modify: `src/css/pages/states.css`

- [ ] **Step 1: Add RED/guard tests for map containment and accessibility modes**

Extend system tests so player CSS and computed player backgrounds contain no `assets/cartography` references. Under forced colors, assert browsing decoration is removed while essential controls and alerts remain visible. Keep reduced-motion, 200 percent zoom, touch target, and exact player-control-count checks.

- [ ] **Step 2: Run focused system tests**

```text
node --test tests/build/system-pages-contract.test.mjs
npx playwright test tests/visual/system-pages.spec.mjs
```

If containment already passes, treat it as a guard and do not change player styling unnecessarily.

- [ ] **Step 3: Keep system surfaces subordinate to the browsing theme**

Login may remain a parchment panel on a dark shell. Dashboard may retain parchment operational panels on a dark or restrained paper field rather than becoming a decorative map showcase. State pages can use the shared browsing map field because they are part of browsing/error flow.

Do not introduce decoration that impairs table overflow, alerts, forms, focus, or player controls.

- [ ] **Step 4: Verify all accessibility/system contracts**

```text
npm run build:css
node --test tests/build/system-pages-contract.test.mjs
npx playwright test tests/visual/system-pages.spec.mjs
```

Expected: all functional checks pass. Player visual snapshot should remain effectively dark and may remain unchanged if no player CSS was modified.

---

## Task 8: Documentation, publication manifest, deliberate Windows visual baselines, and release-candidate gate

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/compatibility.md`
- Modify: `docs/testing/core-manual-matrix.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/build/release-contract.test.mjs`
- Modify: `publication-manifest.json`
- Generated: `theme.css`
- Review/update as intended: `tests/visual/snapshots/win32/*.png`

- [ ] **Step 1: Add RED documentation/CI contracts**

Extend `tests/build/release-contract.test.mjs` to require:

```text
README: treasure map browsing language plus dark cinematic media language
CHANGELOG: treasure-map redesign entry under [Unreleased]
compatibility: release candidate and real-server-not-yet-validated language remains
manual matrix: explicit visual checks for parchment/map browsing and dark player containment
CI: actions/upload-artifact@v4 failure artifact for test-results
manifest: all six cartography SVGs and both new CSS modules are listed
```

Run:

```text
node --test tests/build/release-contract.test.mjs
```

Expected: RED until docs, workflow, and manifest are updated.

- [ ] **Step 2: Update release-candidate documentation without claiming validation**

Update README opening copy from the old dark-chart-room framing to a concise description of parchment-dominant browsing, dark timber/navy navigation, framed media cards, cinematic detail/Media Bar surfaces, and dark playback.

Add an Unreleased changelog subsection for the redesign. Keep the release-candidate disclaimer.

Update `docs/compatibility.md` only to describe the new automated visual surface checks. Keep the statement that real-server validation is incomplete.

Add manual matrix rows for:

```text
Desktop - parchment/map browsing surface and framed cards
Desktop - cinematic details-to-map transition
Desktop - Media Bar cinematic-to-map transition
Mobile - reduced cartography density without overflow
Player - no parchment/cartography over video
```

All results remain `Not run`.

- [ ] **Step 3: Make Windows visual failures inspectable without extra exploratory pushes**

After `npm run test:visual`, add this CI step:

```yaml
      - name: Upload Playwright failures
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-failures
          path: test-results/
          if-no-files-found: ignore
```

This artifact contains only sanitized fixture test output. Do not upload personal-server captures.

- [ ] **Step 4: Update the exact publication manifest**

Add these eight sorted paths to `publication-manifest.json`:

```text
assets/cartography/anchor.svg
assets/cartography/chart-grid.svg
assets/cartography/coastline.svg
assets/cartography/flourish.svg
assets/cartography/route.svg
assets/cartography/ship.svg
src/css/base/map-surface.css
src/css/tokens/cartography.css
```

The implementation branch must not contain `docs/superpowers/**` or `.superpowers/**` tracked files.

- [ ] **Step 5: Generate CSS and run every non-Windows-specific gate locally before pushing**

```text
npm run build:css
npm run verify:core
npm run check:publication
npx playwright test --grep-invert "toHaveScreenshot"
```

If `--grep-invert` cannot isolate snapshot calls because snapshots are inside otherwise useful tests, run the normal Playwright suite and accept only screenshot mismatches after confirming every preceding functional assertion in each test passed. Do not update Linux screenshots into `tests/visual/snapshots/win32`.

- [ ] **Step 6: Commit and publish one coherent implementation batch to `feat/treasure-map-rc`**

Commit all source, tests, docs, manifest, and generated `theme.css` together after local functional gates pass. Push this single coherent batch so Windows CI provides the authoritative new Windows render.

Do not tag a release and do not merge to `main`.

- [ ] **Step 7: Inspect Windows CI screenshot artifacts before approving baselines**

If Windows CI fails only on snapshots, download the `playwright-failures` artifact. Review actual and diff images for:

```text
Home desktop/mobile - map browsing, no fake hero gap
Library/search desktop/mobile - readable ink, restrained map art, framed full-color cards
Details desktop/mobile - cinematic hero transitioning to map content
Media Bar desktop/mobile - dark hero, correct geometry, map row below
Shared components - integrated headings, readable menu/dialog/metadata panels
System/player - player remains dark; system controls remain usable
```

Do not approve a baseline merely because dimensions changed.

- [ ] **Step 8: Update only the intended Windows baselines as one snapshot batch**

Use the reviewed Windows actual images as the new `tests/visual/snapshots/win32/*.png` baselines. Commit that baseline batch separately with a message indicating reviewed treasure-map snapshots.

- [ ] **Step 9: Run final automated release-candidate gates**

Require Windows CI to pass all of:

```text
npm run verify:core
npm run check:publication
npm run test:visual
```

Also confirm the final candidate commit has no tracked private Superpowers docs and that `theme.css` is generated and contains no unresolved `@import`.

- [ ] **Step 10: Hand off an immutable release-candidate SHA for personal-server testing**

Supply:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@FINAL_CANDIDATE_SHA/theme.css");
```

`FINAL_CANDIDATE_SHA` is the actual immutable commit produced by Task 8, not a placeholder committed to the repository. The user then completes the sanitized manual matrix on the personal Jellyfin server. Do not tag `v1.0.0` or claim stable status at this stage.
