/**
 * Spotify integration shell.
 *
 * Phase 0: stubbed types and helpers. Phase 2 implements PKCE OAuth, token
 * refresh, and the recap fetch. Tokens are stored in expo-secure-store (NEVER
 * AsyncStorage — they're sensitive).
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'luminary.spotify.tokens';

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
};

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

/**
 * Recap shape expected by the Home Spotify card. Built in Phase 2 from
 * /v1/me/player/recently-played + /v1/audio-features + /v1/me/top/artists.
 */
export type SpotifyRecap = {
  date: string; // YYYY-MM-DD
  trackCount: number;
  minutesListened: number;
  topArtists: Array<{ id: string; name: string; imageUrl?: string }>;
  averageFeatures: { valence: number; energy: number; tempo: number };
};

/** Stub. Real implementation: fetch + audio-features + aggregate. */
export async function fetchRecap(_tokens: SpotifyTokens): Promise<SpotifyRecap | null> {
  // TODO Phase 2.
  return null;
}
