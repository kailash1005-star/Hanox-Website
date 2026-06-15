import { NextResponse } from "next/server";
import { getAccessToken, paypalBase } from "@/lib/paypal";
import { priceOrder, money, type CartLineInput, type Fulfilment } from "@/lib/order-pricing";

export const runtime = "nodejs";

type Body = { items?: CartLineInput[]; fulfil?: Fulfilment };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const VALID: Fulfilment[] = ["pickup", "delivery-de", "delivery-eu"];
  const fulfil: Fulfilment = VALID.includes(body.fulfil as Fulfilment) ? (body.fulfil as Fulfilment) : "delivery-de";
  if (!items.length) return NextResponse.json({ error: "Warenkorb ist leer." }, { status: 400 });

  // Server-authoritative pricing — never trust client amounts.
  let priced;
  try {
    priced = priceOrder(items, fulfil);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const token = await getAccessToken();
  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: money(priced.totalGross),
          breakdown: {
            item_total: { currency_code: "EUR", value: money(priced.itemTotalNet) },
            shipping: { currency_code: "EUR", value: money(priced.shippingNet) },
            tax_total: { currency_code: "EUR", value: money(priced.vatAmount) },
          },
        },
        items: priced.lines.map((l) => ({
          name: l.name.slice(0, 127),
          quantity: String(l.qty),
          unit_amount: { currency_code: "EUR", value: money(l.unitNet) },
          category: "PHYSICAL_GOODS",
        })),
      },
    ],
    application_context: {
      brand_name: "Hanox",
      shipping_preference: fulfil === "pickup" ? "NO_SHIPPING" : "GET_FROM_FILE",
      user_action: "PAY_NOW",
    },
  };

  const res = await fetch(`${paypalBase}/v2/checkout/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(orderPayload),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal create order failed:", data);
    return NextResponse.json({ error: "Zahlung konnte nicht gestartet werden." }, { status: 502 });
  }
  return NextResponse.json({ id: data.id });
}
