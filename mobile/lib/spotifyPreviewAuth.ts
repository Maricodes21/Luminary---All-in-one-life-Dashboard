import { z } from 'zod';

const FUNCTION_NAME = 'spotify-preview-auth';
const POLL_INTERVAL_MS = 1_000;
const MAX_POLL_ATTEMPTS = 120;

const startResponseSchema = z.object({
  status: z.literal('pending'),
  expiresAt: z.string(),
});

const pollResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('complete'), code: z.string().min(1) }),
]);

export type SpotifyPreviewConfig = {
  endpoint: string;
  redirectUri: string;
};

type FetchLike = typeof fetch;

export function createSpotifyPreviewConfig(
  supabaseUrl: string,
  redirectOverride?: string,
): SpotifyPreviewConfig | null {
  const normalizedUrl = supabaseUrl.trim().replace(/\/$/, '');
  if (!normalizedUrl) return null;

  const endpoint = `${normalizedUrl}/functions/v1/${FUNCTION_NAME}`;
  const redirectUri = redirectOverride?.trim() || `${endpoint}/callback`;

  try {
    if (new URL(endpoint).protocol !== 'https:' || new URL(redirectUri).protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }

  return { endpoint, redirectUri };
}

export async function startSpotifyPreviewSession(params: {
  endpoint: string;
  accessToken: string;
  state: string;
  fetcher?: FetchLike;
}): Promise<{ expiresAt: string }> {
  const response = await request(
    params.endpoint,
    params.accessToken,
    {
      action: 'start',
      state: params.state,
    },
    params.fetcher,
  );
  const parsed = startResponseSchema.safeParse(response.body);
  if (!response.ok || !parsed.success) {
    throw new Error(readableBridgeError(response.status, response.body));
  }
  return { expiresAt: parsed.data.expiresAt };
}

export async function waitForSpotifyPreviewCode(params: {
  endpoint: string;
  accessToken: string;
  state: string;
  fetcher?: FetchLike;
  pollIntervalMs?: number;
  maxAttempts?: number;
  delay?: (milliseconds: number) => Promise<void>;
}): Promise<string> {
  const attempts = params.maxAttempts ?? MAX_POLL_ATTEMPTS;
  const delay = params.delay ?? wait;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await request(
      params.endpoint,
      params.accessToken,
      {
        action: 'poll',
        state: params.state,
      },
      params.fetcher,
    );

    const parsed = pollResponseSchema.safeParse(response.body);
    if (response.ok && parsed.success && parsed.data.status === 'complete') {
      return parsed.data.code;
    }
    if (response.status !== 202 || !parsed.success || parsed.data.status !== 'pending') {
      throw new Error(readableBridgeError(response.status, response.body));
    }

    if (attempt < attempts - 1) {
      await delay(params.pollIntervalMs ?? POLL_INTERVAL_MS);
    }
  }

  throw new Error('Spotify took a little too long. You can try connecting again.');
}

async function request(
  endpoint: string,
  accessToken: string,
  body: Record<string, string>,
  fetcher: FetchLike = fetch,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body: responseBody };
}

function readableBridgeError(status: number, body: unknown): string {
  const parsed = z.object({ error: z.string().optional() }).safeParse(body);
  const code = parsed.success ? parsed.data.error : undefined;

  if (status === 401) return 'Please sign in to Luminary before connecting Spotify.';
  if (status === 409 || status === 410)
    return 'That Spotify connection has expired. Please try again.';
  if (code === 'access_denied') return 'Spotify connection was cancelled.';
  if (code === 'invalid_state')
    return 'Spotify could not verify this connection. Please try again.';
  return 'Spotify could not connect just now. Please try again.';
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
