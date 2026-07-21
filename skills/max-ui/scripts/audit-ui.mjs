#!/usr/bin/env node
import path from 'node:path';
import { contrastRatio, parseHexColor } from './lib/color.mjs';
import { lineNumberAt, lineSnippetAt, readUtf8, walkTextFiles } from './lib/files.mjs';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, advisory: 4 };

function parseArgs(argv) {
  const result = { root: '.', format: 'markdown', maxFiles: 2500, maxFindings: 250 };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--format') result.format = argv[++i] ?? result.format;
    else if (value === '--max-files') result.maxFiles = Number(argv[++i] ?? result.maxFiles);
    else if (value === '--max-findings') result.maxFindings = Number(argv[++i] ?? result.maxFindings);
    else if (!value.startsWith('--')) result.root = value;
  }
  if (!['json', 'markdown'].includes(result.format)) throw new Error('--format must be json or markdown');
  return result;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/[{}]/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function visibleButtonText(value) {
  return stripTags(value)
    .replace(/\b(?:className|class|style|size|strokeWidth|width|height)\s*=\s*[^\s]+/g, '')
    .replace(/\b[A-Z][A-Za-z0-9]*(?:Icon)?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function solidHex(value) {
  const match = value.trim().match(/^(#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:\s*!important)?$/i);
  return match?.[1] ?? null;
}

function countMatches(text, regex) {
  return (text.match(regex) ?? []).length;
}

function formatMarkdown(report) {
  const lines = [
    '# Frontend Audit',
    '',
    `Project: \`${report.projectRoot}\``,
    `Scanned: ${report.summary.filesScanned} files`,
    `Findings: ${report.summary.total}`,
    ''
  ];
  if (report.findings.length === 0) {
    lines.push('No static findings. Runtime visual verification is still required.', '');
  } else {
    let currentFile = null;
    for (const finding of report.findings) {
      if (finding.file !== currentFile) {
        currentFile = finding.file;
        lines.push(`## ${currentFile}`, '');
      }
      lines.push(`- **${finding.severity.toUpperCase()} · ${finding.evidenceClass} · ${finding.ruleId}** at line ${finding.line}: ${finding.message}`);
      if (finding.snippet) lines.push(`  - Evidence: \`${finding.snippet.replace(/`/g, '\\`')}\``);
      lines.push(`  - Fix: ${finding.suggestion}`);
    }
  }
  if (report.scan.truncated) lines.push('', `Scan stopped at the ${report.scan.maxFiles}-file limit.`);
  lines.push('', 'Static findings must be checked against the rendered interface and local design system.');
  return `${lines.join('\n')}\n`;
}

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root);
const scan = await walkTextFiles(root, { maxFiles: args.maxFiles });
const findings = [];
const seen = new Set();
const sources = [];

for (const file of scan.files) {
  const text = await readUtf8(file.absolute);
  if (text !== null) sources.push({ file, text });
}

const projectHasFocusVisible = sources.some(({ text }) => /:focus-visible\b|\bfocus-visible:/i.test(text));

function add(file, text, index, finding) {
  const line = lineNumberAt(text, index);
  const key = `${finding.ruleId}|${file.relative}|${line}|${finding.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push({
    ruleId: finding.ruleId,
    severity: finding.severity,
    evidenceClass: finding.evidenceClass,
    category: finding.category,
    file: file.relative,
    line,
    message: finding.message,
    suggestion: finding.suggestion,
    snippet: finding.snippet ?? lineSnippetAt(text, index)
  });
}

for (const { file, text } of sources) {
  const extension = path.extname(file.relative).toLowerCase();

  const directRules = [
    {
      regex: /(?:user-scalable\s*=\s*["']?no|maximum-scale\s*=\s*["']?1(?:\.0)?)/gi,
      finding: { ruleId: 'zoom-disabled', severity: 'critical', evidenceClass: 'deterministic', category: 'accessibility', message: 'Browser zoom appears to be disabled.', suggestion: 'Remove the zoom restriction and test the layout at enlarged text and page zoom.' }
    },
    {
      regex: /transition\s*:\s*all\b/gi,
      finding: { ruleId: 'transition-all', severity: 'medium', evidenceClass: 'strong-signal', category: 'motion', message: 'The transition animates every changed property.', suggestion: 'List only the intended compositor-friendly properties.' }
    },
    {
      regex: /repeating-(?:linear|radial)-gradient\s*\(/gi,
      finding: { ruleId: 'decorative-repeating-gradient', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language', message: 'A repeating gradient may be acting as generic decoration.', suggestion: 'Keep it only when the product subject genuinely calls for stripes, measurement, or a material pattern.' }
    },
    {
      regex: /letter-spacing\s*:\s*-(?:0\.0[5-9]|0\.[1-9]\d*)em/gi,
      finding: { ruleId: 'crushed-display-tracking', severity: 'medium', evidenceClass: 'strong-signal', category: 'typography', message: 'Negative tracking is likely tight enough to damage legibility.', suggestion: 'Loosen display tracking and inspect the longest heading at mobile width.' }
    },
    {
      regex: /\b(?:bokeh|(?:decorative|ambient|gradient)[-_]?(?:orb|blob)|(?:orb|blob)[-_]?(?:background|decoration))\b/gi,
      finding: { ruleId: 'ambient-decoration-signal', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language', message: 'The code names a common ambient decoration pattern.', suggestion: 'Inspect the render and remove it when it carries no product meaning.' }
    }
  ];

  for (const rule of directRules) {
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(text)) !== null) add(file, text, match.index, rule.finding);
  }

  const removedOutline = /(?:outline\s*:\s*(?:0|none)|outline-none\b)/gi;
  let outlineMatch;
  while ((outlineMatch = removedOutline.exec(text)) !== null) {
    add(file, text, outlineMatch.index, {
      ruleId: 'focus-outline-removed',
      severity: projectHasFocusVisible ? 'advisory' : 'high',
      evidenceClass: projectHasFocusVisible ? 'visual-review' : 'strong-signal',
      category: 'accessibility',
      message: projectHasFocusVisible
        ? 'A focus outline is removed, while the project also defines focus-visible styles; selector coverage needs verification.'
        : 'A focus outline is removed and no project-level focus-visible replacement was found.',
      suggestion: 'Confirm the same control receives a visible keyboard focus treatment; add a scoped focus-visible style if it does not.'
    });
  }

  if (/\.(jsx|tsx|js|ts|vue|svelte|astro|html|htm)$/.test(extension)) {
    const divClick = /<div\b([^>]*\bonClick\s*=\s*[^>]*)>/gi;
    let match;
    while ((match = divClick.exec(text)) !== null) {
      const attrs = match[1];
      if (!/\brole\s*=/.test(attrs) || !/\bonKey(?:Down|Up)\s*=/.test(attrs)) {
        add(file, text, match.index, {
          ruleId: 'div-click-control', severity: 'high', evidenceClass: 'deterministic', category: 'accessibility',
          message: 'A div is used as an interactive control without complete keyboard semantics.',
          suggestion: 'Use a button or link when possible; otherwise add the correct role, focusability, and keyboard behavior.'
        });
      }
    }

    const imageTag = /<img\b([^>]*)>/gi;
    while ((match = imageTag.exec(text)) !== null) {
      const attrs = match[1];
      if (!/\balt\s*=/.test(attrs)) {
        add(file, text, match.index, {
          ruleId: 'image-missing-alt', severity: 'high', evidenceClass: 'deterministic', category: 'accessibility',
          message: 'An image has no alt attribute.',
          suggestion: 'Add meaningful alt text, or alt="" when the image is purely decorative.'
        });
      }
      if (!/\bwidth\s*=/.test(attrs) || !/\bheight\s*=/.test(attrs)) {
        add(file, text, match.index, {
          ruleId: 'image-unstable-size', severity: 'medium', evidenceClass: 'strong-signal', category: 'performance',
          message: 'An image does not declare both intrinsic dimensions.',
          suggestion: 'Reserve its aspect ratio with width and height or an equivalent stable container.'
        });
      }
    }

    const button = /<button\b([^>]*)>([\s\S]{0,500}?)<\/button>/gi;
    while ((match = button.exec(text)) !== null) {
      const attrs = match[1];
      const body = match[2];
      const iconLike = /<svg\b|<[A-Z][A-Za-z0-9]*(?:Icon)\b|\bicon\s*=/.test(body);
      const named = /\baria-label\s*=|\baria-labelledby\s*=|\btitle\s*=/.test(attrs);
      if (iconLike && !named && visibleButtonText(body).length === 0) {
        add(file, text, match.index, {
          ruleId: 'icon-button-name', severity: 'high', evidenceClass: 'deterministic', category: 'accessibility',
          message: 'An icon-only button has no accessible name.',
          suggestion: 'Add a concise aria-label or associate visible text through aria-labelledby.'
        });
      }
    }

    const trackedKickers = countMatches(text, /(?:uppercase[^"'\n]{0,100}tracking-|tracking-[^"'\n]{0,100}uppercase)/g);
    if (trackedKickers >= 4) {
      const index = text.search(/(?:uppercase[^"'\n]{0,100}tracking-|tracking-[^"'\n]{0,100}uppercase)/);
      add(file, text, Math.max(0, index), {
        ruleId: 'repeated-kicker-system', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language',
        message: `The file contains ${trackedKickers} uppercase tracked-label patterns.`,
        suggestion: 'Inspect whether they communicate real structure or repeat a generic section-heading formula.'
      });
    }

    const cardLikeClasses = countMatches(text, /class(?:Name)?\s*=\s*["'`][^"'`\n]*(?:rounded-(?:xl|2xl|3xl)|rounded-\[[^\]]+\])[^"'`\n]*(?:shadow|border)[^"'`\n]*["'`]/g);
    if (cardLikeClasses >= 6) {
      const index = text.search(/class(?:Name)?\s*=\s*["'`][^"'`\n]*(?:rounded-(?:xl|2xl|3xl)|rounded-\[[^\]]+\])/);
      add(file, text, Math.max(0, index), {
        ruleId: 'card-monoculture', severity: 'advisory', evidenceClass: 'visual-review', category: 'layout',
        message: `The file contains ${cardLikeClasses} similarly rounded bordered or shadowed containers.`,
        suggestion: 'Check whether lists, bands, dividers, tables, or whitespace would express hierarchy more clearly.'
      });
    }
  }

  if (/\.(css|scss|sass|less|vue|svelte|astro)$/.test(extension)) {
    const blocks = /([^{}]+)\{([^{}]*)\}/g;
    let block;
    while ((block = blocks.exec(text)) !== null) {
      const selector = block[1].trim();
      const body = block[2];
      const blockIndex = block.index;
      const blockSnippet = `${selector.slice(0, 90)} { ${body.trim().replace(/\s+/g, ' ').slice(0, 130)} }`;

      const bodyMinWidth = body.match(/min-width\s*:\s*([0-9.]+)px/i);
      if (/\bbody\b/i.test(selector) && bodyMinWidth && Number(bodyMinWidth[1]) >= 768) {
        add(file, text, blockIndex, {
          ruleId: 'viewport-min-width-lock', severity: 'high', evidenceClass: 'strong-signal', category: 'responsive',
          message: `The page body enforces a ${bodyMinWidth[1]}px minimum width.`,
          suggestion: 'Remove the viewport lock or provide a real narrow-screen composition instead of clipping the desktop canvas.',
          snippet: blockSnippet
        });
      }

      if (/\bbody\b/i.test(selector) && /overflow(?:-x)?\s*:\s*hidden/i.test(body)) {
        add(file, text, blockIndex, {
          ruleId: 'body-overflow-hidden', severity: 'medium', evidenceClass: 'strong-signal', category: 'responsive',
          message: 'The page body hides overflow, which can conceal responsive failures and clipped content.',
          suggestion: 'Verify the layout at narrow widths and hide overflow only on the specific element that requires it.',
          snippet: blockSnippet
        });
      }

      if (/background(?:-image)?\s*:[^;]*(?:linear|radial|conic)-gradient/i.test(body) && /(?:background-clip|-webkit-background-clip)\s*:\s*text/i.test(body)) {
        add(file, text, blockIndex, {
          ruleId: 'gradient-text', severity: 'medium', evidenceClass: 'strong-signal', category: 'visual-language',
          message: `Gradient text is applied by selector "${selector.slice(0, 80)}".`,
          suggestion: 'Use a solid text color unless the gradient conveys a specific brand or data meaning.',
          snippet: blockSnippet
        });
      }

      const radiusMatch = body.match(/border-radius\s*:\s*([0-9.]+)px/i);
      if (radiusMatch && Number(radiusMatch[1]) >= 24 && /card|panel|section|surface|dialog|modal/i.test(selector)) {
        add(file, text, blockIndex, {
          ruleId: 'oversized-container-radius', severity: 'advisory', evidenceClass: 'visual-review', category: 'layout',
          message: `A container-like selector uses a ${radiusMatch[1]}px radius.`,
          suggestion: 'Check whether the large radius belongs to the brand or merely makes every surface look inflated.',
          snippet: blockSnippet
        });
      }

      const widthMatch = body.match(/(?:^|;)\s*width\s*:\s*([0-9.]+)px/i);
      if (widthMatch && Number(widthMatch[1]) >= 768 && !/(?:max-width|width\s*:\s*(?:min|max|clamp|calc)\()/i.test(body)) {
        add(file, text, blockIndex, {
          ruleId: 'large-fixed-width', severity: 'high', evidenceClass: 'strong-signal', category: 'responsive',
          message: `A ${widthMatch[1]}px fixed width has no local max-width constraint.`,
          suggestion: 'Use an intrinsic or responsive constraint and verify narrow viewports.',
          snippet: blockSnippet
        });
      }

      const foregroundHex = solidHex(body.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1] ?? '');
      const backgroundHex = solidHex(body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i)?.[1] ?? '');
      if (foregroundHex && backgroundHex) {
        const ratio = contrastRatio(parseHexColor(foregroundHex), parseHexColor(backgroundHex));
        if (ratio !== null && ratio < 4.5) {
          add(file, text, blockIndex, {
            ruleId: 'static-low-contrast', severity: ratio < 3 ? 'high' : 'medium', evidenceClass: 'deterministic', category: 'color',
            message: `Static text/background contrast is ${ratio.toFixed(2)}:1 for selector "${selector.slice(0, 80)}".`,
            suggestion: 'Adjust the text or surface token, then verify the computed runtime colors.',
            snippet: blockSnippet
          });
        }
      }

      const borderAndShadow = /border\s*:[^;]*1px[^;]*;/i.test(`${body};`) && body.match(/box-shadow\s*:\s*([^;]+)/i);
      if (borderAndShadow) {
        const blurValues = [...borderAndShadow[1].matchAll(/\s([0-9.]+)px/g)].map((item) => Number(item[1]));
        if (blurValues.some((value) => value >= 16)) {
          add(file, text, blockIndex, {
            ruleId: 'border-wide-shadow-stack', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language',
            message: 'A one-pixel border is paired with a wide soft shadow on the same element.',
            suggestion: 'Inspect whether both layers are necessary; prefer a clearer edge or a restrained elevation cue.',
            snippet: blockSnippet
          });
        }
      }
    }

    const animationCount = countMatches(text, /@keyframes\b|\banimation(?:-name)?\s*:/gi);
    if (animationCount > 0 && !/prefers-reduced-motion\s*:\s*reduce/i.test(text)) {
      const index = text.search(/@keyframes\b|\banimation(?:-name)?\s*:/i);
      add(file, text, Math.max(0, index), {
        ruleId: 'missing-reduced-motion', severity: 'high', evidenceClass: 'strong-signal', category: 'motion',
        message: 'Animations are defined without a reduced-motion branch in this style file.',
        suggestion: 'Add a reduced-motion alternative and verify that useful content remains visible.'
      });
    }

    const gradientCount = countMatches(text, /(?:linear|radial|conic)-gradient\s*\(/gi);
    if (gradientCount >= 5) {
      const index = text.search(/(?:linear|radial|conic)-gradient\s*\(/i);
      add(file, text, Math.max(0, index), {
        ruleId: 'gradient-density', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language',
        message: `The file contains ${gradientCount} gradient declarations.`,
        suggestion: 'Review the rendered surface for decorative layering and keep only gradients with distinct jobs.'
      });
    }

    const glassCount = countMatches(text, /backdrop-filter\s*:\s*[^;]*blur\s*\(/gi);
    if (glassCount >= 3) {
      const index = text.search(/backdrop-filter\s*:\s*[^;]*blur\s*\(/i);
      add(file, text, Math.max(0, index), {
        ruleId: 'glass-density', severity: 'advisory', evidenceClass: 'visual-review', category: 'visual-language',
        message: `The file contains ${glassCount} backdrop blur declarations.`,
        suggestion: 'Check whether glass is a real material system or a repeated decorative default.'
      });
    }

    const hexValues = [...text.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)].map((match) => match[0].toLowerCase());
    const uniqueHex = new Set(hexValues);
    if (uniqueHex.size >= 16) {
      const index = text.search(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i);
      add(file, text, Math.max(0, index), {
        ruleId: 'color-sprawl', severity: 'medium', evidenceClass: 'strong-signal', category: 'color',
        message: `The style file contains ${uniqueHex.size} unique hex colors.`,
        suggestion: 'Map repeated roles to existing tokens and distinguish intentional data colors from accidental variation.'
      });
    }

    const commonFonts = [...text.matchAll(/font-family\s*:\s*([^;}{\n]+)/gi)].map((match) => match[1].toLowerCase());
    if (commonFonts.length > 0 && commonFonts.every((value) => /\b(inter|roboto|geist|arial|system-ui)\b/.test(value))) {
      const index = text.search(/font-family\s*:/i);
      add(file, text, Math.max(0, index), {
        ruleId: 'default-font-only', severity: 'advisory', evidenceClass: 'visual-review', category: 'typography',
        message: 'All explicit font-family declarations use common neutral defaults.',
        suggestion: 'Keep them when they fit the product; otherwise consider a more specific display or data role rather than changing every font.'
      });
    }
  }
}

findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));
const limited = findings.slice(0, args.maxFindings);
const bySeverity = Object.fromEntries(Object.keys(SEVERITY_ORDER).map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length]));
const byEvidenceClass = ['deterministic', 'strong-signal', 'visual-review'].reduce((result, evidenceClass) => {
  result[evidenceClass] = findings.filter((finding) => finding.evidenceClass === evidenceClass).length;
  return result;
}, {});

const report = {
  projectRoot: root,
  generatedAt: new Date().toISOString(),
  summary: { total: findings.length, returned: limited.length, bySeverity, byEvidenceClass, filesScanned: scan.files.length },
  scan: { truncated: scan.truncated, maxFiles: args.maxFiles, skippedLarge: scan.skippedLarge.slice(0, 20) },
  findings: limited
};

process.stdout.write(args.format === 'json' ? `${JSON.stringify(report, null, 2)}\n` : formatMarkdown(report));
