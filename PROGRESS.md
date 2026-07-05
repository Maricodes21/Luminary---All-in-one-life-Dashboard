# Luminary - Progress Snapshot

> As of 2026-07-04. Open this first, then use `ROADMAP.md` for phase scope and `docs/design-touchup-implementation-plan.md` for the active branch plan.

## TL;DR

Luminary is in the `codex/design-touchup` sprint. Phase 0 and Phase 1 are complete. Phase 2 is functionally scaffolded, with ritual flows, offline queue foundations, reminders, and local-first state in place, but it still needs a fresh device smoke test and Friend Card closeout before being called fully closed. Phase 4 life modules are no longer blank or placeholder-only: Meals, Health, and Money now have local-first working surfaces and deeper in-branch interaction work.

The current working tree includes uncommitted design-touchup work. Treat the state below as "implemented in branch/working tree" until the verification checklist passes and the changes are committed.

## Phase Status

| Phase | Scope | Status | Notes |
|---|---|---|---|
| 0 - Setup & Infra | Monorepo, design system, Supabase schema, navigation shell | Complete | Baseline scaffold is committed. |
| 1 - Onboarding & Personalization | 10-screen onboarding, Spotify PKCE, auth gate | Complete | Closed 2026-05-18. |
| 2 - Core Evening Ritual | Recap, mood, journal, habits, summary, reminders, offline | Mostly built | Needs current device smoke test, Friend Card v0, and review. |
| 3 - Reflection & Insights | Journal list, prompts, trends, insight cards | Partially scaffolded | Journal timeline and prompt affordances exist locally; deeper insight logic remains. |
| 4 - Life Modules | Meals, Health, Money | Local-first scaffold plus touchup WIP | Module UX is active, not backend-blocked. |
| 5 - Polish & Launch | Performance, accessibility, stores, beta | Not started | Begins after module and ritual verification. |

## Current Branch: `codex/design-touchup`

Committed baseline:

- `docs: plan design touchup sprint`
- `feat: retouch mobile module experiences`

Working-tree additions observed 2026-07-04:

- `mobile/app/settings.tsx`: profile/settings hub for identity, tone, reminders, privacy, metric units, Spotify, Health Connect, sync queue, and sign-out.
- `mobile/lib/contentLibrary.ts`: attributed starter library for meals, substitutions, exercises, source summaries, and budget plan calculation.
- `mobile/lib/contentLibrary.test.ts` plus `mobile/scripts/run-content-tests.cjs`: Node test coverage for search, suggestions, workout alternatives, budget calculations, and source summaries.
- `supabase/migrations/0008_content_sources_profile_money.sql`: profile settings columns, `budget_profiles`, `content_sources`, `food_items`, and `exercise_items`.
- Production store expansion for profile settings, richer meal plans, workout logs, monthly money plan, budget updates, saving-goal contributions, and sync queue entities.
- Spotify recap fallback that avoids the restricted audio-features endpoint and infers average features from listening patterns.

## Product Surfaces

Home:

- Daily command center with profile/settings entry, Spotify and Health Connect connection states, category-based habit suggestions, and cross-module glance cards.
- Quick tiles route into Meals, Health, Money, and Settings.

Journal:

- Local timeline, prompt chips, mood tags, richer entry cards, and trend preview states.
- Voice notes remain staged for a later phase.

Meals:

- Macro targets from body profile, visual daily progress, quick-add meal sheet, search, curated presets, photo/barcode staged entry points, and generated weekly planning.
- Meal data now carries source attribution and provider ids where available.

Health:

- Steps and workout metrics hook, Health Connect setup surface, workout plan generation, exercise cards, substitutions, and local workout completion logs.
- Native Health Connect permissions are staged through Android settings until a native permission integration lands.

Money:

- Amount-first expense capture, receipt/date staged affordances, category budgets, monthly income and budget envelope, saving-goal contributions, notification-assisted prompt confirmation, and local/remote transaction rollup.

Ritual:

- Core sequence remains the product heart: Spotify recap, mood confirm or correction, optional journal, habit check-in, Tomorrow pauses, and night summary.
- Still needs a current end-to-end device smoke test and Friend Card v0 templates before Phase 2 can be declared closed.

## Database

Migrations now include:

| File | Purpose |
|---|---|
| `0001_initial_schema.sql` | Profiles, habits, completions, mood events, Spotify snapshots, journal entries, mood enums, RLS audit. |
| `0002_tighten_habit_completions_rls.sql` | Tightens completion writes to owned habits. |
| `0003_habit_pauses.sql` | Tomorrow pause toggles for habits. |
| `0004_profiles_reminder_time.sql` | Reminder hour and minute on profiles. |
| `0005_auth_uid_defaults.sql` | Defaults user-scoped writes to `auth.uid()`. |
| `0006_phase3_and_4_schema.sql` | Reflection and life-module schema expansion. |
| `0007_production_modules.sql` | Health metrics, workout plans, meal plans, expense prompts, imports, consents. |
| `0008_content_sources_profile_money.sql` | Profile settings, budget profiles, content sources, food items, exercise items. |

## Verification Needed

Run before calling the branch shippable:

```bash
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run test:content --workspace=mobile
npm run deps:check --workspace=mobile
```

Then smoke-test on Android:

```bash
npm run mobile:android:open
```

Manual smoke path:

1. Launch Home and open Settings.
2. Save reminder, tone, privacy, and unit changes.
3. Connect or refresh Spotify from Home/Settings and verify the empty/connected states.
4. Add a habit from suggestions and custom input.
5. Log a meal via preset and manual fallback; generate the weekly plan.
6. Create and complete a Health workout plan.
7. Add expense, edit monthly budget, confirm a notification prompt, and contribute to a saving goal.
8. Run the ritual end to end, including mood correction and optional journal.

## Known Follow-Ups

- Friend Card v0 template engine and Home surfacing.
- Native Health Connect permission and data integration beyond the staged settings handoff.
- Real food barcode/photo scan integrations after the local fallback path is stable.
- CI for type-check, lint, and content tests.
- Accessibility and small-screen QA across all retouched modules.
- Review the screenshot folder churn before commit.
