-- Maak de horses tabel aan als deze nog niet bestaat
-- Voer dit uit in Supabase SQL Editor

-- Eerst de functie aanmaken (als deze nog niet bestaat)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Maak de horses tabel aan
CREATE TABLE IF NOT EXISTS horses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    birth_date DATE,
    available BOOLEAN DEFAULT true,
    type VARCHAR(20) CHECK (type IN ('Manege', 'Pension')) NOT NULL,
    owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor betere performance
CREATE INDEX IF NOT EXISTS idx_horses_owner ON horses(owner_id);
CREATE INDEX IF NOT EXISTS idx_horses_available ON horses(available);
CREATE INDEX IF NOT EXISTS idx_horses_type ON horses(type);

-- Trigger voor updated_at (verwijder eerst als deze bestaat)
DROP TRIGGER IF EXISTS update_horses_updated_at ON horses;
CREATE TRIGGER update_horses_updated_at BEFORE UPDATE ON horses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

