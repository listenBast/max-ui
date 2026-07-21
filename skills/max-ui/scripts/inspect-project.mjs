#!/usr/bin/env node
import path from 'node:path';
import { readJson, readUtf8, topCounts, walkTextFiles } from './lib/files.mjs';

function parseArgs(argv) {
  const result = { root: '.', maxFiles: 2500, compact: false };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--max-files') result.maxFiles = Number(argv[++i] ?? result.maxFiles);
    else if (value === '--compact') result.compact = true;
    else if (!value.startsWith('--')) result.root = value;
  }
  if (!Number.isFinite(result.maxFiles) || result.maxFiles < 1) result.maxFiles = 2500;
  return result;
}

function dependencyMap(packageJson) {
  return {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
    ...(packageJson?.peerDependencies ?? {})
  };
}

function detectFrameworks(dependencies, fileNames) {
  const checks = [
    ['Next.js', Boolean(dependencies.next) || fileNames.some((name) => /(^|\/)next\.config\./.test(name))],
    ['Nuxt', Boolean(dependencies.nuxt) || fileNames.some((name) => /(^|\/)nuxt\.config\./.test(name))],
    ['SvelteKit', Boolean(dependencies['@sveltejs/kit'])],
    ['Svelte', Boolean(dependencies.svelte)],
    ['Astro', Boolean(dependencies.astro) || fileNames.some((name) => /(^|\/)astro\.config\./.test(name))],
    ['Vue', Boolean(dependencies.vue)],
    ['React', Boolean(dependencies.react)],
    ['Angular', Boolean(dependencies['@angular/core'])],
    ['Solid', Boolean(dependencies['solid-js'])]
  ];
  return checks.filter(([, present]) => present).map(([name]) => name);
}

function detectStyling(dependencies, fileNames, contents) {
  const joined = contents.join('\n');
  const systems = [];
  const add = (name, present) => { if (present && !systems.includes(name)) systems.push(name); };
  add('Tailwind CSS', Boolean(dependencies.tailwindcss) || fileNames.some((name) => /tailwind\.config\./.test(name)) || /@tailwind\s+(base|components|utilities)/.test(joined));
  add('CSS Modules', fileNames.some((name) => /\.module\.(css|scss|sass|less)$/.test(name)));
  add('Sass', Boolean(dependencies.sass) || fileNames.some((name) => /\.(scss|sass)$/.test(name)));
  add('styled-components', Boolean(dependencies['styled-components']));
  add('Emotion', Boolean(dependencies['@emotion/react']) || Boolean(dependencies['@emotion/styled']));
  add('vanilla-extract', Boolean(dependencies['@vanilla-extract/css']));
  add('UnoCSS', Boolean(dependencies.unocss));
  add('Plain CSS', fileNames.some((name) => /\.css$/.test(name)));
  return systems;
}

function detectLibraries(dependencies) {
  const libraries = [
    ['shadcn/ui conventions', dependencies['class-variance-authority'] && dependencies['@radix-ui/react-slot']],
    ['Radix UI', Object.keys(dependencies).some((name) => name.startsWith('@radix-ui/'))],
    ['Material UI', dependencies['@mui/material']],
    ['Ant Design', dependencies.antd],
    ['Chakra UI', dependencies['@chakra-ui/react']],
    ['Headless UI', dependencies['@headlessui/react'] || dependencies['@headlessui/vue']],
    ['Mantine', dependencies['@mantine/core']],
    ['PrimeReact', dependencies.primereact],
    ['Lucide', dependencies['lucide-react'] || dependencies['lucide-vue-next'] || dependencies.lucide],
    ['Heroicons', dependencies['@heroicons/react'] || dependencies['@heroicons/vue']],
    ['Motion', dependencies.motion || dependencies['framer-motion']],
    ['GSAP', dependencies.gsap]
  ];
  return libraries.filter(([, present]) => Boolean(present)).map(([name]) => name);
}

function collectMatches(text, regex, map, normalize = (value) => value.trim()) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const value = normalize(match[1] ?? match[0]);
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
}

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root);
const packageJson = await readJson(path.join(root, 'package.json'));
const scan = await walkTextFiles(root, { maxFiles: args.maxFiles });
const dependencies = dependencyMap(packageJson);
const extensionCounts = new Map();
const colors = new Map();
const fonts = new Map();
const customProperties = new Map();
const radii = new Map();
const shadows = new Map();
const contents = [];
let gradientCount = 0;
let importantCount = 0;
let styleFileCount = 0;
let componentFileCount = 0;

