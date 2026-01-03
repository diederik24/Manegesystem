# Korte Cursor Prompt voor API Integratie

Ik moet de Manegeplan API integreren in deze webapp. Elke klant heeft een eigen API key om hun data op te halen.

**API Endpoint:**
```
GET https://jouw-domein.vercel.app/api/get-customer-data
Headers: { 'X-API-Key': 'mk_api-key-hier' }
```

**Wat moet er gebeuren:**

1. **API Key Login** - Klant voert hun API key in (opslaan in localStorage)
2. **Data Ophalen** - Haal klantdata op via de API met de key
3. **Dashboard Tonen** met:
   - **Hoeveel lessen nog op leskaart staan** (`totaalResterendeLessen`)
   - **Welke lessen ze rijden** (`lessons` array - dag, tijd, instructeur)
   - Persoonlijke gegevens (naam, email, saldo)
   - Openstaande facturen

**Response structuur:**
```json
{
  "success": true,
  "customer": { "name", "email", "balance", ... },
  "lessons": [{ "name", "day", "time", "instructor", ... }],
  "leskaarten": [{ "resterendeLessen", "eindDatum", ... }],
  "totaalResterendeLessen": 7,
  "openstaandeTransacties": [...]
}
```

**Error handling voor:**
- 401 (ongeldige/missing API key)
- 404 (klant niet gevonden)
- Netwerkfouten

**Maak:**
- API service functie (`api/manegeplan.ts`)
- React hook (`hooks/useCustomerData.ts`)
- Login component (API key input)
- Dashboard component (toon data)

Focus op duidelijk tonen van **resterende lessen** en **welke lessen ze rijden**. Gebruik TypeScript, moderne React patterns, loading states, en een gebruiksvriendelijke UI.







