# Harbor Runtime Recovery V2 Design

## Purpose

Recover The Harbor from the real Jellyfin 10.11.11 failures observed on the live server without returning to fixture-driven CSS guessing. The recovery must preserve the library/card presentation that is already working while fixing playback isolation, Media Bar Enhanced integration, details composition, selected navigation states, home hierarchy, and the credibility of the automated test suite.

## Governing rules

1. Jellyfin owns structural layout, player/video mechanics, card geometry, navigation geometry, and detail-page geometry.
2. Media Bar Enhanced owns slideshow geometry, video/backdrop playback, slide timing, pagination mechanics, and its own runtime state.
3. Harbor owns presentation only: color, typography, non-sizing shadows/frames, decorative cartography, parchment surfaces, cosmetic gradients, and accessible focus/contrast states.
4. Runtime evidence outranks synthetic fixtures. A production fix for a broken surface may not be written until a sanitized capture of that exact real surface exists.
5. A synthetic test may claim only what its fixture proves. Real-server support claims require a separate owner-validation matrix.
6. No stable tag is created until browser and Jellyfin Media Player validation both pass on the same immutable candidate.

## Observed failures that define scope

### P0: Player leakage

The real playback page received Harbor parchment/cartography and the ElganFlix header mark, obscuring the video surface. This invalidates the previous synthetic player-isolation claim and is the first production issue to fix.

### P1: Media Bar Enhanced

The home hero showed a mostly black media region, disconnected metadata, oversized/incorrectly styled pagination or control elements, and a heavy seam into the parchment home surface. Harbor must stop styling plugin mechanics and restrict itself to cosmetic layering.

### P1: Navigation

The active TV Shows state remained bright red while the higher-level Shows state used Harbor brass. Runtime capture must identify the actual selected-tab selector and source rule before a fix is written.

### P1: Details

The details page was structurally usable but visually unbalanced: a large empty dark field, weak backdrop presence, poster dominance, detached metadata/actions, bland overview framing, and low-contrast Next Up/Seasons labels. The captain-dossier concept remains, but it must be rebuilt against the real detail DOM.

### P2: Home hierarchy

The Streaming Services row works but is oversized relative to Jellyfin content. Section-heading plaques are too button-like and the home map surface lacks hierarchy.

## JavaScript Injector decision

### Required behavior

The home page must retain clickable external entries for Netflix, Prime Video, Disney+, and Max in a dedicated Streaming Services row.

### Boundary

CSS cannot create clickable external-link DOM nodes. Jellyfin 10.11 supports native `menuLinks` in web `config.json`, but those links live in Jellyfin navigation rather than as a home-screen card row. Therefore preserving the current home row requires either JavaScript or a dedicated Jellyfin web-injection plugin.

### V2 decision

Keep JavaScript Injector temporarily, but reduce it to one isolated responsibility: create the Streaming Services section and links. Remove all branding, layout, color, hover, sizing, navigation, Media Bar, and player behavior from injected JavaScript. Harbor CSS owns all presentation of the generated section.

The injected script must:

- create `#homelabStreamingHub` only when absent;
- create semantic links for Netflix, Prime Video, Disney+, and Max;
- prepend the section only to the confirmed Jellyfin home sections container;
- use no inline visual styles other than accessibility-neutral attributes if unavoidable;
- make no network requests itself;
- attach no global click, keyboard, navigation, player, or mutation behavior unrelated to keeping the section present after Jellyfin SPA navigation;
- use one narrowly scoped observer only if runtime evidence proves Jellyfin destroys/recreates the section;
- cleanly no-op outside the home page.

### Future zero-injector option

After V2 is stable, a separate project may replace JavaScript Injector with either Jellyfin native `menuLinks` if the home-row requirement is relaxed, or a small Harbor companion plugin using Jellyfin/File Transformation infrastructure. This is explicitly outside the V2 recovery scope.

## Media Bar Enhanced configuration baseline

The attached screenshots establish the current settings. V2 uses a deterministic validation profile first, then may re-enable optional animation after real-server validation.

### Keep enabled

- Enable Media Bar Enhanced Plugin: ON
- Enable Trailer Backdrops: ON
- Show Trailer Button: ON
- Start Muted: ON
- Full Width Video: ON
- Constrain Plot Width: ON
- Hide Arrows on Mobile: ON
- Enable Keyboard Controls: ON
- Sync Page Backdrop: OFF
- Wait For Trailer To End: OFF
- Enable Trailer On Mobile: OFF
- Randomize Backdrop Video: OFF
- Randomize Local Trailer: OFF
- Hover Audio Fade: OFF
- Random Trailer Start Position: OFF for deterministic validation
- Prefer Local Trailers: OFF unless local trailers are deliberately added later
- Only Play Local Trailers: OFF
- Prefer Local Backdrops / Theme Videos: OFF unless local theme videos are deliberately added later

### Change for V2 validation

- Enable Client-Side Settings: OFF during validation so browser-local overrides cannot create browser/app differences.
- Enable Slide Animations: OFF during diagnosis and first real-server candidate. It may be turned back ON only after Media Bar passes browser and app validation.
- Show Slide Progress Bar: OFF during diagnosis. Pagination dots/counter remain the single progress/navigation indicator.
- Mobile Aspect Ratio / Height: use the plugin's `16:9 Compact Wide` option for portrait mobile validation instead of `Original (Large, 65vh)`.
- Use SponsorBlock: ON, but keep only Intro (Opening Credits) and Outro (End Credits) selected. Disable Preview (Recap/Teaser) to avoid skipping legitimate trailer material.
- Default Trailer Volume: 10%.
- Backdrop Video Delay: keep 2000 ms during diagnosis so the static backdrop remains observable before video playback.
- Trailer Start Offset: 0 ms.
- Trailer End Offset: 0 ms.
- Yo-Yo Progress Bar Animation: OFF.
- Always Show Arrow Navigation: OFF.

