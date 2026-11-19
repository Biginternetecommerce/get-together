-- Run in Supabase SQL editor. All access goes through server routes using the service-role key.
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  attending boolean not null,
  guests int not null default 1 check (guests between 0 and 10),
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);
create table if not exists guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 400),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
-- RLS on with NO public policies: the anon key can read/write nothing. Privacy by default.
alter table rsvps enable row level security;
alter table guestbook enable row level security;

-- RSVP contact + guest names (run once on an existing project)
alter table rsvps add column if not exists phone text check (char_length(phone) <= 20);
alter table rsvps add column if not exists guest_names text[] not null default '{}';
