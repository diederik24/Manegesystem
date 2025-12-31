-- ============================================
-- Veilige Read-Only View voor Leskaarten
-- Schema: klantappversie1
-- ============================================
-- Dit script maakt een veilige read-only view aan
-- zodat klanten hun eigen leskaart kunnen inzien
-- zonder de productiedata te kunnen aanpassen
-- ============================================

-- STAP 1: Zorg dat het schema bestaat en toegankelijk is
-- ============================================
CREATE SCHEMA IF NOT EXISTS klantappversie1;

GRANT USAGE ON SCHEMA klantappversie1 TO authenticated;
GRANT USAGE ON SCHEMA klantappversie1 TO anon;
GRANT ALL ON SCHEMA klantappversie1 TO service_role;

-- STAP 2: Maak koppeltabel tussen auth.users en members
-- ============================================
-- Deze tabel koppelt een Supabase Auth gebruiker (auth.users.id)
-- aan een klant record in de members tabel
CREATE TABLE IF NOT EXISTS klantappversie1.customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    member_id UUID NOT NULL, -- Referentie naar public.members(id) zonder foreign key constraint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_customer_accounts_auth_user 
    ON klantappversie1.customer_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_member 
    ON klantappversie1.customer_accounts(member_id);

-- Comment
COMMENT ON TABLE klantappversie1.customer_accounts IS 
    'Koppeltabel tussen Supabase Auth gebruikers en klant records. Beheerd door admin.';

-- STAP 3: Maak een security definer function om member_id op te halen
-- ============================================
-- Deze function haalt veilig de member_id op voor de ingelogde gebruiker
-- Security definer zorgt ervoor dat de function draait met de rechten van de creator
CREATE OR REPLACE FUNCTION klantappversie1.get_current_member_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    SELECT member_id INTO v_member_id
    FROM klantappversie1.customer_accounts
    WHERE auth_user_id = auth.uid();
    
    RETURN v_member_id;
END;
$$;

-- Geef authenticated users rechten om deze function te gebruiken
GRANT EXECUTE ON FUNCTION klantappversie1.get_current_member_id() TO authenticated;

-- STAP 4: Maak read-only view voor actieve leskaarten
-- ============================================
-- Deze view toont alleen actieve leskaarten en filtert op de ingelogde gebruiker
CREATE OR REPLACE VIEW klantappversie1.my_leskaarten AS
SELECT 
    l.id,
    l.klant_id,
    l.totaal_lessen,
    l.gebruikte_lessen,
    l.resterende_lessen,
    l.start_datum,
    l.eind_datum,
    l.status,
    l.created_at,
    l.updated_at
FROM public.leskaarten l
WHERE l.status = 'actief'
  AND l.klant_id = klantappversie1.get_current_member_id();

-- Comment
COMMENT ON VIEW klantappversie1.my_leskaarten IS 
    'Read-only view voor klanten om hun eigen actieve leskaarten in te zien.';

-- STAP 4b: Maak een samenvattende view met totaal resterende lessen
-- ============================================
-- Deze view toont een overzicht met het totaal aantal resterende lessen
CREATE OR REPLACE VIEW klantappversie1.my_leskaart_overzicht AS
SELECT 
    klantappversie1.get_current_member_id() AS klant_id,
    COUNT(*) AS aantal_actieve_leskaarten,
    SUM(l.resterende_lessen) AS totaal_resterende_lessen,
    SUM(l.totaal_lessen) AS totaal_lessen,
    SUM(l.gebruikte_lessen) AS totaal_gebruikte_lessen,
    MIN(l.start_datum) AS eerste_start_datum,
    MAX(l.eind_datum) AS laatste_eind_datum
FROM public.leskaarten l
WHERE l.status = 'actief'
  AND l.klant_id = klantappversie1.get_current_member_id();

-- Comment
COMMENT ON VIEW klantappversie1.my_leskaart_overzicht IS 
    'Samenvattend overzicht van alle actieve leskaarten met totaal resterende lessen.';

-- STAP 5: Maak een echte tabel voor klant leskaart data (optioneel)
-- ============================================
-- Deze tabel kan gebruikt worden als je een echte tabel wilt in plaats van alleen views
-- De tabel wordt automatisch gevuld via een trigger of functie
CREATE TABLE IF NOT EXISTS klantappversie1.customer_leskaarten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    klant_id UUID NOT NULL,
    leskaart_id UUID NOT NULL, -- Referentie naar public.leskaarten(id)
    totaal_lessen INTEGER NOT NULL DEFAULT 0,
    gebruikte_lessen INTEGER NOT NULL DEFAULT 0,
    resterende_lessen INTEGER NOT NULL DEFAULT 0,
    start_datum DATE NOT NULL,
    eind_datum DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(klant_id, leskaart_id)
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_customer_leskaarten_klant 
    ON klantappversie1.customer_leskaarten(klant_id);
CREATE INDEX IF NOT EXISTS idx_customer_leskaarten_status 
    ON klantappversie1.customer_leskaarten(status);
