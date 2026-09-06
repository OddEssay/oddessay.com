export const tags = ['vegan', 'vegetarian', 'spicy', 'small-plates', 'beer', 'wine'] as const;
export type Tag = typeof tags[number];
export const tagLabels: Record<Tag, string> = {
  vegan: 'Vegan', vegetarian: 'Vegetarian', spicy: 'Spicy',
  'small-plates': 'Small Plates', beer: 'Beer', wine: 'Wine',
};
export type Filter = { city?: string; tag?: Tag };
type Restaurant = { city: string; citySlug: string; title: string; tags: readonly string[] };

export function locations(restaurants: Restaurant[]) {
  const cities = new Map<string, string>();
  for (const restaurant of restaurants) {
    if (restaurant.citySlug === 'all') throw new Error('The city slug "all" is reserved.');
    if (cities.has(restaurant.citySlug) && cities.get(restaurant.citySlug) !== restaurant.city) {
      throw new Error(`Inconsistent city name for ${restaurant.citySlug}`);
    }
    cities.set(restaurant.citySlug, restaurant.city);
  }
  return [...cities].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}
export function filterPath({ city, tag }: Filter = {}) {
  return `/restaurants${city || tag ? `/${city ?? 'all'}` : ''}${tag ? `/${tag}` : ''}`;
}
export function parseFilter(path: string | undefined, cities: readonly string[]): Filter | null {
  if (!path) return {};
  const parts = path.split('/');
  if (parts.length > 2 || parts.some(part => !part)) return null;
  const [city, tag] = parts;
  if (city !== 'all' && !cities.includes(city)) return null;
  if (tag !== undefined && !tags.includes(tag as Tag)) return null;
  if (city === 'all' && !tag) return null;
  return { ...(city !== 'all' ? { city } : {}), ...(tag ? { tag: tag as Tag } : {}) };
}
export function filterRoutes(cities: readonly string[]) {
  return [undefined, ...cities, ...tags.map(tag => `all/${tag}`),
    ...cities.flatMap(city => tags.map(tag => `${city}/${tag}`))];
}
export function matchingRestaurants<T extends Restaurant>(restaurants: T[], filter: Filter) {
  return restaurants.filter(r => (!filter.city || r.citySlug === filter.city) &&
    (!filter.tag || r.tags.includes(filter.tag))).sort((a, b) => a.title.localeCompare(b.title));
}
