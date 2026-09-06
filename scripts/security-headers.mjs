import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function writeSecurityHeaders(directory) {
  const pages = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith('.html')) pages.push(path);
    }
  }
  await visit(directory);
  const directives = new Map();
  const rewritten = [];
  for (const path of pages) {
    const html = await readFile(path, 'utf8');
    const meta = /<meta\s+http-equiv="content-security-policy"\s+content="([^"]*)"\s*\/?\s*>/gi;
    const policies = [...html.matchAll(meta)];
    if (policies.length !== 1) throw new Error(`Expected one Astro CSP in ${path}`);
    for (const directive of policies[0][1].split(';')) {
      const [name, ...sources] = directive.trim().split(/\s+/);
      if (!name) continue;
      const values = directives.get(name) ?? new Set();
      for (const source of sources) values.add(source);
      directives.set(name, values);
    }
    // The response header is authoritative. Keeping a second meta policy would
    // block BlackChalk's inline styles even when the header allows them.
    rewritten.push([path, html.replace(meta, '')]);
  }
  if (!pages.length || !directives.has('script-src')) throw new Error('Missing generated CSP');
  for (const name of [...directives.keys()]) if (name.startsWith('style-src')) directives.delete(name);
  directives.set('style-src', new Set(["'self'", "'unsafe-inline'"]));
  directives.set('frame-ancestors', new Set(["'self'"]));
  const policy = [...directives].map(([name, values]) => `${name} ${[...values].sort().join(' ')}`).join('; ');
  const headers = `/*\n  Content-Security-Policy: ${policy}\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cross-Origin-Opener-Policy: same-origin\n  Strict-Transport-Security: max-age=86400\n`;
  // Cloudflare counts the indentation, name and value toward 2,000 chars/line.
  if (headers.split('\n').some(line => line.length > 2000)) throw new Error('Cloudflare _headers line exceeds 2,000 characters');
  await writeFile(join(directory, '_headers'), headers);
  for (const [path, html] of rewritten) await writeFile(path, html);
  console.log(`Security headers: ${pages.length} pages, ${policy.length} CSP characters.`);
}

export default function securityHeaders() {
  return { name: 'security-headers', hooks: {
    'astro:build:done': async ({ dir }) => writeSecurityHeaders(fileURLToPath(dir)),
  } };
}
