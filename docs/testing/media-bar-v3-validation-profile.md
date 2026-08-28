# Media Bar Enhanced V3 Validation Profile

Use this profile while diagnosing The Harbor against Jellyfin 10.11.11. The goal is to remove per-client and animation variables so browser and Jellyfin Media Player can be compared against the same plugin behavior.

## Plugin preflight

- Media Bar Enhanced version: 3.6.0.0 or newer compatible 3.6.x
- If the installed plugin is older, update it, restart Jellyfin, and hard-refresh every client before collecting V3 runtime captures.
- Custom Overlay: OFF

## Validation settings

- Enable Media Bar Enhanced Plugin: ON
- Enable Client-Side Settings: OFF
- Enable Trailer Backdrops: ON
- Prefer Local Trailers: OFF unless local trailers are deliberately added later
- Only Play Local Trailers: OFF
- Prefer Local Backdrops / Theme Videos: OFF unless local theme videos are deliberately added later
- Wait For Trailer To End: OFF
- Enable Trailer On Mobile: OFF
- Show Trailer Button: ON
- Start Muted: ON
- Randomize Backdrop Video: OFF
- Randomize Local Trailer: OFF
- Hover Audio Fade: OFF
- Random Trailer Start Position: OFF
- Use SponsorBlock: ON
- SponsorBlock Intro: ON
- SponsorBlock Outro: ON
- SponsorBlock Preview: OFF
- All other SponsorBlock categories: OFF
- Default Trailer Volume: 10%
- Backdrop Video Delay: 2000 ms
- Trailer Start Offset: 0 ms
- Trailer End Offset: 0 ms
- Full Width Video: ON
- Constrain Plot Width: ON
- Always Show Arrow Navigation: OFF
- Hide Arrows on Mobile: ON
- Enable Keyboard Controls: ON
- Enable Slide Animations: OFF during diagnosis
- Show Slide Progress Bar: OFF during diagnosis
- Sync Page Backdrop: OFF
- Yo-Yo Progress Bar Animation: OFF
- Mobile Aspect Ratio / Height: 16:9 Compact Wide
- Pagination Dots: ON
- Pagination Counter: ON
- Forced Numeric Counter: OFF

The pagination dots and counter stay enabled because the live failure showed Harbor corrupting their presentation. Hiding them would conceal the symptom instead of proving that plugin-owned controls remain intact.

## Captured Advanced baseline

These values came from the owner's current Media Bar Enhanced Advanced settings and should remain unchanged for the first V3 diagnostic capture unless the plugin update itself migrates them:

- Shuffle Interval: 15000 ms
- Transition Fade Duration: 500 ms
- Retry Delay: 500 ms
- Loading Check Interval: 100 ms
- Swipe Threshold: 50 px
- Transition Type: Crossfade
- Max Total Items: 10
- Max Movies: 10
- Max TV Shows: 10
- Preload Count: 3
- Max Pagination Dots: 10
- Plot Length: 220
- Include Movies: ON
- Include TV Shows: ON
- Include Playlists: ON
- Sort: Random
- Recent Days: 0
- Include Watched Content: OFF

## Captured Custom Content baseline

- Custom Media IDs: enabled, field currently blank
- Apply Limits to Custom IDs: OFF
- Seasonal Content: OFF
- Exclude Seasonal Content from Random Lists: ON

## After diagnosis

Slide Animations may be turned back ON only after the static Media Bar passes both browser and Jellyfin Media Player validation. If enabling animation changes geometry, backdrop visibility, controls, or the hero-to-home transition, return to the diagnostic profile and capture the difference before changing Harbor CSS.

The progress bar is optional after recovery and requires its own real-client check before being re-enabled. Client-Side Settings stay OFF until browser and Jellyfin Media Player parity is established.
