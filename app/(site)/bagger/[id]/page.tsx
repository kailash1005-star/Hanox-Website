import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/views/product";
import { MODELS, byId } from "@/lib/data";

export function generateStaticParams() {
  return MODELS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = byId(id);
  if (!m) return { title: "Nicht gefunden — Hanox" };
  return { title: `${m.name} — ${m.class} | Hanox`, description: m.description };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!byId(id)) notFound();
  return <ProductView id={id} />;
}
