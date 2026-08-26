# Real Jellyfin Runtime Capture

This kit captures sanitized DOM structure, bounding boxes, selected computed styles, and accessible matched CSS rules from the real Jellyfin Web runtime. It exists because synthetic fixtures are not an authority for Jellyfin layout behavior.

## Privacy and safety

- Run captures in your own browser. The helper makes no network requests and does not upload anything.
- Captures redact text content, media URLs, href/src/poster values, item/session/device/server identifiers, private IPv4 addresses, localhost addresses, and email-like values.
- Review every generated JSON file before sharing it. Do not share cookies, browser storage, authentication headers, screenshots containing private information, or unsanitized DevTools exports.
- Use a normal non-admin Jellyfin account for testing when possible.
- Harbor must be disabled for the vanilla captures unless a step explicitly says otherwise.

## Load the capture helper

1. Open Jellyfin Web in a desktop browser.
2. Open Developer Tools and select the **Console**.
3. Open `tools/runtime-capture/harbor-capture.js` from this repository, copy the entire file, paste it into the Console, and press Enter.
4. Confirm the Console says `HarborCapture 1.0.0 loaded`.

The helper is deliberately copy/paste based. It does not depend on a CDN, CSP exception, browser extension, or remote loader.

## Capture metadata

Every JSON capture contains:

- schema version
- capture label and timestamp
- Jellyfin app version when exposed by the web client
- browser user agent
- viewport width and height
- device pixel ratio
- sanitized page pathname
- whether `#slides-container` was present
- sanitized outer HTML
- ancestor summaries
- descendant bounding boxes and selected computed styles
- matched rules from stylesheets the browser permits DevTools JavaScript to inspect

## Selecting the correct element

For a media card, right-click the artwork and choose **Inspect**. In the Elements panel, move upward until the selected node is the outer `.card`. The selected node is available in the Console as `$0`.

Run:

```js
HarborCapture.download($0.closest('.card') ?? $0, 'portrait-card')
```

For full surfaces, inspect any visible part of the surface and use the nearest stable root shown below.

## Required vanilla captures

### Portrait movie card

With Harbor disabled, inspect one visible portrait movie poster and run:

```js
HarborCapture.download($0.closest('.card') ?? $0, 'portrait-card')
```

### Landscape or episode card

Inspect one landscape/backdrop/episode card and run:

```js
HarborCapture.download($0.closest('.card') ?? $0, 'landscape-card')
```

### Square/person/album card

If your library exposes a square card, inspect it and run:

```js
HarborCapture.download($0.closest('.card') ?? $0, 'square-card')
```

### Home without Media Bar Enhanced

Disable Media Bar Enhanced, reload Home, inspect the main home content container, and run:

```js
HarborCapture.download($0.closest('.homePage') ?? $0.closest('.mainAnimatedPage') ?? $0, 'home-no-media-bar')
```

### Home with Media Bar Enhanced

Enable Media Bar Enhanced, reload Home, inspect the hero, and run:

```js
HarborCapture.download($0.closest('#slides-container') ?? $0, 'home-media-bar')
```

### Movie details

Inspect the details page and run:

```js
HarborCapture.download($0.closest('#itemDetailPage') ?? $0, 'movie-details')
```

### Series/details variant

Open a series details page, inspect it, and run:

```js
HarborCapture.download($0.closest('#itemDetailPage') ?? $0, 'series-details')
```

### Paused player OSD

Start playback, pause it so the controls are visible, inspect a control inside the OSD, and run:

```js
HarborCapture.download($0.closest('.videoPlayerContainer') ?? $0.closest('.videoOsdBottom') ?? $0, 'paused-player-osd')
```

### Navigation/header

Inspect the top navigation and run:

```js
HarborCapture.download($0.closest('.skinHeader') ?? $0, 'navigation-header')
```

### Drawer

Open the navigation drawer, inspect it, and run:

```js
HarborCapture.download($0.closest('.mainDrawer') ?? $0, 'navigation-drawer')
```

### Menu or dialog

Open a normal Jellyfin action sheet or dialog, inspect it, and run:

```js
HarborCapture.download($0.closest('.actionSheet') ?? $0.closest('.dialog') ?? $0, 'menu-dialog')
```

## First gate

Do not start Harbor card styling from these captures until both of these are available and reviewed:

1. one sanitized vanilla portrait-card JSON
2. one sanitized vanilla landscape-card JSON

Those two captures establish the first real runtime contract for the rework.

## What to send back

Send the generated JSON files as conversation attachments. You can also send screenshots separately when visual context matters, but screenshots do not replace the runtime JSON.
