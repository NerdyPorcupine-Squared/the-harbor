# Harbor Core v1 Release Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one auditable Harbor Core v1 release candidate, validate it against both automated and real-server gates, and promote only that exact candidate to `main` and `v1.0.0`.

**Architecture:** Treat release preparation, candidate freezing, real-server validation, regression hardening, and promotion as separate boundaries. The release branch may change during preparation, but once an RC SHA is declared, any code or CSS change creates a new RC rather than mutating the candidate under test.

**Tech Stack:** Node.js >=20, repository-local build scripts, Playwright 1.62.1, Jellyfin 10.11.x, Media Bar Enhanced 3.6.x-compatible validation profile, Git/GitHub, jsDelivr commit-pinned CSS delivery.

**Spec:** `docs/superpowers/specs/2026-08-28-core-v1-release-reconciliation-design.md`

## Global Constraints

- Harbor Core remains CSS-only and useful without Media Bar Enhanced.
- Jellyfin and optional plugins own runtime geometry.
- Root `theme.css` is generated from `src/css/`; never edit `theme.css` directly.
- Real-server failures become failing regression fixtures or browser contracts before production fixes.
- No private server/account/media/authentication data may enter the repository.
- No stable release claim or `v1.0.0` tag before same-candidate manual validation and independent review.

---

### Task 1: Reconcile release source-of-truth documentation

**Files:**
- Modify: `CURSOR_HANDOFF.md`
- Create: `docs/release/core-v1-rc-process.md`
- Review: `docs/testing/core-manual-matrix.md`
- Review: `docs/testing/runtime-recovery-v3-results.md`

**Interfaces:**
- Consumes: current source branch `rework/runtime-recovery-v3`; preparation branch `release/core-v1-rc1`; automated command `npm run verify:release`.
- Produces: one documented release workflow that distinguishes preparation branch, immutable candidate SHA, and historical validation evidence.

- [ ] **Step 1: Correct the active branch language in `CURSOR_HANDOFF.md`**

Replace the stale statement naming `rework/runtime-contracts` with language that states `release/core-v1-rc1` is the active release-preparation branch and `rework/runtime-recovery-v3` is its implementation source.

- [ ] **Step 2: Consolidate the automated gate wording**

Document `npm run verify:release` as the canonical automated release command while retaining its component commands for debugging.

- [ ] **Step 3: Create the RC operating procedure**

Create `docs/release/core-v1-rc-process.md` with these exact states:

```text
PREPARING -> AUTOMATED-GATE -> FROZEN-RC -> MANUAL-VALIDATION -> REVIEW -> PROMOTE
                              |                 |
                              +----failure------+--> NEW RC
```

The document must state that a frozen RC SHA is never modified in place.

- [ ] **Step 4: Preserve historical evidence accurately**

Keep the existing playback PASS attached only to candidate `4d87ed65c8276d115e60902bcd98e92e3b551283`. Do not mark the new RC playback row acceptable until it is rerun.

- [ ] **Step 5: Review the diff for contradictory branch/candidate language**

Search the touched documentation for `runtime-contracts`, `COMMIT_SHA`, `stable release`, and `candidate` and ensure each occurrence is intentional.

- [ ] **Step 6: Commit**

```bash
git add CURSOR_HANDOFF.md docs/release/core-v1-rc-process.md docs/testing/core-manual-matrix.md docs/testing/runtime-recovery-v3-results.md
git commit -m "docs: reconcile Core v1 release source of truth"
```

### Task 2: Freeze RC1 through the automated gate

**Files:**
- Verify: `package.json`
- Verify generated output: `theme.css`
- Verify: `src/css/**`
- Verify: `tests/**`
- Verify: `scripts/**`

**Interfaces:**
- Consumes: prepared `release/core-v1-rc1` branch.
- Produces: one exact SHA eligible for real-server testing.

- [ ] **Step 1: Install exact dependencies**

Run:

```bash
npm ci
npx playwright install chromium
```

Expected: both commands exit 0.

- [ ] **Step 2: Run the canonical release gate**

Run:

```bash
npm run verify:release
```

Expected: CSS lint, geometry ownership, format check, build tests, publication checks, and Playwright tests all pass.

