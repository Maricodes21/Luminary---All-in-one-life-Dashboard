export type SpotifyArtistRef = {
  id: string;
  name: string;
  spotifyUrl?: string;
};

export type SpotifyPlay = {
  trackId: string;
  name: string;
  artist: SpotifyArtistRef;
  playedAt: string;
  durationMs: number;
  albumImageUrl?: string;
  spotifyUrl?: string;
};

export type SpotifyTrackSummary = {
  id: string;
  name: string;
  artistName: string;
  playCount: number;
  albumImageUrl?: string;
  spotifyUrl?: string;
};

export type SpotifyArtistSummary = {
  id: string;
  name: string;
  playCount: number;
  imageUrl?: string;
  spotifyUrl?: string;
};

export type SpotifyRecap = {
  date: string;
  trackCount: number;
  artistCount: number;
  minutesListened: number;
  topTracks: SpotifyTrackSummary[];
  topArtists: SpotifyArtistSummary[];
  moodPhrase: string;
  averageFeatures: { valence: number; energy: number; tempo: number };
};

export type SpotifyArtistDetails = {
  id: string;
  imageUrl?: string;
  spotifyUrl?: string;
};

type RankedTrack = SpotifyTrackSummary & { lastPlayedAt: number };
type RankedArtist = SpotifyArtistSummary & { lastPlayedAt: number };

export function getLocalDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDailySpotifyRecap(plays: SpotifyPlay[], date: string): SpotifyRecap | null {
  const dailyPlays = plays.filter((play) => getLocalDateKey(play.playedAt) === date);
  if (dailyPlays.length === 0) return null;

  const tracks = new Map<string, RankedTrack>();
  const artists = new Map<string, RankedArtist>();

  for (const play of dailyPlays) {
    const playedAt = new Date(play.playedAt).getTime();
    const existingTrack = tracks.get(play.trackId);
    if (existingTrack) {
      existingTrack.playCount += 1;
      existingTrack.lastPlayedAt = Math.max(existingTrack.lastPlayedAt, playedAt);
    } else {
      tracks.set(play.trackId, {
        id: play.trackId,
        name: play.name,
        artistName: play.artist.name,
        playCount: 1,
        albumImageUrl: play.albumImageUrl,
        spotifyUrl: play.spotifyUrl,
        lastPlayedAt: playedAt,
      });
    }

    const existingArtist = artists.get(play.artist.id);
    if (existingArtist) {
      existingArtist.playCount += 1;
      existingArtist.lastPlayedAt = Math.max(existingArtist.lastPlayedAt, playedAt);
      existingArtist.imageUrl ??= play.albumImageUrl;
    } else {
      artists.set(play.artist.id, {
        id: play.artist.id,
        name: play.artist.name,
        playCount: 1,
        imageUrl: play.albumImageUrl,
        spotifyUrl: play.artist.spotifyUrl,
        lastPlayedAt: playedAt,
      });
    }
  }

  const topTracks = rank([...tracks.values()]).slice(0, 3).map(stripRankMetadata);
  const topArtists = rank([...artists.values()]).slice(0, 3).map(stripRankMetadata);
  const minutesListened = Math.round(
    dailyPlays.reduce((total, play) => total + Math.max(0, play.durationMs), 0) / 60_000,
  );

  return {
    date,
    trackCount: dailyPlays.length,
    artistCount: artists.size,
    minutesListened,
    topTracks,
    topArtists,
    moodPhrase: buildMoodPhrase(dailyPlays, topArtists),
    averageFeatures: inferAverageFeatures(dailyPlays, topTracks[0]?.playCount ?? 1),
  };
}

export function shouldFetchOlderSpotifyPage(
  plays: SpotifyPlay[],
  targetDate: string,
  hasBeforeCursor: boolean,
  pageCount: number,
): boolean {
  if (!hasBeforeCursor || plays.length === 0 || pageCount >= 10) return false;
  const pageDates = plays.map((play) => getLocalDateKey(play.playedAt)).filter(Boolean).sort();
  return (pageDates[0] ?? '') >= targetDate;
}

export function mergeSpotifyArtistDetails(
  recap: SpotifyRecap,
  details: SpotifyArtistDetails[],
): SpotifyRecap {
  const detailsById = new Map(details.map((detail) => [detail.id, detail]));
  return {
    ...recap,
    topArtists: recap.topArtists.map((artist) => {
      const detail = detailsById.get(artist.id);
      return detail
        ? {
            ...artist,
            imageUrl: detail.imageUrl ?? artist.imageUrl,
            spotifyUrl: detail.spotifyUrl ?? artist.spotifyUrl,
          }
        : artist;
    }),
  };
}

function rank<T extends { playCount: number; lastPlayedAt: number }>(items: T[]): T[] {
  return items.sort((left, right) =>
    right.playCount - left.playCount || right.lastPlayedAt - left.lastPlayedAt,
  );
}

function stripRankMetadata<T extends { lastPlayedAt: number }>(item: T): Omit<T, 'lastPlayedAt'> {
  const { lastPlayedAt: _lastPlayedAt, ...summary } = item;
  return summary;
}

function buildMoodPhrase(plays: SpotifyPlay[], artists: SpotifyArtistSummary[]): string {
  const lateNight = plays.some((play) => new Date(play.playedAt).getHours() >= 21);
  const repeat = Math.max(...countTracks(plays).values());
  const anchor = artists[0]?.name ?? plays[0]?.artist.name ?? 'the usual rotation';
  const texture = repeat >= 3 ? 'repeat-loop' : lateNight ? 'late-window' : 'soft-focus';
  return `${texture} ${anchor.toLowerCase()}`;
}

function inferAverageFeatures(
  plays: SpotifyPlay[],
  leadingRepeatCount: number,
): SpotifyRecap['averageFeatures'] {
  const lateNightCount = plays.filter((play) => new Date(play.playedAt).getHours() >= 21).length;
  const repeatRatio = leadingRepeatCount / plays.length;
  const lateRatio = lateNightCount / plays.length;

  return {
    valence: clamp(0.58 - lateRatio * 0.12 + repeatRatio * 0.08),
    energy: clamp(0.52 + plays.length / 120 - lateRatio * 0.08),
    tempo: Math.round(96 + Math.min(28, plays.length * 0.9) - lateRatio * 8),
  };
}

function countTracks(plays: SpotifyPlay[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const play of plays) counts.set(play.trackId, (counts.get(play.trackId) ?? 0) + 1);
  return counts;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
