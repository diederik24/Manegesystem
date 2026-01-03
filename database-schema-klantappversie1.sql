-- ============================================
-- Schema Setup voor Klantenwebapp v1
-- ============================================
-- Dit script maakt een nieuw, geïsoleerd schema aan
-- voor de klantenwebapp zonder bestaande data te wijzigen
-- ============================================

-- Stap 1: Maak het nieuwe schema aan
-- Dit creëert een volledig gescheiden namespace binnen dezelfde database
CREATE SCHEMA IF NOT EXISTS klantappversie1;

-- Stap 2: Geef de authenticated role (Supabase users) toegang tot het schema
-- Dit zorgt ervoor dat ingelogde gebruikers het schema kunnen gebruiken
GRANT USAGE ON SCHEMA klantappversie1 TO authenticated;
GRANT USAGE ON SCHEMA klantappversie1 TO anon;

-- Stap 3: Geef service_role volledige toegang (voor admin operaties)
-- Dit is nodig voor server-side operaties en admin functionaliteit
GRANT ALL ON SCHEMA klantappversie1 TO service_role;

-- Stap 4: Stel de search_path in voor het schema (optioneel, voor gemak)
-- Dit zorgt ervoor dat queries automatisch in dit schema zoeken
-- ALTER DATABASE current SET search_path TO public, klantappversie1;

-- Stap 5: Maak een extensie beschikbaar in het schema (als nodig)
-- Bijvoorbeeld voor UUID generatie (meestal al beschikbaar in public)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA klantappversie1;

-- ============================================
-- Verificatie
-- ============================================
-- Controleer of het schema is aangemaakt:
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'klantappversie1';

-- ============================================
-- Toekomstige versies
-- ============================================
-- Voor toekomstige versies kun je hetzelfde patroon gebruiken:
-- CREATE SCHEMA IF NOT EXISTS klantappversie2;
-- CREATE SCHEMA IF NOT EXISTS klantappversie3;
-- etc.

-- ============================================
-- Best Practices Notities
-- ============================================
-- 1. Schema's zijn volledig geïsoleerd - tabellen in klantappversie1
--    zijn niet zichtbaar vanuit public schema (tenzij expliciet gequeryd)
-- 
-- 2. Om tabellen in dit schema te gebruiken:
--    - SELECT * FROM klantappversie1.tabel_naam
--    - Of: SET search_path TO klantappversie1; SELECT * FROM tabel_naam
--
-- 3. RLS (Row Level Security) policies werken per schema
--    Je kunt aparte policies instellen voor klantappversie1
--
-- 4. Foreign keys naar public schema tabellen zijn mogelijk:
--    - Bijvoorbeeld: klantappversie1.lessen kan refereren naar public.members
--    - Maar dit creëert een dependency - overweeg dit zorgvuldig
--
-- 5. Voor volledige isolatie: gebruik geen foreign keys naar public
--    Gebruik in plaats daarvan API keys of andere identificatoren








