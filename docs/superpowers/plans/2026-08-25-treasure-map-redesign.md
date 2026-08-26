# Harbor Treasure Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Harbor read as a restrained aged treasure map while browsing, retain dark timber/navy navigation, keep details and Media Bar cinematic, and keep playback dark and unobstructed.

**Architecture:** Extend Harbor's existing tokenized CSS with repository-local cartography SVGs and semantic map tokens. Apply those through one reusable browsing-surface layer, then adapt cards, shared components, content pages, and Media Bar. Preserve the generated single-entry `theme.css` contract and existing Media Bar source-order regression fixture.

**Tech Stack:** CSS, sanitized original SVG, Node.js 20, Node test runner, Playwright 1.62.1 Chromium, GitHub Actions on Windows.

**Spec:** `docs/superpowers/specs/2026-08-25-treasure-map-redesign-design.md` on `design/treasure-map-redesign`.

## Global Constraints

- Implement public release-candidate code on `feat/treasure-map-rc`, created from the current head of `fix/rc-media-bar-cascade`. Do not branch the candidate from `design/treasure-map-redesign`, because `docs/superpowers/**` is intentionally private from publication.
- Read `CURSOR_HANDOFF.md` before editing. The approved spec supersedes only the old visual rule requiring browsing/content grids to stay dark.
- Keep Core CSS-only and Media Bar optional. Never alter playback state, network requests, source selection, result order, lazy loading, or essential-control behavior.
- Never hand-edit root `theme.css`; rebuild it with `npm run build:css`.
- Follow TDD: add a meaningful failing contract or browser assertion, observe RED, then implement the minimum production change and rerun GREEN.
- Preserve full-color media art. Map texture must not overlay posters, backdrops, or video.
- Keep header/drawer navigation, cinematic hero regions, and player surfaces dark.
- Decorative map assets are local, sanitized, non-interactive, and non-functional. Missing decoration must degrade to readable flat parchment.
- Preserve keyboard focus, 40x40 touch targets, 200 percent zoom, reduced motion, forced colors, coarse-pointer behavior, safe areas, and overflow protections.
- Preserve the Media Bar fixture's plugin CSS after Harbor. Do not remove the source-order reproduction.
- Do not commit personal-server data, screenshots, logs, private media, library names, plugin inventories, account details, addresses, tokens, or machine paths.
- Consolidate pushes. Complete local/core functional checks before publishing a coherent batch.
- Do not merge to `main`, tag `v1.0.0`, move the stable import, or claim real-server validation.

---

## Task 1: Reconcile the rule set and establish cartography assets/tokens

**Files:**
- Modify: `.cursor/rules/harbor.mdc`
- Create: `tests/build/cartography-contract.test.mjs`
- Modify: `tests/build/core-assets.test.mjs`
- Modify: `tests/build/release-contract.test.mjs`
- Modify: `src/css/tokens/colors.css`
- Create: `src/css/tokens/cartography.css`
- Modify: `src/css/index.css`
- Create: `assets/cartography/anchor.svg`
- Create: `assets/cartography/chart-grid.svg`
- Create: `assets/cartography/coastline.svg`
- Create: `assets/cartography/flourish.svg`
- Create: `assets/cartography/route.svg`
- Create: `assets/cartography/ship.svg`
- Modify: `assets/README.md`

- [ ] **Step 1: Add RED tests.** Create `cartography-contract.test.mjs`. Read both `colors.css` and `cartography.css`, concatenate them, and assert the combined CSS declares:

```text
--harbor-map-paper
--harbor-map-paper-highlight
--harbor-map-paper-edge
--harbor-map-ink
--harbor-map-ink-faded
--harbor-map-stain
--harbor-cinematic-navy
--harbor-map-cartography-image
--harbor-map-cartography-repeat
--harbor-map-cartography-size
--harbor-map-panel-image
--harbor-map-panel-repeat
--harbor-map-panel-size
```

