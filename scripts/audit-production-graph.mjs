import { build } from 'astro';
import { writeFile, realpath } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

// Optional root permits a preserved checkout to be audited with the same tool.
const root = await realpath(resolve(process.argv[2] ?? '.'));
const outDir = resolve(process.argv[3] ?? '/tmp/oddessay-graph-build');
const chunks = [];
await build({ root, outDir, vite: { plugins: [{
  name: 'audit-production-graph',
  generateBundle(_options, bundle) {
    for (const entry of Object.values(bundle)) {
      if (entry.type !== 'chunk') continue;
      chunks.push({ file: entry.fileName, bytes: Buffer.byteLength(entry.code), gzipBytes: gzipSync(entry.code).length,
        imports: entry.imports, dynamicImports: entry.dynamicImports,
        modules: Object.entries(entry.modules).filter(([, value]) => value.renderedLength > 0).map(([id, value]) => ({ id: id.replace(root, '<root>'), renderedLength: value.renderedLength, renderedExports: value.renderedExports })),
      });
    }
  },
}] } });
// SSR chunks are intermediate build products. Keep only emitted browser files.
const { readdir } = await import('node:fs/promises');
const emitted = new Set(await readdir(outDir, { recursive: true }));
const graph = chunks.filter(chunk => emitted.has(chunk.file));
await writeFile(`${outDir}/js-graph.json`, JSON.stringify(graph, null, 2));
console.log(`Browser graph: ${graph.length} chunks; ${graph.reduce((sum, c) => sum + c.bytes, 0)} bytes; ${graph.reduce((sum, c) => sum + c.gzipBytes, 0)} gzip bytes.`);
