# Harbor RC2 UX Remediation Design

## Objective

Refine Harbor Core after RC1 manual review without changing the established maritime visual language or disturbing working Media Bar and playback behavior. RC2 focuses on Home hierarchy, useful global navigation, cleaner movie/series details, and clearer browsing-card framing.

## Baseline and release rule

RC1 is frozen at `21b3ca6c0bdbcf6ba0aaf75e4d1a99abae5e31ab` and remains immutable historical evidence. RC2 implementation branches from that exact content baseline. Any real-server mismatch discovered during RC2 implementation must first be represented by a failing sanitized fixture or browser contract before production CSS or JavaScript changes.

The seven owner-provided screenshots are validation evidence only and must not be committed because they contain real media/library imagery.

## Scope

RC2 addresses four coupled surfaces:

1. Home section hierarchy and Streaming Services presentation.
2. Home global navigation.
3. Movie and series detail-page composition.
4. Movie/TV browsing-card framing.

Media Bar/trailer behavior is explicitly preserved. Playback styling remains unchanged except for regression verification.

## Design principles

- Jellyfin owns geometry: card dimensions, aspect ratios, sliders, page layout, scrolling, player positioning, Media Bar sizing, and details-page structural placement.
- Harbor owns presentation: color, typography, outlines, shadows, decorative surfaces, non-sizing frames, and narrow optional adapters.
- JavaScript may reorder existing Home sections or add missing navigation links only through idempotent, narrowly scoped DOM adapters. It must not reconstruct Jellyfin pages.
- No hard-coded server URLs, item IDs, library IDs, private names, or media identifiers.
- Every adapter must survive Jellyfin client-side navigation and DOM rerenders without duplication.

## 1. Home hierarchy

### Desired order

Immediately below the Media Bar hero, the Home browsing hierarchy is:

1. Streaming Services
2. My Media
3. Continue Watching, when present
4. Remaining native Jellyfin Home sections in their original relative order

The existing Streaming Services adapter currently knows how to move its own custom section and Continue Watching, but RC1 manual evidence shows the actual Jellyfin Home DOM can place My Media ahead of the custom hub. RC2 therefore extends the adapter to recognize the native My Media section from stable semantic/runtime cues and place the Harbor hub before it.

The adapter must not reorder unrelated native sections among themselves. If My Media cannot be identified safely, Streaming Services should still be prepended without destructive broad reordering.

### Streaming Services card scale

RC1 service cards are visually too small. RC2 increases their desktop footprint while keeping the four-service row compact enough for wide screens. Target presentation:

- desktop card minimum width approximately `14rem` and maximum width approximately `20rem`;
- minimum height approximately `5.5rem`;
- larger service-name typography and wider internal padding;
- four cards remain on one row where the viewport permits;
- responsive layouts collapse naturally through CSS grid without horizontal overflow.

These dimensions belong only to Harbor's custom section, so they do not violate Jellyfin geometry ownership.

### Home section headings

My Media, Continue Watching, and comparable Home headings should read as detached parchment plaques rather than boxes fused to the left edge. Harbor will style the title element and its immediate native title container using presentation-only spacing/background treatment. It must not set Home section width, page positioning, or slider geometry.

The visual intent is a compact rounded plaque with clear left breathing room, not a full-width banner.

## 2. Home global navigation

### Desired Home tabs

The Home header should expose:

`Home | Movies | TV Shows | Favorites`

RC1 only exposes Home and Favorites on the tested runtime. CSS cannot create missing links, so RC2 introduces a narrow optional navigation adapter.

### Navigation adapter contract

The adapter:

- runs only when the global Home header/tab container exists;
- preserves native Home and Favorites controls;
- discovers Movies and TV Shows destinations from Jellyfin's existing native library links or route-bearing anchors already present in the runtime DOM;
- never hard-codes library IDs or server-specific URLs;
- injects at most one Movies and one TV Shows control;
- uses native-compatible anchor/button semantics and Harbor styling classes;
- survives SPA navigation/header rerenders without duplication;
- does not add duplicate global tabs on Movies or TV Shows pages when equivalent native/local navigation is already present.

If reliable destination discovery is unavailable, the adapter must fail closed and leave native navigation unchanged rather than inventing a route.

This adapter is intentionally separate from the Streaming Services adapter so each behavior can be disabled and tested independently.

## 3. Movie and series detail composition

### Identity area

The current right-side title/metadata/actions area reads as visually scattered. RC2 creates an intentional centered identity stack within Jellyfin's existing primary-detail content structure:

- logo or title centered within its available native column;
- metadata chips centered beneath it;
- primary action group visually centered beneath metadata;
- consistent vertical rhythm between identity elements.

Harbor must not move the poster, change the backdrop geometry, set page-grid columns, or replace Jellyfin's detail containers.

### Supporting text

Overview, tags, links, studios, writers, directors, and other long-form/supporting metadata remain left-aligned for readability. The goal is not to center the whole page. The centered treatment is limited to the identity cluster.

