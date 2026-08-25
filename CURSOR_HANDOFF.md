# The Harbor: Codex Handoff

The implementation phase is complete on branch `cursor-handoff`. Harbor is an
original, CSS-only chart-room theme for Jellyfin 10.11.x web clients.

## Deliverable

Jellyfin installs Harbor with one CSS import:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@COMMIT_SHA/theme.css");
```

Replace `COMMIT_SHA` with the immutable candidate commit supplied at handoff.
No package is installed on the Jellyfin host. The browser reads the generated
root `theme.css`; its relative original SVG assets resolve through the same
jsDelivr commit.

`theme.css` is generated from modules under `src/css/`. Never edit it directly.
After a source change, run:

```text
npm run build:css
```

## Completed implementation

- Dark Harbor application shell with brass and papyrus design tokens.
- Header, drawer, tabs, cards, progress, controls, forms, menus, dialogs,
  metadata, focus, reduced motion, forced colors, and coarse-pointer support.
- Compact home page when Media Bar Enhanced is absent.
- Scoped trailer hero beneath `#slides-container` when Media Bar Enhanced is
  present, without implementing or altering playback behavior.
- Library, filtering, sorting, search states, details, people, seasons, and
  episodes.
- Login, dashboard, tables, alerts, errors, loading, and player OSD.
- Mobile, tablet, desktop, wide desktop, safe-area, 200% zoom, and 40×40 touch
  target handling.
- README, MIT license, changelog, compatibility notes, manual matrix, CI, and
  exact publication/privacy checker.

## Verified state

The latest local candidate passed:

- `npm run verify:core`: 63 tests, zero failures (one Windows file-symlink test
  skipped because the account lacks symlink permission).
- `npm run test:visual`: 27 passing Chromium checks across desktop and mobile;
  three duplicate conditional viewport checks skipped by design.
- `npm run check:publication`: exact 103-file sanitized candidate accepted.
- `npm run verify:release`: complete local release command accepted.
- A detached clean checkout with `npm ci` also passed `npm run verify:release`.
- Two consecutive CSS builds are byte-identical.
- Root `theme.css` contains no unresolved `@import`; all `url()` values are
  repository-local.
- Both Media Bar-present and Media Bar-absent home fixtures pass.

Visual baselines are Windows Chromium baselines because development and the
owner's Jellyfin testing are Windows-based. Linux is not part of Harbor's
runtime or installation contract.

## Next actions for Codex

1. Run `git status` and confirm the branch is clean and synchronized.
2. Run `npm ci`, `npx playwright install chromium`, and
   `npm run verify:release`.
3. Confirm the Windows GitHub Actions workflow succeeds for the candidate.
4. Supply the immutable jsDelivr URL using the final candidate SHA.
5. Have the owner test that URL on the personal Jellyfin server, primarily with
   Media Bar Enhanced.
6. Convert every sanitized reported issue into a failing fixture/browser test
   before changing source CSS, then rebuild `theme.css`.

## Manual validation boundary

The project remains a release candidate. The owner has not yet completed
`docs/testing/core-manual-matrix.md`.

Do not commit server URLs, IP addresses, account details, tokens, library names,
real media titles, private artwork, screenshots, logs, plugin inventories, or
machine paths. Report only sanitized symptoms and client dimensions.

Do not tag `v1.0.0`, merge the stable import to `main`, or claim real-server
validation until the owner completes the manual matrix.

## Non-negotiable architecture

- Core remains CSS-only and useful without Media Bar Enhanced.
- Keep artwork, video, content grids, and the application frame dark.
- Use papyrus on controlled accents, metadata, menus, dialogs, headings, and
  forms.
- Preserve Jellyfin playback state, sources, network requests, result order,
  lazy loading, pointer behavior, and essential-control visibility.
- Keep root `theme.css` as the complete single generated entry point.
