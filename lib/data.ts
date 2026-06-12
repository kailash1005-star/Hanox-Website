/* Hanox — Produktkatalog + Konfiguration.
 *
 * Editable content (catalogue, R10 accessories, homepage categories) is read from
 * the Keystatic-managed JSON files in content/ — edit it at /keystatic. Product
 * PHOTOS come from public/products/ via the generated manifest. Spec field order
 * and the euro() helper stay in code (not content-editable). */

import productImages from "./product-images.generated.json";
import r10 from "@/content/models/r10.json";
import r13 from "@/content/models/r13.json";
import r15 from "@/content/models/r15.json";
import r18 from "@/content/models/r18.json";
import r22 from "@/content/models/r22.json";
import r32 from "@/content/models/r32.json";
import accessoriesData from "@/content/settings/accessories.json";
import categoriesData from "@/content/settings/categories.json";

export type Addon = { id: string; label: string; price: number };

export type SpecKey =
  | "weight"
  | "engine"
  | "power"
  | "depth"
  | "reach"
  | "dump"
  | "bucket"
  | "track"
  | "speed"
  | "fuel";

export type Model = {
  id: string;
  name: string;
  class: string;
  tagline: string;
  price: number;
  regularPrice: number;
  inStock: boolean;
  drive: "diesel" | "electric";
  images?: string[];
  blurb: string;
  specs: Partial<Record<SpecKey, string>>;
};

export type Category = { id: string; title: string; sub: string; ids: string[] };
export type Review = { name: string; role: string; text: string };
export type TrustPillar = { k: string; v: string };

/**
 * Gallery photos come from public/products/<id>/, surfaced through the generated
 * manifest (run `npm run sync:images`). A model with no photos returns undefined
 * and falls back to the silhouette placeholder.
 */
const IMAGES = productImages as Record<string, string[]>;
const imagesFor = (id: string): string[] | undefined => {
  const arr = IMAGES[id];
  return arr && arr.length ? arr : undefined;
};

type RawModel = {
  name: string;
  class: string;
  tagline: string;
  price: number;
  regularPrice: number;
  inStock: boolean;
  drive: string;
  blurb: string;
  specs: Record<string, string>;
};

// Merge editable content (from content/models/*.json) with folder-based photos.
const toModel = (raw: RawModel, id: string): Model => ({
  id,
  name: raw.name,
  class: raw.class,
  tagline: raw.tagline,
  price: raw.price,
  regularPrice: raw.regularPrice,
  inStock: raw.inStock,
  drive: raw.drive === "electric" ? "electric" : "diesel",
  images: imagesFor(id),
  blurb: raw.blurb,
  specs: raw.specs as Partial<Record<SpecKey, string>>,
});

export const MODELS: Model[] = [
  toModel(r10 as RawModel, "r10"),
  toModel(r13 as RawModel, "r13"),
  toModel(r15 as RawModel, "r15"),
  toModel(r18 as RawModel, "r18"),
  toModel(r22 as RawModel, "r22"),
  toModel(r32 as RawModel, "r32"),
];

// Zubehör für den lagernden R10-Konfigurator (editable: content/settings/accessories.json)
export const R10_ADDONS: Addon[] = accessoriesData.items;

// Gruppierung der Modelle für die Startseite (editable: content/settings/categories.json)
export const CATEGORIES: Category[] = categoriesData.groups;

// Reihenfolge der technischen Daten, für alle Maschinen (fest im Code)
export const SPEC_FIELDS: [SpecKey, string][] = [
  ["weight", "Betriebsgewicht"],
  ["engine", "Motor"],
  ["power", "Nennleistung"],
  ["depth", "Max. Grabtiefe"],
  ["reach", "Max. Reichweite"],
  ["dump", "Max. Abkipphöhe"],
  ["bucket", "Löffelinhalt"],
  ["track", "Kettenbreite (min–max)"],
  ["speed", "Fahrgeschwindigkeit"],
  ["fuel", "Kraftstofftank"],
];

export function euro(n: number): string {
  return "€" + n.toLocaleString("de-DE");
}

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

export const byId = (id: string): Model | undefined => MODELS.find((m) => m.id === id);
