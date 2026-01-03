-- Fix RLS policies voor lesson_cancellations
-- Voer dit uit als de tabel al bestaat

-- Verwijder oude policy
DROP POLICY IF EXISTS "Allow insert own cancellations" ON lesson_cancellations;

-- Nieuwe policy: Iedereen kan afmeldingen toevoegen
CREATE POLICY "Allow insert cancellations" ON lesson_cancellations
  FOR INSERT
  WITH CHECK (true);


