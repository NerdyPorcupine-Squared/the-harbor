# Real Jellyfin Runtime Capture

This kit captures sanitized DOM structure, bounding boxes, selected computed styles, matched CSS rules, and sanitized stylesheet provenance from the real Jellyfin Web runtime. It exists because synthetic fixtures are not an authority for Jellyfin layout behavior.

## Privacy and safety

- Run captures in your own browser. The helper makes no network requests and does not upload anything.
- Captures redact text content, media URLs, href/src/poster values, item/session/device/server identifiers, private IPv4 addresses, localhost addresses, and email-like values.
- Stylesheet provenance records only a sanitized path, source index, source kind, and CSSOM accessibility. It does not store stylesheet hosts, query strings, cookies, or authorization data.
- Review every generated JSON file before sharing it. Do not share cookies, browser storage, authentication headers, screenshots containing private information, or unsanitized DevTools exports.
- Use a normal non-admin Jellyfin account for testing when possible.
- Harbor must be disabled for the vanilla captures unless a step explicitly says otherwise.

## Load the capture helper

1. Open Jellyfin Web in a desktop browser.
2. Open Developer Tools and select the **Console**.
3. Open `tools/runtime-capture/harbor-capture.js` from this repository, copy the entire file, paste it into the Console, and press Enter.
4. Confirm the Console says `HarborCapture 1.1.0 loaded`.

The helper is deliberately copy/paste based. It does not depend on a CDN, CSP exception, browser extension, or remote loader.

## Capture metadata

Every JSON capture contains:

- schema version 2
- capture label and timestamp
- Jellyfin app version when exposed by the web client
- browser user agent
- viewport width and height
- device pixel ratio
- sanitized page pathname
- whether `#slides-container` was present
- sanitized outer HTML
- ancestor summaries with matched CSS rules
- descendant bounding boxes and selected computed styles
- matched rules for the captured root
- sanitized stylesheet source classifications: `harbor`, `media-bar`, `jellyfin`, or `unknown`
- whether each stylesheet was accessible through CSSOM

A source classification is diagnostic metadata, not proof of ownership. When classification is `unknown`, use the selector/declaration evidence rather than guessing.

## Finding a visible element

`HarborCapture.visibleMatches()` lists sanitized visible candidates without exposing their text. For example:

```js
HarborCapture.visibleMatches(['video', '.videoPlayerContainer', '.osdHeader', '.videoOsdBottom', '.osdControls'])
```

Use this before guessing a selector. You can also use DevTools **Elements**, click the exact element, and refer to it as `$0` in the Console.

## V3 clean-runtime prerequisite

V3 recovery captures are valid only after the owner checklist in `docs/testing/runtime-recovery-v3-owner-checklist.md` is satisfied. In particular:

- legacy Branding JavaScript Injector is disabled or removed;
- legacy Media Top Navigation JavaScript Injector is disabled or removed;
- the old Streaming Services injector may remain temporarily;
- Jellyfin Custom CSS contains only the current Harbor import, with no separate legacy branding/navigation CSS;
- Media Bar Enhanced is on the deterministic V3 profile.

Unlike vanilla card captures, V3 failure captures keep Harbor enabled because the purpose is to identify exactly which Harbor rule reaches the broken real runtime.

## V3 P0 playback capture

Playback is the first recovery gate. Start media, pause so the OSD is visible, and collect the following before any player CSS fix.

### Player page root

Inspect the visible player/page surface. Prefer the nearest real page root rather than `body`:

```js
HarborCapture.download($0.closest('.libraryPage') ?? $0.closest('.mainAnimatedPage') ?? $0, 'player-page-root')
```

### Video element/container

Inspect the actual video area. If a `<video>` element exists, this command captures its nearest meaningful container:

```js
const video = document.querySelector('video');
HarborCapture.download(video?.closest('.videoPlayerContainer') ?? video?.parentElement ?? video, 'player-video-container')
```

If `video` is null, run:

```js
HarborCapture.visibleMatches(['video', '.videoPlayerContainer', '.videoSurface', '.htmlvideoplayer'])
```

and inspect the returned candidate in Elements before capturing it.

### OSD header

With playback paused:

