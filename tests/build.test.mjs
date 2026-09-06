import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { filterRoutes, locations, tags } from '../src/lib/restaurants.ts';
const restaurants = JSON.parse(readFileSync(new URL('../src/data/restaurants.json', import.meta.url)));
const cities = locations(restaurants);
const page = path => readFileSync(new URL(`../dist/${path}.html`, import.meta.url), 'utf8');
const stripScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<astro-island\b[^>]*>/g, '');

test('every supported filter has a generated page, including empty combinations', () => {
  for (const route of filterRoutes(cities.map(city => city.slug))) {
    const html = page(`restaurants${route ? `/${route}` : ''}`);
    assert.match(html, /Filter by location/);
    assert.match(html, /Filter by tag/);
    assert.match(html, /href="\/restaurants" aria-current="page"/);
  }
  for (const city of cities) {
    for (const tag of tags) {
      if (restaurants.some(r => r.citySlug === city.slug && r.tags.includes(tag))) continue;
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
  const html = page('restaurants/london/vegan');
  for (const link of [
    'href="/restaurants/all/vegan">All locations',
    ...cities.filter(city => city.slug !== 'london').map(city => `href="/restaurants/${city.slug}/vegan">${city.name}`),
    'href="/restaurants/london">All tags',
    'href="/restaurants/london/small-plates">Small Plates',
    'href="/restaurants/london/vegan" aria-current="page">Vegan',
  ]) assert.ok(html.includes(link), link);
  assert.match(html, /<h3>Garden Table<\/h3>/);
  assert.doesNotMatch(html, /<h3>Little Plates<\/h3>/);
});
test('homepage and listings render sample labels, local images, project and essay links', () => {
  for (const name of ['index', 'restaurants']) {
    const html = stripScripts(page(name));
    assert.equal((html.match(/Fictional sample restaurant/g) ?? []).length, 3);
    assert.equal((html.match(/Example · Generated illustration/g) ?? []).length, 3);
    const images = [...html.matchAll(/<img\b[^>]*>/g)];
    assert.equal(images.length, 3);
    for (const [image] of images) {
      assert.match(image, /alt="Generated pencil illustration/);
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
    assert.match(page(name), /Example essay/);
    assert.match(page(name), /href="\/essays\/a-place-to-keep-things"/);
  }
});
test('Markdown, metadata, navigation, font and hydration assets are present', () => {
  const essay = page('essays/a-place-to-keep-things');
  assert.match(essay, /<h2 id="a-small-beginning">A small beginning<\/h2>/);
  assert.match(essay, /<blockquote>/);
  assert.match(essay, /Example essay · Demonstration content/);
  for (const name of ['index', 'projects', 'restaurants', 'essays', 'essays/a-place-to-keep-things', '404']) {
    const html = page(name);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /<title>.+? \| OddEssay.com<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /href="#content">Skip to content/);
    assert.match(html, /aria-label="Main navigation"/);
    for (const section of ['projects', 'restaurants', 'essays']) assert.ok(html.includes(`href="/${section}"`));
  }
  assert.match(page('restaurants'), /component-export="SketchCard"/);
  assert.match(page('restaurants'), /component-export="SketchBadge"/);
  assert.ok(readdirSync('dist/_astro').some(file => file.endsWith('.woff2')));
});
