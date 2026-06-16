import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep transactional/admin paths out of the index.
      disallow: ["/api/", "/admin", "/keystatic", "/kasse", "/warenkorb", "/bestellung-bestaetigt"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
