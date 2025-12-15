-- Migration: Maak tabel voor nieuwe aanmeldingen
-- Voer dit uit in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nieuwe_aanmeldingen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voorletters VARCHAR(10),
    voornaam VARCHAR(255) NOT NULL,
    tussenvoegsel VARCHAR(50),
    achternaam VARCHAR(255) NOT NULL,
    geboortedatum DATE,
    adres VARCHAR(255),
    postcode VARCHAR(20),
    plaats VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    telefoon1 VARCHAR(50),
    telefoon2 VARCHAR(50),
    noodcontact_naam VARCHAR(255),
    noodcontact_telefoon VARCHAR(50),
    opmerking TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor status filtering
CREATE INDEX IF NOT EXISTS idx_nieuwe_aanmeldingen_status ON nieuwe_aanmeldingen(status);
CREATE INDEX IF NOT EXISTS idx_nieuwe_aanmeldingen_email ON nieuwe_aanmeldingen(email);
CREATE INDEX IF NOT EXISTS idx_nieuwe_aanmeldingen_created_at ON nieuwe_aanmeldingen(created_at);

-- Trigger voor updated_at
CREATE TRIGGER update_nieuwe_aanmeldingen_updated_at BEFORE UPDATE ON nieuwe_aanmeldingen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

