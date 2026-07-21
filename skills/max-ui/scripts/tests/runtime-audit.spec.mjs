import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimeSource = await fs.readFile(path.resolve(here, '..', 'runtime-audit.js'), 'utf8');

async function audit(page, html) {
  await page.setContent(html);
  await page.waitForLoadState('load');
  return page.evaluate(runtimeSource);
}

function hasFinding(report, ruleId, selector) {
  return report.findings.some((finding) => finding.ruleId === ruleId && (!selector || finding.selector === selector));
}

test('ignores screen-reader-only and ancestor-hidden content', async ({ page }) => {
  const report = await audit(page, `
    <style>
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .hidden-parent { opacity: 0; }
    </style>
    <span id="sr-label" class="sr-only">Delete item</span>
    <div class="hidden-parent"><button id="hidden-target" style="width:10px;height:10px">Hidden</button></div>
  `);

  expect(hasFinding(report, 'runtime-clipped-text', '#sr-label')).toBe(false);
  expect(hasFinding(report, 'runtime-tiny-text', '#sr-label')).toBe(false);
  expect(hasFinding(report, 'runtime-undersized-target', '#hidden-target')).toBe(false);
});

test('does not count aria-hidden icon text as an accessible name', async ({ page }) => {
  const report = await audit(page, `
    <style>.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }</style>
    <button id="bad"><svg aria-hidden="true"><title>Delete</title></svg></button>
    <button id="good" aria-label="Delete"><svg aria-hidden="true"></svg></button>
    <button id="sr-named"><span class="sr-only">Delete</span><svg aria-hidden="true"></svg></button>
    <button id="hidden-name"><span hidden>Delete</span><svg aria-hidden="true"></svg></button>
    <button id="display-none-name"><span style="display:none">Delete</span><svg aria-hidden="true"></svg></button>
  `);

  expect(hasFinding(report, 'runtime-icon-control-name', '#bad')).toBe(true);
  expect(hasFinding(report, 'runtime-icon-control-name', '#good')).toBe(false);
  expect(hasFinding(report, 'runtime-icon-control-name', '#sr-named')).toBe(false);
  expect(hasFinding(report, 'runtime-icon-control-name', '#hidden-name')).toBe(true);
  expect(hasFinding(report, 'runtime-icon-control-name', '#display-none-name')).toBe(true);
});

test('exempts inline text links and classifies compact controls as strong signals', async ({ page }) => {
  const report = await audit(page, `
    <p>Read the <a id="inline-link" href="#details">details</a> before continuing.</p>
    <button id="small-button" style="width:20px;height:20px" aria-label="Close">x</button>
  `);
  const smallButton = report.findings.find((finding) => finding.ruleId === 'runtime-undersized-target' && finding.selector === '#small-button');

  expect(hasFinding(report, 'runtime-undersized-target', '#inline-link')).toBe(false);
  expect(smallButton?.evidenceClass).toBe('strong-signal');
});

test('measures overflow, clipping, contrast, duplicate IDs, and broken images', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const report = await audit(page, `
    <style>
      body { min-width: 1024px; }
      #clip { width: 40px; white-space: nowrap; overflow: hidden; }
      #contrast { color: #777; background-color: #888; }
    </style>
    <div id="clip">A deliberately clipped sentence</div>
    <div id="contrast">Low contrast</div>
    <span id="duplicate">One</span><span id="duplicate">Two</span>
    <img id="broken" src="/missing-runtime-audit-image.png" alt="Missing fixture">
  `);
  await page.waitForFunction(() => document.querySelector('#broken').complete);
  const refreshed = await page.evaluate(runtimeSource);

  expect(hasFinding(refreshed, 'runtime-horizontal-overflow', 'html')).toBe(true);
  expect(hasFinding(refreshed, 'runtime-clipped-text', '#clip')).toBe(true);
  expect(hasFinding(refreshed, 'runtime-low-contrast', '#contrast')).toBe(true);
  expect(hasFinding(refreshed, 'runtime-duplicate-id', '#duplicate')).toBe(true);
  expect(hasFinding(refreshed, 'runtime-broken-image', '#broken')).toBe(true);
  expect(report.summary.byFixability).toHaveProperty('direction-required');
});
