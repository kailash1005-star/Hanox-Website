"use client";

import { Icon } from "@/components/Icon";
import { Btn, Shot } from "@/components/ui";
import { TrustStrip, Reviews, Newsletter, Footer } from "@/components/sections";
import { ModelCard } from "@/components/product-card";
import { MODELS, type Model } from "@/lib/data";
import { useGo, type Go } from "@/lib/nav";

// Lead the grid with the available machines (R10 ECO, then RD-06), rest follow.
const FEATURED = ["r10-eco", "rd-06"];
const ORDERED_MODELS: Model[] = [
  ...FEATURED.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is Model => !!m),
  ...MODELS.filter((m) => !FEATURED.includes(m.id)),
];

export function CatalogView() {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <h1>Unsere Antriebstechnik.</h1>
        <p>Jedes unserer Modelle setzt auf bewährte, leistungsstarke Motoren namhafter Hersteller und eine gesicherte, europaweite Teileversorgung. Profitieren Sie von maximaler Betriebssicherheit und zuverlässiger Power für jede Herausforderung.</p>
      </section>
      <TrustStrip />
      <div className="grid wrapx">
        {ORDERED_MODELS.map((m) => <ModelCard key={m.id} m={m} go={go} />)}
        <ZubehoerCard go={go} />
      </div>
      <section className="band wrapx">
        <h2>Unsicher bei der Größe?</h2>
        <p>Sagen Sie uns Ihre typische Aufgabe — Gräben, Fundamente, Landschaftsbau — und wir empfehlen Ihnen die richtige Maschine.</p>
        <Btn variant="ghost" onClick={() => go("about")} icon={Icon.arrow()}>Sprechen Sie mit uns</Btn>
      </section>
      <Reviews />
      <Newsletter />
      <Footer go={go} />
    </div>
  );
}

/* A card matching the product cards that leads to the accessories page. */
function ZubehoerCard({ go }: { go: Go }) {
  return (
    <article className="pcard" onClick={() => go("accessories")}>
      <div className="pcard__media">
        <Shot src="/products/accessories/GridBucket_Compl_600x600px.jpg" alt="Zubehör & Anbaugeräte" ratio="1 / 1" />
        <span className="pcard__tab">Zubehör</span>
      </div>
      <div className="pcard__b">
        <div className="pcard__name">Zubehör & Anbaugeräte</div>
        <div className="pcard__class">Schaufeln, Greifer, Schnellwechsler &amp; mehr</div>
      </div>
    </article>
  );
}
