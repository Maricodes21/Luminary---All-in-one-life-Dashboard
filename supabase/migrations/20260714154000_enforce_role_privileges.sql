-- Replace Supabase's broad default grants with the Meals API's explicit contract.

revoke all on table
  public.meals,
  public.meal_plans,
  public.meal_plan_entries,
  public.body_measurements,
  public.daily_nutrition_targets,
  public.content_sources,
  public.food_items,
  public.food_servings,
  public.food_provider_records,
  public.food_submissions,
  public.recipes,
  public.recipe_ingredients,
  public.recipe_steps,
  public.suggestion_feedback,
  public.ai_jobs,
  public.food_query_cache
from authenticated;

grant select, insert, update, delete on
  public.meals,
  public.meal_plans,
  public.meal_plan_entries,
  public.body_measurements,
  public.daily_nutrition_targets,
  public.suggestion_feedback
to authenticated;

grant select, insert, update on public.food_submissions to authenticated;

grant select on
  public.content_sources,
  public.food_items,
  public.food_servings,
  public.food_provider_records,
  public.recipes,
  public.recipe_ingredients,
  public.recipe_steps,
  public.ai_jobs
to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.recipes', 'insert')
    or has_table_privilege('authenticated', 'public.food_items', 'update')
    or has_table_privilege('authenticated', 'public.meals', 'truncate')
    or has_table_privilege('authenticated', 'public.food_query_cache', 'select') then
    raise exception 'role privilege audit failed: authenticated role is over-privileged';
  end if;

  if not has_table_privilege('authenticated', 'public.recipes', 'select')
    or not has_table_privilege('authenticated', 'public.meals', 'delete')
    or not has_table_privilege('authenticated', 'public.food_submissions', 'update') then
    raise exception 'role privilege audit failed: authenticated role is missing required access';
  end if;

  raise notice 'Role privilege audit passed.';
end$$;
