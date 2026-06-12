"use client";

import { Icon } from "@/components/Icon";
import { Btn } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { SERVICE_PAGE } from "@/lib/page-copy";

// Card icons are fixed and follow the order of the cards in the CMS.
const CARD_ICONS = [Icon.pickup, Icon.truck, Icon.shield, Icon.wrench];

export function AboutView() {
  const go = useGo();
  const c = SERVICE_PAGE;
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>{c.heading}</h1>
      </section>
      <div className="prose wrapx">
        {c.cards.map((card, i) => {
          const icon = CARD_ICONS[i % CARD_ICONS.length];
          return (
            <div className="infocard" key={i}>
              {icon()}
              <div>
                <b>{card.title}</b>
                <p>{card.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <section className="band wrapx">
        <h2>{c.ctaHeading}</h2>
        <p>{c.ctaText}</p>
        <Btn variant="ghost" onClick={() => go("catalog")} icon={Icon.arrow()}>{c.ctaLabel}</Btn>
      </section>
      <Footer go={go} />
    </div>
  );
}
