import { NextResponse } from "next/server";
import { getAccessToken, paypalBase } from "@/lib/paypal";
import { priceOrder, money, type CartLineInput, type Fulfilment } from "@/lib/order-pricing";
import { validateCustomer } from "@/lib/customer";
import { createOrderRecord } from "@/lib/orders";

export const runtime = "nodejs";

type Body = { items?: CartLineInput[]; fulfil?: Fulfilment; customer?: unknown };

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

  // Validate the on-site customer details (name/email + shipping address for delivery).
  const cust = validateCustomer(body.customer, fulfil);
  if (!cust.ok) return NextResponse.json({ error: cust.error }, { status: 400 });

  // Server-authoritative pricing — never trust client amounts.
  let priced;
  try {
    priced = priceOrder(items, fulfil);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const token = await getAccessToken();

  // For delivery, hand PayPal the address the buyer entered (SET_PROVIDED_ADDRESS)
  // so the PayPal sheet shows where the goods ship. Pickup ships nothing.
  const shipping =
    fulfil === "pickup" || !cust.customer.address
      ? { shipping_preference: "NO_SHIPPING" as const }
      : {
          shipping_preference: "SET_PROVIDED_ADDRESS" as const,
        };
  const a = cust.customer.address;
  const shippingDetail =
    fulfil !== "pickup" && a
      ? {
          shipping: {
            name: { full_name: cust.customer.name.slice(0, 300) },
            address: {
              address_line_1: a.line1.slice(0, 300),
              ...(a.line2 ? { address_line_2: a.line2.slice(0, 300) } : {}),
              admin_area_2: a.city.slice(0, 120),
              postal_code: a.postalCode.slice(0, 60),
              country_code: a.country,
            },
          },
        }
      : {};

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
        ...shippingDetail,
      },
    ],
    application_context: {
      brand_name: "Hanox",
      ...shipping,
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

  // Persist the order with its authoritative pricing snapshot + customer details.
  // If the DB write fails we still let the payment proceed — the webhook will
  // reconcile and create the record — but we log loudly.
  try {
    await createOrderRecord({
      paypalOrderId: data.id,
      priced,
      fulfil,
      customer: cust.customer,
    });
  } catch (e) {
    console.error("createOrderRecord failed (payment will still proceed, webhook reconciles):", e);
  }

  return NextResponse.json({ id: data.id });
}
