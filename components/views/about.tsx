"use client";

import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";

/* Über uns — Hanox company story. Static, hand-written copy (no CMS binding) so
 * the brand narrative reads consistently. */

const VALUES: { icon: keyof typeof Icon; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Geprüfte Qualität",
    body: "Hohe Qualitäts- und Prüfstandards, damit Sie sich auf jede Maschine verlassen können.",
  },
  {
    icon: "tag",
    title: "Faire Preise",
    body: "Profi-Technik ohne überzogene Aufschläge. Sie zahlen für die Maschine, nicht für einen aufgeblähten Vertriebsapparat.",
  },
  {
    icon: "medal",
    title: "Gewährleistung inklusive",
    body: "Jede Maschine kommt mit Gewährleistung und einem Ersatzteillager in Europa — kein Warten auf Container aus Übersee.",
  },
  {
    icon: "wrench",
    title: "Von Profis gebaut",
    body: "Entwickelt von Praktikern — für Profis und private Anwender, die robuste Technik zum ehrlichen Preis suchen.",
  },
];

export function AboutView() {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Über uns</p>
        <h1>Hochwertige Bagger zum fairen Preis — mit Gewährleistung.</h1>
        <p className="lead__sub">
          Von Profis gebaut, für Profis und private Anwender. Robuste Technik nach
          deutschen Standards, ohne dass Sie ein Vermögen dafür ausgeben müssen.
        </p>
      </section>

      <section className="prose prose--story wrapx">
        <h2>Unsere Geschichte</h2>
        <p>
          Unser Anspruch war von Anfang an klar: Zuverlässige Baumaschinen anzubieten, die den
          harten Anforderungen im täglichen Arbeitseinsatz standhalten und gleichzeitig
          wirtschaftlich bleiben. Durch den direkten Vertrieb von Maschinen, die nach strengen
          Qualitäts- und Sicherheitsstandards gefertigt werden, machen wir genau das möglich.
          Hanox steht für robuste Technik, transparente Preise und einen verlässlichen Service
          für Gewerbe und Privatkunden.
        </p>
      </section>

      <div className="prose wrapx">
        {VALUES.map((v, i) => (
          <div className="infocard" key={i}>
            {Icon[v.icon]()}
            <div>
              <b>{v.title}</b>
              <p>{v.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="band wrapx">
        <h2>Bereit, loszulegen?</h2>
        <p>
          Entdecken Sie unsere Kompakt- und Minibagger — oder schreiben Sie uns,
          wenn Sie Fragen haben. Wir sprechen gerne über Maschinen.
        </p>
        <div className="band__cta">
          <Btn variant="primary" onClick={() => go("catalog")} icon={Icon.arrow()}>Bagger entdecken</Btn>
          <Btn variant="ghost" onClick={() => go("contact")}>Kontakt aufnehmen</Btn>
        </div>
      </section>
      <Footer go={go} />
    </div>
  );
}
