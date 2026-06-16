/* Orders & transactions data-access layer (MongoDB) — server-only.
 *
 * Design goals (production-grade payment storage):
 *  - Idempotent writes. PayPal can call us more than once (capture retry, webhook
 *    redelivery, browser + webhook racing). Every money movement is keyed by a
 *    PayPal-assigned id (capture id / refund id / event id) so duplicates are no-ops.
 *  - The webhook is the source of truth. If the buyer's browser dies after PayPal
 *    approves but before our capture response lands, the webhook still reconciles.
 *  - Status only moves forward. A late, out-of-order event can't downgrade a paid
 *    order back to "created".
 *  - Pricing is snapshotted at create time, so later catalogue price changes never
 *    alter historical orders.
 *
 * Collections:
 *   orders          — one document per checkout (the order's lifecycle + snapshot)
 *   transactions    — one document per money movement (capture/refund), keyed by PayPal id
 *   webhook_events  — every received PayPal event id, for idempotency + audit
 */

import { getDb } from "./db";
import type { Collection } from "mongodb";
import type { PricedOrder, Fulfilment } from "./order-pricing";

export type OrderStatus =
  | "CREATED" // PayPal order created, awaiting buyer approval/capture
  | "APPROVED" // buyer approved (webhook CHECKOUT.ORDER.APPROVED)
  | "COMPLETED" // payment captured successfully
  | "DECLINED" // capture declined/denied
  | "REFUNDED" // fully refunded
  | "PARTIALLY_REFUNDED"
  | "CANCELLED" // buyer cancelled before paying
  | "FAILED"; // capture failed (error)

/** Forward-only ranking. We never overwrite a higher-ranked status with a lower one. */
const STATUS_RANK: Record<OrderStatus, number> = {
  CREATED: 0,
  CANCELLED: 1,
  APPROVED: 1,
  DECLINED: 2,
  FAILED: 2,
  COMPLETED: 3,
  PARTIALLY_REFUNDED: 4,
  REFUNDED: 5,
};

export type CustomerAddress = {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2, e.g. "DE". */
  country: string;
};

export type Customer = {
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
};

export type AmountSnapshot = {
  currency: string;
  itemTotalNet: number;
  shippingNet: number;
  vatRate: number;
  vatAmount: number;
  /** Authoritative gross the buyer must pay. */
  totalGross: number;
};

export type OrderEvent = {
  at: Date;
  type: string;
  note?: string;
};

export type TransactionDoc = {
  /** PayPal-assigned id (capture id or refund id) — the idempotency key. */
  _id: string;
  paypalOrderId: string;
  kind: "capture" | "refund";
  status: string; // PayPal status, e.g. COMPLETED / PENDING / DECLINED
  amount: number;
  currency: string;
  createdAt: Date;
  raw?: unknown;
};

export type WebhookEventDoc = {
  _id: string; // PayPal event id — natural idempotency key
  eventType: string;
  receivedAt: Date;
  raw: unknown;
};

export type OrderDoc = {
  _id: string; // PayPal order id — natural, unique, idempotent key
  orderNumber: string; // human-friendly reference (HX-…)
  status: OrderStatus;
  fulfil: Fulfilment;
  amount: AmountSnapshot;
  lines: PricedOrder["lines"];
  customer: Customer;
  /** Data PayPal returned (payer, shipping, capture id…). Filled progressively. */
  paypal: {
    payerEmail?: string;
    payerName?: string;
    payerId?: string;
    shipping?: unknown;
    captureId?: string;
    capturedAmount?: number;
    capturedCurrency?: string;
  };
  /** True if our snapshot total and PayPal's captured amount disagree — review! */
  amountMismatch?: boolean;
  /** Total refunded so far (EUR). */
  refundedTotal?: number;
  /** Set when an event arrives with no matching prior order data — needs a human. */
  needsReview?: boolean;
  events: OrderEvent[];
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
};

// --- collections + indexes -------------------------------------------------

let indexesReady: Promise<void> | null = null;

async function collections() {
  const db = await getDb();
  const orders = db.collection<OrderDoc>("orders");
  const transactions = db.collection<TransactionDoc>("transactions");
  const webhookEvents = db.collection<WebhookEventDoc>("webhook_events");

  // Ensure indexes once per warm instance (idempotent on Mongo's side anyway).
  if (!indexesReady) {
    indexesReady = Promise.all([
      orders.createIndex({ orderNumber: 1 }, { unique: true }),
      orders.createIndex({ status: 1, createdAt: -1 }),
      orders.createIndex({ "customer.email": 1, createdAt: -1 }),
      orders.createIndex({ "paypal.captureId": 1 }, { sparse: true }),
      transactions.createIndex({ paypalOrderId: 1 }),
      // TTL-free audit log; unique _id (event id) gives idempotency for free.
      webhookEvents.createIndex({ receivedAt: -1 }),
    ])
      .then(() => undefined)
      .catch((e) => {
        // Don't let an index hiccup take down a payment write; just log + retry next time.
        console.error("orders: ensureIndexes failed", e);
        indexesReady = null;
      });
  }
  return { orders, transactions, webhookEvents };
}

