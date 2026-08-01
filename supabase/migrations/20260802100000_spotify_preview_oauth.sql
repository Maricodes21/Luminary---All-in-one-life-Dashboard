-- Short-lived handoff for Spotify PKCE when Luminary is running inside Expo Go.
-- Authorization codes are consumed once; Spotify tokens and PKCE verifiers never reach the server.

create table if not exists public.spotify_preview_oauth_sessions (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  authorization_code text,
  provider_error text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz,
  constraint spotify_preview_oauth_state_valid
    check (char_length(state) between 10 and 256 and state ~ '^[A-Za-z0-9._~-]+$'),
  constraint spotify_preview_oauth_result_valid
    check (not (authorization_code is not null and provider_error is not null)),
  constraint spotify_preview_oauth_expiry_valid
    check (expires_at > created_at)
);

create index if not exists spotify_preview_oauth_sessions_user_expiry_idx
  on public.spotify_preview_oauth_sessions (user_id, expires_at desc);

alter table public.spotify_preview_oauth_sessions enable row level security;

revoke all on table public.spotify_preview_oauth_sessions from anon, authenticated;
grant select, insert, update, delete on table public.spotify_preview_oauth_sessions to service_role;

comment on table public.spotify_preview_oauth_sessions is
  'Service-only, short-lived Spotify OAuth code handoff for Expo Go previews.';
