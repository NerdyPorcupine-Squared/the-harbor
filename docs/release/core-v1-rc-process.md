# Harbor Core v1 RC Process

This is the release operating procedure for Harbor Core v1. It separates a branch that is still being prepared from an immutable release candidate that is under test.

## State machine

```text
PREPARING -> AUTOMATED-GATE -> FROZEN-RC -> MANUAL-VALIDATION -> REVIEW -> PROMOTE
                              |                 |
                              +----failure------+--> NEW RC
```

## PREPARING

Active branch: `release/core-v1-rc1`.

The branch was cut from `rework/runtime-recovery-v3`. Documentation, test-harness, and release-governance corrections may be committed during this state. Do not add new visual scope while preparing Core v1.

A branch name is not a release candidate. Do not use a moving branch reference such as `@main` or `@release/core-v1-rc1` as evidence for manual certification.

## AUTOMATED-GATE

When preparation work stops, test from a clean checkout.

Run:

```bash
npm ci
npx playwright install chromium
npm run verify:release
npm run build:css
git diff --exit-code -- theme.css
git status --short
```

Required outcome:

- all commands exit successfully;
- rebuilding `theme.css` produces no diff;
- `git status --short` produces no output.

If any command fails, remain in PREPARING. Fix the failure using the repository's regression-first rules and rerun the complete gate.

## FROZEN-RC

After the automated gate passes, record:

```bash
git rev-parse HEAD
```

That exact SHA is the release candidate. Use it in Jellyfin:

```css
@import url("https://cdn.jsdelivr.net/gh/NerdyPorcupine-Squared/the-harbor@<FROZEN_SHA>/theme.css");
```

A frozen RC is immutable for certification purposes. Do not commit a production, test-fixture, generated-CSS, or release-document change and continue calling the result the same RC. If the tested content tree changes, create the next RC.

## MANUAL-VALIDATION

Use:

- `docs/testing/runtime-recovery-v3-owner-checklist.md`
- `docs/testing/media-bar-v3-validation-profile.md`
- `docs/testing/core-manual-matrix.md`
- `docs/testing/runtime-recovery-v3-results.md`

Every acceptance result must belong to the same frozen SHA.

Historical evidence remains historical. Playback that passed on candidate `4d87ed65c8276d115e60902bcd98e92e3b551283` proves the corresponding regression was fixed there, but it does not certify a newer RC until playback is rerun on that newer SHA.

If a row fails:

1. collect only the sanitized runtime structure required to reproduce it;
2. add a failing fixture or browser contract;
3. prove that test fails before editing production CSS or integration code;
4. implement the narrowest fix;
5. run the focused regression test;
6. run `npm run verify:release`;
7. freeze a new RC SHA;
8. rerun the failed row and any regression-sensitive rows.

Never add temporary Custom CSS patches while gathering release evidence.

## REVIEW

After one frozen SHA passes the required manual matrix, perform an independent review focused on:

- Jellyfin/plugin geometry ownership;
- player and OSD isolation;
- Media Bar isolation;
- selector scope and accidental cross-surface leakage;
- artwork mechanics;
- keyboard focus, reduced motion, forced colors, and touch targets;
- specificity escalation and unexplained `!important` usage;
- optional integration side effects;
- publication/privacy safety.

A release-blocking review finding returns the process to the regression workflow and requires a new RC.

## PROMOTE

Only the exact candidate that passed AUTOMATED-GATE, MANUAL-VALIDATION, and REVIEW may be promoted.

Promotion sequence:

1. merge the validated content into `main` without production changes;
2. rerun `npm run verify:release` on the merge result;
3. tag `v1.0.0` only after that gate passes;
4. update the recommended stable install URL to the version-pinned `@v1.0.0/theme.css` path;
5. update compatibility claims with only the Jellyfin and Media Bar versions actually validated;
6. clean up superseded recovery and RC branches after release.

## Optional Streaming Services adapter

The optional Harbor Streaming Services adapter is not allowed to become a hidden dependency of Core. Validate Core with the adapter absent. Validate the replacement adapter separately for lifecycle behavior, duplicate prevention, intended row ordering, and preservation of unrelated Jellyfin result ordering. Retire the legacy Streaming Services injector only after the replacement adapter passes that validation.
