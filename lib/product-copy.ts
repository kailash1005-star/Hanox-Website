/* German copy overrides (Task 10).
 *
 * Product content is scraped from rippa-europe in English. Where we have a
 * native-German rewrite of a product's tagline/description, it goes here and the
 * product page prefers it over the scraped English text.
 *
 * TODO(Task 10): translate the remaining products' taglines/descriptions and the
 * spec field labels/values, which are still English in products.json. */

export type ProductCopy = { tagline?: string; description?: string };

export const PRODUCT_COPY_DE: Record<string, ProductCopy> = {
  "r10-eco": {
    tagline:
      "Vielseitiger Mini-Bagger für Bau, Garten- und Landschaftsbau sowie private Projekte.",
    description:
      "Der R10 ECO ist ein extrem robuster, zuverlässiger und wertstabiler Minibagger – perfekt für Bauarbeiten, den Garten- und Landschaftsbau sowie private Projekte. Das Beste für Sie: Er kommt direkt in serienmäßiger Vollausstattung zu Ihnen und ist ohne Extrakosten oder Wartezeiten sofort einsatzbereit für jede Herausforderung.",
  },
};

export function copyDe(id: string): ProductCopy {
  return PRODUCT_COPY_DE[id] ?? {};
}
