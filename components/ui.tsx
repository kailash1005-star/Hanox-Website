"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { euro } from "@/lib/data";

/* Brand emblem served from public/brand/ (the previous inline base64 was corrupt
 * and rendered blank). */
const HANOX_EMBLEM = "/brand/hanox-emblem.png";

/* ---------- Logo ----------
 * Uses the brand emblem (public/brand/hanox-emblem.png). On dark surfaces (footer)
 * pass `light` to back it with a white tile so the black parts stay legible. */
export function Logo({
  size = 22,
  onClick,
  light = false,
}: {
  size?: number;
  onClick?: () => void;
  light?: boolean;
}) {
  return (
    <button className={"logo" + (light ? " logo--light" : "")} onClick={onClick} aria-label="Hanox — Startseite">
      <span className={"logo__badge" + (light ? " logo__badge--tile" : "")}>
        <img src={HANOX_EMBLEM} alt="Hanox" style={{ height: Math.round(size * 2) }} />
      </span>
    </button>
  );
}

/* ---------- Placeholder + silhouette ---------- */
export function Placeholder({
  label,
  ratio = "4 / 3",
  tone = "diesel",
  className = "",
  children,
}: {
  label?: string;
  ratio?: string;
  tone?: "diesel" | "electric";
  className?: string;
  children?: ReactNode;
}) {
  const stripe = tone === "electric" ? "rgba(31,157,90,.10)" : "rgba(22,24,27,.07)";
  const bg = tone === "electric" ? "#eef4ef" : "#eceae4";
  return (
    <div
      className={"ph " + className}
      style={{ aspectRatio: ratio, background: `repeating-linear-gradient(135deg, ${bg} 0 14px, ${stripe} 14px 28px)` }}
    >
      {children}
      {label ? <span className="ph__tag">{label}</span> : null}
    </div>
  );
}

export function Silhouette({ label }: { label?: string }) {
  return (
    <div className="ph ph--sil" style={{ aspectRatio: "4 / 3" }}>
      <svg viewBox="0 0 200 150" className="ph__sil" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="#c9c6bd">
          <rect x="36" y="104" width="120" height="16" rx="8" />
          <circle cx="48" cy="112" r="7" fill="#bdb9ae" />
          <circle cx="144" cy="112" r="7" fill="#bdb9ae" />
          <rect x="60" y="74" width="58" height="30" rx="4" />
          <rect x="96" y="60" width="26" height="20" rx="3" />
          <path d="M116 78 L150 50 L156 56 L128 88 Z" />
          <path d="M150 50 L168 64 L160 74 L146 60 Z" />
        </g>
      </svg>
      {label ? <span className="ph__tag">{label}</span> : null}
    </div>
  );
}

/* ---------- Produktabbildung auf hellem Grund ---------- */
export function Shot({
  src,
  alt,
  ratio = "4 / 3",
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={"shot " + className} style={{ aspectRatio: ratio }}>
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

/* ---------- Photo gallery ---------- */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setI((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images, isHovered, i]);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setI((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setI((prev) => (prev + 1) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="gal">
      <div
        className="gal__main"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* key forces the fade animation to replay on change */}
        <img key={i} src={images[i]} alt={alt} />

        {images.length > 1 && (
          <>
            <button
              className="gal__arrow gal__arrow--left"
              onClick={prevImage}
              aria-label="Vorheriges Bild"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="gal__arrow gal__arrow--right"
              onClick={nextImage}
              aria-label="Nächstes Bild"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
        <span className="gal__count">{i + 1} / {images.length}</span>
      </div>
      <div className="gal__thumbs">
        {images.map((src, n) => (
          <button key={n} className={"gal__th " + (n === i ? "gal__th--on" : "")} onClick={() => setI(n)} aria-label={"Bild " + (n + 1)}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Buttons ---------- */
export function Btn({
  children,
  variant = "primary",
  full,
  className = "",
  icon,
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "dark" | "ghost" | "quiet";
  full?: boolean;
  className?: string;
  icon?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn--${variant} ${full ? "btn--full" : ""} ${className}`} {...rest}>
      <span suppressHydrationWarning>{children}</span>
      {icon ? <span className="btn__icon">{icon}</span> : null}
    </button>
  );
}

/* ---------- Stars ---------- */
export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="stars" aria-label={n + " von 5 Sternen"}>
      {Array.from({ length: n }).map((_, i) => <span key={i}>{Icon.star()}</span>)}
    </span>
  );
}

/* ---------- Sale price ---------- */
export function Price({ price, regular, size = "" }: { price: number; regular?: number; size?: string }) {
  const save = regular && regular > price ? regular - price : 0;
  return (
    <div className={"price " + size}>
      <span className="price__now">{euro(price)}</span>
      {save > 0 ? <span className="price__was">{euro(regular!)}</span> : null}
      {save > 0 ? <span className="price__save">Sie sparen {euro(save)}</span> : null}
    </div>
  );
}

/* ---------- Stock / status badges ---------- */
export function StockBadge({ inStock, small }: { inStock?: boolean; small?: boolean }) {
  return inStock ? (
    <span className={"badge badge--stock " + (small ? "badge--sm" : "")}>
      <i className="dot" /> Auf Lager · sofort lieferbar
    </span>
  ) : (
    <span className={"badge badge--request " + (small ? "badge--sm" : "")}>Verfügbar · jetzt anfragen</span>
  );
}
