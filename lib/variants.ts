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
  /** € added to the product's base price when this option is selected. */
  priceDelta: number;
  /** true => the upcharge is not yet confirmed by the client (shows a note). */
  priceTbd?: boolean;
  /** Engine spec rows shown (in German) while this option is selected. */
  specs: SpecRow[];
};

export type EngineConfig = {
  /** Heading for the selector, e.g. "Motor". */
  label: string;
  /** First option is the base/default. */
  options: EngineOption[];
};

const R10_ECO_ENGINES: EngineConfig = {
  label: "Motor",
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
      // TODO(CONFIRM): exact Kubota upcharge to be confirmed with the client.
      // Until then we add €0 and flag the price as provisional in the UI.
      priceDelta: 0,
      priceTbd: true,
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

/** Registry: product id -> engine configuration. Add products here as needed. */
export const ENGINE_VARIANTS: Record<string, EngineConfig> = {
  "r10-eco": R10_ECO_ENGINES,
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
