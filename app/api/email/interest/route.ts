import { NextResponse } from "next/server";
import { sendEmail, ORDER_NOTIFY_TO } from "@/lib/email";
import { saveLead } from "@/lib/leads";

export const runtime = "nodejs";

type Body = { email?: string; name?: string; message?: string; source?: string };

/**
 * Electric-range interest / waitlist capture (Tasks 8 & 12).
 * Sends the visitor a confirmation AND notifies the team. `source` distinguishes
 * the "Benachrichtigen" waitlist from the electric contact form.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const name = (body.name || "").trim();
  const message = (body.message || "").trim();
  const source = body.source === "contact" ? "contact" : "waitlist";
  if (!email) return NextResponse.json({ error: "E-Mail erforderlich." }, { status: 400 });

  // Durable record (best-effort) — store the lead alongside the email.
  await saveLead({ type: source === "contact" ? "contact" : "electric-waitlist", name, email, note: message, source });

  // Confirmation to the visitor (German).
  const visitorHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#16181b">
    <h1 style="font-size:20px">${source === "contact" ? "Vielen Dank für Ihr Interesse!" : "Sie sind registriert"}</h1>
    <p style="color:#3c4148">${
      source === "contact"
        ? "Vielen Dank für Ihr Interesse! Wir melden uns bei Ihnen, sobald wir Maschinen verfügbar haben."
        : "Sie sind registriert – wir benachrichtigen Sie, sobald die Elektro-Reihe verfügbar ist."
    }</p>
    <p style="font-weight:700;margin-top:18px">Ihr Hanox-Team</p>
  </div>`;

  const visitor = await sendEmail({
    to: email,
    subject: source === "contact" ? "Ihre Anfrage bei Hanox" : "Hanox Elektro-Reihe — Sie stehen auf der Liste",
    html: visitorHtml,
  });

  // Internal notification to the team.
  await sendEmail({
    to: ORDER_NOTIFY_TO,
    replyTo: email,
    subject: source === "contact" ? `Neue Elektro-Anfrage von ${email}` : `Neue Elektro-Vormerkung: ${email}`,
    html: `<p><b>Quelle:</b> ${source}</p><p><b>E-Mail:</b> ${email}</p>${name ? `<p><b>Name:</b> ${name}</p>` : ""}${message ? `<p><b>Nachricht:</b><br>${message.replace(/</g, "&lt;")}</p>` : ""}`,
  });

  return NextResponse.json({ ok: visitor.ok, skipped: visitor.skipped ?? false });
}
