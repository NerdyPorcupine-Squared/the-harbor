import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const visualTestsPath = join(repositoryRoot, "tests", "visual");
const requestedArguments = process.argv.slice(2);
const updateSnapshots = requestedArguments.includes("--update");
const forwardedArguments = requestedArguments.filter(
  (argument) => argument !== "--update",
);
const testFiles = (await readdir(visualTestsPath, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => relative(repositoryRoot, join(visualTestsPath, entry.name)))
  .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

if (testFiles.length === 0) {
  process.stderr.write("[Harbor Visual] no visual tests found\n");
  process.exitCode = 1;
} else {
  const environment = { ...process.env };
  delete environment.HARBOR_UPDATE_SNAPSHOTS;
  if (updateSnapshots) {
    environment.HARBOR_UPDATE_SNAPSHOTS = "1";
  }

  const child = spawn(
    process.execPath,
    ["--test", ...forwardedArguments, ...testFiles],
    {
      cwd: repositoryRoot,
      env: environment,
      stdio: "inherit",
    },
  );

  child.once("error", (error) => {
    process.stderr.write(`[Harbor Visual] unable to start tests: ${error.message}\n`);
    process.exitCode = 1;
  });
  child.once("close", (status) => {
    process.exitCode = status ?? 1;
  });
}