```js
HarborCapture.downloadSelector('.osdHeader', 'player-osd-header')
```

### OSD bottom controls

First discover which visible selector exists:

```js
HarborCapture.visibleMatches(['.videoOsdBottom', '.osdControls', '.osdControlsContainer'])
```

Then capture the visible result, for example:

```js
HarborCapture.downloadSelector('.videoOsdBottom', 'player-osd-bottom')
```

If that selector is absent, inspect the bottom control bar and use:

```js
HarborCapture.download($0, 'player-osd-bottom')
```

## V3 navigation and Home captures

After legacy Branding and Media Top Navigation injectors are disabled:

### Home header

```js
HarborCapture.downloadSelector('.skinHeader', 'home-clean-header')
```

### Media Bar hero

```js
HarborCapture.downloadSelector('#slides-container', 'home-media-bar')
```

### Media Bar to Home seam

Inspect the first visible normal Home content container immediately below the hero:

```js
HarborCapture.download($0.closest('.homeSectionsContainer') ?? $0, 'home-media-bar-seam')
```

### TV Shows header/local tabs

Open TV Shows and inspect the visible header/tab area:

```js
HarborCapture.downloadSelector('.skinHeader', 'tvshows-clean-header')
```

Inspect the `TV Networks` tab itself and run:

```js
HarborCapture.download($0, 'tvshows-networks-tab')
```

## V3 details captures

For one movie:

```js
HarborCapture.downloadSelector('#itemDetailPage', 'movie-details-full')
```

For one series:

```js
HarborCapture.downloadSelector('#itemDetailPage', 'series-details-full')
```

## V3 Streaming Services capture

While the old Streaming Services injector is still temporarily enabled, inspect the section and run:

```js
HarborCapture.download($0.closest('#homelabStreamingHub') ?? $0, 'home-streaming-services')
```

This capture is used only to understand mount position and home hierarchy. V3 will replace the old integration classes and presentation.

## Earlier vanilla card captures

These existing captures remain useful for card geometry contracts and should not be replaced by V3 failure captures.

### Portrait movie card

With Harbor disabled:

```js
HarborCapture.download($0.closest('.card') ?? $0, 'portrait-card')
```

### Landscape or episode card

```js
HarborCapture.download($0.closest('.card') ?? $0, 'landscape-card')
```

### Square/person/album card

```js
HarborCapture.download($0.closest('.card') ?? $0, 'square-card')
```

### Home without Media Bar Enhanced

```js
HarborCapture.download($0.closest('.homePage') ?? $0.closest('.mainAnimatedPage') ?? $0, 'home-no-media-bar')
```

### Home with Media Bar Enhanced

```js
HarborCapture.download($0.closest('#slides-container') ?? $0, 'home-media-bar')
```

### Movie details

```js
HarborCapture.download($0.closest('#itemDetailPage') ?? $0, 'movie-details')
```

### Series/details variant

```js
HarborCapture.download($0.closest('#itemDetailPage') ?? $0, 'series-details')
```

### Paused player OSD

```js
HarborCapture.download($0.closest('.videoPlayerContainer') ?? $0.closest('.videoOsdBottom') ?? $0, 'paused-player-osd')
```

### Navigation/header

```js
HarborCapture.download($0.closest('.skinHeader') ?? $0, 'navigation-header')
```

### Drawer

```js
HarborCapture.download($0.closest('.mainDrawer') ?? $0, 'navigation-drawer')
```

### Menu or dialog

```js
HarborCapture.download($0.closest('.actionSheet') ?? $0.closest('.dialog') ?? $0, 'menu-dialog')
```

## Gates

The original card-rework gate required one sanitized `portrait-card JSON` and one sanitized `landscape-card JSON`; those captures already define the card geometry baseline.

The V3 production gate is stricter: no player, navigation, Media Bar, details, or home integration fix may be written until the corresponding clean-runtime capture is reviewed. Playback is P0, so the four player captures are reviewed before any other V3 production fix.

## What to send back

Send generated JSON files as conversation attachments. Screenshots are useful for visual context but do not replace runtime JSON. For the first V3 checkpoint, send the four P0 player files first; the remaining surface captures can follow after the playback root cause is identified.
