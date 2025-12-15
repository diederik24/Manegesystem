-- Migration: Voeg factuur velden toe aan members tabel
-- Voer dit uit in Supabase SQL Editor

-- Voeg factuur adres velden toe
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS factuur_adres VARCHAR(255),
ADD COLUMN IF NOT EXISTS factuur_postcode VARCHAR(20),
ADD COLUMN IF NOT EXISTS factuur_plaats VARCHAR(100),
ADD COLUMN IF NOT EXISTS factuur_ontvangen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS factuur_email VARCHAR(255);

-- Index voor factuur_ontvangen voor betere filtering
CREATE INDEX IF NOT EXISTS idx_members_factuur_ontvangen ON members(factuur_ontvangen);

