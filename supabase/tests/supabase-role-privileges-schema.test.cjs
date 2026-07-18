const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(
  __dirname,
  '..',
  'migrations',
  '20260714154000_enforce_role_privileges.sql',
);

test('authenticated Meals privileges are explicitly least-privileged', () => {
  assert.ok(fs.existsSync(migrationPath), 'role privilege migration should exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(
    sql,
    /revoke all on table[\s\S]*public\.food_items[\s\S]*public\.food_query_cache[\s\S]*from authenticated/,
  );
  assert.match(
    sql,
    /grant select, insert, update, delete on[\s\S]*public\.meals[\s\S]*public\.meal_plans[\s\S]*to authenticated/,
  );
  assert.match(sql, /grant select, insert, update on public\.food_submissions to authenticated/);
  assert.match(
    sql,
    /grant select on[\s\S]*public\.food_items[\s\S]*public\.recipes[\s\S]*public\.ai_jobs[\s\S]*to authenticated/,
  );
  assert.match(sql, /has_table_privilege\('authenticated', 'public\.recipes', 'insert'\)/);
});
