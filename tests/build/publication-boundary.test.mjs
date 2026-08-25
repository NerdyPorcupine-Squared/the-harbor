import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  preparePublication,
  validatePublication,
} from "../../scripts/check-publication.mjs";

const repositoryRoot = new URL("../..", import.meta.url);

async function withPublicationFixture(
  files,
  publicFiles,
  callback,
  manifestExtras = {},
) {
  const rootPath = await mkdtemp(join(tmpdir(), "harbor-publication-"));

  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = join(rootPath, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, contents, "utf8");
    }

    const manifestPath = join(rootPath, "publication-manifest.json");
    await writeFile(
      manifestPath,
      `${JSON.stringify({ version: 1, publicFiles, ...manifestExtras }, null, 2)}\n`,
      "utf8",
    );
    await callback({ rootPath, manifestPath });
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
}

test("returns the exact sorted public file set", async () => {
  await withPublicationFixture(
    {
      "theme.css": "/*! The Harbor */\n:root {}\n",
      "src/css/index.css": "/*! The Harbor */\n:root {}\n",
    },
    ["theme.css", "src/css/index.css"],
    async ({ rootPath, manifestPath }) => {
      const files = await validatePublication({ rootPath, manifestPath });
      assert.deepEqual(files, ["src/css/index.css", "theme.css"]);
    },
  );
});

test("prepares immutable bytes and SHA-256 hashes for connector upload", async () => {
  await withPublicationFixture(
    { "hello.txt": "hello\n" },
    ["hello.txt"],
    async ({ rootPath, manifestPath }) => {
      const publication = await preparePublication({ rootPath, manifestPath });
      assert.deepEqual(publication.files, [
        {
          path: "hello.txt",
          sha256:
            "5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03",
          encoding: "base64",
          content: "aGVsbG8K",
        },
      ]);
    },
  );
});

test("rejects unsafe or duplicate manifest paths", async () => {
  for (const publicFiles of [
    ["../private.txt"],
    ["/absolute.css"],
    ["theme.css", "theme.css"],
    [["docs", "superpowers", "private-plan.md"].join("/")],
  ]) {
    await withPublicationFixture({}, publicFiles, async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*(path|duplicate|private)/iu,
      );
    });
  }
});

test("rejects non-portable or injectable public paths", async () => {
  const unsafePaths = [
    "safe\n- forged.css",
    ["admin", "@", "example.com.css"].join(""),
    "folder name/theme.css",
    `theme${String.fromCodePoint(0x200b)}.css`,
    "validation.log",
    "evidence/server-output.txt",
    "CON/theme.css",
    "theme.css.",
  ];

  for (const relativePath of unsafePaths) {
    await withPublicationFixture(
      { [relativePath]: ".safe {}\n" },
      [relativePath],
      async ({ rootPath, manifestPath }) => {
        await assert.rejects(
          validatePublication({ rootPath, manifestPath }),
          /\[Harbor Publication\].*path/u,
        );
      },
    );
  }
});

test("rejects case-insensitive manifest aliases", async () => {
  await withPublicationFixture(
    { "Theme.css": ".one {}\n", "theme.css": ".two {}\n" },
    ["Theme.css", "theme.css"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*(duplicate|alias)/iu,
      );
    },
  );
});

test("rejects missing files and symlinks", async () => {
  await withPublicationFixture(
    {},
    ["missing.css"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*missing/u,
      );
    },
  );

  await withPublicationFixture(
    { "outside.css": ".outside {}\n" },
    ["linked.css"],
    async ({ rootPath, manifestPath }) => {
      await symlink(join(rootPath, "outside.css"), join(rootPath, "linked.css"));
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*symbolic link/u,
      );
    },
  );
});

