# The Harbor Runtime-Contract Rework: Subagent Roadmap

Date: 2026-08-26
Status: Execution roadmap
Target: Jellyfin Web 10.11.11 and web-rendering Jellyfin clients

## Mission

Finish The Harbor as a production-quality CSS-only Jellyfin theme by changing the source of truth from synthetic layout assumptions to real Jellyfin runtime contracts.

Harbor remains visually defined as:

- parchment/cartography browsing surfaces
- dark timber/navy navigation
- full-color media artwork with restrained brass/timber framing
- dark cinematic details and Media Bar Enhanced surfaces
- a mostly untouched dark player

The implementation rule for the rework is:

> Jellyfin owns structural geometry. Harbor owns presentation.

No stable tag, `main` promotion, or stable-release claim is permitted until the real-server browser and supported web-rendering client validation matrix passes.

## Superpowers execution model

Use subagent-driven development for implementation tasks. Every implementation unit follows this sequence:

1. Fresh implementation subagent receives the complete task and relevant captured runtime contract.
2. The subagent creates or updates a failing regression/contract test and demonstrates RED.
3. The subagent implements the smallest production change required for GREEN.
4. A fresh spec-compliance reviewer verifies the change against this roadmap and the approved Harbor visual design.
5. A fresh code-quality reviewer checks selector scope, cascade safety, geometry ownership, accessibility, and maintainability.
6. The implementation subagent addresses review findings.
7. Focused tests are rerun, then the coordinator runs the required batch gate.
8. Only coherent, passing batches are pushed.

Parallel agents are allowed only for work that does not edit overlapping production files or depend on unresolved results from another agent.

## Non-negotiable constraints

- Core stays CSS-only and useful without Media Bar Enhanced.
- Root `theme.css` is generated only. Never hand-edit it.
- Release-candidate installs use an immutable commit SHA.
- Preserve playback behavior, sources, network requests, content order, lazy loading, pointer behavior, focus behavior, and essential controls.
- Never commit private server information, account details, media titles, private artwork, tokens, logs, screenshots, hostnames, IP addresses, or machine paths.
- Real-server captures must be sanitized before becoming fixtures.
- Do not use fixture screenshots as the truth source. Real Jellyfin 10.11.11 is the truth source.
- Do not update a visual baseline merely to make CI green.
- Do not create a stable release until manual browser and supported web-rendering client validation passes.

## Protected geometry policy

The rework begins by treating these Jellyfin-owned areas as protected:

- `.card`
- `.cardBox`
- `.cardScalable`
- `.cardPadder*`
- `.cardContent`
- `.cardImageContainer`
- Home row/grid containers
- Library/search result containers
- `#itemDetailPage` structural containers
- `.itemBackdrop`
- player/OSD structural containers
- Media Bar Enhanced structural containers

Production CSS touching protected selectors must justify every structural property. As a default, Harbor must not set intrinsic ratios, fixed dimensions, layout positioning, scroll geometry, or artwork background-image mechanics on them.

A new static guard should flag suspicious use of:

`aspect-ratio`, `width`, `height`, `min-*`, `max-*`, `position`, `inset`, `top`, `right`, `bottom`, `left`, `transform`, `overflow`, padding-based ratio hacks, `background`, `background-image`, and `background-size` under protected selectors unless narrowly allowlisted with a documented reason.

## Phase 0: Freeze and establish the rework line

### Coordinator

- Preserve `fix/real-jellyfin-layout-contracts` as the current experimental reference.
- Create a dedicated implementation branch/worktree named `rework/runtime-contracts` from the selected current candidate.
- Record the starting SHA and known failures without promoting it as a release candidate.
- Keep design/planning material outside the public publication manifest.

### Acceptance

- Existing branch remains recoverable.
- Rework has its own branch/worktree.
- No stable tag or `main` change.

## Phase 1: Runtime truth capture

This phase is intentionally owner-assisted because the private server is the authoritative runtime and its data must not be exposed to public CI.

### Subagent A: Capture-kit engineer

Owns only capture tooling/documentation, not Harbor production styling.

Deliverables:

- browser-console capture snippets for DOM, bounding boxes, computed styles, and matched rules
- sanitization instructions
- capture metadata schema: Jellyfin version, client/engine, viewport, DPR, plugin state
- one capture command per required surface

Required vanilla captures with Harbor disabled:

- portrait movie card
- landscape/episode card
- square/person/album card if present
- Home without Media Bar Enhanced
- Home with Media Bar Enhanced
- movie details page
- series/details variant
- paused player OSD
- navigation/header/drawer
- menu/dialog

### Subagent B: Upstream contract analyst

Works in parallel with Subagent A. Does not edit production CSS.

For Jellyfin Web v10.11.11 and the exact Media Bar Enhanced version, produce a selector/ownership table for each captured surface:

- structural owner
- image owner
- ratio owner
- scrolling owner
- functional overlays
- safe cosmetic hooks
- version-specific/brittle hooks

### Gate 1

Do not begin the card rework until at least one real portrait card and one real landscape card have sanitized vanilla DOM + computed-style captures.

