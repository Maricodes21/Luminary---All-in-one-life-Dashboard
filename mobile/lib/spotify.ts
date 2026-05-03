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
  topArtists: Array<{ id: string; name: string; imageUrl?: string }>;
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
 *   2. GET /v1/audio-features?ids=... — batch audio features (max 100)
 *   3. GET /v1/me/top/artists?time_range=short_term&limit=3 — top artists
 *   4. Average valence/energy/tempo over valid feature rows
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

  const trackIds = [...new Set(todayTracks.map((t) => t.trackId))];
  const features = await fetchAudioFeatures(accessToken, trackIds);

  const valid = features.filter(
    (f): f is AudioFeatures => f !== null && typeof f.valence === 'number',
  );

  const avgFeatures =
    valid.length > 0
      ? {
          valence: avg(valid.map((f) => f.valence)),
          energy: avg(valid.map((f) => f.energy)),
          tempo: avg(valid.map((f) => f.tempo)),
        }
      : { valence: 0.5, energy: 0.5, tempo: 100 };

  // Rough minutes: assume average track ~3.5 min when duration unavailable.
  const minutesListened = Math.round((todayTracks.length * 3.5 * 60) / 60);

  return {
    date: today,
    trackCount: todayTracks.length,
    minutesListened,
    topArtists,
    averageFeatures: avgFeatures,
  };
}

// ─── Private API helpers ──────────────────────────────────────────────────────

type RecentTrack = { trackId: string; playedAt: string };
type AudioFeatures = { valence: number; energy: number; tempo: number };

async function fetchRecentlyPlayed(accessToken: string): Promise<RecentTrack[]> {
  const res = await spotifyGet(accessToken, '/me/player/recently-played?limit=50');
  const parsed = recentlyPlayedSchema.safeParse(res);
  if (!parsed.success) return [];

  return parsed.data.items.map((item) => ({
    trackId: item.track.id,
    playedAt: item.played_at,
  }));
}

async function fetchAudioFeatures(
  accessToken: string,
  trackIds: string[],
): Promise<(AudioFeatures | null)[]> {
  if (trackIds.length === 0) return [];

  // Spotify audio-features accepts up to 100 IDs.
  const chunks = chunkArray(trackIds, 100);
  const results: (AudioFeatures | null)[] = [];

  for (const chunk of chunks) {
    const res = await spotifyGet(
      accessToken,
      `/audio-features?ids=${chunk.join(',')}`,
    );
    const parsed = audioFeaturesSchema.safeParse(res);
    if (!parsed.success) {
      results.push(...chunk.map(() => null));
      continue;
    }
    for (const f of parsed.data.audio_features) {
      if (!f) {
        results.push(null);
      } else {
        results.push({ valence: f.valence, energy: f.energy, tempo: f.tempo });
      }
    }
  }

  return results;
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
      track: z.object({ id: z.string() }),
      played_at: z.string(),
    }),
  ),
});

const audioFeaturesSchema = z.object({
  audio_features: z.array(
    z
      .object({
        valence: z.number(),
        energy: z.number(),
        tempo: z.number(),
      })
      .nullable(),
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
