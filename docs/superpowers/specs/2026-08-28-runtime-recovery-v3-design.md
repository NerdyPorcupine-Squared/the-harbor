# The Harbor Runtime Recovery V3 Design

## Purpose

Recover The Harbor from the current real Jellyfin 10.11.11 failures while simplifying the customization stack. The goal is to make the Harbor import the primary styling mechanism, eliminate obsolete injected branding/navigation behavior, retain the Streaming Services home row with the smallest possible JavaScript adapter, and rebuild failed surfaces from real runtime evidence rather than synthetic assumptions.

## Product identity

The product name is **The Harbor**.

- Production CSS, generated `theme.css`, README copy, runtime fixtures, tests, and new documentation must use The Harbor / Harbor naming only.
- The former brand name is treated as a legacy migration artifact and must not appear in production output.
- Add a build contract that rejects the former brand string in `src/css/**`, generated `theme.css`, public integration scripts, and release documentation.

## Governing ownership rules

1. Jellyfin owns application structure, library rows, card geometry, player/video mechanics, navigation geometry, detail-page structure, and native home-section behavior.
2. Media Bar Enhanced owns slideshow geometry, backdrop/trailer mechanics, slide timing, pagination mechanics, and plugin runtime state.
3. Harbor owns presentation only: colors, typography, parchment/cartography decoration, non-sizing frames/shadows, cosmetic gradients, accessible focus/contrast states, and carefully scoped visibility of explicitly unwanted navigation items.
4. Runtime evidence outranks synthetic fixtures.
5. A production change for a broken surface cannot be written until a sanitized capture of that exact clean runtime surface exists.
6. JavaScript Injector is a last-resort DOM adapter, not a styling/layout system.
7. No stable release until Chrome/Edge Jellyfin Web and Jellyfin Media Player pass the same immutable candidate.

## Legacy injector cleanup

Before the V3 baseline is captured, disable the existing injected scripts that currently own behavior Harbor should own:

- legacy branding injector: DISABLE and permanently retire;
- legacy Media Top Navigation injector: DISABLE and permanently retire;
- existing Streaming Services injector: keep only until the replacement adapter is validated, then retire it.

The clean baseline must be captured with the legacy branding and top-navigation injectors disabled so Harbor is not tested against DOM/style conflicts that we create ourselves.

## JavaScript target state

### Preferred state

Only one JavaScript Injector entry remains: a minimal **Harbor Streaming Services** DOM adapter.

It may only:

- create one `#harborStreamingHub` home section when absent;
- create semantic external links for Netflix, Prime Video, Disney+, and Max;
- insert that section at the top of the normal Jellyfin home sections container;
- no-op outside the home page;
- restore the section after SPA navigation only if real runtime evidence proves Jellyfin destroys it.

It may not contain:

- CSS strings or inline visual styles;
- Harbor branding;
- navigation styling or active-state logic;
- Media Bar manipulation;
- player manipulation;
- media requests or playback changes;
- global click/keyboard interception;
- broad MutationObservers.

### Zero-injector navigation goal

Movies and TV Shows shortcuts should be implemented using existing native DOM and CSS if possible. The legacy Media Top Navigation script does not return.

Only if a clean runtime capture proves native Jellyfin does not expose persistent Movies/TV Shows links that can be positioned as requested may a second minimal DOM-only adapter be considered. That fallback requires a separate RED contract and separate approval during execution.

## Home page composition

The target order is:

1. Media Bar Enhanced hero, when enabled;
2. Streaming Services;
3. Continue Watching;
4. normal Jellyfin sections such as Recently Added.

### Streaming Services

- appears before Continue Watching;
- remains visually secondary to actual media artwork;
- uses compact Harbor-styled destination cards, not giant billboards;
- section heading reads as a heading, not a raised button;
- DOM creation belongs to the minimal adapter; presentation belongs to Harbor CSS.

### Continue Watching

- keep Jellyfin's native rail and horizontal scrolling;
- do not replace grid/row geometry;
- visually isolate its heading/plaque from the left viewport edge with balanced inset and finished edges;
- preserve normal section spacing on both desktop and mobile.

## Navigation model

### Global home/header row

Target presentation:

- left group: Home and Favorites;
- right group: Movies and TV Shows;
- inactive items share one subdued parchment/gray treatment;
- selected item uses Harbor navy/brass/parchment;
- no red selected-state styling;
- no yellow-versus-gray split between categories.

The layout should be achieved by styling/reordering existing native elements only if real DOM evidence confirms it is safe. Harbor must not create duplicate global navigation when Jellyfin already exposes the links.

### Library-local row

On TV Shows, the native local group should contain:

- Shows;
- Suggestions;
- Upcoming;
- Genres;
- Episodes.

`TV Networks` should be hidden from the TV Shows local navigation.

On Movies, retain the equivalent native movie-local tabs provided by Jellyfin.

Global Movies/TV Shows shortcuts remain visually separated on the right so local `Shows` and global `TV Shows` do not read as competing selected states.

### Selected states

- exactly one visual hierarchy per row;
- active global shortcut: navy/brass/parchment;
- active local tab: related but lighter Harbor brass treatment;
- inactive items: consistent subdued neutral/parchment treatment;
- no legacy red accent anywhere in navigation.

## Media Bar Enhanced baseline

Before runtime capture, verify the installed Media Bar Enhanced version. Prefer the current Jellyfin 10.11-compatible release used for V3 validation, and do not change plugin version during a capture/fix cycle.

Use a deterministic validation profile:

