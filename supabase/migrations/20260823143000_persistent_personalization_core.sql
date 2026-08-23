-- Additive first slice for Luminary's persistent user model.
-- Existing profile and module reads remain compatible while mobile surfaces adopt these records.

alter table public.profiles
  add column if not exists timezone text,
  add column if not exists locale text,
  add column if not exists onboarding_version integer not null default 1 check (onboarding_version > 0),
  add column if not exists personalization_enabled boolean not null default true,
  add column if not exists cross_module_personalization boolean not null default false,
  add column if not exists coach_consent_at timestamptz,
  add column if not exists context_revision bigint not null default 0 check (context_revision >= 0);

create table if not exists public.life_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  weekday_commitment_minutes integer check (weekday_commitment_minutes between 0 and 1440),
  weekend_commitment_minutes integer check (weekend_commitment_minutes between 0 and 1440),
  wake_time time,
  sleep_time time,
  preferred_checkin_time time,
  busy_days smallint[] not null default '{}',
  notes text,
  profile_version integer not null default 1 check (profile_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (busy_days <@ array[0,1,2,3,4,5,6]::smallint[])
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  domain text not null check (domain in ('wellbeing','habits','health','nutrition','money','journal')),
  goal_code text not null,
  label text not null,
  priority smallint not null default 3 check (priority between 1 and 5),
  target jsonb,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  source_type text not null default 'settings',
  source_id uuid,
  effective_from date not null default current_date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_date is null or target_date >= effective_from)
);

create table if not exists public.user_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('work','study','commute','care','sleep','training','meal','unavailable')),
  label text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  timezone text not null,
  recurrence_rule text,
  effective_from date not null default current_date,
  effective_until date,
  source_type text not null default 'settings',
  status text not null default 'active' check (status in ('active','paused','expired','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_until is null or effective_until >= effective_from)
);

create table if not exists public.user_context_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  domain text not null,
  fact_key text not null,
  value jsonb not null,
  source_type text not null,
  source_id uuid,
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  confirmation_state text not null default 'proposed' check (confirmation_state in ('proposed','confirmed','rejected')),
  sensitivity text not null default 'standard' check (sensitivity in ('standard','private','health')),
  status text not null default 'active' check (status in ('active','paused','expired','deleted')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  supersedes_fact_id uuid references public.user_context_facts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  local_date date not null,
  timezone text not null,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  energy smallint check (energy between 1 and 5),
  stress smallint check (stress between 1 and 5),
  soreness jsonb,
  available_minutes integer check (available_minutes between 0 and 1440),
  user_note text,
  source text not null default 'ritual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create table if not exists public.personalization_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null check (revision >= 0),
  schema_version integer not null default 1 check (schema_version > 0),
  effective_at timestamptz not null,
  context jsonb not null,
  source_record_ids jsonb not null default '[]'::jsonb,
  hash text not null,
  created_by text not null default 'context_assembler',
  created_at timestamptz not null default now(),
  unique (user_id, revision)
);

create table if not exists public.ai_reflections (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  local_date date not null,
  generated_at timestamptz not null,
  model text not null,
  prompt_version text not null default 'nightly-reflection-v1',
  theme text not null,
  reflection text not null,
  question text not null,
  evidence_categories text[] not null default '{}',
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create index if not exists user_goals_user_status_domain_idx on public.user_goals(user_id, status, domain, priority);
create index if not exists user_schedule_blocks_user_status_day_idx on public.user_schedule_blocks(user_id, status, day_of_week);
create index if not exists user_context_facts_user_status_domain_idx on public.user_context_facts(user_id, status, domain);
create index if not exists daily_checkins_user_date_idx on public.daily_checkins(user_id, local_date desc);
create index if not exists personalization_snapshots_user_effective_idx on public.personalization_context_snapshots(user_id, effective_at desc);
create index if not exists ai_reflections_user_date_idx on public.ai_reflections(user_id, local_date desc);

create unique index if not exists user_context_facts_active_unique_idx
  on public.user_context_facts(user_id, domain, fact_key, md5(value::text))
  where status = 'active' and confirmation_state = 'confirmed';

drop trigger if exists life_profiles_touch_updated_at on public.life_profiles;
create trigger life_profiles_touch_updated_at before update on public.life_profiles for each row execute function public.touch_updated_at();
drop trigger if exists user_goals_touch_updated_at on public.user_goals;
create trigger user_goals_touch_updated_at before update on public.user_goals for each row execute function public.touch_updated_at();
drop trigger if exists user_schedule_blocks_touch_updated_at on public.user_schedule_blocks;
create trigger user_schedule_blocks_touch_updated_at before update on public.user_schedule_blocks for each row execute function public.touch_updated_at();
drop trigger if exists user_context_facts_touch_updated_at on public.user_context_facts;
create trigger user_context_facts_touch_updated_at before update on public.user_context_facts for each row execute function public.touch_updated_at();
drop trigger if exists daily_checkins_touch_updated_at on public.daily_checkins;
create trigger daily_checkins_touch_updated_at before update on public.daily_checkins for each row execute function public.touch_updated_at();
drop trigger if exists ai_reflections_touch_updated_at on public.ai_reflections;
create trigger ai_reflections_touch_updated_at before update on public.ai_reflections for each row execute function public.touch_updated_at();

alter table public.life_profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_schedule_blocks enable row level security;
alter table public.user_context_facts enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.personalization_context_snapshots enable row level security;
alter table public.ai_reflections enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['life_profiles','user_goals','user_schedule_blocks','user_context_facts','daily_checkins','ai_reflections']
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete_own', table_name);
  end loop;
end $$;

drop policy if exists personalization_context_snapshots_select_own on public.personalization_context_snapshots;
create policy personalization_context_snapshots_select_own
  on public.personalization_context_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.life_profiles, public.user_goals, public.user_schedule_blocks,
  public.user_context_facts, public.daily_checkins, public.personalization_context_snapshots,
  public.ai_reflections from anon;
grant select, insert, update, delete on public.life_profiles, public.user_goals,
  public.user_schedule_blocks, public.user_context_facts, public.daily_checkins,
  public.ai_reflections to authenticated;
grant select on public.personalization_context_snapshots to authenticated;
grant all on public.life_profiles, public.user_goals, public.user_schedule_blocks,
  public.user_context_facts, public.daily_checkins, public.personalization_context_snapshots,
  public.ai_reflections to service_role;

comment on table public.personalization_context_snapshots is 'Immutable server-built context used to reproduce and explain adaptations.';
comment on table public.ai_reflections is 'Optional compact-AI reflections. Rejected reflections are deleted; accepted reflections are retained until the user removes them.';
