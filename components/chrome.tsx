"use client";

import { useEffect, useState } from "react";
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

  // Guard against third-party scripts / browser extensions (notably Google
  // Translate) that mutate React-managed DOM nodes and otherwise crash the app
  // with "Failed to execute 'removeChild'/'insertBefore' on 'Node'". When the
  // target node isn't actually a child, we no-op instead of throwing. The native
  // methods are restored on unmount.
  useEffect(() => {
    if (typeof Node !== "function" || !Node.prototype) return;
    const proto = Node.prototype;
    const originalRemoveChild = proto.removeChild;
    const originalInsertBefore = proto.insertBefore;
    const originalReplaceChild = proto.replaceChild;

    proto.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) {
        console.error("removeChild: target is not a child of this node — ignoring.");
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    proto.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        console.error("insertBefore: reference node is not a child of this node — ignoring.");
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };

    proto.replaceChild = function <T extends Node>(this: Node, newChild: Node, oldChild: T): T {
      if (oldChild.parentNode !== this) {
        console.error("replaceChild: old child is not a child of this node — ignoring.");
        return oldChild;
      }
      return originalReplaceChild.call(this, newChild, oldChild) as T;
    };

    return () => {
      proto.removeChild = originalRemoveChild;
      proto.insertBefore = originalInsertBefore;
      proto.replaceChild = originalReplaceChild;
    };
  }, []);

  return (
    <>
      <Header go={go} cartCount={cartCount} onMenu={() => setMenu(true)} />
      <MenuDrawer open={menu} onClose={() => setMenu(false)} go={go} />
      {order ? (
        <div className="orderbanner" role="status">
          <div className="orderbanner__in">
            <span className="orderbanner__ic">{Icon.check()}</span>
            <p>
              <b>Ihre Bestellung ist bestätigt!</b>{" "}
              {order.reference ? <>Bestellreferenz: <b>{order.reference}</b>. </> : null}
              Eine Bestellbestätigung wurde an Ihre E-Mail gesendet
              {order.email ? `: ${order.email}` : "."}
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
