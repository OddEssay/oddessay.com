import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterRoutes, locations } from '../src/lib/restaurants.ts';

// Run after `pnpm build` and with `pnpm preview:cloudflare` running.
const origin = 'http://127.0.0.1:8787';
const restaurants = JSON.parse(readFileSync(new URL('../src/data/restaurants.json', import.meta.url)));
const routes = filterRoutes(locations(restaurants).map(city => city.slug));
for (const path of ['/', '/projects', '/essays', '/essays/a-place-to-keep-things',
  ...routes.map(route => `/restaurants${route ? `/${route}` : ''}`)]) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 200, path);
}
for (const path of ['/restaurants/unknown-city', '/restaurants/london/unknown-tag', '/restaurants/london/vegan/extra', '/restaurants/all']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 404, path);
  assert.match(await response.text(), /Page not found/);
}
for (const path of ['/projects/', '/restaurants/london/', '/restaurants/london.html']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 307, path);
  const target = new URL(response.headers.get('location'), origin);
  assert.equal(target.pathname, path.replace(/\/$|\.html$/, ''));
}
console.log('Cloudflare routing passed: valid routes, custom 404s, and canonical URL redirects.');
