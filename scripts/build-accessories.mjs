/* One-time importer for the rippa-europe "Zubehör" collection.
 * Reads the scraped Shopify products.json (_zubehor.json), normalises each
 * accessory (German type name, machine group, price, local image), downloads
 * the images into public/products/accessories/, and writes
 * public/products/accessories.json for lib/accessories.ts to consume. */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "_zubehor.json"), "utf8"));
const outDir = join(root, "public", "products", "accessories");
mkdirSync(outDir, { recursive: true });

// English type -> German display name (longest keys matched first).
const TYPE_DE = {
  "tooth bucket": "Zahnschaufel",
  "mud bucket": "Glattschaufel",
  "tilt bucket": "Kippschaufel",
  "grid bucket": "Siebschaufel",
  gridbucket: "Siebschaufel",
  siebschaufel: "Siebschaufel",
  "earth auger": "Erdbohrer",
  "earth drill": "Erdbohrer",
  auger: "Erdbohrer",
  "pallet fork": "Palettengabel",
  fork: "Gabel",
  "hydraulic breaker": "Hydraulikhammer",
  "hydraulic hammer": "Hydraulikhammer",
  ripper: "Aufreißer",
  "crocodile grapple": "Krokodilgreifer",
  "crocodile grab": "Krokodilgreifer",
  "rotary wood grab": "Dreh-Holzgreifer",
  "grab bucket": "Greiferschaufel",
  grapple: "Greifer",
  "4 in 1 shovel": "4-in-1-Schaufel",
  "enclosed sweeper": "Kehrmaschine mit Schaufel",
  sweeper: "Kehrmaschine",
  snowblower: "Schneefräse",
  snowplow: "Planierschild",
  "rotary tiller": "Bodenfräse",
  "trailer hitch": "Anhängerkupplung",
  "concrete mixer": "Betonmischer",
  "floor roller": "Straßenwalze",
  "road roller": "Straßenwalze",
  mulcher: "Mulcher",
  "studded roller": "Stachelwalze",
  "harley rake": "Harley-Rake",
  "stump grinder": "Wurzelfräse",
  "wood chipper": "Holzhäcksler",
  "horizontal log splitter": "Holzspalter (horizontal)",
  "log splitter": "Holzspalter",
  "lawn aerator": "Rasenlüfter",
  "dozer blade": "Bodenglätter",
  "trench filler": "Grabenfüller",
  "trench cutter": "Grabenfräse",
  brushcutter: "Freischneider",
  "mower attachment": "Mähwerk",
  "excavator arm": "Baggerarm",
  "towing crane": "Zugkran",
  "mixing bucket": "Mischschaufel",
};
const TYPE_KEYS = Object.keys(TYPE_DE).sort((a, b) => b.length - a.length);

function germanName(title) {
  const t = title.toLowerCase();
  for (const k of TYPE_KEYS) if (t.includes(k)) return TYPE_DE[k];
  return title.split(/\s[–-]\s/)[0].trim(); // fallback: part before the dash
}

function machineGroup(title, handle) {
  const t = (title + " " + handle).toLowerCase();
  if (/r18/.test(t)) return { id: "r18", label: "Für R18 PRO", order: 4 };
  if (/r22/.test(t)) return { id: "r22", label: "Für R22 PRO", order: 5 };
  if (/r32/.test(t)) return { id: "r32", label: "Für R32 PRO", order: 6 };
  if (/r10|r13|r15/.test(t)) return { id: "r10", label: "Für Mini-Bagger R10 / R13 / R15", order: 1 };
  if (/rs.?0?4/.test(t)) return { id: "rs04", label: "Für Kompaktlader RS 04", order: 7 };
  if (/rs.?0?6|rs.?6/.test(t)) return { id: "rs06", label: "Für Kompaktlader RS 06", order: 8 };
  if (/rs.?0?7|rs.?7/.test(t)) return { id: "rs07", label: "Für Kompaktlader RS 07", order: 9 };
  return { id: "other", label: "Weiteres Zubehör", order: 99 };
}

function fileFromUrl(url) {
  const clean = url.split("?")[0];
  return clean.split("/").pop();
}

async function download(url, dest) {
  if (existsSync(dest)) return;
  const res = await fetch(url.startsWith("//") ? "https:" + url : url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

const items = [];
const seen = new Set();
for (const p of raw.products) {
  const img = (p.images?.[0]?.src) || "";
  if (!img) continue;
  const file = fileFromUrl(img);
  const localPath = `/products/accessories/${file}`;
  if (!seen.has(file)) {
    seen.add(file);
    try {
      await download(img, join(outDir, file));
      process.stdout.write(".");
    } catch (e) {
      console.warn("\nimg fail:", e.message);
    }
  }
  const g = machineGroup(p.title, p.handle);
  items.push({
    id: p.handle,
    title: p.title,
    name: germanName(p.title),
    price: Number(p.variants?.[0]?.price ?? 0),
    group: g.id,
    groupLabel: g.label,
    order: g.order,
    image: localPath,
    url: `https://rippa-europe.com/products/${p.handle}`,
  });
}

items.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "de"));
writeFileSync(join(root, "public", "products", "accessories.json"), JSON.stringify(items, null, 2));
console.log(`\nWrote ${items.length} accessories, ${seen.size} unique images.`);
