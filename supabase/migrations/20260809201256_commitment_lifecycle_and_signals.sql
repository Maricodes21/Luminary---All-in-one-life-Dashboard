-- Effective-dated commitments preserve completion history while allowing
-- future schedules to end or be substituted without destructive deletes.
alter table public.habits
  add column if not exists active_from date not null default current_date,
  add column if not exists active_until date;

alter table public.habits
  drop constraint if exists habits_active_window_check;
alter table public.habits
  add constraint habits_active_window_check
  check (active_until is null or active_until >= active_from);

create index if not exists habits_user_active_window_idx
  on public.habits (user_id, active_from, active_until);

alter table public.habit_pauses
  add column if not exists reason text not null default 'intentional_rest'
  check (reason in ('intentional_rest', 'schedule_exception'));

-- Selected daily signals are auditable snapshots. The client can work fully
-- offline, then upsert the same rows when connectivity returns.
create table if not exists public.daily_signals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  local_date date not null,
  signal_key text not null,
  source text not null,
  family text not null,
  evidence jsonb not null default '[]'::jsonb,
  content jsonb not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  priority smallint not null default 0,
  expires_at timestamptz not null,
  status text not null default 'selected' check (status in ('selected', 'shown', 'dismissed', 'actioned', 'resolved', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date, signal_key),
  unique (id, user_id)
);

create index if not exists daily_signals_user_date_idx
  on public.daily_signals (user_id, local_date, status);

alter table public.daily_signals enable row level security;
create policy "daily signals are self-scoped" on public.daily_signals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.signal_feedback (
  id uuid primary key default uuid_generate_v4(),
  signal_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  response text not null check (response in ('dismissed', 'not_accurate', 'helpful', 'actioned')),
  created_at timestamptz not null default now(),
  foreign key (signal_id, user_id) references public.daily_signals (id, user_id) on delete cascade
);

create index if not exists signal_feedback_user_created_idx
  on public.signal_feedback (user_id, created_at desc);

alter table public.signal_feedback enable row level security;
create policy "signal feedback is self-scoped" on public.signal_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.daily_signals, public.signal_feedback from anon;
grant select, insert, update, delete on table public.daily_signals, public.signal_feedback to authenticated;
