# Harbor Core v1 Release Reconciliation Design

## Objective

Move The Harbor from a fragmented runtime-recovery state to a single auditable Core v1 release candidate without expanding visual scope.

## Current state

- `main` is not the authoritative implementation branch.
- `rework/runtime-recovery-v3` is the current implementation source and was at `1e8c53a569f3e8603b0a58745b540d7d2a502522` when release preparation began.
- The repository already has a consolidated automated gate: `npm run verify:release`.
- Real-server playback passed previously on Jellyfin Web and Jellyfin Media Player, but that evidence belongs to an earlier candidate SHA and must not be transferred to a new candidate.
- `CURSOR_HANDOFF.md` still names `rework/runtime-contracts` as the active validation branch, so repository documentation does not agree on the current source of truth.
- The manual Core matrix intentionally remains unapproved until one immutable candidate is tested on the real server.

## Release architecture

The release process has four boundaries:

1. **Preparation branch**: `release/core-v1-rc1` receives documentation and release-governance corrections. No new visual features are allowed.
2. **Automated gate**: once preparation stops, run `npm run verify:release` against the exact branch head and confirm generated `theme.css` is clean and deterministic.
3. **Immutable candidate**: the exact post-gate commit SHA becomes RC1. Real-server validation must use a commit-pinned jsDelivr import for that SHA.
4. **Promotion**: only the same SHA that passes the manual matrix and independent review may be promoted to `main` and tagged `v1.0.0`.

## Non-negotiable constraints

- Harbor Core remains CSS-only and useful without Media Bar Enhanced.
- Jellyfin and optional plugins own runtime geometry.
- Harbor may style presentation but must not replace card, page, player, OSD, or Media Bar sizing and positioning mechanics.
- Browsing remains parchment-dominant; cinematic media and playback remain dark.
- Root `theme.css` remains generated from `src/css/` and must never be edited directly.
- Any real-server mismatch must become a failing regression fixture or browser contract before production CSS is changed.
- No server URLs, IP addresses, user/account details, tokens, private library names, real media titles, private artwork, screenshots, logs, plugin inventories, or machine paths may be committed.
- No `v1.0.0` tag or stable-release claim is permitted before the manual gate is complete.

## Required workstreams

### 1. Repository source-of-truth reconciliation

Update handoff and release documentation so all references point to `release/core-v1-rc1` during preparation and describe `rework/runtime-recovery-v3` only as its source branch. Keep manual-result documents explicit that earlier playback evidence belongs to an earlier SHA.

### 2. Release-candidate freezing

After preparation commits are complete, run the automated gate and freeze the exact successful branch head as RC1. Record the SHA externally in the validation workflow and in the results document only after the candidate is frozen. Do not mutate RC1 after testing begins. A fix creates RC2.

### 3. Same-candidate real-server validation

Validate the complete desktop and mobile Core matrix against the frozen SHA, including Home, navigation, library cards, Media Bar Enhanced, details, menus/dialogs, search states, player, 200% zoom, reduced motion, touch targets, login/dashboard/error surfaces, and mobile safe areas.

### 4. Optional integration validation

Validate the Harbor Streaming Services adapter independently from Core. Core must remain usable when the adapter is absent. Remove the legacy Streaming Services injector only after the replacement adapter passes its lifecycle and ordering checks.

### 5. Failure-to-regression workflow

For any failed matrix row:

1. capture only sanitized runtime structure needed to reproduce the failure;
2. add or update a versioned fixture/browser contract;
3. prove the test fails before changing production CSS or integration code;
4. implement the narrowest fix that preserves Jellyfin/plugin geometry ownership;
5. run the focused regression test and then `npm run verify:release`;
6. create a new immutable RC SHA if the candidate changed.

### 6. Independent review and promotion

After a same-SHA manual pass, perform an independent review focused on geometry ownership, selector scope, player isolation, Media Bar isolation, accessibility, publication safety, dead selectors, specificity escalation, and integration side effects. Only then merge the validated candidate into `main`, tag `v1.0.0`, and update stable installation instructions to a version-pinned URL.

## Success criteria

Core v1 is ready when one immutable candidate SHA satisfies all of the following:

- `npm run verify:release` passes from a clean checkout;
- rebuilding `theme.css` produces no uncommitted diff;
- the complete same-candidate manual matrix is acceptable on required clients;
- optional integration behavior is either separately validated or explicitly excluded from Core release claims;
- independent review finds no release-blocking defect;
- public documentation and compatibility claims match the exact tested configuration.
