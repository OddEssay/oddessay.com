import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Run against `pnpm preview:cloudflare` after building. No analytics is sent.
const origin = process.env.AUDIT_ORIGIN ?? 'http://127.0.0.1:8787';
const output = process.env.AUDIT_OUTPUT ?? '/tmp/oddessay-production-check';
await mkdir(output, { recursive: true });
// Capture fallback text while the deliberately delayed font is still pending.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const browser = await chromium.launch();
const report = { fonts: [], images: [] };
async function check() {
try {
  for (const width of [390, 1440]) {
    for (const failure of [false, true]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: width === 390 ? 3 : 1 });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.shifts = [];
        new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.shifts.push(e.value); }).observe({ type: 'layout-shift', buffered: true });
      });
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/*.woff2', async route => { await gate; if (failure) await route.abort(); else await route.continue(); });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${output}/font-${width}-fallback.png` });
      release();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const cls = await page.evaluate(() => window.shifts.reduce((sum, n) => sum + n, 0));
      report.fonts.push({ width, failure, cls });
      assert.ok(cls < Number(process.env.AUDIT_MAX_CLS ?? 0.1), `CLS ${cls} at ${width}px (failure=${failure})`);
      await page.screenshot({ path: `${output}/font-${width}-${failure ? 'failed' : 'loaded'}.png` });
      await context.close();
    }
  }
  if (process.argv.includes('--fonts-only')) {
    await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.fonts));
    return;
  }
  for (const width of [390, 650, 900, 1440]) {
    for (const dpr of [1, 2, 3]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: dpr });
      const page = await context.newPage();
      const violations = [];
      await page.exposeFunction('recordViolation', v => violations.push(v));
      await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => window.recordViolation({ directive: e.effectiveDirective, blocked: e.blockedURI })));
      const photos = [];
      page.on('request', r => { if (/\/_astro\/photo\./.test(r.url())) photos.push(r.url()); });
      for (const path of ['/', '/restaurants/place/bistro-lao']) {
        await page.goto(origin + path);
        const root = page.locator('restaurant-image').first();
        await root.scrollIntoViewIfNeeded();
        await expect(root.locator('[data-illustration]')).toBeVisible();
        await page.waitForTimeout(200);
        assert.equal(photos.length, 0, 'Photo requested before interaction');
        const selected = await root.locator('[data-illustration]').evaluate(img => ({ currentSrc: img.currentSrc, width: img.getBoundingClientRect().width, naturalWidth: img.naturalWidth, complete: img.complete }));
        assert.ok(selected.complete);
        assert.ok(selected.currentSrc.endsWith('.avif'));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        report.images.push({ viewportWidth: width, dpr, path, ...selected });
        if (dpr === 2) await page.screenshot({ path: `${output}/image-${width}-${path === '/' ? 'card' : 'detail'}.png`, fullPage: true });
        await root.getByRole('button').click();
        await expect(root).toHaveAttribute('data-photo-visible', 'true');
        assert.ok(photos.length > 0);
        assert.ok((await root.locator('[data-photo]').evaluate(img => img.currentSrc)).endsWith('.avif'));
        if (dpr === 2) await page.screenshot({ path: `${output}/photo-${width}-${path === '/' ? 'card' : 'detail'}.png`, fullPage: true });
        photos.length = 0;
      }
      assert.deepEqual(violations, []);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const violations = [], errors = [];
  await page.exposeFunction('recordViolation', v => violations.push(v));
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => window.recordViolation(e.effectiveDirective)));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  const root = page.locator('restaurant-image').first(), frame = root.locator('.restaurant-image-frame');
  await expect(page.locator('.restaurant-card svg path').first()).toBeAttached();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/_astro/photo.*', async route => { await gate; await route.continue(); });
  await frame.hover();
  await expect(root).toHaveAttribute('data-photo-state', 'loading');
  await expect(root).toHaveAttribute('data-photo-visible', 'false');
  await page.mouse.move(0, 0);
  release();
  await expect(root).toHaveAttribute('data-photo-state', 'ready');
  await expect(root).toHaveAttribute('data-photo-visible', 'false');
  await root.getByRole('button').click();
  await expect(root).toHaveAttribute('data-photo-visible', 'true');
  await expect(root.getByRole('img')).toHaveCount(1);
  await expect(page.locator('restaurant-image').nth(1)).toHaveAttribute('data-photo-state', 'idle');
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(page.locator('.restaurant-card svg path').first()).toBeAttached();
  await page.unroute('**/_astro/photo.*');
  await page.reload();
  await page.route('**/_astro/photo.*', route => route.abort());
  await root.getByRole('button').focus();
  await expect(root).toHaveAttribute('data-photo-state', 'error');
  await expect(root.getByRole('status')).toContainText('Activate the caption to retry');
  await expect(root).toHaveAttribute('data-photo-visible', 'false');
  await page.unroute('**/_astro/photo.*');
  await root.getByRole('button').press('Enter');
  await expect(root).toHaveAttribute('data-photo-visible', 'true');
  // Exercise the analytics script allowlist and both reporting paths without
  // a real beacon token or sending traffic to the analytics service.
  await page.route('https://static.cloudflareinsights.com/beacon.min.js', route => route.fulfill({ contentType: 'text/javascript', body: "window.analyticsProbe = Promise.all([fetch('/cdn-cgi/rum', {method:'POST'}), fetch('https://cloudflareinsights.com/cdn-cgi/rum', {method:'POST'})]);" }));
  let beacons = 0;
  await page.route('**/cdn-cgi/rum', route => { beacons++; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); });
  await page.addScriptTag({ url: 'https://static.cloudflareinsights.com/beacon.min.js' });
  await page.evaluate(() => window.analyticsProbe);
  assert.equal(beacons, 2);
  for (const path of ['/projects', '/essays', '/essays/2026-09-06-first-post', '/restaurants', '/restaurants/place/hawksmoor', '/missing-page']) {
    const response = await page.goto(origin + path);
    assert.ok(response.headers()['content-security-policy']);
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  }
  assert.deepEqual(violations, []);
  assert.deepEqual(errors, []);
  await context.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.fonts));
  console.log('Production browser checks passed: CSP, hydration, resize, deferred photos, cancellation, retry, analytics allowlist and responsive selection.');
} finally { await browser.close(); }

}
await check();
