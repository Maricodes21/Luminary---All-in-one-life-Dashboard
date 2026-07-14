-- Pin the trigger helper's lookup path and make Meals API tables authenticated-only.

alter function public.touch_updated_at() set search_path = '';

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
from anon;

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

revoke all on public.food_query_cache from authenticated;

grant all on
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
to service_role;

do $$
begin
  if has_table_privilege('anon', 'public.meals', 'select')
    or has_table_privilege('anon', 'public.recipes', 'select') then
    raise exception 'authenticated API audit failed: anon retains Meals access';
  end if;

  raise notice 'Authenticated API audit passed.';
end$$;
