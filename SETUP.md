# Local Setup

This repo is already initialized and connected to GitHub. Use this file for day-to-day local setup, not for first-ever scaffold creation.

## Requirements

- Node 20+
- npm 10+
- Git
- Expo tooling via workspace scripts
- Android Studio/emulator for Android testing
- Supabase CLI if you are working on database migrations

## Install Dependencies

From the repo root:

```powershell
npm install
```

The repo uses npm workspaces, so this installs the root workspace, `mobile`, and `packages/*`.

## Environment

Create the mobile environment file:

```powershell
Copy-Item mobile\.env.example mobile\.env
```

Fill in:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=
EXPO_PUBLIC_SPOTIFY_REDIRECT_URI=luminary://spotify-callback
```

Use local Supabase values from `supabase status` when running a local backend.

The grounded food fallback runs only in Supabase Edge Functions. Configure these as server secrets, never as `EXPO_PUBLIC_` values:

```text
FIRECRAWL_API_KEY=
FOOD_WEB_RETRIEVAL_ENABLED=false
```

Keep retrieval disabled until the source allowlist, quota, and pilot monitoring are ready. When disabled or out of quota, food search falls back to provider results and manual entry.

## Run The App

```powershell
npm run start --workspace=mobile
```

For a clean Metro cache:

```powershell
npm run mobile:clear
```

For Android dev-client open behavior from the repo root:

```powershell
npm run mobile:android:open
```

The authoritative Expo config is `mobile/app.json`. The current package id is `app.luminary.mobile`.

## Checks

Run these before treating a branch as ready:

```powershell
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run test:content --workspace=mobile
npm run test:meals --workspace=mobile
npm run test:meals:backend
npm run test:personalization:backend
npm run test:spotify:backend
npm run deps:check --workspace=mobile
```

`npm run deps:check --workspace=mobile` uses Expo's SDK pin validation. If dependency resolution looks strange after a lockfile change, run `npm install` from the repo root before trusting TypeScript noise.

## Supabase

```powershell
npm run supabase:start
npm run supabase:db:reset
```

`supabase db reset` applies every SQL file under `supabase/migrations/`.

## Branches

Current convention:

- `main`: stable baseline.
- `develop`: integration baseline.
- `feat/<name>` and `fix/<name>`: feature/fix work.
- `preview/mobile`: combined field-test build.
- `docs/<name>`: release and product documentation.

Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
