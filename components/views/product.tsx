"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Btn, Gallery, Silhouette, StockBadge } from "@/components/ui";
import { byId, R10_ADDONS, SPEC_FIELDS, euro, type Model } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { useGo, type Go } from "@/lib/nav";

/* ============ PRODUKTDETAIL ============ */
export function ProductView({ id }: { id: string }) {
  const go = useGo();
  const { addToCart } = useCart();
  const m = byId(id);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  if (!m) return notFound();

  const addonTotal = R10_ADDONS.reduce((s, a) => s + (addons[a.id] ? a.price : 0), 0);
  const total = m.price + addonTotal;
  const toggle = (aid: string) => setAddons((s) => ({ ...s, [aid]: !s[aid] }));

  return (
    <div className="page page--shop page--product">
      <div className="pd">
        <div className="pd__left">
          <div className="pd__hero">
            <button className="pd__back" onClick={() => go("catalog")} aria-label="Zurück">{Icon.back()}</button>
            {m.images ? (
              <Gallery images={m.images} alt={m.name + " — " + m.class} />
            ) : (
              <Silhouette label="Foto auf Anfrage" />
            )}
          </div>
        </div>

        <div className="pd__right">
          <div className="pd__head">
            <StockBadge inStock={m.inStock} />
            <div className="pd__title">
              <div>
                <h1>{m.name}</h1>
                <div className="pd__class">{m.class}</div>
              </div>
              <div className="pd__price">{euro(m.price)}<small>zzgl. MwSt.</small></div>
            </div>
          </div>
          <p className="pd__blurb">{m.blurb}</p>

          {/* Technische Daten */}
          <div className="specs">
            <div className="specs__h">Technische Daten</div>
            {SPEC_FIELDS.map(([k, label]) =>
              m.specs[k] ? (
                <div className="specs__row" key={k}>
                  <span>{label}</span>
                  <span>{m.specs[k]}</span>
                </div>
              ) : null
            )}
          </div>

          {m.inStock ? (
            <>
              <div className="config">
                <h3>Zubehör hinzufügen</h3>
                {R10_ADDONS.map((a) => {
                  const on = !!addons[a.id];
                  return (
                    <button key={a.id} className={"addon " + (on ? "addon--on" : "")} onClick={() => toggle(a.id)}>
                      <span className="addon__box">{on ? Icon.check({ width: 15, height: 15 }) : null}</span>
                      <span className="addon__t">{a.label}</span>
                      <span className="addon__p">+{euro(a.price)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="buybar">
                <div className="buybar__price">
                  <b>{euro(total)}</b>
                  <small>{addonTotal ? "inkl. Zubehör" : "zzgl. MwSt."}</small>
                </div>
                <Btn onClick={() => { addToCart(m, addons); go("cart"); }} icon={Icon.cart({ width: 18, height: 18 })}>
                  In den Warenkorb
                </Btn>
              </div>
            </>
          ) : (
            <RequestPanel m={m} go={go} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Anfrage-Panel für nicht lagernde Modelle ---- */
function RequestPanel({ m, go }: { m: Model; go: Go }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", country: "", note: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (sent) {
    return (
      <div className="req" style={{ textAlign: "center" }}>
        <div className="confirm__ic" style={{ margin: "4px auto 14px" }}>{Icon.check()}</div>
        <h3>Anfrage erhalten</h3>
        <p style={{ margin: "6px 0 16px" }}>Danke — wir bestätigen Ihnen ein genaues Lieferfenster und ein verbindliches Angebot für den {m.name} per E-Mail, in der Regel innerhalb eines Werktags. Es wird keine Zahlung fällig, bevor Sie zustimmen.</p>
        <Btn full variant="ghost" onClick={() => go("catalog")}>Zurück zu den Maschinen</Btn>
      </div>
    );
  }

  return (
    <div className="req">
      <h3>Auf Anfrage erhältlich</h3>
      <p>Der {m.name} wird auftragsbezogen in unserem Werk gefertigt. Sagen Sie uns, wo Sie sind, und wir melden uns mit einer festen Lieferzeit und einem Angebot zurück — keine Kasse und keine Vorkasse vorher.</p>
      <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        <div className="field">
          <label>Name</label>
          <input required value={form.name} onChange={set("name")} placeholder="Ihr Name" />
        </div>
        <div className="field">
          <label>E-Mail</label>
          <input required type="email" value={form.email} onChange={set("email")} placeholder="ihr.name@firma.de" />
        </div>
        <div className="field">
          <label>Lieferland / PLZ</label>
          <input required value={form.country} onChange={set("country")} placeholder="z. B. DE · 10115" />
        </div>
        <div className="field">
          <label>Sonstiges? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
          <textarea rows={3} value={form.note} onChange={set("note")} placeholder="Anbaugeräte, Zeitrahmen, Zufahrt zur Baustelle…" />
        </div>
        <Btn full type="submit" icon={Icon.arrow()}>Lieferzeit anfragen</Btn>
      </form>
      <div className="req__note">
        {Icon.shield({ width: 18, height: 18 })}
        <span>Damit Lieferzeiten ehrlich bleiben, solange Maschinen aus unserem Werk versandt werden, können Modelle auf Anfrage online noch nicht gekauft oder per Vorkasse bezahlt werden. Wir bestätigen alles zuerst mit Ihnen.</span>
      </div>
    </div>
  );
}
