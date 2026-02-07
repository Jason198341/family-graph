-- ============================================================
-- Family Graph — Supabase Schema Migration
-- ============================================================
-- 순서: 테이블 → 함수 → 트리거 → RLS → Realtime

-- ─── 1. Tables ───────────────────────────────────────────

-- profiles: extends auth.users
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text not null default '',
  avatar_emoji text not null default '👤',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- families: a family group
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

-- family_members: join table between families and users
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

-- persons (family members as graph entities)
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

-- interests
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

-- family_values (avoids reserved word "values")
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

-- life_events
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

-- growth_goals
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

-- books
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

-- reading_logs
create table reading_logs (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  person_id   uuid not null,
  book_id     uuid not null references books on delete cascade,
  date        date not null default current_date,
  lines_read  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- reading_goals
create table reading_goals (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families on delete cascade,
  person_id   uuid not null,
  month       text not null, -- 'YYYY-MM'
  target_lines integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- graph_relations (edges)
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

-- insights
create table insights (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families on delete cascade,
  title           text not null,
  content         text not null default '',
  related_node_ids uuid[] not null default '{}',
  emoji           text not null default '💡',
  created_at      timestamptz not null default now()
);

-- chat_messages
create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families on delete cascade,
  user_id         uuid references auth.users on delete set null,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  related_node_ids uuid[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- ─── 2. Helper Functions (테이블 생성 후) ────────────────

-- updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 현재 유저의 승인된 가족 ID 목록
create or replace function my_family_ids()
returns uuid[] language sql security definer stable as $$
  select coalesce(
    array_agg(family_id),
    '{}'::uuid[]
  )
  from family_members
  where user_id = auth.uid() and status = 'approved';
$$;

-- 승인된 구성원 여부
create or replace function is_family_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from family_members
    where family_id = fid
      and user_id = auth.uid()
      and status = 'approved'
  );
$$;

-- admin 여부
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

-- updated_at triggers
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

-- Auth trigger: 새 유저 가입 시 profiles 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, display_name, avatar_emoji)
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

-- Family creation trigger: 생성자를 admin+approved로 자동 추가
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

-- 초대 코드로 가족 가입 요청
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

-- admin이 멤버 승인
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

-- admin이 멤버 거절
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

-- 초대 코드 재생성
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

-- profiles
create policy "Users read own profile" on profiles for select using (id = auth.uid());
create policy "Users update own profile" on profiles for update using (id = auth.uid());

-- families
create policy "Members read families" on families for select using (id = any(my_family_ids()));
create policy "Authenticated users create families" on families for insert with check (auth.uid() = created_by);
create policy "Admins update families" on families for update using (is_family_admin(id));

-- family_members
create policy "Members read family members" on family_members for select using (family_id = any(my_family_ids()) or user_id = auth.uid());
create policy "Users request to join" on family_members for insert with check (user_id = auth.uid());
create policy "Admins manage members" on family_members for update using (is_family_admin(family_id));

-- persons
create policy "Members read persons" on persons for select using (is_family_member(family_id));
create policy "Members insert persons" on persons for insert with check (is_family_member(family_id));
create policy "Members update persons" on persons for update using (is_family_member(family_id));
create policy "Members delete persons" on persons for delete using (is_family_member(family_id));

-- interests
create policy "Members read interests" on interests for select using (is_family_member(family_id));
create policy "Members insert interests" on interests for insert with check (is_family_member(family_id));
create policy "Members update interests" on interests for update using (is_family_member(family_id));
create policy "Members delete interests" on interests for delete using (is_family_member(family_id));

-- family_values
create policy "Members read family_values" on family_values for select using (is_family_member(family_id));
create policy "Members insert family_values" on family_values for insert with check (is_family_member(family_id));
create policy "Members update family_values" on family_values for update using (is_family_member(family_id));
create policy "Members delete family_values" on family_values for delete using (is_family_member(family_id));

-- life_events
create policy "Members read life_events" on life_events for select using (is_family_member(family_id));
create policy "Members insert life_events" on life_events for insert with check (is_family_member(family_id));
create policy "Members update life_events" on life_events for update using (is_family_member(family_id));
create policy "Members delete life_events" on life_events for delete using (is_family_member(family_id));

-- growth_goals
create policy "Members read growth_goals" on growth_goals for select using (is_family_member(family_id));
create policy "Members insert growth_goals" on growth_goals for insert with check (is_family_member(family_id));
create policy "Members update growth_goals" on growth_goals for update using (is_family_member(family_id));
create policy "Members delete growth_goals" on growth_goals for delete using (is_family_member(family_id));

-- books
create policy "Members read books" on books for select using (is_family_member(family_id));
create policy "Members insert books" on books for insert with check (is_family_member(family_id));
create policy "Members update books" on books for update using (is_family_member(family_id));
create policy "Members delete books" on books for delete using (is_family_member(family_id));

-- reading_logs
create policy "Members read reading_logs" on reading_logs for select using (is_family_member(family_id));
create policy "Members insert reading_logs" on reading_logs for insert with check (is_family_member(family_id));
create policy "Members delete reading_logs" on reading_logs for delete using (is_family_member(family_id));

-- reading_goals
create policy "Members read reading_goals" on reading_goals for select using (is_family_member(family_id));
create policy "Members insert reading_goals" on reading_goals for insert with check (is_family_member(family_id));
create policy "Members update reading_goals" on reading_goals for update using (is_family_member(family_id));

-- graph_relations
create policy "Members read graph_relations" on graph_relations for select using (is_family_member(family_id));
create policy "Members insert graph_relations" on graph_relations for insert with check (is_family_member(family_id));
create policy "Members update graph_relations" on graph_relations for update using (is_family_member(family_id));
create policy "Members delete graph_relations" on graph_relations for delete using (is_family_member(family_id));

-- insights
create policy "Members read insights" on insights for select using (is_family_member(family_id));
create policy "Members insert insights" on insights for insert with check (is_family_member(family_id));

-- chat_messages
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
