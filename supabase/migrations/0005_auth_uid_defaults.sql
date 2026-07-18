-- Migration 0005 — auth.uid() column defaults
--
-- All user-scoped tables use user_id NOT NULL but no DEFAULT, which means
-- the client must explicitly pass user_id on every insert. Client code omits
-- it (auth state is in the JWT, not the payload). Adding DEFAULT auth.uid()
-- lets Postgres fill it automatically from the authenticated session so client
-- writes never need to carry it — and offline-queue replays work too.
--
-- Tables covered: habit_completions, habit_pauses, mood_events,
--                 spotify_snapshots, journal_entries
-- Tables excluded: habits (user_id passed explicitly during habit creation),
--                  profiles (user_id is the PK, always explicit)

alter table public.habit_completions alter column user_id set default auth.uid();
alter table public.habit_pauses       alter column user_id set default auth.uid();
alter table public.mood_events        alter column user_id set default auth.uid();
alter table public.spotify_snapshots  alter column user_id set default auth.uid();
alter table public.journal_entries    alter column user_id set default auth.uid();

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
