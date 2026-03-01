-- ============================================================
-- 008: Missing RPC + columns
-- ============================================================

-- 1. families.avatar_url column (used by familyStore)
ALTER TABLE families ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. books.cover_url column (referenced in types)
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url text;

-- 3. create_family_with_admin RPC
-- Called by familyStore.createFamily(name, emoji)
-- Creates family + auto-adds current user as admin (approved)
CREATE OR REPLACE FUNCTION create_family_with_admin(
  family_name text,
  family_emoji text DEFAULT '👨‍👩‍👧‍👦'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_family families%ROWTYPE;
BEGIN
  INSERT INTO families (name, emoji, created_by)
  VALUES (family_name, family_emoji, auth.uid())
  RETURNING * INTO new_family;

  -- on_family_created trigger already inserts into family_members
  -- so we just return the family data

  RETURN json_build_object(
    'id', new_family.id,
    'name', new_family.name,
    'emoji', new_family.emoji,
    'invite_code', new_family.invite_code
  );
END;
$$;
