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
export type Review = { name: string; role: string; text: string; rating: number };
export type TrustPillar = { k: string; v: string };

export const MODELS: Model[] = PRODUCTS;

export const byId = (id: string): Model | undefined => getProduct(id);

export const CATEGORIES: Category[] = categoriesData.groups;

export function euro(n: number): string {
  // Whole euros print without decimals (€5.625); amounts with cents show them (€423,40).
  const opts = Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return "€" + n.toLocaleString("de-DE", opts);
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
  { name: "Peter Stinson", role: "Garten- & Landschaftsbau", rating: 5, text: "Wir brauchten dringend einen Bagger — Hanox hat den R10 ECO innerhalb weniger Tage geliefert. Alles bestens verpackt, läuft einwandfrei." },
  { name: "Markus Pollack", role: "Tiefbau", rating: 4, text: "Solide Maschine zu einem fairen Preis, kräftig und sparsam. Ein paar Einstellungen musste ich anfangs selbst justieren — danach voll zufrieden." },
  { name: "Sandra Vogt", role: "Bauunternehmen", rating: 3, text: "Die Maschine selbst ist top. Das bestellte Zubehör kam allerdings ein paar Tage nach dem Bagger an — beim nächsten Mal idealerweise zusammen." },
  { name: "David Sookias", role: "Forst & Außenanlagen", rating: 5, text: "Maschine plus Zubehör gekauft — Schnellwechsler und Löffel passen perfekt. Beratung war erstklassig." },
];
