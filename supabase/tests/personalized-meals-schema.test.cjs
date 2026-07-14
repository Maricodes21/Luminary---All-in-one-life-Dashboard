const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationsDir = path.resolve(__dirname, '..', 'migrations');

function migrationSql() {
  const filename = fs
    .readdirSync(migrationsDir)
    .find((entry) => entry.endsWith('_personalized_meals.sql'));

  assert.ok(filename, 'personalized meals migration should exist');
  return fs.readFileSync(path.join(migrationsDir, filename), 'utf8').toLowerCase();
}

test('personalized meals migration adds profile and meal history fields', () => {
  const sql = migrationSql();

  for (const field of [
    'date_of_birth',
    'biological_sex',
    'activity_level',
    'nutrition_goal',
    'nutrition_updated_at',
    'consumed_at',
    'meal_type',
    'serving_quantity',
    'serving_unit',
    'timezone',
    'source',
    'provider_id',
    'confidence',
    'notes',
    'image_path',
  ]) {
    assert.match(sql, new RegExp(`\\b${field}\\b`));
  }
});

test('personalized meals migration creates normalized planning and provenance tables', () => {
  const sql = migrationSql();

  for (const table of [
    'body_measurements',
    'daily_nutrition_targets',
    'food_servings',
    'food_provider_records',
    'food_submissions',
    'recipes',
    'recipe_ingredients',
    'recipe_steps',
    'meal_plan_entries',
    'suggestion_feedback',
    'ai_jobs',
    'food_query_cache',
  ]) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test('personalized meals migration exposes authenticated tables without weakening ownership', () => {
  const sql = migrationSql();

  assert.match(sql, /grant select, insert, update, delete on public\.body_measurements to authenticated/);
  assert.match(sql, /grant select on public\.recipes to authenticated/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.doesNotMatch(sql, /security definer/);
});
