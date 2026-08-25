import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryUrl = new URL("../../", import.meta.url);
const repositoryPath = fileURLToPath(repositoryUrl);
const themeUrl = new URL("theme.css", repositoryUrl);
const assetPaths = [
  "assets/logos/harbor-mark.svg",
  "assets/parchment/fibers.svg",
  "assets/parchment/mottle.svg",
  "assets/icons/compass-rose.svg",
];

function isXmlCharacter(codePoint) {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

function isXmlNameStart(codePoint) {
  return (
    codePoint === 0x3a ||
    codePoint === 0x5f ||
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a) ||
    (codePoint >= 0xc0 && codePoint <= 0xd6) ||
    (codePoint >= 0xd8 && codePoint <= 0xf6) ||
    (codePoint >= 0xf8 && codePoint <= 0x2ff) ||
    (codePoint >= 0x370 && codePoint <= 0x37d) ||
    (codePoint >= 0x37f && codePoint <= 0x1fff) ||
    (codePoint >= 0x200c && codePoint <= 0x200d) ||
    (codePoint >= 0x2070 && codePoint <= 0x218f) ||
    (codePoint >= 0x2c00 && codePoint <= 0x2fef) ||
    (codePoint >= 0x3001 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfdcf) ||
    (codePoint >= 0xfdf0 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0xeffff)
  );
}

function isXmlNameCharacter(codePoint) {
  return (
    isXmlNameStart(codePoint) ||
    codePoint === 0x2d ||
    codePoint === 0x2e ||
    codePoint === 0xb7 ||
    (codePoint >= 0x30 && codePoint <= 0x39) ||
    (codePoint >= 0x300 && codePoint <= 0x36f) ||
    (codePoint >= 0x203f && codePoint <= 0x2040)
  );
}

class StrictXmlParser {
  constructor(xml, displayPath) {
    this.xml = xml;
    this.displayPath = displayPath;
    this.cursor = xml.codePointAt(0) === 0xfeff ? 1 : 0;
    this.elementStack = [];
    this.rootName = null;
    this.rootClosed = false;

    for (const character of xml) {
      if (!isXmlCharacter(character.codePointAt(0))) {
        this.fail("contains a character forbidden by XML 1.0");
      }
    }
  }

  fail(message) {
    throw new SyntaxError(`${this.displayPath}: ${message} at offset ${this.cursor}`);
  }

  startsWith(value) {
    return this.xml.startsWith(value, this.cursor);
  }

  skipWhitespace() {
    const start = this.cursor;
    while (/^[\u0009\u000a\u000d\u0020]$/u.test(this.xml[this.cursor] ?? "")) {
      this.cursor += 1;
    }
    return this.cursor - start;
  }

  readName() {
    const start = this.cursor;
    let codePoint = this.xml.codePointAt(this.cursor);
    if (codePoint === undefined || !isXmlNameStart(codePoint)) {
      this.fail("expected an XML name");
    }

    this.cursor += codePoint > 0xffff ? 2 : 1;
    codePoint = this.xml.codePointAt(this.cursor);
    while (codePoint !== undefined && isXmlNameCharacter(codePoint)) {
      this.cursor += codePoint > 0xffff ? 2 : 1;
      codePoint = this.xml.codePointAt(this.cursor);
    }
    return this.xml.slice(start, this.cursor);
  }

  validateReferences(value, context) {
    let cursor = 0;

    while (cursor < value.length) {
      const ampersand = value.indexOf("&", cursor);
      if (ampersand === -1) return;

      const semicolon = value.indexOf(";", ampersand + 1);
      if (semicolon === -1) this.fail(`unterminated entity reference in ${context}`);

      const reference = value.slice(ampersand + 1, semicolon);
      const namedReference = ["amp", "apos", "gt", "lt", "quot"].includes(reference);
      let numericReference = false;

      if (/^#[0-9]+$/u.test(reference)) {
        numericReference = isXmlCharacter(Number.parseInt(reference.slice(1), 10));
      } else if (/^#x[0-9a-f]+$/iu.test(reference)) {
        numericReference = isXmlCharacter(Number.parseInt(reference.slice(2), 16));
      }

      if (!namedReference && !numericReference) {
        this.fail(`invalid entity reference &${reference}; in ${context}`);
      }
      cursor = semicolon + 1;
    }
  }

  readQuotedValue(context) {
    const quote = this.xml[this.cursor];
    if (quote !== '"' && quote !== "'") this.fail(`expected a quoted ${context}`);

    this.cursor += 1;
    const start = this.cursor;
    while (this.cursor < this.xml.length && this.xml[this.cursor] !== quote) {
      if (this.xml[this.cursor] === "<") this.fail(`< is not allowed in ${context}`);
      const codePoint = this.xml.codePointAt(this.cursor);
      this.cursor += codePoint > 0xffff ? 2 : 1;
    }
    if (this.cursor >= this.xml.length) this.fail(`unterminated ${context}`);

    const value = this.xml.slice(start, this.cursor);
    this.validateReferences(value, context);
    this.cursor += 1;
    return value;
  }

