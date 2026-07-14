-- Personalized Meals: profile inputs, durable logs, normalized recipes/plans,
-- contribution provenance, and AI usage telemetry.

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists biological_sex text check (biological_sex in ('female', 'male')),
  add column if not exists activity_level text check (activity_level in ('low', 'moderate', 'high')),
  add column if not exists nutrition_goal text check (nutrition_goal in ('lose', 'maintain', 'gain')),
  add column if not exists nutrition_updated_at timestamptz,
  add column if not exists dietary_preferences text[] not null default '{}',
  add column if not exists food_allergies text[] not null default '{}',
  add column if not exists disliked_ingredients text[] not null default '{}',
  add column if not exists max_prep_minutes int not null default 60 check (max_prep_minutes between 5 and 240);

alter table public.meals
  add column if not exists consumed_at timestamptz not null default now(),
  add column if not exists timezone text not null default 'UTC',
  add column if not exists meal_type text not null default 'snack'
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  add column if not exists serving_quantity numeric not null default 1 check (serving_quantity > 0),
  add column if not exists serving_unit text not null default 'serving',
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'curated', 'usda', 'open_food_facts', 'community', 'commercial', 'ai_vision')),
  add column if not exists provider_id text,
  add column if not exists confidence numeric check (confidence between 0 and 1),
  add column if not exists notes text,
  add column if not exists image_path text;

create index if not exists meals_consumed_idx on public.meals(user_id, consumed_at desc);

create table if not exists public.body_measurements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  weight_kg numeric not null check (weight_kg between 20 and 500),
  height_cm numeric check (height_cm between 80 and 260),
  measured_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('onboarding', 'manual', 'device')),
  created_at timestamptz not null default now()
);
create index if not exists body_measurements_user_idx on public.body_measurements(user_id, measured_at desc);
alter table public.body_measurements enable row level security;
create policy "body measurements are self-scoped" on public.body_measurements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.daily_nutrition_targets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  local_date date not null,
  calories int not null check (calories > 0),
  protein_g int not null check (protein_g >= 0),
  carbs_g int not null check (carbs_g >= 0),
  fat_g int not null check (fat_g >= 0),
  calculated_at timestamptz not null default now(),
  unique(user_id, local_date)
);
alter table public.daily_nutrition_targets enable row level security;
create policy "nutrition targets are self-scoped" on public.daily_nutrition_targets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.food_items
  add column if not exists brand text,
  add column if not exists barcode text,
  add column if not exists country_code text,
  add column if not exists image_url text,
  add column if not exists verification_status text not null default 'provider'
    check (verification_status in ('provider', 'community', 'verified', 'rejected'));
create index if not exists food_items_search_idx on public.food_items using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(brand, '')));
create unique index if not exists food_items_barcode_idx on public.food_items(barcode) where barcode is not null;

create table if not exists public.food_servings (
  id uuid primary key default uuid_generate_v4(),
  food_item_id text not null references public.food_items on delete cascade,
  label text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  grams numeric check (grams > 0),
  calories numeric not null check (calories >= 0),
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  is_default boolean not null default false,
  unique(food_item_id, label, quantity, unit)
);
alter table public.food_servings enable row level security;
create policy "food servings are readable" on public.food_servings for select to authenticated using (true);

create table if not exists public.food_provider_records (
  id uuid primary key default uuid_generate_v4(),
  food_item_id text not null references public.food_items on delete cascade,
  provider text not null,
  provider_id text not null,
  locale text not null default 'en-ZA',
  source_url text,
  raw jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  unique(provider, provider_id)
);
alter table public.food_provider_records enable row level security;
create policy "food provider records are readable" on public.food_provider_records for select to authenticated using (true);

create table if not exists public.food_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  proposed_name text not null,
  brand text,
  barcode text,
  serving jsonb not null default '{}'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  evidence_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  duplicate_of text references public.food_items(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists food_submissions_user_idx on public.food_submissions(user_id, created_at desc);
alter table public.food_submissions enable row level security;
create policy "food submissions are self-readable" on public.food_submissions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "food submissions are self-creatable" on public.food_submissions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "pending food submissions are self-updatable" on public.food_submissions
  for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status = 'pending');

create table if not exists public.recipes (
  id text primary key,
  source text not null check (source in ('curated', 'themealdb', 'community', 'ai')),
  source_url text,
  title text not null,
  description text not null default '',
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings int not null default 2 check (servings > 0),
  prep_time_minutes int not null check (prep_time_minutes > 0),
  difficulty text not null check (difficulty in ('Easy', 'Steady', 'Prep')),
  image_url text not null,
  image_hash text,
  calories int not null check (calories >= 0),
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  allergens text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  cuisine text,
  validation_status text not null default 'validated' check (validation_status in ('draft', 'validated', 'rejected')),
  canonical_hash text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_meal_type_idx on public.recipes(meal_type, validation_status);
alter table public.recipes enable row level security;
create policy "validated recipes are readable" on public.recipes
  for select to authenticated using (validation_status = 'validated');

create table if not exists public.recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id text not null references public.recipes on delete cascade,
  food_item_id text references public.food_items on delete set null,
  name text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  position int not null default 0,
  optional boolean not null default false
);
alter table public.recipe_ingredients enable row level security;
create policy "recipe ingredients are readable" on public.recipe_ingredients for select to authenticated using (true);

