/* Product data loader.
 *
 * Reads public/products/products.json — scraped from rippa-europe and committed
 * into the repo. Designed to be the only place product content originates;
 * later swap this file for a CDN/Odoo fetch without touching call sites. */

import raw from "../public/products/products.json";

export type SpecRow = { field: string; eu: string; us?: string };
export type Variant = { name: string; values: string[] };
export type SpecSection = { name: string; rows: SpecRow[] };

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  class: string;
  tagline: string;
  description: string;
  price: number;
  regularPrice: number;
  currency: string;
  taxNote: string;
  inStock: boolean;
  variants: Variant[];
  specs: {
    engine: SpecRow[];
    dimensions: SpecRow[];
    performance: SpecRow[];
    hydraulics: SpecRow[];
    other: SpecSection[];
  };
  images: string[];
};

export type ProductCategory = "excavator" | "skid-loader" | "dumper";

type RawSpecRow = { field: string; eu: string; us?: string };
type RawProduct = {
  slug: string;
  structured: {
    product_name: string;
    brand: string;
    price: string;
    currency: string;
    tax_note: string;
    availability: string;
    short_tagline: string;
    description: string;
    variants: { option_name: string; values: string[] }[];
    specifications: {
      engine: RawSpecRow[];
      dimensions_and_weight: RawSpecRow[];
      performance_and_load: RawSpecRow[];
      hydraulic_system: RawSpecRow[];
      other_sections: { section_name: string; rows: RawSpecRow[] }[];
    };
    image_urls: string[];
  };
};

/** Parse "5.490,00 EUR" or "12,490.00 EUR" → 5490 / 12490 (whole euros). */
function parsePrice(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d.,]/g, "").trim();
  // German style "5.490,00" vs US style "12,490.00" — last separator is decimal.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;
  if (lastComma > lastDot) {
    // comma is decimal separator
    normalised = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // dot is decimal separator
    normalised = cleaned.replace(/,/g, "");
  }
  const n = parseFloat(normalised);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function categoryFor(slug: string): ProductCategory {
  if (slug.startsWith("rs-")) return "skid-loader";
  if (slug.startsWith("rd-")) return "dumper";
  return "excavator";
}

const CLASS_LABEL: Record<ProductCategory, string> = {
  excavator: "Mini-Bagger",
  "skid-loader": "Kompaktlader",
  dumper: "Raupendumper",
};

/** Local path for a remote CDN image, based on its filename. */
function localImagePath(slug: string, url: string): string | null {
  try {
    const u = new URL(url);
    const file = u.pathname.split("/").pop();
    if (!file) return null;
    return `/products/images/${slug}/${file}`;
  } catch {
    return null;
  }
}

function adapt(r: RawProduct): Product {
  const slug = r.slug;
  const s = r.structured;
  const price = parsePrice(s.price);
  const images = Array.from(
    new Set(
      (s.image_urls ?? [])
        .map((u) => localImagePath(slug, u))
        .filter((p): p is string => !!p)
    )
  );
  const category = categoryFor(slug);
  return {
    id: slug,
    name: s.product_name,
    brand: s.brand,
    category,
    class: CLASS_LABEL[category],
    tagline: s.short_tagline,
    description: s.description,
    price,
    regularPrice: price,
    currency: s.currency || "EUR",
    taxNote: s.tax_note || "excl. MwSt",
    inStock: /in\s*stock/i.test(s.availability),
    variants: (s.variants ?? []).map((v) => ({ name: v.option_name, values: v.values })),
    specs: {
      engine: s.specifications?.engine ?? [],
      dimensions: s.specifications?.dimensions_and_weight ?? [],
      performance: s.specifications?.performance_and_load ?? [],
      hydraulics: s.specifications?.hydraulic_system ?? [],
      other: (s.specifications?.other_sections ?? []).map((sec) => ({
        name: sec.section_name,
        rows: sec.rows,
      })),
    },
    images,
  };
}

export const PRODUCTS: Product[] = (raw as unknown as RawProduct[]).map(adapt);

const BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function getProduct(id: string): Product | undefined {
  return BY_ID[id];
}

export function productsByCategory(cat: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === cat);
}

/** The product the homepage hero and spotlight feature. */
export const FLAGSHIP_ID = "r10-eco";
export const FLAGSHIP: Product = BY_ID[FLAGSHIP_ID] ?? PRODUCTS[0];
