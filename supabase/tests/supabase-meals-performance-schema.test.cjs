const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(
  __dirname,
  '..',
  'migrations',
  '20260714155000_optimize_meals_rls_indexes.sql',
);

test('Meals migration optimizes auth policies and foreign-key lookups', () => {
  assert.ok(fs.existsSync(migrationPath), 'Meals performance migration should exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(
    sql,
    /create policy "meals are self-scoped"[\s\S]*\(select auth\.uid\(\)\) = user_id/,
  );
  assert.match(
    sql,
    /create policy "meal_plans are self-scoped"[\s\S]*\(select auth\.uid\(\)\) = user_id/,
  );

  for (const indexName of [
    'food_items_source_idx',
    'food_provider_records_food_item_idx',
    'food_submissions_duplicate_idx',
    'recipe_ingredients_food_item_idx',
    'recipe_ingredients_recipe_idx',
  ]) {
    assert.match(sql, new RegExp(`create index if not exists ${indexName}\\b`));
  }
});
