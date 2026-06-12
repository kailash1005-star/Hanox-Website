import type { Metadata } from "next";
import { DatenschutzView } from "@/components/views/datenschutz";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Hanox",
};

export default function Page() {
  return <DatenschutzView />;
}
