/* Transactional email (Tasks 6, 8, 12).
 *
 * Sends via the Resend REST API so no SDK dependency is needed. It is a no-op
 * (logs a warning, returns ok:false) until these env vars are set:
 *   RESEND_API_KEY   — from resend.com (server-only secret)
 *   EMAIL_FROM       — verified sender, default "Hanox <info@hanox-baumaschinen.de>"
 *                      (the domain hanox-baumaschinen.de must be verified in Resend)
 *   ORDER_NOTIFY_TO  — internal inbox for team notifications (default info@…)
 *
 * Server-only — never import from client code. */

import { SITE_URL } from "./site-url";

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Hanox <info@hanox-baumaschinen.de>";
export const ORDER_NOTIFY_TO =
  process.env.ORDER_NOTIFY_TO || "info@hanox-baumaschinen.de";

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("sendEmail: RESEND_API_KEY not set — skipping send.", { subject: opts.subject });
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
      cache: "no-store",
      // Never let a slow mail API hang a checkout/form request.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("sendEmail: Resend error", res.status, text);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendEmail: failed", e);
    return { ok: false, error: (e as Error).message };
  }
}

/** Absolute site URL for links/images in emails (validated, never malformed). */
export function siteUrl(): string {
  return SITE_URL;
}