Also assert `cartography.css` references `assets/cartography/chart-grid.svg`, `coastline.svg`, `route.svg`, and `flourish.svg`; assert `src/css/index.css` imports `./tokens/cartography.css` immediately after parchment and before reset. Add all six new SVG paths to the `assetPaths` array in `core-assets.test.mjs`. Add a release-contract test that the Cursor rule contains `parchment-dominant browsing` and no longer contains the old `content grids, and the application frame dark` sentence.

- [ ] **Step 2: Observe RED.** Run:

```text
node --test tests/build/cartography-contract.test.mjs tests/build/core-assets.test.mjs tests/build/release-contract.test.mjs
```

Expected failure: missing cartography tokens/assets and superseded rule wording.

- [ ] **Step 3: Update `.cursor/rules/harbor.mdc`.** Replace only the old visual bullet with:

```text
- Use parchment-dominant browsing surfaces with restrained cartography; keep
  header and drawer navigation structurally dark, preserve full-color artwork,
  keep cinematic media regions dark, and keep the player dark and unobstructed.
```

- [ ] **Step 4: Add semantic colors.** Append inside `:root` in `colors.css`:

```css
  --harbor-map-paper: #ead9ae;
  --harbor-map-paper-highlight: #f2e5c2;
  --harbor-map-paper-edge: #b9945d;
  --harbor-map-ink: #3a2d21;
  --harbor-map-ink-faded: rgb(58 45 33 / 24%);
  --harbor-map-stain: rgb(120 82 43 / 16%);
  --harbor-cinematic-navy: #07131c;
```

- [ ] **Step 5: Add `cartography.css`.** Define the browsing stack as coastline + route + chart-grid and define the panel stack as flourish + existing papyrus. Use these exact semantic property names:

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

If Chromium rejects a nested comma-list custom property in `background-repeat` or `background-size`, preserve these public semantic names but expand each value to the complete explicit layer list. Record that implementation ruling in the SDD/execution ledger.

- [ ] **Step 6: Draw six original decorative SVGs.** Use only simple SVG geometry. No scripts, `<image>`, fonts, remote refs, data URLs, or copied reference shapes. ViewBoxes and roles:

```text
anchor.svg       0 0 96 96   small harbor mark
chart-grid.svg   0 0 512 512 sparse chart/longitude lines
coastline.svg    0 0 900 520 abstract coast/depth contours
flourish.svg     0 0 420 96  hand-drawn divider/corner flourish
route.svg        0 0 900 420 dotted voyage route with waypoints
ship.svg         0 0 128 96  tiny sailing mark
```

Document each in `assets/README.md` as original Harbor artwork and `Decorative: yes`.

- [ ] **Step 7: GREEN.** Import cartography after parchment, build, and run:

```text
npm run build:css
node --test tests/build/cartography-contract.test.mjs tests/build/core-assets.test.mjs tests/build/release-contract.test.mjs
npm run verify:core
```

---

## Task 2: Add the reusable map browsing surface and containment rules

**Files:**
- Modify: `tests/build/cartography-contract.test.mjs`
- Modify: `tests/visual/home.spec.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `tests/visual/system-pages.spec.mjs`
- Create: `src/css/base/map-surface.css`
- Modify: `src/css/index.css`
- Modify: `src/css/base/shell.css`
- Modify: `src/css/accessibility.css`

- [ ] **Step 1: Add RED assertions.** Require `./base/map-surface.css` after `./base/texture.css`. Require rules for `.homeSectionsContainer`, `.libraryPage`, `.searchPage`, `.detailPageContent`, and `.statePage`. Assert `player.css` contains no `/assets/cartography/`. In Playwright, assert Home/Library/Search computed backgrounds contain `coastline.svg` and `chart-grid.svg` and their root text color is `rgb(58, 45, 33)`. Assert player computed backgrounds do not contain `cartography`.

- [ ] **Step 2: Observe RED.** Run the cartography build test plus focused Home/Library/Search/Player browser tests. The new computed-style assertions must fail before implementation.

- [ ] **Step 3: Create `map-surface.css`.** Apply map composition to:

```css
:where(
  .homeSectionsContainer,
  .libraryPage,
  .searchPage,
  .detailPageContent,
  .statePage
)
```

Use `var(--harbor-map-paper)` as fallback background and `var(--harbor-map-ink)` as text. Compose `var(--harbor-map-cartography-image)` before `var(--harbor-papyrus-image)`. Use matching repeat/size token lists. For the 7 resulting layers, use an explicit 7-position list so every layer has deterministic placement:

```css
background-position:
  calc(100% + 8rem) 2rem,
  18% 15rem,
  0 0,
  0 0,
  0 0,
  0 0,
  0 0;
