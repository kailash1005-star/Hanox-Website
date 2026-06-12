import { NextResponse } from "next/server";
import { getAccessToken, paypalBase } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bestell-ID fehlt." }, { status: 400 });

  const token = await getAccessToken();
  const res = await fetch(`${paypalBase}/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal capture failed:", data);
    return NextResponse.json({ error: "Zahlung konnte nicht abgeschlossen werden." }, { status: 502 });
  }

  // Pull out the captured amount + payer email for the confirmation page.
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  return NextResponse.json({
    status: data.status, // "COMPLETED" on success
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? "EUR",
    email: data?.payer?.email_address ?? null,
  });
}