## Phase 2: Build the real-contract test foundation

### Subagent C: Fixture curator

Transforms sanitized runtime captures into versioned fixtures. Must preserve real hierarchy, classes, inline styles that affect layout, and relevant attributes. It must not simplify the DOM into a handcrafted interpretation.

Target structure:

`tests/fixtures/jf-10.11.11/cards/portrait.html`
`tests/fixtures/jf-10.11.11/cards/backdrop.html`
`tests/fixtures/jf-10.11.11/cards/square.html`
`tests/fixtures/jf-10.11.11/home/vanilla.html`
`tests/fixtures/jf-10.11.11/home/media-bar-enhanced.html`
`tests/fixtures/jf-10.11.11/details/movie.html`
`tests/fixtures/jf-10.11.11/player/paused-osd.html`
`tests/fixtures/jf-10.11.11/metadata/capture.json`

### Subagent D: CSS safety-lint engineer

Works in parallel with fixture curation because it edits scripts/tests rather than production surface CSS.

Add static rules that prevent Harbor from reintroducing the failure class discovered during research:

- no `background:` shorthand on artwork containers
- no ratio/size rewriting on `.cardPadder*`
- no Harbor `aspect-ratio` on card artwork geometry
- no arbitrary player re-layout
- no broad page/grid replacement without an explicit allowlist
- `!important` allowed only in documented integration exceptions

### Gate 2

- Contract fixtures are derived from runtime captures.
- Static safety tests fail against intentionally unsafe examples and pass against allowed cosmetic examples.
- Existing build/publication checks still pass.

## Phase 3: Structural-safe Harbor core

This phase is serialized because these files establish shared behavior.

### Subagent E: Core reset engineer

Goal: remove Harbor-owned layout assumptions while preserving palette, tokens, typography, accessibility, and assets.

Tasks:

- audit current `home.css`, `library.css`, `search.css`, `details.css`, `player.css`, `cards.css`, `map-surface.css`, and Media Bar integration for structural properties
- remove or neutralize rules that replace Jellyfin grid, intrinsic ratio, card sizing, player geometry, or plugin geometry without runtime evidence
- preserve Harbor design tokens and original SVG assets
- establish a minimal structural-safe theme that looks simpler but leaves vanilla Jellyfin geometry intact

Acceptance:

- captured vanilla card ratios remain unchanged with Harbor enabled
- artwork is still present (`background-image != none` or the actual image element remains visible, depending on the captured DOM)
- no horizontal overflow introduced
- player remains functionally vanilla

## Phase 4: Cards first

### Subagent F: Card-system engineer

This is the first visual feature pass because broken artwork invalidates the rest of the theme.

Implement against real portrait, landscape, and square contracts.

Harbor may own:

- outline/border-like decorative treatment that does not change box geometry
- border radius only when verified safe
- shadows
- parchment metadata treatment
- focus/selection presentation
- fallback `background-color`

Harbor must not own:

- card ratio
- artwork dimensions
- artwork image URL
- padding ratio
- native overlay positioning

Acceptance:

- portrait, landscape, square, missing-art, progress, selected, hover, and focus cases pass
- artwork fills exactly according to Jellyfin's native geometry
- browser real-server check passes before moving on
- the same candidate is manually checked in the Jellyfin desktop/web-shell app before Phase 5

## Phase 5: Navigation and browsing surfaces

After cards are proven, two independent implementation tracks may proceed in parallel if they do not edit the same files.

### Subagent G: Navigation engineer

Scope:

- header
- drawer
- tabs
- active/current state
- keyboard focus
- narrow-screen horizontal overflow

Harbor presentation: dark navy/timber, parchment text, brass state indicators, restrained nautical linework.

No replacement of Jellyfin's navigation positioning model.

### Subagent H: Browsing-surface engineer

Scope:

- Home rows without Media Bar geometry changes
- library background/controls
- search background/controls/states
- parchment/cartography layers
- responsive decoration density

Harbor may skin verified surface roots, but must not replace native result grids or home row layout.

### Gate 5

- Chromium desktop/mobile
- Firefox desktop/narrow where CI permits
- no page overflow
- 200% zoom
- keyboard focus
- reduced motion
- forced colors
- real browser server check

## Phase 6: Details pages

### Subagent I: Details engineer

Build from the sanitized real item-details DOM, not the previous synthetic fixture.

Goal:

- retain Jellyfin's native details geometry
- protect backdrop/title/actions with dark cinematic presentation
- transition secondary content toward the parchment/map language without re-laying out the page
- keep people/seasons/episodes and long content readable

Acceptance:

- backdrop artwork remains present
- poster/details geometry matches vanilla structural behavior
- action buttons remain reachable and keyboard-focusable
- no broad `.libraryPage` rule contaminates details
- desktop, narrow, zoom, and real-server checks pass

## Phase 7: Media Bar Enhanced as an independent integration

### Subagent J: Plugin integration engineer

The plugin owns its geometry. Harbor should not impose a replacement hero layout.

