"use client";

import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";

/* Zubehör / Accessories (Task 7).
 * TODO(CONFIRM): replace this placeholder list with the real accessory items,
 * images and prices supplied by the client. Layout reference:
 * https://rippa-europe.com/collections/bagger */

type Accessory = { name: string; desc: string };

const ACCESSORIES: Accessory[] = [
  { name: "Tieflöffel", desc: "Standardlöffel in verschiedenen Breiten für Aushub und Gräben." },
  { name: "Grabenräumlöffel", desc: "Breiter Löffel zum Planieren und Räumen von Gräben." },
  { name: "Hydraulikhammer", desc: "Für Abbruch, Fels und harten Untergrund." },
  { name: "Erdbohrer", desc: "Bohraufsatz für Pfosten, Fundamente und Pflanzungen." },
  { name: "Greifer", desc: "Sortier- und Holzgreifer für Material und Außenanlagen." },
  { name: "Schnellwechsler", desc: "Werkzeugwechsel in Sekunden, ohne Werkzeug." },
];

export function AccessoriesView() {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Zubehör</p>
        <h1>Anbaugeräte & Zubehör</h1>
        <p className="lead__sub">
          Das passende Werkzeug für jede Aufgabe — von Löffeln über Hydraulikhämmer bis
          zu Greifern und Schnellwechslern.
        </p>
      </section>

      <div className="acc-grid wrapx">
        {ACCESSORIES.map((a) => (
          <article className="acc-card" key={a.name}>
            <div className="acc-card__media">{Icon.wrench({ width: 30, height: 30 })}</div>
            <div className="acc-card__b">
              <b>{a.name}</b>
              <p>{a.desc}</p>
              <span className="acc-card__price">Preis auf Anfrage</span>
            </div>
          </article>
        ))}
      </div>

      <section className="band wrapx">
        <h2>Zubehör gesucht?</h2>
        <p>Sagen Sie uns, welches Anbaugerät Sie brauchen — wir machen Ihnen ein Angebot passend zu Ihrer Maschine.</p>
        <div className="band__cta">
          <Btn variant="primary" onClick={() => go("contact")} icon={Icon.arrow()}>Zubehör anfragen</Btn>
          <Btn variant="ghost" onClick={() => go("catalog")}>Maschinen ansehen</Btn>
        </div>
      </section>
      <Footer go={go} />
    </div>
  );
}