for (const file of scan.files) {
  const extension = path.extname(file.relative).toLowerCase();
  extensionCounts.set(extension || '(none)', (extensionCounts.get(extension || '(none)') ?? 0) + 1);
  if (/\.(css|scss|sass|less)$/.test(extension)) styleFileCount += 1;
  if (/\.(jsx|tsx|vue|svelte|astro)$/.test(extension)) componentFileCount += 1;
  const text = await readUtf8(file.absolute);
  if (text === null) continue;
  contents.push(text);
  gradientCount += (text.match(/(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/gi) ?? []).length;
  importantCount += (text.match(/!important\b/g) ?? []).length;
  collectMatches(text, /(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|(?:rgb|hsl|oklch|oklab|lab|lch|color-mix)\([^\n;}{]{1,160}\))/gi, colors, (value) => value.toLowerCase().replace(/\s+/g, ' '));
  collectMatches(text, /font-family\s*:\s*([^;}{\n]+)/gi, fonts, (value) => value.replace(/\s+/g, ' ').trim());
  collectMatches(text, /(--[a-z0-9_-]+)\s*:/gi, customProperties, (value) => value.toLowerCase());
  collectMatches(text, /border-radius\s*:\s*([^;}{\n]+)/gi, radii, (value) => value.replace(/\s+/g, ' ').trim());
  collectMatches(text, /box-shadow\s*:\s*([^;}{\n]+)/gi, shadows, (value) => value.replace(/\s+/g, ' ').trim());
}

const fileNames = scan.files.map((file) => file.relative);
const routeCandidates = fileNames.filter((name) => /(^|\/)(app|pages|routes|views)\/.+\.(jsx|tsx|js|ts|vue|svelte|astro)$/.test(name)).slice(0, 40);
const entryCandidates = fileNames.filter((name) => /(^|\/)(app|main|index|layout|page)\.(jsx|tsx|js|ts|vue|svelte|astro|html)$/.test(name)).slice(0, 30);
const projectSignals = [];
if (fileNames.some((name) => /dashboard|admin|settings|editor|console/i.test(name))) projectSignals.push('operational-product');
if (fileNames.some((name) => /landing|marketing|homepage|pricing|portfolio/i.test(name))) projectSignals.push('brand-or-marketing');
if (fileNames.some((name) => /docs|article|blog|content/i.test(name))) projectSignals.push('editorial-or-content');
if (fileNames.some((name) => /checkout|cart|booking|account|profile/i.test(name))) projectSignals.push('consumer-workflow');

const output = {
  projectRoot: root,
  generatedAt: new Date().toISOString(),
  scan: {
    files: scan.files.length,
    styleFiles: styleFileCount,
    componentFiles: componentFileCount,
    truncated: scan.truncated,
    skippedLarge: scan.skippedLarge.slice(0, 20),
    extensions: topCounts(extensionCounts, 20)
  },
  project: {
    name: packageJson?.name ?? path.basename(root),
    packageManager: packageJson?.packageManager ?? null,
    frameworks: detectFrameworks(dependencies, fileNames),
    styling: detectStyling(dependencies, fileNames, contents),
    libraries: detectLibraries(dependencies),
    scripts: packageJson?.scripts ?? {},
    signals: projectSignals,
    routeCandidates,
    entryCandidates
  },
  designFingerprint: {
    cssCustomPropertyCount: customProperties.size,
    topCustomProperties: topCounts(customProperties, 30),
    uniqueColorExpressions: colors.size,
    topColors: topCounts(colors, 24),
    fontFamilies: topCounts(fonts, 16),
    gradients: gradientCount,
    radii: topCounts(radii, 16),
    shadows: topCounts(shadows, 16),
    importantDeclarations: importantCount
  },
  notes: [
    'Signals are repository evidence, not a final design classification.',
    'Rendered contrast, transparency, font loading, and responsive behavior require browser verification.'
  ]
};

process.stdout.write(`${JSON.stringify(output, null, args.compact ? 0 : 2)}\n`);

