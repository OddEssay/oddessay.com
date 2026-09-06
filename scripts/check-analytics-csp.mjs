import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Test URL forms independently of Cloudflare's current release and network.
// Mock reporting so tests never submit analytics.
export async function checkAnalyticsCsp(page) {
  const base = 'https://static.cloudflareinsights.com/beacon.min.js';
  const urls = [base, `${base}/v31edd6df95cf4e85bb4c19e7a9bdbcba1788362987495`, `${base}/vfuture-release`];
  let beacons = 0;
  await page.route('**/cdn-cgi/rum', route => {
    beacons++;
    return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
  });
  for (const url of urls) {
    await page.route(url, route => route.fulfill({ contentType: 'text/javascript', body: "window.analyticsProbe = Promise.all([fetch('/cdn-cgi/rum', {method:'POST'}), fetch('https://cloudflareinsights.com/cdn-cgi/rum', {method:'POST'})]);" }));
    await page.addScriptTag({ url });
    await page.evaluate(() => window.analyticsProbe);
    await page.unroute(url);
  }
  assert.equal(beacons, urls.length * 2);
  await page.unroute('**/cdn-cgi/rum');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const headers = await readFile(new URL('../dist/_headers', import.meta.url), 'utf8');
  const policy = headers.match(/^\s+Content-Security-Policy: (.+)$/m)?.[1];
  assert.ok(policy, 'Build the site first');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('http://analytics.test/', route => route.fulfill({
      contentType: 'text/html', headers: { 'content-security-policy': policy }, body: '<!doctype html><title>Analytics CSP regression</title>',
    }));
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    await page.goto('http://analytics.test/');
    await checkAnalyticsCsp(page);
    page.removeAllListeners('console');
    for (const url of ['https://static.cloudflareinsights.com/unrelated.js', 'https://static.cloudflareinsights.com/beacon.min.js-unrelated']) {
      await page.route(url, route => route.fulfill({ contentType: 'text/javascript', body: 'window.unrelatedScriptRan = true;' }));
      await assert.rejects(page.addScriptTag({ url }), /Content Security Policy/);
    }
    assert.equal(await page.evaluate(() => window.unrelatedScriptRan), undefined);
    console.log('Analytics CSP passed: unversioned, live versioned, and future versioned beacons; both reporting endpoints; unrelated paths remain blocked.');
  } finally { await browser.close(); }
}
