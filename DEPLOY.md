# Deployment — Hanox (Vercel + one.com domain)

The app runs on **Vercel** (Frankfurt/EU region, set in `vercel.json`). The domain
**hanox-baumaschinen.de** stays registered at **one.com** — we only point its DNS at
Vercel. Secrets live in Vercel's env settings, never in the repo (`.env.local` is
git-ignored).

## 1. Push code to GitHub
Repo: https://github.com/kailash1005-star/Hanox-Website (already pushed).
Future changes: commit + push → Vercel auto-deploys.

## 2. Import into Vercel
1. vercel.com → **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build/output: defaults.
3. Region is already pinned to **fra1 (Frankfurt)** via `vercel.json`.
4. Deploy → you get a `…vercel.app` **staging** URL. Keep it private until launch
   (Vercel → Settings → Deployment Protection) since the legal pages aren't ready.

## 3. Environment variables (Vercel → Settings → Environment Variables)
| Name | Value | Secret? |
|---|---|---|
| `PAYPAL_ENV` | `sandbox` (→ `live` at go-live) | no |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Client ID | no (public) |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | **yes** |
| `PAYPAL_WEBHOOK_ID` | from the registered webhook (step 5) | yes |
| `NEXT_PUBLIC_SITE_URL` | `https://hanox-baumaschinen.de` | no |

Redeploy after changing env vars.

## 4. Connect the domain (DNS at one.com)
1. Vercel → Project → **Settings → Domains** → add `hanox-baumaschinen.de` (and `www`).
2. Vercel shows the exact records. In the **one.com control panel → DNS settings**, add:
   - `A` record `@` → the IP Vercel shows (e.g. `76.76.21.21`), **or** the CNAME Vercel gives.
   - `CNAME` `www` → `cname.vercel-dns.com`.
3. Wait for DNS to propagate; Vercel issues HTTPS automatically.

## 5. PayPal webhook (now there is a public URL)
1. developer.paypal.com → your app → **Webhooks → Add**.
2. URL: `https://hanox-baumaschinen.de/api/webhooks/paypal`
3. Subscribe: payment capture **completed / denied / refunded**, and **dispute** events.
4. Copy the **Webhook ID** → set `PAYPAL_WEBHOOK_ID` in Vercel → redeploy.

## 6. CMS for the team (production)
Local Keystatic can't write files on Vercel's read-only filesystem. Switch
`keystatic.config.ts` storage to GitHub mode and set up a Keystatic GitHub App:
`storage: { kind: 'github', repo: 'kailash1005-star/Hanox-Website' }`.
Then the team edits at `/keystatic` → changes commit to the repo → auto-redeploy.

## 7. Before going PUBLIC (legal — required for a German shop)
- [ ] **Impressum**, **Datenschutzerklärung** (GDPR), **AGB**, **Widerrufsbelehrung**
- [ ] Real phone + email (replace `+49 (0) 000 000 000` / `info@hanox.de` placeholders)
- [ ] Cookie/consent banner if analytics are added
- [ ] Replace the "HANNOX" hero photo (brand is now **Hanox**)
- [ ] Confirm VAT handling with a tax advisor (currently flat 19%)

## 8. Go live with real money (single PayPal login)
1. Create the **LIVE** PayPal app → live Client ID + Secret.
2. Register the **LIVE** webhook → live Webhook ID.
3. Set Vercel env to the live values + `PAYPAL_ENV=live` → redeploy.
4. Run one final real test, then remove deployment protection to make the site public.
