-- Avoid per-row auth evaluation and cover Meals foreign-key lookups.

drop policy if exists "meals are self-scoped" on public.meals;
create policy "meals are self-scoped" on public.meals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_plans are self-scoped" on public.meal_plans;
create policy "meal_plans are self-scoped" on public.meal_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists food_items_source_idx
  on public.food_items(source_id);

create index if not exists food_provider_records_food_item_idx
  on public.food_provider_records(food_item_id);

create index if not exists food_submissions_duplicate_idx
  on public.food_submissions(duplicate_of)
  where duplicate_of is not null;

create index if not exists recipe_ingredients_food_item_idx
  on public.recipe_ingredients(food_item_id);

create index if not exists recipe_ingredients_recipe_idx
  on public.recipe_ingredients(recipe_id, position);
