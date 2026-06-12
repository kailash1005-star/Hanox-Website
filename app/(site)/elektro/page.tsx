import type { Metadata } from "next";
import { ElectricView } from "@/components/views/electric";

export const metadata: Metadata = {
  title: "Elektro-Maschinen — Demnächst | Hanox",
};

export default function Page() {
  return <ElectricView />;
}
