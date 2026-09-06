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
- **Restaurants:** append a record to `src/data/restaurants.json`. Fields: unique stable `id`, `title`, local `image` path relative to the JSON file, meaningful `imageAlt`, `city`, lowercase hyphenated `citySlug`, `tags`, and required boolean `example`. Put images in `src/assets/restaurants/`; Astro validates them and produces dimensioned WebP assets. Use the same city spelling for each city slug. Restaurants display alphabetically and have no detail pages.
- **Essays:** add a Markdown file to `src/content/essays/`. The filename becomes `/essays/<filename-without-extension>`; use lowercase hyphenated filenames. Required frontmatter: `title`, `summary`, ISO `date` (YYYY-MM-DD), and boolean `example`. Articles display newest first. Use level-two headings inside the Markdown; the page supplies the title.

The schema is in `src/content.config.ts`. Keep stable IDs and slugs when editing existing content. All initial restaurants are fictional, and the initial essay is demonstration content, not Paul’s authored writing. Cards and previews display those labels. Replace the examples with real entries when ready and set `example: false`; use appropriate image descriptions and captions for any new illustrations.

## Restaurant URLs

Supported tags: `vegan`, `vegetarian`, `spicy`, `small-plates`, `beer`, `wine`. Vegan matching is explicit; no dietary tags are inferred.

| URL | Selection |
| --- | --- |
| `/restaurants` | All locations and tags |
| `/restaurants/london` | London |
| `/restaurants/london/vegan` | London + Vegan |
| `/restaurants/all/vegan` | Vegan everywhere |

Changing one filter preserves the other. Every known city/tag pair is built, including empty combinations. `all` is reserved for cross-location tag routes; `/restaurants/all` is not a separate listing. Unknown locations, unknown tags and extra segments have no route and return 404 in Astro preview.

Links have no trailing slashes. Build output uses `.html` files; the Cloudflare asset configuration resolves extensionless URLs to these files and returns `404.html` with a 404 status for missing routes. Do not configure an SPA fallback.

## UI and assets

BlackChalk’s `SketchAppShell` renders the shared shell on the server. Cards and badges hydrate for browser measurement; all content and links are present in the initial HTML. The light paper theme and Caveat handwriting font are bundled locally. Prose uses a system font. The sidebar wraps above content on narrow screens, grids adapt to available width, and links have keyboard focus styles.

Generated illustrations and the exact prompt set are recorded in [docs/illustrations.md](docs/illustrations.md).
