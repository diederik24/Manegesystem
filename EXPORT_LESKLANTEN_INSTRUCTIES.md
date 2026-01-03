# Export Lesklanten naar Excel

## Gebruik

Dit script exporteert alle lesklanten naar een Excel bestand met alle relevante informatie.

## Instellen van Credentials

Je hebt twee opties:

### Optie 1: Via Environment Variables

Maak een `.env` bestand in de root directory met:

```env
VITE_SUPABASE_URL=https://ebkomgookzbawsjkamek.supabase.co
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
```

### Optie 2: Via Command Line

```bash
node export-lesklanten-excel.js --url=https://ebkomgookzbawsjkamek.supabase.co --key=jouw-service-role-key
```

## Uitvoeren

```bash
node export-lesklanten-excel.js
```

## Output

Het script genereert een Excel bestand met de naam: `Lesklanten_YYYY-MM-DD.xlsx`

## Inhoud Excel

Het Excel bestand bevat de volgende kolommen:
- Klant ID
- Klant Naam
- Email
- Telefoon
- Status
- Saldo
- Deelnemer Type (Klant of Gezinslid)
- Deelnemer Naam
- Lesgroep
- Dag
- Tijd
- Les Type
- Instructeur
- Resterende Lessen
- Leskaart Status
- Leskaart Start
- Leskaart Eind
- Aangemaakt

## Opmerkingen

- Elke rij in het Excel bestand vertegenwoordigt één deelnemer in één lesgroep
- Als een klant meerdere lessen volgt, verschijnt deze meerdere keren
- Gezinsleden worden apart getoond met hun hoofdklant informatie