test("rejects symlinked ancestor directories", async () => {
  const rootPath = await mkdtemp(join(tmpdir(), "harbor-publication-root-"));
  const outsidePath = await mkdtemp(join(tmpdir(), "harbor-publication-outside-"));

  try {
    await writeFile(join(outsidePath, "secret.css"), ".outside {}\n", "utf8");
    await symlink(outsidePath, join(rootPath, "linked"));
    const manifestPath = join(rootPath, "publication-manifest.json");
    await writeFile(
      manifestPath,
      `${JSON.stringify({ version: 1, publicFiles: ["linked/secret.css"] })}\n`,
      "utf8",
    );

    await assert.rejects(
      validatePublication({ rootPath, manifestPath }),
      /\[Harbor Publication\].*symbolic link/u,
    );
  } finally {
    await rm(rootPath, { recursive: true, force: true });
    await rm(outsidePath, { recursive: true, force: true });
  }
});

test("rejects private-environment content", async () => {
  const forbiddenValues = [
    ["admin", "@", "example.com"].join(""),
    ["http://", "local", "host", ":8096"].join(""),
    ["http://", "192.168.", "1.50"].join(""),
    ["C:", "\\Users\\", "Example\\theme.css"].join(""),
    ["/", "srv/", "jellyfin/config"].join(""),
    ["docs/", "superpowers/", "private-plan.md"].join(""),
    ["01234567", "89abcdef", "01234567", "89abcdef"].join(""),
    ["api", "_key = ", "harbor-secret-value"].join(""),
    ["/", "opt/", "harbor/config"].join(""),
    ["container", "_name: harbor-test"].join(""),
    ["{", "{", "SERVER_URL", "}", "}"].join(""),
    ["validation", " log: private evidence"].join(""),
    ["fd00", "::", "1234"].join(""),
    ["X-", "Emby-", "Token: ", "harbor-secret-value"].join(""),
    ["Authorization", ": Bearer ", "harbor-secret-value"].join(""),
    ["$", "{", "JELLYFIN_URL", "}"].join(""),
    ["/", "data/", "jellyfin/config"].join(""),
    ["[", "INF", "] 2026-08-25 validation output"].join(""),
  ];

  for (const value of forbiddenValues) {
    await withPublicationFixture(
      { "theme.css": `/* ${value} */\n` },
      ["theme.css"],
      async ({ rootPath, manifestPath }) => {
        await assert.rejects(
          validatePublication({ rootPath, manifestPath }),
          /\[Harbor Publication\].*forbidden/u,
        );
      },
    );
  }
});

test("rejects non-UTF-8 text unless binary provenance is explicit", async () => {
  const binaryContents = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff]);

  await withPublicationFixture(
    { "payload.txt": binaryContents },
    ["payload.txt"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*UTF-8/u,
      );
    },
  );

  await withPublicationFixture(
    { "assets/texture.png": binaryContents },
    ["assets/texture.png"],
    async ({ rootPath, manifestPath }) => {
      const files = await validatePublication({ rootPath, manifestPath });
      assert.deepEqual(files, ["assets/texture.png"]);
    },
    {
      binaryFiles: [
        { path: "assets/texture.png", provenance: "generated-fixture" },
      ],
    },
  );
});

test("rejects UTF-16 and NUL-obscured text", async () => {
  const privateText = ["admin", "@", "example.com"].join("");
  const utf16Le = Buffer.from(privateText, "utf16le");
  const utf16Be = Buffer.from(utf16Le);
  utf16Be.swap16();

  for (const contents of [utf16Le, utf16Be, Buffer.from("safe\0text", "utf8")]) {
    await withPublicationFixture(
      { "payload.txt": contents },
      ["payload.txt"],
      async ({ rootPath, manifestPath }) => {
        await assert.rejects(
          validatePublication({ rootPath, manifestPath }),
          /\[Harbor Publication\].*(UTF-16|control)/u,
        );
      },
    );
  }
});

test("rejects unapproved binary provenance", async () => {
  await withPublicationFixture(
    { "assets/private.png": Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
    ["assets/private.png"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*provenance/u,
      );
    },
    {
      binaryFiles: [
        { path: "assets/private.png", provenance: "real-server" },
      ],
    },
  );
});

