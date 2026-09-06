import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { tags } from './lib/restaurants';

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
  loader: file('src/data/restaurants.json', { parser: uniqueRecords }),
  schema: ({ image }) => z.object({
    id: slug, title: text, image: image(), imageAlt: text,
    city: text, citySlug: slug.refine(value => value !== 'all', 'The city slug all is reserved'),
    tags: z.array(z.enum(tags)).min(1).refine(values => new Set(values).size === values.length, 'Tags must be unique'),
    example: z.boolean(),
  }),
});
const essays = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/essays' }),
  schema: z.object({ title: text, summary: text, date: z.coerce.date(), example: z.boolean() }),
});
export const collections = { projects, restaurants, essays };
