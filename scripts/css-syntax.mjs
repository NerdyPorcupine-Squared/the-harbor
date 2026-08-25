function isIdentifierCharacter(character) {
  return /[a-z0-9_-]/iu.test(character) || character.codePointAt(0) >= 0x80;
}

function consumeEscape(css, startIndex) {
  let index = startIndex + 1;
  const first = css[index];

  if (first === undefined || first === "\n" || first === "\r" || first === "\f") {
    return { character: "", endIndex: startIndex };
  }

  if (/[0-9a-f]/iu.test(first)) {
    let hex = "";
    while (index < css.length && hex.length < 6 && /[0-9a-f]/iu.test(css[index])) {
      hex += css[index];
      index += 1;
    }
    if (/\s/u.test(css[index] ?? "")) index += 1;

    const codePoint = Number.parseInt(hex, 16);
    const character =
      codePoint === 0 || codePoint > 0x10ffff
        ? "\uFFFD"
        : String.fromCodePoint(codePoint);
    return { character, endIndex: index - 1 };
  }

  return { character: first, endIndex: index };
}

function consumeIdentifier(css, startIndex) {
  let value = "";
  let index = startIndex;

  while (index < css.length) {
    const character = css[index];
    if (character === "\\") {
      const escape = consumeEscape(css, index);
      if (escape.endIndex === index) break;
      value += escape.character;
      index = escape.endIndex + 1;
    } else if (isIdentifierCharacter(character)) {
      value += character;
      index += 1;
    } else {
      break;
    }
  }

  return value;
}

export function containsImportAtRule(css) {
  const preprocessedCss = css.replace(/\r\n?|\f/gu, "\n");
  let comment = false;
  let quote = null;

  for (let index = 0; index < preprocessedCss.length; index += 1) {
    const character = preprocessedCss[index];
    const nextCharacter = preprocessedCss[index + 1];

    if (comment) {
      if (character === "*" && nextCharacter === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      comment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "@") {
      const identifier = consumeIdentifier(preprocessedCss, index + 1);
      if (identifier.toLowerCase() === "import") return true;
    }
  }

  return false;
}
