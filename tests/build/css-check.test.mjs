import assert from "node:assert/strict";
import test from "node:test";

import { checkCssText } from "../../scripts/check-css.mjs";

const validCss = `:root {
  --harbor-ink: #221b15;
}

.harbor-panel {
  color: var(--harbor-ink);
}
`;

test("accepts focused Harbor CSS", () => {
  assert.deepEqual(checkCssText(validCss, "fixture.css"), []);
});

test("rejects unresolved imports", () => {
  assert.match(
    checkCssText('@import "./tokens.css";\n', "fixture.css").join("\n"),
    /unresolved @import/u,
  );
});

test("rejects escaped import at-keywords", () => {
  const escapedImports = [
    '@\\69mport "https://example.test/theme.css";\n',
    '@\\69\r\nmport "https://example.test/theme.css";\n',
  ];

  for (const css of escapedImports) {
    assert.match(
      checkCssText(css, "fixture.css").join("\n"),
      /unresolved @import/u,
    );
  }
});

test("rejects custom properties outside the Harbor namespace", () => {
  assert.match(
    checkCssText(":root { --foreign-token: red; }\n", "fixture.css").join("\n"),
    /--foreign-token/u,
  );
});

test("rejects CRLF and missing final newline", () => {
  const errors = checkCssText(".panel {\r\n  color: navy;\r\n}", "fixture.css");
  assert.match(errors.join("\n"), /LF line endings/u);
  assert.match(errors.join("\n"), /final newline/u);
});

test("rejects remote CSS URLs", () => {
  assert.match(
    checkCssText(
      '.panel { background: url("https://example.test/paper.png"); }\n',
      "fixture.css",
    ).join("\n"),
    /remote URL/u,
  );
});

test("rejects unbalanced braces", () => {
  assert.match(
    checkCssText(".panel { color: navy;\n", "fixture.css").join("\n"),
    /unbalanced braces/u,
  );
});

test("ignores braces inside strings and comments", () => {
  const css = `.panel::before {
  content: "}";
}

/* An example brace: { */
`;

  assert.deepEqual(checkCssText(css, "fixture.css"), []);
});
