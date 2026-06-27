/* Server-authoritative order pricing.
 *
 * Prices are ALWAYS recomputed here from the catalogue (lib/data.ts) using the
 * cart line key (`<modelId>:<sortedAddonIds>` produced in lib/cart.tsx) — never
 * trusted from the client. Used both server-side (PayPal order creation) and
 * client-side (checkout summary display) so the numbers always match.
 *
 * VAT: flat 19% German rate for now (configurable). Reverse-charge / OSS comes
 * later with the invoicing layer. */

import { byId } from "./data";
import { engineDelta } from "./variants";
import { getAccessory, getAccessoryOption } from "./accessories";

export const VAT_RATE = 0.19;

/** Flat delivery fees (net €; VAT is added on top like the product prices). */
export const SHIPPING = {
  "delivery-de": 550, // Innerhalb Deutschlands
  "delivery-eu": 750, // Innerhalb der EU
} as const;

export type Fulfilment = "pickup" | "delivery-de" | "delivery-eu";

/** Human label for a fulfilment option (German). */
export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  pickup: "Selbstabholung",
  "delivery-de": "Lieferung innerhalb Deutschlands",
  "delivery-eu": "Lieferung innerhalb der EU",
};

/** Delivery-time wording shown on product pages and at checkout (Task 4). */
export const DELIVERY_TIME = {
  de: "Innerhalb Deutschlands: 2–7 Tage",
  eu: "Innerhalb der EU: 2–4 Wochen",
} as const;

export type CartLineInput = { key: string; qty: number };

export type PricedLine = { key: string; name: string; qty: number; unitNet: number };
export type PricedOrder = {
  lines: PricedLine[];
  itemTotalNet: number;
  shippingNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Parse a cart line key into its model id and addon ids. */
function parseKey(key: string): { modelId: string; addonIds: string[] } {
  const i = key.indexOf(":");
  if (i === -1) return { modelId: key, addonIds: [] };
  const modelId = key.slice(0, i);
  const rest = key.slice(i + 1);
  return { modelId, addonIds: rest ? rest.split(",") : [] };
}

/**
 * Recompute an order total from cart lines + fulfilment. Throws if a line refers
 * to an unknown or non-purchasable (not inStock) model — enforcing the business
 * rule that only in-stock models can be checked out.
 */
export function priceOrder(items: CartLineInput[], fulfil: Fulfilment): PricedOrder {
  const lines: PricedLine[] = items.map((it) => {
    const { modelId, addonIds } = parseKey(it.key);
    const qty = Math.max(1, Math.floor(it.qty));

    // Accessory line: key shape "acc:<accessoryId>" or "acc:<accessoryId>,<optionId>".
    if (modelId === "acc") {
      const acc = getAccessory(addonIds[0]);
      if (!acc) throw new Error(`Unbekanntes Zubehör: ${addonIds[0]}`);
      const opt = getAccessoryOption(acc, addonIds[1]);
      if (addonIds[1] && !opt) throw new Error(`Unbekannte Variante: ${addonIds[1]}`);
      return {
        key: it.key,
        name: opt ? `${acc.name} (${opt.label})` : acc.name,
        qty,
        unitNet: opt ? opt.price : acc.price,
      };
    }

    const model = byId(modelId);
    if (!model) throw new Error(`Unbekanntes Modell: ${modelId}`);
    if (!model.inStock) throw new Error(`${model.name} ist nicht zum Kauf verfügbar.`);

    // The first key token (if any) is the chosen engine-variant id; recompute the
    // unit price from the base price + the variant's confirmed price delta.
    const variantId = addonIds[0];
    const unitNet = model.price + engineDelta(modelId, variantId);
    return { key: it.key, name: model.name, qty, unitNet };
  });

  const itemTotalNet = lines.reduce((s, l) => s + l.unitNet * l.qty, 0);
  const shippingNet = fulfil === "pickup" ? 0 : SHIPPING[fulfil];
  const vatAmount = round2((itemTotalNet + shippingNet) * VAT_RATE);
  const totalGross = round2(itemTotalNet + shippingNet + vatAmount);

  return { lines, itemTotalNet, shippingNet, vatRate: VAT_RATE, vatAmount, totalGross };
}

/** Format a number as a PayPal money string, e.g. 5625 -> "5625.00". */
export const money = (n: number) => n.toFixed(2);
