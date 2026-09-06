# Restaurant image pipeline

Camera original → prepared PNG → illustrated PNG → Astro WebP assets.

Keep the camera file byte-for-byte. Run this authoring command from the project root:

```sh
pnpm photo:prepare src/assets/restaurants/bistro-lao.jpeg src/assets/restaurants/bistro-lao/photo.png
```

The script decodes the primary still image, applies EXIF orientation, converts to sRGB and removes metadata, including GPS and auxiliary image data. It preserves full resolution and framing. The current iPhone JPEG contains an HDR gain map that the image-generation service detected as unsupported MPO; the prepared PNG provides a standard SDR image for generation and the photo reveal.

Sharp handles JPEG/MPO and PNG. For HEIC/HEIF files that Sharp cannot decode, the script uses Apple's `sips` on macOS, then normalizes that result with Sharp. On other systems, HEIC requires a Sharp/libvips installation with a suitable decoder or a JPEG export from Photos. Conversion failures leave the source intact. Identical output is reusable; a different existing output is rejected, so use `photo-v2.png` for a changed source.

The restaurant-cover skill uses the prepared PNG as its composition reference and saves the camera original as `src/assets/restaurants/<slug>/original.<ext>`. It saves generated illustrations as `cover-v1.png`, increasing the version for regenerations. The Markdown `image` field references the cover; `originalImage` references the prepared photo, each with its own alt text.

Astro's existing image components resize and encode the referenced PNGs as WebP during builds. The source archive and preparation command are authoring inputs; CI only needs the committed prepared and illustrated assets. Full-resolution PNGs are intermediate assets, not the files served to readers.

## iCloud Photos shares and RAW originals

A `share.icloud.com/photos/<share-id>` link is a supplied photo source. Retrieve its files before asking for another upload. The landing HTML is a JavaScript application, not an image; a failed text fetch does not establish that the share has expired. Use an available browser's download action or the public sharing API. Use normal network approval when sandbox access fails.

The following read-only API flow worked for the Hawksmoor share on 6 September 2026. Treat it as a retrieval recipe, not a stable Apple API contract; inspect responses and stop if the share is expired, requires unavailable login, or its format has changed.

1. POST JSON `{"shortGUIDs":[{"value":"<share-id>"}]}` to `https://ckdatabasews.icloud.com/database/1/com.apple.photos.cloud/production/public/records/resolve` with `Content-Type: text/plain`.
2. The selected result provides `zoneID` and, for an accessible anonymous share, `anonymousPublicAccess.databasePartition` and `.token`. POST to that returned partition's `/database/1/com.apple.photos.cloud/production/shared/records/query`, passing the token as URL-encoded `publicAccessAuthToken`. The request body is `{"zoneID": <returned-zone>, "query": {"recordType":"CPLAssetAndMasterByAssetDateWithoutHiddenOrDeleted"}, "resultsLimit":10}`. Inspect pagination/continuation before assuming all assets were returned. If several photos are present and the requested subject is ambiguous, ask which to use.
3. Inspect the `CPLMaster` fields. `resOriginalRes.value.downloadURL` identifies the source file; `resOriginalFileType` identifies its format. `resJPEGFullRes` can supply a full-resolution rendered JPEG alongside a RAW original. Use returned URLs, replacing a literal `${f}` filename placeholder if present. Do not use the share's `previewData` thumbnail as the original.

Keep responses and signed download URLs in temporary files. They can contain access tokens, sharing keys and personal metadata; inspect selected field names, formats, dimensions and sizes rather than dumping entire responses. Pass URLs through a curl config file or structured HTTP request, not shell interpolation. Do not commit these responses or URLs.

Preserve a downloaded DNG as `original.dng` and its iCloud-rendered JPEG as `icloud-full.jpeg`. Run `photo:prepare` on the JPEG to obtain `photo.png`; the current converter does not promise RAW development. Record this derivation rather than describing the JPEG or PNG as the untouched camera original.

For local sources, compare source and archived SHA-256 hashes. For downloads, verify the returned file size and type; compare the archived bytes/hash with the downloaded source. A second independent download can establish matching bytes when no understood checksum is available. iCloud's `fileChecksum` is opaque: do not guess its algorithm or claim to have verified it as SHA-1/SHA-256. Record local SHA-256 hashes and what was actually compared. Reuse identical archives; version different contents instead of overwriting.

## Oversized generation references

Check size and dimensions before displaying a full-resolution PNG. The 8064 × 6048 Hawksmoor PNG was about 83 MB and exceeded the tool transport limit when `view_image` was returned through `functions.exec`. Such a failure is not image corruption.

Keep `photo.png` at full resolution for the photo reveal. Use Sharp to create a separate `generation-reference.png` with a 2048-pixel maximum edge, `fit: 'inside'` and `withoutEnlargement: true`, preserving aspect ratio with no crop. This is deterministic input preparation; illustration generation still uses the built-in image-generation tool. Inspect the smaller PNG and pass that exact inspected file as the subject/composition reference. Version the reference when its source changes, and record the relationship to the full-resolution photo.

## Content checks and live reload

The current schema and collection loader are authoritative: `src/lib/restaurant-schema.ts` and `src/content.config.ts`. Metadata still needs to validate even though files, cities and tag filters are discovered automatically. A cover-only task should identify a missing required field without rewriting unrelated metadata or copied review prose.

When the running dev server rejects a file that passes a fresh `pnpm check`, compare the exact error and the current served page. Refreshing the content configuration restored Hawksmoor after a dev-server-only rejection; an older schema was suspected. Refresh/restart the relevant dev server when needed rather than changing already-valid frontmatter. Touching an unchanged config did not reliably refresh it. Normal Markdown additions and edits should not need a restart.

Run checks and builds sequentially. If browser verification is needed, use `pnpm test:browser`: it owns an isolated temporary project and content cache. Starting another dev server over the working project's `.astro` directory caused competing writes and misleading reload/image errors. The photo reveal is activated by the underlined caption; there is no separate Show photo control to add or restore.