CREATE INDEX IF NOT EXISTS idx_customer_leskaarten_leskaart 
    ON klantappversie1.customer_leskaarten(leskaart_id);

-- Comment
COMMENT ON TABLE klantappversie1.customer_leskaarten IS 
    'Kopie van leskaart data voor klanten. Alleen actieve leskaarten worden gesynchroniseerd.';

-- STAP 5b: Maak een view op de tabel die alleen de huidige gebruiker toont
-- ============================================
CREATE OR REPLACE VIEW klantappversie1.my_leskaarten_tabel AS
SELECT 
    cl.id,
    cl.klant_id,
    cl.totaal_lessen,
    cl.gebruikte_lessen,
    cl.resterende_lessen,
    cl.start_datum,
    cl.eind_datum,
    cl.status,
    cl.last_synced_at,
    cl.created_at,
    cl.updated_at
FROM klantappversie1.customer_leskaarten cl
WHERE cl.klant_id = klantappversie1.get_current_member_id()
  AND cl.status = 'actief';

-- STAP 5c: Maak een samenvattende view op de tabel
-- ============================================
CREATE OR REPLACE VIEW klantappversie1.my_leskaart_totaal AS
SELECT 
    klantappversie1.get_current_member_id() AS klant_id,
    COUNT(*) AS aantal_actieve_leskaarten,
    SUM(cl.resterende_lessen) AS totaal_resterende_lessen,
    SUM(cl.totaal_lessen) AS totaal_lessen,
    SUM(cl.gebruikte_lessen) AS totaal_gebruikte_lessen,
    MIN(cl.start_datum) AS eerste_start_datum,
    MAX(cl.eind_datum) AS laatste_eind_datum,
    MAX(cl.last_synced_at) AS laatste_sync
FROM klantappversie1.customer_leskaarten cl
WHERE cl.klant_id = klantappversie1.get_current_member_id()
  AND cl.status = 'actief';

-- STAP 6: Enable Row Level Security (RLS) op de tabel
-- ============================================
ALTER TABLE klantappversie1.customer_leskaarten ENABLE ROW LEVEL SECURITY;

-- Policy: Klanten kunnen alleen hun eigen leskaarten zien
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'klantappversie1' 
        AND tablename = 'customer_leskaarten' 
        AND policyname = 'Users can view their own leskaarten'
    ) THEN
        DROP POLICY "Users can view their own leskaarten" ON klantappversie1.customer_leskaarten;
    END IF;
END $$;

CREATE POLICY "Users can view their own leskaarten"
    ON klantappversie1.customer_leskaarten
    FOR SELECT
    TO authenticated
    USING (klant_id = klantappversie1.get_current_member_id());

-- Policy: Voorkom INSERT, UPDATE, DELETE door klanten
-- (Alleen service_role kan deze tabel beheren via sync functie)

-- STAP 7: Maak sync functie om leskaarten te synchroniseren (alleen service_role)
-- ============================================
CREATE OR REPLACE FUNCTION klantappversie1.sync_customer_leskaarten()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_synced_count INTEGER := 0;
BEGIN
    -- Verwijder oude records voor klanten die geen actieve leskaarten meer hebben
    DELETE FROM klantappversie1.customer_leskaarten
    WHERE leskaart_id NOT IN (
        SELECT id FROM public.leskaarten WHERE status = 'actief'
    );
    
    -- Insert of update actieve leskaarten
    INSERT INTO klantappversie1.customer_leskaarten (
        klant_id,
        leskaart_id,
        totaal_lessen,
        gebruikte_lessen,
        resterende_lessen,
        start_datum,
        eind_datum,
        status,
        last_synced_at,
        updated_at
    )
    SELECT 
        l.klant_id,
        l.id,
        l.totaal_lessen,
        l.gebruikte_lessen,
        l.resterende_lessen,
        l.start_datum,
        l.eind_datum,
        l.status,
        NOW(),
        NOW()
    FROM public.leskaarten l
    WHERE l.status = 'actief'
    ON CONFLICT (klant_id, leskaart_id)
    DO UPDATE SET
        totaal_lessen = EXCLUDED.totaal_lessen,
        gebruikte_lessen = EXCLUDED.gebruikte_lessen,
        resterende_lessen = EXCLUDED.resterende_lessen,
        start_datum = EXCLUDED.start_datum,
        eind_datum = EXCLUDED.eind_datum,
        status = EXCLUDED.status,
        last_synced_at = NOW(),
        updated_at = NOW();
    
    GET DIAGNOSTICS v_synced_count = ROW_COUNT;
    
    RETURN v_synced_count;
END;
$$;

-- Alleen service_role kan deze function gebruiken
GRANT EXECUTE ON FUNCTION klantappversie1.sync_customer_leskaarten() TO service_role;

-- Comment
COMMENT ON FUNCTION klantappversie1.sync_customer_leskaarten IS 
    'Synchroniseert actieve leskaarten naar customer_leskaarten tabel. Alleen service_role.';

