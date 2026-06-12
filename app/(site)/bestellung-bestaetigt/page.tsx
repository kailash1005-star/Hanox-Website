import type { Metadata } from "next";
import { ConfirmView } from "@/components/views/confirm";

export const metadata: Metadata = {
  title: "Bestellung bestätigt — Hanox",
};

export default function Page() {
  return <ConfirmView />;
}
