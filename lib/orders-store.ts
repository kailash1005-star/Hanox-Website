/* Order + payment persistence (system of records).
 *
 * Writes to the MongoDB collections the team already uses:
 *   orders         — one document per checkout (CREATED -> PAID)
 *   transactions   — one document per PayPal capture (full raw response kept)
 *   webhook_events — raw PayPal webhook events (audit / idempotency)
 *
 * Invoicing is handled manually in Odoo — this layer only RECORDS data, it does
 * not issue invoice numbers. Money is stored in EUR (matching the existing docs).
 *
 * All functions are best-effort: if MONGODB_URI is unset or the DB is briefly
 * unreachable they must NOT break the payment flow — callers wrap them in
 * try/catch and a failed write is logged, never thrown to the customer.
 *
 * Server-only — never import from client components. */

import type { Document, UpdateFilter } from "mongodb";
import { getDb, isDbConfigured } from "./db";
import type { PricedOrder, Fulfilment } from "./order-pricing";

export type Skip = { skipped: true };
export type Ok = { ok: true };

/** Generate a human order reference, e.g. "HX-MQGIO8TY-1MVL". */
function makeOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HX-${t}-${r}`;
}

export type Buyer = {
  name: string;
  email: string;
  address: { line1?: string; line2?: string; city?: string; postalCode?: string; country?: string } | null;
};

/** Upsert a CREATED order at PayPal order-creation time. Idempotent on paypalOrderId. */
export async function saveCreatedOrder(
  paypalOrderId: string,
  priced: PricedOrder,
  fulfil: Fulfilment
): Promise<Ok | Skip> {
  if (!isDbConfigured()) return { skipped: true };
  const db = await getDb();
  const now = new Date();
  const update = {
    $setOnInsert: {
      orderNumber: makeOrderNumber(),
      createdAt: now,
      status: "CREATED",
    },
    $set: {
      fulfil,
      lines: priced.lines,
      amount: {
        currency: "EUR",
        itemTotalNet: priced.itemTotalNet,
        shippingNet: priced.shippingNet,
        vatRate: priced.vatRate,
        vatAmount: priced.vatAmount,
        totalGross: priced.totalGross,
      },
      "paypal.orderId": paypalOrderId,
      updatedAt: now,
    },
    $push: { events: { type: "created", at: now } },
  };
  await db
    .collection("orders")
    .updateOne({ _id: paypalOrderId as unknown as never }, update as unknown as UpdateFilter<Document>, { upsert: true });
  return { ok: true };
}

/** Mark an order PAID and attach buyer + capture details. Idempotent. */
export async function markOrderPaid(
  paypalOrderId: string,
  opts: { captureId?: string; buyer?: Buyer; captureStatus?: string }
): Promise<Ok | Skip> {
  if (!isDbConfigured()) return { skipped: true };
  const db = await getDb();
  const now = new Date();
  const set: Record<string, unknown> = {
    status: "PAID",
    paidAt: now,
    updatedAt: now,
    "paypal.status": opts.captureStatus ?? "COMPLETED",
  };
  if (opts.captureId) set["paypal.captureId"] = opts.captureId;
  if (opts.buyer) set.customer = opts.buyer;
  const update = { $set: set, $push: { events: { type: "paid", at: now } } };
  await db
    .collection("orders")
    .updateOne({ _id: paypalOrderId as unknown as never }, update as unknown as UpdateFilter<Document>, { upsert: true });
  return { ok: true };
}

/** Record a PayPal capture transaction (full raw response kept). Idempotent on capture id. */
export async function saveTransaction(opts: {
  captureId: string;
  paypalOrderId: string;
  amount: number;
  currency: string;
  status: string;
  raw: unknown;
}): Promise<Ok | Skip> {
  if (!isDbConfigured()) return { skipped: true };
  const db = await getDb();
  await db.collection("transactions").updateOne(
    { _id: opts.captureId as unknown as never },
    {
      $setOnInsert: { createdAt: new Date(), kind: "capture" },
      $set: {
        paypalOrderId: opts.paypalOrderId,
        amount: opts.amount,
        currency: opts.currency,
        status: opts.status,
        raw: opts.raw,
      },
    },
    { upsert: true }
  );
  return { ok: true };
}

/** Persist a raw PayPal webhook event for audit/idempotency. */
export async function saveWebhookEvent(eventType: string, raw: unknown, eventId?: string): Promise<Ok | Skip> {
  if (!isDbConfigured()) return { skipped: true };
  const db = await getDb();
  const doc = { eventType, raw, receivedAt: new Date() };
  if (eventId) {
    await db.collection("webhook_events").updateOne(
      { _id: eventId as unknown as never },
      { $setOnInsert: doc },
      { upsert: true }
    );
  } else {
    await db.collection("webhook_events").insertOne(doc as never);
  }
  return { ok: true };
}

/** Extract buyer details from a PayPal capture/order response. */
export function buyerFromPaypal(data: {
  payer?: { name?: { given_name?: string; surname?: string }; email_address?: string; address?: { country_code?: string } };
  purchase_units?: Array<{ shipping?: { name?: { full_name?: string }; address?: Record<string, string> } }>;
}): Buyer {
  const payer = data.payer;
  const shipping = data.purchase_units?.[0]?.shipping;
  const addr = shipping?.address;
  return {
    name:
      shipping?.name?.full_name ||
      [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ") ||
      "",
    email: payer?.email_address || "",
    address: addr
      ? {
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          city: addr.admin_area_2,
          postalCode: addr.postal_code,
          country: addr.country_code,
        }
      : payer?.address
      ? { country: payer.address.country_code }
      : null,
  };
}
