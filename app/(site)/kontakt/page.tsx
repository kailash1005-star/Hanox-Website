import type { Metadata } from "next";
import { ContactView } from "@/components/views/contact";

export const metadata: Metadata = {
  title: "Kontakt — Hanox",
  description: "Kontaktieren Sie Hanox per Telefon, E-Mail oder Instagram. Wir antworten persönlich.",
};

export default function Page() {
  return <ContactView />;
}
