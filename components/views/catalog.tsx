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
        <h1>Sechs Maschinen. Eine auf Lager, fünf auf Bestellung.</h1>
        <p>Jeder Hanox teilt denselben zuverlässigen Diesel-Antriebsstrang und EU-Teileversorgung. Der R10 ist sofort lieferbar; die übrigen werden nach Ihren Vorgaben gefertigt.</p>
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
