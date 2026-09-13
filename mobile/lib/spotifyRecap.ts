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

export const LISTENING_TAGS = [
  'thoughtful',
  'romantic',
  'mellow',
  'energized',
  'focused',
  'playful',
  'nostalgic',
  'restless',
  'mixed',
] as const;

export type ListeningTag = (typeof LISTENING_TAGS)[number];

export type SpotifyRecap = {
  date: string;
  trackCount: number;
  artistCount: number;
  minutesListened: number;
  topTracks: SpotifyTrackSummary[];
  topArtists: SpotifyArtistSummary[];
  /** Complete ranked lists for the detailed recap. */
  allTracks: SpotifyTrackSummary[];
  allArtists: SpotifyArtistSummary[];
  listeningTag: ListeningTag;
  soundtrackDescription?: string;
  soundtrackConfidence?: number;
  listeningWindows: string[];
  firstPlayedAt: string;
  lastPlayedAt: string;
  moodPhrase: string;
  averageFeatures: { valence: number; energy: number; tempo: number };
};

export type SpotifyArtistDetails = {
  id: string;
  imageUrl?: string;
  spotifyUrl?: string;
  genres?: string[];
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

  const allTracks = rank([...tracks.values()]).map(stripRankMetadata);
  const allArtists = rank([...artists.values()]).map(stripRankMetadata);
  const topTracks = allTracks.slice(0, 4);
  const topArtists = allArtists.slice(0, 4);
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
    allTracks,
    allArtists,
    listeningTag: inferListeningTag(dailyPlays, allTracks),
    soundtrackDescription: describeSoundtrack(dailyPlays, [], allTracks).description,
    soundtrackConfidence: describeSoundtrack(dailyPlays, [], allTracks).confidence,
    listeningWindows: listeningWindows(dailyPlays),
    firstPlayedAt: [...dailyPlays].sort(byPlayedAt)[0]?.playedAt ?? '',
    lastPlayedAt: [...dailyPlays].sort(byPlayedAt).at(-1)?.playedAt ?? '',
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
  const soundtrack = describeSoundtrack([], details.flatMap((detail) => detail.genres ?? []), recap.allTracks);
  return {
    ...recap,
    topArtists: enrichArtists(recap.topArtists, detailsById),
    allArtists: enrichArtists(recap.allArtists, detailsById),
    listeningTag: soundtrack.tag ?? recap.listeningTag,
    soundtrackDescription: soundtrack.description,
    soundtrackConfidence: soundtrack.confidence,
  };
}

function describeSoundtrack(plays: SpotifyPlay[], genres: string[], tracks: SpotifyTrackSummary[]) {
  const text = `${genres.join(' ')} ${plays.map((play) => `${play.name} ${play.artist.name}`).join(' ')}`.toLocaleLowerCase('en');
  const scores: Partial<Record<ListeningTag, number>> = {};
  const add = (tag: ListeningTag, pattern: RegExp, weight: number) => { const matches = text.match(pattern)?.length ?? 0; scores[tag] = (scores[tag] ?? 0) + matches * weight; };
  add('romantic', /\b(r&b|soul|love|lover|romantic|slow jam|neo soul)\b/g, 2);
  add('energized', /\b(dance|edm|house|techno|rock|metal|afrobeats|amapiano|workout)\b/g, 1.7);
  add('mellow', /\b(acoustic|ambient|chill|downtempo|soft|jazz|lo-fi|lofi)\b/g, 1.7);
  add('thoughtful', /\b(indie|alternative|folk|singer-songwriter|conscious|poetry|quiet)\b/g, 1.4);
  add('playful', /\b(pop|funk|disco|dancehall|groove|party)\b/g, 1.2);
  add('nostalgic', /\b(classic|old school|old-school|throwback|90s|80s|70s)\b/g, 1.8);
  const leadingRepeat = tracks[0]?.playCount ?? 1;
  if (leadingRepeat >= 4) scores.focused = (scores.focused ?? 0) + 1.5;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[ListeningTag, number]>;
  const first = ranked[0];
  const second = ranked[1];
  const confidence = Math.min(0.92, (first?.[1] ?? 0) / 6 + Math.min(0.25, (genres.length + plays.length) / 40));
  if (!first || confidence < 0.42) return { tag: undefined, description: 'Your soundtrack moved across a few different sounds.', confidence };
  const labels: Record<ListeningTag, string> = { thoughtful: 'reflective', romantic: 'romantic', mellow: 'soft', energized: 'high-energy', focused: 'focused', playful: 'playful', nostalgic: 'nostalgic', restless: 'restless', mixed: 'mixed' };
  const blend = second && second[1] >= first[1] * 0.7 ? ` and ${labels[second[0]]}` : '';
  return { tag: first[0], description: `Your soundtrack leaned ${labels[first[0]]}${blend} today.`, confidence };
}

export function isSpotifyRecapEligible(recap: SpotifyRecap | null | undefined): recap is SpotifyRecap {
  return !!recap && recap.minutesListened >= 30 && recap.trackCount >= 5;
}

function enrichArtists(artists: SpotifyArtistSummary[], detailsById: Map<string, SpotifyArtistDetails>) {
  return artists.map((artist) => {
      const detail = detailsById.get(artist.id);
      return detail
        ? {
            ...artist,
            imageUrl: detail.imageUrl ?? artist.imageUrl,
            spotifyUrl: detail.spotifyUrl ?? artist.spotifyUrl,
          }
        : artist;
    });
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

function inferListeningTag(plays: SpotifyPlay[], tracks: SpotifyTrackSummary[]): ListeningTag {
  const words = `${plays.map((play) => `${play.name} ${play.artist.name}`).join(' ')}`.toLowerCase();
  const semantic: Array<[ListeningTag, RegExp]> = [
    ['romantic', /\b(love|lover|kiss|heart|darling|romance|baby)\b/],
    ['nostalgic', /\b(remember|memory|memories|again|yesterday|old|home)\b/],
    ['playful', /\b(dance|party|fun|smile|sunshine|groove)\b/],
    ['thoughtful', /\b(thought|mind|dream|wonder|alone|blue|night|quiet)\b/],
  ];
  const match = semantic.find(([, pattern]) => pattern.test(words));
  if (match) return match[0];

  const hours = plays.map((play) => new Date(play.playedAt).getHours());
  const lateRatio = hours.filter((hour) => hour >= 21 || hour < 5).length / plays.length;
  const leadingRepeat = tracks[0]?.playCount ?? 1;
  const diversity = tracks.length / plays.length;
  if (lateRatio >= 0.5) return 'mellow';
  if (leadingRepeat >= 4) return 'focused';
  if (diversity > 0.85 && plays.length >= 12) return 'energized';
  if (diversity < 0.45) return 'thoughtful';
  return 'mixed';
}

function listeningWindows(plays: SpotifyPlay[]): string[] {
  const seen = new Set<string>();
  for (const play of plays) {
    const hour = new Date(play.playedAt).getHours();
    seen.add(hour < 6 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Late night');
  }
  return ['Morning', 'Afternoon', 'Evening', 'Late night'].filter((window) => seen.has(window));
}

function byPlayedAt(left: SpotifyPlay, right: SpotifyPlay) {
  return new Date(left.playedAt).getTime() - new Date(right.playedAt).getTime();
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
