"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { byId } from "@/lib/data";
import { ACCESSORY_MACHINE_IDS } from "@/lib/accessories";

/* Zubehör / Accessories (Task 7) — machine chooser.
 * Clicking a machine opens its own accessories page (/zubehoer/<id>). */

export function AccessoriesView() {
  const go = useGo();
  const router = useRouter();

  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">Zubehör</p>
        <h1>Anbaugeräte & Zubehör</h1>
        <p className="lead__sub">
          Wählen Sie Ihre Maschine — anschließend sehen Sie das passende Zubehör.
          Alle Preise verstehen sich zzgl. MwSt.
        </p>
      </section>

      <div className="mach-grid wrapx">
        {ACCESSORY_MACHINE_IDS.map((id) => {
          const p = byId(id);
          if (!p) return null;
          return (
            <button
              key={id}
              className="mach-card"
              onClick={() => { router.push(`/zubehoer/${id}`); window.scrollTo(0, 0); }}
            >
              <div className="mach-card__media">
                {p.images[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : null}
              </div>
              <span className="mach-card__name">{p.name} {Icon.arrow()}</span>
            </button>
          );
        })}
      </div>

      <section className="band wrapx">
        <h2>Zubehör bestellen oder anfragen</h2>
        <p>Sagen Sie uns, welches Anbaugerät Sie brauchen und für welche Maschine — wir machen Ihnen ein passendes Angebot.</p>
        <div className="band__cta">
          <Btn variant="primary" onClick={() => go("contact")} icon={Icon.arrow()}>Zubehör anfragen</Btn>
          <Btn variant="ghost" onClick={() => go("catalog")}>Maschinen ansehen</Btn>
        </div>
      </section>
      <Footer go={go} />
    </div>
  );
}
