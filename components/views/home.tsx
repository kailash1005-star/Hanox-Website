"use client";

import { Icon } from "@/components/Icon";
import { Btn, Shot, Price, StockBadge } from "@/components/ui";
import { TrustStrip, Reviews, Newsletter, Footer } from "@/components/sections";
import { TopBar } from "@/components/chrome";
import { ProductRow } from "@/components/product-card";
import { byId, euro, CATEGORIES, type Model } from "@/lib/data";
import { FLAGSHIP_ID } from "@/lib/products";
import { useGo } from "@/lib/nav";

export function HomeView() {
  const go = useGo();
  const r10 = byId(FLAGSHIP_ID) as Model;

  return (
    <div className="page">
      {/* Hero — full-bleed background video with a dark overlay */}
      <section className="hero2">
        <video
          className="hero2__video"
          src="/Hanox-Hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.5; }}
          onPlay={(e) => { e.currentTarget.playbackRate = 0.5; }}
        />
        <div className="hero2__overlay" />
        <div className="hero2__inner">
          <div className="hero2__copy">
            <span className="badge badge--stock"><i className="dot" /> Hanox {r10.name} — jetzt auf Lager</span>
            <h1>Profi-Bagger, die&nbsp;sich&nbsp;rechnen.</h1>
            <p>Robuste Kompakt- und Minibagger von 1,0 bis 3,2 Tonnen – direkt ab Lager, fair im Preis und blitzschnell geliefert. Unser Top-Modell R10 ECO steht bereits für Sie bereit!</p>
            <div className="hero2__cta">
              <Btn onClick={() => go("catalog")} icon={Icon.arrow()}>Bagger entdecken</Btn>
              <Btn variant="ghost" onClick={() => go("product", r10.id)}>{r10.name} ab {euro(r10.price)}</Btn>
            </div>
            <div className="hero2__stats">
              <div><b>6</b><span>Modelle</span></div>
              <div><b>1,0–3,2 t</b><span>Klassen</span></div>
              <div><b>2–7 Tage</b><span>Lieferung (DE)</span></div>
            </div>
          </div>
        </div>
      </section>

      <TopBar />

      <TrustStrip />

      {/* Antrieb wählen */}
      <section className="choose-sec wrapx">
        <div className="sec sec--center"><div><p className="eyebrow">Zwei Wege, ein Anspruch</p><h2>Wählen Sie Ihren Antrieb</h2></div></div>
        <div className="choose">
          <button className="choose__tile" onClick={() => go("catalog")}>
            {/* Task 1: diesel banner image */}
            <img className="tile__img" src="/products/images/Diesel%20engine/f919c971961823.5bd76f839cd7d.jpg" alt="Diesel-Maschinen" />
            <div className="tile__scrim" />
            <div className="tile__body">
              <p className="tile__kicker">Jetzt auf Lager</p>
              <div className="tile__title">Diesel-Maschinen</div>
              <span className="tile__go">Reihe ansehen {Icon.arrow()}</span>
            </div>
          </button>
          <button className="choose__tile" onClick={() => go("electric")}>
            <img className="tile__img" src="/products/images/Electric%20gen/Electric%20gen%20motor.jpeg" alt="Elektro-Maschinen" />
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

      {/* Flagship Spotlight */}
      <section className="spotlight wrapx">
        <div className="spotlight__media">
          {r10.images[2] || r10.images[0] ? (
            <Shot src={r10.images[2] ?? r10.images[0]} alt={`Hanox ${r10.name}`} ratio="4 / 3" className="shot--feat" />
          ) : null}
        </div>
        <div className="spotlight__body">
          <StockBadge inStock={r10.inStock} />
          <h2>{r10.name}</h2>
          <div className="spotlight__class">{r10.class}</div>
          <p>{r10.description}</p>
          <Price price={r10.price} regular={r10.regularPrice} />
          <Btn onClick={() => go("product", r10.id)} icon={Icon.arrow()}>Details & kaufen</Btn>
        </div>
      </section>

      <Reviews />
      <Newsletter />
      <Footer go={go} />
    </div>
  );
}
