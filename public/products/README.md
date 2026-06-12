# Product photos

This is the single place to manage product photography. Each excavator model has
its own folder, named by its **model id** (matches `lib/data.ts`):

```
public/products/
  r10/   01-front.png  02-rear.png  03-side.png  …
  r13/   01.webp  02.webp  03.webp  …
  r15/   (empty — drop photos here)
  r18/   (empty)
  r22/   (empty)
  r32/   (empty)
```

## How to add or replace photos

1. Drop image files into the matching model folder
   (`public/products/<id>/`). Accepted: `.png`, `.jpg/.jpeg`, `.webp`, `.avif`, `.gif`.
2. **Filename = gallery order.** Files are sorted naturally, so prefix them to
   control order: `01-…`, `02-…`, `03-…`. The **first** image is used as the card
   thumbnail and hero/spotlight shot.
3. Run the sync so the site picks them up:

   ```bash
   npm run sync:images
   ```

   (This also runs automatically before `npm run dev` and `npm run build`.)

That's it — the model's product page gallery, catalogue card and any spotlight will
use the new photos. A model with **no** photos in its folder automatically falls
back to the grey silhouette placeholder.

## Notes

- Adding photos does **not** make a model purchasable. Checkout is gated on the
  `inStock` flag in `lib/data.ts` (only `r10`); every other model stays request-only.
- The sync writes `lib/product-images.generated.json`, which the app imports. Do not
  edit that file by hand — re-run `npm run sync:images` instead.
- `r13` photos are third-party supplier placeholders; replace with Hannox's own
  photography before production.
