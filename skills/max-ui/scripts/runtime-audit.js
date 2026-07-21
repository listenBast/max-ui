(() => {
  'use strict';

  const MAX_ELEMENTS = 5000;
  const MAX_FINDINGS = 250;
  const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, advisory: 4 };
  const findings = [];
  const seen = new Set();
  const all = [...document.querySelectorAll('*')].slice(0, MAX_ELEMENTS);

  function screenReaderClipped(element, style, rect) {
    const clipped = /rect\(0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?\)/i.test(style.clip)
      || /inset\((?:50%|100%)/i.test(style.clipPath);
    return clipped && rect.width <= 2 && rect.height <= 2 && ['hidden', 'clip'].includes(style.overflow);
  }

  function visible(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    let current = element;
    while (current instanceof Element) {
      const style = getComputedStyle(current);
      const currentRect = current.getBoundingClientRect();
      if (current.hidden || style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || style.contentVisibility === 'hidden' || Number(style.opacity) <= 0.01) return false;
      if (screenReaderClipped(current, style, currentRect)) return false;
      current = current.parentElement;
    }
    return true;
  }

  function escapeCss(value) {
    if (globalThis.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
  }

  function selectorFor(element) {
    if (!(element instanceof Element)) return null;
    if (element.id) return `#${escapeCss(element.id)}`;
    const parts = [];
    let current = element;
    while (current && current !== document.documentElement && parts.length < 5) {
      let part = current.localName;
      const stableClasses = [...current.classList].filter((name) => !/[\[\]:/]/.test(name)).slice(0, 2);
      if (stableClasses.length > 0) part += stableClasses.map((name) => `.${escapeCss(name)}`).join('');
      const siblings = current.parentElement ? [...current.parentElement.children].filter((child) => child.localName === current.localName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      parts.unshift(part);
      const candidate = parts.join(' > ');
      try {
        if (document.querySelectorAll(candidate).length === 1) return candidate;
      } catch {
        // Continue building a conservative structural selector.
      }
      current = current.parentElement;
    }
    return parts.join(' > ') || element.localName;
  }

  function add(finding) {
    if (findings.length >= MAX_FINDINGS) return;
    const selector = finding.selector ?? null;
    const key = `${finding.ruleId}|${selector}|${finding.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({
      ruleId: finding.ruleId,
      severity: finding.severity,
      evidenceClass: finding.evidenceClass,
      category: finding.category,
      fixability: finding.fixability,
      selector,
      message: finding.message,
      suggestion: finding.suggestion,
      metrics: finding.metrics ?? null
    });
  }

  function ownText(element) {
    return [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function accessibleText(element, options = {}) {
    const includeHidden = options.includeHidden ?? false;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const values = [];
    let node;
    while ((node = walker.nextNode())) {
      let parent = node.parentElement;
      let excluded = false;
      while (parent && parent !== element.parentElement) {
        if (parent.matches('script, style, [aria-hidden="true"]')) {
          excluded = true;
          break;
        }
        if (!includeHidden) {
          const style = getComputedStyle(parent);
          if (parent.hidden || style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || style.contentVisibility === 'hidden') {
            excluded = true;
            break;
          }
        }
        parent = parent.parentElement;
      }
      if (!excluded && node.textContent?.trim()) values.push(node.textContent);
    }
    return values.join(' ').replace(/\s+/g, ' ').trim();
  }

  function parseRgb(value) {
    const match = String(value).match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i);
    if (!match) return null;
    return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
  }

  function composite(front, back) {
    const alpha = front.a + back.a * (1 - front.a);
    if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
      g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
      b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
      a: alpha
    };
  }

  function effectiveBackground(element) {
    let result = { r: 0, g: 0, b: 0, a: 0 };
    let current = element;
    while (current instanceof Element) {
      const style = getComputedStyle(current);
      if (style.backgroundImage !== 'none') return null;
      const color = parseRgb(style.backgroundColor);
      if (color && color.a > 0) result = composite(result, color);
      if (result.a >= 0.999) break;
      current = current.parentElement;
    }
    return composite(result, { r: 255, g: 255, b: 255, a: 1 });
  }

  function linear(channel) {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }

  function luminance(color) {
    return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
  }

  function contrast(foreground, background) {
    const renderedForeground = composite(foreground, background);
    const light = Math.max(luminance(renderedForeground), luminance(background));
    const dark = Math.min(luminance(renderedForeground), luminance(background));
    return (light + 0.05) / (dark + 0.05);
  }

  function accessibleName(element) {
    const labelledBy = element.getAttribute('aria-labelledby');
    const labelledText = labelledBy
      ? labelledBy.split(/\s+/).map((id) => {
        const label = document.getElementById(id);
        return label ? accessibleText(label, { includeHidden: true }) : '';
      }).join(' ').trim()
      : '';
    const nativeLabel = element.labels ? [...element.labels].map((label) => accessibleText(label)).join(' ').trim() : '';
    const imageAlt = [...element.querySelectorAll('img[alt]')]
      .filter((image) => !image.closest('[aria-hidden="true"]'))
      .map((image) => image.alt)
      .join(' ')
      .trim();
    return [
      element.getAttribute('aria-label'),
      labelledText,
      nativeLabel,
      element.getAttribute('alt'),
      element.getAttribute('title'),
      accessibleText(element),
      imageAlt
    ].find((value) => value && value.replace(/\s+/g, ' ').trim())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  const visibleElements = all.filter(visible);

  const viewportWidth = document.documentElement.clientWidth;
  const pageScrollWidth = document.documentElement.scrollWidth;
  if (pageScrollWidth > viewportWidth + 1) {
    const offenders = visibleElements
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.right > viewportWidth + 1 || rect.left < -1)
      .sort((a, b) => Math.max(b.rect.right - viewportWidth, -b.rect.left) - Math.max(a.rect.right - viewportWidth, -a.rect.left))
      .slice(0, 8)
      .map(({ element, rect }) => ({ selector: selectorFor(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }));
    add({
      ruleId: 'runtime-horizontal-overflow', severity: 'high', evidenceClass: 'deterministic', category: 'responsive', fixability: 'needs-review', selector: 'html',
      message: `The document is ${pageScrollWidth - viewportWidth}px wider than the viewport.`,
      suggestion: 'Inspect the listed elements and replace viewport locks or fixed widths with an intentional narrow-screen layout.',
      metrics: { viewportWidth, scrollWidth: pageScrollWidth, overflow: pageScrollWidth - viewportWidth, offenders }
    });
  }

  const idGroups = new Map();
  for (const element of all.filter((candidate) => candidate.id)) {
    const group = idGroups.get(element.id) ?? [];
    group.push(element);
    idGroups.set(element.id, group);
  }
  for (const [id, elements] of idGroups) {
    if (elements.length < 2) continue;
    add({
      ruleId: 'runtime-duplicate-id', severity: 'high', evidenceClass: 'deterministic', category: 'accessibility', fixability: 'needs-review', selector: `#${escapeCss(id)}`,
      message: `The id "${id}" is used ${elements.length} times.`,
      suggestion: 'Assign unique IDs and update labels, descriptions, and fragment references that point to them.',
      metrics: { count: elements.length }
    });
  }

  for (const image of [...document.images]) {
    if (!image.complete || image.naturalWidth > 0) continue;
    add({
      ruleId: 'runtime-broken-image', severity: 'high', evidenceClass: 'deterministic', category: 'content', fixability: 'needs-review', selector: selectorFor(image),
      message: 'An image completed loading without usable intrinsic dimensions.',
      suggestion: 'Correct the asset URL or loading contract and provide an intentional fallback.',
      metrics: { src: image.currentSrc || image.src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
    });
  }

  const interactiveSelector = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [tabindex]:not([tabindex="-1"])';
  for (const element of [...document.querySelectorAll(interactiveSelector)].filter(visible)) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const inlineTextLink = element.matches('a[href]') && style.display === 'inline' && accessibleText(element).length > 0;
    if (!inlineTextLink && !element.matches('[disabled], [aria-disabled="true"]') && (rect.width < 32 || rect.height < 32)) {
      add({
        ruleId: 'runtime-undersized-target', severity: rect.width < 24 || rect.height < 24 ? 'high' : 'medium', evidenceClass: 'strong-signal', category: 'accessibility', fixability: 'needs-review', selector: selectorFor(element),
        message: `An interactive target renders at ${Math.round(rect.width)}x${Math.round(rect.height)}px.`,
        suggestion: 'Increase the clickable box or spacing while preserving the density appropriate to this workflow.',
        metrics: { width: Number(rect.width.toFixed(1)), height: Number(rect.height.toFixed(1)) }
      });
    }

    const iconLike = element.matches('button, [role="button"], a[href]') && (
      element.querySelector('svg, img, [class*="icon" i]') || element.children.length === 1
    );
    if (iconLike && !accessibleName(element)) {
      add({
        ruleId: 'runtime-icon-control-name', severity: 'high', evidenceClass: 'deterministic', category: 'accessibility', fixability: 'needs-review', selector: selectorFor(element),
        message: 'An icon-like interactive control has no accessible name.',
        suggestion: 'Add a concise aria-label or connect visible text with aria-labelledby.'
      });
    }
  }

  let gradientElements = 0;
  let glassElements = 0;
  let shadowElements = 0;
  for (const element of visibleElements) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const text = ownText(element);
    if (/(?:linear|radial|conic)-gradient\(/i.test(style.backgroundImage)) gradientElements += 1;
    if (style.backdropFilter !== 'none' && /blur\(/i.test(style.backdropFilter)) glassElements += 1;
    if (style.boxShadow !== 'none') shadowElements += 1;

    if (text && (['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)) && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)) {
      add({
        ruleId: 'runtime-clipped-text', severity: 'high', evidenceClass: 'deterministic', category: 'layout', fixability: 'needs-review', selector: selectorFor(element),
        message: 'Visible text exceeds a container that clips overflow.',
        suggestion: 'Allow wrapping or expansion, or confirm that deliberate truncation exposes the full value elsewhere.',
        metrics: { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, text: text.slice(0, 120) }
      });
    }

    if (!text) continue;
    const fontSize = Number.parseFloat(style.fontSize);
    if (Number.isFinite(fontSize) && fontSize < 11) {
      add({
        ruleId: 'runtime-tiny-text', severity: fontSize < 9 ? 'high' : 'medium', evidenceClass: 'strong-signal', category: 'typography', fixability: 'needs-review', selector: selectorFor(element),
        message: `Text renders at ${fontSize}px.`,
        suggestion: 'Increase the type size or reduce information density without weakening the hierarchy.',
        metrics: { fontSize, text: text.slice(0, 120) }
      });
    }

    const foreground = parseRgb(style.color);
    const background = effectiveBackground(element);
    if (!foreground || !background) continue;
    const ratio = contrast(foreground, background);
    const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
    const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const threshold = largeText ? 3 : 4.5;
    if (ratio < threshold) {
      add({
        ruleId: 'runtime-low-contrast', severity: ratio < 3 ? 'high' : 'medium', evidenceClass: 'deterministic', category: 'color', fixability: 'direction-required', selector: selectorFor(element),
        message: `Computed text contrast is ${ratio.toFixed(2)}:1; this text requires at least ${threshold}:1.`,
        suggestion: 'Adjust the semantic text or surface role, then remeasure all states that use the same token.',
        metrics: { ratio: Number(ratio.toFixed(2)), threshold, fontSize, fontWeight, text: text.slice(0, 120) }
      });
    }
  }

  const visibleCount = visibleElements.length;
  const densityRules = [
    ['runtime-gradient-density', gradientElements, 8, 'gradient backgrounds', 'Remove decorative gradients that do not encode brand, hierarchy, or data.'],
    ['runtime-glass-density', glassElements, 4, 'backdrop-blurred surfaces', 'Reduce glass effects unless transparency is a deliberate material system.'],
    ['runtime-shadow-density', shadowElements, 20, 'shadowed elements', 'Use borders, spacing, and surface contrast for hierarchy before adding repeated elevation.']
  ];
  for (const [ruleId, count, threshold, label, suggestion] of densityRules) {
    if (count < threshold) continue;
    add({
      ruleId, severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language', fixability: 'direction-required', selector: 'body',
      message: `The rendered page contains ${count} ${label}.`, suggestion,
      metrics: { count, visibleElements: visibleCount, share: visibleCount === 0 ? 0 : Number((count / visibleCount).toFixed(3)) }
    });
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.ruleId.localeCompare(b.ruleId) || String(a.selector).localeCompare(String(b.selector)));
  const group = (values, key) => values.reduce((result, value) => {
    result[value] = findings.filter((finding) => finding[key] === value).length;
    return result;
  }, {});

  return {
    url: location.href,
    title: document.title,
    generatedAt: new Date().toISOString(),
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    scan: { elementsConsidered: all.length, elementLimit: MAX_ELEMENTS, truncated: document.querySelectorAll('*').length > MAX_ELEMENTS },
    summary: {
      total: findings.length,
      bySeverity: group(Object.keys(SEVERITY_ORDER), 'severity'),
      byEvidenceClass: group(['deterministic', 'strong-signal', 'visual-review'], 'evidenceClass'),
      byFixability: group(['safe-auto', 'needs-review', 'direction-required'], 'fixability')
    },
    findings,
    notes: [
      'This audit reads the current DOM and computed styles without mutating the page.',
      'Visual-review findings require screenshot inspection and product context before changes.'
    ]
  };
})();
