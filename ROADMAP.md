# Luminary Roadmap

## Current Status - 2026-07-04

**Active branch:** `codex/design-touchup`

Luminary is past the static-prototype stage. The app has a local-first production scaffold for Home, Journal, Meals, Health, and Money, plus a richer design-touchup working tree that adds Settings, source-backed content libraries, deeper meal planning, workout logging, and monthly money planning.

The current sprint goal is still the same: keep the calm, private Luminary identity while making each module feel like a real assistant surface rather than a shared card-and-form template.

Current working-plan docs:

- `PROGRESS.md` - implementation snapshot.
- `docs/design-touchup-implementation-plan.md` - active branch plan and checkpoint notes.

> MVP definition: all five phases ship for v1.0. The ritual is the heart, but Mari's MVP includes Wallet/Money, Health, and Meals unlocked and functional. Modules are visible from day 1 and deepen through opt-in and personalization.

## Phase 0 - Project Setup & Infrastructure

**Status: Complete.**

- [x] Monorepo scaffold: `mobile`, `packages`, `supabase`.
- [x] Design system package with colors, typography, spacing, radii, elevation, and theme tokens.
- [x] `TONE.md` copy bible.
- [x] Expo SDK 54, React Native 0.81, React 19, Expo Router 6.
- [x] 4-tab navigation plus center ritual FAB.
- [x] Supabase project shape, initial schema, RLS policies, and migration audit.
- [x] Zustand store and TanStack Query setup.
- [x] Manrope and Inter via Expo Google Fonts.
- [ ] CI for lint/type-check/content tests before first beta.

## Phase 1 - Onboarding & Personalization

**Status: Complete - 2026-05-18.**

- [x] Animated welcome and account flow.
- [x] Supabase Auth, not Clerk.
- [x] Profile, avatar/pronouns, body profile, goals, workout preference, and habits.
- [x] Spotify Authorization Code + PKCE.
- [x] Token lifecycle, refresh buffer, recap fetch pipeline, and Zod-validated Spotify responses.
- [x] `mobile/lib/spotify.ts` pure utilities plus `mobile/hooks/useSpotifyAuth.ts` hook.
- [x] Personality tone selection.
- [x] Ready summary and final Supabase write.
- [x] Auth gate in `mobile/app/_layout.tsx`.

## Phase 2 - Core Evening Ritual

**Status: Mostly built; needs final smoke test and Friend Card v0.**

The product heart:

- Spotify recap card from recently played history.
- Mood mapping and confirmation.
- "Not quite right" manual correction path.
- Optional journal prompt and tags.
- Habit check-in with soft streaks.
- Tomorrow habit pauses.
- Night summary card.
- Evening reminder scheduling.
- Offline write queue foundations.

Remaining before closure:

- Friend Card v0 template engine and Home surfacing.
- Current device smoke test for the full ritual path.
- Verify Supabase rows for mood, journal, habits, snapshots, reminders, and queued replay.
- Review empty/error Spotify states.

## Phase 3 - Reflection & Insights

**Status: Partially scaffolded.**

Already present locally:

- Journal timeline.
- Prompt chips and mood tags.
- Trend preview/empty states.

Still to build:

- Search and tag filtering depth.
- Mood trend charts for 7d/30d.
- Weekly review generation.
- Pattern-detection insight cards.
- Friend Card LLM version after template v0 proves useful.

## Phase 4 - Life Modules

**Status: Local-first scaffold plus active design-touchup work.**

### 4a. Money

Implemented or in progress:

- Amount-first expense capture.
- Category budgets and monthly budget envelope.
- Monthly income planning.
- Saving goals and local contribution updates.
- Notification-assisted expense prompts with confirmable category selection.
- Budget visuals and transaction rollups across local and remote data.

Remaining:

- Bank integration decisions.
- Receipt photo capture beyond staged UI.
- Deeper recurring bills and forecasting.

### 4b. Health

Implemented or in progress:

- Health metrics hook and fallback state.
- Health Connect prompt and settings handoff.
- Workout plan generation by category, level, and time.
- A 157-movement exercise library with level/focus-aware weekly variety, plan-safe substitutions, locally bundled instructional visuals, and local workout completion logs.

Remaining:

- Native Health Connect permissions/data wiring.
- Better plan periodization and completion analytics.
- Device QA across Android and iOS.

### 4c. Meals

Implemented or in progress:

- Daily macro targets from body profile.
- Preset search and quick-add logging.
- Meal source attribution.
- Curated starter library plus USDA, Open Food Facts, and TheMealDB positioning.
- Generated weekly meal plans with structured slots, calories, protein, snacks, and substitution hints.
- Camera/barcode/search entry points staged with manual fallback.

Remaining:

- Live barcode lookup.
- Photo meal scan.
- Grocery/prep list export.
- Allergen and dietary preference filtering.

## Phase 5 - Polish & Launch

**Status: Not started.**

- Performance pass: cold start and scroll smoothness.
- Accessibility audit: labels, contrast, touch targets, focus behavior.
- Empty/error/offline hardening.
- Store assets, privacy policy, and beta build process.
- TestFlight/Play beta with 10-20 users.

## Cross-Cutting Commitments

- Ritual-first: every module supports the evening ritual or the user's longitudinal self-understanding.
- Tokens-only styling via `@luminary/design-system`.
- One blue: `palette.primary` is the universal active accent.
- No-line rule: avoid 1px border sectioning.
- Mood is continuous, timestamped, and sourced.
- Soft streaks, never punitive streak loss.
- RLS on every user-scoped Supabase table.
- Personality before polish: every text moment goes through `TONE.md`.

## Decisions Log

- 2026-05-01: 4-tab nav: Home, Journal, Health, Money, plus center ritual FAB. Habits absorbed into Home and the ritual.
- 2026-05-01: Modules visible from day 1. MVP includes all modules unlocked and functional.
- 2026-05-01: Continuous mood signal, not a stored daily headline mood.
- 2026-05-01: Friend Card and Soft Streak added to scope.
- 2026-05-01: Spotify reject CTA is "Not quite right."
- 2026-05-03: `react-native-skia` removed from docs; `react-native-svg` handles icons.
- 2026-05-03: `habit_completions` RLS tightened in migration `0002`.
- 2026-05-03: Branch strategy established: `main` -> `develop` -> `feat/<name>` or `fix/<name>`.
- 2026-05-18: Phase 1 complete. Architectural patterns established: pure `lib/*` utilities plus React hooks, Zod at external boundaries, Metro resolver for aliases on Windows, and workspace-root `App.js` shim.
- 2026-05-18: Phase 2 journal is opt-in after mood confirm/reject; habit check-in gains Tomorrow pauses.
- 2026-06-27: Expo Android dev-client diagnosis confirmed `mobile/app.json` as authoritative config and `app.luminary.mobile` as current package id.
- 2026-06-30: Production modules reached local-first scaffold state; `codex/design-touchup` created to deepen Home, Habits, Meals, Health, Money, and Journal.
- 2026-07-04: Documentation refreshed to reflect Settings, content library, profile/money schema migration `0008`, Spotify audio-features fallback, and current design-touchup verification needs.
- 2026-07-26: Health planning expanded to 157 movements with offline visual atlases and substitutions that never recycle another exercise already scheduled in the same week.
