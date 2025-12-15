-- Migration: Voeg velden toe aan members tabel voor pension klanten import
-- Voer dit uit in Supabase SQL Editor voordat je de import doet

-- Voeg adres velden toe aan members tabel
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS adres VARCHAR(255),
ADD COLUMN IF NOT EXISTS postcode VARCHAR(20),
ADD COLUMN IF NOT EXISTS plaats VARCHAR(100),
ADD COLUMN IF NOT EXISTS klant_type VARCHAR(20) CHECK (klant_type IN ('Pension', 'Manege'));

-- Maak email niet meer verplicht (sommige pension klanten hebben geen email)
ALTER TABLE members 
ALTER COLUMN email DROP NOT NULL;

-- Voeg index toe voor klant_type voor betere filtering
CREATE INDEX IF NOT EXISTS idx_members_klant_type ON members(klant_type);

