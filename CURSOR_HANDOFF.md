# The Harbor: Runtime-Contract Handoff

Harbor is an original CSS-only chart-room theme for Jellyfin 10.11.x web clients. The active validation branch is `rework/runtime-contracts`.

## Deliverable

Jellyfin installs Harbor with one CSS import:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@COMMIT_SHA/theme.css");
```

Replace `COMMIT_SHA` with the immutable candidate commit supplied after the final Windows CI gate. No package is installed on the Jellyfin host. The browser reads the generated root `theme.css`; relative Harbor SVG assets resolve through the same jsDelivr commit.

`theme.css` is generated from modules under `src/css/`. Never edit it directly. After a source change, run:

```text
npm run build:css
```

## Current architecture

Harbor treats Jellyfin and optional plugins as the owners of runtime geometry. Theme CSS should change presentation without replacing the layout mechanics that Jellyfin uses to size, position, crop, scroll, or play content.

- Browsing surfaces use parchment and chart-room cartography.
- Header and drawer navigation remain structurally dark with brass and parchment accents.
- Cards preserve Jellyfin's native padder/scalable/image geometry. Harbor adds full-color presentation, parchment metadata, and non-sizing brass/timber framing with shadows rather than geometry-changing borders or transforms.
- Details use Jellyfin's real `#itemDetailPage` structure: cinematic dark primary content followed by parchment secondary browsing content.
- Media Bar Enhanced remains the owner of hero height, video sizing, metadata placement, and home-row displacement. Harbor only supplies cosmetic presentation to its current selectors.
- The player remains dark and unobstructed. Harbor does not replace player or OSD positioning.
- Responsive CSS is limited to presentation and touch-target safeguards rather than page/grid reconstruction.
- Accessibility keeps visible focus, reduced-motion handling, forced-colors support, and minimum 40×40 interactive targets.

## Runtime contracts and regression guards

Versioned Jellyfin 10.11.11 card captures live under `tests/fixtures/jf-10.11.11/`. They preserve the observed portrait and backdrop hierarchy in which Jellyfin's padder establishes the ratio and `.cardImageContainer` fills the scalable area with native artwork mechanics.

`scripts/check-geometry-ownership.mjs` is part of `npm run verify:core`. It rejects Harbor CSS that attempts to take structural ownership of protected card, home, details, player, navigation, or Media Bar geometry.

The automated candidate gate is:

```text
npm run verify:core
npm run check:publication
npm run test:visual
```

The current suite contains 85 build/contract tests plus 46 Playwright cases across desktop and mobile. Three Playwright cases are intentionally skipped because their tablet/zoom coverage is already exercised by the desktop project.

## Real-server validation boundary

Automated tests are necessary but not the release gate. Before any stable tag or merge, validate the immutable candidate on the real Jellyfin server and capture these surfaces:

1. Home with Media Bar Enhanced enabled.
2. Movies/TV library cards, including portrait and landscape artwork.
3. Movie and episode details.
4. Actual playback paused with the player OSD visible.

Convert any sanitized real-server mismatch into a failing fixture/browser contract before changing production CSS.

Do not commit server URLs, IP addresses, account details, tokens, private library names, real media titles, private artwork, screenshots, logs, plugin inventories, or machine paths. Report sanitized structure, symptoms, and client dimensions only.

Do not tag `v1.0.0`, create a stable release, or claim real-server validation until the manual gate is complete.

## Non-negotiable implementation rules

- Core remains CSS-only and useful without Media Bar Enhanced.
- Preserve Jellyfin-owned geometry and artwork mechanics.
- Keep browsing parchment-dominant while keeping cinematic media and playback dark.
- Keep Media Bar Enhanced geometry plugin-owned.
- Preserve Jellyfin playback state, sources, network requests, result order, lazy loading, pointer behavior, and essential-control visibility.
- Keep root `theme.css` as the complete generated single-file entry point.
- Use repository-local decorative assets only.
