"use client";

import { useEffect, useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Icon } from "@/components/Icon";
import { Footer } from "@/components/sections";
import { euro } from "@/lib/data";
import { priceOrder, SHIPPING, DELIVERY_TIME, type Fulfilment } from "@/lib/order-pricing";
import { useCart } from "@/lib/cart";
import { useGo } from "@/lib/nav";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export function CheckoutView() {
  const go = useGo();
  const { cart: items, placeOrder, showToast } = useCart();
  const [fulfil, setFulfil] = useState<Fulfilment>("delivery-de");
  const [accepted, setAccepted] = useState(false); // AGB + Datenschutz (Task 13)
  const [error, setError] = useState("");

  // empty cart → back to cart
  useEffect(() => {
    if (!items.length) go("cart");
  }, [items.length, go]);

  // Server-authoritative pricing, mirrored here for display.
  const priced = useMemo(() => {
    try {
      return priceOrder(items.map((it) => ({ key: it.key, qty: it.qty })), fulfil);
    } catch {
      return null;
    }
  }, [items, fulfil]);

  if (!items.length || !priced) return null;

  const lineItems = items.map((it) => ({ key: it.key, qty: it.qty }));

  return (
    <div className="page page--shop">
      <div className="lead"><h1>Kasse</h1></div>

      {/* Fulfilment + delivery region (Task 5) */}
      <div className="wrap">
        <h3 style={{ fontSize: 17, margin: "4px 0 10px" }}>Lieferung</h3>
        <div className="pay">
          <button className={"payopt " + (fulfil === "delivery-de" ? "payopt--on" : "")} onClick={() => setFulfil("delivery-de")}>
            <span className="payopt__ic">{Icon.truck()}</span>
            <span className="payopt__t"><b>Innerhalb Deutschlands</b><span>{DELIVERY_TIME.de}</span></span>
            <span className="payopt__p">{euro(SHIPPING["delivery-de"])}</span>
            <span className="radio" />
          </button>
          <button className={"payopt " + (fulfil === "delivery-eu" ? "payopt--on" : "")} onClick={() => setFulfil("delivery-eu")}>
            <span className="payopt__ic">{Icon.truck()}</span>
            <span className="payopt__t"><b>Innerhalb der EU</b><span>{DELIVERY_TIME.eu}</span></span>
            <span className="payopt__p">{euro(SHIPPING["delivery-eu"])}</span>
            <span className="radio" />
          </button>
          <button className={"payopt " + (fulfil === "pickup" ? "payopt--on" : "")} onClick={() => setFulfil("pickup")}>
            <span className="payopt__ic">{Icon.pickup()}</span>
            <span className="payopt__t"><b>Selbstabholung</b><span>Abholung in unserem EU-Lager</span></span>
            <span className="payopt__p">Kostenlos</span>
            <span className="radio" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="wrap" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 17, margin: "4px 0 10px" }}>Zusammenfassung</h3>
        <div className="summary" style={{ padding: "0 0 8px" }}>
          <div className="summary__row"><span>Zwischensumme (netto)</span><span>{euro(priced.itemTotalNet)}</span></div>
          <div className="summary__row"><span>{fulfil === "pickup" ? "Selbstabholung" : "Lieferung (pauschal)"}</span><span>{priced.shippingNet ? euro(priced.shippingNet) : "Kostenlos"}</span></div>
          <div className="summary__row"><span>zzgl. {Math.round(priced.vatRate * 100)} % MwSt.</span><span>{euro(priced.vatAmount)}</span></div>
          <div className="summary__row summary__row--total"><span>Gesamt</span><span>{euro(priced.totalGross)}</span></div>
        </div>
      </div>

      {/* AGB + Datenschutz acceptance (Task 13) */}
      <div className="wrap" style={{ marginTop: 16 }}>
        <label className="accept">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            Ich akzeptiere die{" "}
            <a href="/agb" target="_blank" rel="noopener noreferrer">AGB</a>{" "}und die{" "}
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>.
          </span>
        </label>
      </div>

      {/* Payment */}
      <div className="wrap" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 17, margin: "4px 0 12px" }}>Bezahlen</h3>
        {error ? (
          <p style={{ color: "#b3261e", fontSize: 14, marginBottom: 12 }}>{error}</p>
        ) : null}
        {!accepted ? (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
            Bitte akzeptieren Sie zuerst AGB und Datenschutzerklärung, um fortzufahren.
          </p>
        ) : null}

        {!PAYPAL_CLIENT_ID ? (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            PayPal ist nicht konfiguriert (NEXT_PUBLIC_PAYPAL_CLIENT_ID fehlt).
          </p>
        ) : (
          <div style={{ opacity: accepted ? 1 : 0.5, pointerEvents: accepted ? "auto" : "none" }}>
            <PayPalScriptProvider
              options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", intent: "capture" }}
            >
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "pill", label: "paypal" }}
                disabled={!accepted}
                forceReRender={[fulfil, priced.totalGross, accepted]}
                createOrder={async () => {
                  setError("");
                  const res = await fetch("/api/paypal/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: lineItems, fulfil }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Fehler beim Start der Zahlung.");
                  return data.id as string;
                }}
                onApprove={async (data) => {
                  const res = await fetch(`/api/paypal/orders/${data.orderID}/capture`, { method: "POST" });
                  const result = await res.json();
                  if (!res.ok || result.status !== "COMPLETED") {
                    setError("Die Zahlung konnte nicht abgeschlossen werden.");
                    return;
                  }
                  const total = Number(result.amount) || priced.totalGross;
                  const email = result.email || "";
                  // Fire-and-forget confirmation email (Task 6) — never block the redirect.
                  if (email) {
                    fetch("/api/email/order-confirmation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, items: lineItems, fulfil, orderId: data.orderID }),
                    }).catch(() => {});
                  }
                  placeOrder({ fulfil, total, email, reference: data.orderID });
                  // Redirect to homepage with a confirmation banner (Task 14).
                  go("home");
                }}
                onCancel={() => showToast("Zahlung abgebrochen")}
                onError={() => setError("Bei der Zahlung ist ein Fehler aufgetreten. Bitte erneut versuchen.")}
              />
            </PayPalScriptProvider>
          </div>
        )}

        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", margin: "14px 0 0" }}>
          Testmodus (PayPal Sandbox) — es wird keine echte Zahlung verarbeitet.
        </p>
      </div>
      <Footer go={go} />
    </div>
  );
}
