-- Luminary — Phase 3 & 4 Schema Migration
--
-- Adds tables for:
--   * friend_cards (Phase 2/3 insight cards)
--   * budget_transactions, budget_goals, budget_bills (Phase 4a Wallet)
--   * health_workouts (Phase 4b Health)
--   * meals (Phase 4c Nutrition)
--
-- All tables follow the strict RLS and auth.uid() default invariants.

-- ────────────────────────────────────────────────────────────────────────────
-- Friend Cards (Insights)
-- ────────────────────────────────────────────────────────────────────────────

create table public.friend_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  card_date date not null default current_date,
  body text not null,
  source text not null check (source in ('template', 'llm')),
  created_at timestamptz not null default now(),
  unique (user_id, card_date)
);
create index friend_cards_user_idx on public.friend_cards(user_id, card_date desc);

alter table public.friend_cards enable row level security;
create policy "friend_cards are self-scoped" on public.friend_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- Wallet (Phase 4a)
-- ────────────────────────────────────────────────────────────────────────────

create type budget_category as enum ('Needs', 'Wants', 'Savings', 'Emergencies');

create table public.budget_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  amount numeric not null,
  category budget_category not null,
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index budget_transactions_user_idx on public.budget_transactions(user_id, transaction_date desc);

alter table public.budget_transactions enable row level security;
create policy "budget_transactions are self-scoped" on public.budget_transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


create table public.budget_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.budget_goals enable row level security;
create policy "budget_goals are self-scoped" on public.budget_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


create table public.budget_bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  amount numeric not null,
  due_day_of_month int not null check (due_day_of_month between 1 and 31),
  created_at timestamptz not null default now()
);

alter table public.budget_bills enable row level security;
create policy "budget_bills are self-scoped" on public.budget_bills
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- Health & Fitness (Phase 4b)
-- ────────────────────────────────────────────────────────────────────────────

create table public.health_workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  workout_date date not null default current_date,
  workout_type text not null check (workout_type in ('gym', 'home')),
  duration_minutes int,
  notes text,
  created_at timestamptz not null default now()
);
create index health_workouts_user_idx on public.health_workouts(user_id, workout_date desc);

alter table public.health_workouts enable row level security;
create policy "health_workouts are self-scoped" on public.health_workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- Meals (Phase 4c)
-- ────────────────────────────────────────────────────────────────────────────

create table public.meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  meal_date date not null default current_date,
  name text not null,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  calories int,
  created_at timestamptz not null default now()
);
create index meals_user_idx on public.meals(user_id, meal_date desc);

alter table public.meals enable row level security;
create policy "meals are self-scoped" on public.meals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- RLS AUDIT — Must be included to pass schema validation
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare
  unprotected_tables text;
  policyless_tables text;
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