test("requires provenance for every binary-extension public file", async () => {
  await withPublicationFixture(
    { "assets/texture.png": "not really an image\n" },
    ["assets/texture.png"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({ rootPath, manifestPath }),
        /\[Harbor Publication\].*binary provenance/iu,
      );
    },
  );
});

test("rejects out-of-band private terms in paths and text", async () => {
  const privateTerm = ["Captain", " Alder"].join("");

  await withPublicationFixture(
    { "theme.css": `/* ${privateTerm} */\n` },
    ["theme.css"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({
          rootPath,
          manifestPath,
          privateTerms: [privateTerm],
        }),
        /\[Harbor Publication\].*private term/u,
      );
    },
  );

  const privatePathTerm = ["captain", "-alder"].join("");
  await withPublicationFixture(
    { [`${privatePathTerm}.css`]: ".safe {}\n" },
    [`${privatePathTerm}.css`],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({
          rootPath,
          manifestPath,
          privateTerms: [privatePathTerm],
        }),
        /\[Harbor Publication\].*private term/u,
      );
    },
  );

  const normalizedPrivateTerm = "Caf\u00e9";
  const decomposedPrivateTerm = "Cafe\u0301";
  await withPublicationFixture(
    { "theme.css": `/* ${decomposedPrivateTerm} */\n` },
    ["theme.css"],
    async ({ rootPath, manifestPath }) => {
      await assert.rejects(
        validatePublication({
          rootPath,
          manifestPath,
          privateTerms: [normalizedPrivateTerm],
        }),
        /\[Harbor Publication\].*private term/u,
      );
    },
  );
});

test("the repository publication manifest passes its own scanner", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/check-publication.mjs"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /\[Harbor Publication\] approved \d+ files/u);
  assert.equal(
    result.stdout.includes(["docs", "superpowers"].join("/")),
    false,
  );
});

test("connector JSON mode requires an out-of-band private-term file", () => {
  const environment = { ...process.env };
  delete environment.HARBOR_PRIVATE_TERMS_FILE;
  const result = spawnSync(
    process.execPath,
    ["scripts/check-publication.mjs", "--json"],
    { cwd: repositoryRoot, encoding: "utf8", env: environment },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /\[Harbor Publication\].*private-term file.*required/iu,
  );
});

test("connector JSON mode rejects empty and UTF-16 private-term files", async () => {
  const rootPath = await mkdtemp(join(tmpdir(), "harbor-private-terms-"));

  try {
    const privateTerm = ["Captain", " Alder"].join("");
    const fixtures = [
      Buffer.alloc(0),
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(privateTerm, "utf16le"),
      ]),
    ];

    for (const [index, contents] of fixtures.entries()) {
      const privateTermsPath = join(rootPath, `private-terms-${index}.txt`);
      await writeFile(privateTermsPath, contents);
      const result = spawnSync(
        process.execPath,
        ["scripts/check-publication.mjs", "--json"],
        {
          cwd: repositoryRoot,
          encoding: "utf8",
          env: {
            ...process.env,
            HARBOR_PRIVATE_TERMS_FILE: privateTermsPath,
          },
        },
      );

      assert.notEqual(result.status, 0);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        /\[Harbor Publication\].*(private-term|UTF-16)/iu,
      );
    }
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
});

test("connector JSON mode splits lone-CR private terms", async () => {
  const rootPath = await mkdtemp(join(tmpdir(), "harbor-private-terms-cr-"));

  try {
    const matchingTerm = ["The", " Harbor"].join("");
    const privateTermsPath = join(rootPath, "private-terms.txt");
    await writeFile(privateTermsPath, `${matchingTerm}\rprivate-beta`, "utf8");
    const result = spawnSync(
      process.execPath,
      ["scripts/check-publication.mjs", "--json"],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          HARBOR_PRIVATE_TERMS_FILE: privateTermsPath,
        },
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /\[Harbor Publication\].*private term/iu,
    );
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
});
