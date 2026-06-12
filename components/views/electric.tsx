"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Btn, Placeholder } from "@/components/ui";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";
import { ELECTRIC_PAGE } from "@/lib/page-copy";

export function ElectricView() {
  const go = useGo();
  const [done, setDone] = useState(false);
  const c = ELECTRIC_PAGE;
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <span className="badge badge--soon">{c.badge}</span>
        <h1 style={{ marginTop: 14 }}>{c.heading}</h1>
        <p>{c.intro}</p>
      </section>
      <div className="wrapx" style={{ padding: "0 18px" }}>
        <Placeholder label={c.placeholderLabel} tone="electric" ratio="16 / 9" />
      </div>
      <section className="band band--green wrapx" style={{ marginTop: 22 }}>
        <h2>{c.ctaHeading}</h2>
        <p>{c.ctaText}</p>
        {done ? (
          <div className="badge badge--soon" style={{ background: "rgba(255,255,255,.16)", color: "#fff", boxShadow: "none" }}>{Icon.check()} {c.successText}</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} style={{ maxWidth: 420 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <input type="email" required placeholder="ihr.name@firma.de" style={{ background: "rgba(255,255,255,.95)" }} />
            </div>
            <Btn full variant="dark" type="submit">{c.notifyButton}</Btn>
          </form>
        )}
      </section>
      <Footer go={go} />
    </div>
  );
}
