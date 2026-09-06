# Loading, layout stability and security verification

Implemented and measured locally on 6 September 2026. No production deployment or dependency upgrade was performed. Content, routes, Caveat's 175% scale, hydration timing and runtime sketch drawing are preserved.

## Measured comparison

The supplied reference is the Incognito run at **20:36 UTC**. Its browser, viewport, DPR and throttling configuration were not supplied, so the controlled local runs are a separate comparison, not a reproduction of that run.

| Metric | Supplied reference | Local before, median of 3 | Local after, median of 3 |
| --- | ---: | ---: | ---: |
| Performance | 91 | 93 | 98 |
| FCP | 1.6s | 1.81s | 1.21s |
| LCP | 1.6s | 3.01s | 2.26s |
| Total blocking time | 0ms | 0ms | 0ms |
| CLS | 0.185 | 0 | 0 |
| Transferred | 485KiB | 464.9KiB | 402.1KiB |

The fixed localhost transport makes font delivery fast enough that ordinary simulated Lighthouse runs show zero CLS even before the fix. A separate browser test holds font responses for 1.2 seconds after DOMContentLoaded, captures fallback text, then releases or aborts the requests:

| Viewport | Delayed font, before CLS | Delayed font, after CLS | Failed font, after CLS |
| --- | ---: | ---: | ---: |
| 390 × 1000, DPR 3 | 0.233577 | 0.000028 | 0 |
| 1440 × 1000, DPR 1 | 0.033543 | 0.000161 | 0 |

Both after measurements meet the <0.1 requirement and ≤0.05 target. These tests sum all shifts without recent input, which is at least as strict as the usual maximum session-window CLS. Mobile means Chromium viewport/DPR emulation on macOS, not a physical Android device. Arial availability and fallback appearance can differ on other operating systems.

All six Lighthouse runs use Lighthouse **13.4.1**, Chrome **152**, mobile emulation **390 × 844 / DPR 3**, simulated throttling, 150ms RTT, 1638.4Kbps throughput and 4× CPU slowdown. Browser storage is reset by Lighthouse for each run. Both builds use the same localhost gzip server; the updated build also serves its generated response headers. Cloudflare's edge analytics injection is absent from these local measurements. Per-run values, settings, resource categories and the complete production module graphs are in [loading-measurements.json](loading-measurements.json).

## Bytes and bundle contents

The complete emitted browser JavaScript graph, counting each shared React chunk once:

| Build | Chunks | Uncompressed bytes | Gzip bytes | Rendered modules | Motion modules |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before | 3 | 505,390 | 152,467 | 282 | 266 |
| After | 5 | 222,904 | 70,936 | 17 | 0 |

This removes **55.9% of uncompressed JavaScript and 53.5% of gzip JavaScript**. The new graph retains only SketchCard, SketchBadge and their shared drawing tokens from BlackChalk. Rough.js and React remain; theme-provider code, charts, dialogs, date pickers, tabs and their Motion dependencies disappear.

Local wrapper components alone left three unused `forwardRef` controls alive. The narrowly scoped Vite transform in `scripts/blackchalk-treeshake.mjs` groups each factory and displayName assignment into one pure allocation, and annotates an unused context allocation. It fails if the expected factory declarations change, so a future BlackChalk update requires checking the workaround. Used component code and resize effects still run unchanged.

Total median transfer falls about **13.5%**. At DPR 3 the illustrations now select 1280px candidates instead of the old fixed 640px assets. As a result, image transfer alone increases slightly (approximately 241KB to 249KB), while the number of initial image requests falls from four to two and no photograph is requested. The higher resolution is intentional; the overall page still downloads fewer bytes. The transfer figures include HTTP headers; gzip graph sizes above measure file bodies only.

## Font calibration

The site owns byte-identical copies of the package's two WOFF2 files and SIL OFL licence. Unicode ranges, weights 400–700, swap behavior and 175% size adjustment are retained. Only the Latin URL is preloaded with anonymous crossorigin; Latin Extended remains demand-loaded.

Caveat has unitsPerEm 1000, ascent 960, descent −300 and line gap 0. With 175% scaling, the target ascent/descent are 168% and 52.5%. Browser canvas widths at 100px were measured at weights 400, 600 and 700 using this fixed corpus:

> OddEssay.com Projects Restaurants Essays Bistro Lao Hawksmoor Cloudflare Serverless Here be Cheese

For each weight, fallback size adjustment is `scaled Caveat width / Arial width`. Fallback ascent and descent overrides divide 168% and 52.5% by that ratio:

| Weight | Local face | Size adjustment | Ascent override | Descent override |
| --- | --- | ---: | ---: | ---: |
| 400 | Arial | 129.5231% | 129.7066% | 40.5333% |
| 600 | Arial Bold | 122.7017% | 136.9174% | 42.7867% |
| 700 | Arial Bold | 123.3406% | 136.2081% | 42.5650% |

