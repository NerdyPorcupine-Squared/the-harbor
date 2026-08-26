# Harbor Treasure Map Redesign

Date: 2026-08-25
Status: Approved design, not yet implemented
Target: Harbor release candidate line

## Purpose

Harbor should read as an aged nautical treasure map while browsing, then transition into a darker cinematic presentation when the user enters media-focused surfaces.

The redesign must preserve Harbor as a CSS-only Jellyfin theme installed through a single immutable `theme.css` URL. It must not change Jellyfin playback behavior, media sources, network behavior, content ordering, lazy loading, plugin behavior, or essential controls.

This design intentionally supersedes the earlier visual constraint in `CURSOR_HANDOFF.md` that kept the application frame and content grids predominantly dark. The user has explicitly chosen a parchment-dominant browsing model. The CSS-only architecture, single generated entry point, dark cinematic media surfaces, accessibility requirements, publication rules, and real-server validation boundary remain in force.

## Visual Direction

The theme uses a "treasure map dominant, dark cinematic content" model.

Browsing surfaces should resemble an old navigator's chart: warm aged parchment, faded cartographic ink, subtle stains, irregular edge aging, low-contrast coastline and depth marks, sparse voyage routes, and occasional nautical symbols.

The pirate treatment must remain themed but clean. It may use compass roses, route lines, tiny ships, anchors, hand-drawn dividers, cartographic marks, and restrained decorative flourishes. It must avoid skull-heavy, novelty-pirate, theme-park, or clip-art presentation.

Movie and television artwork remains full-color and visually dominant. Posters are framed as objects placed on a chart rather than recolored or covered by parchment.

## Surface Hierarchy

### Treasure-map browsing surfaces

The strongest parchment treatment applies to:

- Home browsing rows outside the cinematic hero region
- Library pages
- Search pages
- Menus
- Dialogs
- Browsing controls
- Section headings
- Metadata labels used outside cinematic media contexts
- Empty, loading, and error browsing states where appropriate

These surfaces use warm parchment as the primary visual field with dark ink for readable text.

### Dark navigation surfaces

Header, drawer, and major navigation chrome remain deep timber and navy rather than parchment. This creates structure and prevents the interface from becoming an undifferentiated tan field.

Navigation uses:

- parchment-colored text
- brass active states
- subtle engraved or chart-line detailing
- restrained timber texture
- clear hover, focus, selected, and current-page states

### Cinematic media surfaces

Details pages and Media Bar Enhanced shift into a dark cinematic presentation centered on the media artwork. Navy and near-black gradients protect text readability while brass and parchment controls preserve Harbor identity.

The lower portion of cinematic surfaces should visually blend back into the parchment browsing field. This transition should appear deliberate rather than as a hard rectangular boundary.

### Playback surfaces

Playback remains almost entirely dark. Treasure-map graphics, compass roses, parchment panels, and decorative chart artwork must not be placed over video.

Harbor may retain restrained brass focus, progress, and control accents in the player.

## Cartography Asset System

The redesign should introduce a small set of original, repository-local SVG assets rather than use a full-screen raster map background.

Expected asset families:

- compass rose
- coastline or depth contour fragments
- dotted or dashed voyage route
- tiny sailing ship mark
- anchor or harbor mark
- cartographic grid or longitude-latitude fragments
- decorative corner or divider flourish

Assets must be original to Harbor and must not copy the supplied visual reference. The reference is used only to establish mood, density, and general visual vocabulary.

Each asset must:

- be valid, sanitized SVG
- be repository-local
- contain no remote references
- avoid scripts, embedded external images, or interactive behavior
- use simple geometry that scales cleanly
- remain legible at low opacity
- be decorative only
- never carry functional information
- never intercept pointer input

If all cartography assets fail to render, the interface must remain fully understandable and usable.

## Design Tokens

Existing Harbor color and papyrus tokens remain the foundation. The token system should be extended rather than replaced.

New or refined semantic token categories should cover:

- browsing parchment base
- lighter worn paper highlight
- darker aged paper edge
- cartography ink
- faded cartography ink
- stain tone
- timber surface
- brass frame
- brass focus
- cinematic navy
- cinematic shadow

Parchment texture strength and map-art strength should be independently controllable so the visual system can be tuned without editing component rules.

## Parchment and Map Composition

