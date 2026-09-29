/* Internal "new paid order" email to the team — server-only.
 *
 * Called from BOTH the capture route (fast path) and the PayPal webhook
 * (reconciliation path, e.g. when the buyer's browser closed mid-checkout).
 * `claimTeamNotification` guarantees exactly one email per paid order. If the
 * database is unreachable we still send a minimal email from PayPal's capture
 * data — a possible duplicate is far better than a missed order.
 *
 * Never throws: a notification problem must never affect the payment flow. */

import { sendEmail, siteUrl, ORDER_NOTIFY_TO } from "./email";
import { claimTeamNotification, releaseTeamNotification, type OrderDoc } from "./orders";
import { FULFILMENT_LABEL } from "./order-pricing";
import { euro } from "./data";

/** What PayPal told us directly — used when the stored order is unavailable. */
export type CaptureFallback = {
  capturedAmount?: number;
  capturedCurrency?: string;
  payerEmail?: string;
  payerName?: string;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const row = (k: string, v: unknown) =>
  v === undefined || v === null || v === ""
    ? ""
    : `<tr><td style="padding:4px 10px;color:#757a82;vertical-align:top">${esc(k)}</td><td style="padding:4px 10px;font-weight:600">${esc(v)}</td></tr>`;

function orderHtml(o: OrderDoc): string {
  const c = o.customer;
  const a = c?.address;
  const address = a ? [a.line1, a.line2, `${a.postalCode} ${a.city}`, a.country].filter(Boolean).join(", ") : "";
  const lines = (o.lines ?? [])
    .map(
      (l) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(l.name)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${l.qty}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${euro(l.unitNet * l.qty)}</td></tr>`
    )
    .join("");
  const paid = o.paypal?.capturedAmount ?? o.amount?.totalGross;
  const warn =
    o.amountMismatch || o.needsReview
      ? `<p style="background:#fff4e5;border:1px solid #f0b35b;padding:10px;border-radius:6px"><b>Bitte prüfen:</b> ${
          o.amountMismatch ? "Der bezahlte Betrag weicht vom Bestellwert ab." : "Bestelldaten unvollständig — bitte im PayPal-Konto abgleichen."
        }</p>`
      : "";

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#16181b;max-width:640px">
    <h2 style="font-size:18px">Neue bezahlte Bestellung ${esc(o.orderNumber ?? "")}</h2>
    ${warn}
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Bestellnummer", o.orderNumber)}
      ${row("PayPal-Bestell-ID", o._id)}
      ${row("PayPal-Transaktions-ID", o.paypal?.captureId)}
      ${row("Bezahlt", typeof paid === "number" ? `${euro(paid)} ${o.paypal?.capturedCurrency ?? "EUR"}` : "")}
      ${row("Kunde", c?.name || o.paypal?.payerName)}
      ${row("E-Mail", c?.email || o.paypal?.payerEmail)}
      ${row("Telefon", c?.phone)}
      ${row("Versandart", o.fulfil ? FULFILMENT_LABEL[o.fulfil] : "")}
      ${row("Adresse", address)}
    </table>
    ${
      lines
        ? `<table style="border-collapse:collapse;font-size:14px;margin-top:16px;width:100%">
      <tr><th style="padding:6px 10px;text-align:left">Artikel</th><th style="padding:6px 10px">Menge</th><th style="padding:6px 10px;text-align:right">Netto</th></tr>
      ${lines}
    </table>
    <table style="border-collapse:collapse;font-size:14px;margin-top:8px">
      ${row("Versand (netto)", o.amount ? euro(o.amount.shippingNet) : "")}
      ${row("MwSt.", o.amount ? euro(o.amount.vatAmount) : "")}
      ${row("Gesamt (brutto)", o.amount ? euro(o.amount.totalGross) : "")}
    </table>`
        : ""
    }
    <p style="margin-top:18px"><a href="${siteUrl()}/admin">Alle Bestellungen im Admin-Bereich ansehen</a></p>
  </div>`;
}

function fallbackHtml(paypalOrderId: string, f: CaptureFallback): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#16181b">
    <h2 style="font-size:18px">Neue bezahlte Bestellung (PayPal)</h2>
    <p style="background:#fff4e5;border:1px solid #f0b35b;padding:10px;border-radius:6px">Die Datenbank war nicht erreichbar — Details bitte im PayPal-Konto bzw. Admin-Bereich prüfen.</p>
    <table style="border-collapse:collapse;font-size:14px">
      ${row("PayPal-Bestell-ID", paypalOrderId)}
      ${row("Bezahlt", typeof f.capturedAmount === "number" ? `${euro(f.capturedAmount)} ${f.capturedCurrency ?? "EUR"}` : "")}
      ${row("Kunde", f.payerName)}
      ${row("E-Mail", f.payerEmail)}
    </table>
  </div>`;
}

/** Email the team about a newly paid order (exactly once). Never throws. */
export async function notifyTeamOfPaidOrder(paypalOrderId: string, fallback: CaptureFallback = {}): Promise<void> {
  try {
    await notify(paypalOrderId, fallback);
  } catch (e) {
    console.error("notifyTeamOfPaidOrder failed:", e);
  }
}

async function notify(paypalOrderId: string, fallback: CaptureFallback): Promise<void> {
  let order: OrderDoc | null;
  try {
    order = await claimTeamNotification(paypalOrderId);
  } catch (e) {
    console.error("notifyTeamOfPaidOrder: DB unavailable, sending fallback email", e);
    await sendEmail({
      to: ORDER_NOTIFY_TO,
      replyTo: fallback.payerEmail,
      subject: `Neue Bestellung bezahlt — PayPal ${paypalOrderId}`,
      html: fallbackHtml(paypalOrderId, fallback),
    });
    return;
  }
  if (!order) return; // not paid yet, or already notified

  const customerEmail = order.customer?.email || order.paypal?.payerEmail;
  const total = order.paypal?.capturedAmount ?? order.amount?.totalGross;
  const res = await sendEmail({
    to: ORDER_NOTIFY_TO,
    replyTo: customerEmail || undefined,
    subject: `Neue Bestellung ${order.orderNumber ?? paypalOrderId}${typeof total === "number" ? ` — ${euro(total)}` : ""}`,
    html: orderHtml(order),
  });
  if (!res.ok) {
    // Let the next webhook delivery / retry try again.
    try {
      await releaseTeamNotification(paypalOrderId);
    } catch (e) {
      console.error("notifyTeamOfPaidOrder: release failed", e);
    }
  }
}
