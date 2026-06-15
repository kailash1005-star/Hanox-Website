"use client";

import { useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Btn, Gallery, Silhouette, StockBadge } from "@/components/ui";
import {
  byId,
  euro,
  SPEC_SECTION_LABELS,
  type Model,
  type SpecRow,
  type SpecSection,
  type Variant,
} from "@/lib/data";
import { copyDe } from "@/lib/product-copy";
import { engineConfig, engineOption, defaultEngineId, type EngineConfig } from "@/lib/variants";
import { groupForMachine } from "@/lib/accessories";
import { DELIVERY_TIME } from "@/lib/order-pricing";
import { useCart } from "@/lib/cart";
import { useGo, type Go } from "@/lib/nav";

/* ============ PRODUKTDETAIL ============ */
export function ProductView({ id }: { id: string }) {
  const go = useGo();
  const router = useRouter();
  const { addToCart } = useCart();
  const m = byId(id);
  const [qty, setQty] = useState(1);
  const hasAccessories = !!groupForMachine(id);

  const engines = engineConfig(id);
  const [engineId, setEngineId] = useState<string | undefined>(defaultEngineId(id));
  if (!m) return notFound();

  const engine = engineOption(id, engineId);
  // Live price: base price + selected engine's delta (Task 2).
  const unit = m.price + (engine?.priceDelta ?? 0);
  const copy = copyDe(m.id);
  const description = copy.description ?? m.description;
  const tagline = copy.tagline ?? m.tagline;

  return (
    <div className="page page--shop page--product">
      <div className="pd">
        <div className="pd__left">
          <div className={"pd__hero" + (m.inStock ? "" : " pd__hero--req")}>
            <button className="pd__back" onClick={() => go("catalog")} aria-label="Zurück">{Icon.back()}</button>
            {m.images.length ? (
              <Gallery images={m.images} alt={m.name + " — " + m.class} />
            ) : (
              <Silhouette label="Foto auf Anfrage" />
            )}
          </div>
        </div>

        <div className="pd__right">
          <div className="pd__head">
            <StockBadge inStock={m.inStock} />
            <div className="pd__brand">{m.brand}</div>
            <div className="pd__title">
              <div>
                <h1>{m.name}</h1>
                <div className="pd__class">{m.class}</div>
              </div>
              <div className="pd__price">
                {euro(unit)}
                <small>{m.taxNote}</small>
              </div>
            </div>
            {engine?.priceTbd ? (
              <p className="pd__pricenote">* Aufpreis für diesen Motor wird noch bestätigt.</p>
            ) : null}
            {tagline ? <p className="pd__tagline">{tagline}</p> : null}
          </div>

          {engines ? (
            <>
              <EngineSelector cfg={engines} basePrice={m.price} selected={engineId} onSelect={setEngineId} />
              {engine?.desc ? <p className="pd__variant-desc">{engine.desc}</p> : null}
            </>
          ) : null}

          {/* Generic multi-option variants — only when this product has no dedicated
              variant config (which already renders the proper price-aware selector). */}
          {!engines
            ? m.variants.filter((v) => v.values.length > 1).map((v) => <VariantPicker key={v.name} v={v} />)
            : null}

          {description ? <p className="pd__blurb">{description}</p> : null}

          {/* Delivery time (Task 4) */}
          <div className="pd__delivery">
            <span className="pd__delivery-ic">{Icon.truck({ width: 20, height: 20 })}</span>
            <div>
              <b>Lieferzeit</b>
              <span>{DELIVERY_TIME.de}</span>
              <span>{DELIVERY_TIME.eu}</span>
            </div>
          </div>

          {/* Cross-sell: jump to this machine's accessories (added to the same cart) */}
          {hasAccessories ? (
            <button
              className="pd__acc-link"
              onClick={() => { router.push(`/zubehoer/${id}`); window.scrollTo(0, 0); }}
            >
              <span className="pd__acc-ic">{Icon.wrench({ width: 20, height: 20 })}</span>
              <span className="pd__acc-t">
                <b>Passendes Zubehör für {m.name}</b>
                <span>Anbaugeräte ansehen und zum Warenkorb hinzufügen</span>
              </span>
              {Icon.arrow()}
            </button>
          ) : null}

          <SpecsBlock m={m} engineSpecs={engines?.replacesEngineSpecs ? engine?.specs : undefined} />

          {m.inStock ? (
            <>
              <div className="pd__qty">
                <div className="variant__label">Menge</div>
                <div className="qtybox">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Weniger">{Icon.minus()}</button>
                  <b>{qty}</b>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Mehr">{Icon.plus()}</button>
                </div>
              </div>
              <div className="buybar">
                <div className="buybar__price">
                  <b>{euro(unit * qty)}</b>
                  <small>{m.taxNote}</small>
                </div>
                <Btn
                  onClick={() => {
                    addToCart(
                      m,
                      { variantId: engineId, variantLabel: engine?.label, unit },
                      qty
                    );
                    go("cart");
                  }}
                  icon={Icon.cart({ width: 18, height: 18 })}
                >
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

/* ---- Engine selector: switches price + engine specs live (Task 2) ---- */
function EngineSelector({
  cfg,
  basePrice,
  selected,
  onSelect,
}: {
  cfg: EngineConfig;
  basePrice: number;
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="variant variant--engine">
      <div className="variant__label">{cfg.label}</div>
      <div className="variant__chips">
        {cfg.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={"chip " + (selected === o.id ? "chip--on" : "")}
            onClick={() => onSelect(o.id)}
            aria-pressed={selected === o.id}
          >
            <span className="chip__label">{o.label}</span>
            <span className="chip__price">{o.priceTbd ? "auf Anfrage" : euro(basePrice + o.priceDelta)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Variant chips (display + local selection) ---- */
function VariantPicker({ v }: { v: Variant }) {
  const [sel, setSel] = useState(v.values[0] ?? "");
  return (
    <div className="variant">
      <div className="variant__label">{v.name}</div>
      <div className="variant__chips">
        {v.values.map((val) => (
          <button
            key={val}
            type="button"
            className={"chip " + (sel === val ? "chip--on" : "")}
            onClick={() => setSel(val)}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Spec tables (Motor / Abmessungen / Leistung / Hydraulik + Sonstiges) ---- */
function SpecsBlock({ m, engineSpecs }: { m: Model; engineSpecs?: SpecRow[] }) {
  const sections = useMemo(() => {
    // When an engine variant is selected, its spec rows replace the base engine table.
    const engineRows = engineSpecs && engineSpecs.length ? engineSpecs : m.specs.engine;
    const named: { label: string; rows: SpecRow[] }[] = [
      { label: SPEC_SECTION_LABELS.engine, rows: engineRows },
      { label: SPEC_SECTION_LABELS.dimensions, rows: m.specs.dimensions },
      { label: SPEC_SECTION_LABELS.performance, rows: m.specs.performance },
      { label: SPEC_SECTION_LABELS.hydraulics, rows: m.specs.hydraulics },
    ].filter((s) => s.rows.length > 0);
    const other: SpecSection[] = m.specs.other.filter((s) => s.rows.length > 0);
    return { named, other };
  }, [m, engineSpecs]);

  if (!sections.named.length && !sections.other.length) return null;

  return (
    <section className="specs2">
      <h2 className="specs2__h">Technische Daten</h2>
      {sections.named.map((s) => (
        <SpecTable key={s.label} title={s.label} rows={s.rows} />
      ))}
      {sections.other.map((s) => (
        <SpecTable key={s.name} title={s.name} rows={s.rows} />
      ))}
    </section>
  );
}

function SpecTable({ title, rows }: { title: string; rows: SpecRow[] }) {
  return (
    <div className="spec-table">
      <div className="spec-table__head">{title}</div>
      <dl className="spec-table__body">
        {rows.map((r, i) => (
          <div className="spec-table__row" key={i}>
            <dt>{r.field}</dt>
            <dd>{r.eu}</dd>
          </div>
        ))}
      </dl>
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
