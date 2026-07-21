#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { colorFamily, parseHexColor } from '../lib/color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(here, '..');
const fixturesDir = path.join(here, 'fixtures');

function runNode(args) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function inspect(name) {
  return JSON.parse(runNode([path.join(scriptsDir, 'inspect-project.mjs'), path.join(fixturesDir, name), '--compact']));
}

function audit(name) {
  return JSON.parse(runNode([path.join(scriptsDir, 'audit-ui.mjs'), path.join(fixturesDir, name), '--format', 'json']));
}

function finding(report, ruleId) {
  return report.findings.find((item) => item.ruleId === ruleId);
}

function assertAuditContract(report) {
  const fixability = new Set(['safe-auto', 'needs-review', 'direction-required']);
  assert(report.findings.every((item) => fixability.has(item.fixability)));
  assert.equal(Object.values(report.summary.bySeverity).reduce((sum, value) => sum + value, 0), report.summary.total);
  assert.equal(Object.values(report.summary.byEvidenceClass).reduce((sum, value) => sum + value, 0), report.summary.total);
  assert.equal(Object.values(report.summary.byFixability).reduce((sum, value) => sum + value, 0), report.summary.total);
}

assert.equal(colorFamily(parseHexColor('#020202')), 'near-black');
assert.equal(colorFamily(parseHexColor('#f8fafc')), 'near-white');
assert.equal(colorFamily(parseHexColor('#2563eb')), 'blue');

const htmlInspection = inspect('html');
assert.deepEqual(htmlInspection.project.frameworks, []);
assert(htmlInspection.project.styling.includes('Plain CSS'));
assert(htmlInspection.designFingerprint.gradients >= 1);

const htmlAudit = audit('html');
assertAuditContract(htmlAudit);
for (const ruleId of [
  'zoom-disabled',
  'transition-all',
  'gradient-text',
  'icon-button-name',
  'image-missing-alt',
  'image-unstable-size',
  'static-low-contrast',
  'missing-reduced-motion',
  'viewport-min-width-lock',
  'body-overflow-hidden'
]) assert(finding(htmlAudit, ruleId), `Expected ${ruleId} in HTML fixture`);
assert.equal(finding(htmlAudit, 'zoom-disabled').fixability, 'safe-auto');
assert.equal(finding(htmlAudit, 'gradient-text').fixability, 'needs-review');

const vueInspection = inspect('vue');
assert(vueInspection.project.frameworks.includes('Vue'));
assert(vueInspection.project.libraries.includes('Lucide'));

const vueAudit = audit('vue');
assertAuditContract(vueAudit);
assert.equal(finding(vueAudit, 'media-query-late-override')?.fixability, 'needs-review');
assert.equal(finding(vueAudit, 'dialog-keyboard-contract')?.fixability, 'needs-review');
assert.equal(finding(vueAudit, 'compact-control-target')?.fixability, 'needs-review');
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.mobile-only')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.important-mobile')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.scoped-only')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.font-split')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.padding-split')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.grid-split')));
assert(vueAudit.findings.some((item) => item.ruleId === 'media-query-late-override' && item.message.includes('.shorthand-grid')));
assert(!vueAudit.findings.some((item) => item.ruleId === 'compact-control-target' && item.message.includes('.action-table-head')));

const reactInspection = inspect('react-tailwind');
assert(reactInspection.project.frameworks.includes('React'));
assert(reactInspection.project.styling.includes('Tailwind CSS'));
assert(reactInspection.project.libraries.includes('Lucide'));
assert(reactInspection.designFingerprint.tokenCoverage.definitions >= 6);
assert(reactInspection.designFingerprint.tokenCoverage.references >= 2);
assert(reactInspection.designFingerprint.tokenCoverage.rawColorOccurrences >= 6);
assert(reactInspection.designFingerprint.topColors.some((item) => item.value === 'rgb(255 237 213)'));
assert(reactInspection.designFingerprint.tokenCoverage.variableShare > 0);
assert(reactInspection.designFingerprint.colorFamilies.some((item) => item.value === 'blue'));
const semanticRoles = new Set(reactInspection.designFingerprint.semanticTokenRoles.map((item) => item.value));
for (const role of ['canvas', 'surface', 'text', 'secondary-text', 'action-or-brand', 'danger']) {
  assert(semanticRoles.has(role), `Expected semantic token role ${role}`);
}

const reactAudit = audit('react-tailwind');
assertAuditContract(reactAudit);
assert(finding(reactAudit, 'icon-button-name'));
assert(finding(reactAudit, 'div-click-control'));

runNode(['--check', path.join(scriptsDir, 'runtime-audit.js')]);
process.stdout.write('All Max-UI script tests passed.\n');
