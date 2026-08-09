import assert from 'node:assert/strict';
import test from 'node:test';
import { activeHabitsForDate, isHabitActiveOn, isHabitScheduledOn, previousLocalDate } from './habits';
import type { Habit } from '../stores/useProductionStore';

const base: Habit = {
  id: 'habit-1',
  name: 'Read',
  position: 0,
  completedOn: ['2026-08-01'],
  activeFrom: '2026-08-01',
  schedule: { days: [1, 2, 3, 4, 5], timeWindow: 'evening', weeklyTarget: 5 },
};

test('ending a commitment preserves earlier history and removes future instances', () => {
  const ended = { ...base, activeUntil: '2026-08-08' };
  assert.equal(isHabitActiveOn(ended, '2026-08-01'), true);
  assert.equal(isHabitActiveOn(ended, '2026-08-08'), true);
  assert.equal(isHabitActiveOn(ended, '2026-08-09'), false);
  assert.deepEqual(ended.completedOn, ['2026-08-01']);
});

test('a skipped date does not remove the surrounding rhythm', () => {
  const skipped = { ...base, skippedOn: ['2026-08-04'] };
  assert.equal(isHabitScheduledOn(skipped, '2026-08-04'), false);
  assert.equal(isHabitScheduledOn(skipped, '2026-08-05'), true);
});

test('active commitments are ordered by time window then position', () => {
  const anytime = { ...base, id: 'anytime', position: 0, schedule: { ...base.schedule!, timeWindow: 'anytime' as const } };
  const morning = { ...base, id: 'morning', position: 4, schedule: { ...base.schedule!, timeWindow: 'morning' as const } };
  assert.deepEqual(activeHabitsForDate([anytime, morning], '2026-08-03').map((habit) => habit.id), ['morning', 'anytime']);
});

test('previousLocalDate crosses month boundaries safely', () => {
  assert.equal(previousLocalDate('2026-08-01'), '2026-07-31');
});
