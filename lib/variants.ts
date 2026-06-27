/* Engine variants (Task 2).
 *
 * Reusable, per-product engine-option data: each product id can map to an engine
 * configuration with two or more options. Selecting an option updates the price
 * (base price + priceDelta), the cart line, and the engine spec table — all live.
 *
 * This is intentionally a small data registry so the same UI works for every
 * product: add an entry here and the product page picks it up automatically.
 *
 * Spec source for R10 ECO: rippa-europe.com/products/r10-eco-1 (verified).
 */

import type { SpecRow } from "./products";

export type EngineOption = {
  id: string;
  /** Customer-facing label (German). */
  label: string;
  /** € added to the product's base price when this option is selected (may be negative). */
  priceDelta: number;
  /** true => the upcharge is not yet confirmed by the client (shows a note). */
  priceTbd?: boolean;
  /** Short German description of this option, shown when selected. */
  desc?: string;
  /** Spec rows shown (in German) while this option is selected. */
  specs?: SpecRow[];
};

export type EngineConfig = {
  /** Heading for the selector, e.g. "Motor" or "Hydraulikfunktion". */
  label: string;
  /** When true, the selected option's `specs` replace the engine spec table. */
  replacesEngineSpecs?: boolean;
  /** First option is the base/default (matches the product's base price). */
  options: EngineOption[];
};

const R10_ECO_ENGINES: EngineConfig = {
  label: "Motor",
  replacesEngineSpecs: true,
  options: [
    {
      id: "yoop-1cyl",
      label: "Einzylinder-Dieselmotor (Yoop)",
      priceDelta: 0,
      specs: [
        { field: "Modell / Hersteller", eu: "Yoop 192F" },
        { field: "Max. Leistung", eu: "10,4 PS" },
        { field: "Max. Leistung (kW)", eu: "7,5 kW" },
        { field: "Hubraum", eu: "0,499 L" },
        { field: "Zylinder", eu: "1" },
        { field: "Kühlung", eu: "Luftgekühlt" },
        { field: "Motoröl", eu: "1,325 L" },
        { field: "Max. Drehzahl", eu: "3.000 U/min" },
        { field: "Betriebsgewicht", eu: "978 kg" },
      ],
    },
    {
      id: "kubota-2cyl",
      label: "Zweizylinder-Dieselmotor (Kubota)",
      // €7.673 vs €5.625 base (rippa-europe r10-eco-1).
      priceDelta: 2048,
      specs: [
        { field: "Modell / Hersteller", eu: "Kubota Z482" },
        { field: "Max. Leistung", eu: "11 PS" },
        { field: "Max. Leistung (kW)", eu: "8,2 kW" },
        { field: "Hubraum", eu: "0,497 L" },
        { field: "Zylinder", eu: "2" },
        { field: "Kühlung", eu: "Wassergekühlt" },
        { field: "Motoröl", eu: "1,2 L" },
        { field: "Max. Drehzahl", eu: "3.000 U/min" },
        { field: "Betriebsgewicht", eu: "1.000 kg" },
      ],
    },
  ],
};

/* RD-06 dumper: "Hydraulikfunktion" — Rise and Fall (€5.000, base) vs No Rise and
 * Fall (€4.490). Same machine specs otherwise (verified on rippa-europe), so only
 * the price + description change. Base product price is €5.000 (Rise and Fall). */
const RD06_HYDRAULIK: EngineConfig = {
  label: "Hydraulikfunktion",
  options: [
    {
      id: "rise-fall",
      label: "Heben und Kippen",
      priceDelta: 0,
      desc: "Hydraulisches Heben und Kippen der Mulde — für eine höhere Entladehöhe.",
    },
    {
      id: "no-rise-fall",
      label: "Nur Kippen",
      priceDelta: -510, // 4.490 statt 5.000
      desc: "Mulde kippt zum Entladen, ohne hydraulisches Heben.",
    },
  ],
};

/* R15 ECO cabin option: Ohne Kabine (€9.999, base) vs Mit Kabine (€11.499) —
 * verified on rippa-europe r15-eco-1. The cabin upgrade adds €1.500. */
const R15_ECO_CABINE: EngineConfig = {
  label: "Kabine",
  options: [
    {
      id: "ohne-kabine",
      label: "Ohne Kabine",
      priceDelta: 0,
      desc: "Offene Fahrerplattform mit Schutzdach (ROPS).",
    },
    {
      id: "mit-kabine",
      label: "Mit Kabine",
      priceDelta: 1500, // 11.499 statt 9.999
      desc: "Geschlossene Kabine — Wetterschutz und mehr Komfort.",
    },
  ],
};

/** Registry: product id -> variant configuration. Add products here as needed. */
export const ENGINE_VARIANTS: Record<string, EngineConfig> = {
  "r10-eco": R10_ECO_ENGINES,
  "rd-06": RD06_HYDRAULIK,
  "r15-eco": R15_ECO_CABINE,
};

export function engineConfig(productId: string): EngineConfig | undefined {
  return ENGINE_VARIANTS[productId];
}

export function engineOption(productId: string, optionId?: string): EngineOption | undefined {
  if (!optionId) return undefined;
  return engineConfig(productId)?.options.find((o) => o.id === optionId);
}

/** Price added to the base price for the chosen engine option (0 if none). */
export function engineDelta(productId: string, optionId?: string): number {
  return engineOption(productId, optionId)?.priceDelta ?? 0;
}

/** Default (base) engine option id for a product, if it has engine variants. */
export function defaultEngineId(productId: string): string | undefined {
  return engineConfig(productId)?.options[0]?.id;
}
