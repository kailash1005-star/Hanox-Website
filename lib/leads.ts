/* Lead capture (system of records) — server-only.
 *
 * Every interest form on the site (auf-Anfrage product inquiry, electric
 * waitlist, contact form, newsletter) is persisted to the `leads` collection so
 * the team has a durable record to follow up on, independent of email delivery.
 *
 * Best-effort: if MONGODB_URI is unset or the DB is briefly unreachable, the
 * caller still emails the lead — a failed DB write must never lose the lead. */

import type { Document } from "mongodb";
import { getDb, isDbConfigured } from "./db";

export type LeadType = "product-inquiry" | "electric-waitlist" | "contact" | "newsletter";

export type Lead = {
  type: LeadType;
  name?: string;
  email: string;
  country?: string;
  note?: string;
  productId?: string;
  productName?: string;
  source?: string;
};

/** Persist a lead. Returns { ok } / { skipped } — never throws to the caller path. */
export async function saveLead(lead: Lead): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isDbConfigured()) return { ok: false, skipped: true };
  try {
    const db = await getDb();
    await db.collection("leads").insertOne({
      ...lead,
      status: "new",
      createdAt: new Date(),
    } as Document);
    return { ok: true };
  } catch (e) {
    console.error("saveLead failed:", e);
    return { ok: false };
  }
}
