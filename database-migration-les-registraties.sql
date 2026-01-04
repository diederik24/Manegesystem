-- Migration: Maak tabel voor les registraties
-- Voer dit uit in Supabase SQL Editor

-- Tabel voor les registraties
CREATE TABLE IF NOT EXISTS les_registraties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leskaart_id UUID REFERENCES leskaarten(id) ON DELETE CASCADE NOT NULL,
    klant_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    les_event_id TEXT, -- ID van de CalendarEvent
    les_datum DATE NOT NULL,
    les_tijd TIME NOT NULL,
    les_duur INTEGER DEFAULT 60, -- minuten
    les_type TEXT, -- Type les (Groepsles, Privéles, etc.)
    status TEXT NOT NULL DEFAULT 'gepland' CHECK (status IN ('gepland', 'gereden', 'afgezegd', 'niet_geteld')),
    automatisch_afgeschreven BOOLEAN DEFAULT FALSE,
    afgemeld_op TIMESTAMP WITH TIME ZONE,
    aangepast_op TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_les_registraties_leskaart_id ON les_registraties(leskaart_id);
CREATE INDEX IF NOT EXISTS idx_les_registraties_klant_id ON les_registraties(klant_id);
CREATE INDEX IF NOT EXISTS idx_les_registraties_les_datum ON les_registraties(les_datum);
CREATE INDEX IF NOT EXISTS idx_les_registraties_status ON les_registraties(status);

-- Trigger voor updated_at
CREATE TRIGGER update_les_registraties_updated_at BEFORE UPDATE ON les_registraties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE les_registraties IS 'Registraties van individuele lessen per leskaart';

