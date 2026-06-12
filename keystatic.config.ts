import { config, collection, singleton, fields } from "@keystatic/core";

/**
 * Hanox CMS — Keystatic configuration.
 *
 * Phase 1: local storage. Content is written as JSON under `content/` and the app
 * reads those files directly (see lib/data.ts and lib/page-copy.ts).
 *
 * Scope (agreed): the product catalogue + Service/Über-uns and Elektro page copy.
 * Reviews, trust pillars, homepage hero copy and the announcement ticker stay in
 * code for now. Product PHOTOS are managed via folders in public/products/ (see
 * public/products/README.md), not here.
 *
 * To let the Hanox team edit the live site later, switch `storage` to
 * `{ kind: 'github', repo: 'owner/repo' }` and set up a GitHub App (Phase 2).
 */
export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "Hanox CMS" },
    navigation: {
      Katalog: ["models", "accessories", "categories"],
      Seiten: ["servicePage", "electricPage"],
    },
  },
  collections: {
    models: collection({
      label: "Bagger (Modelle)",
      slugField: "id",
      path: "content/models/*",
      format: { data: "json" },
      columns: ["name", "price"],
      schema: {
        id: fields.slug({
          name: {
            label: "Modell-ID",
            description: "Kleinbuchstaben, z. B. r10 — wird für die URL /bagger/<id> verwendet.",
          },
        }),
        name: fields.text({ label: "Name", validation: { isRequired: true } }),
        class: fields.text({ label: "Klasse", description: "z. B. „1,0 t Kompaktbagger“" }),
        tagline: fields.text({ label: "Slogan (kurz)" }),
        price: fields.integer({ label: "Preis in € (netto)", validation: { isRequired: true } }),
        regularPrice: fields.integer({ label: "Regulärer Preis in € (netto)", description: "Für die Ersparnis-Anzeige. 0 = kein Sonderpreis." }),
        inStock: fields.checkbox({
          label: "Auf Lager (kaufbar)",
          description: "Nur für lagernde Modelle aktivieren — nur diese können in den Warenkorb / zur Kasse. Alle anderen zeigen das Anfrage-Formular.",
          defaultValue: false,
        }),
        drive: fields.select({
          label: "Antrieb",
          options: [
            { label: "Diesel", value: "diesel" },
            { label: "Elektro", value: "electric" },
          ],
          defaultValue: "diesel",
        }),
        blurb: fields.text({ label: "Beschreibung", multiline: true }),
        specs: fields.object(
          {
            weight: fields.text({ label: "Betriebsgewicht" }),
            engine: fields.text({ label: "Motor" }),
            power: fields.text({ label: "Nennleistung" }),
            depth: fields.text({ label: "Max. Grabtiefe" }),
            reach: fields.text({ label: "Max. Reichweite" }),
            dump: fields.text({ label: "Max. Abkipphöhe" }),
            bucket: fields.text({ label: "Löffelinhalt" }),
            track: fields.text({ label: "Kettenbreite (min–max)" }),
            speed: fields.text({ label: "Fahrgeschwindigkeit" }),
            fuel: fields.text({ label: "Kraftstofftank" }),
          },
          { label: "Technische Daten" }
        ),
      },
    }),
  },
  singletons: {
    accessories: singleton({
      label: "R10 Zubehör",
      path: "content/settings/accessories",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            id: fields.text({ label: "ID", description: "Eindeutige Kennung, z. B. buckets" }),
            label: fields.text({ label: "Bezeichnung" }),
            price: fields.integer({ label: "Aufpreis in €" }),
          }),
          { label: "Zubehör", itemLabel: (p) => `${p.fields.label.value} (€${p.fields.price.value ?? 0})` }
        ),
      },
    }),
    categories: singleton({
      label: "Kategorien (Startseite)",
      path: "content/settings/categories",
      format: { data: "json" },
      schema: {
        groups: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            title: fields.text({ label: "Titel" }),
            sub: fields.text({ label: "Untertitel" }),
            ids: fields.array(fields.text({ label: "Modell-ID" }), {
              label: "Enthaltene Modelle (IDs)",
              itemLabel: (p) => p.value,
            }),
          }),
          { label: "Gruppen", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),
    servicePage: singleton({
      label: "Seite: Service & Über uns",
      path: "content/pages/service",
      format: { data: "json" },
      schema: {
        eyebrow: fields.text({ label: "Eyebrow" }),
        heading: fields.text({ label: "Überschrift (H1)" }),
        cards: fields.array(
          fields.object({
            title: fields.text({ label: "Titel" }),
            body: fields.text({ label: "Text", multiline: true }),
          }),
          {
            label: "Info-Karten",
            description: "Die Icons sind fest (Abholung, Lieferung, Schutz, Werkzeug) und folgen der Reihenfolge.",
            itemLabel: (p) => p.fields.title.value,
          }
        ),
        ctaHeading: fields.text({ label: "CTA-Überschrift" }),
        ctaText: fields.text({ label: "CTA-Text", multiline: true }),
        ctaLabel: fields.text({ label: "CTA-Button" }),
      },
    }),
    electricPage: singleton({
      label: "Seite: Elektro",
      path: "content/pages/electric",
      format: { data: "json" },
      schema: {
        badge: fields.text({ label: "Badge" }),
        heading: fields.text({ label: "Überschrift (H1)" }),
        intro: fields.text({ label: "Einleitung", multiline: true }),
        placeholderLabel: fields.text({ label: "Platzhalter-Beschriftung" }),
        ctaHeading: fields.text({ label: "CTA-Überschrift" }),
        ctaText: fields.text({ label: "CTA-Text", multiline: true }),
        notifyButton: fields.text({ label: "Button-Text" }),
        successText: fields.text({ label: "Erfolgsmeldung" }),
      },
    }),
  },
});
