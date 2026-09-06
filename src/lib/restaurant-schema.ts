import { z } from 'astro/zod';

const text = z.string().trim().min(1);
// Astro's image helper also accepts remote URLs; restaurant assets must be local.
export function restaurantSchema<T extends z.ZodType>(image: T) {
  const localImage = z.preprocess((value, ctx) => {
    if (typeof value !== 'string' || !/^\.\.?\//.test(value)) {
      ctx.addIssue({ code: 'custom', message: 'Use a local image path relative to the Markdown file' });
      return z.NEVER;
    }
    return value;
  }, image);
  return z.object({
    title: text, summary: text, image: localImage, imageAlt: text,
    originalImage: localImage.optional(), originalImageAlt: text.optional(),
    city: text,
    citySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine(value => !['all', 'place'].includes(value), 'City slugs all and place are reserved'),
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase hyphenated tags, for example sunday-dinner')).min(1)
      .refine(values => new Set(values).size === values.length, 'Tags must be unique'),
    example: z.boolean(),
  }).refine(value => (value.originalImage !== undefined) === (value.originalImageAlt !== undefined),
    'originalImage and originalImageAlt must be supplied together');
}
