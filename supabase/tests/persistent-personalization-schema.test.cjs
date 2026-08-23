const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migration = fs
  .readFileSync(
    path.resolve(__dirname, '../migrations/20260823143000_persistent_personalization_core.sql'),
    'utf8',
  )
  .toLowerCase();
const commitmentMigration = fs
  .readFileSync(
    path.resolve(__dirname, '../migrations/20260809201256_commitment_lifecycle_and_signals.sql'),
    'utf8',
  )
  .toLowerCase();
const indexMigration = fs
  .readFileSync(
    path.resolve(__dirname, '../migrations/20260823151500_personalization_performance_indexes.sql'),
    'utf8',
  )
  .toLowerCase();

const ownerWritable = [
  'life_profiles',
  'user_goals',
  'user_schedule_blocks',
  'user_context_facts',
  'daily_checkins',
  'ai_reflections',
];

test('personalization core is additive and user scoped', () => {
  for (const table of [...ownerWritable, 'personalization_context_snapshots']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  for (const table of ownerWritable.filter((table) => table !== 'life_profiles')) {
    assert.match(
      migration,
      new RegExp(`create index if not exists [^\\n]+ on public\\.${table}\\(user_id`),
    );
  }
  assert.match(migration, /user_id uuid primary key references auth\.users/);
});

test('owner policies use cached auth uid and explicit authenticated grants', () => {
  assert.match(migration, /to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /revoke all on[\s\S]*public\.ai_reflections from anon/);
  assert.match(migration, /grant select, insert, update, delete on[\s\S]*public\.life_profiles/);
});

test('context snapshots are client read-only and rejected reflections are not retained', () => {
  assert.match(
    migration,
    /grant select on public\.personalization_context_snapshots to authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /grant select, insert[^;]*personalization_context_snapshots[^;]*to authenticated/,
  );
  assert.match(migration, /status in \('pending','accepted'\)/);
  assert.doesNotMatch(migration, /status in \('pending','accepted','rejected'\)/);
});

test('pending personalization migrations use the hosted UUID generator', () => {
  assert.doesNotMatch(`${commitmentMigration}\n${migration}`, /uuid_generate_v4\s*\(/);
  assert.match(commitmentMigration, /gen_random_uuid\s*\(/);
});

test('new personalization foreign keys have covering indexes', () => {
  assert.match(indexMigration, /signal_feedback\(signal_id, user_id\)/);
  assert.match(indexMigration, /user_context_facts\(supersedes_fact_id\)/);
});
