-- ============================================================
-- Person-specific book progress (fixes shared progress bug)
-- ============================================================

-- Each person tracks their own page/completion for each book
CREATE TABLE person_book_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES families ON DELETE CASCADE,
  person_id   text NOT NULL,
  book_id     text NOT NULL,
  current_page int NOT NULL DEFAULT 0,
  completed   boolean NOT NULL DEFAULT false,
  completed_date text,
  UNIQUE(person_id, book_id)
);

CREATE INDEX person_book_progress_family_idx ON person_book_progress(family_id);

-- RLS
ALTER TABLE person_book_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pbp_select" ON person_book_progress
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "pbp_insert" ON person_book_progress
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "pbp_update" ON person_book_progress
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "pbp_delete" ON person_book_progress
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE person_book_progress;

-- Migrate existing data: assign book progress to the person with most recent reading log
INSERT INTO person_book_progress (family_id, person_id, book_id, current_page, completed, completed_date)
SELECT DISTINCT ON (b.id)
  b.family_id,
  rl.person_id::text,
  b.id::text,
  COALESCE(b.current_page, 0),
  COALESCE(b.completed, false),
  b.completed_date::text
FROM books b
JOIN reading_logs rl ON rl.book_id = b.id
WHERE COALESCE(b.current_page, 0) > 0
ORDER BY b.id, rl.date DESC
ON CONFLICT (person_id, book_id) DO NOTHING;
