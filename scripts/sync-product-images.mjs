/**
 * Scans public/products/<model-id>/ and writes lib/product-images.generated.json
 * mapping each model id to its ordered list of public image URLs.
 *
 * Filenames are sorted naturally (so "01-…", "02-…", "10-…" order correctly); the
 * first image becomes the card thumbnail / hero shot. A folder with no images is
 * omitted, which makes the model fall back to the silhouette placeholder.
 *
 * Run via `npm run sync:images` (also wired to predev/prebuild).
 */
import { readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsDir = join(root, "public", "products");
const outFile = join(root, "lib", "product-images.generated.json");

const IMAGE_RE = /\.(png|jpe?g|webp|avif|gif)$/i;
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const manifest = {};

let entries = [];
try {
  entries = readdirSync(productsDir);
} catch {
  console.warn(`No products directory at ${productsDir} — writing empty manifest.`);
}

for (const id of entries.sort(natural)) {
  const dir = join(productsDir, id);
  let st;
  try {
    st = statSync(dir);
  } catch {
    continue;
  }
  if (!st.isDirectory()) continue;

  const files = readdirSync(dir).filter((f) => IMAGE_RE.test(f)).sort(natural);
  if (files.length) manifest[id] = files.map((f) => `/products/${id}/${f}`);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n");

const total = Object.values(manifest).reduce((n, arr) => n + arr.length, 0);
console.log(`sync-product-images: ${Object.keys(manifest).length} model(s), ${total} image(s) → lib/product-images.generated.json`);
