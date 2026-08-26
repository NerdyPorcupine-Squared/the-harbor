(() => {
  'use strict';

  const REDACTED_TEXT = '[REDACTED_TEXT]';
  const REDACTED_URL = '[REDACTED_URL]';
  const REDACTED_ID = '[REDACTED_ID]';
  const SCHEMA_VERSION = 1;
  const MAX_ELEMENTS = 120;
  const MAX_RULES = 180;

  const STYLE_PROPERTIES = [
    'display', 'visibility', 'position', 'inset', 'top', 'right', 'bottom', 'left',
    'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'overflow', 'overflowX', 'overflowY', 'aspectRatio', 'transform',
    'background', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
    'objectFit', 'objectPosition', 'border', 'borderWidth', 'borderRadius', 'boxShadow',
    'color', 'fontFamily', 'fontSize', 'lineHeight', 'opacity', 'zIndex',
    'flex', 'flexBasis', 'flexDirection', 'alignItems', 'justifyContent', 'gap',
    'gridTemplateColumns', 'gridTemplateRows'
  ];

  const SENSITIVE_ATTRIBUTE = /(?:token|secret|password|user|username|email|path|url|src|href|poster|name|title|label|alt|value|item.?id|server.?id|device.?id|session.?id)/i;
  const ID_LIKE = /(?:\b[0-9a-f]{24,}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b)/gi;
  const PRIVATE_ADDRESS = /\b(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?\b/gi;
  const EMAIL = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi;
  const URL = /(?:https?:)?\/\/[^\s"')]+/gi;
  const CSS_URL = /url\((?:"[^"]*"|'[^']*'|[^)]*)\)/gi;

  function redactIdentifiers(value) {
    return String(value ?? '')
      .replace(ID_LIKE, REDACTED_ID)
      .replace(PRIVATE_ADDRESS, '[REDACTED_HOST]')
      .replace(EMAIL, '[REDACTED_EMAIL]');
  }

  function sanitizeUrl(value) {
    if (!value) return value;
    return redactIdentifiers(String(value).replace(URL, REDACTED_URL));
  }

  function sanitizeStyle(value) {
    if (!value) return value;
    return redactIdentifiers(String(value).replace(CSS_URL, `url("${REDACTED_URL}")`));
  }

  function sanitizeText(value) {
    if (!String(value ?? '').trim()) return value;
    return REDACTED_TEXT;
  }

  function sanitizeAttribute(name, value) {
    const lower = String(name).toLowerCase();
    if (lower === 'class' || lower === 'role' || lower.startsWith('aria-') && lower !== 'aria-label') {
      return redactIdentifiers(value);
    }
    if (lower === 'style') return sanitizeStyle(value);
    if (SENSITIVE_ATTRIBUTE.test(lower)) {
      if (/style/i.test(lower)) return sanitizeStyle(value);
      if (/(?:src|href|url|poster|path)/i.test(lower)) return REDACTED_URL;
      if (/(?:id|token|session|device|server)/i.test(lower)) return REDACTED_ID;
      return REDACTED_TEXT;
    }
    return redactIdentifiers(value);
  }

  function sanitizedOuterHTML(element) {
    if (!element?.cloneNode) return null;
    const clone = element.cloneNode(true);
    const documentRef = element.ownerDocument;
    const showText = globalThis.NodeFilter?.SHOW_TEXT ?? 4;
    const walker = documentRef?.createTreeWalker?.(clone, showText);
    if (walker) {
      let node = walker.nextNode();
      while (node) {
        if (node.nodeValue?.trim()) node.nodeValue = REDACTED_TEXT;
        node = walker.nextNode();
      }
    }

    const nodes = [clone, ...clone.querySelectorAll('*')];
    for (const node of nodes) {
      for (const attribute of [...node.attributes]) {
        node.setAttribute(attribute.name, sanitizeAttribute(attribute.name, attribute.value));
      }
    }
    return clone.outerHTML;
  }

  function styleSnapshot(style) {
    const snapshot = {};
    for (const property of STYLE_PROPERTIES) {
      const value = style?.[property];
      if (value !== undefined && value !== '') {
        snapshot[property] = property.startsWith('background') ? sanitizeStyle(value) : redactIdentifiers(value);
      }
    }
    return snapshot;
  }

  function rectSnapshot(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.x * 100) / 100,
      y: Math.round(rect.y * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100
    };
  }

  function identitySnapshot(element) {
    const attributes = {};
    for (const attribute of [...element.attributes]) {
      attributes[attribute.name] = sanitizeAttribute(attribute.name, attribute.value);
    }
    return {
      tag: element.tagName?.toLowerCase() ?? null,
      id: redactIdentifiers(element.id || ''),
      className: redactIdentifiers(typeof element.className === 'string' ? element.className : ''),
      attributes
    };
  }

  function elementSnapshot(element) {
    return {
      ...identitySnapshot(element),
      rect: rectSnapshot(element),
      computed: styleSnapshot(globalThis.getComputedStyle(element))
    };
  }

  function collectAncestors(element, limit = 8) {
    const ancestors = [];
    let current = element?.parentElement;
    while (current && ancestors.length < limit) {
      ancestors.push(elementSnapshot(current));
      current = current.parentElement;
    }
    return ancestors;
  }

  function walkCssRules(rules, visit) {
    for (const rule of [...(rules ?? [])]) {
      if (rule.selectorText && rule.style) visit(rule);
      if (rule.cssRules) {
        try { walkCssRules(rule.cssRules, visit); } catch { }
      }
    }
  }

  function matchedRules(element) {
    const matches = [];
    for (const sheet of [...(globalThis.document?.styleSheets ?? [])]) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      walkCssRules(rules, (rule) => {
        if (matches.length >= MAX_RULES) return;
        try {
          if (!element.matches(rule.selectorText)) return;
        } catch {
          return;
        }
        const declarations = {};
        for (const property of [...rule.style]) {
          const value = rule.style.getPropertyValue(property);
          declarations[property] = property.startsWith('background') ? sanitizeStyle(value) : redactIdentifiers(value);
        }
        matches.push({
          selector: rule.selectorText,
          declarations,
          important: [...rule.style].filter((property) => rule.style.getPropertyPriority(property) === 'important')
        });
      });
      if (matches.length >= MAX_RULES) break;
    }
    return matches;
  }

  function jellyfinVersion() {
    try {
      const candidate = globalThis.ApiClient?.appVersion?.() ?? globalThis.ApiClient?._appVersion ?? null;
      return typeof candidate === 'string' ? redactIdentifiers(candidate) : null;
    } catch {
      return null;
    }
  }

  function metadata(label) {
    return {
      schemaVersion: SCHEMA_VERSION,
      label,
      capturedAt: new Date().toISOString(),
      jellyfinVersion: jellyfinVersion(),
      userAgent: globalThis.navigator?.userAgent ?? null,
      viewport: {
        width: globalThis.innerWidth ?? null,
        height: globalThis.innerHeight ?? null,
        devicePixelRatio: globalThis.devicePixelRatio ?? null
      },
      pathname: redactIdentifiers(globalThis.location?.pathname ?? ''),
      mediaBarEnhancedDetected: Boolean(globalThis.document?.querySelector?.('#slides-container'))
    };
  }

  function capture(element, label = 'runtime-element') {
    if (!element?.querySelectorAll) throw new Error('HarborCapture.capture requires a DOM element.');
    const descendants = [element, ...element.querySelectorAll('*')].slice(0, MAX_ELEMENTS);
    return {
      metadata: metadata(label),
      root: identitySnapshot(element),
      outerHTML: sanitizedOuterHTML(element),
      ancestors: collectAncestors(element),
      elements: descendants.map(elementSnapshot),
      matchedRules: matchedRules(element)
    };
  }

  function download(element, label = 'runtime-element') {
    const payload = capture(element, label);
    const safeLabel = String(label).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'capture';
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `harbor-${safeLabel}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return payload;
  }

  function firstVisible(selector) {
    const candidates = [...document.querySelectorAll(selector)];
    return candidates.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }) ?? null;
  }

  function captureSelector(selector, label = selector) {
    const element = firstVisible(selector);
    if (!element) throw new Error(`No visible element matched ${selector}`);
    return capture(element, label);
  }

  function downloadSelector(selector, label = selector) {
    const element = firstVisible(selector);
    if (!element) throw new Error(`No visible element matched ${selector}`);
    return download(element, label);
  }

  function closest(element, selector) {
    return element?.closest?.(selector) ?? null;
  }

  const api = Object.freeze({
    version: '1.0.0',
    capture,
    download,
    captureSelector,
    downloadSelector,
    closest,
    sanitizeUrl,
    sanitizeStyle,
    sanitizeText,
    sanitizeAttribute,
    sanitizedOuterHTML
  });

  globalThis.HarborCapture = api;
  if (globalThis.console?.info) {
    console.info('HarborCapture 1.0.0 loaded. Captures are sanitized locally and make no network requests.');
  }
})();