The browsing background should use layered composition rather than one repeated decorative image.

The expected stack is:

1. warm paper base
2. existing or refined fiber texture
3. mottle and stain variation
4. edge vignette or localized aging
5. sparse cartographic artwork
6. content layer

Map artwork should appear printed into the paper rather than placed as foreground decoration. Opacity must be low enough that text and controls retain clear contrast.

Large decorative assets should be partially cropped at page edges where possible. Repeating identical compass roses or ships in every section should be avoided.

## Cards

Cards use the selected "framed map card" treatment.

Requirements:

- preserve full-color poster and thumbnail artwork
- use a restrained dark timber frame
- use a thin aged-brass edge or inset line
- use minimal corner wear or age cues
- place metadata on small parchment labels or strips where Jellyfin markup permits
- avoid large parchment boxes around posters
- keep hover restrained
- use a stronger brass treatment for keyboard focus and explicit selection
- keep progress indicators readable
- maintain required hit targets and pointer behavior

Card frames must not crop essential artwork beyond existing Jellyfin behavior.

## Navigation

Navigation remains visually dark and structural.

Header and drawer should use deep navy/timber surfaces with parchment text and brass rules. Nautical decoration may appear as subtle engraved lines or very low-contrast cartographic accents.

Active navigation must remain immediately recognizable without relying on decorative imagery alone.

Horizontal tabs must preserve overflow behavior on narrow screens.

## Headings, Labels, and Controls

Section headings can use parchment labels, chart-style dividers, or ink-rule treatments, but should not resemble separate oversized scrolls.

Controls on parchment should use dark ink and brass focus states. Controls on cinematic surfaces should use parchment text and dark translucent backgrounds.

Decorative nautical marks may accompany headings only when they do not create layout instability or reduce scanning speed.

## Media Bar Enhanced

Media Bar Enhanced remains an optional integration. Harbor Core must still work when the plugin is absent.

The integration must preserve the real-server cascade regression requirement discovered during manual validation. The plugin may inject its stylesheet after Harbor, so Harbor selectors that intentionally override plugin geometry must win even when loaded earlier.

The cinematic hero should:

- remain responsive on desktop and mobile
- keep media artwork or video visually dominant
- use readable dark gradients
- maintain visible primary actions
- retain working previous, next, pause, mute, dot, progress, and loading controls where supplied by the plugin
- avoid the previously reproduced 90vh plugin takeover
- transition visually into the parchment browsing rows below

The current screenshot baselines should not be updated until the redesigned Media Bar appearance is complete. Functional geometry and accessibility assertions should pass before baseline approval.

## Details Pages

Details pages should use the same cinematic-to-map transition as the Media Bar.

Backdrop artwork remains full-color beneath dark protective gradients. Title, metadata, plot, actions, people, seasons, and episode controls must retain strong contrast and readable spacing.

As the page moves away from the primary backdrop region, it should transition back toward parchment browsing surfaces for secondary content where practical.

## Library and Search

Library and search should be among the clearest examples of the treasure-map browsing language.

Requirements:

- parchment browsing canvas
- dark readable ink text
- map artwork kept behind content
- full-color cards
- framed card treatment
- readable sort, filter, and search controls
- preserved populated, empty, loading, and error state ordering
- no horizontal overflow at supported viewport sizes

## Menus and Dialogs

Menus and dialogs continue to use parchment, but they should visually match the broader map system rather than look like isolated paper cards from a different theme.

They may use subtle paper aging, ink rules, and brass borders. Text remains dark ink. Focus remains clearly visible.

## Responsive Behavior

The map treatment must scale across mobile, tablet, desktop, and wide desktop.

On narrow screens:

- decorative cartography density should decrease
- large compass or coastline assets may be hidden
- content spacing takes priority over decoration
- card frames remain thin
- cinematic heroes reduce in height
- safe-area insets remain respected
- horizontal navigation remains scrollable where required

Decorative assets must never create horizontal overflow.

## Accessibility

Accessibility is a release requirement, not a visual afterthought.

The redesign must preserve:

- visible keyboard focus
- forced-colors compatibility
- reduced-motion support
- coarse-pointer hit targets
- minimum supported touch target sizing
- readable text contrast
- 200 percent zoom usability
- essential-control visibility
- semantic behavior supplied by Jellyfin

