# API Key Systeem - Setup Instructies

## Overzicht

Elke klant krijgt een eigen unieke API key waarmee ze hun persoonlijke data kunnen ophalen via de API. Dit systeem zorgt voor veilige toegang tot klantgegevens, lessen, leskaarten en meer.

## Stap 1: Database Migratie

Voer eerst de database migratie uit in Supabase:

1. Ga naar Supabase Dashboard → SQL Editor
2. Open het bestand `database-migration-api-keys.sql`
3. Kopieer de inhoud en voer deze uit in de SQL Editor

Dit maakt de `api_keys` tabel aan met een 1-op-1 relatie met de `members` tabel.

## Stap 2: API Keys Aanmaken

### Optie A: Via de UI (Aanbevolen)

1. Ga naar **Instellingen** → **Beveiliging** tab
2. Klik op **"Nieuwe API Key"**
3. Selecteer de klant
4. De API key wordt automatisch gegenereerd en getoond
5. **BELANGRIJK**: Kopieer en bewaar de key veilig - deze wordt niet opnieuw getoond!

### Optie B: Via Command Line Script

```bash
# Installeer dependencies (als nog niet gedaan)
npm install

# Maak een .env bestand met:
# VITE_SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Genereer API key voor een klant
node create-api-key.js klant@example.com
# Of met member ID:
node create-api-key.js 123e4567-e89b-12d3-a456-426614174000
```

## Stap 3: API Endpoint Gebruiken

De API endpoint is beschikbaar op:
```
GET https://jouw-domein.vercel.app/api/get-customer-data
```

### Authenticatie

Stuur de API key in de `X-API-Key` header:

```javascript
fetch('https://jouw-domein.vercel.app/api/get-customer-data', {
  headers: {
    'X-API-Key': 'mk_jouw-api-key-hier'
  }
})
```

### Response Format

```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "name": "Klant Naam",
    "email": "klant@example.com",
    "phone": "0612345678",
    "status": "Actief",
    "balance": 0.00,
    "klantType": "Manege",
    "adres": "Straat 1",
    "postcode": "1234 AB",
    "plaats": "Stad"
  },
  "lessons": [
    {
      "id": "uuid",
      "name": "Maandag 19:00 Priveles",
      "day": "Maandag",
      "dayOfWeek": 0,
      "time": "19:00",
      "type": "Priveles",
      "instructor": "Instructeur Naam",
      "color": "blue",
      "description": "Les beschrijving",
      "maxParticipants": 1,
      "isFamilyMember": false,
      "familyMemberName": null
    }
  ],
  "leskaarten": [
    {
      "id": "uuid",
      "totaalLessen": 10,
      "gebruikteLessen": 3,
      "resterendeLessen": 7,
      "startDatum": "2024-01-01",
      "eindDatum": "2024-12-31",
      "status": "actief"
    }
  ],
  "totaalResterendeLessen": 7,
  "familyMembers": [
    {
      "id": "uuid",
      "name": "Gezinslid Naam",
      "geboortedatum": "2010-01-01",
      "email": "gezinslid@example.com",
      "telefoon": "0612345678",
      "status": "Actief"
    }
  ],
  "openstaandeTransacties": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "description": "Factuur januari",
      "amount": 50.00,
      "type": "Factuur",
      "status": "Open"
    }
  ],
  "saldo": 0.00
}
```

### Error Responses

**401 Unauthorized - Missing API Key:**
```json
{
  "error": "API key required",
  "code": "MISSING_API_KEY"
}
```

**401 Unauthorized - Invalid API Key:**
```json
{
  "error": "Invalid or expired API key",
  "code": "INVALID_API_KEY"
}
```

**404 Not Found:**
```json
{
  "error": "Customer not found",
  "code": "CUSTOMER_NOT_FOUND"
}
```

## Stap 4: Integratie in Andere Webapp

Zie `api-usage-example.js` voor een compleet voorbeeld van hoe je de API kunt gebruiken in je andere webapp.

## Beveiliging

- ✅ API keys zijn uniek per klant (1-op-1 relatie)
- ✅ Keys kunnen worden gedeactiveerd zonder verwijdering
- ✅ Last used timestamp wordt bijgehouden
- ✅ Optionele vervaldatum ondersteuning
- ✅ Keys worden nooit in logs opgeslagen

## API Key Beheer

In de **Instellingen** → **Beveiliging** tab kun je:
- Nieuwe API keys aanmaken
- Bestaande keys bekijken (met show/hide functionaliteit)
- Keys kopiëren naar clipboard
- Keys activeren/deactiveren
- Keys verwijderen
- Zoeken op klant naam, email of API key

## Troubleshooting

**Probleem**: API key wordt niet geaccepteerd
- Controleer of de key correct is gekopieerd (geen extra spaties)
- Controleer of de key actief is in de database
- Controleer of de key niet verlopen is

**Probleem**: Klant data niet gevonden
- Controleer of de API key correct gekoppeld is aan de klant
- Controleer of de klant nog bestaat in de database

**Probleem**: CORS errors
- De API endpoint heeft CORS headers ingesteld voor alle origins
- Als je specifieke origins wilt toestaan, pas dan de headers aan in `api/get-customer-data.ts`








