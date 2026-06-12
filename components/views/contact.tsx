"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { CONTACT } from "@/lib/contact";

export function ContactView() {
  const go = useGo();
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [msg, setMsg] = useState("");

  // No mail backend yet — open the visitor's mail client with a prefilled draft.
  function send(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Anfrage von ${name || "Website"}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name}\n${from}`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Kontakt</p>
        <h1>Wir sprechen gerne über Maschinen.</h1>
        <p className="lead__sub">
          Fragen zu einem Modell, zur Lieferung oder zur Finanzierung? Melden Sie
          sich — wir sind ein kleines Team und antworten persönlich.
        </p>
      </section>

      <div className="prose wrapx">
        <a className="infocard infocard--link" href={`tel:${CONTACT.phoneHref}`}>
          {Icon.phone()}
          <div>
            <b>Telefon</b>
            <p>{CONTACT.phoneDisplay}</p>
          </div>
        </a>
        <a className="infocard infocard--link" href={`mailto:${CONTACT.email}`}>
          {Icon.shield()}
          <div>
            <b>E-Mail</b>
            <p>{CONTACT.email}</p>
          </div>
        </a>
        <a className="infocard infocard--link" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
          {Icon.instagram()}
          <div>
            <b>Instagram</b>
            <p>@hanox_baumaschinen</p>
          </div>
        </a>
        <div className="infocard">
          {Icon.truck()}
          <div>
            <b>Erreichbarkeit</b>
            <p>{CONTACT.hours}</p>
          </div>
        </div>
      </div>

      <section className="band wrapx">
        <h2>Schreiben Sie uns</h2>
        <p>Wir melden uns in der Regel innerhalb eines Werktags zurück.</p>
        <form className="cform" onSubmit={send}>
          <input
            type="text"
            placeholder="Ihr Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label="Name"
          />
          <input
            type="email"
            placeholder="Ihre E-Mail"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            aria-label="E-Mail"
          />
          <textarea
            placeholder="Ihre Nachricht"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={5}
            required
            aria-label="Nachricht"
          />
          <Btn variant="primary" type="submit" icon={Icon.arrow()}>Nachricht senden</Btn>
        </form>
      </section>
      <Footer go={go} />
    </div>
  );
}
