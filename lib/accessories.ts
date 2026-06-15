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

const ACCESSORY_BY_ID: Record<string, Accessory> = Object.fromEntries(
  ACCESSORIES.map((a) => [a.id, a])
);

/** Look up an accessory by its id (used for server-authoritative cart pricing). */
export function getAccessory(id: string): Accessory | undefined {
  return ACCESSORY_BY_ID[id];
}

/** Machine (product id) -> accessory group id. Order = chooser display order. */
export const MACHINE_ACCESSORY_MAP: Record<string, string> = {
  "r10-eco": "r10",
  "r13-pro": "r10",
  "r15-eco": "r10",
  "r18-pro": "r18",
  "r22-pro": "r22",
  "r32-pro": "r32",
  "rs-04": "rs04",
  "rs-06": "rs06",
  "rs-07": "rs07",
};

/** Machine ids that have an accessories page (for the chooser + static params). */
export const ACCESSORY_MACHINE_IDS = Object.keys(MACHINE_ACCESSORY_MAP);

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

/** Accessory group for a given machine (product) id, if any. */
export function groupForMachine(machineId: string): AccessoryGroup | undefined {
  const groupId = MACHINE_ACCESSORY_MAP[machineId];
  if (!groupId) return undefined;
  return ACCESSORY_GROUPS.find((g) => g.id === groupId);
}
