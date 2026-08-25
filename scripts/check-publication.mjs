import { createHash } from "node:crypto";
import { lstat, open, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const internalPlanningPath = ["docs", "superpowers"].join("/");
const loopbackHostName = ["local", "host"].join("");
const loopbackIpv4Pattern = ["127", "0", "0", "1"].join("\\.");
const loopbackIpv6 = [":", ":", "1"].join("");
const portablePathPattern = /^(?:\.?[A-Za-z0-9_][A-Za-z0-9._-]*)(?:\/\.?[A-Za-z0-9_][A-Za-z0-9._-]*)*$/u;
const privateEvidencePathPattern = /\.(?:dmp|har|log|trace)$/iu;
const privateEvidenceDirectoryPattern = /(?:^|\/)evidence(?:\/|$)/iu;
const binaryExtensionPattern = /\.(?:gif|jpe?g|png|webp|woff2?)$/iu;
const windowsReservedNamePattern = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu;
const approvedBinaryProvenance = new Set(["generated-fixture", "original"]);
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

const forbiddenContent = [
  {
    label: "internal planning path",
    pattern: new RegExp(internalPlanningPath.replace("/", "\\/"), "iu"),
  },
  {
    label: "email address",
    pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/iu,
  },
  {
    label: `${loopbackHostName} address`,
    pattern: new RegExp(
      `(?:${loopbackHostName}|${loopbackIpv4Pattern}|\\[?${loopbackIpv6}\\]?)`,
      "iu",
    ),
  },
  {
    label: "private IPv4 address",
    pattern:
      /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/u,
  },
  {
    label: "Windows user path",
    pattern: /\b[a-z]:\\(?:Users|Documents and Settings)\\/iu,
  },
  {
    label: "private Unix path",
    pattern: /\/(?:data|etc|home|opt|root|srv|mnt|Users|var\/(?:lib|log))\//u,
  },
  {
    label: "Jellyfin-style user identifier",
    pattern: /\b(?:[a-f0-9]{32}|[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})\b/iu,
  },
  {
    label: "secret assignment",
    pattern:
      /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|password|secret)\s*[:=]\s*["']?[a-z0-9_./+-]{8,}/iu,
  },
  {
    label: "Jellyfin authentication token",
    pattern: /\bX-Emby-Token\s*[:=]\s*["']?[a-z0-9_./+-]{8,}/iu,
  },
  {
    label: "authorization bearer token",
    pattern: /\bAuthorization\s*:\s*Bearer\s+[a-z0-9_./+-]{8,}/iu,
  },
  {
    label: "container name",
    pattern: /\bcontainer[_-]?name\s*[:=]/iu,
  },
  {
    label: "unresolved template marker",
    pattern: /(?:\{\{[^{}\n]+\}\}|\$\{[A-Z][A-Z0-9_]+\})/u,
  },
  {
    label: "private validation log",
    pattern: /\b(?:console|server|validation)\s+log\s*:/iu,
  },
  {
    label: "structured server log",
    pattern: /\[(?:DBG|INF|WRN|ERR)\][^\n]*/u,
  },
  {
    label: "private IPv6 address",
    pattern: /\b(?:f[cd][0-9a-f]{2}|fe[89ab][0-9a-f]):[0-9a-f:]+\b/iu,
  },
];

function publicationError(message, cause) {
  return new Error(
    `[Harbor Publication] ${message}`,
    cause ? { cause } : undefined,
  );
}

function normalizePrivateText(value) {
  return String(value).normalize("NFKC").toLocaleLowerCase("en-US");
}

function assertSafeTextBytes(bytes, relativePath) {
  if (
    (bytes[0] === 0xff && bytes[1] === 0xfe) ||
    (bytes[0] === 0xfe && bytes[1] === 0xff)
  ) {
    throw publicationError(`UTF-16 text is not allowed: ${relativePath}`);
  }

  for (const byte of bytes) {
    if (
      byte === 0 ||
      (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) ||
      byte === 0x7f
    ) {
      throw publicationError(`Text contains forbidden control bytes: ${relativePath}`);
    }
  }
}

function validateManifestPath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    relativePath.includes("\\") ||
    !portablePathPattern.test(relativePath) ||
    privateEvidencePathPattern.test(relativePath) ||
    privateEvidenceDirectoryPattern.test(relativePath) ||
    posix.isAbsolute(relativePath) ||
    isAbsolute(relativePath) ||
    posix.normalize(relativePath) !== relativePath ||
    relativePath === "."
  ) {
    throw publicationError(`Unsafe manifest path: ${String(relativePath)}`);
  }

  if (
    relativePath
      .split("/")
      .some(
        (pathPart) =>
          pathPart.endsWith(".") || windowsReservedNamePattern.test(pathPart),
      )
  ) {
    throw publicationError(`Unsafe portable path: ${relativePath}`);
  }

  if (
    relativePath === internalPlanningPath ||
    relativePath.startsWith(`${internalPlanningPath}/`)
  ) {
    throw publicationError(`Private path cannot be published: ${relativePath}`);
  }
}

