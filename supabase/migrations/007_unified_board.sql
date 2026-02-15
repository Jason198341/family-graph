-- ============================================================
-- Unified Board: comments + cross-family likes + reader stats
-- ============================================================

-- 1. Add likes to recommendations (reviews already have likes)
ALTER TABLE book_recommendations ADD COLUMN IF NOT EXISTS likes text[] NOT NULL DEFAULT '{}';

-- 2. Open SELECT policies for all authenticated users
-- (drop existing family-only policies if they exist, create open ones)
DROP POLICY IF EXISTS "book_reviews_select" ON book_reviews;
DROP POLICY IF EXISTS "book_reviews_select_all" ON book_reviews;
DROP POLICY IF EXISTS "book_recommendations_select" ON book_recommendations;
DROP POLICY IF EXISTS "book_recommendations_select_all" ON book_recommendations;

CREATE POLICY "book_reviews_select_all" ON book_reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "book_recommendations_select_all" ON book_recommendations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Post comments table
CREATE TABLE post_comments (
  id text PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families ON DELETE CASCADE,
  post_id text NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('review', 'recommend')),
  person_id text NOT NULL,
  person_name text NOT NULL DEFAULT '',
  person_emoji text NOT NULL DEFAULT '',
  family_name text NOT NULL DEFAULT '',
  family_emoji text NOT NULL DEFAULT '',
  content text NOT NULL,
  created_at text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE INDEX post_comments_post_idx ON post_comments(post_id, post_type);
CREATE INDEX post_comments_family_idx ON post_comments(family_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read comments
CREATE POLICY "comments_select_all" ON post_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only own family can insert
CREATE POLICY "comments_insert" ON post_comments
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved')
  );

-- Only own family can delete
CREATE POLICY "comments_delete" ON post_comments
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved')
  );

-- 4. RPC: get all posts (reviews + recommendations) for the unified feed
CREATE OR REPLACE FUNCTION get_community_feed(lim int DEFAULT 50)
RETURNS TABLE (
  post_id text,
  post_type text,
  person_name text,
  person_emoji text,
  family_name text,
  family_emoji text,
  family_id uuid,
  book_title text,
  book_author text,
  book_emoji text,
  rating int,
  content text,
  likes text[],
  comment_count bigint,
  created_at text
)
LANGUAGE sql SECURITY DEFINER AS $$
  (
    SELECT
      br.id AS post_id, 'review' AS post_type,
      p.name AS person_name, p.emoji AS person_emoji,
      f.name AS family_name, f.emoji AS family_emoji, f.id AS family_id,
      b.title AS book_title, b.author AS book_author, b.emoji AS book_emoji,
      br.rating,
      br.content,
      br.likes,
      (SELECT count(*) FROM post_comments pc WHERE pc.post_id = br.id AND pc.post_type = 'review') AS comment_count,
      br.created_at
    FROM book_reviews br
    JOIN persons p ON p.id::text = br.person_id AND p.family_id = br.family_id
    JOIN families f ON f.id = br.family_id
    LEFT JOIN books b ON b.id::text = br.book_id AND b.family_id = br.family_id
  )
  UNION ALL
  (
    SELECT
      rec.id AS post_id, 'recommend' AS post_type,
      p.name AS person_name, p.emoji AS person_emoji,
      f.name AS family_name, f.emoji AS family_emoji, f.id AS family_id,
      rec.book_title, rec.author AS book_author, rec.emoji AS book_emoji,
      0 AS rating,
      rec.reason AS content,
      rec.likes,
      (SELECT count(*) FROM post_comments pc WHERE pc.post_id = rec.id AND pc.post_type = 'recommend') AS comment_count,
      rec.created_at
    FROM book_recommendations rec
    JOIN persons p ON p.id::text = rec.person_id AND p.family_id = rec.family_id
    JOIN families f ON f.id = rec.family_id
  )
  ORDER BY created_at DESC
  LIMIT lim;
$$;

-- 5. RPC: get comments for a specific post
CREATE OR REPLACE FUNCTION get_post_comments(p_post_id text, p_post_type text)
RETURNS TABLE (
  comment_id text,
  person_name text,
  person_emoji text,
  family_name text,
  family_emoji text,
  family_id uuid,
  content text,
  created_at text
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pc.id AS comment_id,
    pc.person_name, pc.person_emoji,
    pc.family_name, pc.family_emoji, pc.family_id,
    pc.content, pc.created_at
  FROM post_comments pc
  WHERE pc.post_id = p_post_id AND pc.post_type = p_post_type
  ORDER BY pc.created_at ASC;
$$;

-- 6. RPC: book reader stats (how many families are reading a book by title)
CREATE OR REPLACE FUNCTION get_book_reader_stats(p_title text)
RETURNS TABLE (
  family_count bigint,
  reader_count bigint,
  completed_count bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    count(DISTINCT b.family_id) AS family_count,
    count(DISTINCT rl.person_id) AS reader_count,
    count(DISTINCT CASE WHEN pbp.completed THEN pbp.person_id END) AS completed_count
  FROM books b
  LEFT JOIN reading_logs rl ON rl.book_id = b.id
  LEFT JOIN person_book_progress pbp ON pbp.book_id = b.id::text
  WHERE b.title ILIKE p_title;
$$;

-- 7. RPC: toggle like on a post (cross-family, bypasses RLS)
CREATE OR REPLACE FUNCTION toggle_post_like(
  p_post_id text,
  p_post_type text,
  p_person_id text
) RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_likes text[];
  new_likes text[];
BEGIN
  IF p_post_type = 'review' THEN
    SELECT likes INTO current_likes FROM book_reviews WHERE id = p_post_id;
    IF p_person_id = ANY(current_likes) THEN
      new_likes := array_remove(current_likes, p_person_id);
    ELSE
      new_likes := array_append(current_likes, p_person_id);
    END IF;
    UPDATE book_reviews SET likes = new_likes WHERE id = p_post_id;
  ELSIF p_post_type = 'recommend' THEN
    SELECT likes INTO current_likes FROM book_recommendations WHERE id = p_post_id;
    IF p_person_id = ANY(current_likes) THEN
      new_likes := array_remove(current_likes, p_person_id);
    ELSE
      new_likes := array_append(current_likes, p_person_id);
    END IF;
    UPDATE book_recommendations SET likes = new_likes WHERE id = p_post_id;
  END IF;
  RETURN new_likes;
END;
$$;
