# The Harbor: Cursor Handoff

This branch is a work-in-progress implementation of The Harbor, an original
pirate chart-room theme for Jellyfin 10.11.x web clients.

## The non-negotiable install contract

The finished theme is installed in Jellyfin with one CSS import:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@main/theme.css");
```

During testing, replace `main` with an immutable commit SHA:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@COMMIT_SHA/theme.css");
```

`theme.css` must contain the complete compiled Core theme. It is generated from
the modular files under `src/css/`; Jellyfin users do not import those source
files individually. Never hand-edit `theme.css`. Run `npm run build:css` after
changing source CSS and commit the regenerated root artifact.

The NetFin project was supplied only as a distribution-structure reference:
one CDN-hosted stylesheet that contains the complete theme. Do not copy its
code, assets, selectors in bulk, wording, fonts, branding, or visual identity.

## Current state

Completed and independently reviewed:

- Deterministic, dependency-light CSS build with import confinement and syntax
  checks.
- Original Harbor logo, compass rose, and parchment-fiber SVG assets.
- Dark navy application shell with brass and parchment design tokens.
- Shared Jellyfin header, drawer, tabs, cards, progress, buttons, forms, menus,
  dialogs, toasts, focus styles, forced-colors handling, and reduced motion.
- Sanitized Jellyfin fixtures and desktop/mobile Playwright configuration.

Current implementation commits:

- `4f4feee` deterministic CSS pipeline
- `3502bb6` visual primitives and shell
- `d4cb5f5` strict SVG/XML validation
- `a094b51` shared interface components
- `106cd22` real Jellyfin overlays own their parchment surfaces

The latest verified Core command passed 31 tests with zero failures. Browser
screenshots are not yet committed because Chromium was unavailable in the
original execution environment. Cursor must install Playwright Chromium and
perform the visual gates below.

## Start here in Cursor

1. Open this repository at the `cursor-handoff` branch.
2. Ensure Node.js 20+ and Git are available.
3. On Windows PowerShell, use `npm.cmd` if the PowerShell execution policy blocks
   `npm.ps1`.
4. Run:

   ```powershell
   npm.cmd install
   npx.cmd playwright install chromium
   npm.cmd run verify:core
   npx.cmd playwright test tests/visual/shared-components.spec.mjs --update-snapshots
   npx.cmd playwright test tests/visual/shared-components.spec.mjs
   ```

5. Inspect both shared-component snapshots before continuing. Fix genuine
   layout, overflow, contrast, or focus failures; do not weaken assertions to
   make failures disappear.

## Product direction

- The top of the home page must feel like a modern trailer-led streaming
  service, not a parchment website.
- Media Bar Enhanced is recommended but optional. With it, the trailer hero is
  prominent. Without it, content starts naturally near the top with no empty
  hero-shaped gap.
- Desktop hero target: `height: clamp(32rem, 64svh, 48rem)`.
- Mobile hero target: `height: min(44svh, 23rem)`.
- Use parchment heavily for controlled accents, metadata panels, menus, dialogs,
  headings, and forms. Keep media grids, artwork, video, and the application
  frame dark.
- Preserve Jellyfin behavior. CSS may restyle playback controls but must never
  alter sources, playback, volume, captions, autoplay, pointer behavior, or
  essential-control visibility.
- JavaScript enhancements belong to a later optional package for Jellyfin's JS
  Injector. Core must remain complete and useful as CSS alone.

## Remaining implementation work

### 1. Home and optional Media Bar Enhanced hero

Create:

- `src/css/pages/home.css`
- `src/css/integrations/media-bar-enhanced.css`
- `tests/fixtures/jellyfin/home-without-media-bar.html`
- `tests/fixtures/jellyfin/home-with-media-bar.html`
- `tests/visual/home.spec.mjs`
- `tests/visual/media-bar.spec.mjs`

Requirements:

- Scope plugin overrides beneath `#slides-container`.
- Support the plugin selector families for slides, backdrops/video, loading,
  progress, arrows, pause, mute, and dots.
- Do not implement playback behavior.
- Apply home-row displacement only with
  `body:has(#slides-container) .homeSectionsContainer`.
