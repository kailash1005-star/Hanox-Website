/* Canonical site URL — validated once, safe everywhere.
 *
 * NEXT_PUBLIC_SITE_URL is operator-set and can be wrong (empty, missing the
 * protocol, or an accidental paste). A bad value must NOT crash the build via
 * `new URL(...)` in metadata. We validate it and fall back to the canonical
 * domain if it isn't a usable absolute URL. */

function resolve(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    } catch {
      /* invalid → fall through to default */
    }
  }
  return "https://hanox-baumaschinen.de";
}

export const SITE_URL = resolve();
