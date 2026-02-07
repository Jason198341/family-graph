-- ============================================================
-- AI Usage Tracking — 하루 3회 무료 제한
-- ============================================================

create table ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  family_id  uuid not null references families on delete cascade,
  feature    text not null check (feature in ('chat', 'extract')),
  used_at    timestamptz not null default now()
);

create index ai_usage_user_day_idx on ai_usage (user_id, used_at);

-- RLS
alter table ai_usage enable row level security;

-- 본인 기록만 읽기
create policy "ai_usage_select_own" on ai_usage
  for select using (auth.uid() = user_id);

-- 본인 기록만 쓰기
create policy "ai_usage_insert_own" on ai_usage
  for insert with check (auth.uid() = user_id);

-- Realtime 불필요 (개인 카운터)
