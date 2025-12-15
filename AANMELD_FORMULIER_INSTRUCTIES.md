# Aanmeld Formulier Instructies

## Database Setup

Voordat je het formulier kunt gebruiken, moet je eerst de database tabel aanmaken:

1. Ga naar je Supabase project dashboard
2. Open de SQL Editor
3. Voer het bestand `database-migration-nieuwe-aanmeldingen.sql` uit

Dit maakt de `nieuwe_aanmeldingen` tabel aan met alle benodigde velden.

## Formulier URL

Het aanmeldformulier is bereikbaar via de volgende URLs:

- **Met query parameter**: `http://localhost:5000/?view=aanmelden`
- **Met hash**: `http://localhost:5000/#aanmelden`

Wanneer je de applicatie in productie zet, gebruik dan:
- `https://jouw-domein.nl/?view=aanmelden`
- `https://jouw-domein.nl/#aanmelden`

## Formulier Velden

Het formulier bevat de volgende velden (zoals in het originele formulier):

- **Voorletters** (optioneel)
- **Voornaam** (verplicht)
- **Tussenvoegsel** (optioneel)
- **Achternaam** (verplicht)
- **Geboortedatum** (optioneel)
- **Adres** (optioneel)
- **Postcode** (optioneel)
- **Plaats** (optioneel)
- **E-mail** (verplicht)
- **Telefoon 1** (optioneel)
- **Telefoon 2** (optioneel)
- **Bij nood waarschuwen (naam)** (optioneel)
- **Bij nood waarschuwen (telefoon)** (optioneel)
- **Opmerking** (optioneel)

## Hoe het werkt

1. **Aanmelding**: Wanneer iemand het formulier invult en verzendt, wordt de aanmelding opgeslagen in de `nieuwe_aanmeldingen` tabel met status `pending`.

2. **Goedkeuren**: In het "Nieuwe Aanmeldingen" overzicht kan je een aanmelding goedkeuren. Wanneer je dit doet:
   - De persoon wordt automatisch toegevoegd aan de `members` tabel als **Manegeklant**
   - De status wordt aangepast naar `approved`
   - Als het email adres al bestaat, wordt de bestaande klant geüpdatet

3. **Afwijzen**: Je kunt een aanmelding ook afwijzen, de status wordt dan `rejected`.

## Testen

1. Start de applicatie: `npm run dev`
2. Ga naar: `http://localhost:5000/?view=aanmelden`
3. Vul het formulier in en verzend het
4. Ga naar "Nieuwe Aanmeldingen" in het admin panel
5. Keur de aanmelding goed
6. Controleer of de persoon is toegevoegd aan "Stamgegevens" als Manegeklant

## Styling

Het formulier heeft een moderne, schone styling met:
- Gradient header (roze/rood)
- Witte achtergrond met schaduw
- Responsive design (werkt op mobiel en desktop)
- Duidelijke labels en velden
- Success/error berichten na verzending

## Volgende Stappen

Voor productie gebruik:
1. Voeg formulier validatie toe (client-side en server-side)
2. Voeg CAPTCHA toe om spam te voorkomen
3. Stuur een bevestigingsemail naar de aanmelder
4. Stuur een notificatie naar de admin wanneer er een nieuwe aanmelding is

