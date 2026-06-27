/* Enrich public/products/accessories.json with size/option variants pulled
 * directly from rippa-europe's Shopify product JSON (<url>.json).
 *
 * For each accessory we read the live `options` (e.g. "Größe") and `variants`
 * (title -> price). When a product has more than one real variant we attach:
 *   options: { name, values: [{ id, label, price }] }
 * and set the base `price` to the cheapest variant (the "ab" price). Products
 * with a single "Default Title" variant are left as a plain priced item.
 *
 * Re-run after the catalogue changes:  node scripts/build-accessory-variants.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "public", "products", "accessories.json");
const items = JSON.parse(readFileSync(file, "utf8"));

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function fetchVariants(url) {
  const res = await fetch(url + ".json", { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${res.status}`);
  const p = JSON.parse(await res.text()).product;
  const variants = (p.variants || [])
    .filter((v) => v.title && v.title !== "Default Title")
    .map((v) => ({ label: v.title, price: Math.round(Number(v.price)) }));
  const optName = p.options?.[0]?.name || "Größe";
  return { optName, variants };
}

// Limited concurrency so we are polite to the source.
async function run() {
  let updated = 0;
  let plain = 0;
  for (let i = 0; i < items.length; i += 5) {
    const slice = items.slice(i, i + 5);
    await Promise.all(
      slice.map(async (it) => {
        try {
          const { optName, variants } = await fetchVariants(it.url);
          if (variants.length > 1) {
            // Deduplicate ids (some labels collide after slugging).
            const seen = new Set();
            const values = variants.map((v) => {
              let id = slug(v.label) || "opt";
              while (seen.has(id)) id += "-x";
              seen.add(id);
              return { id, label: v.label, price: v.price };
            });
            it.options = { name: optName, values };
            it.price = Math.min(...values.map((v) => v.price));
            updated++;
            process.stdout.write("+");
          } else {
            delete it.options;
            plain++;
            process.stdout.write(".");
          }
        } catch (e) {
          delete it.options;
          process.stdout.write("!");
        }
      })
    );
  }
  writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
  console.log(`\nDone. ${updated} with options, ${plain} single-price, ${items.length} total.`);
}

run();
