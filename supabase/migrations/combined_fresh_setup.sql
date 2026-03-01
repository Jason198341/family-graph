-- ============================================================
-- Family Graph — COMBINED FRESH SETUP (All 7 migrations)
-- Run this in Supabase SQL Editor for new project setup
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 001_schema.sql — Core Tables + Functions + RLS
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Tables ───────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text not null default '',
  avatar_emoji text not null default '👤',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '👨‍👩‍👧‍👦',
  invite_code text not null default substr(md5(random()::text), 1, 8),
  created_by  uuid not null references auth.users on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index families_invite_code_idx on families(invite_code);

create table family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  role        text not null default 'member' check (role in ('admin', 'member')),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(family_id, user_id)
);

create table persons (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  name        text not null,
  role        text not null default '',
  emoji       text not null default '👤',
  bio         text not null default '',
  color       text not null default '#3b82f6',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table interests (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  name        text not null,
  category    text not null default 'hobby' check (category in ('career','fitness','education','hobby','social')),
  emoji       text not null default '⭐',
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table family_values (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  name        text not null,
  emoji       text not null default '💎',
  description text not null default '',
  practice_frequency text not null default 'weekly' check (practice_frequency in ('daily','weekly','monthly')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table life_events (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  title       text not null,
  description text not null default '',
  date        date not null default current_date,
  person_ids  uuid[] not null default '{}',
  emoji       text not null default '📅',
  impact      text not null default 'neutral' check (impact in ('positive','neutral','challenge')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table growth_goals (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  title       text not null,
  description text not null default '',
  person_id   uuid,
  target_date date,
  progress    integer not null default 0 check (progress >= 0 and progress <= 100),
  emoji       text not null default '🎯',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table books (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  title       text not null,
  author      text not null default '',
  total_pages integer not null default 0,
  lines_per_page integer not null default 25,
  emoji       text not null default '📖',
  color       text not null default '#f59e0b',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table reading_logs (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  person_id   uuid not null,
  book_id     uuid not null references books on delete cascade,
  date        date not null default current_date,
  lines_read  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table reading_goals (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  person_id   uuid not null,
  month       text not null,
  target_lines integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table graph_relations (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families on delete cascade,
  source_id     uuid not null,
  target_id     uuid not null,
  source_type   text not null,
  target_type   text not null,
  relation_type text not null,
  label         text not null default '',
  strength      integer not null default 5 check (strength >= 1 and strength <= 10),
  created_at    timestamptz not null default now()
);

create table insights (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families on delete cascade,
  title           text not null,
  content         text not null default '',
  related_node_ids uuid[] not null default '{}',
  emoji           text not null default '💡',
  created_at      timestamptz not null default now()
);

create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families on delete cascade,
  user_id         uuid references auth.users on delete set null,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  related_node_ids uuid[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- ─── 2. Helper Functions ────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function my_family_ids()
returns uuid[] language sql security definer stable as $$
  select coalesce(
    array_agg(family_id),
    '{}'::uuid[]
  )
  from family_members
  where user_id = auth.uid() and status = 'approved';
$$;

create or replace function is_family_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from family_members
    where family_id = fid
      and user_id = auth.uid()
      and status = 'approved'
  );
$$;

create or replace function is_family_admin(fid uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from family_members
    where family_id = fid
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

-- ─── 3. Triggers ─────────────────────────────────────────

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger families_updated_at before update on families for each row execute function update_updated_at();
create trigger family_members_updated_at before update on family_members for each row execute function update_updated_at();
create trigger persons_updated_at before update on persons for each row execute function update_updated_at();
create trigger interests_updated_at before update on interests for each row execute function update_updated_at();
create trigger family_values_updated_at before update on family_values for each row execute function update_updated_at();
create trigger life_events_updated_at before update on life_events for each row execute function update_updated_at();
create trigger growth_goals_updated_at before update on growth_goals for each row execute function update_updated_at();
create trigger books_updated_at before update on books for each row execute function update_updated_at();
create trigger reading_goals_updated_at before update on reading_goals for each row execute function update_updated_at();

-- Auth trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, avatar_emoji)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '👤'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Family creation trigger: auto-add creator as admin
create or replace function handle_family_created()
returns trigger language plpgsql security definer as $$
begin
  insert into family_members (family_id, user_id, role, status)
  values (new.id, new.created_by, 'admin', 'approved');
  return new;
end;
$$;

create trigger on_family_created
  after insert on families
  for each row execute function handle_family_created();

-- ─── 4. RPC Functions ────────────────────────────────────

create or replace function join_family_by_code(code text)
returns json language plpgsql security definer as $$
declare
  fam record;
begin
  select * into fam from families where invite_code = code;
  if fam is null then
    return json_build_object('error', 'Invalid invite code');
  end if;

  if exists(select 1 from family_members where family_id = fam.id and user_id = auth.uid()) then
    return json_build_object('error', 'Already a member of this family');
  end if;

  insert into family_members (family_id, user_id, role, status)
  values (fam.id, auth.uid(), 'member', 'pending');

  return json_build_object('family_id', fam.id, 'family_name', fam.name, 'status', 'pending');
end;
$$;

create or replace function approve_member(member_id uuid)
returns json language plpgsql security definer as $$
declare
  mem record;
begin
  select * into mem from family_members where id = member_id;
  if mem is null then
    return json_build_object('error', 'Member not found');
  end if;

  if not is_family_admin(mem.family_id) then
    return json_build_object('error', 'Only admins can approve members');
  end if;

  update family_members set status = 'approved' where id = member_id;
  return json_build_object('success', true);
end;
$$;

create or replace function reject_member(member_id uuid)
returns json language plpgsql security definer as $$
declare
  mem record;
begin
  select * into mem from family_members where id = member_id;
  if mem is null then
    return json_build_object('error', 'Member not found');
  end if;

  if not is_family_admin(mem.family_id) then
    return json_build_object('error', 'Only admins can reject members');
  end if;

  update family_members set status = 'rejected' where id = member_id;
  return json_build_object('success', true);
end;
$$;

create or replace function regenerate_invite_code(fid uuid)
returns json language plpgsql security definer as $$
declare
  new_code text;
begin
  if not is_family_admin(fid) then
    return json_build_object('error', 'Only admins can regenerate invite codes');
  end if;

  new_code := substr(md5(random()::text || now()::text), 1, 8);
  update families set invite_code = new_code where id = fid;
  return json_build_object('invite_code', new_code);
end;
$$;

-- ─── 5. RLS Policies ────────────────────────────────────

alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table persons enable row level security;
alter table interests enable row level security;
alter table family_values enable row level security;
alter table life_events enable row level security;
alter table growth_goals enable row level security;
alter table books enable row level security;
alter table reading_logs enable row level security;
alter table reading_goals enable row level security;
alter table graph_relations enable row level security;
alter table insights enable row level security;
alter table chat_messages enable row level security;

create policy "Users read own profile" on profiles for select using (id = auth.uid());
create policy "Users update own profile" on profiles for update using (id = auth.uid());

create policy "Members read families" on families for select using (id = any(my_family_ids()));
create policy "Authenticated users create families" on families for insert with check (auth.uid() = created_by);
create policy "Admins update families" on families for update using (is_family_admin(id));

create policy "Members read family members" on family_members for select using (family_id = any(my_family_ids()) or user_id = auth.uid());
create policy "Users request to join" on family_members for insert with check (user_id = auth.uid());
create policy "Admins manage members" on family_members for update using (is_family_admin(family_id));

create policy "Members read persons" on persons for select using (is_family_member(family_id));
create policy "Members insert persons" on persons for insert with check (is_family_member(family_id));
create policy "Members update persons" on persons for update using (is_family_member(family_id));
create policy "Members delete persons" on persons for delete using (is_family_member(family_id));

create policy "Members read interests" on interests for select using (is_family_member(family_id));
create policy "Members insert interests" on interests for insert with check (is_family_member(family_id));
create policy "Members update interests" on interests for update using (is_family_member(family_id));
create policy "Members delete interests" on interests for delete using (is_family_member(family_id));

create policy "Members read family_values" on family_values for select using (is_family_member(family_id));
create policy "Members insert family_values" on family_values for insert with check (is_family_member(family_id));
create policy "Members update family_values" on family_values for update using (is_family_member(family_id));
create policy "Members delete family_values" on family_values for delete using (is_family_member(family_id));

create policy "Members read life_events" on life_events for select using (is_family_member(family_id));
create policy "Members insert life_events" on life_events for insert with check (is_family_member(family_id));
create policy "Members update life_events" on life_events for update using (is_family_member(family_id));
create policy "Members delete life_events" on life_events for delete using (is_family_member(family_id));

create policy "Members read growth_goals" on growth_goals for select using (is_family_member(family_id));
create policy "Members insert growth_goals" on growth_goals for insert with check (is_family_member(family_id));
create policy "Members update growth_goals" on growth_goals for update using (is_family_member(family_id));
create policy "Members delete growth_goals" on growth_goals for delete using (is_family_member(family_id));

create policy "Members read books" on books for select using (is_family_member(family_id));
create policy "Members insert books" on books for insert with check (is_family_member(family_id));
create policy "Members update books" on books for update using (is_family_member(family_id));
create policy "Members delete books" on books for delete using (is_family_member(family_id));

create policy "Members read reading_logs" on reading_logs for select using (is_family_member(family_id));
create policy "Members insert reading_logs" on reading_logs for insert with check (is_family_member(family_id));
create policy "Members delete reading_logs" on reading_logs for delete using (is_family_member(family_id));

create policy "Members read reading_goals" on reading_goals for select using (is_family_member(family_id));
create policy "Members insert reading_goals" on reading_goals for insert with check (is_family_member(family_id));
create policy "Members update reading_goals" on reading_goals for update using (is_family_member(family_id));

create policy "Members read graph_relations" on graph_relations for select using (is_family_member(family_id));
create policy "Members insert graph_relations" on graph_relations for insert with check (is_family_member(family_id));
create policy "Members update graph_relations" on graph_relations for update using (is_family_member(family_id));
create policy "Members delete graph_relations" on graph_relations for delete using (is_family_member(family_id));

create policy "Members read insights" on insights for select using (is_family_member(family_id));
create policy "Members insert insights" on insights for insert with check (is_family_member(family_id));

create policy "Members read chat_messages" on chat_messages for select using (is_family_member(family_id));
create policy "Members insert chat_messages" on chat_messages for insert with check (is_family_member(family_id));

-- ─── 6. Enable Realtime ─────────────────────────────────

alter publication supabase_realtime add table persons;
alter publication supabase_realtime add table interests;
alter publication supabase_realtime add table family_values;
alter publication supabase_realtime add table life_events;
alter publication supabase_realtime add table growth_goals;
alter publication supabase_realtime add table books;
alter publication supabase_realtime add table reading_logs;
alter publication supabase_realtime add table reading_goals;
alter publication supabase_realtime add table graph_relations;
alter publication supabase_realtime add table insights;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table family_members;

-- ═══════════════════════════════════════════════════════════
-- 002_ai_usage.sql — AI Rate Limiting
-- ═══════════════════════════════════════════════════════════

create table ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  family_id  uuid not null references families on delete cascade,
  feature    text not null check (feature in ('chat', 'extract', 'writing')),
  used_at    timestamptz not null default now()
);

create index ai_usage_user_day_idx on ai_usage (user_id, used_at);

alter table ai_usage enable row level security;

create policy "ai_usage_select_own" on ai_usage
  for select using (auth.uid() = user_id);

create policy "ai_usage_insert_own" on ai_usage
  for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 003_writing_race.sql — Writing System + Person Goals
-- ═══════════════════════════════════════════════════════════

ALTER TABLE books ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed_date date;

ALTER TABLE persons ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_lines integer DEFAULT 50000;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_writing_count integer DEFAULT 24;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS goal_writing_avg integer DEFAULT 70;

CREATE TABLE writing_entries (
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

CREATE TABLE writing_goals (
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

CREATE TRIGGER writing_entries_updated_at
  BEFORE UPDATE ON writing_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER writing_goals_updated_at
  BEFORE UPDATE ON writing_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE writing_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE writing_goals;

-- ═══════════════════════════════════════════════════════════
-- 004_reading_platform.sql — Reviews & Recommendations
-- ═══════════════════════════════════════════════════════════

create table book_reviews (
  id          text primary key,
  family_id   uuid not null references families on delete cascade,
  person_id   text not null,
  book_id     text not null,
  rating      int not null check (rating >= 1 and rating <= 5),
  content     text not null default '',
  likes       text[] not null default '{}',
  created_at  text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updated_at  timestamptz not null default now()
);

create index book_reviews_family_idx on book_reviews(family_id);

create table book_recommendations (
  id          text primary key,
  family_id   uuid not null references families on delete cascade,
  person_id   text not null,
  book_title  text not null,
  author      text not null default '',
  reason      text not null default '',
  emoji       text not null default '📖',
  likes       text[] not null default '{}',
  created_at  text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updated_at  timestamptz not null default now()
);

create index book_recommendations_family_idx on book_recommendations(family_id);

alter table book_reviews enable row level security;
alter table book_recommendations enable row level security;

-- Cross-family SELECT (all authenticated users can read)
CREATE POLICY "book_reviews_select_all" ON book_reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

create policy "book_reviews_insert" on book_reviews
  for insert with check (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

create policy "book_reviews_update" on book_reviews
  for update using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

create policy "book_reviews_delete" on book_reviews
  for delete using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

CREATE POLICY "book_recommendations_select_all" ON book_recommendations
  FOR SELECT USING (auth.uid() IS NOT NULL);

create policy "book_recommendations_insert" on book_recommendations
  for insert with check (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

create policy "book_recommendations_update" on book_recommendations
  for update using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

create policy "book_recommendations_delete" on book_recommendations
  for delete using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

alter publication supabase_realtime add table book_reviews;
alter publication supabase_realtime add table book_recommendations;

-- Monthly Family Rankings RPC
create or replace function get_monthly_family_rankings(target_month text)
returns table (
  family_id uuid,
  family_name text,
  family_emoji text,
  total_lines bigint,
  member_count bigint,
  avg_lines_per_member numeric
)
language sql
security definer
as $$
  select
    f.id as family_id,
    f.name as family_name,
    f.emoji as family_emoji,
    coalesce(sum(rl.lines_read), 0)::bigint as total_lines,
    count(distinct p.id)::bigint as member_count,
    case
      when count(distinct p.id) = 0 then 0
      else round(coalesce(sum(rl.lines_read), 0)::numeric / count(distinct p.id), 1)
    end as avg_lines_per_member
  from families f
  join persons p on p.family_id = f.id
  left join reading_logs rl
    on rl.person_id = p.id
    and rl.date::text like target_month || '%'
  group by f.id, f.name, f.emoji
  order by total_lines desc;
$$;

-- ═══════════════════════════════════════════════════════════
-- 005_community.sql — Cross-family Features
-- ═══════════════════════════════════════════════════════════

-- Community reviews RPC
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

-- Book readers RPC
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

-- ═══════════════════════════════════════════════════════════
-- 006_person_book_progress.sql — Per-person Book Progress
-- ═══════════════════════════════════════════════════════════

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

ALTER PUBLICATION supabase_realtime ADD TABLE person_book_progress;

-- ═══════════════════════════════════════════════════════════
-- 007_unified_board.sql — Comments + Likes + Stats
-- ═══════════════════════════════════════════════════════════

-- Post comments table
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

CREATE POLICY "comments_select_all" ON post_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_insert" ON post_comments
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "comments_delete" ON post_comments
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'approved')
  );

-- RPC: Community feed (reviews + recommendations unified)
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

-- RPC: Get comments for a post
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

-- RPC: Book reader stats
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

-- RPC: Toggle like (cross-family)
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

-- ═══════════════════════════════════════════════════════════
-- DONE — All 7 migrations applied as fresh setup
-- ═══════════════════════════════════════════════════════════
