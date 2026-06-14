/* Accessories (Zubehör) loader.
 *
 * Data scraped from rippa-europe.com/collections/zubehor via
 * scripts/build-accessories.mjs into public/products/accessories.json. */

import raw from "../public/products/accessories.json";

export type Accessory = {
  id: string;
  title: string;       // exact source title
  name: string;        // German display name
  price: number;       // EUR (net)
  group: string;       // machine group id
  groupLabel: string;  // German section heading
  order: number;
  image: string;       // local path under /public
  url: string;         // source product url
};

export const ACCESSORIES: Accessory[] = raw as Accessory[];

export type AccessoryGroup = { id: string; label: string; items: Accessory[] };

/** Accessories grouped by compatible machine, in display order. */
export const ACCESSORY_GROUPS: AccessoryGroup[] = (() => {
  const map = new Map<string, AccessoryGroup>();
  for (const a of ACCESSORIES) {
    let g = map.get(a.group);
    if (!g) {
      g = { id: a.group, label: a.groupLabel, items: [] };
      map.set(a.group, g);
    }
    g.items.push(a);
  }
  return Array.from(map.values()).sort(
    (x, y) => (x.items[0]?.order ?? 99) - (y.items[0]?.order ?? 99)
  );
})();
