"use client";

import { Icon } from "@/components/Icon";
import { Btn, Placeholder, Shot, Price, StockBadge } from "@/components/ui";
import { TrustStrip, Reviews, Newsletter, Footer } from "@/components/sections";
import { ProductRow } from "@/components/product-card";
import { byId, euro, CATEGORIES, type Model } from "@/lib/data";
import { useGo } from "@/lib/nav";

export function HomeView() {
  const go = useGo();
  const r10 = byId("r10") as Model;
  return (
    <div className="page">
      {/* Hero */}
      <section className="hero2">
        <div className="hero2__inner wrapx">
          <div className="hero2__copy">
            <span className="badge badge--stock"><i className="dot" /> Hanox R10 — jetzt auf Lager</span>
            <h1>Profi-Bagger, die&nbsp;sich&nbsp;rechnen.</h1>
            <p>Robuste Kompakt- und Minibagger von 1,0 bis 3,2 Tonnen — in Europa bevorratet, fair bepreist und schnell geliefert. Der R10 ist sofort versandbereit.</p>
            <div className="hero2__cta">
              <Btn onClick={() => go("catalog")} icon={Icon.arrow()}>Bagger entdecken</Btn>
              <Btn variant="ghost" onClick={() => go("product", "r10")}>R10 ab {euro(r10.price)}</Btn>
            </div>
            <div className="hero2__stats">
              <div><b>6</b><span>Modelle</span></div>
              <div><b>1,0–3,2 t</b><span>Klassen</span></div>
              <div><b>2–3 Tage</b><span>R10 Versand</span></div>
            </div>
          </div>
          <div className="hero2__media">
            <span className="hero2__flag">Ab {euro(r10.price)}<small>zzgl. MwSt.</small></span>
            <img src={r10.images![0]} alt="Hanox R10 Kompaktbagger" />
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Antrieb wählen */}
      <section className="choose-sec wrapx">
        <div className="sec sec--center"><div><p className="eyebrow">Zwei Wege, ein Anspruch</p><h2>Wählen Sie Ihren Antrieb</h2></div></div>
        <div className="choose">
          <button className="choose__tile" onClick={() => go("catalog")}>
            <Placeholder label="" tone="diesel" ratio="4 / 3" />
            <div className="tile__scrim" />
            <div className="tile__body">
              <p className="tile__kicker">Jetzt auf Lager</p>
              <div className="tile__title">Diesel-Maschinen</div>
              <span className="tile__go">Reihe ansehen {Icon.arrow()}</span>
            </div>
          </button>
          <button className="choose__tile" onClick={() => go("electric")}>
            <Placeholder label="" tone="electric" ratio="4 / 3" />
            <div className="tile__scrim" />
            <span className="badge badge--soon badge--sm tile__soon">Demnächst</span>
            <div className="tile__body">
              <p className="tile__kicker">Zukunftsweisend</p>
              <div className="tile__title">Elektro-Maschinen</div>
              <span className="tile__go">Benachrichtigen {Icon.arrow()}</span>
            </div>
          </button>
        </div>
      </section>

      {/* Wertversprechen */}
      <section className="value">
        <div className="value__inner wrapx">
          <p className="eyebrow eyebrow--on">Unser Versprechen</p>
          <h2>Mehr erwarten.<br />Weniger zahlen.</h2>
          <p>Hochwertige Baumaschinen müssen nicht das Budget sprengen. Das ist kein Slogan — das ist unser Versprechen. Direkt ab Lager, mit Garantie und EU-Ersatzteilen.</p>
          <Btn variant="dark" onClick={() => go("catalog")} icon={Icon.arrow()}>Die Hanox-Reihe entdecken</Btn>
        </div>
      </section>

      {/* Produktreihen nach Kategorie */}
      {CATEGORIES.map((cat) => <ProductRow key={cat.id} cat={cat} go={go} />)}

      {/* R10 Spotlight */}
      <section className="spotlight wrapx">
        <div className="spotlight__media">
          <Shot src={r10.images![2]} alt="Hanox R10" ratio="4 / 3" className="shot--feat" />
        </div>
        <div className="spotlight__body">
          <StockBadge inStock />
          <h2>{r10.name}</h2>
          <div className="spotlight__class">{r10.class}</div>
          <p>{r10.blurb}</p>
          <Price price={r10.price} regular={r10.regularPrice} />
          <Btn onClick={() => go("product", "r10")} icon={Icon.arrow()}>Konfigurieren & kaufen</Btn>
        </div>
      </section>

      <Reviews />
      <Newsletter />
      <Footer go={go} />
    </div>
  );
}
