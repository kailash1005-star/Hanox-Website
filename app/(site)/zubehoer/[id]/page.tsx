import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessoryDetailView } from "@/components/views/accessory-detail";
import { byId } from "@/lib/data";
import { ACCESSORY_MACHINE_IDS } from "@/lib/accessories";

export function generateStaticParams() {
  return ACCESSORY_MACHINE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = byId(id);
  if (!m) return { title: "Zubehör — Hanox" };
  return { title: `Zubehör für ${m.name} — Hanox` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ACCESSORY_MACHINE_IDS.includes(id)) notFound();
  return <AccessoryDetailView id={id} />;
}
