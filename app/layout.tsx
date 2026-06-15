import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Hanox — Kompaktbagger",
  description:
    "Robuste Kompakt- und Minibagger von 1,0 bis 3,2 Tonnen — in Europa bevorratet, fair bepreist und schnell geliefert.",
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