Every fallback has zero line gap. Headings, navigation and BlackChalk share `--sketch-font`. Measurements and a preload address the font-swap cause identified by [web.dev's CLS guidance](https://web.dev/articles/optimize-cls).

## Images and interactions

Astro Picture produces AVIF sources with responsive WebP fallback, keeping 640 × 420 intrinsic dimensions and the existing crop, alt text and lazy loading. Candidates range from 320 to 2100px, capped at each source’s native width to keep width descriptors accurate. `sizes="auto, …"` uses the rendered lazy-image width when supported, with explicit grid/detail fallback sizes. Detail pages opt into the 700px presentation through a component prop; content schemas are unchanged.

Dimensions are read through resolved Astro image metadata so the full source PNGs are not retained as public build assets; a regression assertion checks this.

Original photographs stay inside inert templates until mouse hover, caption focus or toggle activation. The illustration remains accessible and visible through loading and decode. Completion consults current hover/pinned intent. Leaving during loading does not reveal the photo later; errors announce a status and offer retry through the existing caption button. Instances keep independent state.

The production browser suite tests 390, 650, 900 and 1440px widths at DPR 1, 2 and 3 on cards and details. It checks zero photo requests before interaction, AVIF selection, loaded photographs and overflow. The 700px Bistro Lao detail image selects 1400px at DPR 2 and its native 1672px limit at DPR 3; the source cannot supply a true 2100px image without upscaling. Screenshots of mobile cards, desktop details and photo reveals were inspected: cropping and appearance are preserved, with clear image detail. The isolated suite covers keyboard, touch, visible focus, reduced motion, independent instances and the no-JavaScript experience.

## Security and verification

[Astro CSP hashing](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) generates script hashes. The build integration unions policies from all 17 pages, removes redundant meta policies and writes the authoritative Cloudflare `_headers` response policy. Inline styles remain allowed; scripts require this origin, approved hashes or the specific Cloudflare analytics script URL. Eval and unapproved inline scripts are not permitted.

The CSP includes default-src self, object-src none, base-uri self, form-action self and response-header frame-ancestors self. SAMEORIGIN, nosniff, strict-origin-when-cross-origin and same-origin COOP headers are present. HSTS is max-age=86400 without subdomains or preload. Trusted Types enforcement remains excluded.

The generated CSP is under 700 characters, well below [Cloudflare's 2,000-character per-line limit](https://developers.cloudflare.com/workers/static-assets/headers/). Tests verify every generated inline script hash, reject missing or oversized policies and check normal pages plus custom 404 responses.

Production browser checks observe no CSP violations or JavaScript exceptions while hydrating islands, drawing/resizing sketches, navigating and toggling images. The [Cloudflare analytics script and reporting endpoints](https://developers.cloudflare.com/web-analytics/faq/) are allowed. A mocked external script exercises both the same-origin and external reporting paths under the enforced policy without submitting analytics. Actual edge injection and receipt by Cloudflare are not tested locally.

Passed: `pnpm verify` (type checking, build, 22 tests), `pnpm test:browser` (12 isolated browser tests), `node scripts/smoke-cloudflare.mjs`, and `node scripts/check-production-browser.mjs`. Stale empty-essay and hydration-export assertions were updated. The pre-existing unsupported React `<strike>` element was changed to equivalent `<s>` so type checking passes.

## Reproduce

```sh
pnpm verify
pnpm test:browser
pnpm preview:cloudflare
# In another terminal:
node scripts/smoke-cloudflare.mjs
node scripts/check-production-browser.mjs
```

Browser artifacts and responsive selection data are written to `/tmp/oddessay-production-check` by default. Override `AUDIT_ORIGIN` and `AUDIT_OUTPUT` as needed. `--fonts-only` limits the production check to delayed/failed font scenarios; `AUDIT_MAX_CLS` can override the 0.1 threshold when measuring an intentionally unfixed baseline.

```sh
# Run against separate preserved before/after checkouts.
node scripts/audit-production-graph.mjs CHECKOUT /tmp/oddessay-graph-build
node scripts/serve-audit.mjs BUILD_DIRECTORY 4325

# Install tools outside the site's dependency tree, then run in another terminal.
npm install --prefix /tmp/oddessay-audit --no-save lighthouse@13.4.1
node scripts/measure-lighthouse.mjs http://127.0.0.1:4325 /tmp/oddessay-lighthouse
```

Use the same Chrome executable for both builds (`CHROME_PATH` can select it), and preserve identical screen/throttling settings. `LIGHTHOUSE_DIR` overrides the external tooling directory. The audit server is only a fixed comparison transport; use Wrangler for Cloudflare behavior.