- Media Bar Enhanced: ON
- Client-Side Settings: OFF
- Trailer Backdrops: ON
- Show Trailer Button: ON
- Start Muted: ON
- Full Width Video: ON
- Constrain Plot Width: ON
- Randomize Backdrop Video: OFF
- Randomize Local Trailer: OFF
- Random Trailer Start Position: OFF
- Wait For Trailer To End: OFF
- Enable Trailer On Mobile: OFF
- Hide Arrows on Mobile: ON
- Always Show Arrow Navigation: OFF
- Enable Keyboard Controls: ON
- Slide Animations: OFF during diagnosis
- Show Slide Progress Bar: OFF during diagnosis
- Sync Page Backdrop: OFF
- Yo-Yo Progress Bar Animation: OFF
- Default Trailer Volume: 10%
- Backdrop Video Delay: 2000 ms
- Trailer Start Offset: 0 ms
- Trailer End Offset: 0 ms
- Mobile Aspect Ratio / Height: 16:9 Compact Wide
- SponsorBlock Intro: ON
- SponsorBlock Outro: ON
- SponsorBlock Preview: OFF

Custom Content, Custom Overlay, and Advanced settings must be captured before changing them. Final Harbor validation prefers Custom Overlay empty/disabled unless a later approved requirement needs it.

## Runtime evidence set

V3 requires clean captures after legacy injector cleanup:

### Home/navigation

- `home-clean-header`
- `home-streaming-first`
- `home-continue-watching`
- `movies-clean-header`
- `tvshows-clean-header`
- `tvshows-networks-tab`
- `navigation-active-movies`
- `navigation-active-tvshows`

### Media Bar

- `home-media-bar`
- `home-media-bar-static`
- `home-media-bar-playing`
- `home-media-bar-seam`
- `home-media-bar-controls`

### Player

- `player-page-root`
- `player-video-container`
- `player-osd-header`
- `player-osd-bottom`

### Details

- `movie-details-full`
- `series-details-full`

### Streaming Services

- `home-streaming-services-current`
- `home-streaming-services-minimal`

Captures must include sanitized ancestor hierarchy, class/id structure, relevant attributes, bounding boxes, computed styles, matched rule provenance, viewport/client metadata, Jellyfin version, and Media Bar presence/version where available.

## Fixture and testing policy

Create real-DOM-derived fixtures under `tests/fixtures/jf-10.11.11/` for player, Media Bar, home navigation, local library navigation, details, and Streaming Services.

Tests must distinguish:

- synthetic presentation checks;
- captured Jellyfin 10.11.11 DOM contracts;
- real-server manual owner validation.

No test name may imply universal real-server truth when it only loads a fixture.

## Production recovery order

1. clean injector/configuration baseline;
2. runtime capture provenance and exact clean captures;
3. real-DOM fixtures and RED contracts;
4. P0 player isolation;
5. navigation cleanup and home section order;
6. Media Bar mechanics and hero blend;
7. details V2/V3 presentation;
8. Streaming Services minimal adapter and home hierarchy polish;
9. cross-client owner validation;
10. test-credibility audit and independent release review.

## Player acceptance

- video visible in playing and paused states;
- no parchment/cartography over video;
- no Harbor browsing wordmark inside OSD;
- no branding injector required;
- native control geometry preserved;
- browser and Jellyfin Media Player agree.

## Home/navigation acceptance

- Streaming Services appears before Continue Watching;
- Continue Watching heading is visually isolated from the left edge;
- Home/Favorites form the left global group;
- Movies/TV Shows form the right global group when native DOM safely permits it;
- inactive navigation is visually consistent;
- selected navigation is Harbor brass/navy, never red;
- local TV Shows tabs do not include TV Networks;
- no duplicate/competing global navigation from injected scripts.

## Media Bar acceptance

- static backdrop visible before trailer playback;
- trailer/video visible when available;
- Harbor does not size plugin dots/arrows/pause/mute/video containers;
- controls/pagination use plugin-owned geometry;
- metadata composes over media rather than a black void;
- lower hero edge blends into parchment without obscuring the media;
- browser and Media Player agree.

## Details acceptance

- backdrop visible and cinematic;
- poster supports rather than dominates the composition;
- actions and metadata are readable;
- captain-log treatment is present without structural ownership;
- Next Up/Seasons and other section headings have accessible contrast;
- transition into parchment browsing is intentional.

## Stop conditions

Stop and gather evidence if:

- a clean real server differs from the corresponding fixture;
- player video or artwork disappears while tests stay green;
- browser and Jellyfin Media Player disagree;
- fixing a surface requires broad structural `!important` overrides;
- protected Jellyfin/plugin elements need width, height, position, transform, overflow, margin, padding, aspect-ratio, or media `background-image` replacement;
- navigation positioning requires duplicate DOM before native options are exhausted;
- hiding TV Networks requires fragile global text matching without a stable local scope;
- a test must be weakened to make production CSS pass.

## Release gate

No stable tag until:

- legacy branding and top-navigation injector scripts are permanently retired;
- only the approved minimal Streaming Services adapter remains, unless zero-injector behavior is achieved;
- no former-brand string exists in production/public output;
- build/contract tests pass;
- geometry ownership lint passes;
- publication/privacy gate passes;
- desktop/mobile Chromium suites pass;
- browser and Jellyfin Media Player owner-validation matrix passes;
- generated `theme.css` is committed at the exact candidate SHA;
- independent final review reports no blocking selector-scope, player-leakage, Media Bar ownership, navigation duplication, accessibility, privacy, or legacy-brand findings.
