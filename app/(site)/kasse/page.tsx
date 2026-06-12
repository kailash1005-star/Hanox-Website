import type { Metadata } from "next";
import { CheckoutView } from "@/components/views/checkout";

export const metadata: Metadata = {
  title: "Kasse — Hanox",
};

export default function Page() {
  return <CheckoutView />;
}
