import type { Metadata } from "next";
import { CartView } from "@/components/views/cart";

export const metadata: Metadata = {
  title: "Warenkorb — Hanox",
};

export default function Page() {
  return <CartView />;
}
