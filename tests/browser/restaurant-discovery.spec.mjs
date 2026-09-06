import { test, expect } from '@playwright/test';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

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
example: true
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
