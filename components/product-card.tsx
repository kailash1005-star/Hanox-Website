"use client";

import { Icon } from "./Icon";
import { Shot, Silhouette, Price } from "./ui";
import { byId, euro, cardPrice, type Model, type Category } from "@/lib/data";
import { usePrefetch, type Go } from "@/lib/nav";

/* ---------- Produktkarte (Buffalo-Stil, kompakt) ---------- */
export function ModelCard({ m, go }: { m: Model; go: Go }) {
  const prefetch = usePrefetch();
  const price = cardPrice(m);
  const onSale = m.regularPrice && m.regularPrice > price;
  return (
    <article
      className={"pcard" + (m.inStock ? "" : " pcard--req")}
      onClick={() => go("product", m.id)}
      onPointerEnter={() => prefetch("product", m.id)}
    >
      <div className="pcard__media">
        {m.images.length ? <Shot src={m.images[0]} alt={m.name} ratio="1 / 1" /> : <Silhouette label="" />}
        {m.inStock
          ? (onSale ? <span className="pcard__tab">Sie sparen {euro(m.regularPrice - price)}</span> : <span className="pcard__tab">Auf Lager</span>)
          : <span className="pcard__tab pcard__tab--req">Auf Anfrage</span>}
      </div>
      <div className="pcard__b">
        <div className="pcard__name">{m.name}</div>
        <div className="pcard__class">{m.class}</div>
        <Price price={price} regular={m.regularPrice} size="price--sm" />
      </div>
    </article>
  );
}

/* ---------- Produktreihe (horizontale Kategorie) ---------- */
export function ProductRow({ cat, go }: { cat: Category; go: Go }) {
  const models = cat.ids.map(byId).filter(Boolean) as Model[];
  return (
    <section className="prow">
      <div className="prow__head wrapx">
        <h2>{cat.title}</h2>
        <button className="pill" onClick={() => go("catalog")}>Alle ansehen {Icon.arrow()}</button>
      </div>
      <div className="prow__track">
        {models.map((m) => <ModelCard key={m.id} m={m} go={go} />)}
      </div>
    </section>
  );
}
