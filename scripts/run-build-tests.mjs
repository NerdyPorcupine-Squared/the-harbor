import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const testsDirectory = new URL("../tests/build/", import.meta.url);
const testFiles = (await readdir(testsDirectory))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => fileURLToPath(new URL(name, testsDirectory)));

const child = spawn(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
