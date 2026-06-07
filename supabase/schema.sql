-- WC 2026 Companion — prediction league schema.
-- Run once in the Supabase SQL editor for your project.
--
-- Model: public, no-auth leagues. The shareable code IS the league id.
-- Each member owns one row and only ever writes its own `picks` column.

create table if not exists leagues (
  code        text primary key,            -- shareable 6-char code, e.g. "WC2ABC"
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  league_code   text not null references leagues(code) on delete cascade,
  display_name  text not null,
  picks         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (league_code, display_name)        -- duplicate-name rejection (P0.2)
);

create index if not exists members_league_code_idx on members(league_code);

-- ---------------------------------------------------------------------------
-- Row Level Security: open anon read/insert, no delete. The "no auth" model.
-- Use the anon key in the browser ONLY. Never ship the service-role key.
-- ---------------------------------------------------------------------------
alter table leagues enable row level security;
alter table members enable row level security;

drop policy if exists leagues_read   on leagues;
drop policy if exists leagues_insert on leagues;
create policy leagues_read   on leagues for select using (true);
create policy leagues_insert on leagues for insert with check (true);

drop policy if exists members_read   on members;
drop policy if exists members_insert on members;
drop policy if exists members_update on members;
create policy members_read   on members for select using (true);
create policy members_insert on members for insert with check (true);
create policy members_update on members for update using (true) with check (true);
-- No delete policy on either table → anon cannot delete.

-- Column-level UPDATE: anon may only ever write `picks`. Blocks the
-- higher-impact tampering paths — moving a member to another league
-- (league_code), renaming someone (display_name), or rewriting created_at
-- (the leaderboard tiebreaker) — while keeping the no-auth model.
revoke update on members from anon;
grant  update (picks) on members to anon;
