"use client";

import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { ACCESSORY_GROUPS } from "@/lib/accessories";

/* Zubehör / Accessories (Task 7) — real data imported from rippa-europe. */

function euroAcc(n: number): string {
  return "€" + n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccessoriesView() {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Zubehör</p>
        <h1>Anbaugeräte & Zubehör</h1>
        <p className="lead__sub">
          Das passende Werkzeug für jede Aufgabe — abgestimmt auf Ihre Hanox-Maschine.
          Alle Preise verstehen sich zzgl. MwSt.
        </p>
      </section>

      {ACCESSORY_GROUPS.map((g) => (
        <section className="acc-sec wrapx" key={g.id}>
          <h2 className="acc-sec__h">{g.label}</h2>
          <div className="acc-grid">
            {g.items.map((a) => (
              <article className="acc-card" key={a.id}>
                <div className="acc-card__media">
                  <img src={a.image} alt={a.name} loading="lazy" />
                </div>
                <div className="acc-card__b">
                  <b>{a.name}</b>
                  <span className="acc-card__price">ab {euroAcc(a.price)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="band wrapx">
        <h2>Zubehör bestellen oder anfragen</h2>
        <p>Sagen Sie uns, welches Anbaugerät Sie brauchen und für welche Maschine — wir machen Ihnen ein passendes Angebot.</p>
        <div className="band__cta">
          <Btn variant="primary" onClick={() => go("contact")} icon={Icon.arrow()}>Zubehör anfragen</Btn>
          <Btn variant="ghost" onClick={() => go("catalog")}>Maschinen ansehen</Btn>
        </div>
      </section>
      <Footer go={go} />
    </div>
  );
}
