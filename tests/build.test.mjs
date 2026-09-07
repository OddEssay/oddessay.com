import { readRestaurants } from '../scripts/restaurant-content.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { citySlug, filterRoutes, locations, restaurantTags } from '../src/lib/restaurants.ts';
const restaurants = readRestaurants();
const tags = restaurantTags(restaurants);
const cities = locations(restaurants);
const alphabetical = [...restaurants].sort((a, b) => a.title.localeCompare(b.title));
const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const page = path => readFileSync(new URL(`../dist/${path}.html`, import.meta.url), 'utf8');
const stripScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<astro-island\b[^>]*>/g, '');

test('every supported filter has a generated page, including empty combinations', () => {
  for (const route of filterRoutes(cities.map(city => city.slug), tags)) {
    const html = page(`restaurants${route ? `/${route}` : ''}`);
    assert.match(html, /Filter by location/);
    assert.match(html, /Filter by tag/);
    assert.match(html, /href="\/restaurants" aria-current="page"/);
  }
  for (const city of cities) {
    for (const tag of tags) {
      if (restaurants.some(r => citySlug(r.city) === city.slug && r.tags.includes(tag))) continue;
      const html = page(`restaurants/${city.slug}/${tag}`);
      assert.match(html, /No restaurants match these filters/);
      assert.match(html, /href="\/restaurants">Reset filters/);
    }
  }
  for (const route of ['paris', 'all', 'london/fish', 'london/vegan/extra']) {
    assert.ok(!existsSync(`dist/restaurants/${route}.html`));
  }
  assert.match(page('404'), /Page not found/);
});
test('rendered filter controls preserve the other selection', () => {
  const html = page('restaurants/liverpool/spicy');
  for (const link of [
    'href="/restaurants/all/spicy">All locations',
    'href="/restaurants/liverpool">All tags',
    'href="/restaurants/liverpool/wine">Wine',
    'href="/restaurants/liverpool/spicy" aria-current="page">Spicy',
  ]) assert.ok(html.includes(link), link);
  assert.match(html, /<h3><a href="\/restaurants\/place\/bistro-lao">Bistro Lao<\/a><\/h3>/);
  assert.doesNotMatch(html, /<h3><a[^>]*>Hawksmoor<\/a><\/h3>/);
});
test('homepage and listings render real restaurants, local images, project links and essays', () => {
  for (const name of ['index', 'restaurants']) {
    const html = stripScripts(page(name));
    const visible = name === 'index' ? alphabetical.slice(0, 3) : alphabetical;
    assert.doesNotMatch(html, /Fictional sample restaurant|Example ·|Example essay/);
    assert.deepEqual([...html.matchAll(/<h3><a href="\/restaurants\/place\/([^"]+)"/g)].map(match => match[1]), visible.map(r => r.id));
    const images = [...html.matchAll(/<img\b[^>]*>/g)];
    assert.equal(images.length, visible.reduce((count, r) => count + (r.originalImage ? 2 : 1), 0));
    for (const [image] of images) {
      assert.match(image, /alt="[^"]+"/);
      assert.match(image, /width="640"/);
      assert.match(image, /height="420"/);
      const src = image.match(/src="([^"]+)"/)[1];
      assert.ok(src.startsWith('/_astro/'));
      assert.ok(existsSync(join('dist', src)));
    }
  }
  for (const name of ['index', 'projects']) {
    assert.match(page(name), /href="https:\/\/is.today.blackfriday\/"/);
    assert.match(page(name), /Cloudflare Serverless/);
  }
  for (const name of ['index', 'essays']) {
    assert.match(page(name), /href="\/essays\/2026-09-06-first-post"/);
  }
});
test('Markdown, metadata, navigation, font and hydration assets are present', () => {
  for (const name of ['index', 'projects', 'restaurants', 'essays', '404']) {
    const html = page(name);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /<title>.+? \| OddEssay.com<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /href="#content">Skip to content/);
    assert.match(html, /aria-label="Main navigation"/);
    for (const section of ['projects', 'restaurants', 'essays']) assert.ok(html.includes(`href="/${section}"`));
  }
  assert.match(page('restaurants'), /component-url="[^"]*SketchCard[^"]*" component-export="default"/);
  assert.match(page('restaurants'), /component-url="[^"]*SketchBadge[^"]*" component-export="default"/);
  assert.ok(readdirSync('dist/_astro').some(file => file.endsWith('.woff2')));
});