```

Use direct background layers, not foreground pseudo-elements. This makes decoration incapable of intercepting input.

- [ ] **Step 4: Preserve the dark shell.** Keep `html`, `body`, `.backgroundContainer`, `.skinHeader`, `.mainDrawer`, and `.drawerContent` dark. Do not make `.backgroundContainer` parchment.

- [ ] **Step 5: Forced colors.** In the existing `forced-colors` block, set `background-image: none` for the five map browsing roots while retaining readable text/borders.

- [ ] **Step 6: GREEN.** Build and rerun focused computed-style/containment tests. Screenshot mismatches are expected and are not baselined yet.

---

## Task 3: Implement framed map cards and shared component language

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

- [ ] **Step 1: Add RED component contracts.** Preserve the selected-card border expectation `rgba(184, 148, 75, 0.78)`. Add assertions that `.cardBox` has dark timber framing, `.cardText` uses paper + map ink, and hover does not receive the selected border. Change the papyrus/shared-component contract so `.sectionTitle` no longer has to own the full papyrus surface. It must instead use map ink and an integrated divider. Keep menu/dialog/metadata panels light and readable.

- [ ] **Step 2: Observe RED.** Run shared-components and papyrus build tests plus focused shared/library browser tests.

- [ ] **Step 3: Refactor cards.** Preserve full-color `.cardImageContainer`. Give `.cardBox` a thin brass/timber frame, about one `--harbor-space-1` inset padding, and restrained shadow. Give `.cardText` a compact parchment label treatment with dark map ink. Keep overlays, progress, selected/focus border, hit targets, and reduced-motion behavior intact.

- [ ] **Step 4: Flatten headings into the chart.** Make `.sectionTitle` transparent/borderless/shadowless on map surfaces, preserve display font/wrapping, and keep a restrained ink/brass divider via `::after`. Do not use an oversized scroll card.

- [ ] **Step 5: Refine panels.** Use `--harbor-map-panel-image`, `--harbor-map-panel-repeat`, and `--harbor-map-panel-size` for action sheets, dialogs, and larger metadata panels. Keep chips simpler. Keep map-panel controls light with dark ink and cinematic controls dark with parchment text.

- [ ] **Step 6: Navigation stays dark.** Add only low-contrast linework if useful. Active/current states remain text + brass, and tabs remain horizontally scrollable.

- [ ] **Step 7: GREEN.** Build and rerun component contracts and focused browser assertions. Defer screenshot baselines.

---

## Task 4: Tune Home, Library, Search, and responsive decoration density

**Files:**
- Modify: `tests/build/content-pages-contract.test.mjs`
- Modify: `tests/visual/home.spec.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `src/css/pages/home.css`
- Modify: `src/css/pages/library.css`
- Modify: `src/css/pages/search.css`
- Modify: `src/css/responsive.css` or `src/css/base/map-surface.css`

- [ ] **Step 1: Add RED page assertions.** Keep all current overflow, state-order, selection, disabled, touch-target, tablet, and zoom checks. Add assertions for map ink/backgrounds. On mobile require reduced decoration by asserting `coastline.svg` and `route.svg` are absent from the computed browsing background while paper/fiber styling remains.

- [ ] **Step 2: Observe RED.** Run Home and content-page specs before the mobile override exists.

