"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Logo } from "./ui";
import { useCart } from "@/lib/cart";
import { useGo, type Go, type View } from "@/lib/nav";
import { CONTACT } from "@/lib/contact";

/* ---------- Announcement bar ---------- */
export function TopBar() {
  const msgs = [
    "Alle Preise zzgl. MwSt. · Lieferung europaweit zum Pauschalpreis",
    "Lieferung: Innerhalb Deutschlands 2–7 Tage · Innerhalb der EU 2–4 Wochen",
    "Garantie bei jeder Maschine inklusive · EU-Ersatzteillager",
  ];
  return (
    <div className="topbar">
      <div className="topbar__track">
        {msgs.concat(msgs).map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  );
}

/* ---------- Header (announcement + nav) ---------- */
function Header({ go, cartCount, onMenu }: { go: Go; cartCount: number; onMenu: () => void }) {
  const nav: [View, string][] = [
    ["catalog", "Bagger"],
    ["electric", "Elektro"],
    ["accessories", "Zubehör"],
    ["about", "Über uns"],
    ["contact", "Kontakt"],
  ];
  return (
    <div className="hdr-wrap">
      <header className="hdr">
        <div className="hdr__inner">
          <button className="hdr__menu" onClick={onMenu} aria-label="Menü">{Icon.menu()}</button>
          <Logo size={20} onClick={() => go("home")} />
          <nav className="hdr__nav">
            {nav.map(([v, label], i) => (
              <button key={i} onClick={() => go(v)}>{label}</button>
            ))}
          </nav>
          <div className="hdr__actions">
            <a className="hdr__call" href={`tel:${CONTACT.phoneHref}`}>{Icon.phone()}<span>{CONTACT.phoneDisplay}</span></a>
            <button className="hdr__icon" onClick={() => go("catalog")} aria-label="Suche">{Icon.search()}</button>
            <button className="hdr__icon hdr__cart" onClick={() => go("cart")} aria-label="Warenkorb">
              {Icon.cart()}
              {cartCount > 0 ? <span className="hdr__count">{cartCount}</span> : null}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

/* ---------- Slide-in menu ---------- */
function MenuDrawer({ open, onClose, go }: { open: boolean; onClose: () => void; go: Go }) {
  const items: [View, string][] = [
    ["home", "Start"],
    ["catalog", "Alle Bagger"],
    ["accessories", "Zubehör"],
    ["electric", "Elektro-Reihe"],
    ["about", "Über Hanox"],
    ["contact", "Kontakt"],
    ["cart", "Warenkorb"],
  ];
  return (
    <div className={"drawer " + (open ? "drawer--open" : "")} onClick={onClose}>
      <nav className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__top">
          <Logo size={24} onClick={() => { go("home"); onClose(); }} />
          <button className="iconbtn" onClick={onClose} aria-label="Schließen">{Icon.close()}</button>
        </div>
        <ul className="drawer__list">
          {items.map(([v, label], i) => (
            <li key={i}>
              <button onClick={() => { go(v); onClose(); }}>{label} {Icon.arrow()}</button>
            </li>
          ))}
        </ul>
        <div className="drawer__foot">
          <p>{CONTACT.hours}</p>
          <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phoneDisplay}</a>
        </div>
      </nav>
    </div>
  );
}

/**
 * Site chrome rendered once in the root layout: sticky header, slide-in menu
 * drawer and the global toast. Wraps every page's content.
 */
export function Chrome({ children }: { children: React.ReactNode }) {
  const go = useGo();
  const { cartCount, toast, order, clearOrder } = useCart();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <Header go={go} cartCount={cartCount} onMenu={() => setMenu(true)} />
      <MenuDrawer open={menu} onClose={() => setMenu(false)} go={go} />
      {order ? (
        <div className="orderbanner" role="status">
          <div className="orderbanner__in">
            <span className="orderbanner__ic">{Icon.check()}</span>
            <p>
              Vielen Dank für Ihre Bestellung! Wir haben eine Bestellbestätigung an Ihre
              E-Mail gesendet{order.email ? `: ${order.email}` : "."}
            </p>
            <button className="orderbanner__x" onClick={clearOrder} aria-label="Schließen">{Icon.close()}</button>
          </div>
        </div>
      ) : null}
      {children}
      <div className={"toast " + (toast ? "toast--on" : "")}>{toast}</div>
    </>
  );
}
