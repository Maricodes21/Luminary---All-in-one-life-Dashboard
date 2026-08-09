import assert from 'node:assert/strict';
import test from 'node:test';
import { describeListeningSignal, formatMoodHeadline } from './spotifyDisplay';

test('listening signal is caveated when there is too little music', () => {
  const signal = describeListeningSignal({ trackCount: 1, minutesListened: 4 });

  assert.equal(signal.isThin, true);
  assert.equal(signal.copy, 'Light listening today - best guess.');
});

test('mood headline uses mood label before artist flavor', () => {
  const headline = formatMoodHeadline('Focused', 'soft-focus ken carson');

  assert.equal(headline.title, 'Focused');
  assert.equal(headline.detail, 'Soundtrack hint: soft-focus ken carson');
});