- [ ] **Step 3: Verify generated CSS determinism**

Run:

```bash
npm run build:css
git diff --exit-code -- theme.css
```

Expected: exit 0 and no `theme.css` diff.

- [ ] **Step 4: Verify clean working tree**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 5: Record the exact branch head as RC1**

Run:

```bash
git rev-parse HEAD
```

Use that SHA in the commit-pinned jsDelivr import for all subsequent real-server tests. No branch mutation is allowed after this step.

### Task 3: Execute same-candidate desktop real-server validation

**Files:**
- Modify after testing: `docs/testing/core-manual-matrix.md`
- Modify after testing: `docs/testing/runtime-recovery-v3-results.md`
- Reference: `docs/testing/runtime-recovery-v3-owner-checklist.md`
- Reference: `docs/testing/media-bar-v3-validation-profile.md`

**Interfaces:**
- Consumes: frozen RC1 SHA and sanitized owner test observations.
- Produces: explicit `Acceptable` or `Needs change` results for every desktop row.

- [ ] **Step 1: Establish clean Jellyfin customization state**

Use one commit-pinned Harbor CSS import, disable legacy Branding and Media Top Navigation injectors, and apply the documented Media Bar validation profile.

- [ ] **Step 2: Validate desktop navigation and browsing**

Test Home, Movies, TV Shows, header, drawer, tabs, keyboard focus, mixed libraries, filters, sorting, missing artwork, progress, and Streaming Services/Continue Watching ordering.

- [ ] **Step 3: Validate Media Bar Enhanced**

Test static backdrop, playing trailer, controls, pagination, and the cinematic-to-parchment seam without Harbor taking geometry ownership.

- [ ] **Step 4: Validate details and secondary content**

Test movie details, series details, people, seasons, episodes, forms, menus, dialogs, dashboard, and tables.

- [ ] **Step 5: Revalidate playback on the frozen SHA**

Test visible playing video, visible paused video behind the OSD, controls, seek, volume, captions, fullscreen, and absence of parchment/cartography over video in Jellyfin Web and Jellyfin Media Player.

- [ ] **Step 6: Validate accessibility-sensitive desktop states**

Test browser 200% zoom and reduced-motion behavior.

- [ ] **Step 7: Record only sanitized outcomes**

Update result files with row status, client type/viewport, sanitized symptom, reproduction steps, and expected behavior. Do not commit screenshots or private server/media data.

### Task 4: Execute same-candidate mobile real-server validation

**Files:**
- Modify after testing: `docs/testing/core-manual-matrix.md`

**Interfaces:**
- Consumes: frozen RC1 SHA.
- Produces: explicit mobile matrix outcomes.

- [ ] **Step 1: Validate mobile Home and cartography density**

Confirm no page overflow and that header/hero controls remain reachable.

- [ ] **Step 2: Validate mobile library, search, and details**

Confirm no horizontal page overflow across populated and empty/loading/error states.

- [ ] **Step 3: Validate interaction dimensions**

Confirm interactive targets are at least 40×40 CSS pixels where required by the Harbor contract.

- [ ] **Step 4: Validate login, dashboard, alerts, and errors**

Confirm styling remains usable and structurally native.

- [ ] **Step 5: Validate player and safe areas**

Test visible playback, controls, portrait/landscape safe-area spacing, and absence of cartography over media.

- [ ] **Step 6: Record sanitized outcomes**

Mark every mobile row `Acceptable` or `Needs change` with concise reproduction information.

### Task 5: Convert each real-server failure into regression coverage

**Files:**
- Modify as needed: `tests/fixtures/jf-10.11.11/**`
- Modify as needed: `tests/**`
- Modify only after failing test exists: `src/css/**` or `integrations/**`
- Regenerate: `theme.css` only through `npm run build:css`

**Interfaces:**
- Consumes: one failed manual matrix row and a sanitized runtime capture.
- Produces: one reproducible automated regression plus the narrowest passing fix.

- [ ] **Step 1: Add the minimal sanitized fixture or browser scenario that reproduces the failure**

Do not include authentication state, server addresses, private titles, artwork, IDs, or raw media URLs.

- [ ] **Step 2: Add the failing contract assertion**

