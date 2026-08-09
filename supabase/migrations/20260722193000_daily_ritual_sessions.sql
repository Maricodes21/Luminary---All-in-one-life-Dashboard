create table if not exists public.daily_ritual_sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_date date not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  current_stage text not null default 'entry' check (current_stage in ('entry', 'music', 'mood', 'journal', 'habits', 'context', 'tomorrow', 'summary')),
  started_at timestamptz,
  completed_at timestamptz,
  mood text,
  mood_skipped boolean not null default false,
  journal_added boolean not null default false,
  selected_signal_ids text[] not null default '{}',
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_date)
);

alter table public.daily_ritual_sessions enable row level security;

drop trigger if exists daily_ritual_sessions_touch_updated_at on public.daily_ritual_sessions;
create trigger daily_ritual_sessions_touch_updated_at
  before update on public.daily_ritual_sessions
  for each row execute function public.touch_updated_at();

create policy "Users manage their own ritual sessions"
  on public.daily_ritual_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.daily_ritual_sessions to authenticated;
