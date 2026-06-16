import { NextResponse } from "next/server";
import { sendEmail, ORDER_NOTIFY_TO } from "@/lib/email";
import { saveLead, type LeadType } from "@/lib/leads";

export const runtime = "nodejs";

type Body = {
  type?: LeadType;
  name?: string;
  email?: string;
  country?: string;
  note?: string;
  productId?: string;
  productName?: string;
};

const VALID_TYPES: LeadType[] = ["product-inquiry", "electric-waitlist", "contact", "newsletter"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Single lead-capture endpoint for every interest form on the site. It:
 *   1. validates name + email,
 *   2. persists the lead to MongoDB (`leads` collection) — durable record,
 *   3. notifies the team and confirms to the customer by email.
 * Email is best-effort and never blocks the success response.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const type: LeadType = VALID_TYPES.includes(body.type as LeadType) ? (body.type as LeadType) : "product-inquiry";
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const country = (body.country || "").trim();
  const note = (body.note || "").trim();
  const productName = (body.productName || "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse an." }, { status: 400 });
  }

  // 1) Durable record (best-effort; never blocks).
  await saveLead({
    type,
    name,
    email,
    country,
    note,
    productId: body.productId,
    productName,
  });

  // 2) Notify the team with the full lead detail.
  const subjectMap: Record<LeadType, string> = {
    "product-inquiry": `Neue Anfrage: ${productName || "Maschine"}`,
    "electric-waitlist": "Neue Elektro-Warteliste-Anmeldung",
    contact: "Neue Kontaktanfrage",
    newsletter: "Neue Newsletter-Anmeldung",
  };
  const rows = [
    ["Typ", type],
    ["Name", name],
    ["E-Mail", email],
    ["Maschine", productName],
    ["Lieferland / PLZ", country],
    ["Nachricht", note],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 10px;color:#757a82">${k}</td><td style="padding:4px 10px;font-weight:600">${esc(String(v))}</td></tr>`
    )
    .join("");

  // Fire-and-forget — never block the visitor's success on email.
  void sendEmail({
    to: ORDER_NOTIFY_TO,
    replyTo: email,
    subject: subjectMap[type],
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#16181b">
      <h2 style="font-size:18px">${esc(subjectMap[type])}</h2>
      <table style="border-collapse:collapse;font-size:14px">${rows}</table>
    </div>`,
  });

  // 3) Confirmation to the customer.
  void sendEmail({
    to: email,
    subject: "Wir haben Ihre Anfrage erhalten — Hanox",
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#16181b">
      <h1 style="font-size:20px">Vielen Dank${name ? `, ${esc(name)}` : ""}!</h1>
      <p style="color:#3c4148">Wir haben Ihre Anfrage${productName ? ` zum <b>${esc(productName)}</b>` : ""} erhalten und melden uns in der Regel innerhalb eines Werktags mit einer festen Lieferzeit und einem verbindlichen Angebot. Es wird keine Zahlung fällig, bevor Sie zustimmen.</p>
      <p style="font-weight:700;margin-top:18px">Ihr Hanox-Baumaschinen Team</p>
    </div>`,
  });

  return NextResponse.json({ ok: true });
}
