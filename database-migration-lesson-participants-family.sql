-- Migration: Uitbreiden lesson_participants tabel voor gezinsleden
-- Voer dit uit in Supabase SQL Editor

-- Voeg kolom toe voor gezinslid (optioneel, NULL betekent normale klant)
ALTER TABLE lesson_participants 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;

-- Maak member_id optioneel (want als family_member_id is ingevuld, hoeft member_id niet per se)
-- Maar we houden member_id verplicht voor backwards compatibility
-- Als family_member_id is ingevuld, betekent dit dat het gezinslid deelneemt
-- Als member_id is ingevuld zonder family_member_id, betekent dit dat de klant zelf deelneemt

-- Index voor sneller zoeken op gezinslid
CREATE INDEX IF NOT EXISTS idx_lesson_participants_family_member ON lesson_participants(family_member_id);

-- Constraint: ofwel member_id ofwel family_member_id moet ingevuld zijn
-- (We kunnen dit niet direct doen met CHECK constraint omdat member_id al NOT NULL is)
-- In plaats daarvan zorgen we er in de applicatie voor dat altijd één van beide is ingevuld

COMMENT ON COLUMN lesson_participants.family_member_id IS 'Optionele referentie naar gezinslid. Als ingevuld, neemt het gezinslid deel aan de les. Anders neemt de klant zelf deel.';

