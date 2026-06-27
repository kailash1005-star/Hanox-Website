"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { byId } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { groupForMachine, type Accessory } from "@/lib/accessories";

function euroAcc(n: number): string {
  return "€" + n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* A single accessory card. When the accessory has size options, a selector
 * switches the price live and the chosen size is carried into the cart. */
function AccCard({ a }: { a: Accessory }) {
  const go = useGo();
  const { addAccessory } = useCart();
  const values = a.options?.values ?? [];
  const hasOpts = values.length > 0;
  const [optId, setOptId] = useState<string | undefined>(hasOpts ? values[0].id : undefined);
  const sel = hasOpts ? values.find((v) => v.id === optId) : undefined;
  const price = sel ? sel.price : a.price;

  return (
    <article className="acc-card">
      <div className="acc-card__media">
        <img src={a.image} alt={a.name} loading="lazy" />
      </div>
      <div className="acc-card__b">
        <b>{a.name}</b>
        {hasOpts ? (
          <label className="acc-card__opt">
            <span className="acc-card__optname">{a.options!.name}</span>
            <select value={optId} onChange={(e) => setOptId(e.target.value)} aria-label={a.options!.name}>
              {values.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {euroAcc(v.price)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="acc-card__price">{hasOpts ? euroAcc(price) : "ab " + euroAcc(price)}</span>
        <Btn
          className="acc-card__add"
          full
          onClick={() => {
            addAccessory({ id: a.id, name: a.name, price, image: a.image, optionId: sel?.id, optionLabel: sel?.label });
            go("cart");
          }}
          icon={Icon.cart({ width: 16, height: 16 })}
        >
          In den Warenkorb
        </Btn>
      </div>
    </article>
  );
}

/* Accessories for a single machine — its own page (/zubehoer/<id>). */
export function AccessoryDetailView({ id }: { id: string }) {
  const go = useGo();
  const { cartCount } = useCart();
  const machine = byId(id);
  const group = groupForMachine(id);
  if (!machine) return notFound();

  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <button className="acc-back" onClick={() => go("accessories")}>
          {Icon.back()} <span>Andere Maschine wählen</span>
        </button>
        <p className="eyebrow">Zubehör</p>
        <h1>Zubehör für {machine.name}</h1>
        <p className="lead__sub">
          Passende Anbaugeräte für Ihren {machine.name}.
          {group ? ` ${group.items.length} Artikel.` : ""} Alle Preise zzgl. MwSt.
        </p>
      </section>

      <section className="acc-sec wrapx">
        {group && group.items.length ? (
          <div className="acc-grid">
            {group.items.map((a) => (
              <AccCard a={a} key={a.id} />
            ))}
          </div>
        ) : (
          <p style={{ padding: "0 18px", color: "var(--muted)" }}>
            Für diese Maschine ist derzeit kein Zubehör hinterlegt.
          </p>
        )}
      </section>

      <section className="band wrapx">
        {cartCount > 0 ? (
          <>
            <h2>Bereit zur Kasse?</h2>
            <p>Sie haben {cartCount} {cartCount === 1 ? "Artikel" : "Artikel"} im Warenkorb.</p>
            <div className="band__cta">
              <Btn variant="primary" onClick={() => go("cart")} icon={Icon.arrow()}>Zum Warenkorb</Btn>
              <Btn variant="ghost" onClick={() => go("checkout")}>Zur Kasse</Btn>
            </div>
          </>
        ) : (
          <>
            <h2>Zubehör bestellen oder anfragen</h2>
            <p>Sagen Sie uns, welches Anbaugerät Sie für Ihren {machine.name} brauchen — wir machen Ihnen ein passendes Angebot.</p>
            <div className="band__cta">
              <Btn variant="primary" onClick={() => go("contact")} icon={Icon.arrow()}>Zubehör anfragen</Btn>
              <Btn variant="ghost" onClick={() => go("accessories")}>Andere Maschine</Btn>
            </div>
          </>
        )}
      </section>
      <Footer go={go} />
    </div>
  );
}
