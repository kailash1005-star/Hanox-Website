# Invoice System — Implementation Plan

**Goal:** When a customer completes a PayPal payment, the **website** must:
1. Persist the order in **MongoDB**.
2. Generate a **gap-free sequential invoice number** (`HX-2026-0001`).
3. Generate a **PDF invoice** (German §14 UStG compliant).
4. Email the buyer their order confirmation **with the PDF invoice attached** (via Resend).

**Decisions already made (by the business):**
- **Buyer name/address** for the invoice comes from **PayPal's payment data** (payer name, email, and shipping address). No extra checkout form. ⚠️ Note: *pickup* orders have no shipping address — fall back to the payer's country/address PayPal returns, and accept that pickup invoices may have a minimal address.
- **VAT:** always charge **19% German VAT** for now. No EU reverse-charge logic yet (can add later via VIES).
- Website (not Odoo) **owns the invoice number** for now. Odoo sync can be added later.

---

## Architecture (flow)

```
Checkout (client)
  └─ POST /api/paypal/orders        → create PayPal order (server-priced)
                                      → SAVE pending order to MongoDB (keyed by paypalOrderId)
  └─ PayPal approval (buyer)
  └─ POST /api/paypal/orders/[id]/capture
        on status COMPLETED (server-side):
          1. load pending order from Mongo by paypalOrderId
          2. extract buyer (name/email/address) from PayPal capture response
          3. mark order PAID
          4. issue gap-free invoice number (atomic counter)   ← idempotent
          5. generate PDF invoice (pdf-lib)
          6. email buyer: confirmation + PDF attachment (Resend)
          7. store invoice record in Mongo
  └─ Webhook /api/webhooks/paypal (PAYMENT.CAPTURE.COMPLETED)
        → BACKUP: if no invoice exists for this paypalOrderId, do steps 4–7
          (idempotent — never issues a second number for the same order)
```

**Why store the pending order at create-time:** the capture route only receives the PayPal
order ID, not the cart. Saving the server-priced lines at create-time means the invoice is
built from authoritative data, never trusted from the client.

**Idempotency (critical):** issuing an invoice must be safe to call twice (capture *and*
webhook may both fire). Enforce a **unique index on `invoices.paypalOrderId`** and check for
an existing invoice before allocating a new number. Never allocate a number you might discard.

**Graceful degradation:** if `MONGODB_URI` is not set, skip persistence + invoice and fall
back to the current plain confirmation email (log a warning). The site must never fail a
payment because the DB/invoice step errored — wrap steps 3–7 in try/catch and always return
success for the capture.

---

## Environment variables (add to Vercel + `.env.local` + `.env.example`)

| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (secret) |
| `MONGODB_DB` | DB name, e.g. `hanox` (optional, default in code) |
| *(existing)* `RESEND_API_KEY`, `EMAIL_FROM` | already configured ✓ |

**Setup task:** create a free **MongoDB Atlas** cluster, a DB user, allow Vercel network
access (`0.0.0.0/0` or Vercel egress IPs), and copy the connection string into `MONGODB_URI`.

---

## MongoDB collections

### `counters` (hands out gap-free numbers)
```jsonc
{ "_id": "invoice-2026", "seq": 12 }
```
Atomic allocation (safe under concurrency):
```js
const r = await db.collection("counters").findOneAndUpdate(
  { _id: `invoice-${year}` },
  { $inc: { seq: 1 } },
  { returnDocument: "after", upsert: true }
);
const number = `HX-${year}-${String(r.seq).padStart(4, "0")}`;
```

### `orders`
```jsonc
{
  "_id": "<paypalOrderId>",          // also the idempotency key
  "status": "created" | "paid",
  "fulfil": "delivery-de",
  "lines": [{ "key": "r10-eco:", "name": "R10 ECO", "unitNet": 5625, "qty": 1 }],
  "itemTotalNet": 562500,            // store money in CENTS (integers)
  "shippingNet": 55000,
  "vatRate": 0.19,
  "vatAmount": 117325,
  "totalGross": 734825,
  "buyer": { "name": "...", "email": "...", "address": { ... } },  // filled at capture
  "paypalCaptureId": "...",
  "createdAt": ISODate, "paidAt": ISODate
}
```
> **Money:** store as integer **cents** to avoid float rounding on invoices. Reuse `euro()`
> from `lib/data.ts` for display only. (Current `priceOrder` returns euros — convert ×100 on
> store, or keep euros consistently but NEVER use floats for arithmetic that must reconcile.)

### `invoices` (immutable once issued)
```jsonc
{
  "_id": ObjectId,
  "invoiceNumber": "HX-2026-0001",
  "paypalOrderId": "...",            // UNIQUE INDEX (idempotency)
  "orderId": "...",
  "issuedAt": ISODate,
  "amountGross": 734825,
  "vatAmount": 117325
  // optional: "pdfBase64" or a storage URL if you keep the PDF
}
```
Create the unique index once: `db.collection("invoices").createIndex({ paypalOrderId: 1 }, { unique: true })`.

---

## Files to create

