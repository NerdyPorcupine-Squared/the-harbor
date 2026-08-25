import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { bundleCss } from "../../scripts/css-imports.mjs";

async function withFixture(files, callback) {
  const rootPath = await mkdtemp(join(tmpdir(), "harbor-css-"));

  try {
    await Promise.all(
      Object.entries(files).map(([name, contents]) =>
        writeFile(join(rootPath, name), contents, "utf8"),
      ),
    );
    await callback(rootPath);
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
}

test("bundles nested local imports in document order", async () => {
  await withFixture(
    {
      "entry.css": '@import "./first.css";\n@import "./second.css";\n',
      "first.css": '.first { color: navy; }\n',
      "second.css": '@import "./nested.css";\n.second { color: tan; }\n',
      "nested.css": '.nested { color: brass; }\n',
    },
    async (rootPath) => {
      const css = await bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
        rootDir: pathToFileURL(`${rootPath}/`),
      });

      assert.ok(css.indexOf(".first") < css.indexOf(".nested"));
      assert.ok(css.indexOf(".nested") < css.indexOf(".second"));
      assert.doesNotMatch(css, /@import/u);
    },
  );
});

test("rejects remote imports", async () => {
  await withFixture(
    { "entry.css": '@import "https://example.test/theme.css";\n' },
    async (rootPath) => {
      await assert.rejects(
        bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
          rootDir: pathToFileURL(`${rootPath}/`),
        }),
        /\[Harbor CSS\].*local/u,
      );
    },
  );
});

test("rejects every unsupported import syntax", async () => {
  const unsupportedImports = [
    '@import url("https://example.test/theme.css") screen;\n',
    '@import url( "./local.css" );\n',
    '@import url(./local.css);\n',
    '@import "./local.css" layer(theme);\n',
    '@\\69mport "https://example.test/theme.css";\n',
    '@\\69\r\nmport "https://example.test/theme.css";\n',
  ];

  for (const importRule of unsupportedImports) {
    await withFixture(
      { "entry.css": importRule, "local.css": ".local {}\n" },
      async (rootPath) => {
        await assert.rejects(
          bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
            rootDir: pathToFileURL(`${rootPath}/`),
          }),
          /\[Harbor CSS\].*unsupported @import/u,
        );
      },
    );
  }
});

test("rejects absolute import paths", async () => {
  await withFixture(
    { "entry.css": '@import "/outside.css";\n' },
    async (rootPath) => {
      await assert.rejects(
        bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
          rootDir: pathToFileURL(`${rootPath}/`),
        }),
        /\[Harbor CSS\].*outside/u,
      );
    },
  );
});

test("rejects imports outside the configured source root", async () => {
  const parentPath = await mkdtemp(join(tmpdir(), "harbor-css-parent-"));
  const rootPath = join(parentPath, "source");

  try {
    await mkdir(rootPath);
    await writeFile(join(parentPath, "outside.css"), ".outside {}\n", "utf8");
    await writeFile(
      join(rootPath, "entry.css"),
      '@import "../outside.css";\n',
      "utf8",
    );

    await assert.rejects(
      bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
        rootDir: pathToFileURL(`${rootPath}/`),
      }),
      /\[Harbor CSS\].*outside/u,
    );
  } finally {
    await rm(parentPath, { recursive: true, force: true });
  }
});

test("rejects linked directories that escape the configured source root", async () => {
  const parentPath = await mkdtemp(join(tmpdir(), "harbor-css-junction-"));
  const rootPath = join(parentPath, "source");

  try {
    await mkdir(rootPath);
    await mkdir(join(parentPath, "outside"));
    await writeFile(join(parentPath, "outside", "linked.css"), ".outside {}\n", "utf8");
    await writeFile(join(rootPath, "entry.css"), '@import "./escape/linked.css";\n', "utf8");
    await symlink(
      join(parentPath, "outside"),
      join(rootPath, "escape"),
      process.platform === "win32" ? "junction" : "dir",
    );

    await assert.rejects(
      bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
        rootDir: pathToFileURL(`${rootPath}/`),
      }),
      /\[Harbor CSS\].*outside/u,
    );
  } finally {
    await rm(parentPath, { recursive: true, force: true });
  }
});

test("rejects file symlinks that escape the configured source root", async (t) => {
  const parentPath = await mkdtemp(join(tmpdir(), "harbor-css-symlink-"));
  const rootPath = join(parentPath, "source");

  try {
    await mkdir(rootPath);
    await writeFile(join(parentPath, "outside.css"), ".outside {}\n", "utf8");
    await writeFile(join(rootPath, "entry.css"), '@import "./linked.css";\n', "utf8");

    try {
      await symlink(join(parentPath, "outside.css"), join(rootPath, "linked.css"));
    } catch (error) {
      if (error?.code !== "EPERM") throw error;
      t.skip("this operating system account may not create file symlinks");
      return;
    }

    await assert.rejects(
      bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
        rootDir: pathToFileURL(`${rootPath}/`),
      }),
      /\[Harbor CSS\].*outside/u,
    );
  } finally {
    await rm(parentPath, { recursive: true, force: true });
  }
});

test("reports missing imports with a Harbor-prefixed error", async () => {
  await withFixture(
    { "entry.css": '@import "./missing.css";\n' },
    async (rootPath) => {
      await assert.rejects(
        bundleCss(pathToFileURL(join(rootPath, "entry.css")), {
          rootDir: pathToFileURL(`${rootPath}/`),
        }),
        /\[Harbor CSS\].*missing\.css/u,
      );
    },
  );
});

test("rejects import cycles without hanging", async () => {
  await withFixture(
    {
      "entry.css": '@import "./loop.css";\n',
      "loop.css": '@import "./entry.css";\n',
    },
    async (rootPath) => {
      const helperUrl = new URL("../../scripts/css-imports.mjs", import.meta.url);
      const entryUrl = pathToFileURL(join(rootPath, "entry.css"));
      const rootUrl = pathToFileURL(`${rootPath}/`);
      const program = [
        `import { bundleCss } from ${JSON.stringify(helperUrl.href)};`,
        `await bundleCss(new URL(${JSON.stringify(entryUrl.href)}), { rootDir: new URL(${JSON.stringify(rootUrl.href)}) });`,
      ].join("\n");
      const result = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", program],
        { encoding: "utf8", timeout: 500 },
      );

      assert.equal(result.status, 1);
      assert.match(result.stderr, /\[Harbor CSS\].*cycle/u);
    },
  );
});
