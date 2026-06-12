/* Editable copy for the Service/Über-uns and Elektro pages.
 * Source of truth: content/pages/*.json — edit at /keystatic. */

import servicePage from "@/content/pages/service.json";
import electricPage from "@/content/pages/electric.json";

export type ServicePage = {
  eyebrow: string;
  heading: string;
  cards: { title: string; body: string }[];
  ctaHeading: string;
  ctaText: string;
  ctaLabel: string;
};

export type ElectricPage = {
  badge: string;
  heading: string;
  intro: string;
  placeholderLabel: string;
  ctaHeading: string;
  ctaText: string;
  notifyButton: string;
  successText: string;
};

export const SERVICE_PAGE = servicePage as ServicePage;
export const ELECTRIC_PAGE = electricPage as ElectricPage;
