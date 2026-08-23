import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSpotifyFree } from './localGateway';

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
