# The Harbor Runtime Recovery V3 Results

This document records real-server owner validation separately from synthetic and captured-DOM automation.

## Candidate under validation

- Candidate SHA: `4d87ed65c8276d115e60902bcd98e92e3b551283`
- Jellyfin target: 10.11.11
- Media Bar Enhanced: version to be recorded at the Media Bar validation checkpoint
- Stable release: not approved

## P0 playback

Status: **PASS on both required clients**

Evidence source: owner validation after the real `video-osd` runtime capture was converted into a regression fixture and Harbor's map-surface selector was narrowed at the source.

### Jellyfin Web

- Playing video visible: PASS
- Paused video visible behind OSD: PASS
- Papyrus/cartography absent from playback: PASS
- Playback controls available: PASS

### Jellyfin Media Player

- Playing video visible: PASS
- Paused video visible behind OSD: PASS
- Papyrus/cartography absent from playback: PASS
- Playback controls available: PASS

## Remaining V3 surfaces

Not yet validated:

- Home global navigation after legacy Media Top Navigation removal
- Movies global/local navigation
- TV Shows global/local navigation and TV Networks removal
- Streaming Services first on Home
- Continue Watching second with an isolated heading
- Media Bar static backdrop
- Media Bar playing trailer
- Media Bar controls/pagination and hero-to-parchment seam
- Movie details
- Series details
- Menu/dialog regression pass
- Narrow/mobile web
- 200% zoom where applicable

A stable tag is blocked until these surfaces pass the V3 same-candidate matrix and the final independent review.
