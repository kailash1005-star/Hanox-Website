/* Hanox — Produktkatalog.
 *
 * Product content (catalogue, specs, images, descriptions) is sourced from
 * public/products/products.json via lib/products.ts. Categories on the
 * homepage are still editable through content/settings/categories.json. */

import { PRODUCTS, getProduct, type Product } from "./products";
import categoriesData from "@/content/settings/categories.json";

export type {
  Product,
  SpecRow,
  SpecSection,
  Variant,
  ProductCategory,
} from "./products";

/**
 * Legacy alias kept so existing cart/card/catalog code reads the same.
 * Prefer `Product` for new code.
 */
export type Model = Product;

export type Category = { id: string; title: string; sub: string; ids: string[] };
export type Review = { name: string; role: string; text: string };
export type TrustPillar = { k: string; v: string };

export const MODELS: Model[] = PRODUCTS;

export const byId = (id: string): Model | undefined => getProduct(id);

export const CATEGORIES: Category[] = categoriesData.groups;

export function euro(n: number): string {
  return "€" + n.toLocaleString("de-DE");
}

/** Localised section headers for the product detail page. */
export const SPEC_SECTION_LABELS = {
  engine: "Motor",
  dimensions: "Abmessungen & Gewicht",
  performance: "Leistung & Last",
  hydraulics: "Hydrauliksystem",
} as const;

export const TRUST: TrustPillar[] = [
  { k: "EU-Ersatzteile", v: "Ab Lager, kein langes Warten" },
  { k: "Schnelle Lieferung", v: "Europaweit, zum Pauschalpreis" },
  { k: "Garantie", v: "Bei jeder Maschine inklusive" },
  { k: "Bestpreis", v: "Faire Preise, direkt ab Lager" },
];

export const REVIEWS: Review[] = [
  { name: "Peter Stinson", role: "Garten- & Landschaftsbau", text: "Wir brauchten dringend einen Bagger — Hanox hat den R10 in zwei Tagen geliefert. Läuft einwandfrei." },
  { name: "Markus Pollack", role: "Tiefbau", text: "Den R10 nutze ich jetzt seit Wochen täglich. Spart enorm Zeit und die Verarbeitung stimmt. Klare Empfehlung." },
  { name: "Michael Truckle", role: "Bauunternehmer", text: "Genau wie beschrieben und deutlich günstiger als überall sonst. Beratung war erstklassig." },
  { name: "David Sookias", role: "Forst & Außenanlagen", text: "Maschine plus Zubehör gekauft — der Kundenservice hat unsere Erwartungen übertroffen." },
];
