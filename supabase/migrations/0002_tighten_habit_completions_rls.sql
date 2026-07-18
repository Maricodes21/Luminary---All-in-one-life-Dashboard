-- Luminary — tighten habit_completions RLS (Phase 1 pre-work).
--
-- The original "FOR ALL" policy on habit_completions gated only on
-- user_id = auth.uid(). This means a write could reference a habit_id
-- belonging to another user if the caller somehow knew the UUID.
-- In practice the habits RLS prevents discovery, but defense-in-depth
-- requires the write policy to also verify ownership of the referenced habit.
--
-- Fix: split into per-operation policies so INSERT + UPDATE carry an explicit
-- EXISTS subquery confirming habit_id ∈ current user's habits.

-- ── Drop the old catch-all policy ──────────────────────────────────────────
drop policy if exists "habit_completions are self-scoped" on public.habit_completions;

-- ── SELECT — read your own completions ────────────────────────────────────
create policy "habit_completions: select own" on public.habit_completions
  for select
  using (user_id = auth.uid());

-- ── INSERT — only write completions for habits you own ────────────────────
create policy "habit_completions: insert own" on public.habit_completions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.habits h
      where h.id = habit_id
        and h.user_id = auth.uid()
    )
  );

-- ── UPDATE — same ownership check on both sides of the row ────────────────
create policy "habit_completions: update own" on public.habit_completions
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.habits h
      where h.id = habit_id
        and h.user_id = auth.uid()
    )
  );

-- ── DELETE — only delete your own completions ─────────────────────────────
create policy "habit_completions: delete own" on public.habit_completions
  for delete
  using (user_id = auth.uid());

-- ── RLS AUDIT — keep in every schema-changing migration ───────────────────
do $$
declare
  unprotected_tables text;
  policyless_tables  text;
begin
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
