"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Model } from "./data";

/**
 * A line selection. `variantId` (e.g. the chosen engine option id) is encoded
 * into the cart key so server-side pricing can recompute the exact unit price.
 * `unit` is the per-item price to display (base price + variant delta).
 */
export type CartSelection = { variantId?: string; variantLabel?: string; unit?: number };

export type CartItem = {
  key: string;
  id: string;
  name: string;
  class: string;
  unit: number;
  qty: number;
  addonLabels: string[];
  image?: string;
};

/** Minimal accessory shape needed to add one to the cart. `optionId`/`optionLabel`
 * carry the chosen size variant (if any); the key encodes the option so the
 * server can recompute the exact price. */
export type CartAccessory = {
  id: string;
  name: string;
  price: number;
  image?: string;
  optionId?: string;
  optionLabel?: string;
};

export type Order = { fulfil: string; total: number; email?: string; reference?: string };

type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  order: Order | null;
  toast: string;
  addToCart: (m: Model, sel?: CartSelection, qty?: number) => void;
  addAccessory: (acc: CartAccessory, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  placeOrder: (o: Order) => void;
  clearOrder: () => void;
  showToast: (msg: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState("");
  const hydrated = useRef(false);

  // Restore cart from localStorage on first mount. We read in an effect (not a
  // lazy initializer) so server and client render the same empty cart first,
  // then hydrate — avoiding an SSR/client markup mismatch on the cart badge.
  useEffect(() => {
    let stored: CartItem[] | null = null;
    try {
      const c = JSON.parse(localStorage.getItem("hannox-cart") || "[]");
      if (Array.isArray(c)) stored = c;
    } catch {
      /* ignore corrupt storage */
    }
    hydrated.current = true;
    // One-time hydration from an external store (localStorage); intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && stored.length) setCart(stored);
  }, []);

  // persist cart (skip the initial render before hydration to avoid clobbering)
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem("hannox-cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const removeItem = useCallback((key: string) => {
    setCart((c) => c.filter((it) => it.key !== key));
  }, []);

  const addToCart = useCallback(
    (m: Model, sel: CartSelection = {}, qty: number = 1) => {
      const add = Math.max(1, Math.floor(qty));
      const unit = sel.unit ?? m.price;
      // key = "<productId>:<variantId>" — variantId lets the server recompute price.
      const key = m.id + ":" + (sel.variantId ?? "");
      const addonLabels = sel.variantLabel ? [sel.variantLabel] : [];
      setCart((c) => {
        const ex = c.find((it) => it.key === key);
        if (ex) return c.map((it) => (it.key === key ? { ...it, qty: it.qty + add } : it));
        return [
          ...c,
          { key, id: m.id, name: m.name, class: m.class, unit, qty: add, addonLabels, image: m.images[0] },
        ];
      });
      showToast(m.name + " in den Warenkorb gelegt");
    },
    [showToast]
  );

  const addAccessory = useCallback(
    (acc: CartAccessory, qty: number = 1) => {
      const add = Math.max(1, Math.floor(qty));
      // key shape "acc:<id>" or "acc:<id>,<optionId>" — the comma matches the
      // server-side parser so the chosen size price can be recomputed.
      const key = "acc:" + acc.id + (acc.optionId ? "," + acc.optionId : "");
      const addonLabels = acc.optionLabel ? [acc.optionLabel] : [];
      setCart((c) => {
        const ex = c.find((it) => it.key === key);
        if (ex) return c.map((it) => (it.key === key ? { ...it, qty: it.qty + add } : it));
        return [
          ...c,
          { key, id: acc.id, name: acc.name, class: "Zubehör", unit: acc.price, qty: add, addonLabels, image: acc.image },
        ];
      });
      showToast(acc.name + " in den Warenkorb gelegt");
    },
    [showToast]
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      if (qty < 1) return removeItem(key);
      setCart((c) => c.map((it) => (it.key === key ? { ...it, qty } : it)));
    },
    [removeItem]
  );

  const placeOrder = useCallback((o: Order) => {
    setOrder(o);
    setCart([]);
  }, []);

  const clearOrder = useCallback(() => setOrder(null), []);

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, cartCount, order, toast, addToCart, addAccessory, setQty, removeItem, placeOrder, clearOrder, showToast }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