-- STAP 8: Geef rechten aan authenticated users
-- ============================================
-- Klanten kunnen alleen SELECT uitvoeren op de views en tabel
GRANT SELECT ON klantappversie1.my_leskaarten TO authenticated;
GRANT SELECT ON klantappversie1.my_leskaart_overzicht TO authenticated;
GRANT SELECT ON klantappversie1.customer_leskaarten TO authenticated;
GRANT SELECT ON klantappversie1.my_leskaarten_tabel TO authenticated;
GRANT SELECT ON klantappversie1.my_leskaart_totaal TO authenticated;

-- STAP 9: Enable Row Level Security (RLS) op de koppeltabel
-- ============================================
-- RLS is standaard niet beschikbaar voor views, maar we gebruiken
-- de security definer function om de filtering te doen
-- Voor extra veiligheid kunnen we ook RLS op de koppeltabel zetten

ALTER TABLE klantappversie1.customer_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Klanten kunnen alleen hun eigen account record zien
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'klantappversie1' 
        AND tablename = 'customer_accounts' 
        AND policyname = 'Users can view their own account'
    ) THEN
        DROP POLICY "Users can view their own account" ON klantappversie1.customer_accounts;
    END IF;
END $$;

CREATE POLICY "Users can view their own account"
    ON klantappversie1.customer_accounts
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- STAP 10: Voorkom dat klanten data kunnen aanpassen
-- ============================================
-- Zorg dat authenticated users GEEN INSERT, UPDATE of DELETE kunnen doen
-- Dit is al geregeld door alleen SELECT rechten te geven op de views/tabellen,
-- maar voor extra veiligheid blokkeren we ook directe toegang tot de koppeltabel

-- Geen INSERT, UPDATE of DELETE rechten voor authenticated users op customer_accounts
-- (Alleen service_role kan deze tabel beheren)

-- STAP 11: Helper function voor admin om accounts te koppelen
-- ============================================
-- Deze function kan alleen door service_role worden gebruikt
-- om nieuwe koppelingen te maken tussen auth.users en members
CREATE OR REPLACE FUNCTION klantappversie1.link_customer_account(
    p_auth_user_id UUID,
    p_member_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Controleer of member_id bestaat in public.members
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = p_member_id) THEN
        RAISE EXCEPTION 'Member ID % does not exist', p_member_id;
    END IF;
    
    -- Controleer of auth_user_id bestaat
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_auth_user_id) THEN
        RAISE EXCEPTION 'Auth user ID % does not exist', p_auth_user_id;
    END IF;
    
    -- Maak of update de koppeling
    INSERT INTO klantappversie1.customer_accounts (auth_user_id, member_id)
    VALUES (p_auth_user_id, p_member_id)
    ON CONFLICT (auth_user_id) 
    DO UPDATE SET 
        member_id = EXCLUDED.member_id,
        updated_at = NOW()
    RETURNING id INTO v_account_id;
    
    RETURN v_account_id;
END;
$$;

-- Alleen service_role kan deze function gebruiken
GRANT EXECUTE ON FUNCTION klantappversie1.link_customer_account(UUID, UUID) TO service_role;

-- Comment
COMMENT ON FUNCTION klantappversie1.link_customer_account IS 
    'Admin function om een auth user te koppelen aan een member. Alleen service_role.';

-- ============================================
-- VERIFICATIE QUERIES
-- ============================================
-- Voer deze queries uit om te controleren of alles correct is ingesteld:

-- 1. Controleer of het schema bestaat:
-- SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'klantappversie1';

-- 2. Controleer of de koppeltabel bestaat:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'klantappversie1' AND table_name = 'customer_accounts';

-- 3. Controleer of de views bestaan:
-- SELECT * FROM information_schema.views WHERE table_schema = 'klantappversie1';
--
-- 4. Controleer of de tabel bestaat:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'klantappversie1' AND table_name = 'customer_leskaarten';

-- 5. Controleer RLS policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'klantappversie1';

-- ============================================
-- GEBRUIK
-- ============================================
-- 
-- Als admin, koppel een auth user aan een member:
-- SELECT klantappversie1.link_customer_account(
--     'auth-user-uuid-here'::UUID,
--     'member-uuid-here'::UUID
-- );
--
-- Als ingelogde klant, bekijk je eigen leskaarten:
-- SELECT * FROM klantappversie1.my_leskaarten;
--
-- Als ingelogde klant, bekijk totaal resterende lessen (via view op public.leskaarten):
-- SELECT totaal_resterende_lessen FROM klantappversie1.my_leskaart_overzicht;
--
-- Als ingelogde klant, bekijk volledig overzicht (via view op public.leskaarten):
-- SELECT * FROM klantappversie1.my_leskaart_overzicht;
--
-- Als ingelogde klant, bekijk leskaarten uit de tabel (na sync):
-- SELECT * FROM klantappversie1.my_leskaarten_tabel;
--
-- Als ingelogde klant, bekijk totaal uit de tabel (na sync):
-- SELECT totaal_resterende_lessen FROM klantappversie1.my_leskaart_totaal;
--
-- Als admin, synchroniseer leskaarten naar de tabel:
-- SELECT klantappversie1.sync_customer_leskaarten();
--
-- ============================================

