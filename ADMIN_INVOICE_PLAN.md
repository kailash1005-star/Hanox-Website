# Admin + Invoice Numbering Plan (for approval)

> Builds on the dev's existing MongoDB collections (`orders`, `transactions`,
> `webhook_events`). Adds gap-free invoice numbering shared by **online + offline**
> sales, and a domain-restricted `/admin` screen. **PDF generation is deferred.**

## Decisions locked
- **One** gap-free sequential invoice number across all channels.
- `/admin` login: only **`@hanox-baumaschinen.de`** users (see Auth prerequisite below).
- No one ever types an invoice number — the system is the sole issuer.
- Money stored as **integer cents** (see "Money" — needs alignment with dev's current floats).

---

## 1. Core principle (the rule everything depends on)
Both paths call the **same** `allocateInvoiceNumber(year)` (atomic `$inc` on `counters`):
- **Online:** PayPal capture → auto-issue next number (idempotent).
- **Offline:** staff use `/admin` → "Record offline invoice" → next number in the same sequence.

Numbers run in **recording order**, not sale-date order. Gap-free and legally valid.
Offline sales must be **entered into `/admin`** to get their number (don't hand-write numbers).

---

## 2. Authentication — domain-restricted SSO

**Library:** Auth.js (NextAuth v5) with the **Google** provider. JWT sessions (no session DB).

**Restriction:** a `signIn` callback rejects any login whose verified email does **not** end
in `@hanox-baumaschinen.de`. Optionally also pass Google's `hd` hint. Result: only company
staff get in; every action is attributable to a real person.

**⚠️ PREREQUISITE / FORK:**
- **(A)** If `hanox-baumaschinen.de` **is a Google Workspace domain** → Google SSO works as
  above. *(Preferred.)*
- **(B)** If it is **not** (likely, given inbound email is off) → two fallbacks:
  - **B1 — Explicit allowlist:** keep Google sign-in, but allow a fixed list of approved
    Google emails (e.g. the owners' Gmail/Workspace accounts) via an `ADMIN_ALLOWLIST` env.
    Ship now, no Workspace needed.
  - **B2 — Set up Google Workspace** for the domain first, then use (A).
- **Interim:** the `ADMIN_TOKEN` you generated can gate `/admin` for the very first build,
  swapped for SSO once the fork above is decided.

**New env:** `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`ADMIN_ALLOWED_DOMAIN=hanox-baumaschinen.de` (and/or `ADMIN_ALLOWLIST=` for B1).

---

## 3. Data model (additions; reuse existing collections)

### `counters`
```jsonc
{ "_id": "invoice-2026", "seq": 0 }   // atomic $inc → next number
```

### `invoices` (immutable once issued)
```jsonc
{
  "_id": ObjectId,
  "invoiceNumber": "HX-2026-0001",
  "year": 2026,
  "source": "online" | "offline",
  "orderId": "<orders._id>",          // online only; UNIQUE (idempotency)
  "buyer": { "name", "email", "address" },
  "lines": [{ "name", "unitNetCents", "qty" }],
  "itemTotalNetCents", "shippingNetCents", "vatRate", "vatAmountCents", "totalGrossCents",
  "type": "invoice" | "storno",
  "canceledByInvoiceId": ObjectId | null,
  "issuedAt": ISODate,
  "issuedBy": "staff@hanox-baumaschinen.de"
}
```
Indexes: `{ invoiceNumber: 1 } unique`, `{ orderId: 1 } unique sparse`, `{ year:1, invoiceNumber:1 }`.

### `audit_log` (append-only, GoBD)
```jsonc
{ "_id", "action", "entity", "entityId", "actor", "at", "meta" }
```

---

## 4. Numbering engine (`lib/invoice/number.ts`)
```js
// atomic, concurrency-safe, gap-free
async function allocateInvoiceNumber(year) {
  const r = await db.collection("counters").findOneAndUpdate(
    { _id: `invoice-${year}` }, { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true });
  return `HX-${year}-${String(r.seq).padStart(4, "0")}`;
}
```
- `issueInvoiceForOrder(orderId)` — online; **idempotent** (unique `orderId`; if an invoice
  already exists, return it, never allocate again). Called from PayPal capture + webhook backup.
- `recordOfflineInvoice(payload, staffEmail)` — offline; allocates next number, writes invoice + audit.
- `cancelInvoice(id, staffEmail)` — issues a **Storno** (takes the next number); never deletes/edits.

---

## 5. API routes
- `app/api/admin/**` — all guarded by a shared `requireAdmin()` (valid session + domain/allowlist check). Endpoints: list orders/invoices, get detail, **record offline invoice**, **cancel→storno**.
- Wire **PayPal capture** (`app/api/paypal/orders/[id]/capture/route.ts`) → after `COMPLETED`,
  call `issueInvoiceForOrder(orderId)` (try/catch, non-blocking — never fail a captured payment).
- Webhook (`/api/webhooks/paypal`) → same idempotent call as backup; also persist into `webhook_events`.

## 6. Admin UI (`app/(admin)/admin`, SSO-gated)
- Sign-in page (Google) → blocked if wrong domain.
- **Orders + invoices list** (search by email/number, filter by status).
- **Detail view** (order + linked invoice + transaction).
- **Record offline invoice** form (buyer, line items, amounts → allocates next number).
- **Cancel → Storno** action.
- **Audit log** viewer.

## 7. Money
Dev currently stores **floats** in `orders.amount` (e.g. `6604.5`). For legal invoices we
want **integer cents**. **Coordination needed:** either (a) migrate the model to cents, or
(b) standardize on euros everywhere with rounding rules. Recommend **cents**; align with dev
before building so we don't run two conventions.

---

## Files to create / modify
- **New:** `lib/db.ts` *(already added)*, `lib/invoice/number.ts`, `lib/invoice/issue.ts`,
  `lib/orders-store.ts`, `lib/auth.ts` (Auth.js config), `app/api/auth/[...nextauth]/route.ts`,
  `app/api/admin/**`, `app/(admin)/admin/**`, `lib/admin-guard.ts`.
- **Modify:** PayPal capture route, webhook route, `.env.example` (auth vars), `package.json`
  (add `next-auth`).
- **Reuse:** `priceOrder` (`lib/order-pricing.ts`), existing collections.

## Phasing
1. Numbering engine (`counters` + `invoices` + idempotent online issue wired into capture).
2. `/admin` auth (Google + domain restriction) + list/detail + record-offline + storno + audit.
3. (Later) PDF generation + email attachment; Odoo number import.

## Test checklist
- [ ] Online sandbox checkout → order PAID → invoice `HX-2026-0001` issued; re-fire webhook → no duplicate.
- [ ] Record offline invoice in `/admin` → gets `HX-2026-0002` (same sequence).
- [ ] Concurrent online+offline issue → no gap/duplicate.
- [ ] Non-`@hanox-baumaschinen.de` Google account → login denied.
- [ ] Cancel an invoice → Storno takes next number; original untouched.
- [ ] `MONGODB_URI` unset → payment still completes (graceful), logs warning.
- [ ] `npm run build` + `lint` green; admin routes `runtime="nodejs"`.

## Prerequisites (you / dev)
1. **Decide the Auth fork** (A Workspace SSO / B1 allowlist / B2 set up Workspace).
2. Google OAuth client (Client ID + Secret) created in Google Cloud Console.
3. `AUTH_SECRET` generated; all auth env vars set in `.env.local` + Vercel.
4. Agree **money convention** (cents recommended) with the dev.
5. Confirm Odoo will **import** these invoice numbers, not generate its own.

## Out of scope (now)
PDF/e-Rechnung, ZUGFeRD, OSS/reverse-charge, Odoo live sync, write-once archival storage.
