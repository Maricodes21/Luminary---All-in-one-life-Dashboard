/**
 * Spotify integration — PKCE OAuth helpers, token lifecycle, and recap fetch.
 *
 * Architecture split:
 *   - This file: pure async utilities (token storage, refresh, API calls).
 *     No React hooks — safe to import from any context.
 *   - hooks/useSpotifyAuth.ts: the PKCE auth flow as a React hook
 *     (wraps expo-auth-session; must live in a component tree).
 *
 * Token storage: expo-secure-store ONLY. AsyncStorage is for Supabase sessions;
 * Spotify tokens are credentials and must not live in plaintext storage.
 *
 * Scopes required:
 *   user-read-recently-played   → /v1/me/player/recently-played
 *   user-top-read               → /v1/me/top/artists
 */

import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_KEY = 'luminary.spotify.tokens';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

/** How many seconds before expiry we proactively refresh. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
};

export type SpotifyRecap = {
  date: string; // YYYY-MM-DD
  trackCount: number;
  minutesListened: number;
  topTracks: Array<{ id: string; name: string; artistName: string; playCount: number }>;
  topArtists: Array<{ id: string; name: string; imageUrl?: string }>;
  moodPhrase: string;
  averageFeatures: { valence: number; energy: number; tempo: number };
};

// ─── Token storage ────────────────────────────────────────────────────────────

export async function saveTokens(tokens: SpotifyTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<SpotifyTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Token refresh ────────────────────────────────────────────────────────────

/**
 * Returns a valid access token, refreshing if within the buffer window.
 * Returns null if no tokens are stored (user hasn't connected Spotify).
 * Throws on network failure so callers can surface the reconnect prompt.
 */
export async function getValidAccessToken(clientId: string): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  const needsRefresh = Date.now() >= tokens.expiresAt - REFRESH_BUFFER_MS;
  if (!needsRefresh) return tokens.accessToken;

  const refreshed = await refreshTokens(tokens.refreshToken, clientId);
  await saveTokens(refreshed);
  return refreshed.accessToken;
}

async function refreshTokens(refreshToken: string, clientId: string): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`Spotify token refresh failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const parsed = tokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Spotify token refresh: unexpected response shape');
  }

  return {
    accessToken: parsed.data.access_token,
    // Spotify may or may not return a new refresh token. Keep the old one if absent.
    refreshToken: parsed.data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + parsed.data.expires_in * 1000,
  };
}

// ─── Recap fetch ──────────────────────────────────────────────────────────────

/**
 * Fetch tonight's listening recap from Spotify.
 *
 * Pipeline:
 *   1. GET /v1/me/player/recently-played?limit=50 — raw track list
 *   2. GET /v1/me/top/artists?time_range=short_term&limit=3 — top artists
 *   3. Infer a lightweight mood signal from listening timing and repeats.
 *
 * Returns null if no tracks were found for today (user hasn't listened).
 */
export async function fetchRecap(
  clientId: string,
  dateOverride?: string,
): Promise<SpotifyRecap | null> {
  const accessToken = await getValidAccessToken(clientId);
  if (!accessToken) return null;

  const today = dateOverride ?? toIsoDate(new Date());

  const [recentlyPlayed, topArtists] = await Promise.all([
    fetchRecentlyPlayed(accessToken),
    fetchTopArtists(accessToken),
  ]);

  // Filter to tracks played today (Spotify timestamps are ISO 8601 UTC).
  const todayTracks = recentlyPlayed.filter((t) => t.playedAt.startsWith(today));
  if (todayTracks.length === 0) return null;

  // Rough minutes: assume average track ~3.5 min when duration unavailable.
  const minutesListened = Math.round((todayTracks.length * 3.5 * 60) / 60);

  return {
    date: today,
    trackCount: todayTracks.length,
    minutesListened,
    topTracks: inferTopTracks(todayTracks),
    topArtists,
    moodPhrase: buildMoodPhrase(todayTracks, topArtists),
    averageFeatures: inferAverageFeatures(todayTracks),
  };
}

// ─── Private API helpers ──────────────────────────────────────────────────────

type RecentTrack = { trackId: string; name: string; artistName: string; playedAt: string };
async function fetchRecentlyPlayed(accessToken: string): Promise<RecentTrack[]> {
  const res = await spotifyGet(accessToken, '/me/player/recently-played?limit=50');
  const parsed = recentlyPlayedSchema.safeParse(res);
  if (!parsed.success) return [];

  return parsed.data.items.map((item) => ({
    trackId: item.track.id,
    name: item.track.name,
    artistName: item.track.artists[0]?.name ?? 'Unknown artist',
    playedAt: item.played_at,
  }));
}

async function fetchTopArtists(
  accessToken: string,
): Promise<SpotifyRecap['topArtists']> {
  const res = await spotifyGet(
    accessToken,
    '/me/top/artists?time_range=short_term&limit=3',
  );
  const parsed = topArtistsSchema.safeParse(res);
  if (!parsed.success) return [];

  return parsed.data.items.map((a) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.images[0]?.url,
  }));
}

async function spotifyGet(accessToken: string, path: string): Promise<unknown> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify API ${path} failed (${res.status})`);
  }
  return res.json();
}

// ─── Zod schemas — validate Spotify API responses at the boundary ─────────────

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
});

const recentlyPlayedSchema = z.object({
  items: z.array(
    z.object({
      track: z.object({
        id: z.string(),
        name: z.string(),
        artists: z.array(z.object({ name: z.string() })),
      }),
      played_at: z.string(),
    }),
  ),
});

const topArtistsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      images: z.array(z.object({ url: z.string() })),
    }),
  ),
});

// ─── Utilities ────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function inferTopTracks(tracks: RecentTrack[]): SpotifyRecap['topTracks'] {
  const byId = new Map<string, SpotifyRecap['topTracks'][number]>();
  for (const track of tracks) {
    const existing = byId.get(track.trackId);
    if (existing) {
      existing.playCount += 1;
    } else {
      byId.set(track.trackId, {
        id: track.trackId,
        name: track.name,
        artistName: track.artistName,
        playCount: 1,
      });
    }
  }
  return [...byId.values()].sort((a, b) => b.playCount - a.playCount).slice(0, 5);
}

function buildMoodPhrase(tracks: RecentTrack[], artists: SpotifyRecap['topArtists']): string {
  if (tracks.length === 0) return 'quiet signal';
  const lateNight = tracks.some((track) => Number(track.playedAt.slice(11, 13)) >= 21);
  const repeat = inferTopTracks(tracks)[0]?.playCount ?? 1;
  const anchor = artists[0]?.name ?? tracks[0]?.artistName ?? 'the usual rotation';
  const texture = repeat >= 3 ? 'repeat-loop' : lateNight ? 'late-window' : 'soft-focus';
  return `${texture} ${anchor.toLowerCase()}`;
}

function inferAverageFeatures(tracks: RecentTrack[]): SpotifyRecap['averageFeatures'] {
  if (tracks.length === 0) return { valence: 0.5, energy: 0.5, tempo: 100 };
  const repeat = inferTopTracks(tracks)[0]?.playCount ?? 1;
  const lateNightCount = tracks.filter((track) => Number(track.playedAt.slice(11, 13)) >= 21).length;
  const repeatRatio = repeat / tracks.length;
  const lateRatio = lateNightCount / tracks.length;

  return {
    valence: clamp(0.58 - lateRatio * 0.12 + repeatRatio * 0.08),
    energy: clamp(0.52 + tracks.length / 120 - lateRatio * 0.08),
    tempo: Math.round(96 + Math.min(28, tracks.length * 0.9) - lateRatio * 8),
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
