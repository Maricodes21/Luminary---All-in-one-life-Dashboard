import assert from 'node:assert/strict';
import test from 'node:test';
import { allDailySignalRuleIds, generateDailySignals, validateMoodPayload, type DailySignalContext } from './dailySignals';

const base = (): DailySignalContext => ({
  now: new Date('2026-08-09T19:30:00'), habits: [], loggedMealTypes: [], purchaseCount: 0,
  workout: { planned: false, completed: false }, journal: { entryCount: 0 },
  ritual: { status: 'not_started' }, music: { connected: true, recapAvailable: true },
});

test('signal registry contains at least thirty parameterized rules', () => {
  assert.ok(allDailySignalRuleIds().length >= 30);
});

test('selection caps surfaces at three signals and one per module unless urgent', () => {
  const signals = generateDailySignals(base());
  assert.ok(signals.length <= 3);
  const normalSources = signals.filter((signal) => !signal.urgent).map((signal) => signal.source);
  assert.equal(new Set(normalSources).size, normalSources.length);
});

test('missing data is phrased without inventing user behaviour', () => {
  const signals = generateDailySignals(base());
  assert.doesNotMatch(JSON.stringify(signals), /forgot|skipped a meal|spent nothing/i);
});

test('dismissal suppresses unchanged evidence for seven days', () => {
  const context = base();
  const signal = generateDailySignals(context)[0];
  const next = generateDailySignals(context, [{
    signalId: signal.id, key: signal.key, family: signal.family, templateId: 'different-template',
    evidenceHash: signal.evidenceHash, occurredAt: context.now.toISOString(), response: 'dismissed',
  }]);
  assert.ok(!next.some((item) => item.family === signal.family));
});

test('Spotify-shaped data is rejected from mood estimation requests', () => {
  assert.equal(validateMoodPayload({ commitments: { completed: 2 }, spotify: { topTracks: [] } }), false);
  assert.equal(validateMoodPayload({ journal: { tags: ['calm'] }, movement: { workoutCompleted: true } }), true);
});
