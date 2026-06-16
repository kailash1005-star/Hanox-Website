import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal";
import { recordCapture, recordRefund, markOrderStatus, recordWebhookEvent } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * PayPal webhook receiver — the SOURCE OF TRUTH for payment state. PayPal calls
 * this URL server-to-server whenever something happens to a payment, even if the
 * buyer's browser already closed before our capture response landed. It also
 * redelivers on any non-2xx/timeout, so every handler must be idempotent.
 *
 * Setup: register `<your-site>/api/webhooks/paypal` in the PayPal dashboard
 * (Apps & Credentials → your app → Webhooks), subscribe to the events below, and
 * put the Webhook ID in PAYPAL_WEBHOOK_ID. PayPal can't reach localhost — use a
 * tunnel (ngrok/cloudflared) or the PayPal "Webhooks Simulator" for local tests.
 */
/** Shape of the PayPal webhook `resource` fields we read. */
type PaypalResource = {
  id?: string;
  amount?: { value?: string | number; currency_code?: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
  links?: { rel?: string; href?: string }[];
  dispute_id?: string;
};

export async function POST(req: Request) {
  const raw = await req.text();

  // Authenticity check — only act on events PayPal genuinely signed.
  if (process.env.PAYPAL_WEBHOOK_ID) {
    let verified = false;
    try {
      verified = await verifyWebhookSignature(req.headers, raw);
    } catch (e) {
      console.error("PayPal webhook verify error:", e);
    }
    if (!verified) {
      console.warn("PayPal webhook: signature verification FAILED — ignoring.");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
  } else {
    console.warn("PayPal webhook: PAYPAL_WEBHOOK_ID not set — skipping verification (dev only).");
  }

  let event: {
    id?: string;
    event_type?: string;
    resource_type?: string;
    resource?: Record<string, unknown>;
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const type = event.event_type ?? "";
  const eventId = event.id ?? "";
  const resource = (event.resource ?? {}) as PaypalResource;

  // Audit log of every delivery (idempotent on event id). We do NOT early-return
  // on a duplicate: PayPal redelivers when a prior attempt errored, and our
  // handlers below are all idempotent (keyed by capture/refund id, forward-only
  // status), so reprocessing a redelivery is safe and avoids dropping an event
  // whose first attempt failed mid-way. If even this audit write fails, return
  // 503 so PayPal retries rather than us processing without a record.
  let duplicate = false;
  if (eventId) {
    try {
      ({ duplicate } = await recordWebhookEvent(eventId, type, event));
      if (duplicate) console.log(`Webhook ${type} (${eventId}) is a redelivery — reprocessing idempotently.`);
    } catch (e) {
      console.error("recordWebhookEvent failed:", e);
      return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
    }
  }

  // Capture resources carry the originating order id under supplementary_data.
  const orderIdFromCapture: string | undefined =
    resource?.supplementary_data?.related_ids?.order_id;

  try {
    switch (type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = resource?.id as string | undefined;
        if (orderId) await markOrderStatus(orderId, "APPROVED", type);
        break;
      }
      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = orderIdFromCapture;
        if (orderId) {
          await recordCapture({
            paypalOrderId: orderId,
            captureId: String(resource?.id ?? `wh-${eventId}`),
            captureStatus: "COMPLETED",
            capturedAmount: Number(resource?.amount?.value ?? 0),
            capturedCurrency: resource?.amount?.currency_code ?? "EUR",
            raw: resource,
          });
        } else {
          console.warn("Webhook CAPTURE.COMPLETED without related order_id", resource?.id);
        }
        break;
      }
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED": {
        const orderId = orderIdFromCapture;
        if (orderId) {
          await recordCapture({
            paypalOrderId: orderId,
            captureId: String(resource?.id ?? `wh-${eventId}`),
            captureStatus: "DECLINED",
            capturedAmount: Number(resource?.amount?.value ?? 0),
            capturedCurrency: resource?.amount?.currency_code ?? "EUR",
            raw: resource,
          });
        }
        break;
      }
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        // Refund resource: id = refund id, links back to the capture id.
        const captureId: string | undefined =
          resource?.links?.find((l) => l.rel === "up")?.href?.split("/").pop();
        await recordRefund({
          paypalOrderId: orderIdFromCapture,
          captureId,
          refundId: String(resource?.id ?? `wh-${eventId}`),
          amount: Number(resource?.amount?.value ?? 0),
          currency: resource?.amount?.currency_code ?? "EUR",
          raw: resource,
        });
        break;
      }
      case "CUSTOMER.DISPUTE.CREATED":
      case "CUSTOMER.DISPUTE.UPDATED":
        console.warn(`⚠️  Webhook: dispute event ${type} — ${resource?.dispute_id ?? ""}`);
        // Disputes don't change capture state; flagged for the team via logs/alerting.
        break;
      default:
        console.log(`ℹ️  Webhook: unhandled event ${type}`);
    }
  } catch (e) {
    // A processing error: ask PayPal to retry (it will redeliver) rather than
    // silently dropping a real payment event.
    console.error(`Webhook ${type} processing failed:`, e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  // 200 so PayPal marks it delivered.
  return NextResponse.json({ received: true });
}
