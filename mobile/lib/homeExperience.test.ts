import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const mobileRoot = path.resolve(__dirname, '..');

test('compact Spotify recap uses centered three-column tracks and artists', () => {
  const source = fs.readFileSync(
    path.join(mobileRoot, 'components/spotify/SpotifyDailyRecap.tsx'),
    'utf8',
  );

  assert.match(source, /compactTrackGrid/);
  assert.match(source, /compactTrackCard/);
  assert.match(source, /compactSectionHeading/);
  assert.match(source, /compactArtistRow/);
  assert.match(source, /flex:\s*1/);
  assert.doesNotMatch(source, /compactTrackList|compactTrackRow/);
});