test('restaurant detail pages render Markdown, summaries, metadata and links', () => {
  for (const restaurant of restaurants) {
    const detail = page(`restaurants/place/${restaurant.id}`);
    assert.ok(detail.includes(`<h1>${escapeHTML(restaurant.title)}</h1>`));
    assert.ok(detail.includes(`<meta name="description" content="${escapeHTML(restaurant.summary)}"`));
    if (restaurant.body.includes('## At the table')) assert.match(detail, /<h2 id="at-the-table">At the table<\/h2>/);
    assert.doesNotMatch(detail, /Fictional sample restaurant|Example ·/);
    assert.match(detail, /href="\/restaurants">← All restaurants/);
    assert.ok(detail.includes(`href="/restaurants/${citySlug(restaurant.city)}"`));
    for (const tag of restaurant.tags) assert.ok(detail.includes(`href="/restaurants/all/${tag}"`));
    for (const name of ['index', 'restaurants']) {
      const html = page(name);
      const visible = name === 'restaurants' || alphabetical.slice(0, 3).some(r => r.id === restaurant.id);
      if (visible) assert.ok(html.includes(escapeHTML(restaurant.summary)));
      assert.equal(html.includes(`href="/restaurants/place/${restaurant.id}"`), visible);
    }
    assert.equal(/<button[^>]*data-toggle/.test(stripScripts(detail)), Boolean(restaurant.originalImage));
  }
  for (const route of ['place', 'place/missing', 'place/garden-table/extra']) assert.ok(!existsSync(`dist/restaurants/${route}.html`));
});

test('retired content and its unused filters have no generated routes', () => {
  for (const id of ['garden-table', 'little-plates']) assert.ok(!restaurants.some(r => r.id === id));
  for (const route of ['restaurants/place/garden-table', 'restaurants/place/little-plates', 'essays/a-place-to-keep-things', 'restaurants/london', 'restaurants/all/vegan', 'restaurants/all/vegetarian', 'restaurants/all/small-plates']) {
    assert.ok(!existsSync(`dist/${route}.html`), route);
  }
});

test('responsive photos are inert, illustrations have AVIF and WebP candidates, and Latin is preloaded', () => {
  const html = page('index');
  assert.match(html, /<template data-photo-template>[\s\S]*?<source[^>]*type="image\/avif"[\s\S]*?data-photo[\s\S]*?<\/template>/);
  const live = stripScripts(html).replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, '');
  assert.doesNotMatch(live, /data-photo(?:\s|=)/);
  assert.match(live, /type="image\/avif"/);
  assert.match(live, /srcset="[^"]+1400w/);
  assert.match(live, /sizes="auto,/);
  assert.match(html, /rel="preload" href="[^\"]*caveat-latin\.[^\"]*woff2" as="font" type="font\/woff2" crossorigin="anonymous"/);
  assert.doesNotMatch(html, /rel="preload"[^>]*latin-ext/);
  assert.ok(!readdirSync('dist/_astro').some(file => /\.(png|jpe?g)$/.test(file)), 'Unprocessed restaurant originals must not be public assets');
});

test('hydration bundles exclude unused controls and Motion', () => {
  const chunks = readdirSync('dist/_astro').filter(file => file.endsWith('.js'));
  const code = chunks.map(file => readFileSync(join('dist/_astro', file), 'utf8')).join('\n');
  assert.doesNotMatch(code, /framer-motion|motionComponentSymbol|SketchDayCell|SketchIconRadio|SketchTab/);
  // Count shared chunks once; catches accidentally hydrating the package entry.
  const bytes = chunks.reduce((sum, file) => sum + readFileSync(join('dist/_astro', file)).length, 0);
  assert.ok(bytes < 250_000, `Unexpected browser JavaScript growth: ${bytes} bytes`);
});
