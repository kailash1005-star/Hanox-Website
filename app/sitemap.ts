import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/products";
import { ACCESSORY_MACHINE_IDS } from "@/lib/accessories";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const path = (p: string) => `${SITE_URL}${p}`;

  const staticRoutes = ["", "/bagger", "/elektro", "/zubehoer", "/ueber-uns", "/kontakt", "/impressum", "/datenschutz", "/agb"];

  const productRoutes = PRODUCTS.map((p) => `/bagger/${p.id}`);
  const accessoryRoutes = ACCESSORY_MACHINE_IDS.map((id) => `/zubehoer/${id}`);

  return [...staticRoutes, ...productRoutes, ...accessoryRoutes].map((p) => ({
    url: path(p),
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
