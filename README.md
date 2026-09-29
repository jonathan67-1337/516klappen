# 516 Kläppen

Statisk en-sida för stugan. Svensk text. Ingen byggsteg, inget ramverk.

## Öppna

Öppna filen direkt i en webbläsare:

`/workspace/516klappen/index.html`

Eller från den här mappen:

```bash
cd /workspace/516klappen
python3 -m http.server 8765
```

Gå sedan till http://127.0.0.1:8765/ och stäng servern efteråt (Ctrl+C). Inget behöver vara igång för att sidan ska fungera.

## Filer

- `index.html` — sidan
- `styles.css` — utseende
- `script.js` — kalender och bokningsförfrågan
- `favicon.svg` — ikon
- `images/` — foton hämtade från den levande sidan
- `README.md` — den här filen

## Källa

Fakta är hämtade från https://516kläppen.com/ (https://xn--516klppen-z2a.com/) den 29 sep 2026. Foton låg på `www`-värden; apex svarade 404/405 på bildfilerna.

Bokning är en förfrågan. Knappen öppnar det publika Google-formuläret från sidan, med vecka, check-in och check-out ifyllda (`entry.377884520`, `entry.1022203339`, `entry.1281773319`).

## Osäkert

- JSON-LD på den gamla sidan säger `priceRange` 7000 SEK/vecka. Den synliga texten säger 7700 SEK/vecka (1100 SEK/dygn). Sidan använder 7700.
- Premium i texten är vecka 7–9 och 12–13 à 11 000 kr/vecka. Det gamla skriptet satte v14 som premium och v13 som bokad. Texten styr priset: v14 är inte premium. v13 förblir bokad och är inte också markerad premium (kommentar i `index.html`). v7–v9 var bokade i skriptet men är premiumveckor, så de visas som lediga premiumveckor, inte bokade.
- Incheckning söndag–söndag står inte i brödtexten. Det kommer från kalenderskriptet och från formulärets fältetikett. Sista veckan i varje säsong kortas av samma sätt som i det gamla skriptet (v17 slutar 30 apr 2027, v44 är bara 31 okt 2027).
- Sidan namnger ingen ägare. Jonathan Karlsson står inte på den levande sidan, så namnet finns inte här. Telefon och e-post är de som står på sidan.
- Alt-texten för omslagsbilden säger vinterskog; filen visar stugan nattetid. Bilden används ändå, med sidans alt-text.
- Formulärets datumfält är förifyllda med `entry._year/_month/_day`. Det är Googles vanliga format för datum, men det är inte testat mot ett inskickat svar.
