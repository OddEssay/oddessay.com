import { copyFile, cp, mkdtemp, realpath, rm, mkdir, symlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exclusive creation prevents overwriting an author-owned page.
import { constants } from 'node:fs';
const project = fileURLToPath(new URL('../', import.meta.url));
// Each server owns its content store, fixtures and Vite cache, including during live authoring tests.
const root = await realpath(await mkdtemp(join(tmpdir(), 'oddessay-browser-')));
try {
  await cp(join(project, 'src'), join(root, 'src'), { recursive: true });
  for (const file of ['package.json', 'astro.config.mjs', 'tsconfig.json']) await copyFile(join(project, file), join(root, file));
  await symlink(join(project, 'node_modules'), join(root, 'node_modules'), 'dir');
  await cp(join(project, 'tests/fixtures'), join(root, 'tests/fixtures'), { recursive: true });
  await mkdir(join(root, 'src/pages/test-fixture'), { recursive: true });
  await copyFile(join(project, 'tests/fixtures/image-page.astro.txt'), join(root, 'src/pages/test-fixture/image.astro'), constants.COPYFILE_EXCL);
  // Astro's glob loader only installs watchers when the collection starts nonempty.
  await copyFile(join(project, 'tests/fixtures/essay.md.txt'), join(root, 'src/content/essays/authoring-essay-fixture.md'), constants.COPYFILE_EXCL);
  const child = spawn('pnpm', ['exec', 'playwright', 'test'], { stdio: 'inherit', env: { ...process.env, RESTAURANT_TEST_ROOT: root } });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  process.exitCode = await new Promise(resolve => child.on('exit', code => resolve(code ?? 1)));
} finally {
  await rm(root, { recursive: true, force: true });
}
