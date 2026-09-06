import { test, expect } from '@playwright/test';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Content mutations share one dev server and must not overlap HMR updates.
test.describe.configure({ mode: 'serial' });

test('Markdown additions, edits and removal update restaurants and new tag routes without a restart', async ({ request }) => {
  const slug = 'authoring-discovery-fixture';
  const root = process.env.RESTAURANT_TEST_ROOT;
  if (!root) throw new Error('Run using pnpm test:browser.');
  const file = join(root, 'src/content/restaurants', `${slug}.md`);
  const source = (summary) => `---
title: Authoring discovery fixture
summary: ${summary}
image: ../../assets/restaurants/garden-table.png
imageAlt: Fictional illustration used to test content discovery
city: Test City
citySlug: test-city
tags: [new-authoring-tag]
---

## Visit notes

Temporary content discovery test.
`;
  await writeFile(file, source('First saved summary'), { flag: 'wx' });
  try {
    await expect.poll(async () => (await request.get(`/restaurants/place/${slug}`)).text()).toContain('First saved summary');
    await expect.poll(async () => (await request.get('/restaurants')).text()).toContain(`/restaurants/place/${slug}`);
    await expect.poll(async () => (await request.get('/restaurants/test-city/new-authoring-tag')).text()).toContain('New Authoring Tag');
    await writeFile(file, source('Updated summary after saving Markdown'));
    await expect.poll(async () => (await request.get(`/restaurants/place/${slug}`)).text()).toContain('Updated summary after saving Markdown');
  } finally {
    await unlink(file);
  }
  await expect.poll(async () => (await request.get(`/restaurants/place/${slug}`)).status()).toBe(404);
  await expect.poll(async () => (await request.get('/restaurants/test-city/new-authoring-tag')).status()).toBe(404);
});

test('empty essays and a temporary authored essay render without a demo field', async ({ request }) => {
  const root = process.env.RESTAURANT_TEST_ROOT;
  if (!root) throw new Error('Run using pnpm test:browser.');
  for (const route of ['/restaurants/place/garden-table', '/restaurants/place/little-plates', '/essays/a-place-to-keep-things', '/restaurants/london']) {
    expect((await request.get(route)).status()).toBe(404);
  }
  const file = join(root, 'src/content/essays/authoring-essay-fixture.md');
  try {
    await expect.poll(async () => (await request.get('/essays/authoring-essay-fixture')).status()).toBe(200);
    const html = await (await request.get('/essays/authoring-essay-fixture')).text();
    expect(html).toContain('<h1>Authoring essay fixture</h1>');
    expect(html).toContain('<h2 id="a-fresh-thought">A fresh thought</h2>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('datetime="2026-09-06"');
    expect(html).not.toMatch(/Example essay|Demonstration content/);
    for (const route of ['/', '/essays']) {
      await expect.poll(async () => (await request.get(route)).text()).toContain('href="/essays/authoring-essay-fixture"');
      expect(await (await request.get(route)).text()).not.toContain('No essays yet.');
    }
  } finally {
    await unlink(file);
  }
  for (const route of ['/', '/essays']) {
    await expect.poll(async () => (await request.get(route)).text()).toContain('No essays yet.');
  }
  await expect.poll(async () => (await request.get('/essays/authoring-essay-fixture')).status()).toBe(404);
});
