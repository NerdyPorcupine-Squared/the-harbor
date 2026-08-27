# Pirate Surface Polish Design

## Goal

Refine Harbor after the first successful real-server runtime-contract candidate. Preserve the library and card geometry that now works, while making navigation, home, details, branding, and optional Streaming Services feel like one deliberate maritime interface instead of a mixture of Harbor and older ElganFlix/NetFin presentation.

## Evidence from the real server

- Library artwork and card sizing are now acceptable and must not be structurally changed.
- The active Movies/TV Shows tab can still appear bright red and conflicts with Harbor.
- The home page has a visually abrupt seam between Media Bar Enhanced and the parchment browsing surface.
- The details page is structurally correct but visually sparse and generic. It needs stronger maritime identity without replacing Jellyfin layout.
- The personal ElganFlix header wordmark is still desirable, but the surrounding interaction palette should be Harbor brass/navy rather than broad red accents.
- Streaming Services is created by JavaScript Injector. CSS cannot create those links. Harbor can, however, style the injected `#homelabStreamingHub` so it visually belongs to the theme.

## Non-negotiable architecture

1. Jellyfin owns layout, card ratios, artwork loading, details geometry, player geometry, focus/navigation behavior, and responsive structure.
2. Media Bar Enhanced owns hero size, slide position, trailer/video layout, metadata position, and home-row offset.
3. Harbor owns presentation: color, texture, typography, shadows, non-sizing borders/outlines, decorative backgrounds, and focus colors.
4. The existing geometry ownership lint remains authoritative and must stay green.
5. The library card system is not redesigned in this pass.
6. The player remains dark and receives no parchment/cartography overlay.
7. No stable tag or main-branch promotion occurs before another real-server browser and Jellyfin Media Player validation.

## Visual direction

### Header and ElganFlix branding

The header remains dark navy/black and cinematic. The stock Jellyfin logo is hidden on non-OSD pages and replaced with the existing `ElganFlix` wordmark. A small red play triangle may remain as the only intentionally red brand element. User/profile borders, focus rings, navigation states, and other interaction accents move to Harbor brass/parchment so red does not leak into the theme system.

Playback OSD titles remain untouched by branding.

### Navigation

The selected top tab uses a restrained brass/navy treatment with parchment text. Harbor explicitly overrides inherited primary-color backgrounds so selected Movies/TV Shows tabs cannot render as a red pill. Hover, active, keyboard focus, and drawer selected states remain distinct and accessible.

### Home and Media Bar Enhanced

Do not resize or reposition Media Bar Enhanced. Improve the transition using cosmetic layering only:

- dark cinematic vignette over the hero,
- a softer lower-edge fade,
- a parchment-toned feather/shadow from the browsing surface upward,
- remove the visually heavy rounded cap if it reads like a separate card,
- style Media Bar controls with Harbor brass/parchment while preserving plugin geometry.

The result should read as one scene moving from trailer/cinema into a chart table rather than a video rectangle placed above a parchment rectangle.

### Details page

The details page becomes a captain's dossier while retaining Jellyfin geometry:

- backdrop remains cinematic and unmodified as artwork,
- dark primary surface gains subtle chart-route/flourish decoration,
- title and section headings use stronger display typography and brass rules,
- metadata reads like compact brass/parchment stamped labels,
- overview/log content gets a dark translucent logbook panel with a restrained brass edge,
- action buttons remain functional and receive Harbor presentation only,
- transition into Cast, Episodes, and More Like This stays parchment/map based.

Decoration must remain sparse. Use existing local Harbor SVG assets rather than adding decorative remote dependencies.

### Streaming Services integration

Harbor adds an optional CSS integration for the existing JavaScript-generated structure:

- `#homelabStreamingHub`
- `.stream-header`
- `.stream-title`
- `.stream-row`
- `.stream-card`
- `.service-logo`
- `.open-label`

The integration styles the cards as dark chart-room plaques with brass framing on the parchment home surface. It does not create service links and does not require remote CSS. Existing JavaScript Injector remains responsible for Netflix, Prime Video, Disney+, and HBO Max link creation.

## Accessibility

- Keep visible `:focus-visible` states in Harbor brass.
- Preserve at least 40x40 controls where Harbor already enforces touch targets.
- Respect `prefers-reduced-motion` and forced colors.
- Decorative backgrounds must never receive pointer events.
- Do not remove semantic text or accessible labels.

## Testing

Automated coverage must prove:

- selected top tab is not red and remains readable,
- ElganFlix branding does not apply to `.osdHeader`,
- library card artwork geometry remains unchanged,
- details retain native vertical ordering and poster geometry while receiving dossier presentation,
- Media Bar retains plugin-owned 90vh/65vh fixture geometry,
- the home transition uses only cosmetic properties,
- injected Streaming Services fixture remains responsive and styled,
- player receives no cartography,
- desktop/mobile, forced colors, reduced motion, and zoom gates stay green.

The final candidate must pass the full Windows CI and then return to the real Jellyfin server for browser and Jellyfin Media Player validation.