### Secondary-section hierarchy

Next Up and Seasons currently read as double-boxed because global card-label parchment treatment combines with detail-page framing. RC2 adds detail-page-specific presentation rules so each item reads as one coherent framed card:

- one visible media frame;
- quieter integrated text label;
- no second heavy parchment slab immediately beneath or around the artwork;
- native card width, height, padding mechanics, and aspect ratio remain untouched.

### Cast & Crew

Cast & Crew remains functional in RC2 but is de-emphasized:

- quieter heading treatment;
- reduced visual weight compared with Next Up and Seasons;
- no removal of native links or people cards in the first RC2 pass.

A later owner review can decide whether to hide the section entirely. RC2 does not remove functionality without that explicit follow-up decision.

## 4. Movie/TV browsing-card framing

RC1 uses a subtle brass shadow around `.cardScalable`, which is too weak against parchment on the real server. RC2 strengthens the resting frame using non-sizing effects only:

- stronger brass outer line/shadow;
- subtle dark/timber separation shadow beneath the brass line;
- hover/focus/selected states become more pronounced while using the same frame vocabulary;
- no border-width, padding, width, height, aspect-ratio, transform, or overflow ownership on Jellyfin card structures.

Artwork remains full color and unobstructed.

## 5. Regression-first implementation

Before changing production code, RC2 must create failing automated evidence for the confirmed mismatches.

### Home fixture requirements

The fixture must include, in order, a native My Media section, Continue Watching section with `data-monitor` playback semantics, and at least one unrelated native section. The real Streaming Services adapter must be executed against that fixture.

Assertions must prove:

- Streaming Services becomes first;
- My Media becomes second;
- Continue Watching becomes third;
- unrelated native sections keep relative order;
- rerendering/replacing Home content does not duplicate the Harbor section.

### Navigation fixture requirements

A sanitized header fixture must include native Home/Favorites tabs and discoverable native Movies/TV library links elsewhere in the DOM. The adapter test must prove exact four-tab output, destination reuse from native links, idempotence, and fail-closed behavior when destinations are absent.

### Detail fixture requirements

The existing details fixture should be extended only with sanitized structural classes needed to represent the real identity cluster, Next Up, Seasons, and Cast & Crew hierarchy. Tests should assert computed presentation and absence of prohibited geometry changes.

### Card-frame tests

Visual/contract tests should assert the strengthened resting frame and stronger focus/hover state without asserting brittle pixel-perfect screenshots unless the repository's existing snapshot contract requires them.

## 6. Files and component boundaries

Expected production files:

- `integrations/streaming-services.js`: Home section ordering only.
- `integrations/home-navigation.js`: new narrow global Home-navigation adapter.
- `src/css/integrations/streaming-services.css`: Streaming Services card scale/presentation only.
- `src/css/components/headings.css` and/or `src/css/pages/home.css`: detached Home heading plaques.
- `src/css/pages/details.css`: detail identity, secondary-card, and Cast & Crew presentation.
- `src/css/components/cards.css`: shared browsing-card frame strength only.
- `src/css/components/navigation.css`: presentation for injected global tabs where native classes are insufficient.

Tests and fixtures remain separated by behavior: Home ordering, Home navigation, details, and shared card framing.

## 7. Accessibility and responsive constraints

- All injected navigation controls remain keyboard reachable and expose meaningful text.
- Existing focus-visible treatment remains visible.
- Streaming Service cards preserve at least 40×40 CSS-pixel interactive targets.
- Mobile must not gain horizontal page overflow from larger desktop service cards or detached heading plaques.
- Reduced-motion and forced-colors behavior must remain valid.
- Navigation injection must not trap focus or alter Jellyfin's native focus order beyond inserting the two requested links between Home and Favorites.

## 8. Validation and release progression

RC2 is eligible to freeze only after:

1. focused tests for each changed behavior pass;
2. `npm run verify:release` passes;
3. generated `theme.css` is deterministic and committed;
4. CI passes publication, Chromium desktop/mobile, and release-drift gates;
5. runtime payload changes are limited to the intended CSS and optional adapters.

The resulting SHA becomes a new immutable RC2 candidate with a separate GitHub validation ledger. Real-server validation must rerun all affected Home, navigation, details, library-card, mobile, Media Bar seam, and player-isolation rows.

## Success criteria

RC2 is visually successful when:

- the working Media Bar remains unchanged;
- Streaming Services is the first Home browsing section, followed by My Media and then Continue Watching;
- Streaming Service cards have comparable visual presence to adjacent Home content;
- Home headings read as detached parchment plaques;
- Home navigation exposes Home, Movies, TV Shows, and Favorites without reviving the old broad injector;
- movie/series identity areas feel centered and deliberate while supporting prose remains readable;
- Next Up and Seasons no longer look double-boxed;
- Cast & Crew is quieter but functional;
- browsing posters have a clearly visible Harbor frame at rest;
- no Jellyfin/plugin-owned geometry is taken over;
- playback and Media Bar regressions remain absent.
