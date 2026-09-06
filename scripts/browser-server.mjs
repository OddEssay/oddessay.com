import { dev } from 'astro';
import { realpath } from 'node:fs/promises';

// Keep the test server in the foreground even in agent environments.
const root = process.env.RESTAURANT_TEST_ROOT;
if (!root) throw new Error('Start browser tests with pnpm test:browser to isolate the content cache.');
const dependencies = await realpath(`${root}/node_modules`);
const server = await dev({
  root,
  cacheDir: `${root}/.cache/astro`,
  vite: { cacheDir: `${root}/.cache/vite`, server: { fs: { allow: [root, dependencies] } } },
  server: { host: '127.0.0.1', port: 4322 },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await server.stop();
  process.exit(0);
});
