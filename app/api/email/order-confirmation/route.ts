import { NextResponse } from "next/server";
import { priceOrder, FULFILMENT_LABEL, type CartLineInput, type Fulfilment } from "@/lib/order-pricing";
import { byId, euro } from "@/lib/data";
import { getAccessory } from "@/lib/accessories";
import { sendEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";

type Body = { email?: string; items?: CartLineInput[]; fulfil?: Fulfilment; orderId?: string };

/** Order-confirmation email sent right after a successful payment (Task 6). */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const VALID: Fulfilment[] = ["pickup", "delivery-de", "delivery-eu"];
  const fulfil: Fulfilment = VALID.includes(body.fulfil as Fulfilment) ? (body.fulfil as Fulfilment) : "delivery-de";
  if (!email || !items.length) {
    return NextResponse.json({ error: "E-Mail und Positionen erforderlich." }, { status: 400 });
  }

  // Authoritative figures — recomputed, never trusted from the client.
  let priced;
  try {
    priced = priceOrder(items, fulfil);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const base = siteUrl();
  const rows = priced.lines
    .map((l) => {
      // Accessory lines use "acc:<id>" or "acc:<id>,<optionId>"; machines use "<productId>:<variantId>".
      let img = "";
      let link = base;
      if (l.key.startsWith("acc:")) {
        const accId = l.key.slice(4).split(",")[0];
        const a = getAccessory(accId);
        img = a?.image ? base + encodeURI(a.image) : "";
        link = `${base}/zubehoer`;
      } else {
        const p = byId(l.key.split(":")[0]);
        img = p?.images?.[0] ? base + encodeURI(p.images[0]) : "";
        link = p ? `${base}/bagger/${p.id}` : base;
      }
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;width:84px">
            ${img ? `<a href="${link}"><img src="${img}" alt="${l.name}" width="72" style="border-radius:8px;display:block"></a>` : ""}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee">
            <a href="${link}" style="color:#16181b;font-weight:700;text-decoration:none">${l.name}</a><br>
            <span style="color:#757a82;font-size:13px">Menge: ${l.qty}</span>
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${euro(l.unitNet * l.qty)}</td>
        </tr>`;
    })
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#16181b">
    <div style="padding:8px 0 18px">
      <img src="${base}/brand/hanox-emblem.png" alt="Hanox" width="56" height="56" style="display:block;border:0">
    </div>
    <h1 style="font-size:22px">Vielen Dank für Ihre Bestellung!</h1>
    <p style="color:#3c4148">Wir haben Ihre Zahlung erhalten und bestätigen hiermit Ihre Bestellung${body.orderId ? ` (Referenz: ${body.orderId})` : ""}.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 0;color:#3c4148">Zwischensumme (netto)</td><td style="padding:4px 0;text-align:right">${euro(priced.itemTotalNet)}</td></tr>
      <tr><td style="padding:4px 0;color:#3c4148">${FULFILMENT_LABEL[fulfil]}</td><td style="padding:4px 0;text-align:right">${priced.shippingNet ? euro(priced.shippingNet) : "Kostenlos"}</td></tr>
      <tr><td style="padding:4px 0;color:#3c4148">zzgl. ${Math.round(priced.vatRate * 100)} % MwSt.</td><td style="padding:4px 0;text-align:right">${euro(priced.vatAmount)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:800;font-size:16px;border-top:2px solid #16181b">Gesamt</td><td style="padding:8px 0;text-align:right;font-weight:800;font-size:16px;border-top:2px solid #16181b">${euro(priced.totalGross)}</td></tr>
    </table>
    <p style="color:#757a82;font-size:13px;margin-top:18px">Lieferzeit — Innerhalb Deutschlands: 2–7 Tage · Innerhalb der EU: 2–4 Wochen.</p>
    <p style="color:#757a82;font-size:13px">Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
    <p style="font-weight:700;margin-top:18px">Ihr Hanox-Baumaschinen Team</p>
  </div>`;

  const result = await sendEmail({
    to: email,
    subject: "Ihre Hanox-Bestellbestätigung",
    html,
  });
  // Always 200 so the checkout flow never blocks on email delivery.
  return NextResponse.json({ ok: result.ok, skipped: result.skipped ?? false });
}
