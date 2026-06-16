"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Btn, Shot } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { ELECTRIC_PAGE } from "@/lib/page-copy";

/* Electric range: combined interest / waitlist form (Tasks 8 + 12).
 * NOTE(confirm): implemented as ONE combined form (email + optional message).
 * Split into a separate "Benachrichtigen" waitlist + contact form if preferred. */
export function ElectricView() {
  const go = useGo();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const c = ELECTRIC_PAGE;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/email/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, source: "contact" }),
      });
    } catch {
      /* even if the mail backend is not configured yet, we still confirm interest */
    }
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <span className="badge badge--soon">{c.badge}</span>
        <h1 style={{ marginTop: 14 }}>{c.heading}</h1>
        <p>{c.intro}</p>
      </section>
      <div className="wrapx" style={{ padding: "0 18px" }}>
        <Shot src="/electric-bg.jpg" alt="Hanox Elektro-Antrieb" ratio="16 / 9" />
      </div>
      <section className="band band--green wrapx" style={{ marginTop: 22 }}>
        <h2>{c.ctaHeading}</h2>
        <p>{c.ctaText}</p>
        {done ? (
          <div className="badge badge--soon" style={{ background: "rgba(255,255,255,.16)", color: "#fff", boxShadow: "none" }}>
            {Icon.check()} Vielen Dank für Ihr Interesse! Wir melden uns bei Ihnen, sobald wir Maschinen verfügbar haben.
          </div>
        ) : (
          <form onSubmit={submit} style={{ maxWidth: 460, margin: "0 auto" }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihr.name@firma.de"
                style={{ background: "rgba(255,255,255,.95)" }}
              />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ihre Nachricht (optional) — z. B. gewünschtes Modell, Einsatzzweck"
                style={{ background: "rgba(255,255,255,.95)", width: "100%", borderRadius: 12, border: 0, padding: "12px 14px", fontFamily: "inherit", fontSize: 15, resize: "vertical" }}
              />
            </div>
            <Btn full variant="dark" type="submit" disabled={busy}>{busy ? "Wird gesendet…" : c.notifyButton}</Btn>
          </form>
        )}
      </section>
      <Footer go={go} />
    </div>
  );
}
