-- ⚠️ BELANGRIJK: Voer dit script EERST uit voordat je API keys kunt aanmaken!
-- Dit maakt de api_keys tabel aan in je database

-- Migration: API Keys tabel voor klant authenticatie
-- Elke klant krijgt een eigen unieke API key om hun data op te halen

-- Tabel voor API keys (1-op-1 relatie met members)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL UNIQUE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optioneel: vervaldatum
    notes TEXT -- Optionele notities
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_member ON api_keys(member_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Functie om een nieuwe API key te genereren
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    v_key TEXT;
BEGIN
    -- Genereer een veilige random key: mk_ gevolgd door base64 encoded random bytes
    v_key := encode(gen_random_bytes(32), 'base64');
    -- Vervang URL-unsafe karakters
    v_key := replace(v_key, '+', '-');
    v_key := replace(v_key, '/', '_');
    v_key := replace(v_key, '=', '');
    RETURN 'mk_' || v_key;
END;
$$ LANGUAGE plpgsql;

-- Comments voor documentatie
COMMENT ON TABLE api_keys IS 'API keys voor klanten om hun eigen data op te halen via de API';
COMMENT ON COLUMN api_keys.member_id IS 'Unieke referentie naar de klant (1-op-1 relatie)';
COMMENT ON COLUMN api_keys.api_key IS 'De unieke API key string die gebruikt wordt voor authenticatie';

-- Verifieer dat de tabel is aangemaakt
SELECT 
    '✅ Tabel api_keys succesvol aangemaakt!' as status,
    COUNT(*) as aantal_keys
FROM api_keys;








