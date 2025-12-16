-- Migration: Maak tabellen voor recurring lessons en deelnemers
-- Voer dit uit in Supabase SQL Editor

-- Tabel voor recurring lessons (terugkerende lessen)
CREATE TABLE IF NOT EXISTS recurring_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Groep naam (bijv. "Maandag 19:00 Priveles")
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Maandag, 6 = Zondag
    time TIME NOT NULL, -- Start tijd (bijv. "19:00:00")
    duration INTEGER DEFAULT 60, -- Duur in minuten
    type VARCHAR(50), -- Type les (Priveles, Groepsles, Pensionles, etc.)
    instructor VARCHAR(255),
    max_participants INTEGER DEFAULT 10,
    color VARCHAR(20) CHECK (color IN ('blue', 'teal', 'orange', 'amber', 'green', 'purple', 'pink', 'indigo')) DEFAULT 'blue',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor deelnemers aan recurring lessons
CREATE TABLE IF NOT EXISTS lesson_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_lesson_id UUID REFERENCES recurring_lessons(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recurring_lesson_id, member_id)
);

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_recurring_lessons_day ON recurring_lessons(day_of_week);
CREATE INDEX IF NOT EXISTS idx_recurring_lessons_time ON recurring_lessons(time);
CREATE INDEX IF NOT EXISTS idx_lesson_participants_lesson ON lesson_participants(recurring_lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_participants_member ON lesson_participants(member_id);

-- Trigger voor updated_at
CREATE TRIGGER update_recurring_lessons_updated_at BEFORE UPDATE ON recurring_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

