import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);

async function readRepositoryFile(path) {
  try {
    return await readFile(new URL(path, repositoryUrl), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

test("documents immutable RC install, update, optional integration, removal, rollback, and support", async () => {
  const readme = await readRepositoryFile("README.md");

  for (const heading of [
    "Install during release-candidate testing",
    "Update",
    "Media Bar Enhanced",
    "Remove",
    "Rollback",
    "Troubleshooting",
  ]) {
    assert.match(readme, new RegExp(`## ${heading}`, "u"));
  }
  assert.doesNotMatch(
    readme,
    /cdn\.jsdelivr\.net\/gh\/NerdyPorcupine-Squared\/the-harbor@main\/theme\.css/u,
  );
  assert.match(readme, /the-harbor@COMMIT_SHA\/theme\.css/u);
  assert.match(readme, /@v1\.0\.0\/theme\.css/u);
  assert.match(readme, /release-candidate preparation/iu);
  assert.match(readme, /Do not use a moving `@main` or branch URL/iu);
  assert.doesNotMatch(readme, /real-server validated/iu);
});

test("ships MIT licensing and release-candidate changelog", async () => {
  const license = await readRepositoryFile("LICENSE");
  const changelog = await readRepositoryFile("CHANGELOG.md");

  assert.match(license, /MIT License/u);
  assert.match(license, /Permission is hereby granted/u);
  assert.match(changelog, /## \[Unreleased\]/u);
  assert.match(changelog, /release candidate/iu);
  assert.doesNotMatch(changelog, /\bv1\.0\.0\b/u);
});

test("compatibility docs separate automated and real-server evidence", async () => {
  const compatibility = await readRepositoryFile("docs/compatibility.md");
  const matrix = await readRepositoryFile("docs/testing/core-manual-matrix.md");

  assert.match(compatibility, /fixture/iu);
  assert.match(compatibility, /Chromium/u);
  assert.match(compatibility, /Real Jellyfin 10\.11\.11 testing has already disproved/iu);
  assert.match(compatibility, /active recovery evidence, not release validation/iu);
  assert.match(compatibility, /Chrome\/Edge Jellyfin Web and Jellyfin Media Player/iu);
  assert.doesNotMatch(compatibility, /real-server validated/iu);
  assert.match(matrix, /placeholder/iu);
  assert.match(matrix, /GitHub issue validation ledger/iu);
  assert.match(matrix, /Media Bar Enhanced/u);
  assert.match(matrix, /Desktop/u);
  assert.match(matrix, /Mobile/u);
  assert.doesNotMatch(matrix, /\bPass(?:ed)?\b/iu);
});

test("release process keeps candidate evidence external and promotion payload unchanged", async () => {
  const processDoc = await readRepositoryFile("docs/release/core-v1-rc-process.md");

  assert.match(processDoc, /validation ledger/iu);
  assert.match(processDoc, /GitHub issue/iu);
  assert.match(processDoc, /do not record the frozen SHA inside the frozen candidate/iu);
  assert.match(processDoc, /git diff --exit-code <FROZEN_SHA>\.\.HEAD -- theme\.css src\/css assets integrations/iu);
  assert.match(processDoc, /documentation-only promotion commit/iu);
});

test("CI runs clean Windows build, publication, Chromium, release-drift, and stale-run cancellation gates", async () => {
  const workflow = await readRepositoryFile(".github/workflows/ci.yml");

  assert.match(workflow, /windows-latest/u);
  assert.match(workflow, /npm ci/u);
  assert.match(workflow, /playwright install chromium/u);
  assert.match(workflow, /npm run verify:core/u);
  assert.match(workflow, /npm run check:publication/u);
  assert.match(workflow, /npm run test:visual/u);
  assert.match(workflow, /Reject generated CSS drift on release branches/u);
  assert.match(workflow, /startsWith\(github\.ref_name, 'release\/'\)/u);
  assert.match(workflow, /concurrency:/u);
  assert.match(workflow, /cancel-in-progress:\s*true/u);
});

test("publication manifest is sorted, unique, exact, and excludes private planning artifacts", async () => {
  const manifestText = await readRepositoryFile("publication-manifest.json");
  const manifest = JSON.parse(manifestText || "{}");

  assert.equal(manifest.version, 1);
  assert.ok(Array.isArray(manifest.files));
  assert.deepEqual(manifest.files, [...manifest.files].sort());
  assert.equal(new Set(manifest.files).size, manifest.files.length);
  for (const path of [
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "theme.css",
    "assets/logos/harbor-mark.svg",
    "docs/compatibility.md",
    "docs/release/core-v1-rc-process.md",
    "docs/testing/core-manual-matrix.md",
  ]) {
    assert.ok(manifest.files.includes(path), `${path} must be published`);
  }
  assert.ok(manifest.files.every((path) => !path.startsWith(".superpowers/")));
  assert.ok(manifest.files.every((path) => !path.startsWith("docs/superpowers/")));
});

test("publication checker accepts the exact sanitized candidate", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/check-publication.mjs"],
    { cwd: repositoryUrl, encoding: "utf8" },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("package scripts expose publication and release verification", async () => {
  const packageJson = JSON.parse(await readRepositoryFile("package.json"));

  assert.equal(
    packageJson.scripts?.["test:build"],
    "node scripts/run-build-tests.mjs",
  );
  assert.equal(
    packageJson.scripts?.["check:publication"],
    "node scripts/check-publication.mjs",
  );
  assert.match(packageJson.scripts?.["verify:release"] ?? "", /verify:core/u);
  assert.match(packageJson.scripts?.["verify:release"] ?? "", /check:publication/u);
  assert.match(packageJson.scripts?.["verify:release"] ?? "", /test:visual/u);
});
