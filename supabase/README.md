# Supabase

Backend for Luminary — Postgres + Auth + Edge Functions.

## Getting started

Install the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
brew install supabase/tap/supabase    # or scoop install supabase on Windows
```

Initialize a local stack:

```bash
cd supabase
supabase init                # only on first setup; will create config.toml
supabase start               # boots Postgres + Studio + Auth on localhost
supabase db reset            # applies migrations from migrations/
```

After `supabase start`, copy the local URL and anon key into `mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from_supabase_status>
```

## Migrations

Each migration is a numbered SQL file in `migrations/`. The schema follows the
roadmap's Phase 0 spec, extended with our continuous-mood event model.

- `0001_initial_schema.sql` — users, profiles, habits, habit_completions,
  mood_events (timestamped, sourced), spotify_snapshots, journal_entries.

Add new migrations with:

```bash
supabase migration new <name>
```

## Edge functions

Reserved for Phase 3+ — Friend Card generation, weekly review composition.
