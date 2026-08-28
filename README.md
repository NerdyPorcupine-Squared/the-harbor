# The Harbor

The Harbor is an original treasure-map theme for Jellyfin 10.11.x web clients. Core remains CSS-only: browsing surfaces use aged parchment and restrained cartography, navigation stays dark timber and navy, and full-color media cards sit inside thin brass-and-timber frames. Details pages and the optional Media Bar Enhanced hero remain cinematic, while playback stays dark and unobstructed. An optional JavaScript Injector adapter is available only for the custom Streaming Services home section.

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

## Optional Streaming Services adapter

The custom Streaming Services row is the one Harbor feature that needs DOM creation, so it is intentionally kept outside Core CSS. If you want that row, create one JavaScript Injector entry and paste the contents of `integrations/streaming-services.js` from the same Harbor commit used by your CSS import. Disable or remove any older Streaming Services injector before enabling the Harbor adapter.

The adapter creates four external links for Netflix, Prime Video, Disney+, and HBO Max. It keeps the custom Streaming Services section first on Home and, when Jellyfin exposes its native video resume section, places Continue Watching directly after it. Other native Home sections keep their relative order. The adapter does not call Jellyfin APIs, fetch server data, alter playback, or replace native media cards.

The adapter is optional. Without it, Harbor Core remains fully usable and Jellyfin owns the Home section structure normally.

## Update

The stable `main` import receives updates only when a tested candidate is promoted. Hard-refresh the client after an update. For a controlled update, replace the old commit SHA with the newly published candidate SHA. If you use the optional Streaming Services adapter, replace its JavaScript with the copy from that same commit.

## Media Bar Enhanced

Media Bar Enhanced is optional. When its `#slides-container` is present, Harbor styles it as a responsive dark cinematic hero. The parchment map begins in the browsing rows below it. Without the plugin, the first home row starts naturally near the header and no empty hero gap is reserved. Harbor does not implement or alter playback behavior.

## Remove

Delete the Harbor `@import` line from Jellyfin Custom CSS, save, and hard-refresh the client. If you installed the optional Streaming Services adapter, also disable or remove that JavaScript Injector entry. No server setting or media record needs removal.

## Rollback

Replace the current import with a previously tested immutable commit SHA. A commit-pinned URL is preferable to browser-cache workarounds because it identifies the exact stylesheet being tested. If you use the optional adapter, roll its JavaScript back to the same commit.

## Troubleshooting

- Confirm the import is the only Harbor line in Custom CSS.
- Confirm the URL ends in the root `theme.css`, not a source file under `src/`.
- Hard-refresh or clear only the web client's cached stylesheet.
- Test with browser extensions disabled if controls appear altered.
- If Streaming Services is missing, confirm the maintained Harbor JavaScript Injector entry is enabled and any legacy Streaming Services injector is disabled.
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
