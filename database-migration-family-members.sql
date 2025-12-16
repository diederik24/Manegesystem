-- Migration: Maak tabel voor gezinsleden / familie members
-- Voer dit uit in Supabase SQL Editor

-- Tabel voor gezinsleden (familie members)
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL, -- Hoofdklant die betaalt
    name VARCHAR(255) NOT NULL, -- Naam van het gezinslid
    geboortedatum DATE, -- Optionele geboortedatum
    email VARCHAR(255), -- Optionele email (kan afwijken van hoofdklant)
    telefoon VARCHAR(50), -- Optionele telefoon (kan afwijken van hoofdklant)
    opmerking TEXT, -- Optionele opmerkingen
    status VARCHAR(20) CHECK (status IN ('Actief', 'Inactief')) DEFAULT 'Actief',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor sneller zoeken op hoofdklant
CREATE INDEX IF NOT EXISTS idx_family_members_member_id ON family_members(member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_status ON family_members(status);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(name);

-- Trigger voor updated_at
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaar voor duidelijkheid
COMMENT ON TABLE family_members IS 'Gezinsleden / familie members die deelnemen aan lessen maar geen eigen klantrecord hebben. De hoofdklant (member_id) betaalt voor deze gezinsleden.';
COMMENT ON COLUMN family_members.member_id IS 'Referentie naar de hoofdklant die betaalt voor dit gezinslid';
COMMENT ON COLUMN family_members.name IS 'Volledige naam van het gezinslid';
COMMENT ON COLUMN family_members.status IS 'Actief: kan deelnemen aan lessen, Inactief: niet meer actief';

