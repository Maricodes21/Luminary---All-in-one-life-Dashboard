-- Source libraries, profile settings, and monthly money planning.

alter table public.profiles
  add column if not exists reminder_hour int not null default 21 check (reminder_hour between 0 and 23),
  add column if not exists reminder_minute int not null default 0 check (reminder_minute in (0, 15, 30, 45)),
  add column if not exists privacy_mode boolean not null default true,
  add column if not exists metric_units boolean not null default true;

create table if not exists public.budget_profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  monthly_income numeric not null default 0,
  monthly_budget numeric not null default 0,
  cycle_day int not null default 1 check (cycle_day between 1 and 28),
  updated_at timestamptz not null default now()
);
alter table public.budget_profiles enable row level security;
drop policy if exists "budget_profiles are self-scoped" on public.budget_profiles;
create policy "budget_profiles are self-scoped" on public.budget_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.content_sources (
  id text primary key,
  provider text not null,
  source_url text,
  license text not null,
  lookup_policy text not null check (lookup_policy in ('bundled', 'cache-first', 'live')),
  updated_at timestamptz not null default now()
);
alter table public.content_sources enable row level security;
drop policy if exists "content_sources are readable" on public.content_sources;
create policy "content_sources are readable" on public.content_sources
  for select to authenticated using (true);

create table if not exists public.food_items (
  id text primary key,
  source_id text not null references public.content_sources(id),
  name text not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  calories int not null,
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fat_g int not null default 0,
  tags text[] not null default '{}',
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.food_items enable row level security;
drop policy if exists "food_items are readable" on public.food_items;
create policy "food_items are readable" on public.food_items
  for select to authenticated using (true);

create table if not exists public.exercise_items (
  id text primary key,
  source_id text not null references public.content_sources(id),
  name text not null,
  category text not null check (category in ('calisthenics', 'cardio', 'cycling', 'gym')),
  level text not null check (level in ('beginner', 'steady', 'advanced')),
  equipment text[] not null default '{}',
  detail text not null,
  coaching_cue text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.exercise_items enable row level security;
drop policy if exists "exercise_items are readable" on public.exercise_items;
create policy "exercise_items are readable" on public.exercise_items
  for select to authenticated using (true);

grant select, insert, update, delete on table public.budget_profiles to authenticated;
grant select on table public.content_sources to authenticated;
grant select on table public.food_items to authenticated;
grant select on table public.exercise_items to authenticated;
