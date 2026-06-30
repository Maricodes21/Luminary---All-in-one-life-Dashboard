-- Luminary production-module scaffold.
--
-- Adds canonical backend shapes for local-first module state:
-- meal plans, workout plans, health metrics, notification expense prompts,
-- imports, integration consent, and richer money fields.

alter table public.journal_entries
  add column if not exists deleted_at timestamptz;

alter table public.budget_transactions
  add column if not exists merchant text,
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'notification', 'import', 'bank_link')),
  add column if not exists prompt_id uuid;

alter table public.health_workouts
  drop constraint if exists health_workouts_workout_type_check;

update public.health_workouts
set workout_type = 'calisthenics'
where workout_type = 'home';

alter table public.health_workouts
  add constraint health_workouts_workout_type_check
  check (workout_type in ('calisthenics', 'cardio', 'cycling', 'gym'));

create table if not exists public.health_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  metric_date date not null default current_date,
  source text not null default 'manual'
    check (source in ('manual', 'health_connect', 'google_fit', 'samsung_health')),
  steps int,
  heart_rate_bpm int,
  sleep_minutes int,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, metric_date, source)
);
create index if not exists health_metrics_user_idx on public.health_metrics(user_id, metric_date desc);
alter table public.health_metrics enable row level security;
drop policy if exists "health_metrics are self-scoped" on public.health_metrics;
create policy "health_metrics are self-scoped" on public.health_metrics
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_of date not null default current_date,
  category text not null check (category in ('calisthenics', 'cardio', 'cycling', 'gym')),
  level text not null check (level in ('beginner', 'steady', 'advanced')),
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workout_plans_user_idx on public.workout_plans(user_id, week_of desc);
alter table public.workout_plans enable row level security;
drop policy if exists "workout_plans are self-scoped" on public.workout_plans;
create policy "workout_plans are self-scoped" on public.workout_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_of date not null default current_date,
  calorie_target int not null,
  protein_target_g int not null,
  carbs_target_g int not null,
  fat_target_g int not null,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists meal_plans_user_idx on public.meal_plans(user_id, week_of desc);
alter table public.meal_plans enable row level security;
drop policy if exists "meal_plans are self-scoped" on public.meal_plans;
create policy "meal_plans are self-scoped" on public.meal_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.expense_notification_prompts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  merchant text,
  amount numeric,
  source_app text not null,
  received_at timestamptz not null default now(),
  raw_text_preview text not null,
  confidence numeric(3, 2) not null default 0.5,
  status text not null default 'pending' check (status in ('pending', 'logged', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists expense_prompts_user_idx on public.expense_notification_prompts(user_id, received_at desc);
alter table public.expense_notification_prompts enable row level security;
drop policy if exists "expense_notification_prompts are self-scoped" on public.expense_notification_prompts;
create policy "expense_notification_prompts are self-scoped" on public.expense_notification_prompts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.transaction_imports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  source text not null check (source in ('csv', 'bank_link')),
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  row_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.transaction_imports enable row level security;
drop policy if exists "transaction_imports are self-scoped" on public.transaction_imports;
create policy "transaction_imports are self-scoped" on public.transaction_imports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.integration_consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  integration text not null check (integration in ('spotify', 'health_connect', 'bank_notifications', 'bank_link')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  scope text[] not null default '{}',
  consent_copy_version text not null default 'v1',
  unique (user_id, integration)
);
alter table public.integration_consents enable row level security;
drop policy if exists "integration_consents are self-scoped" on public.integration_consents;
create policy "integration_consents are self-scoped" on public.integration_consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.health_workouts to authenticated;
grant select, insert, update, delete on table public.health_metrics to authenticated;
grant select, insert, update, delete on table public.workout_plans to authenticated;
grant select, insert, update, delete on table public.meal_plans to authenticated;
grant select, insert, update, delete on table public.expense_notification_prompts to authenticated;
grant select, insert, update, delete on table public.transaction_imports to authenticated;
grant select, insert, update, delete on table public.integration_consents to authenticated;
