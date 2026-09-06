import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Keep audit tooling separate from the site's pinned dependencies.
const tooling = resolve(process.env.LIGHTHOUSE_DIR ?? '/tmp/oddessay-audit');
const { default: lighthouse } = await import(pathToFileURL(`${tooling}/node_modules/lighthouse/core/index.js`));
const { launch } = await import(pathToFileURL(`${tooling}/node_modules/chrome-launcher/dist/index.js`));
const url = process.argv[2];
const output = resolve(process.argv[3] ?? '/tmp/oddessay-lighthouse');
if (!url) throw new Error('Usage: node scripts/measure-lighthouse.mjs URL OUTPUT_DIRECTORY');
await mkdir(output, { recursive: true });
const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless', '--no-sandbox'] });
try {
  for (let run = 1; run <= 3; run++) {
    const { lhr } = await lighthouse(url, { port: chrome.port, onlyCategories: ['performance'], output: 'json' }, {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
        throttlingMethod: 'simulate',
      },
    });
    await writeFile(`${output}/${run}.json`, JSON.stringify(lhr, null, 2));
    console.log(run, lhr.categories.performance.score, Object.fromEntries(
      ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'total-byte-weight']
        .map(key => [key, lhr.audits[key].numericValue]),
    ));
  }
} finally { await chrome.kill(); }
