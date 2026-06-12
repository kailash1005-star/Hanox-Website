import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * PayPal webhook receiver. PayPal calls this URL (server-to-server) whenever
 * something happens to a payment — even if the buyer's browser already left.
 *
 * Setup: register this URL in the PayPal dashboard (Apps & Credentials → your app
 * → Webhooks) as `<your-site>/api/webhooks/paypal`, subscribe to the events below,
 * and put the resulting Webhook ID in PAYPAL_WEBHOOK_ID. PayPal cannot reach
 * localhost, so for local testing expose it with a tunnel (ngrok/cloudflared) or
 * use the PayPal "Webhooks Simulator".
 */
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

  let event: { event_type?: string; resource?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const type = event.event_type ?? "";
  const resource = event.resource ?? {};
  const amount = (resource as { amount?: { value?: string; currency_code?: string } }).amount;
  const money = amount ? `${amount.value} ${amount.currency_code}` : "—";

  // Handlers. For now they log; this is the single place to later mark the order
  // paid/refunded in the database and trigger the confirmation/refund email.
  switch (type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      console.log(`✅ Webhook: payment COMPLETED — ${money} (capture ${(resource as { id?: string }).id})`);
      // TODO: mark order paid + send confirmation email (once email/DB are wired)
      break;
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.DECLINED":
      console.log(`⛔ Webhook: payment DENIED — ${money}`);
      // TODO: flag order as failed
      break;
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED":
      console.log(`↩️  Webhook: payment REFUNDED — ${money}`);
      // TODO: mark order refunded + notify
      break;
    case "CUSTOMER.DISPUTE.CREATED":
    case "CUSTOMER.DISPUTE.UPDATED":
      console.log(`⚠️  Webhook: dispute event — ${type}`);
      // TODO: alert the team
      break;
    default:
      console.log(`ℹ️  Webhook: unhandled event ${type}`);
  }

  // Always 200 quickly so PayPal stops retrying.
  return NextResponse.json({ received: true });
}
