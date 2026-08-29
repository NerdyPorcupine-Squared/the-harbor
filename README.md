# The Harbor

The Harbor is an original treasure-map theme for Jellyfin 10.11.x web clients. Core remains CSS-only: browsing surfaces use aged parchment and restrained cartography, navigation stays dark timber and navy, and full-color media cards sit inside thin brass-and-timber frames. Details pages and the optional Media Bar Enhanced hero remain cinematic, while playback stays dark and unobstructed. Narrow optional JavaScript Injector adapters are available for the custom Streaming Services home section and for restoring useful global Home navigation when the runtime does not expose Movies and TV Shows there.

This project is in Core v1 release-candidate preparation. Automated gates and owner-operated Jellyfin validation are required before a stable `v1.0.0` release. `main` is not the authoritative stable install target until that promotion occurs.

## Visual model

- Home, library, search, secondary details content, and browsing states use the parchment-dominant map surface.
- Header and drawer navigation stay structurally dark with parchment text and brass active states.
- Posters and thumbnails remain full-color and are never covered by cartography.
- Details and Media Bar Enhanced use dark cinematic artwork regions that transition back into map browsing content.
- The player remains dark and receives no treasure-map decoration over video.

## Install during release-candidate testing

There is no stable v1 install URL yet. Use only the immutable commit SHA supplied for the candidate being tested:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@COMMIT_SHA/theme.css");
```

Do not use a moving `@main` or branch URL as release-validation evidence. Save the Custom CSS change, then perform a hard refresh in each web client.

After Core v1 is approved and tagged, the recommended stable install will be version-pinned to `@v1.0.0/theme.css`.

## Optional Streaming Services adapter

The custom Streaming Services row needs DOM creation, so it is intentionally kept outside Core CSS. If you want that row, create one JavaScript Injector entry and paste the contents of `integrations/streaming-services.js` from the same Harbor commit used by your CSS import. Disable or remove any older Streaming Services injector before enabling the Harbor adapter.

The adapter creates four external links for Netflix, Prime Video, Disney+, and HBO Max. It keeps the custom Streaming Services section first on Home, places native My Media directly after it when that section can be identified safely, and then places Continue Watching after My Media when Jellyfin exposes its native video resume section. Other native Home sections keep their relative order. The adapter does not call Jellyfin APIs, fetch server data, alter playback, or replace native media cards.

The adapter is optional. Without it, Harbor Core remains fully usable and Jellyfin owns the Home section structure normally.

## Optional Home navigation adapter

Some Jellyfin 10.11.x Home runtimes expose only Home and Favorites in the global header even though native Movies and TV Shows library links exist elsewhere in the page DOM. If you want the four-link Home header, create a separate JavaScript Injector entry and paste `integrations/home-navigation.js` from the same immutable Harbor commit used by your CSS.

The adapter preserves Jellyfin's native Home and Favorites controls and inserts Movies and TV Shows between them. It reuses destinations from native Movies and TV Shows links already present in the runtime DOM, so it does not hard-code library IDs or server-specific routes. If either destination cannot be discovered safely, it fails closed and leaves the native header unchanged. The adapter is idempotent across Jellyfin client-side rerenders.

Keep this adapter separate from the Streaming Services adapter so either behavior can be disabled independently.

## Update

During RC testing, replace the old immutable commit SHA only when a new candidate is explicitly frozen. If you use either optional adapter, replace its JavaScript with the copy from that same commit.

After `v1.0.0` is released, stable installs should remain version-pinned and move to a newer release tag deliberately rather than following a moving branch.

## Media Bar Enhanced

Media Bar Enhanced is optional. When its `#slides-container` is present, Harbor styles it as a responsive dark cinematic hero. The parchment map begins in the browsing rows below it. Without the plugin, the first home row starts naturally near the header and no empty hero gap is reserved. Harbor does not implement or alter playback behavior.

## Remove

Delete the Harbor `@import` line from Jellyfin Custom CSS, save, and hard-refresh the client. If you installed either optional JavaScript adapter, also disable or remove its JavaScript Injector entry. No server setting or media record needs removal.

## Rollback

Replace the current import with a previously tested immutable commit SHA or, after stable release, a previously tested version tag. A pinned URL is preferable to browser-cache workarounds because it identifies the exact stylesheet being tested. If you use optional adapters, roll their JavaScript back to the same commit.

## Troubleshooting

- Confirm the import is the only Harbor line in Custom CSS.
- Confirm the URL ends in the root `theme.css`, not a source file under `src/`.
- Hard-refresh or clear only the web client's cached stylesheet.
- Test with browser extensions disabled if controls appear altered.
- If Streaming Services is missing, confirm the maintained Harbor JavaScript Injector entry is enabled and any legacy Streaming Services injector is disabled.
- If Movies or TV Shows are missing from the Home header, confirm `integrations/home-navigation.js` is enabled and that Jellyfin still exposes native Movies and TV Shows library links somewhere in the runtime DOM.
- If the home hero is absent, confirm Media Bar Enhanced is installed and producing `#slides-container`; Core remains usable without it.
- Report only sanitized symptoms and client dimensions. Do not share server addresses, tokens, library names, media titles, screenshots, or logs.

## Development

Use Node.js 20 or later:

```text
npm ci
npx playwright install chromium
npm run verify:release
```

Edit modular files under `src/css/` and run `npm run build:css`. Never hand-edit the generated root `theme.css`.

The release operating procedure is documented in `docs/release/core-v1-rc-process.md`.

## License

Harbor code and original visual assets are available under the MIT License.
