"use client";

import { Icon } from "@/components/Icon";
import { Btn, Shot } from "@/components/ui";
import { Footer } from "@/components/sections";
import { byId, euro } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { useGo } from "@/lib/nav";

export function CartView() {
  const go = useGo();
  const { cart: items, setQty, removeItem } = useCart();

  if (!items.length) {
    return (
      <div className="page page--shop">
        <div className="empty">
          <h1 style={{ fontSize: 24 }}>Ihr Warenkorb ist leer</h1>
          <p>Lagernde Maschinen können hier hinzugefügt werden. Andere Modelle werden auf Anfrage reserviert.</p>
          <Btn onClick={() => go("catalog")} icon={Icon.arrow()}>Maschinen ansehen</Btn>
        </div>
        <Footer go={go} />
      </div>
    );
  }

  const subtotal = items.reduce((s, it) => s + it.unit * it.qty, 0);
  return (
    <div className="page page--shop">
      <div className="lead"><h1>Ihr Warenkorb</h1></div>
      {items.map((it) => (
        <div className="line" key={it.key}>
          <Shot src={it.image ?? (byId(it.id)?.images || [])[0]} alt={it.name} ratio="78 / 64" />
          <div className="line__t">
            <b>{it.name}</b>
            <span>{it.addonLabels.length ? it.addonLabels.join(" · ") : it.class}</span>
            <em>{euro(it.unit)}</em>
            <div className="qty">
              <button onClick={() => setQty(it.key, it.qty - 1)} aria-label="Weniger">{Icon.minus()}</button>
              <b>{it.qty}</b>
              <button onClick={() => setQty(it.key, it.qty + 1)} aria-label="Mehr">{Icon.plus()}</button>
            </div>
            <br />
            <button className="rm" onClick={() => removeItem(it.key)}>Entfernen</button>
          </div>
        </div>
      ))}
      <div className="summary">
        <div className="summary__row"><span>Zwischensumme (zzgl. MwSt.)</span><span>{euro(subtotal)}</span></div>
        <div className="summary__row"><span>Lieferung</span><span>Wird an der Kasse gewählt</span></div>
        <div className="summary__row summary__row--total"><span>Gesamt</span><span>{euro(subtotal)}</span></div>
      </div>
      <div className="wrap">
        <Btn full variant="dark" onClick={() => go("checkout")} icon={Icon.arrow()}>Zur Kasse</Btn>
        <div style={{ height: 10 }} />
        <Btn full variant="primary" onClick={() => go("catalog")}>Weiter stöbern</Btn>
      </div>
      <Footer go={go} />
    </div>
  );
}
