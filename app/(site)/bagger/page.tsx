import type { Metadata } from "next";
import { CatalogView } from "@/components/views/catalog";

export const metadata: Metadata = {
  title: "Bagger — Hanox Diesel-Reihe",
};

export default function Page() {
  return <CatalogView />;
}
