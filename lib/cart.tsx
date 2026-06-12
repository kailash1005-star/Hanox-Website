"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { R10_ADDONS, type Model } from "./data";

export type CartItem = {
  key: string;
  id: string;
  name: string;
  class: string;
  unit: number;
  qty: number;
  addonLabels: string[];
};

export type Order = { fulfil: string; total: number };

type AddonState = Record<string, boolean>;

type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  order: Order | null;
  toast: string;
  addToCart: (m: Model, addons: AddonState) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  placeOrder: (o: Order) => void;
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
    (m: Model, addons: AddonState) => {
      const chosen = R10_ADDONS.filter((a) => addons[a.id]);
      const unit = m.price + chosen.reduce((s, a) => s + a.price, 0);
      const key = m.id + ":" + chosen.map((a) => a.id).sort().join(",");
      setCart((c) => {
        const ex = c.find((it) => it.key === key);
        if (ex) return c.map((it) => (it.key === key ? { ...it, qty: it.qty + 1 } : it));
        return [
          ...c,
          { key, id: m.id, name: m.name, class: m.class, unit, qty: 1, addonLabels: chosen.map((a) => a.label) },
        ];
      });
      showToast(m.name + " in den Warenkorb gelegt");
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

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, cartCount, order, toast, addToCart, setQty, removeItem, placeOrder, showToast }}
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
