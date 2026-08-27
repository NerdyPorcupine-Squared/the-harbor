# Pirate Surface Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Harbor's corrected Jellyfin geometry while turning the header, navigation, home hero transition, details page, and optional Streaming Services section into a cohesive pirate/chart-room interface.

**Architecture:** Jellyfin and Media Bar Enhanced retain structural ownership. Harbor modifies presentation through focused CSS modules, local decorative assets, and contract tests. The existing geometry ownership linter is a hard boundary.

**Tech Stack:** CSS, Jellyfin Web 10.11.11 DOM contracts, Media Bar Enhanced CSS contract, Node test runner, Playwright Chromium, GitHub Actions on Windows.

**Spec:** `docs/superpowers/specs/2026-08-27-pirate-surface-polish-design.md`

## Global Constraints

- Do not modify Jellyfin card/artwork geometry.
- Do not resize or reposition Media Bar Enhanced.
- Do not change player/OSD geometry.
- Preserve the existing library presentation except active navigation color.
- Keep red limited to the optional ElganFlix play mark. Harbor interactions use brass/parchment.
- Streaming Services remains JavaScript-created; Harbor CSS only styles its existing DOM.
- No stable release until real browser and Jellyfin Media Player validation pass.

---

### Task 1: Add RED polish contracts

**Files:**
- Create: `tests/build/pirate-polish-contract.test.mjs`
- Modify: `tests/fixtures/jellyfin/home-with-media-bar.html`
- Modify: `tests/fixtures/jellyfin/home-without-media-bar.html`
- Modify: `tests/visual/treasure-map.spec.mjs`

**Interfaces:**
- Consumes: existing Harbor CSS entrypoint and Jellyfin fixtures.
- Produces: failing tests for branding, active tabs, dossier details, Media Bar blending, and Streaming Services styling.

- [ ] Add build assertions that require a branding module, Streaming Services integration, brass active-tab override, details decoration, and cosmetic-only Media Bar/home blending.
- [ ] Add a sanitized `#homelabStreamingHub` fixture to both home modes using local placeholder service labels rather than live URLs/images.
- [ ] Add visual assertions for active-tab color, Streaming Services presentation, details dossier treatment, and unchanged plugin geometry.
- [ ] Push RED tests and confirm CI fails for missing implementation rather than fixture breakage.

### Task 2: Integrate ElganFlix branding and Harbor navigation state

**Files:**
- Create: `src/css/components/branding.css`
- Modify: `src/css/components/navigation.css`
- Modify: `src/css/index.css`

**Interfaces:**
- Consumes: Jellyfin `.pageTitle*`, `.osdHeader`, `.emby-tab-button-active`, `.headerUserButton`, and Harbor tokens.
- Produces: non-OSD ElganFlix wordmark and brass/navy selected navigation.

- [ ] Implement non-OSD stock-logo suppression and `ElganFlix` pseudo-element wordmark.
- [ ] Retain a small red play triangle only as the brand mark.
- [ ] Restore all OSD title content and suppress branding pseudo-elements within `.osdHeader`.
- [ ] Style profile/focus treatment with Harbor brass, not red.
- [ ] Strengthen `.emby-tab-button-active` and `[aria-selected="true"]` with a higher-specificity brass/navy cosmetic override and `!important` only where necessary to defeat inherited red theme state.
- [ ] Run core and targeted visual tests.

### Task 3: Build the captain's dossier details presentation

**Files:**
- Modify: `src/css/pages/details.css`

**Interfaces:**
- Consumes: real Jellyfin detail selectors already modeled by `tests/fixtures/jellyfin/details.html`.
- Produces: cinematic primary details plus parchment secondary browsing without geometry ownership.

- [ ] Add subtle local route/flourish decoration to dark detail surfaces without touching `.itemBackdrop` artwork mechanics.
- [ ] Give `.itemName`, `.sectionTitle`, and metadata stronger chart-room typography and brass treatment.
- [ ] Present `.overview` and `.itemDetailsGroup` as restrained logbook/dossier panels using backgrounds, shadows, outlines, and color only.
- [ ] Keep action controls readable against the dark primary surface.
- [ ] Confirm poster, backdrop, primary, and secondary geometry assertions are unchanged.

### Task 4: Blend Media Bar Enhanced into the chart table

**Files:**
- Modify: `src/css/base/map-surface.css`
- Modify: `src/css/integrations/media-bar-enhanced.css`

**Interfaces:**
- Consumes: plugin-owned `#slides-container`, `.homeSectionsContainer`, backdrop/overlay/control classes.
- Produces: a cosmetic hero-to-parchment transition while preserving plugin 90vh hero and 65vh row offset in fixtures.

- [ ] Replace the heavy hard-edged parchment cap with layered cosmetic shadows/feathering on `.homeSectionsContainer`.
- [ ] Add cinematic lower-edge shading to `#slides-container` and refine overlay gradients without setting geometry.
- [ ] Re-theme dots, arrows, progress accents, and Media Bar buttons toward brass/parchment.
- [ ] Keep plugin metadata, button, video, and hero positions untouched.
- [ ] Run geometry lint and Media Bar visual tests.

### Task 5: Style the optional Streaming Services section

**Files:**
- Create: `src/css/integrations/streaming-services.css`
- Modify: `src/css/index.css`

**Interfaces:**
- Consumes: JavaScript-generated `#homelabStreamingHub` DOM.
- Produces: Harbor-native visual treatment only.

- [ ] Style section title and service cards to match the parchment home surface and dark chart-room media plaques.
- [ ] Use high-specificity cosmetic declarations where required to beat the old injector's later inline `<style>` block, without taking over row/card geometry.
- [ ] Preserve service logos and accessible link behavior.
- [ ] Provide brass focus-visible/hover states.
- [ ] Verify the section is absent-safe when JavaScript Injector is disabled.

### Task 6: Full regression and immutable candidate

**Files:**
- Generated: `theme.css`
- Update only if needed: documentation/manual matrix notes.

**Interfaces:**
- Consumes: completed source modules.
- Produces: one immutable SHA for real-server testing.

- [ ] Run `npm run verify:core` and confirm zero failures.
- [ ] Run `npm run check:publication` and confirm the publication boundary remains sanitized.
- [ ] Run `npm run test:visual` and confirm all runnable Chromium checks pass.
- [ ] Download the CI-generated `theme.css` artifact and commit exactly that generated stylesheet to the branch.
- [ ] Trigger one final normal read-only CI run on the exact candidate commit.
- [ ] Confirm the generated artifact and committed `theme.css` match.

### Task 7: Independent final review

**Files:**
- Review only unless defects are found.

**Interfaces:**
- Consumes: exact immutable candidate and design spec.
- Produces: release-blocker list or approval for manual real-server validation.

- [ ] Re-read the design spec line by line and map each requirement to source/test evidence.
- [ ] Inspect the diff from `81ab9a25c7ccf049ab5892c56d6330e48de33efa` to the candidate for geometry regressions, overbroad selectors, unnecessary `!important`, remote dependencies, and OSD leakage.
- [ ] Verify library/card source files were not structurally modified.
- [ ] Verify player geometry and player cartography tests still pass.
- [ ] If any issue is found, add a regression test before fixing it and rerun the final gate.
- [ ] Only then provide the pinned jsDelivr import for browser and Jellyfin Media Player testing.