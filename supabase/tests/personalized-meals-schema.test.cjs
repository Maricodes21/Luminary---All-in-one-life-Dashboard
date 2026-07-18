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

function pendingMigrationSql() {
  return [
    '0006_phase3_and_4_schema.sql',
    '0007_production_modules.sql',
    '0008_content_sources_profile_money.sql',
    '20260713192430_personalized_meals.sql',
  ]
    .map((filename) => fs.readFileSync(path.join(migrationsDir, filename), 'utf8').toLowerCase())
    .join('\n');
}

test('pending migrations use a UUID default available on hosted Supabase', () => {
  const sql = pendingMigrationSql();

  assert.doesNotMatch(sql, /\buuid_generate_v4\s*\(/);
  assert.match(sql, /\bgen_random_uuid\s*\(/);
});

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

  assert.match(
    sql,
    /grant select, insert, update, delete on public\.body_measurements to authenticated/,
  );
  assert.match(sql, /grant select, insert, update, delete on public\.meals to authenticated/);
  assert.match(sql, /grant select on public\.recipes to authenticated/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.doesNotMatch(sql, /security definer/);
});

test('personalized meals migration protects parent-child and service-only records', () => {
  const sql = migrationSql();

  assert.match(
    sql,
    /meal plan entries are self-scoped[\s\S]*exists \([\s\S]*from public\.meal_plans[\s\S]*plan\.user_id = \(select auth\.uid\(\)\)/,
  );
  assert.match(
    sql,
    /recipe ingredients are readable[\s\S]*exists \([\s\S]*from public\.recipes[\s\S]*validation_status = 'validated'/,
  );
  assert.match(
    sql,
    /recipe steps are readable[\s\S]*exists \([\s\S]*from public\.recipes[\s\S]*validation_status = 'validated'/,
  );
  assert.match(sql, /food query cache is service managed/);
  assert.match(sql, /revoke all on public\.food_query_cache from anon, authenticated/);
  assert.match(sql, /rls audit passed/);
});
