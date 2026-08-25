import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";

import { normalizeCss } from "../../scripts/build-css.mjs";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function buildCore() {
  return spawnSync(npmCommand, ["run", "build:css"], {
    cwd: new URL("../..", import.meta.url),
    encoding: "utf8",
  });
}

function buildCoreAsync() {
  return new Promise((resolve) => {
    const child = spawn(npmCommand, ["run", "build:css"], {
      cwd: new URL("../..", import.meta.url),
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

test("normalizes CRLF and lone CR line endings", () => {
  assert.equal(normalizeCss("one\r\ntwo\rthree"), "one\ntwo\nthree\n");
});

test("Core build emits a deterministic flattened release stylesheet", async () => {
  const firstBuild = buildCore();

  assert.equal(
    firstBuild.status,
    0,
    `First build failed:\n${firstBuild.stdout}\n${firstBuild.stderr}`,
  );

  const artifactUrl = new URL("../../theme.css", import.meta.url);
  const firstArtifact = await readFile(artifactUrl);
  const firstText = firstArtifact.toString("utf8");

  assert.match(firstText, /^\/\*! The Harbor/u);
  assert.doesNotMatch(firstText, /@import\s/u);
  assert.doesNotMatch(firstText, /sourceMappingURL/u);

  const secondBuild = buildCore();

  assert.equal(
    secondBuild.status,
    0,
    `Second build failed:\n${secondBuild.stdout}\n${secondBuild.stderr}`,
  );

  const secondArtifact = await readFile(artifactUrl);
  assert.deepEqual(secondArtifact, firstArtifact);
});

test("concurrent Core builds do not race on temporary output", async () => {
  const builds = await Promise.all(Array.from({ length: 20 }, () => buildCoreAsync()));
  const failures = builds.filter((build) => build.status !== 0);

  assert.deepEqual(
    failures,
    [],
    failures.map((build) => `${build.stdout}\n${build.stderr}`).join("\n"),
  );
});
