import { NextResponse } from "next/server";
import { MODELS } from "@/lib/data";
import { priceOrder } from "@/lib/order-pricing";
import {
  createOrderRecord,
  recordCapture,
  recordRefund,
  markOrderStatus,
  recordWebhookEvent,
  getOrder,
} from "@/lib/orders";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY self-test of the storage layer. Delete after verification. */
export async function GET(req: Request) {
  if ((req.headers.get("x-admin-token") || "") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const log: string[] = [];
  const assert = (cond: boolean, msg: string) => log.push(`${cond ? "PASS" : "FAIL"}: ${msg}`);

  const model = MODELS.find((m) => m.inStock);
  if (!model) return NextResponse.json({ error: "no in-stock model" }, { status: 500 });

  const key = `${model.id}:`;
  const priced = priceOrder([{ key, qty: 1 }], "delivery-de");
  const orderId = `SELFTEST-${Date.now()}`;

  // 1) create
  const { orderNumber } = await createOrderRecord({
    paypalOrderId: orderId,
    priced,
    fulfil: "delivery-de",
    customer: { name: "Test Käufer", email: "test@example.com", address: { line1: "Teststr. 1", city: "Berlin", postalCode: "10115", country: "DE" } },
  });
  let o = await getOrder(orderId);
  assert(!!o && o.status === "CREATED", "order created with status CREATED");
  assert(o?.amount.totalGross === priced.totalGross, "pricing snapshot stored");
  assert(!!orderNumber && orderNumber.startsWith("HX-"), "order number generated");

  // 2) capture (correct amount)
  await recordCapture({
    paypalOrderId: orderId,
    captureId: "CAP-1",
    captureStatus: "COMPLETED",
    capturedAmount: priced.totalGross,
    capturedCurrency: "EUR",
    payerEmail: "payer@paypal.com",
  });
  o = await getOrder(orderId);
  assert(o?.status === "COMPLETED", "order COMPLETED after capture");
  assert(!o?.amountMismatch, "no amount mismatch on correct capture");
  assert(o?.paypal.captureId === "CAP-1", "capture id stored");

  // 3) duplicate capture is idempotent (no extra transactions, still COMPLETED)
  await recordCapture({ paypalOrderId: orderId, captureId: "CAP-1", captureStatus: "COMPLETED", capturedAmount: priced.totalGross, capturedCurrency: "EUR" });
  const db = await getDb();
  const capCount = await db.collection<any>("transactions").countDocuments({ _id: "CAP-1" });
  assert(capCount === 1, "duplicate capture stored only once (idempotent)");

  // 4) forward-only: a late APPROVED must NOT downgrade COMPLETED
  await markOrderStatus(orderId, "APPROVED", "CHECKOUT.ORDER.APPROVED");
  o = await getOrder(orderId);
  assert(o?.status === "COMPLETED", "forward-only: late APPROVED did not downgrade COMPLETED");

  // 5) partial refund then remainder → REFUNDED; idempotent on refund id
  const half = Math.round((priced.totalGross / 2) * 100) / 100;
  await recordRefund({ paypalOrderId: orderId, refundId: "REF-1", amount: half, currency: "EUR" });
  o = await getOrder(orderId);
  log.push(`DEBUG half=${half} capturedAmount=${o?.paypal?.capturedAmount} status=${o?.status} refundedTotal=${o?.refundedTotal}`);
  assert(o?.status === "PARTIALLY_REFUNDED", "partial refund → PARTIALLY_REFUNDED");
  await recordRefund({ paypalOrderId: orderId, refundId: "REF-1", amount: half, currency: "EUR" }); // duplicate
  o = await getOrder(orderId);
  assert(o?.refundedTotal === half, "duplicate refund not double-counted");
  await recordRefund({ paypalOrderId: orderId, refundId: "REF-2", amount: priced.totalGross - half, currency: "EUR" });
  o = await getOrder(orderId);
  assert(o?.status === "REFUNDED", "remaining refund → REFUNDED");

  // 6) amount-mismatch detection on a fresh order
  const orderId2 = `SELFTEST-${Date.now()}-B`;
  await createOrderRecord({ paypalOrderId: orderId2, priced, fulfil: "delivery-de", customer: { name: "B", email: "b@example.com", address: { line1: "x", city: "y", postalCode: "1", country: "DE" } } });
  await recordCapture({ paypalOrderId: orderId2, captureId: "CAP-2", captureStatus: "COMPLETED", capturedAmount: priced.totalGross - 100, capturedCurrency: "EUR" });
  const o2 = await getOrder(orderId2);
  assert(o2?.amountMismatch === true && o2?.needsReview === true, "amount mismatch flagged for review");

  // 7) webhook event idempotency
  const e1 = await recordWebhookEvent("EVT-1", "PAYMENT.CAPTURE.COMPLETED", {});
  const e2 = await recordWebhookEvent("EVT-1", "PAYMENT.CAPTURE.COMPLETED", {});
  assert(e1.duplicate === false && e2.duplicate === true, "webhook event id deduped on redelivery");

  // cleanup test docs
  await db.collection<any>("orders").deleteMany({ _id: { $in: [orderId, orderId2] } });
  await db.collection<any>("transactions").deleteMany({ _id: { $in: ["CAP-1", "CAP-2", "REF-1", "REF-2"] } });
  await db.collection<any>("webhook_events").deleteMany({ _id: "EVT-1" });

  const passed = log.every((l) => l.startsWith("PASS"));
  return NextResponse.json({ passed, results: log });
}
