"use client";

import { Btn } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Footer } from "@/components/sections";
import { euro } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { useGo } from "@/lib/nav";

export function ConfirmView() {
  const go = useGo();
  const { order } = useCart();
  return (
    <div className="page page--shop">
      <div className="confirm">
        <div className="confirm__ic">{Icon.check()}</div>
        <h1 style={{ fontSize: 26 }}>Bestellung aufgegeben</h1>
        <p style={{ margin: "10px 0 4px" }}>
          Vielen Dank. Wir haben Ihre Bestätigung per E-Mail gesendet und melden uns, um die{" "}
          {order && order.fulfil.startsWith("delivery") ? "Lieferung" : "Abholung"} zu vereinbaren.
        </p>
        {order ? <p style={{ fontWeight: 800, color: "var(--ink)", fontSize: 18 }}>Bezahlter Betrag: {euro(order.total)}</p> : null}
        <div style={{ marginTop: 22 }}>
          <Btn full onClick={() => go("home")}>Zurück zur Startseite</Btn>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