async function readManifest(manifestPath) {
  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw publicationError(`Unable to read manifest ${manifestPath}`, error);
  }

  if (
    manifest.version !== 1 ||
    !Array.isArray(manifest.publicFiles) ||
    (manifest.binaryFiles !== undefined && !Array.isArray(manifest.binaryFiles))
  ) {
    throw publicationError("Manifest must contain version 1 and publicFiles");
  }

  manifest.binaryFiles ??= [];

  return manifest;
}

async function resolveSafePublicFile(rootPath, relativePath) {
  let currentPath = rootPath;
  const pathParts = relativePath.split("/");

  for (const [index, pathPart] of pathParts.entries()) {
    currentPath = join(currentPath, pathPart);
    let pathStatus;

    try {
      pathStatus = await lstat(currentPath);
    } catch (error) {
      throw publicationError(`Missing public file: ${relativePath}`, error);
    }

    if (pathStatus.isSymbolicLink()) {
      throw publicationError(
        `Public path cannot contain a symbolic link: ${relativePath}`,
      );
    }
    if (index < pathParts.length - 1 && !pathStatus.isDirectory()) {
      throw publicationError(
        `Public path ancestor is not a directory: ${relativePath}`,
      );
    }
    if (index === pathParts.length - 1 && !pathStatus.isFile()) {
      throw publicationError(`Public path is not a regular file: ${relativePath}`);
    }
  }

  const canonicalPath = await realpath(currentPath);
  const relativeCanonicalPath = relative(rootPath, canonicalPath);
  if (
    relativeCanonicalPath === ".." ||
    relativeCanonicalPath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativeCanonicalPath)
  ) {
    throw publicationError(`Public path resolves outside repository: ${relativePath}`);
  }

  return canonicalPath;
}

