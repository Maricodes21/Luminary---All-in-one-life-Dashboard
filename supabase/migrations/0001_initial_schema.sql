-- Luminary — initial schema (Phase 0).
--
-- ──────────────────────────────────────────────────────────────────────────
-- INVARIANT: every user-scoped table in the `public` schema MUST have RLS
-- enabled and at least one policy. The audit DO block at the bottom of this
-- file fails the migration if any table is missing RLS.
-- ──────────────────────────────────────────────────────────────────────────
--
-- Notes on design choices:
-- * mood_events (NOT mood_entries) — moods are stored as continuous timestamped
--   events with a source enum (manual / spotify / journal_inferred). A daily
--   "headline mood" is derived in the app, not stored. Per the 2026-05-01
--   decision: mood is a continuous signal, not a daily snapshot.
-- * The mood_label enum is intentionally rich (15 labels). The Spotify mapping
--   uses a subset based on audio features; the broader set lets users
--   self-report with more nuance.
-- * Optional life modules are gated client-side via profiles.unlocked_modules.
--   The schema is present from day 1; rows just don't get created until unlock.

create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- Mood vocabulary
-- ────────────────────────────────────────────────────────────────────────────
-- Organized by energy band:
--   High energy:    energized · joyful · restless · anxious · wired
--   Moderate:       reflective · hopeful · focused · curious · cloudy
--   Low energy:     peaceful · grounded · tender · melancholic · drained
--
-- New labels can be added later with: ALTER TYPE mood_label ADD VALUE 'name';
-- Existing values cannot be removed in Postgres — choose carefully.

create type mood_label as enum (
  -- High energy
  'energized',     -- bright, ready, lit up
  'joyful',        -- light, celebratory
  'restless',      -- agitated, scattered
  'anxious',       -- worried, vibrating
  'wired',         -- over-stimulated, alert
  -- Moderate energy
  'reflective',    -- thinking, internal
  'hopeful',       -- forward-looking
  'focused',       -- concentrated, clear
  'curious',       -- seeking, open
  'cloudy',        -- foggy, unclear
  -- Low energy
  'peaceful',      -- settled, calm
  'grounded',      -- stable, present
  'tender',        -- soft, open, vulnerable
  'melancholic',   -- quietly sad
  'drained'        -- depleted, tired
);

create type mood_source as enum ('manual', 'spotify', 'journal_inferred');

-- ────────────────────────────────────────────────────────────────────────────
-- Profiles
-- ────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  pronouns text,
  weight_kg numeric,
  height_cm numeric,
  workout_preference text check (workout_preference in ('gym', 'home')),
  tone_profile text check (tone_profile in ('coach_hard', 'gentle_nudges', 'just_data')) default 'gentle_nudges',
  goals text[] default '{}',
  unlocked_modules text[] default array['home', 'journal', 'habits']::text[],
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (user_id = auth.uid());
create policy "profiles are self-writable" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles are self-updatable" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Habits + completions (soft-streak model)
-- ────────────────────────────────────────────────────────────────────────────

create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text,
  color text,
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index habits_user_idx on public.habits(user_id, archived_at);

alter table public.habits enable row level security;
create policy "habits are self-scoped" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.habit_completions (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references public.habits on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  completed_on date not null default current_date,
  completed_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);
create index habit_completions_user_date_idx on public.habit_completions(user_id, completed_on desc);

alter table public.habit_completions enable row level security;
create policy "habit_completions are self-scoped" on public.habit_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Mood — continuous, timestamped, sourced.
-- ────────────────────────────────────────────────────────────────────────────

create table public.mood_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  occurred_at timestamptz not null default now(),
  label mood_label not null,
  source mood_source not null,
  confidence numeric(3, 2) not null default 1.0,
  -- Optional audio features for spotify-source events. JSON for flexibility.
  features jsonb,
  notes text
);
create index mood_events_user_time_idx on public.mood_events(user_id, occurred_at desc);

alter table public.mood_events enable row level security;
create policy "mood_events are self-scoped" on public.mood_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Spotify snapshots — daily aggregates for the recap card.
-- ────────────────────────────────────────────────────────────────────────────

create table public.spotify_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_date date not null,
  tracks_count int not null default 0,
  minutes_listened numeric not null default 0,
  top_artists jsonb not null default '[]'::jsonb,
  avg_valence numeric,
  avg_energy numeric,
  avg_tempo numeric,
  estimated_mood mood_label,
  estimated_confidence numeric(3, 2),
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);
create index spotify_snapshots_user_idx on public.spotify_snapshots(user_id, snapshot_date desc);

alter table public.spotify_snapshots enable row level security;
create policy "spotify_snapshots are self-scoped" on public.spotify_snapshots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Journal entries
-- ────────────────────────────────────────────────────────────────────────────

create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  written_at timestamptz not null default now(),
  title text,
  body text not null default '',
  tags text[] not null default '{}',
  mood_event_id uuid references public.mood_events on delete set null,
  voice_note_url text
);
create index journal_entries_user_time_idx on public.journal_entries(user_id, written_at desc);

alter table public.journal_entries enable row level security;
create policy "journal_entries are self-scoped" on public.journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- updated_at trigger helper.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS AUDIT — fails the migration if any public table is missing RLS.
-- This is a safety net: if a future migration adds a user-scoped table and the
-- author forgets `enable row level security`, the schema reset will refuse to
-- complete. Keep this block at the bottom of every schema-changing migration.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare
  unprotected_tables text;
  policyless_tables text;
begin
  -- Tables in public schema without RLS enabled.
  select string_agg(quote_ident(c.relname), ', ')
  into unprotected_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if unprotected_tables is not null then
    raise exception 'RLS audit failed: tables without RLS enabled: %', unprotected_tables;
  end if;

  -- Tables with RLS but zero policies — also a footgun (default-deny would lock
  -- everyone out, but we want explicit policies so authorship is intentional).
  select string_agg(quote_ident(c.relname), ', ')
  into policyless_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and not exists (
      select 1 from pg_policy p where p.polrelid = c.oid
    );

  if policyless_tables is not null then
    raise exception 'RLS audit failed: tables with RLS but no policies: %', policyless_tables;
  end if;

  raise notice 'RLS audit passed.';
end$$;