create table if not exists public.recipe_steps (
  id uuid primary key default uuid_generate_v4(),
  recipe_id text not null references public.recipes on delete cascade,
  position int not null,
  instruction text not null,
  duration_minutes int,
  temperature_c int,
  unique(recipe_id, position)
);
alter table public.recipe_steps enable row level security;
create policy "recipe steps are readable" on public.recipe_steps for select to authenticated using (true);

create table if not exists public.meal_plan_entries (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references public.meal_plans on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  local_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  position int not null default 0,
  recipe_id text,
  servings numeric not null default 1 check (servings > 0),
  locked boolean not null default false,
  recipe_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(plan_id, local_date, meal_type, position)
);
create index if not exists meal_plan_entries_user_idx on public.meal_plan_entries(user_id, local_date);
alter table public.meal_plan_entries enable row level security;
create policy "meal plan entries are self-scoped" on public.meal_plan_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Preserve existing JSON plans as editable entries. Recipe snapshots remain
-- authoritative until the corresponding catalog recipe is available.
insert into public.meal_plan_entries (plan_id, user_id, local_date, meal_type, position, recipe_id, recipe_snapshot)
select
  plan.id,
  plan.user_id,
  plan.week_of + (day.ordinality::int - 1),
  slot.meal_type,
  0,
  coalesce(slot.value->>'recipeId', slot.value->>'recipe_id'),
  slot.value
from public.meal_plans plan
cross join lateral jsonb_array_elements(plan.days) with ordinality as day(value, ordinality)
cross join lateral (
  values
    ('breakfast', day.value->'breakfast'),
    ('lunch', day.value->'lunch'),
    ('dinner', day.value->'dinner')
) as slot(meal_type, value)
where jsonb_typeof(slot.value) = 'object'
on conflict do nothing;

insert into public.meal_plan_entries (plan_id, user_id, local_date, meal_type, position, recipe_id, recipe_snapshot)
select
  plan.id,
  plan.user_id,
  plan.week_of + (day.ordinality::int - 1),
  'snack',
  snack.ordinality::int - 1,
  coalesce(snack.value->>'recipeId', snack.value->>'recipe_id'),
  snack.value
from public.meal_plans plan
cross join lateral jsonb_array_elements(plan.days) with ordinality as day(value, ordinality)
cross join lateral jsonb_array_elements(coalesce(day.value->'snacks', '[]'::jsonb)) with ordinality as snack(value, ordinality)
where jsonb_typeof(snack.value) = 'object'
on conflict do nothing;

create table if not exists public.suggestion_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  local_date date not null,
  candidate_id text not null,
  action text not null check (action in ('accepted', 'dismissed', 'saved', 'substituted')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists suggestion_feedback_user_idx on public.suggestion_feedback(user_id, created_at desc);
alter table public.suggestion_feedback enable row level security;
create policy "suggestion feedback is self-scoped" on public.suggestion_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_type text not null check (job_type in ('query_interpretation', 'suggestion_ranking', 'meal_vision', 'plan_generation', 'recipe_generation', 'recipe_image')),
  provider text not null,
  model text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'blocked_budget')),
  prompt_version text not null,
  input_hash text,
  usage jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric not null default 0 check (estimated_cost_usd >= 0),
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ai_jobs_user_idx on public.ai_jobs(user_id, created_at desc);
alter table public.ai_jobs enable row level security;
create policy "ai jobs are self-readable" on public.ai_jobs
  for select to authenticated using ((select auth.uid()) = user_id);

-- Service-only cache for AI query normalization. Raw user queries are never stored.
create table if not exists public.food_query_cache (
  id uuid primary key default uuid_generate_v4(),
  locale text not null,
  query_hash text not null,
  normalized_terms text[] not null default '{}',
  provider_ids text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(locale, query_hash)
);
create index if not exists food_query_cache_expiry_idx on public.food_query_cache(expires_at);
alter table public.food_query_cache enable row level security;

grant select, insert, update, delete on public.body_measurements to authenticated;
grant select, insert, update, delete on public.daily_nutrition_targets to authenticated;
grant select on public.food_servings, public.food_provider_records to authenticated;
grant select, insert, update on public.food_submissions to authenticated;
grant select on public.recipes to authenticated;
grant select on public.recipe_ingredients, public.recipe_steps to authenticated;
grant select, insert, update, delete on public.meal_plan_entries to authenticated;
grant select, insert, update, delete on public.suggestion_feedback to authenticated;
grant select on public.ai_jobs to authenticated;

grant all on public.body_measurements, public.daily_nutrition_targets, public.food_servings,
  public.food_provider_records, public.food_submissions, public.recipes, public.recipe_ingredients,
  public.recipe_steps, public.meal_plan_entries, public.suggestion_feedback, public.ai_jobs to service_role;
grant all on public.food_query_cache to service_role;
