"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Logo, Btn, Stars } from "./ui";
import { TRUST, REVIEWS } from "@/lib/data";
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
        <div className="reviews__rating"><Stars /> <span>4,9 / 5 — aus über 200 Lieferungen</span></div>
      </div>
      <div className="reviews__grid">
        {REVIEWS.map((r, i) => (
          <figure className="rev" key={i}>
            <Stars />
            <blockquote>{r.text}</blockquote>
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
          <form className="news__form" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <input type="email" required placeholder="ihr.name@firma.de" aria-label="E-Mail" />
            <Btn variant="dark" type="submit" icon={Icon.arrow()}>Abonnieren</Btn>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer({ go }: { go: Go }) {
  const cols: { h: string; links: [View, string][] }[] = [
    { h: "Schnellzugriff", links: [["about", "Kontakt"], ["about", "Finanzierung"], ["about", "FAQ"], ["about", "Wer wir sind"]] },
    { h: "Richtlinien", links: [["about", "Lieferung"], ["about", "Rückgabe"], ["about", "Datenschutz"], ["about", "AGB"]] },
    { h: "Service", links: [["about", "Garantie-Anmeldung"], ["about", "Ersatzteile"], ["catalog", "Alle Maschinen"], ["electric", "Elektro-Reihe"]] },
  ];
  return (
    <footer className="ftr">
      <div className="ftr__inner">
        <div className="ftr__brand">
          <Logo size={26} light onClick={() => go("home")} />
          <p>Bezahlbare Kompakt- und Minibagger — in Europa bevorratet, geliefert und betreut.</p>
          <div className="ftr__social">
            <a href="#" aria-label="Instagram">{Icon.instagram()}</a>
            <a href="#" aria-label="Facebook">{Icon.facebook()}</a>
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
            <a className="ftr__contact" href="tel:+490000000000">+49 (0) 000 000 000</a>
            <a className="ftr__contact" href="mailto:info@hannox.de">info@hannox.de</a>
            <p className="ftr__hours">Mo–Fr · 8:00–17:00 Uhr</p>
          </div>
        </div>
      </div>
      <div className="ftr__bar">
        <div className="ftr__pay">
          {["Visa", "Mastercard", "PayPal", "Klarna", "Apple Pay"].map((p) => <span key={p} className="paychip">{p}</span>)}
        </div>
        <p className="ftr__legal">© 2026 Hanox. Preise zzgl. MwSt. Konzept-Prototyp.</p>
      </div>
    </footer>
  );
}
