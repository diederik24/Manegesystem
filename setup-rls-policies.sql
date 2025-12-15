-- Row Level Security (RLS) Policies voor members en horses tabellen
-- Voer dit uit in Supabase SQL Editor als je RLS hebt ingeschakeld

-- Enable RLS op members tabel (als nog niet gedaan)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Iedereen kan members lezen (voor nu - pas aan naar jouw behoeften)
CREATE POLICY "Allow public read access to members"
ON members
FOR SELECT
USING (true);

-- Policy: Iedereen kan members aanmaken (voor nu - pas aan naar jouw behoeften)
CREATE POLICY "Allow public insert access to members"
ON members
FOR INSERT
WITH CHECK (true);

-- Policy: Iedereen kan members updaten (voor nu - pas aan naar jouw behoeften)
CREATE POLICY "Allow public update access to members"
ON members
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable RLS op horses tabel (als nog niet gedaan)
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;

-- Policy: Iedereen kan horses lezen
CREATE POLICY "Allow public read access to horses"
ON horses
FOR SELECT
USING (true);

-- Policy: Iedereen kan horses aanmaken
CREATE POLICY "Allow public insert access to horses"
ON horses
FOR INSERT
WITH CHECK (true);

-- Policy: Iedereen kan horses updaten
CREATE POLICY "Allow public update access to horses"
ON horses
FOR UPDATE
USING (true)
WITH CHECK (true);

