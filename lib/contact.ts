/* Central place for Hanox contact + company details.
 * Used by the header, footer, contact page and legal pages so there is a single
 * source of truth. Update here and it changes everywhere. */

export const CONTACT = {
  email: "info@hanox-baumaschinen.de",
  // E.164 form for tel: links (no spaces); display form for humans.
  // TODO(Task 9, CONFIRM): client-provided number — verify exact digits before launch.
  phoneHref: "+4915750631604",
  phoneDisplay: "+49 1575 0631604",
  hours: "Mo–Fr · 8:00–17:00 Uhr (MEZ)",
  instagram: "https://www.instagram.com/hanox_baumaschinen/",
} as const;
