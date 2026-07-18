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
 */

import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import {
  buildDailySpotifyRecap,
  getLocalDateKey,
  mergeSpotifyArtistDetails,
  shouldFetchOlderSpotifyPage,
  type SpotifyArtistDetails,
  type SpotifyPlay,
  type SpotifyRecap,
} from '@/lib/spotifyRecap';

export type { SpotifyRecap } from '@/lib/spotifyRecap';

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
 *   1. Page backward through recently played tracks for the local day.
 *   2. Rank daily songs and primary artists from the same play set.
 *   3. Enrich the three daily artists with Spotify portraits when available.
 *   4. Infer a lightweight mood signal from listening timing and repeats.
 *
 * Returns null if no tracks were found for today (user hasn't listened).
 */
export async function fetchRecap(
  clientId: string,
  dateOverride?: string,
): Promise<SpotifyRecap | null> {
  const accessToken = await getValidAccessToken(clientId);
  if (!accessToken) return null;

  const today = dateOverride ?? getLocalDateKey(new Date());
  const recentlyPlayed = await fetchRecentlyPlayedForDate(accessToken, today);
  const recap = buildDailySpotifyRecap(recentlyPlayed, today);
  if (!recap) return null;

  const artistDetails = await Promise.all(
    recap.topArtists.map((artist) =>
      fetchArtistDetails(accessToken, artist.id).catch(() => ({ id: artist.id })),
    ),
  );

  return mergeSpotifyArtistDetails(recap, artistDetails);
}

// ─── Private API helpers ──────────────────────────────────────────────────────

async function fetchRecentlyPlayedForDate(accessToken: string, targetDate: string): Promise<SpotifyPlay[]> {
  const plays: SpotifyPlay[] = [];
  let pageCount = 0;
  let before: string | undefined;

  do {
    const cursor = before ? `&before=${encodeURIComponent(before)}` : '';
    const res = await spotifyGet(accessToken, `/me/player/recently-played?limit=50${cursor}`);
    const parsed = recentlyPlayedSchema.safeParse(res);
    if (!parsed.success) break;

    const pagePlays = parsed.data.items.flatMap((item): SpotifyPlay[] => {
      const artist = item.track.artists[0];
      const trackId = item.track.id ?? item.track.uri;
      if (!artist || !trackId) return [];
      return [{
        trackId,
        name: item.track.name,
        artist: {
          id: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls.spotify,
        },
        playedAt: item.played_at,
        durationMs: item.track.duration_ms,
        albumImageUrl: item.track.album.images[0]?.url,
        spotifyUrl: item.track.external_urls.spotify,
      }];
    });

    plays.push(...pagePlays);
    pageCount += 1;
    before = parsed.data.cursors.before ?? undefined;
    if (!shouldFetchOlderSpotifyPage(pagePlays, targetDate, !!before, pageCount)) break;
  } while (before);

  return plays;
}

async function fetchArtistDetails(accessToken: string, artistId: string): Promise<SpotifyArtistDetails> {
  const res = await spotifyGet(accessToken, `/artists/${encodeURIComponent(artistId)}`);
  const parsed = artistSchema.safeParse(res);
  if (!parsed.success) return { id: artistId };
  return {
    id: parsed.data.id,
    imageUrl: parsed.data.images[0]?.url,
    spotifyUrl: parsed.data.external_urls.spotify,
  };
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
  cursors: z.object({
    before: z.string().nullable().optional(),
    after: z.string().nullable().optional(),
  }),
  items: z.array(
    z.object({
      track: z.object({
        id: z.string().nullable(),
        uri: z.string().optional(),
        name: z.string(),
        duration_ms: z.number().nonnegative(),
        external_urls: z.object({ spotify: z.string().optional() }),
        album: z.object({ images: z.array(z.object({ url: z.string() })) }),
        artists: z.array(z.object({
          id: z.string(),
          name: z.string(),
          external_urls: z.object({ spotify: z.string().optional() }),
        })),
      }),
      played_at: z.string(),
    }),
  ),
});

const artistSchema = z.object({
  id: z.string(),
  images: z.array(z.object({ url: z.string() })),
  external_urls: z.object({ spotify: z.string().optional() }),
});
