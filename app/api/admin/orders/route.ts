import { NextResponse } from "next/server";
import { listOrders, type OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin: list stored orders. Protected by a shared secret in ADMIN_TOKEN — sent
 * as `x-admin-token` header (or `?token=`). This is intentionally simple; for a
 * larger team swap in real auth (NextAuth / SSO) later.
 */
function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false; // fail closed if not configured
  const url = new URL(req.url);
  const provided = req.headers.get("x-admin-token") || url.searchParams.get("token") || "";
  // Constant-time-ish compare (length check first); fine for a shared admin secret.
  return provided.length === expected.length && provided === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") as OrderStatus) || undefined;
  const email = url.searchParams.get("email") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 100;

  try {
    const orders = await listOrders({ status, email, limit });
    return NextResponse.json({ orders, count: orders.length });
  } catch (e) {
    console.error("admin/orders failed:", e);
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }
}
