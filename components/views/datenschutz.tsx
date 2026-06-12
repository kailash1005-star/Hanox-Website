"use client";

import { LegalShell } from "./legal";

/* Datenschutzerklärung (DSGVO). Allgemeine Vorlage, angepasst an den tatsächlichen
 * Technik-Stack von Hanox (Hosting bei Vercel, Zahlungen über PayPal, Instagram).
 * Verantwortlicher: mpinger GmbH, Hannover.
 * Bitte vor dem Livegang anwaltlich / vom Datenschutzbeauftragten prüfen lassen. */

export function DatenschutzView() {
  return (
    <LegalShell
      eyebrow="Rechtliches"
      title="Datenschutzerklärung"
      intro="Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie über die Verarbeitung Ihrer Daten gemäß Datenschutz-Grundverordnung (DSGVO)."
    >
      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
        mpinger GmbH<br />
        Gustav-Schenk-Weg 53, 30455 Hannover<br />
        Vertreten durch: Ramkumar Palanisamy<br />
        E-Mail: <a href="mailto:info@mpinger.de">info@mpinger.de</a><br />
        Telefon: +49 (0) 511-10554580<br />
        Weitere Angaben entnehmen Sie unserem Impressum.
      </p>

      <h2>2. Übersicht der Verarbeitungen</h2>
      <p>
        Wir verarbeiten u. a. Bestandsdaten (z. B. Namen, Adressen), Kontaktdaten
        (z. B. E-Mail, Telefonnummern), Vertrags- und Bestelldaten, Zahlungsdaten
        sowie Nutzungs- und Meta-/Kommunikationsdaten (z. B. IP-Adressen). Betroffen
        sind Kund:innen, Interessent:innen und Besucher:innen unseres Onlineangebots.
        Zwecke sind die Erbringung unserer Leistungen, Kommunikation, Sicherheit und
        die Erfüllung gesetzlicher Pflichten.
      </p>

      <h2>3. Maßgebliche Rechtsgrundlagen</h2>
      <p>
        Wir verarbeiten Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO
        (Einwilligung), lit. b (Vertragserfüllung und vorvertragliche Maßnahmen),
        lit. c (rechtliche Verpflichtung) und lit. f (berechtigte Interessen). Es
        gelten ergänzend die Bestimmungen des Bundesdatenschutzgesetzes (BDSG).
      </p>

      <h2>4. Sicherheitsmaßnahmen</h2>
      <p>
        Wir treffen geeignete technische und organisatorische Maßnahmen, um ein dem
        Risiko angemessenes Schutzniveau zu gewährleisten. Hierzu gehört insbesondere
        die verschlüsselte Übertragung Ihrer Daten über TLS-/SSL-Technologie sowie die
        Zugriffsbeschränkung auf personenbezogene Daten.
      </p>

      <h2>5. Speicherung und Löschung</h2>
      <p>
        Wir löschen personenbezogene Daten, sobald der Zweck der Verarbeitung entfällt
        und keine gesetzlichen Aufbewahrungspflichten bestehen. Es gelten u. a.
        Aufbewahrungsfristen von 10 Jahren für buchungsrelevante Unterlagen und 6
        Jahren für sonstige geschäftliche Unterlagen.
      </p>

      <h2>6. Rechte der betroffenen Personen</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
        (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit
        (Art. 20) sowie ein Widerspruchsrecht (Art. 21). Erteilte Einwilligungen
        können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Zudem steht Ihnen
        ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.
      </p>

      <h2>7. Bereitstellung des Onlineangebots und Webhosting</h2>
      <p>
        Diese Website wird bei der Vercel Inc. (Hosting/Content-Delivery) betrieben;
        die Auslieferung erfolgt aus Rechenzentren innerhalb der EU (Region Frankfurt).
        Beim Aufruf der Website werden technisch notwendige Zugriffsdaten in
        Server-Logfiles verarbeitet (u. a. IP-Adresse, Datum/Uhrzeit, abgerufene Seite,
        Browsertyp). Rechtsgrundlage ist unser berechtigtes Interesse an einem
        sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Logfiles werden in
        der Regel nach spätestens 30 Tagen gelöscht.
      </p>

      <h2>8. Zahlungsdienstleister (PayPal)</h2>
      <p>
        Für die Zahlungsabwicklung setzen wir den Dienst PayPal (PayPal (Europe)
        S.à r.l. et Cie, S.C.A., Luxemburg) ein. Wählen Sie PayPal als Zahlungsart,
        werden die zur Bezahlung erforderlichen Daten an PayPal übermittelt.
        Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
        Es gelten zusätzlich die Datenschutzbestimmungen von PayPal:{" "}
        <a href="https://www.paypal.com/de/legalhub/privacy-full" target="_blank" rel="noopener noreferrer">
          paypal.com/de/legalhub/privacy-full
        </a>
        .
      </p>

      <h2>9. Kontakt- und Anfrageverwaltung</h2>
      <p>
        Wenn Sie uns kontaktieren (z. B. per E-Mail oder über das Kontaktformular),
        verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. b und lit. f DSGVO. Die Daten werden gelöscht, sobald sie
        nicht mehr erforderlich sind und keine Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>10. Präsenz in sozialen Netzwerken (Instagram)</h2>
      <p>
        Wir unterhalten ein Profil bei Instagram (Meta Platforms Ireland Ltd.). Wenn
        Sie unser Profil besuchen oder mit uns interagieren, verarbeitet der Betreiber
        Ihre Daten nach dessen eigenen Bestimmungen. Eine Datenübertragung in
        Drittländer kann nicht ausgeschlossen werden. Rechtsgrundlage ist unser
        berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
    </LegalShell>
  );
}
