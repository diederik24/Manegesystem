-- Migration: Maak tabel voor leskaarten
-- Voer dit uit in Supabase SQL Editor

-- Tabel voor leskaarten
CREATE TABLE IF NOT EXISTS leskaarten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    klant_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    totaal_lessen INTEGER NOT NULL DEFAULT 0,
    gebruikte_lessen INTEGER NOT NULL DEFAULT 0,
    resterende_lessen INTEGER NOT NULL DEFAULT 0,
    start_datum DATE NOT NULL,
    eind_datum DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('actief', 'opgebruikt', 'verlopen')) DEFAULT 'actief',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_leskaarten_klant ON leskaarten(klant_id);
CREATE INDEX IF NOT EXISTS idx_leskaarten_status ON leskaarten(status);
CREATE INDEX IF NOT EXISTS idx_leskaarten_eind_datum ON leskaarten(eind_datum);

-- Trigger voor updated_at
CREATE TRIGGER update_leskaarten_updated_at BEFORE UPDATE ON leskaarten
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE leskaarten IS 'Leskaarten voor klanten met aantal lessen en gebruik';
