import type { SVGProps, ReactElement } from "react";

type IconProps = SVGProps<SVGSVGElement>;
type IconFn = (p?: IconProps) => ReactElement;

/* All icons are inline SVG, ported 1:1 from the prototype's `Icon` object. */
export const Icon: Record<string, IconFn> = {
  cart: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...p}>
      <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L20 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  minus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...p}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  phone: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}>
      <path d="M6.5 3.5l2 .5 1 3.5-1.8 1.4a12 12 0 0 0 5.4 5.4L16 16.5l3.5 1 .5 2a1.6 1.6 0 0 1-1.6 1.9C9.6 21.4 2.6 14.4 4.6 5.1A1.6 1.6 0 0 1 6.5 3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  pickup: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...p}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  truck: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...p}>
      <rect x="1.5" y="6.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 9.5h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <path d="M12 3l7 2.5v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10v-5L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  wrench: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <path d="M14.5 6a3.5 3.5 0 0 0 4.4 4.4L21 8.5a5 5 0 0 1-6.8 6L7 21.5a2 2 0 0 1-3-3l7-7a5 5 0 0 1 6-6.8L14.5 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  medal: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  tag: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <path d="M3.5 12.5l8-8H20v8.5l-8 8a1.5 1.5 0 0 1-2.1 0l-6.4-6.4a1.5 1.5 0 0 1 0-2.1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3z" fill="currentColor" />
    </svg>
  ),
  instagram: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
  facebook: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...p}>
      <path d="M14 8.5h2.5V5.5H14c-1.9 0-3 1.3-3 3.2V11H9v3h2v6h3v-6h2.3l.7-3H14V9.2c0-.4.3-.7.7-.7z" fill="currentColor" />
    </svg>
  ),
};
