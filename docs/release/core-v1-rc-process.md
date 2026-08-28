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

A frozen RC is immutable for certification purposes. Do not commit a production, test-fixture, generated-CSS, or release-document change to the frozen candidate and continue calling the result the same RC. If the tested content tree changes, create the next RC.

Do not record the frozen SHA inside the frozen candidate. A commit cannot contain its own final SHA without creating a new commit. Record candidate identity and test outcomes in the external validation ledger described below.

## Validation ledger

Create one GitHub issue for each frozen candidate, for example `Core v1 RC1 validation ledger`. The issue is the authoritative mutable record for candidate SHA, client configuration, manual matrix outcomes, sanitized defects, review findings, and final disposition.

The validation ledger must record:

- the full frozen commit SHA;
- Jellyfin version under test;
- Media Bar Enhanced version when used;
- whether the optional Streaming Services adapter is enabled;
- desktop and mobile matrix row results;
- Jellyfin Web and Jellyfin Media Player playback outcomes;
- links to regression commits created from any failed row;
- independent review result;
- final status: `PASS`, `FAIL`, or `SUPERSEDED`.

Do not put server addresses, account information, private media names, tokens, screenshots, raw logs, plugin inventories, or machine paths in the issue.

## MANUAL-VALIDATION

Use these repository files as immutable templates and reference material:

- `docs/testing/runtime-recovery-v3-owner-checklist.md`
- `docs/testing/media-bar-v3-validation-profile.md`
- `docs/testing/core-manual-matrix.md`
- `docs/testing/runtime-recovery-v3-results.md`

Record the actual candidate-specific outcomes in the GitHub issue validation ledger, not by editing the frozen candidate branch.

Every acceptance result must belong to the same frozen SHA.

Historical evidence remains historical. Playback that passed on candidate `4d87ed65c8276d115e60902bcd98e92e3b551283` proves the corresponding regression was fixed there, but it does not certify a newer RC until playback is rerun on that newer SHA.

If a row fails:

1. collect only the sanitized runtime structure required to reproduce it;
2. add a failing fixture or browser contract on the release-preparation line;
3. prove that test fails before editing production CSS or integration code;
4. implement the narrowest fix;
5. run the focused regression test;
6. run `npm run verify:release`;
7. freeze a new RC SHA;
8. create a new validation ledger for that SHA;
9. mark the failed candidate ledger `SUPERSEDED`;
10. rerun the failed row and any regression-sensitive rows.

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

Record the review outcome in the same validation ledger. A release-blocking review finding returns the process to the regression workflow and requires a new RC.

## PROMOTE

The validated runtime payload must remain identical to the frozen candidate. Release metadata may need a documentation-only promotion commit after validation so the changelog and stable install wording can accurately describe `v1.0.0` without mutating the candidate during testing.

Before tagging, verify that a documentation-only promotion commit did not change runtime payload files:

```bash
git diff --exit-code <FROZEN_SHA>..HEAD -- theme.css src/css assets integrations
npm run verify:release
```

Both commands must exit successfully. The first command proves that the CSS source, generated stylesheet, assets, and optional integration payload are byte-identical to the manually validated candidate.

Promotion sequence:

1. record `PASS` in the frozen candidate's validation ledger;
2. fast-forward or merge the validated candidate content into `main` without runtime payload changes;
3. if needed, create one documentation-only promotion commit for `README.md`, `CHANGELOG.md`, compatibility text, and release evidence references;
4. run `git diff --exit-code <FROZEN_SHA>..HEAD -- theme.css src/css assets integrations`;
5. run `npm run verify:release` on the promotion head;
6. tag `v1.0.0` only after both gates pass;
7. make the recommended stable install URL version-pinned to `@v1.0.0/theme.css`;
8. clean up superseded recovery and RC branches after release.

A documentation-only promotion commit may change release metadata, but it must never change the validated runtime payload.

## Optional Streaming Services adapter

The optional Harbor Streaming Services adapter is not allowed to become a hidden dependency of Core. Validate Core with the adapter absent. Validate the replacement adapter separately for lifecycle behavior, duplicate prevention, intended row ordering, and preservation of unrelated Jellyfin result ordering. Retire the legacy Streaming Services injector only after the replacement adapter passes that validation.
