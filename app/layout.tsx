import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const SITE_DESC =
  "Robuste Kompakt- und Minibagger von 1,0 bis 3,2 Tonnen — in Europa bevorratet, fair bepreist und schnell geliefert.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Hanox — Kompaktbagger", template: "%s — Hanox" },
  description: SITE_DESC,
  applicationName: "Hanox",
  keywords: ["Minibagger", "Kompaktbagger", "Bagger kaufen", "Raupendumper", "Kompaktlader", "Hanox"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Hanox",
    url: SITE_URL,
    title: "Hanox — Kompaktbagger",
    description: SITE_DESC,
    images: [{ url: "/brand/hanox-emblem.png", width: 256, height: 256, alt: "Hanox" }],
  },
  twitter: {
    card: "summary",
    title: "Hanox — Kompaktbagger",
    description: SITE_DESC,
    images: ["/brand/hanox-emblem.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Minimal root layout (html/body + fonts). The storefront chrome lives in the
 * (site) route group so the Keystatic admin at /keystatic renders standalone.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${archivo.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
