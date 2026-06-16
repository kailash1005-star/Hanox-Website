import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hanox-baumaschinen.de";

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
