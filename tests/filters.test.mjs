import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPath, parseFilter, filterRoutes, matchingRestaurants, tags, tagLabels, locations } from '../src/lib/restaurants.ts';
// Fixed fixtures keep filter logic tests independent of editorial changes.
const restaurants = [
  { title: 'Garden Table', city: 'London', citySlug: 'london', tags: ['vegan', 'vegetarian'] },
  { title: 'Little Plates', city: 'London', citySlug: 'london', tags: ['vegetarian', 'small-plates', 'wine'] },
  { title: 'Pepper Yard', city: 'Bristol', citySlug: 'bristol', tags: ['spicy', 'beer'] },
];
const cities = locations(restaurants).map(c => c.slug);
const titles = filter => matchingRestaurants(restaurants, filter).map(r => r.title);

test('location-only routes select a city', () => {
  const filter = parseFilter('london', cities);
  assert.deepEqual(filter, { city: 'london' });
  assert.deepEqual(titles(filter), ['Garden Table', 'Little Plates']);
});
test('tag-only routes match explicit tags across locations', () => {
  assert.deepEqual(parseFilter('all/vegan', cities), { tag: 'vegan' });
  assert.deepEqual(titles({ tag: 'vegan' }), ['Garden Table']);
  assert.deepEqual(titles({ tag: 'vegetarian' }), ['Garden Table', 'Little Plates']);
});
test('combined routes require both city and tag', () => {
  assert.deepEqual(parseFilter('london/vegan', cities), { city: 'london', tag: 'vegan' });
  assert.deepEqual(titles({ city: 'london', tag: 'vegan' }), ['Garden Table']);
});
test('changing or clearing one filter preserves the other', () => {
  const filter = { city: 'london', tag: 'vegan' };
  assert.equal(filterPath({ ...filter, city: 'bristol' }), '/restaurants/bristol/vegan');
  assert.equal(filterPath({ ...filter, tag: 'wine' }), '/restaurants/london/wine');
  assert.equal(filterPath({ ...filter, city: undefined }), '/restaurants/all/vegan');
  assert.equal(filterPath({ ...filter, tag: undefined }), '/restaurants/london');
  assert.equal(filterPath({}), '/restaurants');
  assert.deepEqual(parseFilter(undefined, cities), {});
  assert.equal(titles({}).length, 3);
});
test('empty combinations remain valid and generated', () => {
  assert.deepEqual(titles(parseFilter('bristol/vegan', cities)), []);
  assert.ok(filterRoutes(cities).includes('bristol/vegan'));
  assert.equal(filterRoutes(cities).length, 21);
  for (const route of filterRoutes(cities)) assert.notEqual(parseFilter(route, cities), null);
});
test('unknown and extra segments are invalid', () => {
  for (const path of ['paris', 'all', 'london/fish', 'all/fish', 'london/vegan/extra', 'london/', 'london//vegan', 'London', 'london/small plates']) {
    assert.equal(parseFilter(path, cities), null, path);
    assert.ok(!filterRoutes(cities).includes(path));
  }
});
test('Small Plates has the stable small-plates slug; all six tags are represented', () => {
  assert.equal(tagLabels['small-plates'], 'Small Plates');
  assert.equal(filterPath({ tag: 'small-plates' }), '/restaurants/all/small-plates');
  assert.deepEqual(titles({ tag: 'small-plates' }), ['Little Plates']);
  assert.deepEqual(new Set(restaurants.flatMap(r => r.tags)), new Set(tags));
});
test('location registry rejects reserved or conflicting city slugs', () => {
  assert.throws(() => locations([{ ...restaurants[0], citySlug: 'all' }]));
  assert.throws(() => locations([restaurants[0], { ...restaurants[0], city: 'Different city' }]));
});
