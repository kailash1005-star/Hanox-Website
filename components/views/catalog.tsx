"use client";

import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { TrustStrip, Reviews, Newsletter, Footer } from "@/components/sections";
import { ModelCard } from "@/components/product-card";
import { MODELS } from "@/lib/data";
import { useGo } from "@/lib/nav";

export function CatalogView() {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Diesel-Reihe</p>
        <h1>Unsere Antriebstechnik.</h1>
        <p>Jedes unserer Modelle setzt auf bewährte, leistungsstarke Motoren namhafter Hersteller und eine gesicherte, europaweite Teileversorgung. Profitieren Sie von maximaler Betriebssicherheit und zuverlässiger Power für jede Herausforderung.</p>
      </section>
      <TrustStrip />
      <div className="grid wrapx">
        {MODELS.map((m) => <ModelCard key={m.id} m={m} go={go} />)}
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
