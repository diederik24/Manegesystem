-- Tabel voor afmeldingen van lessen
CREATE TABLE IF NOT EXISTS lesson_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  recurring_lesson_id UUID REFERENCES recurring_lessons(id) ON DELETE CASCADE,
  les_datum DATE NOT NULL,
  les_tijd TIME NOT NULL,
  opmerking TEXT,
  afgemeld_op TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_member_id ON lesson_cancellations(member_id);
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_family_member_id ON lesson_cancellations(family_member_id);
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_recurring_lesson_id ON lesson_cancellations(recurring_lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_les_datum ON lesson_cancellations(les_datum);
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_afgemeld_op ON lesson_cancellations(afgemeld_op);

-- RLS policies
ALTER TABLE lesson_cancellations ENABLE ROW LEVEL SECURITY;

-- Policy: Iedereen kan afmeldingen lezen (voor admin dashboard)
CREATE POLICY "Allow read access to lesson_cancellations" ON lesson_cancellations
  FOR SELECT
  USING (true);

-- Policy: Iedereen kan afmeldingen toevoegen (via app of admin)
-- In productie kun je dit restrictiever maken
CREATE POLICY "Allow insert cancellations" ON lesson_cancellations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Alleen service role kan afmeldingen updaten/verwijderen
CREATE POLICY "Allow update cancellations for service role" ON lesson_cancellations
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow delete cancellations for service role" ON lesson_cancellations
  FOR DELETE
  USING (auth.role() = 'service_role');

