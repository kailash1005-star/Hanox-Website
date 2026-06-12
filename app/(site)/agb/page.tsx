import type { Metadata } from "next";
import { AgbView } from "@/components/views/agb";

export const metadata: Metadata = {
  title: "AGB — Hanox",
};

export default function Page() {
  return <AgbView />;
}