Decorative SVG layers should use CSS backgrounds or non-interactive pseudo-elements where possible and must not enter keyboard navigation.

The UI must not rely on color or pirate symbols alone to communicate state.

## Architecture

The existing modular CSS architecture remains in place.

Expected areas of change include:

- `src/css/tokens/colors.css`
- `src/css/tokens/parchment.css`
- one or more additional map-surface token or composition modules if needed
- `src/css/base/shell.css`
- `src/css/base/texture.css`
- `src/css/components/navigation.css`
- `src/css/components/cards.css`
- headings, metadata, menus, dialogs, and forms as required
- `src/css/pages/home.css`
- `src/css/pages/library.css`
- `src/css/pages/search.css`
- `src/css/pages/details.css`
- `src/css/integrations/media-bar-enhanced.css`
- responsive and accessibility layers as required
- repository-local SVG assets

The root `theme.css` remains generated from `src/css/index.css`. It must never be hand-edited.

The redesign should prefer reusable semantic layers and tokens over page-specific one-off values.

## Error and Degradation Behavior

Because Harbor is CSS-only, failure handling is graceful degradation rather than runtime exception handling.

The implementation must ensure:

- missing decorative assets do not hide text or controls
- unsupported cosmetic features fall back to flat color and standard layout
- Media Bar absence leaves the home page compact and usable
- plugin stylesheet changes do not break the non-plugin home layout
- the player remains usable if all Harbor textures fail
- browsers that do not render a decorative effect still receive a readable interface

## Testing Strategy

Implementation follows test-driven development for behavioral and layout regressions.

Before source changes for a reproduced defect, add or update a sanitized failing fixture or browser assertion.

Automated coverage should include:

- core CSS contract tests
- asset sanitation and repository-local reference checks
- deterministic CSS build checks
- publication candidate checks
- desktop and mobile Chromium visual tests
- library, search, details, home, system, and player fixtures
- Media Bar present and absent modes
- plugin stylesheet loading after Harbor
- parchment containment so browsing styles do not leak into playback
- pointer-event checks for decorative map layers
- horizontal overflow checks
- 200 percent zoom checks
- forced-colors checks
- reduced-motion checks
- keyboard focus checks
- touch target checks

Visual snapshot updates must be deliberate and batched. CI should not be used as an iterative visual editor. Local or isolated validation should be completed before pushing a screenshot baseline batch whenever practical.

## CI and Push Discipline

To reduce notification noise during this redesign:

- avoid pushing intentionally failing intermediate visual states when equivalent local or isolated testing is available
- group coherent test and implementation changes into validation batches
- run the relevant core and visual checks before each push when practical
- do not update snapshots solely to make CI green without confirming the visual result is intended
- keep all redesign work off `main` until review and real-server validation are complete

## Manual Server Validation

The project remains a release candidate throughout this redesign.

Real-server testing must continue to use sanitized observations only. Do not commit server URLs, addresses, account information, tokens, real library names, real media titles, private artwork, screenshots, logs, plugin inventories, or machine paths.

The user will validate the pinned immutable candidate on the personal Jellyfin server after automated gates pass.

The manual matrix must cover both Media Bar Enhanced present and absent behavior where applicable.

## Release Boundary

Do not:

- tag `v1.0.0`
- create or claim a stable release
- move the stable import to `main`
- claim real-server validation before the manual matrix is completed

A redesigned release candidate may be created only after automated release gates pass and the user has inspected the visual result on the personal server.

## Success Criteria

The redesign is successful when:

1. Browsing immediately reads as an aged nautical treasure map without becoming novelty pirate UI.
2. Navigation remains dark, structured, and easy to scan.
3. Posters and thumbnails remain full-color and are framed with restrained timber and brass styling.
4. Details and Media Bar surfaces feel cinematic and transition naturally into parchment browsing rows.
5. Playback remains dark and unobstructed.
6. Decorative cartography never communicates required information or intercepts interaction.
7. Desktop, mobile, zoom, focus, forced-colors, motion, and touch requirements continue to pass.
8. Media Bar Enhanced cannot force the hero back to the previously reproduced 90vh layout.
9. Core remains useful without Media Bar Enhanced.
10. The complete theme still ships through one generated root `theme.css` with only repository-local assets.
11. Publication and privacy checks remain clean.
12. No stable release is tagged until the personal-server manual matrix is complete.