  parseDeclaration() {
    this.cursor += "<?xml".length;
    if (this.skipWhitespace() === 0) this.fail("XML declaration requires whitespace");

    const fields = new Map();
    while (!this.startsWith("?>")) {
      const name = this.readName();
      if (fields.has(name)) this.fail(`duplicate XML declaration field ${name}`);

      this.skipWhitespace();
      if (this.xml[this.cursor] !== "=") this.fail(`expected = after declaration field ${name}`);
      this.cursor += 1;
      this.skipWhitespace();
      fields.set(name, this.readQuotedValue(`XML declaration field ${name}`));

      const whitespace = this.skipWhitespace();
      if (!this.startsWith("?>") && whitespace === 0) {
        this.fail("XML declaration fields require whitespace separation");
      }
    }
    this.cursor += 2;

    const names = [...fields.keys()];
    if (names[0] !== "version" || fields.get("version") !== "1.0") {
      this.fail("XML declaration requires version 1.0 first");
    }
    if (names.some((name) => !["version", "encoding", "standalone"].includes(name))) {
      this.fail("XML declaration contains an unsupported field");
    }
    if (fields.has("encoding") && !/^[A-Za-z][A-Za-z0-9._-]*$/u.test(fields.get("encoding"))) {
      this.fail("XML declaration has an invalid encoding name");
    }
    if (fields.has("standalone") && !["yes", "no"].includes(fields.get("standalone"))) {
      this.fail("XML declaration standalone field must be yes or no");
    }
    if (names.indexOf("encoding") > names.indexOf("standalone") && fields.has("standalone")) {
      this.fail("XML declaration fields are out of order");
    }
  }

  parseComment() {
    const end = this.xml.indexOf("-->", this.cursor + 4);
    if (end === -1) this.fail("unterminated XML comment");

    const content = this.xml.slice(this.cursor + 4, end);
    if (content.includes("--") || content.endsWith("-")) {
      this.fail("XML comments cannot contain -- or end with -");
    }
    this.cursor = end + 3;
  }

  parseProcessingInstruction() {
    this.cursor += 2;
    const target = this.readName();
    if (target.toLowerCase() === "xml") this.fail("XML declaration is misplaced or repeated");

    if (!this.startsWith("?>") && this.skipWhitespace() === 0) {
      this.fail("processing-instruction data requires whitespace");
    }
    const end = this.xml.indexOf("?>", this.cursor);
    if (end === -1) this.fail("unterminated processing instruction");
    this.cursor = end + 2;
  }

  parseCdata() {
    if (this.elementStack.length === 0) this.fail("CDATA is only allowed inside the root element");
    const end = this.xml.indexOf("]]>", this.cursor + 9);
    if (end === -1) this.fail("unterminated CDATA section");
    this.cursor = end + 3;
  }

  parseStartTag() {
    this.cursor += 1;
    const name = this.readName();
    if (this.elementStack.length === 0) {
      if (this.rootName !== null) this.fail("document contains more than one root element");
      this.rootName = name;
    }

    const attributes = new Set();
    let whitespace = this.skipWhitespace();
    while (!this.startsWith(">") && !this.startsWith("/>")) {
      if (whitespace === 0) this.fail("attributes require whitespace separation");

      const attributeName = this.readName();
      if (attributes.has(attributeName)) this.fail(`duplicate attribute ${attributeName}`);
      attributes.add(attributeName);

      this.skipWhitespace();
      if (this.xml[this.cursor] !== "=") this.fail(`expected = after attribute ${attributeName}`);
      this.cursor += 1;
      this.skipWhitespace();
      this.readQuotedValue(`attribute ${attributeName}`);
      whitespace = this.skipWhitespace();
    }

    if (this.startsWith("/>")) {
      this.cursor += 2;
      if (this.elementStack.length === 0) this.rootClosed = true;
      return;
    }
    if (!this.startsWith(">")) this.fail(`unterminated start tag ${name}`);

    this.cursor += 1;
    this.elementStack.push(name);
  }

  parseEndTag() {
    this.cursor += 2;
    const name = this.readName();
    this.skipWhitespace();
    if (!this.startsWith(">")) this.fail(`invalid closing tag ${name}`);
    this.cursor += 1;

    const expectedName = this.elementStack.pop();
    if (expectedName === undefined) this.fail(`closing tag ${name} has no open element`);
    if (expectedName !== name) this.fail(`closing tag ${name} does not match ${expectedName}`);
    if (this.elementStack.length === 0) this.rootClosed = true;
  }

  parseText() {
    const start = this.cursor;
    const nextTag = this.xml.indexOf("<", this.cursor);
    this.cursor = nextTag === -1 ? this.xml.length : nextTag;
    const text = this.xml.slice(start, this.cursor);

    if (text.includes("]]>")) this.fail("]]> is not allowed in XML text");
    this.validateReferences(text, "text");
    if (this.elementStack.length === 0 && text.trim() !== "") {
      this.fail("text is not allowed outside the root element");
    }
  }

