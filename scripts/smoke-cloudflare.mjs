import { readRestaurants } from './restaurant-content.mjs';
import assert from 'node:assert/strict';
import { filterRoutes, locations, restaurantTags } from '../src/lib/restaurants.ts';

// Run after `pnpm build` and with `pnpm preview:cloudflare` running.
const origin = 'http://127.0.0.1:8787';
const checkHeaders = response => {
  assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'self'/);
  for (const [name, value] of Object.entries({
    'x-frame-options': 'SAMEORIGIN', 'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cross-origin-opener-policy': 'same-origin', 'strict-transport-security': 'max-age=86400',
  })) assert.equal(response.headers.get(name), value, name);
};
const restaurants = readRestaurants();
const routes = filterRoutes(locations(restaurants).map(city => city.slug), restaurantTags(restaurants));
for (const path of ['/', '/projects', '/essays',
  ...restaurants.map(r => `/restaurants/place/${r.id}`),
  ...routes.map(route => `/restaurants${route ? `/${route}` : ''}`)]) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  checkHeaders(response);
}
for (const path of ['/restaurants/place/garden-table', '/restaurants/place/little-plates', '/essays/a-place-to-keep-things', '/restaurants/london', '/restaurants/all/vegan', '/restaurants/unknown-city', '/restaurants/london/unknown-tag', '/restaurants/london/vegan/extra', '/restaurants/all', '/restaurants/place', '/restaurants/place/missing', '/restaurants/place/garden-table/extra']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 404, path);
  checkHeaders(response);
  assert.match(await response.text(), /Page not found/);
}
for (const path of ['/projects/', '/restaurants/liverpool/', '/restaurants/liverpool.html']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 307, path);
  const target = new URL(response.headers.get('location'), origin);
  assert.equal(target.pathname, path.replace(/\/$|\.html$/, ''));
}
console.log('Cloudflare routing passed: valid routes, custom 404s, and canonical URL redirects.');
