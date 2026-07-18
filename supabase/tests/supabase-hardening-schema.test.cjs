const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(
  __dirname,
  '..',
  'migrations',
  '20260714153000_harden_authenticated_api.sql',
);

test('backend hardening pins helper search paths and requires authentication', () => {
  assert.ok(fs.existsSync(migrationPath), 'hardening migration should exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(sql, /alter function public\.touch_updated_at\(\) set search_path = ''/);
  assert.match(sql, /revoke all on[\s\S]*public\.meals[\s\S]*public\.recipes[\s\S]*from anon/);
  assert.match(
    sql,
    /grant select, insert, update, delete on[\s\S]*public\.meal_plans[\s\S]*to authenticated/,
  );
  assert.match(
    sql,
    /grant select on[\s\S]*public\.food_items[\s\S]*public\.recipe_steps[\s\S]*to authenticated/,
  );
});
