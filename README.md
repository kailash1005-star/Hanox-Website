# Hannox Storefront

Mobile-first storefront for **Hannox**, a European seller of compact & mini diesel
excavators. Browse a 6-model range, view detailed product pages, configure the
in-stock **R10** and check out (pickup or flat-rate delivery). All other models are
"request only" — no checkout, no prepayment. UI language is **German**.

Rebuilt in **Next.js (App Router) + TypeScript** from the design handoff in
`Hannox (1)/design_handoff_hannox_store/`. The prototype's single-page React shell
(localStorage routing) was replaced with real file-based routes and a cart context;
the design tokens, layout and interactions are reproduced as specified in the handoff.

## Tech

- **Next.js 16** App Router, **React 19**, **TypeScript** (strict)
- **next/font** for Archivo (display) + Manrope (body)
- Client-side cart via React Context, persisted to `localStorage` (`hannox-cart`)
- All styling in `app/globals.css` (ported verbatim from the handoff `styles.css`)
- No external UI deps; all icons are inline SVG (`components/Icon.tsx`)

## Routes

| Route | Screen |
|---|---|
| `/` | Home (hero, trust strip, categories, spotlight, reviews, newsletter) |
| `/bagger` | Full 6-model grid |
| `/bagger/[id]` | Product detail (gallery + specs + buy/request) |
| `/elektro` | "Coming soon" + notify form |
| `/service` | How buying works (pickup / delivery / parts) |
| `/warenkorb` | Cart |
| `/kasse` | Checkout (fulfilment + details + payment) |
| `/bestellung-bestaetigt` | Order confirmation |

## Project layout

```
app/
  layout.tsx           minimal root layout (html/body + fonts) + globals.css
  (site)/              storefront route group — cart + header/footer chrome
    layout.tsx         CartProvider + Chrome wrapper
    page.tsx, bagger/, elektro/, service/, warenkorb/, kasse/, …
  keystatic/           Keystatic admin UI (lives OUTSIDE (site), so no storefront chrome)
  api/keystatic/       Keystatic route handler
components/
  Icon.tsx           inline SVG icon set
  ui.tsx             Logo, Placeholder, Silhouette, Shot, Gallery, Btn, Stars, Price, StockBadge
  chrome.tsx         TopBar, Header, MenuDrawer, global Toast
  sections.tsx       TrustStrip, Reviews, Newsletter, Footer
  product-card.tsx   ModelCard, ProductRow
  views/             page bodies (Home, Catalog, Electric, About, Product, Cart, Checkout, Confirm)
lib/
  data.ts            catalogue/accessories/categories (reads content/), spec order, helpers
  page-copy.ts       Service + Elektro page copy (reads content/pages/)
  cart.ts(x)         CartProvider + useCart (cart, order, toast)
  nav.ts             useGo() — maps the prototype's go(view, arg) onto real routes
  product-images.generated.json   image manifest (auto-generated; do not edit)
keystatic.config.ts  CMS schema (collections + singletons, storage mode)
content/             CMS-managed content — edit at /keystatic (committed to the repo)
  models/*.json        one file per excavator (catalogue)
  settings/*.json      R10 accessories, homepage categories
  pages/*.json         Service/Über-uns + Elektro page copy
scripts/
  sync-product-images.mjs         scans public/products/ → manifest
public/products/<id>/   product photography per model (see public/products/README.md)
```

## Commands

```bash
npm install
npm run dev          # http://localhost:3000 (runs sync:images first)
npm run build        # runs sync:images first
npm start            # serve the production build
npm run lint
npm run sync:images  # re-scan public/products/ after adding photos
```

## Managing product photos

All photography lives in `public/products/<model-id>/` — one folder per model. Drop
image files in, prefix filenames to set order (`01-…`, `02-…`), and run
`npm run sync:images` (also runs automatically on `dev`/`build`). Models with no
photos fall back to a silhouette. See [public/products/README.md](public/products/README.md).

## Content management (Keystatic CMS)

The Hannox team edits content in a beginner-friendly admin UI at **`/keystatic`**
(start the app, then open http://localhost:3000/keystatic). It's powered by
[Keystatic](https://keystatic.com): no database, no external service — edits are
saved as JSON files under `content/` and committed to the repo.

**What's editable today (Phase 1 scope):**

| In the CMS | Affects | Stored at |
|---|---|---|
| **Bagger (Modelle)** | catalogue: name, class, slogan, price, regular price, in-stock flag, drive, description, all technical specs | `content/models/*.json` |
| **R10 Zubehör** | the R10 configurator accessories + prices | `content/settings/accessories.json` |
| **Kategorien** | homepage category rows and which models they list | `content/settings/categories.json` |
| **Seite: Service & Über uns** | the Service page copy + info cards | `content/pages/service.json` |
| **Seite: Elektro** | the Elektro coming-soon page copy | `content/pages/electric.json` |

How it flows: Keystatic writes the JSON → `lib/data.ts` / `lib/page-copy.ts` import
those files → the storefront renders them. In `npm run dev`, saving in `/keystatic`
hot-reloads the change onto the site immediately.

**Not in the CMS (by design):** product **photos** (managed via `public/products/`
folders, see above), the homepage hero copy, reviews, trust pillars and the
announcement ticker (still in code), and the spec field order. The **in-stock flag**
controls checkout — turning it on for a model makes it purchasable, so use with care.

> **Adding a brand-new model:** the catalogue currently imports the six known model
> files explicitly in `lib/data.ts`. Creating a *new* model in the CMS writes a new
> JSON file but needs a one-line import added there (and a matching `public/products/<id>/`
> photo folder). Editing the existing six needs no code changes.

### Going live for the team (Phase 2)

Today the CMS runs in **`storage: { kind: 'local' }`** — edits write to the local
disk, ideal for previewing on a developer machine. To let the team edit the
**deployed** site:

1. Put this project in a **GitHub repo** and deploy it (e.g. Vercel — supports the
   Node API routes Keystatic needs).
2. In `keystatic.config.ts` switch storage to
   `{ kind: 'github', repo: 'your-org/hannox' }` and set up a Keystatic **GitHub App**
   (or use Keystatic Cloud) so editors sign in and their changes commit/PR to the repo,
   triggering a redeploy. See https://keystatic.com/docs/github-mode.

## Business rule

Only **r10** is `inStock` and may be added to cart / checked out. Every other model
routes to the request form regardless of whether it has photos. This flag is now
editable in the CMS (per-model **Auf Lager** checkbox).

## Notes / before production

- **Checkout is a prototype** — no payment is processed and there is no order backend.
  Wire `placeOrder` (in `lib/cart.tsx`) to a real commerce backend.
- **Photography is placeholder.** `public/products/r13/*` are third-party supplier
  photos used as stand-ins; replace with Hannox's own photography before launch.
  R15/R18/R22/R32 render an SVG silhouette until photos are dropped into their folder.
- The brand CSS variable is historically named `--orange`; the brand colour is the
  CAT-style **yellow** `#ffcd11`. Text/icons on yellow are always black (`--on-brand`).
