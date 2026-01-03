# API Key Aanmaken voor Elvira Straver

## Optie 1: Via Supabase SQL Editor (Aanbevolen)

1. Ga naar je Supabase Dashboard
2. Open de **SQL Editor**
3. Kopieer en plak de inhoud van `create-api-key-elvira.sql`
4. Voer het script uit
5. De API key wordt getoond in de resultaten

## Optie 2: Via de UI

1. Open de Manegeplan app
2. Ga naar **Instellingen** → **Beveiliging** tab
3. Klik op **"Nieuwe API Key"**
4. Zoek en selecteer "Elvira Straver"
5. Klik op **"API Key Aanmaken"**
6. De API key wordt getoond - **kopieer deze direct!**

## Optie 3: Via Command Line (als environment variabelen zijn ingesteld)

```bash
node create-api-key.js "Elvira Straver"
```

Of met email:
```bash
node create-api-key.js "elvira@example.com"
```

## Belangrijk

- **Sla de API key op een veilige plek op** - deze wordt niet opnieuw getoond
- De API key begint altijd met `mk_`
- Elke klant kan maar één actieve API key hebben
- Als er al een key bestaat, wordt deze gedeactiveerd voordat een nieuwe wordt aangemaakt

## Gebruik van de API Key

Zodra je de API key hebt, kun je deze gebruiken in de andere webapp:

```javascript
fetch('https://jouw-domein.vercel.app/api/get-customer-data', {
  headers: {
    'X-API-Key': 'mk_jouw-api-key-hier'
  }
})
```








