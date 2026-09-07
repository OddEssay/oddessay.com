# OddEssay.com

Paul Bennett-Freeman’s personal notebook: Projects, Restaurants and Essays. A static Astro 7.3.1 site with React 19 and BlackChalk 0.3.0 (`@astrojs/react` 6.0.5). Content lives in Git. The previous Gatsby/Strapi implementation is retired.

## Local development

Use Node 24 LTS (minimum 22.12) and pnpm 10.14.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm verify
pnpm preview
```

`pnpm verify` runs Astro’s type/content checks, builds `dist/`, then runs the filter and built-output tests. `pnpm test` needs an existing build. Astro prints the local preview URL; `pnpm exec astro preview stop` stops the preview server.

## Cloudflare Workers deployment

`wrangler.jsonc` configures the existing `oddessay-com` Worker to serve static files from `dist`. No Worker script or Astro Cloudflare adapter is needed. Explicit configuration prevents Wrangler from attempting automatic Astro adapter setup during deployment. Wrangler is pinned in the pnpm lockfile.

For the Cloudflare Workers Git build, use:

- Build command: `pnpm run build`
- Deploy command: `pnpm exec wrangler deploy`

The existing `npx wrangler deploy` command also uses the installed version, but the pnpm command keeps package-manager usage consistent. Locally, `pnpm deploy` builds and deploys; it requires Cloudflare authentication. `pnpm deploy:check` builds and validates deployment with `--dry-run`, without publishing. After building, `pnpm preview:cloudflare` serves the site locally using Cloudflare’s asset routing.

Asset routing removes trailing slashes and serves `404.html` with a 404 status for unknown paths. Domain routes and account settings remain managed outside this repository. See [Cloudflare’s static site configuration](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

With `pnpm preview:cloudflare` running, `node scripts/smoke-cloudflare.mjs` checks all generated restaurant routes, custom 404 responses, and canonical URL redirects against the local Cloudflare runtime.

## Content

- **Projects:** append a record to `src/data/projects.json`. Fields: unique stable `id`, `title`, HTTP(S) `url`, and a nonempty `technologies` array. Array order is display order. No detail pages.
- **Restaurants:** create `src/content/restaurants/<slug>.md`. Files are discovered automatically, including additions and edits during development. The lowercase hyphenated filename is the stable slug for `/restaurants/place/<slug>`. Required frontmatter: `title`, `url` (an HTTP or HTTPS website), `summary`, `image`, `imageAlt`, `city` and `tags`. Image paths are local and relative to the Markdown file. Optional `originalImage` and `originalImageAlt` must appear together. City URLs are derived from `city` by lowercasing and replacing spaces with underscores (for example, `New York` becomes `new_york`). Use consistent city spelling. Restaurants display alphabetically; the homepage shows the first three. The Markdown body is the full page; start body headings at level two.
- **Essays:** add a Markdown file to `src/content/essays/`. The filename becomes `/essays/<filename-without-extension>`; use lowercase hyphenated filenames. Required frontmatter: `title`, `summary`, and ISO `date` (YYYY-MM-DD). Articles display newest first. Restart the development server after adding the first essay to an empty collection so Astro discovers it. Use level-two headings inside the Markdown; the page supplies the title.

The schema is in `src/content.config.ts`. Keep stable IDs and slugs when editing existing content. Use appropriate image descriptions and captions for new illustrations. When there are no essays, the homepage and Essays listing display “No essays yet.”

## Authoring a restaurant

1. Create the Markdown entry with an existing local illustrated cover and meaningful alt text. Add the card summary, metadata and full write-up.

2. Supply an original photo and invoke `$restaurant-cover` with the entry path and photo. The [repository skill](.agents/skills/restaurant-cover/SKILL.md) preserves the original, prepares a standard PNG, generates a matching cover, then updates only the image fields. To prepare a photo separately, run `pnpm photo:prepare <camera-file> <output.png>`. See the [image pipeline](docs/restaurant-images.md) for iPhone/HEIC handling and build-time WebP optimization. New assets live in `src/assets/restaurants/<slug>/`; regenerated covers use new filenames.
3. Inspect the illustration and photo reveal, including crop alignment, then run `pnpm verify`. Image generation happens during authoring, never in CI. Publishing is separate.

Hover over a paired image to preview the photo, or click the underlined Generated illustration / Original photo caption to keep a version visible. The caption supports keyboard activation and follows the visible image. Without JavaScript the illustration and plain caption remain visible.

`pnpm test:browser` runs in a temporary project copy with its own content and Vite caches. It verifies that adding, editing and removing restaurant Markdown updates entries and new tag routes without restarting. A temporary essay verifies Markdown rendering and the empty state after removal. Clearly labelled geometric image fixtures check mouse, keyboard, touch, reduced motion, independent components and the no-JavaScript fallback. It also checks desktop/mobile overflow, image loading and matching frames, and saves screenshots in `test-results/`. It needs Playwright Chromium (`pnpm exec playwright install chromium`). The temporary project is removed when the runner exits; test fixtures never enter the working site's content or production build.

## Restaurant URLs

Tags come from the restaurant Markdown files. Use lowercase hyphenated values such as `sunday-dinner` or `cocktails`; labels such as “Sunday Dinner” and filter routes are generated automatically. Removing the last use of a tag removes its routes. No code registration is needed. Vegan matching is explicit; no dietary tags are inferred.

| URL | Selection |
| --- | --- |
| `/restaurants` | All locations and tags |
| `/restaurants/liverpool` | Liverpool |
| `/restaurants/liverpool/spicy` | Liverpool + Spicy |
| `/restaurants/all/spicy` | Spicy everywhere |

Changing one filter preserves the other. Every known city/tag pair is built, including empty combinations. `all` is reserved for cross-location tag routes and `place` for restaurant detail pages; `/restaurants/all` is not a separate listing. Unknown locations, unknown tags and extra segments have no route and return 404 in Astro preview.

Links have no trailing slashes. Build output uses `.html` files; the Cloudflare asset configuration resolves extensionless URLs to these files and returns `404.html` with a 404 status for missing routes. Do not configure an SPA fallback.

## UI and assets

BlackChalk’s `SketchAppShell` renders the shared shell on the server. Cards and badges hydrate for browser measurement; all content and links are present in the initial HTML. The light paper theme and Caveat handwriting font are bundled locally. Prose uses a system font. The sidebar wraps above content on narrow screens, grids adapt to available width, and links have keyboard focus styles.

Generated illustrations and the exact prompt set are recorded in [docs/illustrations.md](docs/illustrations.md).
