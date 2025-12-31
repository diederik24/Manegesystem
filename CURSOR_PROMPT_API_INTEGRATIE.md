# Cursor Prompt: Manegeplan API Integratie

## Context
Ik heb een Manegeplan systeem met een API endpoint die klantdata ophaalt via API keys. Elke klant heeft een eigen unieke API key. Ik moet deze API integreren in deze webapp zodat klanten hun eigen data kunnen bekijken.

## API Details

**Endpoint:**
```
GET https://jouw-manegeplan-domein.vercel.app/api/get-customer-data
```

**Authenticatie:**
- Stuur de API key in de `X-API-Key` header
- Elke klant heeft een eigen unieke API key

**Request:**
```javascript
fetch('https://jouw-manegeplan-domein.vercel.app/api/get-customer-data', {
  method: 'GET',
  headers: {
    'X-API-Key': 'mk_jouw-api-key-hier',
    'Content-Type': 'application/json'
  }
})
```

**Response Format:**
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
  "familyMembers": [],
  "openstaandeTransacties": [],
  "saldo": 0.00
}
```

**Error Responses:**
- `401` - Missing API key: `{ "error": "API key required", "code": "MISSING_API_KEY" }`
- `401` - Invalid API key: `{ "error": "Invalid or expired API key", "code": "INVALID_API_KEY" }`
- `404` - Customer not found: `{ "error": "Customer not found", "code": "CUSTOMER_NOT_FOUND" }`

## Taak

Implementeer de integratie met de Manegeplan API in deze webapp. De klant moet:

1. **Inloggen met hun API key** - De API key wordt opgeslagen (bijv. in localStorage of via login formulier)
2. **Hun eigen data kunnen bekijken:**
   - Persoonlijke gegevens (naam, email, saldo)
   - **Welke lessen ze rijden** (dag, tijd, instructeur)
   - **Hoeveel lessen nog op hun leskaart staan** (resterendeLessen, totaalResterendeLessen)
   - Openstaande facturen/transacties
   - Gezinsleden (als van toepassing)

3. **Error handling** - Toon duidelijke foutmeldingen als:
   - API key ontbreekt of ongeldig is
   - Netwerkfouten optreden
   - Data niet gevonden kan worden

## Requirements

- Maak een API service/utility functie om de data op te halen
- Implementeer error handling voor alle error codes
- Toon de data in een gebruiksvriendelijke interface
- **BELANGRIJK**: Toon duidelijk hoeveel lessen nog op de leskaart staan
- **BELANGRIJK**: Toon welke lessen de klant rijdt (dag, tijd, instructeur)
- Maak het mogelijk om de API key in te voeren/op te slaan
- Gebruik moderne React patterns (hooks, error boundaries, etc.)
- Zorg voor loading states tijdens API calls
- Maak de UI responsive en gebruiksvriendelijk

## Voorbeeld Implementatie Structuur

```typescript
// api/manegeplan.ts
export async function getCustomerData(apiKey: string) {
  // API call implementatie
}

// hooks/useCustomerData.ts
export function useCustomerData(apiKey: string | null) {
  // React hook voor data fetching
}

// components/CustomerDashboard.tsx
// Hoofdcomponent die de data toont
```

## Design Requirements

- Gebruik een moderne, schone UI
- Toon belangrijke informatie prominent (resterende lessen, volgende les)
- Maak gebruik van cards/sections voor verschillende data types
- Gebruik loading spinners tijdens data ophalen
- Toon error states duidelijk

## Extra Features (Optioneel)

- Auto-refresh van data (polling)
- Offline support met cached data
- Export functionaliteit voor leskaart info
- Notificaties voor bijna verlopen leskaarten

## Belangrijke Data Punten

De API retourneert deze belangrijke velden:
- `customer.balance` - Huidig saldo
- `lessons[]` - Array van lessen waar klant in zit
- `leskaarten[]` - Array van leskaarten met resterende lessen
- `totaalResterendeLessen` - Totaal aantal resterende lessen over alle kaarten
- `openstaandeTransacties[]` - Openstaande facturen

**Focus vooral op:**
1. `totaalResterendeLessen` - Dit is het belangrijkste getal voor de klant
2. `lessons` - Welke lessen ze rijden (dag + tijd)
3. `leskaarten[].resterendeLessen` - Per leskaart hoeveel lessen over

## Start

Begin met het maken van:
1. Een API service functie
2. Een React hook voor data fetching
3. Een login/API key input component
4. Een dashboard component die de data toont

Gebruik TypeScript voor type safety en maak de code modulair en herbruikbaar.




