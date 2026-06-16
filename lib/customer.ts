/* Customer input validation/normalisation — shared by API routes.
 *
 * The buyer enters name / email / phone / shipping address on the checkout page
 * (we don't rely on PayPal's stored address for shipping large goods). This
 * validates that input server-side so we never persist garbage or hand PayPal a
 * malformed shipping address. */

import type { Customer } from "./orders";
import type { Fulfilment } from "./order-pricing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO2_RE = /^[A-Za-z]{2}$/;

export type CustomerValidation =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

/** Validate + normalise the customer payload. `fulfil` decides if an address is required. */
export function validateCustomer(input: unknown, fulfil: Fulfilment): CustomerValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Kundendaten fehlen." };
  }
  const c = input as Record<string, unknown>;

  const name = typeof c.name === "string" ? c.name.trim() : "";
  const email = typeof c.email === "string" ? c.email.trim() : "";
  const phone = typeof c.phone === "string" ? c.phone.trim() : "";

  if (name.length < 2) return { ok: false, error: "Bitte geben Sie Ihren Namen an." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Bitte geben Sie eine gültige E-Mail-Adresse an." };

  const customer: Customer = { name, email };
  if (phone) customer.phone = phone;

  // Pickup needs no shipping address; delivery does.
  if (fulfil === "pickup") {
    return { ok: true, customer };
  }

  const addr = (c.address && typeof c.address === "object" ? c.address : {}) as Record<string, unknown>;
  const line1 = typeof addr.line1 === "string" ? addr.line1.trim() : "";
  const line2 = typeof addr.line2 === "string" ? addr.line2.trim() : "";
  const city = typeof addr.city === "string" ? addr.city.trim() : "";
  const postalCode = typeof addr.postalCode === "string" ? addr.postalCode.trim() : "";
  const country = typeof addr.country === "string" ? addr.country.trim().toUpperCase() : "";

  if (!line1) return { ok: false, error: "Bitte geben Sie Ihre Straße und Hausnummer an." };
  if (!city) return { ok: false, error: "Bitte geben Sie Ihren Ort an." };
  if (!postalCode) return { ok: false, error: "Bitte geben Sie Ihre Postleitzahl an." };
  if (!ISO2_RE.test(country)) return { ok: false, error: "Bitte wählen Sie ein gültiges Land." };

  customer.address = { line1, city, postalCode, country, ...(line2 ? { line2 } : {}) };
  return { ok: true, customer };
}
