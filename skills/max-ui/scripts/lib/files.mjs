import fs from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_IGNORES = new Set([
  '.git', '.next', '.nuxt', '.output', '.svelte-kit', '.turbo', '.vercel',
  'build', 'coverage', 'dist', 'node_modules', 'out', 'public/build',
  'storybook-static', 'target', 'vendor'
]);

export const DEFAULT_TEXT_EXTENSIONS = new Set([
  '.astro', '.css', '.htm', '.html', '.js', '.jsx', '.less', '.mdx', '.mjs',
  '.scss', '.svelte', '.ts', '.tsx', '.vue'
]);

function isIgnored(relativePath, extraIgnores) {
  const normalized = relativePath.split(path.sep).join('/');
  const segments = normalized.split('/');
  if (segments.some((segment) => DEFAULT_IGNORES.has(segment))) return true;
  if (normalized.endsWith('.min.css') || normalized.endsWith('.min.js')) return true;
  if (/\.(map|lock)$/i.test(normalized)) return true;
  if (/(^|\/)\.env(?:\.|$)/i.test(normalized)) return true;
  return extraIgnores.some((entry) => normalized === entry || normalized.startsWith(`${entry}/`));
}

export async function walkTextFiles(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const extensions = options.extensions ?? DEFAULT_TEXT_EXTENSIONS;
  const maxFiles = options.maxFiles ?? 2500;
  const maxBytes = options.maxBytes ?? 512 * 1024;
  const extraIgnores = (options.extraIgnores ?? []).map((entry) => entry.split('\\').join('/').replace(/^\.\//, ''));
  const files = [];
  const skippedLarge = [];
  const stack = [absoluteRoot];
  let truncated = false;

  while (stack.length > 0) {
    const directory = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(absoluteRoot, absolute);
      if (!relative || isIgnored(relative, extraIgnores)) continue;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile() || !extensions.has(path.extname(entry.name).toLowerCase())) continue;

      let stat;
      try {
        stat = await fs.stat(absolute);
      } catch {
        continue;
      }
      if (stat.size > maxBytes) {
        skippedLarge.push(relative.split(path.sep).join('/'));
        continue;
      }
      files.push({ absolute, relative: relative.split(path.sep).join('/'), size: stat.size });
      if (files.length >= maxFiles) {
        truncated = true;
        stack.length = 0;
        break;
      }
    }
  }

  files.sort((a, b) => a.relative.localeCompare(b.relative));
  return { root: absoluteRoot, files, skippedLarge, truncated };
}

export async function readUtf8(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function readJson(filePath) {
  const text = await readUtf8(filePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function lineNumberAt(text, index) {
  if (index <= 0) return 1;
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

export function lineSnippetAt(text, index, maxLength = 220) {
  const start = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const endIndex = text.indexOf('\n', index);
  const end = endIndex === -1 ? text.length : endIndex;
  const line = text.slice(start, end).trim().replace(/\s+/g, ' ');
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}...` : line;
}

export function topCounts(map, limit = 20) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

