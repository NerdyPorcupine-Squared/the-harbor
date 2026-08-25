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

test("declares checkout normalization so every platform receives LF text files", async () => {
  const gitattributes = await readRepositoryFile(".gitattributes");

  assert.match(
    gitattributes,
    /^\*\s+text=auto\s+eol=lf$/mu,
    ".gitattributes must normalize all text files to LF on checkout",
  );
  assert.match(gitattributes, /^\*\.css\s+text\s+eol=lf$/mu);
  assert.match(gitattributes, /^\*\.svg\s+text\s+eol=lf$/mu);
});

test("checks out every tracked CSS and SVG file with LF line endings", () => {
  const listing = spawnSync(
    "git",
    ["ls-files", "--eol", "--", "*.css", "*.svg", "*.mjs", "*.json", "*.md", "*.html", "*.yml"],
    { cwd: repositoryUrl, encoding: "utf8" },
  );

  if (listing.status !== 0) return;

  const crlfFiles = listing.stdout
    .split("\n")
    .filter((line) => line.includes("w/crlf"))
    .map((line) => line.split("\t").at(-1));

  assert.deepEqual(
    crlfFiles,
    [],
    `these working-tree files use CRLF; run "git add --renormalize ." after adding .gitattributes`,
  );
});