- Without Media Bar, the first heading begins within 500px of the desktop top.
- With Media Bar, desktop hero height is 58–67svh and the first row begins from
  40px before through 80px after the hero bottom.
- The parchment metadata panel uses at most 48% of desktop hero width.
- On 390x844, hero height is at most 48svh and causes no horizontal overflow.
- Header and all hero controls remain visible, clickable, and keyboard-focused.

### 2. Library, search, and details pages

Create page CSS, sanitized fixtures, and Playwright coverage for:

- Mixed poster and landscape libraries, filtering, sorting, missing art,
  progress, selected and disabled states.
- Populated, empty, loading, and error search states without changing request
  timing or result order.
- Detail backdrops, title and Play action, long plot text, ratings, people,
  seasons, and episodes.

Verify desktop, tablet 820x1180, mobile 390x844, long unbroken text, and 200%
zoom without horizontal page overflow.

### 3. Login, dashboard, errors, player, responsive, and accessibility

Create CSS and sanitized fixtures for login, settings/dashboard, tables, alerts,
errors, loading, and the Jellyfin player OSD.

Responsive ranges:

- Mobile: up to 599px
- Tablet: 600–1023px
- Desktop: 1024px and wider
- Wide desktop: 1600px and wider

Use logical properties and safe-area insets. Keep all touch targets at least
40x40 CSS pixels. Verify focus, reduced motion, forced colors, coarse pointer,
200% zoom, and visible/clickable player controls.

### 4. Release checks and documentation

Add:

- `README.md` with install, update, optional Media Bar, removal, rollback, and
  troubleshooting instructions.
- `LICENSE` using MIT unless the repository owner changes that decision.
- `CHANGELOG.md` with an unreleased release-candidate entry.
- `docs/compatibility.md` that distinguishes fixture/CI validation from a real
  Jellyfin server test.
- `docs/testing/core-manual-matrix.md` using placeholders only.
- `.github/workflows/ci.yml` for build tests and Playwright Chromium.
- `publication-manifest.json` listing every and only public product file.
- `scripts/check-publication.mjs` that rejects private paths, secrets, machine
  paths, unresolved imports, ungenerated CSS, or unlisted files.
- Release-artifact, documentation, and publication tests.

Do not tag `v1.0.0` or claim real-server validation until the theme passes the
owner's manual Jellyfin matrix. Use a commit-pinned jsDelivr URL for the release
candidate.

## Development method

For every feature or fix:

1. Add or strengthen a test and observe the expected failure.
2. Implement the smallest complete fix.
3. Run the focused test.
4. Run `npm run verify:core`.
5. Run the affected Playwright specs.
6. Run the complete Playwright suite before release work.
7. Regenerate `theme.css` and confirm a second build is byte-identical.
8. Commit a focused change.

Never replace browser assertions with regex-only checks. Static contract tests
are useful, but layout, focus, overflow, computed style, and screenshots must
also run in Chromium.

## Public privacy boundary

The public branch and final repository must never contain:

- A Jellyfin server URL, IP address, API key, user ID, token, or secret.
- Real library names, real media titles, private artwork, screenshots, or logs.
- Personal names, email addresses, machine-specific paths, Docker paths, plugin
  inventory, or local deployment details.
- `docs/superpowers/**`, `.superpowers/**`, private plans, or validation notes.

Use invented nautical media labels and CSS/SVG-generated fixture art. Before
publishing, inspect the exact candidate file list and run the publication
checker. Do not push private execution history into the public repository.

## Definition of done for the Cursor handoff

Cursor may call Harbor Core testable only when all of these are true:

- `npm run verify:core` passes.
- `npm run test:visual` passes on desktop and mobile Chromium projects.
- CI passes from a clean public checkout.
- Root `theme.css` has no unresolved `@import` and contains the complete theme.
- Every URL inside `theme.css` is repository-local and works through jsDelivr.
- Both Media Bar-present and Media Bar-absent home fixtures pass.
- The public candidate passes the privacy/publication checker.
- A commit-pinned jsDelivr import is supplied for real Jellyfin testing.
- The project is described as a release candidate until manual Jellyfin testing
  passes.

