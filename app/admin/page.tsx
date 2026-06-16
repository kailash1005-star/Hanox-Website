"use client";

import { useCallback, useEffect, useState } from "react";

/* Minimal protected admin orders view.
 *
 * Enter the ADMIN_TOKEN once; it's kept in sessionStorage (cleared when the tab
 * closes) and sent as the x-admin-token header. Not a replacement for real auth —
 * good enough for a single operator to inspect orders. */

type OrderDoc = {
  _id: string;
  orderNumber: string;
  status: string;
  fulfil: string;
  amount: { totalGross: number; currency: string };
  customer: { name: string; email: string; phone?: string };
  paypal?: { captureId?: string; capturedAmount?: number };
  amountMismatch?: boolean;
  needsReview?: boolean;
  refundedTotal?: number;
  createdAt: string;
  paidAt?: string;
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#137333",
  CREATED: "#8a6d00",
  APPROVED: "#8a6d00",
  DECLINED: "#b3261e",
  FAILED: "#b3261e",
  CANCELLED: "#5f6368",
  REFUNDED: "#7b1fa2",
  PARTIALLY_REFUNDED: "#7b1fa2",
};

const euro = (n: number, c = "EUR") =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: c }).format(n);

export default function AdminOrdersPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders?limit=200", {
        headers: { "x-admin-token": tok },
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Falsches Token.");
        setAuthed(false);
        sessionStorage.removeItem("hanox-admin-token");
        return;
      }
      if (!res.ok) {
        setError("Fehler beim Laden.");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setAuthed(true);
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("hanox-admin-token");
    if (saved) {
      setToken(saved);
      load(saved);
    }
  }, [load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("hanox-admin-token", token);
    load(token);
  };

  const wrap: React.CSSProperties = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily: "system-ui, Arial, sans-serif",
    color: "#16181b",
  };

  if (!authed) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 22 }}>Hanox · Bestellungen</h1>
        <form onSubmit={submit} style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input
            type="password"
            placeholder="Admin-Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, minWidth: 280 }}
          />
          <button
            type="submit"
            style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#16181b", color: "#fff", cursor: "pointer" }}
          >
            Anmelden
          </button>
        </form>
        {error ? <p style={{ color: "#b3261e", marginTop: 10 }}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Hanox · Bestellungen ({orders.length})</h1>
        <button
          onClick={() => load(token)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        >
          {loading ? "Lädt…" : "Aktualisieren"}
        </button>
      </div>
      {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}

      <div style={{ overflowX: "auto", marginTop: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #16181b" }}>
              <th style={{ padding: 8 }}>Referenz</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Kunde</th>
              <th style={{ padding: 8 }}>Lieferung</th>
              <th style={{ padding: 8, textAlign: "right" }}>Betrag</th>
              <th style={{ padding: 8 }}>Datum</th>
              <th style={{ padding: 8 }}>PayPal</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>
                  {o.orderNumber}
                  {o.needsReview ? <span title="Prüfen" style={{ color: "#b3261e" }}> ⚠</span> : null}
                  {o.amountMismatch ? <span title="Betrag weicht ab" style={{ color: "#b3261e" }}> ₿</span> : null}
                </td>
                <td style={{ padding: 8 }}>
                  <span style={{ color: STATUS_COLORS[o.status] || "#16181b", fontWeight: 700 }}>{o.status}</span>
                  {o.refundedTotal ? <div style={{ color: "#7b1fa2", fontSize: 11 }}>−{euro(o.refundedTotal)}</div> : null}
                </td>
                <td style={{ padding: 8 }}>
                  {o.customer?.name}
                  <div style={{ color: "#5f6368", fontSize: 11 }}>{o.customer?.email}</div>
                </td>
                <td style={{ padding: 8 }}>{o.fulfil}</td>
                <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                  {euro(o.amount?.totalGross ?? 0, o.amount?.currency)}
                </td>
                <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleString("de-DE") : ""}
                </td>
                <td style={{ padding: 8, fontSize: 11, color: "#5f6368" }}>
                  <div title={o._id}>{o._id.slice(0, 10)}…</div>
                  {o.paypal?.captureId ? <div title={o.paypal.captureId}>cap {o.paypal.captureId.slice(0, 8)}…</div> : null}
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#5f6368" }}>
                  Noch keine Bestellungen.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
