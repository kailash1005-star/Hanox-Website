import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The public, canonical domain. Anyone landing on the Vercel-generated
// production URL is permanently redirected here so there is one address,
// one set of cookies, and clean SEO/canonical signals.
const CANONICAL_HOST = "hanox-baumaschinen.de";

// Only the production Vercel host is redirected — preview/branch deploys
// (…-git-…vercel.app) keep working so they remain testable.
const VERCEL_PROD_HOST = "hanox-website.vercel.app";

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();

  if (host === VERCEL_PROD_HOST) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Skip API routes (so the PayPal webhook keeps working on any host),
// Next internals, and static files.
export const config = {
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
