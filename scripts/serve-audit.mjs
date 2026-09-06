import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

// A fixed gzip transport for comparing preserved static builds on localhost.
// Use Wrangler, not this harness, to verify Cloudflare routing and headers.
const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4325);
createServer((request, response) => {
  let path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') path = '/index.html';
  else if (!path.split('/').pop().includes('.')) path += '.html';
  let file = resolve(root, `.${path}`);
  if (!file.startsWith(root + sep)) { response.writeHead(400).end(); return; }
  let status = 200;
  if (!existsSync(file)) { file = `${root}/404.html`; status = 404; }
  const type = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2', webp: 'image/webp', avif: 'image/avif' }[file.split('.').pop()] ?? 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Content-Encoding': 'gzip' };
  if (existsSync(`${root}/_headers`)) {
    for (const line of readFileSync(`${root}/_headers`, 'utf8').split('\n').slice(1)) {
      const match = line.match(/^\s+([^:]+): (.+)$/);
      if (match) headers[match[1]] = match[2];
    }
  }
  response.writeHead(status, headers);
  response.end(gzipSync(readFileSync(file)));
}).listen(port, '127.0.0.1');