  parse() {
    if (
      this.startsWith("<?xml") &&
      /^[\u0009\u000a\u000d\u0020]$/u.test(this.xml[this.cursor + 5] ?? "")
    ) {
      this.parseDeclaration();
    }

    while (this.cursor < this.xml.length) {
      if (this.skipWhitespace() > 0) continue;
      if (this.startsWith("<!--")) {
        this.parseComment();
      } else if (this.startsWith("<?")) {
        this.parseProcessingInstruction();
      } else if (this.startsWith("<![CDATA[")) {
        this.parseCdata();
      } else if (this.startsWith("<!")) {
        this.fail("document type and entity declarations are not allowed in Harbor SVG assets");
      } else if (this.startsWith("</")) {
        this.parseEndTag();
      } else if (this.startsWith("<")) {
        if (this.rootClosed) this.fail("content follows the root element");
        this.parseStartTag();
      } else {
        this.parseText();
      }
    }

    if (this.elementStack.length > 0) {
      this.fail(`unclosed element ${this.elementStack.at(-1)}`);
    }
    if (this.rootName === null) this.fail("document has no root element");
    return this.rootName;
  }
}

function parseXmlDocument(xml, displayPath) {
  return new StrictXmlParser(xml, displayPath).parse();
}

function hasNonemptyTitle(svg) {
  return /<title(?:\s[^>]*)?>\s*[^<\s][^<]*<\/title\s*>/iu.test(svg);
}

function isMarkedDecorative(readme, assetPath) {
  const heading = `### \`${assetPath}\``;
  const sectionStart = readme.indexOf(heading);
  if (sectionStart === -1) return false;

  const nextSection = readme.indexOf("\n### ", sectionStart + heading.length);
  const section = readme.slice(
    sectionStart,
    nextSection === -1 ? readme.length : nextSection,
  );
  return /^- Decorative: yes\s*$/imu.test(section);
}

function decodeCssEscapes(value) {
  return value.replace(
    /\\(?:([0-9a-f]{1,6})\s?|([^\n\r\f]))/giu,
    (_match, hex, character) =>
      hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : character,
  );
}

function extractCssUrls(css) {
  return [...css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)'"]+))\s*\)/giu)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

test("XML parser rejects duplicate attributes and declaration fields", () => {
  assert.throws(
    () => parseXmlDocument('<svg viewBox="0 0 1 1" viewBox="0 0 2 2" />', "duplicate-attribute.svg"),
    /duplicate/iu,
  );
  assert.throws(
    () => parseXmlDocument('<?xml version="1.0" version="1.0"?><svg />', "duplicate-declaration.svg"),
    /duplicate/iu,
  );
});

test("XML parser accepts greater-than signs inside quoted attributes", () => {
  assert.doesNotThrow(() =>
    parseXmlDocument('<svg xmlns="http://www.w3.org/2000/svg" data-note="1 > 0" />', "quoted-greater-than.svg"),
  );
});

test("original Harbor SVG assets are valid, safe, and accessible by contract", async () => {
  const readme = await readFile(new URL("assets/README.md", repositoryUrl), "utf8");

  for (const assetPath of assetPaths) {
    const svg = await readFile(new URL(assetPath, repositoryUrl), "utf8");

    assert.equal(parseXmlDocument(svg, assetPath), "svg", `${assetPath}: root must be svg`);
    assert.doesNotMatch(svg, /<script\b|\son[a-z]+\s*=|<image\b/iu);
    assert.doesNotMatch(svg, /(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:|javascript:)/iu);
    assert.ok(
      hasNonemptyTitle(svg) || isMarkedDecorative(readme, assetPath),
      `${assetPath}: add a nonempty title or mark the asset decorative in assets/README.md`,
    );
  }
});

test("compiled Harbor CSS references only existing repository-local assets", async () => {
  const css = await readFile(themeUrl, "utf8");
  const urls = extractCssUrls(css);
  assert.ok(
    urls.includes("./assets/parchment/fibers.svg"),
    "theme.css must reference the local parchment fibers asset",
  );

  for (const rawUrl of urls) {
    const decodedUrl = decodeCssEscapes(rawUrl).trim();
    const normalizedUrl = decodedUrl.replace(/[\u0000-\u0020]+/gu, "");

    assert.doesNotMatch(normalizedUrl, /^(?:https?:)?\/\//iu, `remote URL: ${rawUrl}`);
    assert.doesNotMatch(normalizedUrl, /^javascript:/iu, `executable URL: ${rawUrl}`);
    assert.doesNotMatch(normalizedUrl, /^[a-z][a-z0-9+.-]*:/iu, `nonlocal URL: ${rawUrl}`);
    assert.ok(!normalizedUrl.startsWith("/"), `root-absolute URL: ${rawUrl}`);

    const assetUrl = new URL(decodedUrl, themeUrl);
    const assetPath = fileURLToPath(assetUrl);
    const pathFromRepository = relative(repositoryPath, assetPath);
    assert.ok(
      pathFromRepository !== ".." && !pathFromRepository.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`),
      `URL escapes repository: ${rawUrl}`,
    );
    assert.ok((await stat(assetUrl)).isFile(), `URL does not resolve to a file: ${rawUrl}`);
  }
});
