import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDailySpotifyRecap,
  mergeSpotifyArtistDetails,
  shouldFetchOlderSpotifyPage,
  type SpotifyPlay,
} from './spotifyRecap';

function play(overrides: Partial<SpotifyPlay> & Pick<SpotifyPlay, 'trackId' | 'name' | 'playedAt'>): SpotifyPlay {
  return {
    durationMs: 180_000,
    albumImageUrl: `https://images.example/${overrides.trackId}.jpg`,
    spotifyUrl: `https://open.spotify.com/track/${overrides.trackId}`,
    artist: {
      id: `artist-${overrides.trackId}`,
      name: `Artist ${overrides.trackId}`,
      spotifyUrl: `https://open.spotify.com/artist/artist-${overrides.trackId}`,
    },
    ...overrides,
  };
}

test('daily recap ranks repeats and artists from the same local day', () => {
  const plays: SpotifyPlay[] = [
    play({
      trackId: 'a',
      name: 'First light',
      playedAt: '2026-07-17T21:00:00',
      durationMs: 200_000,
      artist: { id: 'alpha', name: 'Alpha', spotifyUrl: 'https://open.spotify.com/artist/alpha' },
    }),
    play({
      trackId: 'a',
      name: 'First light',
      playedAt: '2026-07-17T18:00:00',
      durationMs: 200_000,
      artist: { id: 'alpha', name: 'Alpha', spotifyUrl: 'https://open.spotify.com/artist/alpha' },
    }),
    play({
      trackId: 'b',
      name: 'Blue room',
      playedAt: '2026-07-17T17:00:00',
      durationMs: 240_000,
      artist: { id: 'beta', name: 'Beta', spotifyUrl: 'https://open.spotify.com/artist/beta' },
    }),
    play({
      trackId: 'c',
      name: 'Afterglow',
      playedAt: '2026-07-17T16:00:00',
      durationMs: 180_000,
      artist: { id: 'alpha', name: 'Alpha', spotifyUrl: 'https://open.spotify.com/artist/alpha' },
    }),
    play({
      trackId: 'old',
      name: 'Yesterday',
      playedAt: '2026-07-16T23:59:59',
      durationMs: 999_000,
      artist: { id: 'old', name: 'Old artist' },
    }),
  ];

  const recap = buildDailySpotifyRecap(plays, '2026-07-17');

  assert.ok(recap);
  assert.equal(recap.trackCount, 4);
  assert.equal(recap.artistCount, 2);
  assert.equal(recap.minutesListened, 14);
  assert.deepEqual(
    recap.topTracks.map(({ id, playCount }) => ({ id, playCount })),
    [
      { id: 'a', playCount: 2 },
      { id: 'b', playCount: 1 },
      { id: 'c', playCount: 1 },
    ],
  );
  assert.deepEqual(
    recap.topArtists.map(({ id, playCount }) => ({ id, playCount })),
    [
      { id: 'alpha', playCount: 3 },
      { id: 'beta', playCount: 1 },
    ],
  );
});

test('daily recap limits songs and artists to three while retaining image and Spotify links', () => {
  const plays = ['a', 'b', 'c', 'd'].map((id, index) =>
    play({
      trackId: id,
      name: `Track ${id}`,
      playedAt: `2026-07-17T${20 - index}:00:00`,
      artist: {
        id: `artist-${id}`,
        name: `Artist ${id}`,
        spotifyUrl: `https://open.spotify.com/artist/artist-${id}`,
      },
    }),
  );

  const recap = buildDailySpotifyRecap(plays, '2026-07-17');

  assert.ok(recap);
  assert.equal(recap.topTracks.length, 3);
  assert.equal(recap.topArtists.length, 3);
  assert.equal(recap.topTracks[0]?.albumImageUrl, 'https://images.example/a.jpg');
  assert.equal(recap.topTracks[0]?.spotifyUrl, 'https://open.spotify.com/track/a');
  assert.equal(recap.topArtists[0]?.imageUrl, 'https://images.example/a.jpg');
  assert.equal(recap.topArtists[0]?.spotifyUrl, 'https://open.spotify.com/artist/artist-a');
});

test('daily recap returns null when the requested local day has no plays', () => {
  const recap = buildDailySpotifyRecap(
    [play({ trackId: 'a', name: 'Yesterday', playedAt: '2026-07-16T22:00:00' })],
    '2026-07-17',
  );

  assert.equal(recap, null);
});

test('pagination continues only while a full page is still inside the target day', () => {
  const todayPage = [play({ trackId: 'a', name: 'Today', playedAt: '2026-07-17T20:00:00' })];
  const boundaryPage = [
    ...todayPage,
    play({ trackId: 'old', name: 'Earlier', playedAt: '2026-07-16T23:59:59' }),
  ];

  assert.equal(shouldFetchOlderSpotifyPage(todayPage, '2026-07-17', true, 1), true);
  assert.equal(shouldFetchOlderSpotifyPage(boundaryPage, '2026-07-17', true, 1), false);
  assert.equal(shouldFetchOlderSpotifyPage(todayPage, '2026-07-17', false, 1), false);
  assert.equal(shouldFetchOlderSpotifyPage(todayPage, '2026-07-17', true, 10), false);
});

test('artist detail enrichment replaces fallbacks without dropping daily counts', () => {
  const recap = buildDailySpotifyRecap(
    [play({ trackId: 'a', name: 'Today', playedAt: '2026-07-17T20:00:00' })],
    '2026-07-17',
  );
  assert.ok(recap);

  const enriched = mergeSpotifyArtistDetails(recap, [
    {
      id: 'artist-a',
      imageUrl: 'https://images.example/artist-a.jpg',
      spotifyUrl: 'https://open.spotify.com/artist/enriched-a',
    },
  ]);

  assert.equal(enriched.topArtists[0]?.playCount, 1);
  assert.equal(enriched.topArtists[0]?.imageUrl, 'https://images.example/artist-a.jpg');
  assert.equal(enriched.topArtists[0]?.spotifyUrl, 'https://open.spotify.com/artist/enriched-a');
});
