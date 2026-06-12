"use client";

import { LegalShell } from "./legal";

/* Impressum nach § 5 TMG / § 18 MStV.
 * Betreibergesellschaft der Marke Hanox: mpinger GmbH, Hannover (vom Kunden
 * bestätigte Angaben). */

export function ImpressumView() {
  return (
    <LegalShell eyebrow="Rechtliches" title="Impressum">
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        mpinger GmbH<br />
        Gustav-Schenk-Weg 53<br />
        30455 Hannover<br />
        Deutschland
      </p>

      <h2>Vertreten durch den Geschäftsführer</h2>
      <p>Ramkumar Palanisamy</p>

      <h2>Kontakt</h2>
      <p>
        Telefon: +49 (0) 511-10554580<br />
        E-Mail: <a href="mailto:info@mpinger.de">info@mpinger.de</a>
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
        DE290407187
      </p>

      <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p>
        Ramkumar Palanisamy<br />
        Gustav-Schenk-Weg 53<br />
        30455 Hannover
      </p>

      <h2>Außergerichtliche Streitbeilegung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
        (OS) bereit:{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr/
        </a>
        .
      </p>
      <p>
        Wir sind weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf
        diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10
        TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
        gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
        forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
        Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
        Gesetzen bleiben hiervon unberührt. Bei Bekanntwerden entsprechender
        Rechtsverletzungen entfernen wir diese Inhalte umgehend.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
        wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch
        keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der
        jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden
        von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
        gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
        der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
        schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
      </p>
    </LegalShell>
  );
}