Tasks:

- capture exact plugin DOM and computed styles with Harbor disabled
- identify plugin-owned responsive modes and late-injected declarations
- rewrite `integrations/media-bar-enhanced.css` as cosmetic integration first
- use targeted specificity only for proven cosmetic conflicts
- use a narrowly documented `!important` only when runtime evidence proves it is required
- support plugin absent state with zero reserved hero gap

Required modes:

- plugin absent
- static backdrop
- video backdrop
- desktop
- narrow/mobile
- any plugin-provided 16:9 / 4:3 mode Harbor claims to support

Acceptance:

- no Harbor-created 90vh takeover
- no metadata overlap
- plugin controls remain functional
- first Jellyfin row follows the plugin naturally
- both browser and supported web-shell/app test pass

## Phase 8: Player containment

### Subagent K: Player containment engineer

Start by deleting assumptions rather than adding styling.

Goal: Jellyfin retains player/OSD geometry. Harbor only applies verified cosmetic accents.

Permitted examples after runtime verification:

- brass focus/progress accent
- text color
- restrained control/background tint

Not permitted without explicit versioned evidence:

- custom OSD positioning
- custom player surface artwork
- fixed OSD dimensions
- synthetic video background
- global button re-layout

Acceptance:

- playing OSD hidden
- paused OSD visible
- seek
- volume
- captions/audio menu
- playback settings
- fullscreen
- keyboard/mouse behavior
- no cartography over video

## Phase 9: Treasure-map polish

### Subagent L: Visual-polish engineer

Only begins after all structural surfaces are correct on the real server.

Tasks:

- tune paper texture strength
- tune cartography opacity/density
- add restrained chart dividers/nautical marks
- tune timber/brass card presentation
- tune dark-to-parchment transitions
- reduce expensive effects on weaker clients

This agent may not introduce new layout geometry to achieve the visual design.

### Subagent M: Accessibility/performance reviewer

Runs independently after the visual-polish agent and does not initially edit its code.

Review:

- contrast
- visible focus
- forced colors
- reduced motion
- 200% zoom
- 40x40 minimum touch targets where applicable
- decoration pointer behavior
- compositing-heavy filters/masks/backdrop-filter
- mobile/web-shell performance

## Phase 10: Validation infrastructure

### Subagent N: Cross-browser QA engineer

Expand deterministic automation from Chromium-only to the practical matrix:

- Chromium desktop/narrow
- Firefox desktop/narrow
- WebKit desktop/mobile approximation where reliable

Use real-DOM-derived fixtures. Geometry assertions are primary. Screenshots are secondary and require human review.

### Subagent O: Live-staging E2E engineer

If a disposable Jellyfin 10.11.11 staging instance can be created without exposing the personal server, create a deterministic E2E path with generated test media/artwork. This is preferred over testing against the private server in CI.

If a disposable server cannot be automated safely, document the manual real-server boundary rather than faking it.

## Phase 11: Release candidate and owner matrix

### Coordinator

Only after all automated gates pass:

- build root `theme.css`
- verify deterministic output
- verify publication manifest/privacy checks
- verify CI from clean checkout
- provide one immutable SHA import

### Owner validation matrix

Required before stable:

- browser Home with Media Bar on/off
- browser library with portrait/landscape/missing artwork
- browser search
- browser movie/series details
- browser menus/dialogs
- browser player playing/paused/settings/fullscreen
- browser 200% zoom
- Jellyfin desktop/web-shell app on the same candidate for Home/cards/details/player
- any additional web-rendering client explicitly claimed as supported

Native clients that do not render Jellyfin Web are documented as outside Harbor CSS parity rather than treated as failures.

## Phase 12: Stable-release gate

### Subagent P: Release auditor

Fresh reviewer, no implementation ownership.

Audit:

- every roadmap acceptance condition
- all test results
- manual matrix results
- no private data in publication candidate
- generated CSS matches source
- immutable candidate tested
- documentation accurately describes client scope
- no unresolved high-severity visual/functional defect

Only after the release auditor reports clean and the owner explicitly authorizes promotion may the project:

- merge/promote the stable candidate
- update the stable import
- tag the stable version
- create stable release notes

## Dependency graph

`Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4`

After Phase 4:

`Phase 5 navigation || Phase 5 browsing`

Then:

`Phase 5 -> Phase 6 -> Phase 7 -> Phase 8 -> Phase 9`

After Phase 9:

`Phase 10 cross-browser QA || Phase 10 live-staging E2E`

Then:

`Phase 10 -> Phase 11 owner validation -> Phase 12 release audit`

## Stop conditions

Stop implementation and return to runtime capture instead of guessing when:

- a real server differs from the fixture hierarchy
- artwork disappears while fixture tests pass
- a plugin/client renders materially differently from the tested DOM
- a fix requires broad `!important`, fixed positioning, hard-coded viewport geometry, or global resets
- tests can only pass by weakening the assertion
- browser and web-shell app disagree on a claimed-supported surface

The response to these conditions is more evidence, not more CSS.
