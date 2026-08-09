import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveJournalPatterns, selectJournalPrompts } from './journal';

test('journal prompts avoid prompts used within fourteen days', () => {
  const used = 'What are you carrying into tomorrow?';
  const prompts = selectJournalPrompts({
    now: new Date('2026-08-09T20:00:00'),
    entries: [{ writtenAt: '2026-08-08T20:00:00', title: used, tags: [] }],
    limit: 4,
  });
  assert.equal(prompts.includes(used), false);
  assert.equal(new Set(prompts).size, prompts.length);
});

test('patterns are derived from tags, timing and evidence windows', () => {
  const entries = [
    { writtenAt: '2026-08-08T20:00:00', tags: ['work'], title: null },
    { writtenAt: '2026-08-07T21:00:00', tags: ['work', 'tired'], title: null },
    { writtenAt: '2026-08-06T19:00:00', tags: ['calm'], title: null },
  ];
  const patterns = deriveJournalPatterns(entries, new Date('2026-08-09T20:00:00'));
  assert.ok(patterns.some((pattern) => pattern.id === 'tag:work'));
  assert.ok(
    patterns.every(
      (pattern) => pattern.evidence && pattern.windowLabel && pattern.confidence >= 0.5,
    ),
  );
});
