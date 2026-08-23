import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSpotifyFree, parseCompactJournalPatterns } from './localGateway';

test('compact AI context accepts a user-owned listening reaction', () => {
  assert.doesNotThrow(() =>
    assertSpotifyFree({ listeningReaction: 'comforted', journal: { tags: ['calm'] } }),
  );
});

test('compact AI context rejects Spotify-shaped fields at every depth', () => {
  assert.throws(
    () => assertSpotifyFree({ context: { topTracks: [{ artistName: 'Example' }] } }),
    /Spotify data is not allowed/,
  );
  assert.throws(() => assertSpotifyFree({ minutesListened: 42 }), /Spotify data is not allowed/);
});

test('AI journal patterns require repeated, valid evidence', () => {
  const patterns = parseCompactJournalPatterns(
    {
      patterns: [
        {
          title: 'Evenings feel clearer',
          detail: 'You described more settled moments in several evening notes.',
          supportingEntryIndexes: [0, 2, 2, 99],
          confidence: 0.82,
        },
        {
          title: 'One difficult morning',
          detail: 'A single entry cannot establish a pattern.',
          supportingEntryIndexes: [1],
          confidence: 0.9,
        },
      ],
    },
    4,
    'Last 28 days',
  );

  assert.equal(patterns.length, 1);
  assert.equal(patterns[0]?.source, 'ai');
  assert.equal(patterns[0]?.evidence, '2 supporting entries');
  assert.ok((patterns[0]?.confidence ?? 1) <= 0.71);
});
