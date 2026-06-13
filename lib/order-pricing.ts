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

export const VAT_RATE = 0.19;
export const SHIPPING_NET = 300; // flat delivery fee (net €)
export type Fulfilment = "pickup" | "delivery";

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
    const model = byId(modelId);
    if (!model) throw new Error(`Unbekanntes Modell: ${modelId}`);
    if (!model.inStock) throw new Error(`${model.name} ist nicht zum Kauf verfügbar.`);

    // Addons not implemented for the new catalogue yet; keep the key shape so the
    // checkout flow keeps working and add-on data can be re-introduced later.
    void addonIds;
    const qty = Math.max(1, Math.floor(it.qty));
    return { key: it.key, name: model.name, qty, unitNet: model.price };
  });

  const itemTotalNet = lines.reduce((s, l) => s + l.unitNet * l.qty, 0);
  const shippingNet = fulfil === "delivery" ? SHIPPING_NET : 0;
  const vatAmount = round2((itemTotalNet + shippingNet) * VAT_RATE);
  const totalGross = round2(itemTotalNet + shippingNet + vatAmount);

  return { lines, itemTotalNet, shippingNet, vatRate: VAT_RATE, vatAmount, totalGross };
}

/** Format a number as a PayPal money string, e.g. 5625 -> "5625.00". */
export const money = (n: number) => n.toFixed(2);
