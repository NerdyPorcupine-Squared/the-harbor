# The Harbor

The Harbor is an original treasure-map theme for Jellyfin 10.11.x web clients. Core remains CSS-only: browsing surfaces use aged parchment and restrained cartography, navigation stays dark timber and navy, and full-color media cards sit inside thin brass-and-timber frames. Details pages and the optional Media Bar Enhanced hero remain cinematic, while playback stays dark and unobstructed. Optional JavaScript Injector adapters are available for Home enhancements that require DOM changes.

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

## Recommended Home Enhancements injector

When you want both the custom Streaming Services section and the four-link `Home | Movies | TV Shows | Favorites` header, use **one** JavaScript Injector entry containing `integrations/home-enhancements.js` from the same immutable Harbor commit as the CSS import.

Before enabling that entry, disable or remove every older Streaming Services or Media Top Navigation injector and disable separate Harbor `streaming-services.js` or `home-navigation.js` entries. Do not run the combined injector alongside either standalone adapter. Multiple scripts trying to own the same Home section can continuously reorder the same DOM.

`home-enhancements.js` is a deterministic composition of the two tested standalone adapters. It creates and owns the Harbor Streaming Services hub, adopts stale `#homelabStreamingHub` markup left by an older implementation when the maintained injector starts, keeps Streaming Services first, keeps My Media next when it can be identified safely, preserves the remaining native Home section order, and restores Movies and TV Shows in the global header by reusing native Jellyfin library routes already present in the DOM.

For release-candidate owner validation, the combined injector is the required Home-enhancement path because it removes ambiguity about which Harbor Home behaviors are active. After saving the injector and hard-refreshing Jellyfin, make this the first Home runtime check in the browser console:

```js
document.documentElement.getAttribute("data-harbor-home-enhancements")
```

The RC3 adapter must return `"core-v1-rc3"`. If the attribute is absent, stop there: the combined Harbor injector did not execute in that client. Fix injector delivery or activation before debugging Home order, Streaming Services, navigation, or CSS. Once the sentinel is present, a managed Streaming Services hub carries `data-harbor-streaming-services="true"`, and Harbor-created Movies and TV Shows controls carry `data-harbor-global-nav`.

## Standalone Streaming Services adapter

If you want Streaming Services without the global navigation enhancement, create one JavaScript Injector entry and paste `integrations/streaming-services.js` from the same Harbor commit used by your CSS import. Disable or remove any older Streaming Services injector first.

The adapter creates four external links for Netflix, Prime Video, Disney+, and HBO Max. It keeps the custom Streaming Services section first on Home, places native My Media directly after it when that section can be identified safely, and preserves the remaining native Home section order. The adapter does not call Jellyfin APIs, fetch server data, alter playback, or replace native media cards.

The adapter is optional. Without it, Harbor Core remains fully usable and Jellyfin owns the Home section structure normally.

## Standalone Home navigation adapter

If you want only the four-link Home header, create one JavaScript Injector entry containing `integrations/home-navigation.js` from the same immutable Harbor commit used by your CSS.

The adapter preserves Jellyfin's native Home and Favorites controls and inserts Movies and TV Shows between them. It reuses destinations from native Movies and TV Shows links already present in the runtime DOM, so it does not hard-code library IDs or server-specific routes. If either destination cannot be discovered safely, it fails closed and leaves the native header unchanged. The adapter is idempotent across Jellyfin client-side rerenders.

Do not run this standalone adapter alongside `integrations/home-enhancements.js`.

## Update

During RC testing, replace the old immutable commit SHA only when a new candidate is explicitly supplied. If you use Home enhancements, replace the JavaScript with the matching `integrations/home-enhancements.js` from that same commit. Keep only one active Harbor Home injector.

After `v1.0.0` is released, stable installs should remain version-pinned and move to a newer release tag deliberately rather than following a moving branch.

## Media Bar Enhanced

Media Bar Enhanced is optional. When its `#slides-container` is present, Harbor styles it as a responsive dark cinematic hero. The parchment map begins in the browsing rows below it. Without the plugin, the first home row starts naturally near the header and no empty hero gap is reserved. Harbor does not implement or alter playback behavior.

## Remove

Delete the Harbor `@import` line from Jellyfin Custom CSS, save, and hard-refresh the client. If you installed the recommended Home Enhancements injector or either standalone adapter, also disable or remove that JavaScript Injector entry. No server setting or media record needs removal.

## Rollback

Replace the current import with a previously tested immutable commit SHA or, after stable release, a previously tested version tag. If Home enhancements are enabled, replace the active Home injector with `integrations/home-enhancements.js` from that same rollback commit. Do not combine scripts from different Harbor revisions.

## Troubleshooting

- Confirm the import is the only Harbor line in Custom CSS.
- Confirm the URL ends in the root `theme.css`, not a source file under `src/`.
- Hard-refresh or clear only the web client's cached stylesheet.
- Test with browser extensions disabled if controls appear altered.
- For the complete Harbor Home experience, confirm exactly one active injector contains `integrations/home-enhancements.js` from the same commit as the CSS.
- Disable or remove legacy Streaming Services, legacy Media Top Navigation, and separate Harbor Home adapter entries while the combined injector is active.
- Run `document.documentElement.getAttribute("data-harbor-home-enhancements")` first. RC3 must return `"core-v1-rc3"`. If it does not, the combined injector did not execute and Home behavior should not be evaluated yet.
- A maintained Streaming Services hub has `data-harbor-streaming-services="true"`; an unowned `#homelabStreamingHub` indicates stale or competing markup.
- Harbor-injected Movies and TV Shows header controls carry `data-harbor-global-nav` attributes. If none are present after the RC3 sentinel is confirmed, verify that Jellyfin still exposes native Movies and TV Shows links in the current runtime DOM.
- If the home hero is absent, confirm Media Bar Enhanced is installed and producing `#slides-container`; Core remains usable without it.
- Report only sanitized structural symptoms and client dimensions. Do not publish server addresses, tokens, library identifiers, account details, or raw authenticated URLs.

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
