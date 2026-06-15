import type { Metadata } from "next";
import { AccessoriesView } from "@/components/views/accessories";

export const metadata: Metadata = {
  title: "Zubehör — Hanox",
  description: "Anbaugeräte und Zubehör für Hanox Kompakt- und Minibagger: Löffel, Hydraulikhämmer, Greifer und mehr.",
};

export default function Page() {
  return <AccessoriesView />;
}
