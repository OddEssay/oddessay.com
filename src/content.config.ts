import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { restaurantSchema } from './lib/restaurant-schema';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
// The file loader otherwise overwrites duplicate IDs before schema validation.
function uniqueRecords(source: string) {
  const records = z.array(z.object({ id: slug }).loose()).parse(JSON.parse(source));
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate content ID: ${record.id}`);
    ids.add(record.id);
  }
  return records;
}
const projects = defineCollection({
  loader: file('src/data/projects.json', { parser: uniqueRecords }),
  schema: z.object({ id: slug, title: text, url: z.url().refine(url => /^https?:\/\//.test(url)), technologies: z.array(text).min(1) }),
});
const restaurants = defineCollection({
  // Entries and their tags are authored in Markdown; no registry needs updating.
  loader: glob({
    pattern: '*.md', base: './src/content/restaurants',
    generateId: ({ entry }) => slug.parse(entry.replace(/\.md$/, '')),
  }),
  schema: ({ image }) => restaurantSchema(image()),
});
const essays = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/essays' }),
  schema: z.object({ title: text, summary: text, date: z.coerce.date() }),
});
export const collections = { projects, restaurants, essays };
