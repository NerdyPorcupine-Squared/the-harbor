# Compatibility

The Harbor targets Jellyfin 10.11.x web clients and is being recovered against real Jellyfin 10.11.11 runtime evidence.

## Automated evidence

The current automated suite uses sanitized local fixtures in Chromium for:

- Desktop at 1440×900
- Tablet at 820×1180
- Mobile at 390×844 with touch input
- Effective 200% zoom viewport
- Reduced motion and forced colors
- Media Bar Enhanced present and absent
- Parchment-map browsing surfaces with reduced mobile cartography density
- Full-color framed media cards and cinematic details/Media Bar boundaries

The build also verifies a flattened `theme.css`, repository-local assets, deterministic output, CSS syntax, publication boundaries, and mobile hit targets.

These fixture results are not proof that a real Jellyfin header, details page, or Media Bar instance is isolated correctly. V3 is replacing overbroad synthetic claims with contracts derived from sanitized real DOM captures.

## Real-server evidence

Real Jellyfin 10.11.11 testing has already disproved several earlier fixture assumptions. The initial V3 diagnostic baseline showed:

- playback entering the player/OSD state while Harbor papyrus/cartography obscured the video surface;
- Media Bar presenting a mostly black hero and malformed/oversized control presentation;
- a bright red TV Shows selected state surviving alongside Harbor navigation treatment;
- details remaining structurally usable but visually unbalanced and containing low-contrast section states;
- the library/card geometry working substantially better than earlier candidates.

The playback blocker has now been isolated from a real `#videoOsdPage.page.libraryPage.mainAnimatedPage[data-type="video-osd"]` capture. Harbor's broad browsing map selector was narrowed to exclude `[data-type="video-osd"]` at the source rather than applying a compensating player reset.

Candidate `4d87ed65c8276d115e60902bcd98e92e3b551283` has passed owner validation for both playing and paused playback in Jellyfin Web and Jellyfin Media Player. Actual video is visible, the papyrus/cartography surface no longer covers playback, and normal playback controls remain available in both clients.

Navigation, Home hierarchy, Media Bar, and details remain active recovery work. The V3 owner matrix must pass on the same immutable candidate in both Chrome/Edge Jellyfin Web and Jellyfin Media Player before compatibility can be called fully validated.

## Integration scope

Core Harbor styling does not change playback state, media sources, network requests, captions, volume, autoplay, result order, or lazy loading. Media Bar Enhanced retains ownership of slideshow geometry and backdrop/trailer mechanics.

The preferred V3 end state uses one Harbor CSS import plus one optional minimal JavaScript Injector adapter that creates the Streaming Services home links. Legacy branding and Media Top Navigation injector behavior are retired.
