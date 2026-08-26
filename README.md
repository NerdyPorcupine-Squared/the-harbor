# The Harbor

The Harbor is an original, CSS-only treasure-map theme for Jellyfin 10.11.x web clients. Browsing surfaces use aged parchment and restrained cartography, navigation stays dark timber and navy, and full-color media cards sit inside thin brass-and-timber frames. Details pages and the optional Media Bar Enhanced hero remain cinematic, while playback stays dark and unobstructed.

This project remains a release candidate. Automated fixture and Windows Chromium gates and owner-operated Jellyfin validation are required before a stable release.

## Visual model

- Home, library, search, secondary details content, and browsing states use the parchment-dominant map surface.
- Header and drawer navigation stay structurally dark with parchment text and brass active states.
- Posters and thumbnails remain full-color and are never covered by cartography.
- Details and Media Bar Enhanced use dark cinematic artwork regions that transition back into map browsing content.
- The player remains dark and receives no treasure-map decoration over video.

## Install

In Jellyfin Dashboard, open General, then Custom CSS, and add:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@main/theme.css");
```

Save, then perform a hard refresh in each web client.

For release-candidate testing, use the immutable commit supplied with the candidate instead of `main`:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@COMMIT_SHA/theme.css");
```

## Update

The stable `main` import receives updates only when a tested candidate is promoted. Hard-refresh the client after an update. For a controlled update, replace the old commit SHA with the newly published candidate SHA.

## Media Bar Enhanced

Media Bar Enhanced is optional. When its `#slides-container` is present, Harbor styles it as a responsive dark cinematic hero. The parchment map begins in the browsing rows below it. Without the plugin, the first home row starts naturally near the header and no empty hero gap is reserved. Harbor does not implement or alter playback behavior.

## Remove

Delete the Harbor `@import` line from Jellyfin Custom CSS, save, and hard-refresh the client. No JavaScript, server setting, or media record needs removal.

## Rollback

Replace the current import with a previously tested immutable commit SHA. A commit-pinned URL is preferable to browser-cache workarounds because it identifies the exact stylesheet being tested.

## Troubleshooting

- Confirm the import is the only Harbor line in Custom CSS.
- Confirm the URL ends in the root `theme.css`, not a source file under `src/`.
- Hard-refresh or clear only the web client's cached stylesheet.
- Test with browser extensions disabled if controls appear altered.
- If the home hero is absent, confirm Media Bar Enhanced is installed and producing `#slides-container`; Core remains usable without it.
- Report only sanitized symptoms and client dimensions. Do not share server addresses, tokens, library names, media titles, screenshots, or logs.

## Development

Use Node.js 20 or later:

```text
npm install
npx playwright install chromium
npm run verify:core
npm run test:visual
npm run check:publication
```

Edit modular files under `src/css/` and run `npm run build:css`. Never hand-edit the generated root `theme.css`.

## License

Harbor code and original visual assets are available under the MIT License.