// --- helpers ---------------------------------------------------------------

/** Short, human-friendly, collision-resistant order reference. */
export function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HX-${t}-${r}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Compare two money amounts with a tolerance for float noise. */
function amountsDiffer(a: number, b: number): boolean {
  return Math.abs(round2(a) - round2(b)) > 0.005;
}

// --- writes ----------------------------------------------------------------

/**
 * Persist a freshly-created PayPal order with its server-authoritative pricing
 * snapshot and the on-site customer details. Idempotent on the PayPal order id.
 */
export async function createOrderRecord(args: {
  paypalOrderId: string;
  priced: PricedOrder;
  fulfil: Fulfilment;
  customer: Customer;
}): Promise<{ orderNumber: string }> {
  const { orders } = await collections();
  const now = new Date();
  const orderNumber = generateOrderNumber();

  const amount: AmountSnapshot = {
    currency: "EUR",
    itemTotalNet: args.priced.itemTotalNet,
    shippingNet: args.priced.shippingNet,
    vatRate: args.priced.vatRate,
    vatAmount: args.priced.vatAmount,
    totalGross: args.priced.totalGross,
  };

  // Upsert: if a capture/webhook somehow raced ahead and created a stub, fill in
  // the snapshot without clobbering a more advanced status.
  await orders.updateOne(
    { _id: args.paypalOrderId },
    {
      $setOnInsert: {
        _id: args.paypalOrderId,
        orderNumber,
        status: "CREATED" as OrderStatus,
        createdAt: now,
        paypal: {},
        events: [{ at: now, type: "ORDER_CREATED" }],
      },
      $set: {
        fulfil: args.fulfil,
        amount,
        lines: args.priced.lines,
        customer: args.customer,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  const doc = await orders.findOne({ _id: args.paypalOrderId }, { projection: { orderNumber: 1 } });
  return { orderNumber: doc?.orderNumber ?? orderNumber };
}

/** Internal: push a status transition that only moves forward. */
async function applyStatus(
  orders: Collection<OrderDoc>,
  paypalOrderId: string,
  next: OrderStatus,
  event: OrderEvent,
  extraSet: Partial<OrderDoc> = {}
) {
  const existing = await orders.findOne({ _id: paypalOrderId }, { projection: { status: 1 } });
  const keepStatus = existing && STATUS_RANK[existing.status] > STATUS_RANK[next];
  const now = new Date();

  // `needsReview` must live in exactly one operator (Mongo rejects a path in both
  // $set and $setOnInsert). A brand-new stub created by an out-of-order event has
  // no pricing snapshot → needs review; an explicit extraSet flag takes priority.
  const set: Record<string, unknown> = {
    ...(keepStatus ? {} : { status: next }),
    ...extraSet,
    updatedAt: now,
  };
  if (!("needsReview" in set) && !existing) set.needsReview = true;

  await orders.updateOne(
    { _id: paypalOrderId },
    {
      $setOnInsert: { _id: paypalOrderId, createdAt: now },
      $set: set,
      $push: { events: event },
    },
    { upsert: true }
  );
}

/**
 * Record the result of capturing a PayPal order. Stores the capture id, payer +
 * shipping data PayPal returned, and flags any amount mismatch vs. our snapshot.
 * Idempotent: the transaction is keyed by the PayPal capture id.
 */
export async function recordCapture(args: {
  paypalOrderId: string;
  captureId: string;
  captureStatus: string; // COMPLETED / PENDING / DECLINED …
  capturedAmount: number;
  capturedCurrency: string;
  payerEmail?: string;
  payerName?: string;
  payerId?: string;
  shipping?: unknown;
  raw?: unknown;
}): Promise<void> {
  const { orders, transactions } = await collections();
  const now = new Date();

  // Idempotent transaction record (no-op on redelivery).
  await transactions.updateOne(
    { _id: args.captureId },
    {
      $setOnInsert: {
        _id: args.captureId,
        paypalOrderId: args.paypalOrderId,
        kind: "capture",
        status: args.captureStatus,
        amount: args.capturedAmount,
        currency: args.capturedCurrency,
        createdAt: now,
        raw: args.raw,
      },
    },
    { upsert: true }
  );

  const order = await orders.findOne({ _id: args.paypalOrderId }, { projection: { amount: 1 } });
  const expected = order?.amount?.totalGross;
  const mismatch =
    typeof expected === "number" ? amountsDiffer(expected, args.capturedAmount) : false;

  const completed = args.captureStatus === "COMPLETED";
  const next: OrderStatus = completed ? "COMPLETED" : args.captureStatus === "PENDING" ? "APPROVED" : "DECLINED";

  await applyStatus(
    orders,
    args.paypalOrderId,
    next,
    {
      at: now,
      type: `CAPTURE_${args.captureStatus}`,
      note: mismatch ? `Amount mismatch: expected ${expected} got ${args.capturedAmount}` : undefined,
    },
    {
      "paypal.captureId": args.captureId,
      "paypal.capturedAmount": args.capturedAmount,
      "paypal.capturedCurrency": args.capturedCurrency,
      "paypal.payerEmail": args.payerEmail,
      "paypal.payerName": args.payerName,
      "paypal.payerId": args.payerId,
      "paypal.shipping": args.shipping,
      ...(mismatch ? { amountMismatch: true, needsReview: true } : {}),
      ...(completed ? { paidAt: now } : {}),
    } as Partial<OrderDoc>
  );
}

/**
 * Record a refund (full or partial). Idempotent on the PayPal refund id. Marks
 * the order REFUNDED or PARTIALLY_REFUNDED by comparing the running refund total
 * against the captured amount.
 */
export async function recordRefund(args: {
  paypalOrderId?: string;
  captureId?: string;
  refundId: string;
  amount: number;
  currency: string;
  raw?: unknown;
}): Promise<void> {
  const { orders, transactions } = await collections();
  const now = new Date();

  // Resolve the order: prefer explicit order id, else look up by capture id.
  let order: OrderDoc | null = null;
  if (args.paypalOrderId) {
    order = await orders.findOne({ _id: args.paypalOrderId });
  } else if (args.captureId) {
    order = await orders.findOne({ "paypal.captureId": args.captureId });
  }
  const paypalOrderId = order?._id ?? args.paypalOrderId;

  // First-seen guard for idempotency: only add to refundedTotal once per refund id.
  const seen = await transactions.findOne({ _id: args.refundId }, { projection: { _id: 1 } });
  await transactions.updateOne(
    { _id: args.refundId },
    {
      $setOnInsert: {
        _id: args.refundId,
        paypalOrderId: paypalOrderId ?? "UNKNOWN",
        kind: "refund",
        status: "COMPLETED",
        amount: args.amount,
        currency: args.currency,
        createdAt: now,
        raw: args.raw,
      },
    },
    { upsert: true }
  );

  if (!paypalOrderId) {
    console.warn("recordRefund: no matching order for refund", args.refundId);
    return;
  }
  if (seen) return; // already counted this refund

  const capturedTotal = order?.paypal?.capturedAmount ?? order?.amount?.totalGross ?? 0;
  const refundedTotal = round2((order?.refundedTotal ?? 0) + args.amount);
  const fullyRefunded = capturedTotal > 0 && !amountsDiffer(refundedTotal, capturedTotal);

  await applyStatus(
    orders,
    paypalOrderId,
    fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
    { at: now, type: "REFUND", note: `Refunded ${args.amount} ${args.currency} (total ${refundedTotal})` },
    { refundedTotal, refundedAt: now } as Partial<OrderDoc>
  );
}

/** Mark a simple status transition from a webhook (approved/declined/cancelled). */
export async function markOrderStatus(
  paypalOrderId: string,
  status: OrderStatus,
  eventType: string
): Promise<void> {
  const { orders } = await collections();
  await applyStatus(orders, paypalOrderId, status, {
    at: new Date(),
    type: eventType,
  });
}

// --- webhook idempotency ---------------------------------------------------

/**
 * Atomically record a PayPal webhook event id. Returns { duplicate: true } if we
 * have already seen this event id (PayPal redelivers on any non-2xx / timeout),
 * so the caller can skip re-processing.
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  raw: unknown
): Promise<{ duplicate: boolean }> {
  const { webhookEvents } = await collections();
  const res = await webhookEvents.updateOne(
    { _id: eventId },
    {
      $setOnInsert: {
        _id: eventId,
        eventType,
        receivedAt: new Date(),
        raw,
      },
    },
    { upsert: true }
  );
  return { duplicate: res.upsertedCount === 0 };
}

// --- reads (admin) ---------------------------------------------------------

export async function listOrders(opts: {
  limit?: number;
  status?: OrderStatus;
  email?: string;
} = {}): Promise<OrderDoc[]> {
  const { orders } = await collections();
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  if (opts.email) filter["customer.email"] = opts.email;
  return orders
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(opts.limit ?? 100, 500))
    .toArray();
}

export async function getOrder(paypalOrderId: string): Promise<OrderDoc | null> {
  const { orders } = await collections();
  return orders.findOne({ _id: paypalOrderId });
}