- [ ] **Step 3: Tune Home.** Preserve the compact plugin-absent flow and current grid. Add only spacing needed for the chart composition. Do not reserve a hero gap when Media Bar is absent.

- [ ] **Step 4: Integrate Library/Search panels.** Convert `.libraryToolbar` and `.searchMessage` to the map-panel recipe without changing control layout, search-state order, or error semantics.

- [ ] **Step 5: Mobile density override.** At `width <= 599px`, replace the large cartography stack with only `url("./assets/cartography/chart-grid.svg")` plus the papyrus stack. Provide matching repeat, size, and position lists. Do not hide content or controls.

- [ ] **Step 6: GREEN.** Build and run Home/content specs. Functional assertions, tablet, mobile, and effective 200 percent zoom must pass without horizontal overflow.

---

## Task 5: Build the cinematic details-to-map transition

**Files:**
- Modify: `tests/build/content-pages-contract.test.mjs`
- Modify: `tests/visual/content-pages.spec.mjs`
- Modify: `src/css/pages/details.css`
- Modify: `src/css/components/metadata.css`

- [ ] **Step 1: Add RED assertions.** Require `.detailBackdrop` computed background color `rgb(12, 29, 41)`. Require `.detailPageContent` computed background image to contain `coastline.svg`. Assert the primary metadata panel does not contain the browsing coastline/route stack.

- [ ] **Step 2: Observe RED.** Run the details browser test.

- [ ] **Step 3: Implement transition.** Keep backdrop/artwork full-color under protective navy gradients. Keep the primary metadata/actions readable over the cinematic region. Make secondary `.detailPageContent` the parchment-map continuation, with a deliberate dark-to-paper top transition. Move people/season/episode framing toward map ink/timber/paper, without placing cartography on portraits or episode art.

- [ ] **Step 4: GREEN.** Build and rerun details plus tablet/zoom checks. Actions/focus/people/seasons/episodes and no-overflow behavior must still pass.

---

## Task 6: Finish Media Bar Enhanced and preserve the live-server cascade regression

**Files:**
- Modify: `tests/build/home-contract.test.mjs`
- Modify: `tests/visual/media-bar.spec.mjs`
- Modify: `src/css/integrations/media-bar-enhanced.css`
- Modify: `src/css/pages/home.css`

- [ ] **Step 1: Strengthen guard tests before visual changes.** Keep plugin CSS after Harbor in `home-with-media-bar.html`. Require presence-dependent overrides for both hero geometry and `.homeSectionsContainer` displacement. Add computed assertions that the hero remains dark and the first browsing row carries cartography.

- [ ] **Step 2: Run the current Media Bar test.** Existing thresholds remain binding: desktop hero 58-67 svh, mobile <=48 svh, row offset -40 to 80 px, hero controls >=40x40, no overflow, keyboard focus visible. If a functional assertion fails, fix that regression before visual work. If only the screenshot fails, continue.

- [ ] **Step 3: Implement the visual transition.** Keep backdrop/video untouched. Use dark left/bottom gradients for readability and to visually meet the parchment row. Do not place compass/map texture over media. The map begins in `.homeSectionsContainer`.

- [ ] **Step 4: GREEN functional gate.** Build, run `home-contract.test.mjs`, and run `media-bar.spec.mjs`. All assertions before `toHaveScreenshot` must pass. Snapshot mismatch is deferred to Task 8.

---

## Task 7: Protect player, accessibility, and system pages

**Files:**
- Modify: `tests/build/system-pages-contract.test.mjs`
- Modify: `tests/visual/system-pages.spec.mjs`
- Modify: `src/css/accessibility.css`
- Modify: `src/css/pages/player.css` only if containment requires it
- Modify: `src/css/pages/auth.css` only if consistency requires it
- Modify: `src/css/pages/dashboard.css` only if consistency requires it
- Modify: `src/css/pages/states.css`

