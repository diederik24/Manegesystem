# Schema Setup voor Klantenwebapp

## Overzicht

Dit script maakt een nieuw, geïsoleerd schema aan (`klantappversie1`) voor de klantenwebapp. Het schema is volledig gescheiden van het bestaande `public` schema.

## Wat doet het script?

1. **Maakt het schema aan** - `klantappversie1`
2. **Stelt permissions in** - Geeft toegang aan authenticated users, anon users, en service_role
3. **Veilig** - Wijzigt geen bestaande data of schema's

## Uitvoeren

1. Ga naar Supabase Dashboard → SQL Editor
2. Kopieer de inhoud van `database-schema-klantappversie1.sql`
3. Plak en voer uit
4. Controleer of het schema is aangemaakt met de verificatie query

## Gebruik van het schema

### Tabellen aanmaken in het schema:

```sql
-- Voorbeeld: Maak een tabel in het nieuwe schema
CREATE TABLE klantappversie1.klanten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    naam VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Queryen van tabellen in het schema:

```sql
-- Optie 1: Volledige schema naam
SELECT * FROM klantappversie1.klanten;

-- Optie 2: Search path instellen
SET search_path TO klantappversie1;
SELECT * FROM klanten;
```

## Toekomstige versies

Voor v2, v3, etc. kun je hetzelfde patroon gebruiken:

```sql
CREATE SCHEMA IF NOT EXISTS klantappversie2;
GRANT USAGE ON SCHEMA klantappversie2 TO authenticated;
GRANT USAGE ON SCHEMA klantappversie2 TO anon;
GRANT ALL ON SCHEMA klantappversie2 TO service_role;
```

## Belangrijke overwegingen

### Volledige isolatie vs. Data delen

**Optie A: Volledige isolatie (aanbevolen voor nieuwe app)**
- Kopieer alleen de benodigde data naar `klantappversie1`
- Geen foreign keys naar `public` schema
- Gebruik API keys of identifiers om te linken

**Optie B: Data delen**
- Foreign keys naar `public.members` zijn mogelijk
- Maar dit creëert een dependency
- Overweeg dit zorgvuldig

## Volgende stappen

Na het aanmaken van het schema kun je:
1. Tabellen aanmaken voor klanten, lessen, etc.
2. RLS policies instellen
3. Functions en triggers toevoegen
4. Indexes aanmaken voor performance








