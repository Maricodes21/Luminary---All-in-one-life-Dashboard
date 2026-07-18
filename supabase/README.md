# Supabase

Backend for Luminary: Postgres, Auth, RLS, and Edge Functions.

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

| File                                            | Purpose                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `0001_initial_schema.sql`                       | Profiles, habits, habit completions, mood events, Spotify snapshots, journal entries, enums, and RLS audit block. |
| `0002_tighten_habit_completions_rls.sql`        | Completion writes must reference a habit owned by `auth.uid()`.                                                   |
| `0003_habit_pauses.sql`                         | Per-habit Tomorrow pause records.                                                                                 |
| `0004_profiles_reminder_time.sql`               | Reminder hour/minute on profiles.                                                                                 |
| `0005_auth_uid_defaults.sql`                    | User-scoped tables default `user_id` to `auth.uid()`.                                                             |
| `0006_phase3_and_4_schema.sql`                  | Reflection and life-module expansion.                                                                             |
| `0007_production_modules.sql`                   | Health metrics, workout plans, meal plans, expense prompts, transaction imports, and integration consents.        |
| `0008_content_sources_profile_money.sql`        | Profile settings columns, budget profiles, content sources, food items, and exercise items.                       |
| `20260713192430_personalized_meals.sql`         | Nutrition history, normalized food provenance, recipes, plan entries, feedback, AI telemetry, and Meals RLS.      |
| `20260714153000_harden_authenticated_api.sql`   | Fixed function search paths and authenticated-only Meals API access.                                              |
| `20260714154000_enforce_role_privileges.sql`    | Least-privilege grants for logs, plans, submissions, catalogs, and service-only caches.                           |
| `20260714155000_optimize_meals_rls_indexes.sql` | Cached auth evaluation and covering indexes for Meals foreign keys.                                               |

Add a migration with:

```bash
supabase migration new <name>
```

Validate a linked deployment before applying it:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

## Schema Rules

- Every user-scoped table must have RLS enabled and policies scoped to `auth.uid()`.
- Keep the RLS audit pattern from the initial schema in mind when adding new user data.
- Reference/source tables may be globally readable to authenticated users, but writes should stay controlled.
- Client writes should favor local-first behavior and sync queues where the app already supports them.

## Edge Functions

`meals-api` is the authenticated gateway for food search, barcode lookup, community submissions,
meal-photo analysis, daily suggestions, plan generation, substitutions, and recipe images.

Deploy it with:

```bash
supabase functions deploy meals-api
```

The deployed fallback configuration uses Open Food Facts plus USDA FoodData Central and keeps AI
disabled when Ollama credentials are absent. To enable hosted Gemma, set `MEALS_AI_MODE=cloud`,
`MEALS_AI_MODEL=gemma4:31b-cloud`, `OLLAMA_CLOUD_URL`, and `OLLAMA_API_KEY` as function secrets, then
redeploy. Never put those secrets in the mobile app.

## Meal Vision Benchmark

The reproducible Nutrition5k benchmark lives in `benchmarks/meal-vision/`:

```bash
npm run test:meals:backend
npm run benchmark:meal-vision
```

Qwen is eligible only if it improves ingredient-recognition F1 by at least 10 percentage points
without worse schema validity, request reliability, or usage tier. See
`../docs/benchmarks/meal-vision-2026-07-14.md` for the current result.
