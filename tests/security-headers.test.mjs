import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeSecurityHeaders } from '../scripts/security-headers.mjs';

test('response CSP authorizes every generated inline script and stays within Cloudflare limits', () => {
  const headers = readFileSync('dist/_headers', 'utf8');
  assert.ok(headers.split('\n').every(line => line.length <= 2000));
  assert.match(headers, /frame-ancestors 'self'/);
  assert.match(headers, /Strict-Transport-Security: max-age=86400\n/);
  assert.doesNotMatch(headers, /unsafe-eval|includeSubDomains|preload/);
  const scriptPolicy = headers.match(/script-src ([^;]+)/)[1];
  assert.doesNotMatch(scriptPolicy, /unsafe-inline/);
  for (const file of readdirSync('dist', { recursive: true }).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(join('dist', file), 'utf8');
    assert.doesNotMatch(html, /http-equiv="content-security-policy"/);
    for (const [, attrs, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/\bsrc=/.test(attrs) || !content) continue;
      const hash = createHash('sha256').update(content).digest('base64');
      assert.ok(scriptPolicy.includes(`'sha256-${hash}'`), `${file}: unapproved inline script`);
    }
  }
});

test('header generation fails closed for missing policies and oversized merged policies', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'oddessay-csp-'));
  try {
    await writeFile(join(dir, 'index.html'), '<html></html>');
    await assert.rejects(writeSecurityHeaders(dir), /Expected one Astro CSP/);
    await writeFile(join(dir, 'index.html'), `<meta http-equiv="content-security-policy" content="script-src 'self' ${Array.from({ length: 40 }, (_, i) => `'sha256-${String(i).padStart(44, 'a')}'`).join(' ')}">`);
    await assert.rejects(writeSecurityHeaders(dir), /exceeds 2,000/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
