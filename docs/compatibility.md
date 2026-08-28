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

These fixture results are not proof that a real Jellyfin player, header, details page, or Media Bar instance is isolated correctly. V3 is replacing overbroad synthetic claims with contracts derived from sanitized real DOM captures.

## Real-server evidence

Real Jellyfin 10.11.11 testing has already disproved several earlier fixture assumptions. The current diagnostic baseline showed:

- playback entering the player/OSD state while Harbor papyrus/cartography obscured the video surface;
- Media Bar presenting a mostly black hero and malformed/oversized control presentation;
- a bright red TV Shows selected state surviving alongside Harbor navigation treatment;
- details remaining structurally usable but visually unbalanced and containing low-contrast section states;
- the library/card geometry working substantially better than earlier candidates.

Those failures are active recovery evidence, not release validation. The V3 owner matrix must pass on the same immutable candidate in both Chrome/Edge Jellyfin Web and Jellyfin Media Player before compatibility can be called validated.

## Integration scope

Core Harbor styling does not change playback state, media sources, network requests, captions, volume, autoplay, result order, or lazy loading. Media Bar Enhanced retains ownership of slideshow geometry and backdrop/trailer mechanics.

The preferred V3 end state uses one Harbor CSS import plus one optional minimal JavaScript Injector adapter that creates the Streaming Services home links. Legacy branding and Media Top Navigation injector behavior are retired.
