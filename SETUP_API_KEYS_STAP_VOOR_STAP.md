# Setup API Keys - Stap voor Stap

## Stap 1: Database Migratie Uitvoeren

De `api_keys` tabel moet eerst worden aangemaakt voordat je API keys kunt genereren.

### In Supabase SQL Editor:

1. Ga naar **Supabase Dashboard** → **SQL Editor**
2. Open het bestand `database-migration-api-keys.sql`
3. Kopieer de **hele inhoud** van het bestand
4. Plak het in de SQL Editor
5. Klik op **Run** of druk op `Ctrl+Enter`
6. Je zou een succesmelding moeten zien

### Wat wordt er aangemaakt:

- `api_keys` tabel met de volgende kolommen:
  - `id` (UUID, primary key)
  - `member_id` (UUID, gekoppeld aan members)
  - `api_key` (VARCHAR, unieke API key string)
  - `is_active` (BOOLEAN, of de key actief is)
  - `created_at` (TIMESTAMP)
  - `last_used_at` (TIMESTAMP)
  - `expires_at` (TIMESTAMP, optioneel)
  - `notes` (TEXT, optioneel)

- Indexes voor snelle lookups
- Functie `generate_api_key()` voor het genereren van keys

## Stap 2: Verifieer dat de Tabel Bestaat

Voer deze query uit om te controleren:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'api_keys';
```

Je zou `api_keys` moeten zien in de resultaten.

## Stap 3: Maak API Key voor Elvira Straver

Nu kun je het script `create-api-key-elvira.sql` uitvoeren:

1. Open `create-api-key-elvira.sql` in de SQL Editor
2. Kopieer de hele inhoud
3. Plak en voer uit
4. De API key wordt getoond in de resultaten

## Alternatief: Via de UI

Als de migratie is uitgevoerd, kun je ook via de UI:

1. Open de Manegeplan app
2. Ga naar **Instellingen** → **Beveiliging**
3. Klik op **"Nieuwe API Key"**
4. Selecteer "Elvira Straver"
5. Kopieer de gegenereerde key

## Troubleshooting

**Fout: "relation api_keys does not exist"**
- De migratie is nog niet uitgevoerd
- Voer eerst `database-migration-api-keys.sql` uit

**Fout: "function generate_api_key() does not exist"**
- De migratie is niet volledig uitgevoerd
- Voer de hele migratie opnieuw uit

**Fout: "klant niet gevonden"**
- Controleer of Elvira Straver in de `members` tabel staat
- Voer uit: `SELECT * FROM members WHERE name ILIKE '%elvira%';`