### Leave unchanged until captured

Custom Content, Custom Overlay, and Advanced Settings values not visible in the supplied screenshots remain unchanged until they are captured and recorded. Custom Overlay should ultimately be empty/disabled for Harbor unless a separately approved use case requires it.

## Runtime evidence architecture

Enhance `tools/runtime-capture/harbor-capture.js` so a capture includes sanitized rule provenance for critical computed properties when browser APIs expose it. Every broken surface gets an exact capture rather than a generic approximation.

Required captures:

- `player-page-root`
- `player-video-container`
- `player-osd-header`
- `player-osd-bottom`
- `home-media-bar`
- `home-media-bar-seam`
- `navigation-active-tvshows`
- `movie-details-full`
- `series-details-full`
- `home-streaming-services`

Each capture must preserve real ancestor hierarchy, classes, relevant inline attributes/styles, bounding boxes, computed styles, and matched-rule metadata while redacting media URLs, private hosts, account/server identifiers, and user text.

## Fixture architecture

Create sanitized, versioned fixture groups under `tests/fixtures/jf-10.11.11/` for player, Media Bar, navigation, details, and Streaming Services. Tests must load real captured hierarchy and class names rather than hand-authored simplified structures.

Every real-DOM fixture records:

- source Jellyfin version;
- capture label;
- viewport class;
- whether Media Bar was active;
- whether Harbor was active during capture;
- which properties are expected to remain owned by Jellyfin/plugin.

## Production sequence

### 1. Player isolation

Use negative scoping so parchment, map surfaces, and ElganFlix branding never match the real player roots. Do not repair leakage with a large OSD reset layer. If broad reset rules are required, the originating selector is still too broad.

Acceptance: video visible; no parchment/cartography; no ElganFlix pseudo-branding; native OSD geometry unchanged; essential controls visible in playing and paused states.

### 2. Media Bar integration

Remove Harbor sizing from dots, arrows, pause/mute controls, video/backdrop containers, and other plugin-owned mechanics. Cosmetic styling may target plugin controls only when it does not set geometry. Diagnose the black hero from the real matched-rule capture before changing backdrop/video properties.

Acceptance: static backdrop visible before video; trailer appears when available; metadata composes over media; pagination/control geometry remains plugin-native; lower hero edge feathers into parchment without obscuring media.

### 3. Navigation selected states

Capture the real red TV Shows element and override only the verified selected-state contract. Keep the top-level Home/Favorites/Shows/Movies row and library-local TV Shows/Suggestions/Favorites/Upcoming/Genres/Networks/Episodes row visually distinct.

Acceptance: no interaction/selected state uses ElganFlix red except the tiny brand play signal; selected state is navy/brass/parchment with accessible contrast.

### 4. Details V2

Preserve native backdrop/poster/action geometry. Use cosmetic gradients and surface treatments to create three zones: cinematic identity, captain's log, and parchment browsing. Explicitly test Next Up/Seasons/section heading contrast.

Acceptance: visible backdrop; balanced poster and text hierarchy; readable metadata/actions; logbook overview presentation; clear parchment transition; WCAG-conscious contrast; no geometry ownership.

### 5. Home and Streaming Services polish

Reduce the visual dominance of service cards without changing home-section layout mechanics. Harbor owns the generated section's colors, typography, card cosmetics, and focus states. The minimal injector owns only DOM creation.

Acceptance: service row is clearly secondary to Jellyfin media; headings read as headings rather than buttons; links are keyboard accessible; no inline red/ElganFlix presentation survives in the injector.

## Test architecture

For each production task:

1. Add a real-DOM-derived RED regression test reproducing the observed failure.
2. Run the narrow test and confirm the expected failure.
3. Implement the smallest presentation/scoping change.
4. Run the narrow test to GREEN.
5. Run geometry ownership, CSS lint, publication gate, and focused Chromium tests.
6. Perform a fresh spec-compliance review.
7. Perform a fresh code-quality/cascade review.
8. Only then commit the coherent passing task.

Synthetic tests must be named/described as fixture contracts, not as proof of real-server behavior.

## Real-server validation matrix

Validate the same immutable candidate in Chrome/Edge Jellyfin Web and Jellyfin Media Player:

- Home without Media Bar
- Home with Media Bar static backdrop
- Home with Media Bar trailer playing
- Streaming Services row
- Movies library
- TV Shows library with active sub-tab
- Movie details
- Series details
- Player playing
- Player paused with OSD
- menu/dialog
- narrow/mobile web layout
- 200% browser zoom where applicable

A browser/app disagreement is a stop condition.

## Stop conditions

Stop production work and gather more evidence if:

- real server differs from the corresponding fixture;
- video/artwork disappears while fixtures pass;
- browser and Jellyfin Media Player disagree;
- a fix needs broad structural `!important` overrides;
- a protected Jellyfin/plugin selector needs width, height, positioning, transform, overflow, padding, margin, aspect ratio, or background-image replacement;
- a test must be weakened to make production CSS pass;
- a plugin setting or client-side override changes results between test clients.

## Release gate

No stable release until:

- all build/contract tests pass;
- geometry ownership lint passes;
- publication/privacy gate passes;
- desktop and mobile Chromium suites pass;
- real-server browser/app matrix passes;
- generated `theme.css` is committed at the exact candidate SHA;
- independent final audit reports no blocking selector-scope, player-leakage, Media Bar ownership, accessibility, privacy, or stale-red-accent findings.
