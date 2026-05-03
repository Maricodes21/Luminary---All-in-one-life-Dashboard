/**
 * useSpotifyAuth — PKCE OAuth flow for Spotify.
 *
 * Uses expo-auth-session to handle the code challenge/verifier and the
 * system browser redirect. On success, exchanges the auth code for tokens
 * and persists them via lib/spotify.ts (expo-secure-store).
 *
 * Required env vars (mobile/.env):
 *   EXPO_PUBLIC_SPOTIFY_CLIENT_ID   — from Spotify Developer Dashboard
 *   EXPO_PUBLIC_SPOTIFY_REDIRECT_URI — e.g. luminary://spotify-auth
 *                                      Must be registered in the Dashboard.
 *
 * Required Spotify scopes:
 *   user-read-recently-played
 *   user-top-read
 *
 * Usage:
 *   const { connect, disconnect, isConnected, isLoading, error } = useSpotifyAuth();
 */

import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { z } from 'zod';
import { saveTokens, loadTokens, clearTokens } from '@/lib/spotify';

// Required for expo-auth-session to handle the redirect on Android.
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SCOPES = ['user-read-recently-played', 'user-top-read'];

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: SPOTIFY_TOKEN_URL,
};

const tokenExchangeSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
});

export type SpotifyAuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'connected' }
  | { status: 'error'; message: string };

export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<SpotifyAuthState>({ status: 'idle' });

  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
  const redirectUri =
    process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI ??
    AuthSession.makeRedirectUri({ scheme: 'luminary', path: 'spotify-callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: SCOPES,
      usePKCE: true,
      redirectUri,
    },
    discovery,
  );

  // Hydrate connected state from stored tokens on mount.
  useEffect(() => {
    loadTokens().then((tokens) => {
      if (tokens) setAuthState({ status: 'connected' });
    });
  }, []);

  // Handle the redirect response from Spotify.
  useEffect(() => {
    if (!response) return;

    if (response.type === 'cancel' || response.type === 'dismiss') {
      setAuthState({ status: 'idle' });
      return;
    }

    if (response.type === 'error') {
      setAuthState({
        status: 'error',
        message: response.error?.message ?? 'Spotify declined the request.',
      });
      return;
    }

    if (response.type === 'success') {
      const { code } = response.params;
      const codeVerifier = request?.codeVerifier;

      if (!code || !codeVerifier) {
        setAuthState({ status: 'error', message: 'Missing auth code or PKCE verifier.' });
        return;
      }

      setAuthState({ status: 'loading' });
      exchangeCodeForTokens({ code, codeVerifier, clientId, redirectUri })
        .then(async (tokens) => {
          await saveTokens(tokens);
          setAuthState({ status: 'connected' });
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Token exchange failed.';
          setAuthState({ status: 'error', message });
        });
    }
  }, [response, request, clientId, redirectUri]);

  const connect = useCallback(async () => {
    if (!clientId) {
      setAuthState({
        status: 'error',
        message: 'EXPO_PUBLIC_SPOTIFY_CLIENT_ID is not set.',
      });
      return;
    }
    setAuthState({ status: 'loading' });
    await promptAsync();
  }, [promptAsync, clientId]);

  const disconnect = useCallback(async () => {
    await clearTokens();
    setAuthState({ status: 'idle' });
  }, []);

  return {
    connect,
    disconnect,
    isConnected: authState.status === 'connected',
    isLoading: authState.status === 'loading',
    error: authState.status === 'error' ? authState.message : null,
    /** True once expo-auth-session has built the PKCE request and is ready. */
    ready: !!request,
  };
}

// ─── Token exchange ────────────────────────────────────────────────────────────

async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const parsed = tokenExchangeSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Token exchange: unexpected response shape from Spotify.');
  }

  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000,
  };
}
