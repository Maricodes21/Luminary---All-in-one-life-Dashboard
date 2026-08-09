type RuntimeConfig = {
  supabaseUrl: string;
  publishableKey: string;
  secretKey: string;
};

type SessionRow = {
  state: string;
  user_id: string;
  authorization_code: string | null;
  provider_error: string | null;
  expires_at: string;
  consumed_at: string | null;
};

const TABLE = 'spotify_preview_oauth_sessions';
const SESSION_TTL_MS = 5 * 60 * 1_000;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const config = createRuntimeConfig({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEYS: Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'),
  SUPABASE_PUBLISHABLE_KEY: Deno.env.get('SUPABASE_PUBLISHABLE_KEY'),
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
  SUPABASE_SECRET_KEYS: Deno.env.get('SUPABASE_SECRET_KEYS'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
});

async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method === 'GET') return handleCallback(request);
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const userId = await authenticate(request);
  if (!userId) return json({ error: 'unauthorized' }, 401);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === 'string' ? body.action : '';
  const state = typeof body?.state === 'string' ? body.state : '';
  if (!validState(state)) return json({ error: 'invalid_state' }, 400);

  if (action === 'start') return startSession(userId, state);
  if (action === 'poll') return pollSession(userId, state);
  return json({ error: 'invalid_action' }, 400);
}

async function startSession(userId: string, state: string): Promise<Response> {
  const expiredFilter = new URLSearchParams({ expires_at: `lt.${new Date().toISOString()}` });
  await serviceRequest(`/rest/v1/${TABLE}?${expiredFilter}`, { method: 'DELETE' });

  const userFilter = new URLSearchParams({
    user_id: `eq.${userId}`,
    consumed_at: 'is.null',
  });
  await serviceRequest(`/rest/v1/${TABLE}?${userFilter}`, { method: 'DELETE' });

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const response = await serviceRequest(`/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ state, user_id: userId, expires_at: expiresAt }),
  });
  if (!response.ok) return json({ error: 'session_start_failed' }, 502);
  return json({ status: 'pending', expiresAt }, 201);
}

async function handleCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? '';
  const code = url.searchParams.get('code');
  const providerError = url.searchParams.get('error');

  if (!validState(state) || (!code && !providerError)) {
    return callbackPage(
      false,
      'This Spotify connection could not be verified. Return to Luminary and try again.',
      400,
    );
  }

  const filters = new URLSearchParams({
    state: `eq.${state}`,
    consumed_at: 'is.null',
    expires_at: `gt.${new Date().toISOString()}`,
    select: 'state',
  });
  const response = await serviceRequest(`/rest/v1/${TABLE}?${filters}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      authorization_code: code?.slice(0, 4096) ?? null,
      provider_error: providerError?.slice(0, 128) ?? null,
    }),
  });
  const rows = response.ok ? ((await response.json().catch(() => [])) as unknown) : [];
  if (!Array.isArray(rows) || rows.length !== 1) {
    return callbackPage(
      false,
      'This connection has expired. Return to Luminary and start again.',
      410,
    );
  }

  if (providerError) {
    return callbackPage(
      false,
      'Spotify was not connected. You can close this page and return to Luminary.',
      200,
    );
  }
  return callbackPage(true, 'Spotify is connected. Tap Done, then return to Luminary.', 200);
}

async function pollSession(userId: string, state: string): Promise<Response> {
  const filters = new URLSearchParams({
    state: `eq.${state}`,
    user_id: `eq.${userId}`,
    select: 'state,user_id,authorization_code,provider_error,expires_at,consumed_at',
    limit: '1',
  });
  const lookup = await serviceRequest(`/rest/v1/${TABLE}?${filters}`);
  const rows = lookup.ok ? ((await lookup.json().catch(() => [])) as SessionRow[]) : [];
  const row = rows[0];
  if (!row) return json({ error: 'session_not_found' }, 404);
  if (row.consumed_at) return json({ error: 'session_consumed' }, 409);
  if (Date.parse(row.expires_at) <= Date.now()) {
    const deleteFilters = new URLSearchParams({
      state: `eq.${state}`,
      user_id: `eq.${userId}`,
    });
    await serviceRequest(`/rest/v1/${TABLE}?${deleteFilters}`, { method: 'DELETE' });
    return json({ error: 'session_expired' }, 410);
  }
  if (!row.authorization_code && !row.provider_error) return json({ status: 'pending' }, 202);

  const consumeFilters = new URLSearchParams({
    state: `eq.${state}`,
    user_id: `eq.${userId}`,
    consumed_at: 'is.null',
    expires_at: `gt.${new Date().toISOString()}`,
    select: 'state',
  });
  const consumed = await serviceRequest(`/rest/v1/${TABLE}?${consumeFilters}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      consumed_at: new Date().toISOString(),
      authorization_code: null,
      provider_error: null,
    }),
  });
  const consumedRows = consumed.ok ? ((await consumed.json().catch(() => [])) as unknown[]) : [];
  if (consumedRows.length !== 1) return json({ error: 'session_consumed' }, 409);
  if (row.provider_error) return json({ error: row.provider_error }, 400);
  if (!row.authorization_code) return json({ error: 'authorization_code_missing' }, 502);
  return json({ status: 'complete', code: row.authorization_code });
}

async function authenticate(request: Request): Promise<string | null> {
  const token = request.headers
    .get('authorization')
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim();
  if (!token) return null;
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as { id?: unknown } | null;
  return typeof body?.id === 'string' && body.id ? body.id : null;
}

function serviceRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${config.supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: config.secretKey,
      Authorization: `Bearer ${config.secretKey}`,
      ...init.headers,
    },
  });
}

function createRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const supabaseUrl = env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const publishableKey =
    firstDictionaryValue(env.SUPABASE_PUBLISHABLE_KEYS) ??
    env.SUPABASE_PUBLISHABLE_KEY?.trim() ??
    env.SUPABASE_ANON_KEY?.trim();
  const secretKey =
    firstDictionaryValue(env.SUPABASE_SECRET_KEYS) ??
    env.SUPABASE_SECRET_KEY?.trim() ??
    env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey || !secretKey)
    throw new Error('missing_supabase_runtime_configuration');
  return { supabaseUrl, publishableKey, secretKey };
}

function firstDictionaryValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.values(parsed).find(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
  } catch {
    return undefined;
  }
}

function validState(state: string): boolean {
  return state.length >= 10 && state.length <= 256 && /^[A-Za-z0-9._~-]+$/.test(state);
}

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
  });
}

function callbackPage(success: boolean, message: string, status: number): Response {
  const color = success ? '#D7EE7A' : '#F1B8A9';
  const title = success ? 'You’re connected' : 'Not connected yet';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Luminary · Spotify</title><style>body{margin:0;background:#101114;color:#f6f3ec;font-family:system-ui,-apple-system,sans-serif;display:grid;min-height:100vh;place-items:center}.card{max-width:34rem;padding:2rem;text-align:center}.mark{display:inline-grid;place-items:center;width:3.5rem;height:3.5rem;border-radius:50%;background:${color};color:#101114;font-size:1.5rem;font-weight:800}h1{font-size:2rem;letter-spacing:-.04em;margin:1.25rem 0 .75rem}p{color:#b9b9b4;font-size:1rem;line-height:1.6;margin:0}</style></head><body><main class="card"><div class="mark">${success ? '✓' : '·'}</div><h1>${title}</h1><p>${message}</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default { fetch: handler };