| File | Responsibility |
|---|---|
| `lib/db.ts` | Cached MongoDB client. Use a **global cached promise** so serverless/hot-reload doesn't open a new connection per request. Export `getDb()`. Returns `null` (or throws a typed "disabled") if `MONGODB_URI` unset. |
| `lib/seller.ts` | mpinger GmbH constants (below) for the invoice header. |
| `lib/orders-store.ts` | `savePendingOrder(paypalOrderId, priced, fulfil)`, `getOrder(id)`, `markPaid(id, buyer, captureId)`. |
| `lib/invoice.ts` | `nextInvoiceNumber(year)` (atomic counter), `buildInvoicePdf(data): Uint8Array` (pdf-lib), `issueInvoice(paypalOrderId)` — orchestrates: idempotency check → number → PDF → email → store. |

### `lib/seller.ts` content (from Impressum — confirmed)
```
mpinger GmbH
Gustav-Schenk-Weg 53
30455 Hannover, Deutschland
Geschäftsführer: Ramkumar Palanisamy
USt-IdNr.: DE290407187
Tel: +49 (0) 511-10554580
E-Mail: info@mpinger.de
```

### PDF library
Use **`pdf-lib`** (pure JS — works on Vercel Node serverless, no headless Chromium, no native
binaries). Build a simple A4 invoice: seller block (top-left), buyer block, invoice number +
date, line-item table, then **net subtotal / shipping / 19% MwSt. / Gesamt (brutto)**, plus a
footer note. Standard Helvetica font is built in.

**§14 UStG mandatory fields to include on the PDF:**
- Full name + address of **seller** (mpinger GmbH) **and buyer**
- Seller **USt-IdNr.** (DE290407187)
- **Invoice number** (the gap-free one) + **invoice date** + delivery/service date
- Quantity + description of each item
- **Net amount, 19% VAT amount, gross total** (VAT shown separately)

---

## Files to modify

### `app/api/paypal/orders/route.ts` (create-order)
After PayPal returns the order ID, **save the pending order** to Mongo:
`await savePendingOrder(data.id, priced, fulfil)`. Wrap in try/catch — if Mongo is down/unset,
log and continue (payment must still work).

### `app/api/paypal/orders/[id]/capture/route.ts` (capture)
After `status === "COMPLETED"`, additionally extract buyer from the capture response:
```js
const payer = data.payer;
const shipping = data.purchase_units?.[0]?.shipping;
const buyer = {
  name: shipping?.name?.full_name
        || [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" "),
  email: payer?.email_address,
  address: shipping?.address ?? payer?.address ?? null,
};
```
Then (try/catch, non-blocking): `await markPaid(id, buyer, captureId); await issueInvoice(id);`
`issueInvoice` builds the PDF and sends the email with the attachment. **Remove** the separate
client-side email call (see checkout change) so the email is sent **once, server-side**.

### `lib/email.ts` (add attachment support)
Resend supports attachments. Extend `sendEmail` with an optional `attachments` param:
```js
attachments?: { filename: string; content: string }[]  // content = base64
// in the POST body to Resend:
attachments: opts.attachments  // [{ filename: "Rechnung-HX-2026-0001.pdf", content: <base64> }]
```
Base64-encode the `Uint8Array` from `buildInvoicePdf`: `Buffer.from(pdfBytes).toString("base64")`.

### `app/api/webhooks/paypal/route.ts` (backup)
In the `PAYMENT.CAPTURE.COMPLETED` case, call `issueInvoice(paypalOrderId)` (idempotent). This
guarantees an invoice even if the browser closed before the client capture call finished.
The `resource.supplementary_data.related_ids.order_id` (or capture's parent order) gives the
PayPal order ID — confirm the exact field from a real webhook payload.

### `components/views/checkout.tsx` (client)
Remove the `fetch("/api/email/order-confirmation", …)` call in `onApprove` — the **capture
route now sends the invoice email server-side**. Keep `placeOrder({ fulfil, total, email })`
and the redirect. (Optionally delete `app/api/email/order-confirmation/route.ts`, or keep it
for non-payment confirmations — but don't double-send.)

### `.env.example`
Add `MONGODB_URI=` and `MONGODB_DB=hanox` with comments.

---

## Build / test checklist
- [ ] `npm install mongodb pdf-lib`
- [ ] Atlas cluster live; `MONGODB_URI` set in `.env.local` + Vercel; unique index on `invoices.paypalOrderId` created.
- [ ] `npm run build` + `npm run lint` green. Routes stay `runtime = "nodejs"`.
- [ ] Sandbox checkout (delivery) → order saved → capture → invoice `HX-2026-0001` → email with PDF attachment arrives → invoice doc stored.
- [ ] Second test → number increments to `HX-2026-0002` (gap-free).
- [ ] Re-fire the same webhook → **no** duplicate invoice/number (idempotency holds).
- [ ] Pickup order → invoice still issues (address may be minimal — acceptable per decision).
- [ ] Unset `MONGODB_URI` → payment still completes, falls back to plain email, logs a warning.
- [ ] PDF opens correctly and shows all §14 UStG fields; amounts match the PayPal capture exactly.

## Out of scope (future)
- EU reverse-charge / VIES VAT-ID validation (currently always 19%).
- Billing-address form at checkout (using PayPal data for now).
- Odoo sync as system-of-record.
- ZUGFeRD/e-Rechnung XML, write-once archival storage (GoBD 10-year retention), Storno flow.
- Customer order-status page.

## Notes for whoever builds this
- Keep all money math in **integer cents**; format with `euro()` only for display/PDF.
- `getDb()` must reuse a cached connection (serverless cold-start friendly).
- All payment side-effects are **best-effort + idempotent**: a failed email or PDF must never
  roll back or fail the captured payment. Log failures for manual follow-up.
