-- Migration 0003 — habit_pauses
--
-- Soft-pause for individual habits on specific dates.
-- Written during the ritual "Tomorrow" section so users can deactivate
-- a habit for the next day without archiving it. Habits not paused carry
-- forward silently.
--
-- Decision 2026-05-18: Phase 2 scope addition — pause_date + habit_id
-- uniqueness prevents duplicate pauses per day.

create table public.habit_pauses (
  id           uuid primary key default uuid_generate_v4(),
  habit_id     uuid not null references public.habits on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  pause_date   date not null,
  created_at   timestamptz not null default now(),
  unique (habit_id, pause_date)
);

create index habit_pauses_user_date_idx on public.habit_pauses(user_id, pause_date);

alter table public.habit_pauses enable row level security;

create policy "habit_pauses are self-scoped" on public.habit_pauses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── RLS audit ────────────────────────────────────────────────────────────────
do $$
declare
  unprotected_tables text;
  policyless_tables  text;
begin
  select string_agg(quote_ident(c.relname), ', ')
  into unprotected_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  if unprotected_tables is not null then
    raise exception 'RLS audit failed — tables without RLS: %', unprotected_tables;
  end if;

  select string_agg(quote_ident(c.relname), ', ')
  into policyless_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

  if policyless_tables is not null then
    raise exception 'RLS audit failed — RLS enabled but no policies: %', policyless_tables;
  end if;

  raise notice 'RLS audit passed.';
end$$;
