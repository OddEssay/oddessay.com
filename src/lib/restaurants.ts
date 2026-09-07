export type Filter = { city?: string; tag?: string };
type Restaurant = { city: string; title: string; tags: readonly string[] };

export function citySlug(city: string) {
  return city.toLowerCase().replaceAll(' ', '_');
}

export function restaurantTags(restaurants: readonly Pick<Restaurant, 'tags'>[]) {
  return [...new Set(restaurants.flatMap(restaurant => restaurant.tags))].sort();
}

export function tagLabel(tag: string) {
  return tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function locations(restaurants: Restaurant[]) {
  const cities = new Map<string, string>();
  for (const restaurant of restaurants) {
    const slug = citySlug(restaurant.city);
    if (['all', 'place'].includes(slug)) throw new Error(`The city slug "${slug}" is reserved.`);
    if (cities.has(slug) && cities.get(slug) !== restaurant.city) {
      throw new Error(`Inconsistent city name for ${slug}`);
    }
    cities.set(slug, restaurant.city);
  }
  return [...cities].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}
export function filterPath({ city, tag }: Filter = {}) {
  return `/restaurants${city || tag ? `/${city ?? 'all'}` : ''}${tag ? `/${tag}` : ''}`;
}
export function parseFilter(path: string | undefined, cities: readonly string[], tags: readonly string[]): Filter | null {
  if (!path) return {};
  const parts = path.split('/');
  if (parts.length > 2 || parts.some(part => !part)) return null;
  const [city, tag] = parts;
  if (city === 'place' || (city !== 'all' && !cities.includes(city))) return null;
  if (tag !== undefined && !tags.includes(tag)) return null;
  if (city === 'all' && !tag) return null;
  return { ...(city !== 'all' ? { city } : {}), ...(tag ? { tag } : {}) };
}
export function filterRoutes(cities: readonly string[], tags: readonly string[]) {
  return [undefined, ...cities, ...tags.map(tag => `all/${tag}`),
    ...cities.flatMap(city => tags.map(tag => `${city}/${tag}`))];
}
export function matchingRestaurants<T extends Restaurant>(restaurants: T[], filter: Filter) {
  return restaurants.filter(r => (!filter.city || citySlug(r.city) === filter.city) &&
    (!filter.tag || r.tags.includes(filter.tag))).sort((a, b) => a.title.localeCompare(b.title));
}
