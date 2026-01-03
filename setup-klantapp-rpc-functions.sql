-- ============================================
-- RPC Functions voor Klantenwebapp
-- ============================================
-- Deze functions maken het mogelijk om de views aan te roepen
-- vanuit de Supabase client zonder schema prefix
-- ============================================

-- Function om leskaarten op te halen
CREATE OR REPLACE FUNCTION public.get_my_leskaarten()
RETURNS TABLE (
    id UUID,
    klant_id UUID,
    totaal_lessen INTEGER,
    gebruikte_lessen INTEGER,
    resterende_lessen INTEGER,
    start_datum DATE,
    eind_datum DATE,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
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
    FROM klantappversie1.my_leskaarten l;
END;
$$;

-- Function om leskaart overzicht op te halen
CREATE OR REPLACE FUNCTION public.get_my_leskaart_overzicht()
RETURNS TABLE (
    klant_id UUID,
    aantal_actieve_leskaarten BIGINT,
    totaal_resterende_lessen BIGINT,
    totaal_lessen BIGINT,
    totaal_gebruikte_lessen BIGINT,
    eerste_start_datum DATE,
    laatste_eind_datum DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.klant_id,
        o.aantal_actieve_leskaarten,
        o.totaal_resterende_lessen,
        o.totaal_lessen,
        o.totaal_gebruikte_lessen,
        o.eerste_start_datum,
        o.laatste_eind_datum
    FROM klantappversie1.my_leskaart_overzicht o;
END;
$$;

-- Geef rechten aan authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_leskaarten() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_leskaart_overzicht() TO authenticated;

-- Comments
COMMENT ON FUNCTION public.get_my_leskaarten IS 
    'RPC function om leskaarten op te halen voor ingelogde gebruiker via klantappversie1.my_leskaarten view.';

COMMENT ON FUNCTION public.get_my_leskaart_overzicht IS 
    'RPC function om leskaart overzicht op te halen voor ingelogde gebruiker via klantappversie1.my_leskaart_overzicht view.';







