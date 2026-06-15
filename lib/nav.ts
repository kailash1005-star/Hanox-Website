"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * The prototype used a single-page shell with `go(view, arg)`. We keep that
 * call signature so the ported components read the same, but map each "view"
 * to a real Next.js route.
 */
export type View =
  | "home"
  | "catalog"
  | "electric"
  | "about"
  | "contact"
  | "accessories"
  | "impressum"
  | "datenschutz"
  | "agb"
  | "product"
  | "cart"
  | "checkout"
  | "confirm";

export function routeFor(view: View, arg?: string | null): string {
  switch (view) {
    case "home":
      return "/";
    case "catalog":
      return "/bagger";
    case "electric":
      return "/elektro";
    case "about":
      return "/ueber-uns";
    case "contact":
      return "/kontakt";
    case "accessories":
      return "/zubehoer";
    case "impressum":
      return "/impressum";
    case "datenschutz":
      return "/datenschutz";
    case "agb":
      return "/agb";
    case "product":
      return "/bagger/" + (arg ?? "");
    case "cart":
      return "/warenkorb";
    case "checkout":
      return "/kasse";
    case "confirm":
      return "/bestellung-bestaetigt";
    default:
      return "/";
  }
}

export type Go = (view: View, arg?: string | null) => void;

export function useGo(): Go {
  const router = useRouter();
  return useCallback(
    (view: View, arg?: string | null) => {
      router.push(routeFor(view, arg));
      window.scrollTo(0, 0);
    },
    [router]
  );
}
