import { NextResponse } from "next/server";
import { getAccessToken, paypalBase } from "@/lib/paypal";
import { recordCapture } from "@/lib/orders";
import { notifyTeamOfPaidOrder } from "@/lib/order-notify";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bestell-ID fehlt." }, { status: 400 });

  const token = await getAccessToken();
  const res = await fetch(`${paypalBase}/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // PayPal idempotency: a retried capture with the same key returns the same
      // result instead of double-charging.
      "PayPal-Request-Id": `capture-${id}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal capture failed:", data);
    // Persist the failure so the order isn't left silently in "created".
    try {
      await recordCapture({
        paypalOrderId: id,
        captureId: `failed-${id}`,
        captureStatus: "DECLINED",
        capturedAmount: 0,
        capturedCurrency: "EUR",
        raw: data,
      });
    } catch (e) {
      console.error("recordCapture (failure path) error:", e);
    }
    return NextResponse.json({ error: "Zahlung konnte nicht abgeschlossen werden." }, { status: 502 });
  }

  // Pull out the captured amount + payer/shipping for storage and the confirmation page.
  const pu = data?.purchase_units?.[0];
  const capture = pu?.payments?.captures?.[0];
  const payer = data?.payer;

  try {
    await recordCapture({
      paypalOrderId: id,
      captureId: capture?.id ?? `unknown-${id}`,
      captureStatus: capture?.status ?? data?.status ?? "UNKNOWN",
      capturedAmount: Number(capture?.amount?.value ?? 0),
      capturedCurrency: capture?.amount?.currency_code ?? "EUR",
      payerEmail: payer?.email_address,
      payerName: [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ") || undefined,
      payerId: payer?.payer_id,
      shipping: pu?.shipping,
      raw: data,
    });
  } catch (e) {
    // Storage failure must not lose the buyer's money — the webhook reconciles.
    console.error("recordCapture failed (webhook will reconcile):", e);
  }

  // Tell the team about the paid order (exactly once; never throws).
  if ((capture?.status ?? data?.status) === "COMPLETED") {
    await notifyTeamOfPaidOrder(id, {
      capturedAmount: Number(capture?.amount?.value ?? 0),
      capturedCurrency: capture?.amount?.currency_code ?? "EUR",
      payerEmail: payer?.email_address,
      payerName: [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ") || undefined,
    });
  }

  return NextResponse.json({
    status: data.status, // "COMPLETED" on success
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? "EUR",
    email: payer?.email_address ?? null,
  });
}
