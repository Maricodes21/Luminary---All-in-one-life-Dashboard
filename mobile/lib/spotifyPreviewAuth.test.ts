import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createSpotifyPreviewConfig,
  startSpotifyPreviewSession,
  waitForSpotifyPreviewCode,
} from './spotifyPreviewAuth';

test('builds the hosted callback from the Supabase project URL', () => {
  assert.deepEqual(createSpotifyPreviewConfig('https://project.supabase.co/'), {
    endpoint: 'https://project.supabase.co/functions/v1/spotify-preview-auth',
    redirectUri: 'https://project.supabase.co/functions/v1/spotify-preview-auth/callback',
  });
  assert.equal(createSpotifyPreviewConfig('http://localhost:54321'), null);
});

test('starts a user-bound preview session with bearer authentication', async () => {
  let request: RequestInit | undefined;
  const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
    request = init;
    return Response.json({ status: 'pending', expiresAt: '2026-08-02T12:05:00Z' }, { status: 201 });
  };

  const result = await startSpotifyPreviewSession({
    endpoint: 'https://project.supabase.co/functions/v1/spotify-preview-auth',
    accessToken: 'user-token',
    state: 'state-value',
    fetcher,
  });

  assert.equal(result.expiresAt, '2026-08-02T12:05:00Z');
  assert.equal((request?.headers as Record<string, string>).Authorization, 'Bearer user-token');
  assert.deepEqual(JSON.parse(String(request?.body)), { action: 'start', state: 'state-value' });
});

test('polls until the callback supplies a one-use authorization code', async () => {
  let polls = 0;
  const fetcher = async () => {
    polls += 1;
    return polls === 1
      ? Response.json({ status: 'pending' }, { status: 202 })
      : Response.json({ status: 'complete', code: 'spotify-code' });
  };

  const code = await waitForSpotifyPreviewCode({
    endpoint: 'https://project.supabase.co/functions/v1/spotify-preview-auth',
    accessToken: 'user-token',
    state: 'state-value',
    fetcher,
    delay: async () => undefined,
  });

  assert.equal(code, 'spotify-code');
  assert.equal(polls, 2);
});

test('surfaces a cancelled Spotify consent without exposing provider details', async () => {
  await assert.rejects(
    waitForSpotifyPreviewCode({
      endpoint: 'https://project.supabase.co/functions/v1/spotify-preview-auth',
      accessToken: 'user-token',
      state: 'state-value',
      fetcher: async () => Response.json({ error: 'access_denied' }, { status: 400 }),
    }),
    /cancelled/,
  );
});
