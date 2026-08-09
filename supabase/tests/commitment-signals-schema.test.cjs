const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(__dirname, '..', 'migrations', '20260809201256_commitment_lifecycle_and_signals.sql');

test('commitments are effective-dated and signal records remain user scoped', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
  assert.match(sql, /add column if not exists active_from date/);
  assert.match(sql, /add column if not exists active_until date/);
  assert.match(sql, /alter table public\.daily_signals enable row level security/);
  assert.match(sql, /alter table public\.signal_feedback enable row level security/);
  assert.match(sql, /foreign key \(signal_id, user_id\) references public\.daily_signals \(id, user_id\)/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(sql, /revoke all on table public\.daily_signals, public\.signal_feedback from anon/);
  assert.match(sql, /grant select, insert, update, delete on table public\.daily_signals, public\.signal_feedback to authenticated/);
});
