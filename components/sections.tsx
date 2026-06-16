"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Logo, Btn, Stars } from "./ui";
import { TRUST, REVIEWS } from "@/lib/data";
import { CONTACT } from "@/lib/contact";
import type { Go, View } from "@/lib/nav";

/* ---------- Trust strip (4 pillars) ---------- */
export function TrustStrip() {
  const icons = [Icon.wrench, Icon.truck, Icon.shield, Icon.tag];
  return (
    <section className="tstrip">
      <div className="tstrip__inner">
        {TRUST.map((t, i) => (
          <div className="tstrip__item" key={i}>
            <span className="tstrip__ic">{icons[i]({ width: 24, height: 24 })}</span>
            <div>
              <b>{t.k}</b>
              <span>{t.v}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Reviews ---------- */
export function Reviews() {
  return (
    <section className="reviews">
      <div className="reviews__head">
        <p className="eyebrow">Bewertungen</p>
        <h2>Worauf Profis bei Hanox vertrauen.</h2>
        <div className="reviews__rating"><Stars n={4} /> <span suppressHydrationWarning>4,3 / 5 — aus geprüften Kundenbewertungen</span></div>
      </div>
      <div className="reviews__grid">
        {REVIEWS.map((r, i) => (
          <figure className="rev" key={i}>
            <Stars n={r.rating} />
            <blockquote suppressHydrationWarning>{r.text}</blockquote>
            <figcaption><b>{r.name}</b><span>{r.role}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */
export function Newsletter() {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="news">
      <div className="news__inner">
        <div className="news__copy">
          <h2>Bleiben Sie auf dem Laufenden.</h2>
          <p>Neue Modelle, Lagerzugänge und Angebote — direkt in Ihr Postfach. Kein Spam.</p>
        </div>
        {done ? (
          <div className="news__done">{Icon.check()} Danke — Sie sind angemeldet.</div>
        ) : (
          <form className="news__form" onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihr.name@firma.de"
              aria-label="E-Mail"
            />
            <Btn variant="dark" type="submit" icon={Icon.arrow()} disabled={busy}>
              {busy ? "…" : "Abonnieren"}
            </Btn>
          </form>
        )}
        {error ? <p style={{ color: "#b3261e", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer({ go }: { go: Go }) {
  const cols: { h: string; links: [View, string][] }[] = [
    { h: "Schnellzugriff", links: [["catalog", "Alle Maschinen"], ["accessories", "Zubehör"], ["electric", "Elektro-Reihe"], ["about", "Über uns"], ["contact", "Kontakt"]] },
    { h: "Rechtliches", links: [["impressum", "Impressum"], ["datenschutz", "Datenschutz"], ["agb", "AGB"]] },
  ];
  return (
    <footer className="ftr">
      <div className="ftr__inner">
        <div className="ftr__brand">
          <Logo size={26} light onClick={() => go("home")} />
          <p>Leistungsstarke Kompakt- und Minibagger zu fairen Preisen – mit schnellen Lieferzeiten und zuverlässigem Service in Europa.</p>
          <div className="ftr__social">
            <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">{Icon.instagram()}</a>
          </div>
        </div>
        <div className="ftr__links">
          {cols.map((c, i) => (
            <div key={i}>
              <h4>{c.h}</h4>
              {c.links.map(([v, l], j) => <button key={j} onClick={() => go(v)}>{l}</button>)}
            </div>
          ))}
          <div>
            <h4>Kontakt</h4>
            <a className="ftr__contact" href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phoneDisplay}</a>
            <a className="ftr__contact" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <p className="ftr__hours">{CONTACT.hours}</p>
          </div>
        </div>
      </div>
      <div className="ftr__bar">
        <div className="ftr__pay">
          {["PayPal", "Überweisung / Vorkasse"].map((p) => <span key={p} className="paychip">{p}</span>)}
        </div>
        <p className="ftr__legal">© 2026 mpinger GmbH — Marke Hanox. Alle Preise zzgl. MwSt.</p>
      </div>
    </footer>
  );
}