The assertion must describe the violated Harbor ownership or presentation contract, not screenshot noise.

- [ ] **Step 3: Run the focused test and prove it fails**

Use the repository's existing focused Node or Playwright command for that test file/case. Expected: failure for the observed regression.

- [ ] **Step 4: Implement the narrowest production fix**

Change source CSS or optional integration code only. Do not edit generated `theme.css` directly.

- [ ] **Step 5: Run the focused test and prove it passes**

Expected: pass.

- [ ] **Step 6: Run the full release gate**

```bash
npm run verify:release
```

Expected: all automated checks pass.

- [ ] **Step 7: Create the next RC instead of mutating the tested candidate**

Any production change invalidates the previous RC for same-candidate certification. Freeze a new SHA and rerun affected manual rows plus regression-sensitive surfaces.

### Task 6: Validate the optional Streaming Services adapter

**Files:**
- Review/modify as needed: `integrations/**`
- Add/modify tests as needed: `tests/**`
- Modify validation results: `docs/testing/runtime-recovery-v3-results.md`

**Interfaces:**
- Consumes: Core behavior with no adapter and current replacement adapter implementation.
- Produces: explicit compatibility status independent of Core CSS certification.

- [ ] **Step 1: Confirm Core remains usable with the Harbor adapter disabled**

Expected: no Core layout or navigation dependency on the integration.

- [ ] **Step 2: Enable only the Harbor replacement adapter**

After validation begins, do not run the legacy Streaming Services injector concurrently unless specifically comparing behavior.

- [ ] **Step 3: Test lifecycle behavior**

Navigate away from and back to Home, trigger Jellyfin rerenders, and confirm there are no duplicate rows or duplicate headings.

- [ ] **Step 4: Test ordering behavior**

Confirm Streaming Services is first and Continue Watching is second without altering unrelated native result ordering.

- [ ] **Step 5: Add regression coverage before fixing any discovered integration defect**

Follow Task 5's failing-test-first workflow.

### Task 7: Independent release review

**Files:**
- Review: `src/css/**`
- Review: `integrations/**`
- Review: `scripts/check-geometry-ownership.mjs`
- Review: `tests/**`
- Review: publication and release docs

**Interfaces:**
- Consumes: one same-candidate automated/manual pass.
- Produces: release-blocking findings or approval to promote.

- [ ] **Step 1: Review geometry ownership**

Look specifically for positioning, dimensions, overflow, transforms, aspect-ratio ownership, and selector scope on Jellyfin/plugin-owned structures.

- [ ] **Step 2: Review isolation boundaries**

Check player, OSD, dialogs, Media Bar, details, and navigation for selectors that can leak across surfaces.

- [ ] **Step 3: Review accessibility and specificity**

Check visible focus, reduced motion, forced colors, target sizing, unexplained `!important`, and specificity escalation.

- [ ] **Step 4: Review publication safety and dead compatibility code**

Verify no private artifacts are published and remove only clearly obsolete compatibility selectors that are covered by tests.

- [ ] **Step 5: If any release blocker is found, return to Task 5 and produce a new RC**

Do not waive same-candidate requirements.

### Task 8: Promote the validated candidate

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/compatibility.md`
- Finalize: validation result documents

**Interfaces:**
- Consumes: exact validated SHA with automated/manual/review approval.
- Produces: authoritative `main` and `v1.0.0` release documentation.

- [ ] **Step 1: Merge the validated candidate into `main` without production changes**

The merge must preserve the exact validated content tree.

- [ ] **Step 2: Run `npm run verify:release` on the merge result**

Expected: pass.

- [ ] **Step 3: Tag `v1.0.0`**

Tag only after the merge-result gate passes.

- [ ] **Step 4: Update stable installation documentation**

Make the recommended install URL version-pinned to `@v1.0.0/theme.css` and distinguish stable from development installs.

- [ ] **Step 5: Update compatibility and changelog claims**

Record the exact Jellyfin and Media Bar versions actually validated. Do not generalize beyond tested evidence.

- [ ] **Step 6: Clean obsolete active-looking branches only after release**

Retain Git history but remove superseded recovery/RC branches that could be mistaken for current development.
