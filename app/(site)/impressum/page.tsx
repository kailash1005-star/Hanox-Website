import type { Metadata } from "next";
import { ImpressumView } from "@/components/views/impressum";

export const metadata: Metadata = {
  title: "Impressum — Hanox",
};

export default function Page() {
  return <ImpressumView />;
}
