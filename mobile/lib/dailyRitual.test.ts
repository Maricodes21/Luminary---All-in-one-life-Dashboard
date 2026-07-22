import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMusicEvidence,
  createDailyRitualSession,
  expectedMealForTime,
  isRitualCompletedForDate,
  selectDailyRitualSignals,
} from './dailyRitual';
import type { SpotifyRecap } from './spotify';

test('meal prompts follow the local part of the day', () => {
  assert.equal(expectedMealForTime(new Date('2026-07-22T08:00:00')), 'breakfast');
  assert.equal(expectedMealForTime(new Date('2026-07-22T13:00:00')), 'lunch');
  assert.equal(expectedMealForTime(new Date('2026-07-22T19:00:00')), 'dinner');
});

test('daily ritual signals use real unfinished tasks and never invent transactions', () => {
  const signals = selectDailyRitualSignals({
    now: new Date('2026-07-22T19:00:00'),
    loggedMealTypes: [],
    purchaseCount: 0,
    workoutPlanned: true,
    workoutCompleted: false,
    workoutLabel: 'Calisthenics strength',
  });

  assert.deepEqual(signals.map((signal) => signal.kind), ['meals', 'health', 'money']);
  assert.doesNotMatch(JSON.stringify(signals), /R349|confirmation/i);
  assert.ok(signals.every((signal) => signal.route.startsWith('/(tabs)/')));
});

test('completed module work removes optional ritual cards', () => {
  const signals = selectDailyRitualSignals({
    now: new Date('2026-07-22T19:00:00'),
    loggedMealTypes: ['dinner'],
    purchaseCount: 1,
    workoutPlanned: true,
    workoutCompleted: true,
  });

  assert.deepEqual(signals, []);
});

test('ritual completion is explicit and independent from habit completion', () => {
  const session = createDailyRitualSession('2026-07-22');
  assert.equal(session.status, 'not_started');
  assert.equal(isRitualCompletedForDate(session, '2026-07-22'), false);

  const completed = { ...session, status: 'completed' as const, completedAt: '2026-07-22T21:00:00.000Z' };
  assert.equal(isRitualCompletedForDate(completed, '2026-07-22'), true);
  assert.equal(isRitualCompletedForDate(completed, '2026-07-23'), false);
});

test('music explanations are derived from recap values', () => {
  const recap: SpotifyRecap = {
    date: '2026-07-22',
    trackCount: 50,
    artistCount: 12,
    minutesListened: 178,
    topTracks: [{ id: 'a', name: 'Track', artistName: 'Artist', playCount: 4 }],
    topArtists: [],
    moodPhrase: 'bright movement',
    averageFeatures: { valence: 0.6, energy: 0.72, tempo: 118 },
  };

  assert.deepEqual(buildMusicEvidence(recap), [
    '178 minutes across 50 plays',
    'Energy signal 72%',
    'Estimated tempo 118 BPM',
  ]);
});
