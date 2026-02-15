-- ============================================================
-- Community Features — Cross-family reviews, book readers
-- ============================================================
-- Type reference:
--   persons.id = uuid, books.id = uuid
--   reading_logs.person_id = uuid, reading_logs.book_id = uuid
--   book_reviews.person_id = text, book_reviews.book_id = text

-- ─── 1. Open SELECT policies for cross-family reading ──────

DROP POLICY IF EXISTS "book_reviews_select" ON book_reviews;
DROP POLICY IF EXISTS "book_recommendations_select" ON book_recommendations;
DROP POLICY IF EXISTS "book_reviews_select_all" ON book_reviews;
DROP POLICY IF EXISTS "book_recommendations_select_all" ON book_recommendations;

CREATE POLICY "book_reviews_select_all" ON book_reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "book_recommendations_select_all" ON book_recommendations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─── 2. Community reviews RPC ──────────────────────────────

CREATE OR REPLACE FUNCTION get_community_reviews(lim int DEFAULT 50)
RETURNS TABLE (
  review_id text,
  person_name text,
  person_emoji text,
  family_name text,
  family_emoji text,
  book_title text,
  book_author text,
  book_emoji text,
  rating int,
  content text,
  likes text[],
  created_at text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    br.id AS review_id,
    p.name AS person_name,
    p.emoji AS person_emoji,
    f.name AS family_name,
    f.emoji AS family_emoji,
    b.title AS book_title,
    b.author AS book_author,
    b.emoji AS book_emoji,
    br.rating,
    br.content,
    br.likes,
    br.created_at
  FROM book_reviews br
  JOIN persons p ON p.id::text = br.person_id AND p.family_id = br.family_id
  JOIN families f ON f.id = br.family_id
  JOIN books b ON b.id::text = br.book_id AND b.family_id = br.family_id
  ORDER BY br.created_at DESC
  LIMIT lim;
$$;

-- ─── 3. Book readers RPC ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_book_readers(p_title text)
RETURNS TABLE (
  family_name text,
  family_emoji text,
  person_name text,
  person_emoji text,
  completed boolean,
  current_page int,
  total_pages int,
  review_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    f.name AS family_name,
    f.emoji AS family_emoji,
    p.name AS person_name,
    p.emoji AS person_emoji,
    COALESCE(b.completed, false) AS completed,
    COALESCE(b.current_page, 0)::int AS current_page,
    b.total_pages::int AS total_pages,
    COUNT(br.id) AS review_count
  FROM books b
  JOIN persons p ON p.id IN (
    SELECT DISTINCT rl.person_id FROM reading_logs rl WHERE rl.book_id = b.id
  ) AND p.family_id = b.family_id
  JOIN families f ON f.id = b.family_id
  LEFT JOIN book_reviews br ON br.book_id = b.id::text AND br.person_id = p.id::text
  WHERE b.title ILIKE p_title
  GROUP BY f.name, f.emoji, p.name, p.emoji, b.completed, b.current_page, b.total_pages
  ORDER BY f.name, p.name;
$$;