- [ ] **Step 1: Add/confirm containment guards.** Assert player source and computed player backgrounds contain no cartography asset. Under forced colors, browsing decoration must be removed while controls/alerts remain distinguishable. Preserve reduced-motion, exact player-control count, touch targets, focus, and zoom tests.

- [ ] **Step 2: Run system tests.** If player containment already passes, do not change player styling unnecessarily.

- [ ] **Step 3: Keep system hierarchy restrained.** Login can remain a parchment panel on a dark shell. Dashboard can remain operational parchment panels rather than a map showcase. State pages may use the map browsing field. Do not compromise tables/forms/alerts.

- [ ] **Step 4: GREEN.** Build, run `system-pages-contract.test.mjs`, and run all system-page Playwright tests.

---

## Task 8: Documentation, publication, Windows baselines, and release-candidate handoff

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/compatibility.md`
- Modify: `docs/testing/core-manual-matrix.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/build/release-contract.test.mjs`
- Modify: `publication-manifest.json`
- Generated: `theme.css`
- Review/update: `tests/visual/snapshots/win32/*.png`

- [ ] **Step 1: Add RED release contracts.** Require README treasure-map browsing + dark cinematic language, an Unreleased changelog entry, unchanged real-server-not-yet-validated language, manual-matrix visual rows, `actions/upload-artifact@v4` for Playwright failures, and manifest entries for all new assets/modules.

- [ ] **Step 2: Update docs.** README must describe parchment-dominant browsing, dark timber/navy navigation, framed media cards, cinematic details/Media Bar, and dark playback. Compatibility remains an automated-evidence statement, not real-server proof. Add manual rows for map browsing/framed cards, details transition, Media Bar transition, reduced mobile decoration, and no cartography over player video. Every result stays `Not run`.

- [ ] **Step 3: Add failure artifact to CI after the Chromium test:**

```yaml
      - name: Upload Playwright failures
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-failures
          path: test-results/
          if-no-files-found: ignore
```

Only sanitized fixture output is uploaded. Never upload personal-server captures.

- [ ] **Step 4: Update the exact manifest.** Add these eight sorted paths:

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

The candidate branch must contain no tracked `docs/superpowers/**` or `.superpowers/**`.

- [ ] **Step 5: Local pre-push gate.** Run:

```text
npm run build:css
npm run verify:core
npm run check:publication
npm run test:visual
```

For Playwright, inspect the output test-by-test. It is acceptable at this stage for a test to fail solely at `toHaveScreenshot` after all earlier functional assertions in that test passed. Any earlier failure is a real blocker. Do not create/update Linux baselines under `snapshots/win32`.

- [ ] **Step 6: Publish one coherent implementation batch to `feat/treasure-map-rc`.** Source, tests, docs, manifest, and generated `theme.css` travel together. Do not tag or merge to `main`.

- [ ] **Step 7: Inspect authoritative Windows CI output.** If CI fails only on snapshots, download the `playwright-failures` artifact and review actual/diff images for Home, Library, Search, Details, Media Bar, shared components, system pages, and player. Verify the intended map/cinematic hierarchy and ensure player remains dark. Do not approve baselines simply because dimensions changed.

- [ ] **Step 8: Commit the reviewed Windows snapshot batch.** Use only the inspected Windows actual images as `tests/visual/snapshots/win32/*.png`. Commit them in one separate reviewed-baseline batch.

- [ ] **Step 9: Final automated gate.** Require Windows CI to pass `npm run verify:core`, `npm run check:publication`, and `npm run test:visual`. Confirm generated `theme.css` has no unresolved imports and all URLs are repository-local.

- [ ] **Step 10: Supply the immutable candidate URL.** After the final candidate commit exists, give the owner the actual SHA in:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@FINAL_CANDIDATE_SHA/theme.css");
```

`FINAL_CANDIDATE_SHA` is substituted only in the user-facing handoff with the real commit SHA. Do not commit a fake SHA. The owner then completes the sanitized personal-server manual matrix. Stable release work remains blocked until that matrix is complete.
