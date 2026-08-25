import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../../.github/workflows/harbor-checks.yml",
  import.meta.url,
);

async function readWorkflow() {
  try {
    return await readFile(workflowUrl, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail("Harbor checks workflow is missing");
    }
    throw error;
  }
}

test("Harbor CI preserves candidate snapshots without hiding visual failures", async () => {
  const workflow = await readWorkflow();

  assert.match(
    workflow,
    /^on:\n  pull_request:\n  workflow_dispatch:\n/mu,
  );
  assert.match(workflow, /^permissions:\n  contents: read\n/mu);
  assert.match(workflow, /^    runs-on: ubuntu-latest$/mu);
  assert.match(workflow, /^      - uses: actions\/checkout@v4$/mu);
  assert.match(workflow, /^      - uses: actions\/setup-node@v4$/mu);
  assert.match(workflow, /^          node-version: 24$/mu);
  assert.match(
    workflow,
    /^        run: npm ci --ignore-scripts --no-audit --no-fund$/mu,
  );
  assert.match(
    workflow,
    /^        run: npx playwright install --with-deps chromium$/mu,
  );

  const coreVerification = workflow.indexOf("run: npm run verify:core");
  const visualComparison = workflow.indexOf("run: npm run test:visual");
  assert.ok(coreVerification >= 0, "Core verification step is missing");
  assert.ok(visualComparison >= 0, "Visual comparison step is missing");
  assert.ok(
    coreVerification < visualComparison,
    "Core verification must run before visual comparison",
  );

  assert.match(
    workflow,
    /id: visual-comparison\n        continue-on-error: true\n        run: npm run test:visual/u,
  );
  assert.match(
    workflow,
    /if: steps\.visual-comparison\.outcome == 'failure'\n        run: npm run test:visual:update/u,
  );
  assert.match(workflow, /^      - uses: actions\/upload-artifact@v4$/mu);
  assert.match(
    workflow,
    /^          path: tests\/visual\/snapshots\/\*\.png$/mu,
  );
  assert.match(
    workflow,
    /if: always\(\) && steps\.visual-comparison\.outcome == 'failure'\n        run: exit 1/u,
  );

  assert.doesNotMatch(workflow, /^  (?:push|schedule):$/mu);
  assert.doesNotMatch(workflow, /\b(?:deployments?|releases?): write\b/iu);
  assert.doesNotMatch(workflow, /\bsecrets\./u);
  assert.doesNotMatch(workflow, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu);

  const actionReferences = [...workflow.matchAll(/uses: ([^\s]+)$/gmu)].map(
    ([, action]) => action,
  );
  assert.deepEqual(actionReferences, [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/upload-artifact@v4",
  ]);
});
