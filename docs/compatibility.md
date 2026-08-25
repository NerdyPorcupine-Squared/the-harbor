# Compatibility

The Harbor targets Jellyfin 10.11.x web clients and remains CSS-only.

## Automated evidence

The release candidate is exercised with sanitized local fixtures in Chromium:

- Desktop at 1440×900
- Tablet at 820×1180
- Mobile at 390×844 with touch input
- Effective 200% zoom viewport
- Reduced motion and forced colors
- Media Bar Enhanced present and absent

The build also verifies a flattened `theme.css`, repository-local assets,
deterministic output, CSS syntax, publication boundaries, and mobile hit
targets.

## Real-server evidence

The project is not yet validated on a real Jellyfin server. Automated fixtures
cannot prove selector compatibility with every server configuration, plugin
version, browser extension, or client shell.

The owner will test an immutable commit-pinned release candidate using the
manual matrix. Until that matrix is complete, documentation and changelog
language must continue to call Harbor a release candidate.

## Scope

Core never depends on JavaScript or Media Bar Enhanced. Media Bar integration is
styling only: it does not alter playback state, media sources, network requests,
captions, volume, autoplay, result order, or lazy loading.
