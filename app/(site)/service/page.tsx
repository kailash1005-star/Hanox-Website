import type { Metadata } from "next";
import { AboutView } from "@/components/views/about";

export const metadata: Metadata = {
  title: "Service & Lieferung — Hanox",
};

export default function Page() {
  return <AboutView />;
}
