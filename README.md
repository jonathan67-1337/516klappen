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
- `script.js` — kalender och bokning på sidan
- `favicon.svg` — ikon
- `images/` — foton hämtade från den levande sidan
- `README.md` — den här filen

## Källa

Fakta är hämtade från https://516kläppen.com/ (https://xn--516klppen-z2a.com/) den 29 sep 2026. Foton låg på `www`-värden; apex svarade 404/405 på bildfilerna.

Bokning är en förfrågan på sidan, inte ett Google-formulär. Gästen väljer vecka, ser datum och pris, fyller i namn, e-post, telefon, antal gäster och ett valfritt meddelande, och sparar. Inget mejl skickas. Fälten ligger kvar i formuläret (`weekKey`, `week`, `checkIn`, `checkOut`, `priceSek`, `name`, `email`, `phone`, `guests`, `message`) så att ett senare anrop kan läsa dem. Formuläret har `data-delivery="page-only"`.

## Osäkert

- JSON-LD på den gamla sidan säger `priceRange` 7000 SEK/vecka. Den synliga texten säger 7700 SEK/vecka (1100 SEK/dygn). Sidan använder 7700.
- Premium i prislistan är vecka 7–9 och 12 à 11 000 kr/vecka. Vecka 14 är inte premium. Vecka 13 är bokad. Vecka 7–9 är bokade (Jonathan 2026-09-29) även om de står som premium i prislistan, så de går inte att välja.
- Incheckning söndag–söndag står inte i brödtexten. Det kommer från kalenderskriptet och från formulärets fältetikett. Sista veckan i varje säsong kortas av samma sätt som i det gamla skriptet (v17 slutar 30 apr 2027, v44 är bara 31 okt 2027).
- Sidan namnger ingen ägare. Jonathan Karlsson står inte på den levande sidan, så namnet finns inte här. Telefon och e-post är de som står på sidan.
- Alt-texten för omslagsbilden säger vinterskog; filen visar stugan nattetid. Bilden används ändå, med sidans alt-text.
- E-post är avsiktligt inte kopplad. Sidan ska inte säga att en förfrågan har skickats.
- Sista veckan i sommar (v44, 31 oktober 2027) har in- och utcheckning samma dag, alltså ingen natt. Den visas men går inte att välja. Det är samma datum som i det gamla skriptet, inte en ändring av bokade eller premiumveckor.
