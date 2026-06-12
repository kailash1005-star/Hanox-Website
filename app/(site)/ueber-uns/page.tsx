import type { Metadata } from "next";
import { AboutView } from "@/components/views/about";

export const metadata: Metadata = {
  title: "Über uns — Hanox",
  description:
    "Hochwertige Bagger zum fairen Preis, mit Garantie — von Profis gebaut, für Profis und private Anwender. Entwickelt nach deutschen Qualitätsstandards.",
};

export default function Page() {
  return <AboutView />;
}
