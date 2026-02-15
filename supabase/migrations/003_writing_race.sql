-- 003_writing_race.sql
-- Add writing race system: writing entries, writing goals, book progress, person goals

-- ── Books: add page progress tracking ──
ALTER TABLE books ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed_date date;

-- ── Persons: add birth year and annual goals ──
ALTER TABLE persons ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_lines integer DEFAULT 50000;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_writing_count integer DEFAULT 24;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_writing_avg integer DEFAULT 70;

-- ── Writing entries table ──
CREATE TABLE IF NOT EXISTS writing_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  content text NOT NULL,
  char_count integer NOT NULL DEFAULT 0,
  word_count integer NOT NULL DEFAULT 0,
  scores jsonb NOT NULL DEFAULT '{}',
  total_score integer NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'D',
  feedback jsonb NOT NULL DEFAULT '{}',
  badges text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Writing goals table ──
CREATE TABLE IF NOT EXISTS writing_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  year integer NOT NULL,
  target_count integer NOT NULL DEFAULT 24,
  target_avg_score integer NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(family_id, person_id, year)
);

-- ── RLS policies ──
ALTER TABLE writing_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "writing_entries_family_access" ON writing_entries
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "writing_goals_family_access" ON writing_goals
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- ── Updated_at triggers ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER writing_entries_updated_at
  BEFORE UPDATE ON writing_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER writing_goals_updated_at
  BEFORE UPDATE ON writing_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Enable realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE writing_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE writing_goals;

-- ── Update ai_usage feature check to include 'writing' ──
-- Drop old constraint if exists, add new one
ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_feature_check;
ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_feature_check CHECK (feature IN ('chat', 'extract', 'writing'));
