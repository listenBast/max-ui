#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(here, '..');
const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'max-ui-'));

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

try {
  await fs.mkdir(path.join(fixture, 'src'), { recursive: true });
  await fs.writeFile(path.join(fixture, 'package.json'), JSON.stringify({
    name: 'fixture-ui',
    scripts: { build: 'vite build' },
    dependencies: { react: '^18.0.0', tailwindcss: '^3.0.0', 'lucide-react': '^0.1.0' }
  }, null, 2));
  await fs.writeFile(path.join(fixture, 'src', 'styles.css'), `
body { color: #777777; background-color: #888888; }
html, body { min-width: 1024px; overflow: hidden; }
.hero-title { background: linear-gradient(90deg, #7c3aed, #06b6d4); background-clip: text; color: transparent; }
.card { border: 1px solid #dddddd; border-radius: 32px; box-shadow: 0 10px 30px #00000022; transition: all 200ms ease; }
@keyframes rise { from { opacity: 0; } to { opacity: 1; } }
`);
  await fs.writeFile(path.join(fixture, 'src', 'App.jsx'), `
export function App() {
  return <main><div onClick={() => {}}>Open</div><button><SearchIcon /></button><img src="/demo.png" /></main>;
}
`);

  const inspection = JSON.parse(run('inspect-project.mjs', [fixture, '--compact']));
  assert(inspection.project.frameworks.includes('React'));
  assert(inspection.project.styling.includes('Tailwind CSS'));
  assert(inspection.designFingerprint.gradients >= 1);

  const audit = JSON.parse(run('audit-ui.mjs', [fixture, '--format', 'json']));
  const rules = new Set(audit.findings.map((finding) => finding.ruleId));
  assert(rules.has('transition-all'));
  assert(rules.has('gradient-text'));
  assert(rules.has('div-click-control'));
  assert(rules.has('icon-button-name'));
  assert(rules.has('image-missing-alt'));
  assert(rules.has('static-low-contrast'));
  assert(rules.has('missing-reduced-motion'));
  assert(rules.has('viewport-min-width-lock'));
  assert(rules.has('body-overflow-hidden'));

  process.stdout.write('All Max-UI script tests passed.\n');
} finally {
  await fs.rm(fixture, { recursive: true, force: true });
}
