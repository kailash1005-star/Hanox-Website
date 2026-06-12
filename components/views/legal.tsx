"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/sections";
import { useGo } from "@/lib/nav";

/** Shared layout for the legal pages (Impressum, Datenschutz, AGB). */
export function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const go = useGo();
  return (
    <div className="page">
      <section className="lead lead--hero wrapx">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro ? <p className="lead__sub">{intro}</p> : null}
      </section>
      <section className="legal wrapx">{children}</section>
      <Footer go={go} />
    </div>
  );
}
