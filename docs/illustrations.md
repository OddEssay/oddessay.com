# Generated food illustrations

## Manifest

Created with the built-in image-generation tool on 7 September 2026 from the supplied iCloud Photos share. Assets live in `src/assets/restaurants/manifest/`. `original.heic` is the untouched downloaded camera original (813,236 bytes, matching iCloud's reported size; verified as HEIF/HEVC). Its archived bytes match the downloaded source by SHA-256: `98fb76fa3baba37a6a3e2c55f34794c52b993bb3eb7e4212d9cce58fb6120f76`. iCloud's opaque checksum was not independently interpreted.

`photo.png` is the full-resolution 2464 × 2464 sRGB PNG prepared with `pnpm photo:prepare`, using macOS sips to decode the HEIC before normalization. `generation-reference.png` is a proportional 2048 × 2048 PNG prepared with Sharp, with no crop, for inspection and generation. The photo reveal uses `photo.png`. The selected illustration is `cover-v1.png`; the style-only reference is `src/assets/restaurants/garden-table.png`. The cover was inspected for square framing, plate edges, food placement and pencil/charcoal texture.

Prompt:

> Use case: style-transfer. Reference 1 is the subject/composition photograph of a plated dish at Manifest; reference 2 is STYLE ONLY. Transform reference 1 into hand-drawn black pencil and charcoal linework with a light monochrome wash on warm white paper, matching only the medium and texture of reference 2. Preserve reference 1's subject, all objects, composition, camera perspective, proportions, framing and square 1:1 aspect ratio. Keep object edges and landmarks aligned so this illustration can crossfade to the original photograph. Preserve the large pale ceramic plate filling the frame, the overlapping slices of meat in the center and lower center, the dark blackberries on and behind the meat, the round glazed pastry at upper left of center, the small pale vegetable pieces beside the meat, and the sauce and irregular herb puree around the food. Preserve the cropped glass at upper left and wine-glass base at upper right and the narrow areas of tabletop at the edges. Render with expressive visible pencil and charcoal strokes, delicate monochrome wash and warm paper texture. Add no objects, text, logos or decorative borders. Do not import any subjects or composition from reference 2. Match reference 1's exact framing and relative placements.

## Hawksmoor

Created with the built-in image-generation tool on 6 September 2026 from the supplied iCloud photo. Assets live in `src/assets/restaurants/hawksmoor/`: `original.dng` is the untouched camera original; `icloud-full.jpeg` is iCloud's full-resolution rendered JPEG; `photo.png` is its normalized 8064 × 6048 sRGB PNG. Both archives match independent downloads byte-for-byte and match iCloud's reported file sizes. Original DNG SHA-256: `bc21941ceac13273343b66ca75c5e23a5589ec6433296121783bc14b315f2725`; rendered JPEG SHA-256: `4a438bc12275c9f4d81c84e5906032de2bfe2c0e513c1fd1147e703a683b0dab`. The illustration is `cover-v1.png`; the style-only reference is `src/assets/restaurants/garden-table.png`.

The full-resolution PNG exceeded the inspection tool's transfer limit. `generation-reference.png` is a 2048 × 1536 copy prepared with Sharp's proportional inside resize, with no crop, for inspection and generation. The photo reveal uses the full-resolution `photo.png`; Astro generates the web assets at build time.

Prompt:

> Use case: style-transfer. Reference 1 is the subject/composition photograph of a Sunday roast at Hawksmoor; reference 2 is STYLE ONLY. Transform reference 1 into hand-drawn black pencil and charcoal linework with a light monochrome wash on warm white paper, matching only the medium and texture of reference 2. Preserve reference 1's subject, all objects, composition, camera perspective, proportions, framing and 4:3 aspect ratio. Keep object edges and landmarks aligned so the illustration can crossfade to the original photograph. Preserve the large pale plate filling the foreground, sliced roast beef on left, carrots in center, two roast potatoes at bottom center and right, enormous Yorkshire pudding at upper center-right, cabbage behind the beef and halved roast garlic beside the pudding. Preserve the small dark side-dish pans and their plates in the upper left and right corners, cropped background plate along the top, and the wooden tabletop. Render everything with visible hand-drawn pencil and charcoal strokes and delicate monochrome wash on warm white paper. Add no objects, text, logos or decorative borders. Do not import any vegetables, bread or background arrangement from reference 2. Match the exact framing and relative placements of reference 1.

## Bistro Lao

Created with the built-in image-generation tool on 6 September 2026 from the supplied restaurant photograph. Saved to `src/assets/restaurants/bistro-lao/cover-v1.png`. Composition reference: `src/assets/restaurants/bistro-lao/photo.png`; style-only reference: `src/assets/restaurants/garden-table.png`. The camera original is preserved byte-for-byte at `src/assets/restaurants/bistro-lao/original.jpeg`.

Prompt:

> Use case: style-transfer. Transform reference 1 (Bistro Lao prepared photograph, subject/composition reference) into hand-drawn black pencil and charcoal linework with a light monochrome wash on warm white paper, matching ONLY the medium and texture of reference 2 (style-only illustration). Preserve reference 1's subject, objects, composition, camera perspective, proportions, framing and approximately 16:9 aspect ratio. Keep object edges and landmarks aligned so this illustration can crossfade to the original photograph. Preserve the cropped large noodle soup bowl at left, central round bamboo platter with five small metal bowls surrounding dark food pieces, leaf-wrapped food at lower right of that platter, rectangular papaya salad plate on right with cabbage and lettuce below, empty crockery at top and cropped at bottom, bottle at upper right, background bag and cutlery at edges. Maintain exact locations, scale and cropping. Render the entire scene in expressive pencil and charcoal strokes, delicate monochrome wash and warm paper texture. Add no objects, text, logos or decorative borders. Do not borrow any subjects or scene composition from reference 2.

## Fictional sample illustrations

Created with the built-in image generation tool on 6 September 2026. All three illustrate fictional sample restaurants and do not depict actual dishes or venues. These historical assets are retained as illustration provenance; Garden Table remains the cover skill’s style reference. Original PNGs live in the paths below; Astro produces optimized local WebP versions during the build.

## Garden Table

Saved to `src/assets/restaurants/garden-table.png`.

Prompt:

> Create a single landscape food illustration for a fictional restaurant card on a personal notebook website. Black pencil and charcoal linework on warm white paper, light monochrome ink wash, hand drawn editorial still life: a ceramic bowl of seasonal vegetables, beans and leafy greens with bread beside it. Wide balanced composition, no text, no logos. Use case illustration-story. Save the generated asset.

## Little Plates

Saved to `src/assets/restaurants/little-plates.png`.

Prompt:

> Use case illustration-story. Generate a landscape editorial food illustration for a fictional restaurant on a personal notebook website. Hand drawn black pencil and charcoal with a delicate monochrome wash on warm white paper. Subject: three small ceramic plates of roasted peppers, spiced potatoes and olives, with a glass of wine. Relaxed table still life, generous space, no text or logos.

## Pepper Yard

Saved to `src/assets/restaurants/pepper-yard.png`.

Prompt:

> Use case illustration-story. Landscape food illustration for a fictional Bristol restaurant card on a personal notebook website. Hand drawn black pencil and charcoal with light monochrome wash on warm white paper. A bowl of spicy noodles with mushrooms and chillies, chopsticks resting beside the bowl and a small glass of beer. Editorial still life, generous space, no text, no logos.