export async function preparePublication({
  rootPath,
  manifestPath,
  privateTerms = [],
}) {
  const manifest = await readManifest(manifestPath);
  const canonicalRootPath = await realpath(rootPath);
  const normalizedPrivateTerms = privateTerms
    .map((term) => normalizePrivateText(String(term).trim()))
    .filter((term) => term.length >= 2);
  const seen = new Set();
  const seenFolded = new Set();

  for (const relativePath of manifest.publicFiles) {
    validateManifestPath(relativePath);
    if (seen.has(relativePath)) {
      throw publicationError(`Duplicate manifest path: ${relativePath}`);
    }
    seen.add(relativePath);
    const foldedPath = normalizePrivateText(relativePath);
    if (seenFolded.has(foldedPath)) {
      throw publicationError(
        `Duplicate case-insensitive manifest alias: ${relativePath}`,
      );
    }
    seenFolded.add(foldedPath);
  }

  const binaryFiles = new Set();
  for (const binaryFile of manifest.binaryFiles) {
    if (!binaryFile || typeof binaryFile !== "object") {
      throw publicationError("Binary provenance entry must be an object");
    }
    validateManifestPath(binaryFile.path);
    if (!seen.has(binaryFile.path)) {
      throw publicationError(
        `Binary provenance path is not public: ${binaryFile.path}`,
      );
    }
    if (binaryFiles.has(binaryFile.path)) {
      throw publicationError(`Duplicate binary provenance: ${binaryFile.path}`);
    }
    if (
      !binaryExtensionPattern.test(binaryFile.path) ||
      !approvedBinaryProvenance.has(binaryFile.provenance)
    ) {
      throw publicationError(
        `Unapproved binary provenance for ${binaryFile.path}`,
      );
    }
    binaryFiles.add(binaryFile.path);
  }

  for (const relativePath of seen) {
    if (
      binaryExtensionPattern.test(relativePath) &&
      !binaryFiles.has(relativePath)
    ) {
      throw publicationError(
        `Missing binary provenance for ${relativePath}`,
      );
    }
  }

  const publicFiles = [...seen].sort();
  const preparedFiles = [];
  for (const relativePath of publicFiles) {
    const normalizedPath = normalizePrivateText(relativePath);
    if (normalizedPrivateTerms.some((term) => normalizedPath.includes(term))) {
      throw publicationError(`forbidden private term in public path`);
    }

    const filePath = await resolveSafePublicFile(canonicalRootPath, relativePath);
    const fileHandle = await open(filePath, "r");
    let bytes;

    try {
      const fileStatus = await fileHandle.stat();
      if (!fileStatus.isFile()) {
        throw publicationError(
          `Public path is not a regular file: ${relativePath}`,
        );
      }
      bytes = await fileHandle.readFile();
    } finally {
      await fileHandle.close();
    }

    if (!binaryFiles.has(relativePath)) {
      assertSafeTextBytes(bytes, relativePath);
      let contents;
      try {
        contents = utf8Decoder.decode(bytes);
      } catch (error) {
        throw publicationError(
          `Text public file must be valid UTF-8: ${relativePath}`,
          error,
        );
      }
      const normalizedContents = normalizePrivateText(contents);
      if (
        normalizedPrivateTerms.some((term) => normalizedContents.includes(term))
      ) {
        throw publicationError(`forbidden private term in ${relativePath}`);
      }
      for (const forbidden of forbiddenContent) {
        if (forbidden.pattern.test(contents)) {
          throw publicationError(
            `forbidden ${forbidden.label} in ${relativePath}`,
          );
        }
      }
    }

    preparedFiles.push({
      path: relativePath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      encoding: "base64",
      content: bytes.toString("base64"),
    });
  }

  return { files: preparedFiles };
}

export async function validatePublication(options) {
  const publication = await preparePublication(options);
  return publication.files.map((file) => file.path);
}

async function run() {
  const rootPath = fileURLToPath(new URL("../", import.meta.url));
  const manifestPath = join(rootPath, "publication-manifest.json");
  const connectorPayloadRequested = process.argv.includes("--json");
  const privateTermsPath = process.env.HARBOR_PRIVATE_TERMS_FILE;
  if (connectorPayloadRequested && !privateTermsPath) {
    throw publicationError(
      "An out-of-band private-term file is required for connector JSON mode",
    );
  }

  let privateTerms = [];
  if (privateTermsPath) {
    let privateTermsBytes;
    try {
      privateTermsBytes = await readFile(privateTermsPath);
    } catch (error) {
      throw publicationError("Unable to read private-term file", error);
    }
    assertSafeTextBytes(privateTermsBytes, "private-term file");
    let privateTermsContents;
    try {
      privateTermsContents = utf8Decoder.decode(privateTermsBytes);
    } catch (error) {
      throw publicationError("Private-term file must be valid UTF-8", error);
    }
    privateTerms = privateTermsContents
      .split(/\r\n?|\n/u)
      .map((term) => term.trim())
      .filter(Boolean);
  }
  if (
    connectorPayloadRequested &&
    !privateTerms.some((term) => normalizePrivateText(term).length >= 2)
  ) {
    throw publicationError(
      "Private-term file must contain at least one effective term",
    );
  }
  const publication = await preparePublication({
    rootPath,
    manifestPath,
    privateTerms,
  });
  const publicFiles = publication.files.map((file) => file.path);

  if (connectorPayloadRequested) {
    process.stdout.write(`${JSON.stringify(publication)}\n`);
    return;
  }

  process.stdout.write(
    `[Harbor Publication] approved ${publicFiles.length} files:\n${publicFiles
      .map((file) => `- ${file}`)
      .join("\n")}\n`,
  );
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await run();
}
