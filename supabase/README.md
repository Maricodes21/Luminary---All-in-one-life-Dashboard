# Supabase

Backend for Luminary: Postgres, Auth, RLS, and future Edge Functions.

## Local Stack

Install the Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Windows, if using Scoop
scoop install supabase
```

Start and reset the local stack:

```bash
cd supabase
supabase start
supabase db reset
```

After `supabase start`, copy the local URL and anon key into `mobile/.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from_supabase_status>
```

## Migrations

Migrations live in `supabase/migrations/` and should remain append-only.

| File | Purpose |
|---|---|
| `0001_initial_schema.sql` | Profiles, habits, habit completions, mood events, Spotify snapshots, journal entries, enums, and RLS audit block. |
| `0002_tighten_habit_completions_rls.sql` | Completion writes must reference a habit owned by `auth.uid()`. |
| `0003_habit_pauses.sql` | Per-habit Tomorrow pause records. |
| `0004_profiles_reminder_time.sql` | Reminder hour/minute on profiles. |
| `0005_auth_uid_defaults.sql` | User-scoped tables default `user_id` to `auth.uid()`. |
| `0006_phase3_and_4_schema.sql` | Reflection and life-module expansion. |
| `0007_production_modules.sql` | Health metrics, workout plans, meal plans, expense prompts, transaction imports, and integration consents. |
| `0008_content_sources_profile_money.sql` | Profile settings columns, budget profiles, content sources, food items, and exercise items. |

Add a migration with:

```bash
supabase migration new <name>
```

## Schema Rules

- Every user-scoped table must have RLS enabled and policies scoped to `auth.uid()`.
- Keep the RLS audit pattern from the initial schema in mind when adding new user data.
- Reference/source tables may be globally readable to authenticated users, but writes should stay controlled.
- Client writes should favor local-first behavior and sync queues where the app already supports them.

## Edge Functions

Reserved for Friend Card generation, weekly reviews, and future heavier integrations. The current app uses local/template logic first.
