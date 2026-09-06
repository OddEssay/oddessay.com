import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { z } from 'astro/zod';
import { restaurantSchema } from '../src/lib/restaurant-schema.ts';
import { readRestaurants } from '../scripts/restaurant-content.mjs';

const entries = readRestaurants();
const schema = restaurantSchema(z.string().refine(path => existsSync(new URL(`../src/content/restaurants/${path}`, import.meta.url)), 'Image file missing'));
const valid = entries[0];
test('Markdown restaurants validate with existing local images', () => {
  for (const entry of entries) assert.equal(schema.safeParse(entry).success, true, entry.id);
  assert.equal(schema.safeParse({ ...valid, originalImage: valid.image, originalImageAlt: 'Original photo' }).success, true);
});
test('new restaurant tags come from Markdown without registering them in code', () => {
  assert.equal(schema.safeParse({ ...valid, tags: ['cocktails', 'sunday-roast'] }).success, true);
});
test('required fields, tags, reserved cities and local image pairs are enforced', () => {
  for (const field of ['title', 'summary', 'image', 'imageAlt', 'city', 'citySlug', 'tags', 'example']) {
    const input = { ...valid };
    delete input[field];
    assert.equal(schema.safeParse(input).success, false, field);
  }
  for (const change of [
    { summary: ' ' }, { tags: ['Sunday Dinner'] }, { tags: [''] }, { tags: [] }, { tags: ['vegan', 'vegan'] },
    { citySlug: 'all' }, { citySlug: 'place' }, { citySlug: 'London' },
    { image: './missing.png' }, { image: 'https://example.com/image.png' }, { image: '/image.png' },
    { originalImage: valid.image, originalImageAlt: undefined }, { originalImage: undefined, originalImageAlt: 'Photo' },
    { originalImage: './missing.png', originalImageAlt: 'Photo' },
    { originalImage: valid.image, originalImageAlt: ' ' },
  ]) assert.equal(schema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change));
});
