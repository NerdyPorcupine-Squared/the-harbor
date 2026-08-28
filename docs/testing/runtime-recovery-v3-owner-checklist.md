# The Harbor Runtime Recovery V3 Owner Checklist

This checklist defines the clean real-server state required before any V3 runtime capture is accepted as evidence.

## Customization cleanup

Before capture:

- Legacy Branding JavaScript Injector entry: DISABLED or REMOVED
- Legacy Media Top Navigation JavaScript Injector entry: DISABLED or REMOVED
- Existing Streaming Services JavaScript Injector entry: temporarily ENABLED until the Harbor replacement adapter is validated
- Jellyfin Branding / Custom CSS: one current commit-pinned Harbor `@import` only; remove separate legacy branding/navigation CSS
- Do not add temporary CSS fixes while collecting evidence

A capture is invalid if the legacy Branding or Media Top Navigation injector is active.

## Media Bar preflight

- Verify Media Bar Enhanced is 3.6.0.0 or a newer compatible 3.6.x release
- Apply `docs/testing/media-bar-v3-validation-profile.md`
- Restart Jellyfin after a plugin update or settings change that requires restart
- Hard-refresh browser Jellyfin
- Fully exit and reopen Jellyfin Media Player

## Required browser captures

Collect these from the broken/target state after cleanup:

- `player-page-root`
- `player-video-container`
- `player-osd-header`
- `player-osd-bottom`
- `home-clean-header`
- `home-media-bar`
- `home-media-bar-seam`
- `tvshows-clean-header`
- `tvshows-networks-tab`
- `movie-details-full`
- `series-details-full`
- `home-streaming-services`

Playback captures are P0 and come first. The player should be opened on media known to play without Harbor if possible. Do not supply cookies, local/session storage, authentication headers, API keys, or unsanitized DevTools exports.

## Capture review

Before sharing a generated JSON file, open it locally and verify it contains no private server address, account email, user name, media title, item/session/server identifier, authentication material, or raw media URL.

If browser and Jellyfin Media Player differ before Harbor changes are made, record that difference rather than trying to normalize it with extra CSS.
