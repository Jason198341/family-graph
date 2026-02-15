-- ============================================================
-- Family Reading Race Platform — Reviews & Recommendations + Leaderboard
-- ============================================================

-- ─── 1. Tables ───────────────────────────────────────────

-- book_reviews: 독서 후기
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

-- book_recommendations: 책 추천
create table book_recommendations (
  id          text primary key,
  family_id   uuid not null references families on delete cascade,
  person_id   text not null,
  book_title  text not null,
  author      text not null default '',
  reason      text not null default '',
  emoji       text not null default '📖',
  created_at  text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updated_at  timestamptz not null default now()
);

create index book_recommendations_family_idx on book_recommendations(family_id);

-- ─── 2. RLS ─────────────────────────────────────────────

alter table book_reviews enable row level security;
alter table book_recommendations enable row level security;

-- book_reviews policies
create policy "book_reviews_select" on book_reviews
  for select using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

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

-- book_recommendations policies
create policy "book_recommendations_select" on book_recommendations
  for select using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and status = 'approved'
    )
  );

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

-- ─── 3. Realtime ────────────────────────────────────────

alter publication supabase_realtime add table book_reviews;
alter publication supabase_realtime add table book_recommendations;

-- ─── 4. Monthly Family Rankings RPC ─────────────────────

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
