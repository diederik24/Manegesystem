# Import Instructies: Pension Klanten

## Stap 1: Database Schema Updaten

Voordat je de data importeert, moet je eerst de database schema updaten om de nieuwe velden toe te voegen.

1. Ga naar je Supabase project dashboard
2. Open de SQL Editor
3. Voer het bestand `database-migration-pension-klanten.sql` uit

Dit voegt de volgende velden toe aan de `members` tabel:
- `adres` (VARCHAR)
- `postcode` (VARCHAR)
- `plaats` (VARCHAR)
- `klant_type` (VARCHAR met check constraint voor 'Pension' of 'Manege')

## Stap 2: Supabase Credentials Instellen

Je hebt een **Service Role Key** nodig (niet de anon key) om de import uit te voeren.

1. Ga naar je Supabase project dashboard
2. Ga naar Settings > API
3. Kopieer de **service_role** key (niet de anon key!)
4. Maak een `.env.local` bestand in de root van het project met:

```env
VITE_SUPABASE_URL=https://jouw-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key-hier
```

**BELANGRIJK**: De service_role key heeft admin rechten. Deel deze nooit publiekelijk!

## Stap 3: Import Script Uitvoeren

Run het import script:

```bash
node import-pension-klanten-to-supabase.js
```

Het script zal:
1. Het Excel bestand lezen (`Pension Klanten bestand 2025.xlsx`)
2. Alle klanten parsen (22 klanten gevonden)
3. Alle paarden parsen (32 paarden gevonden)
4. Klanten importeren naar de `members` tabel
5. Paarden importeren naar de `horses` tabel en koppelen aan eigenaren

## Data Structuur

Het script herkent de volgende kolommen uit het Excel bestand:
- **Kolom 0**: Voornaam
- **Kolom 2**: Achternaam
- **Kolom 4**: Adres
- **Kolom 7**: Postcode
- **Kolom 9**: Plaats
- **Kolom 11**: Telefoon
- **Kolom 13**: E-mail
- **Kolom 17**: Paard(en) - kan meerdere paarden bevatten gescheiden door "/"

## Database Tabellen

### Members Tabel
- `id` (UUID, primary key)
- `name` (VARCHAR) - Volledige naam
- `email` (VARCHAR, nullable)
- `phone` (VARCHAR, nullable)
- `adres` (VARCHAR, nullable) - **Nieuw**
- `postcode` (VARCHAR, nullable) - **Nieuw**
- `plaats` (VARCHAR, nullable) - **Nieuw**
- `klant_type` (VARCHAR) - **Nieuw**: 'Pension' of 'Manege'
- `status` (VARCHAR) - 'Actief', 'Wachtlijst', 'Inactief'
- `balance` (DECIMAL) - Huidige saldo
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Horses Tabel
- `id` (UUID, primary key)
- `name` (VARCHAR) - Paard naam
- `breed` (VARCHAR) - Ras (standaard 'Onbekend')
- `birth_date` (DATE, nullable)
- `available` (BOOLEAN) - Beschikbaar voor lessen
- `type` (VARCHAR) - 'Manege' of 'Pension'
- `owner_id` (UUID, foreign key naar members) - Eigenaar van het paard
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Fout: "Missing Supabase environment variables"
- Zorg dat je `.env.local` bestand bestaat met de juiste credentials
- Controleer dat de variabelen correct zijn gespeld

### Fout: "permission denied" of "new row violates row-level security"
- Zorg dat je de **service_role** key gebruikt, niet de anon key
- Check of Row Level Security (RLS) policies zijn ingesteld voor de members en horses tabellen

### Fout: "column does not exist"
- Voer eerst de migration uit (`database-migration-pension-klanten.sql`)
- Check of alle kolommen correct zijn toegevoegd aan de database

### Duplicate entries
- Het script checkt automatisch op bestaande klanten (op basis van email of naam)
- Bestaande klanten worden geüpdatet in plaats van dubbel aangemaakt

## Verificatie

Na de import kun je controleren of alles correct is geïmporteerd:

1. Ga naar Supabase Dashboard > Table Editor
2. Check de `members` tabel - je zou 22 pension klanten moeten zien
3. Check de `horses` tabel - je zou 32 paarden moeten zien
4. Filter op `klant_type = 'Pension'` om alleen pension klanten te zien

