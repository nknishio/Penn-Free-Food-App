-- Penn Free Food — Supabase schema.
-- Mirrors src/types/index.ts. Run in the Supabase SQL editor, then set
-- EXPO_PUBLIC_DATA_SOURCE=supabase (see .env.example).
--
-- ⚠️ DEMO POLICIES: the app uses a fake login, so row-level security below
-- allows the anon key to read/write everything. Replace with auth.uid()-based
-- policies once real Penn email sign-in exists.

create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  name text not null,
  role text not null check (role in ('student', 'business')),
  verified boolean not null default false,
  dietary_prefs text[] not null default '{}',
  notification_prefs jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  food text not null,
  category text not null check (category in ('cultural', 'club', 'social', 'academic', 'career', 'other')),
  required_actions jsonb not null default '[]',
  location_name text not null,
  location_detail text,
  latitude double precision not null,
  longitude double precision not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  dietary_tags text[] not null default '{}',
  images text[] not null default '{}',
  source text not null check (source in ('groupme', 'email', 'user')),
  org text,
  author_id text references users (id) on delete set null,
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_at_idx on events (starts_at desc);

create table if not exists votes (
  event_id uuid not null references events (id) on delete cascade,
  user_id text not null,
  value smallint not null check (value in (-1, 1)),
  nearby boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists reports (
  event_id uuid not null references events (id) on delete cascade,
  user_id text not null,
  kind text not null check (kind in ('real', 'fake', 'over')),
  nearby boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id, kind)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  anonymous boolean not null default false,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_event_idx on comments (event_id, created_at);

create table if not exists saves (
  event_id uuid not null references events (id) on delete cascade,
  user_id text not null,
  primary key (event_id, user_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- New events are pushed to clients (Repository.subscribeToNewEvents).
alter publication supabase_realtime add table events;

-- Demo-only RLS: anon can do everything. See warning at the top.
do $$
declare t text;
begin
  foreach t in array array['users', 'events', 'votes', 'reports', 'comments', 'saves', 'notifications'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists demo_all on %I', t);
    execute format('create policy demo_all on %I for all to anon using (true) with check (true)', t);
  end loop;
end $$;
