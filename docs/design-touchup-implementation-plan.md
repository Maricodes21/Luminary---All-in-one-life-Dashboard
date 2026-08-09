# Luminary Design Touchup Implementation Plan

Date started: 2026-06-30
Last updated: 2026-07-04
Historical branch: `archive/design-touchup`

## Current State

Luminary has moved past the static prototype stage. The mobile app has a working local-first scaffold for Home, Journal, Meals, Health, and Money, backed by persisted Zustand state, Supabase schema work, and module-specific helper libraries.

The design touchup sprint deepens these surfaces without throwing away the local-first architecture. The current working tree includes a second pass beyond the committed retouch baseline: Settings route, content library, profile settings, richer meal and workout planning, monthly money planning, and schema migration `0008`.

## Execution Checkpoints

### 2026-06-30 - First Implementation Pass

Shipped in the committed pass:

- Shared `ActionSheet` and `QuickActionTile` primitives.
- Expanded icon set for settings, capture, search, scan, planning, substitutions, and receipts.
- Curated module presets for habits, meals, workouts, journal prompts, and money categories.
- Home profile/settings entry, integration cards, category-based habit suggestions, and cross-module glance cards.
- Meal logging sheet with search, presets, camera/barcode entry points, manual fallback, meal thumbnails, and planner sheet.
- Health Connect action sheet, workout planner controls, visual workout hero, exercise cards, and substitute actions.
- Money amount-first expense sheet, receipt/date affordances, scannable budget cards, and transaction confirmation styling.
- Journal prompt chips, mood tags, richer entry cards, and a trend preview state.

Validation recorded at the time:

```bash
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
```

### 2026-07-04 - Working Tree State

Implemented or in progress:

- Dedicated `mobile/app/settings.tsx` route for profile, tone, reminders, privacy, units, Spotify, Health Connect, sync queue, and sign-out.
- Home routes profile/settings and module quick tiles to real screens.
- Spotify recap no longer depends on the restricted audio-features endpoint and is now limited to attributed listening facts. Mood estimation uses Luminary-owned signals only.
- `mobile/lib/contentLibrary.ts` introduces attributed starter data for food, exercise, substitutions, source summaries, and budget-plan math.
- Meals uses source-backed presets, attribution labels, structured weekly plan slots, snacks, substitution hints, and scan/barcode staged fallbacks.
- Health shows exercise source policy, stages Health Connect permissions through Android settings, and records completed workouts locally.
- Money supports income/budget editing, category limits, monthly plan math, saving-goal contributions, and categorized notification prompt confirmation.
- `supabase/migrations/0008_content_sources_profile_money.sql` adds profile settings columns, budget profiles, content sources, food items, and exercise items.
- `mobile/lib/contentLibrary.test.ts` plus `mobile/scripts/run-content-tests.cjs` add focused tests for the new content and budgeting helpers.

Still to verify:

- Type-check, lint, content tests, and Expo dependency check on the current working tree.
- Android emulator visual smoke test for Settings, Home, Journal, Meals, Health, Money, and the ritual.
- Screenshot folder churn before commit.
- Whether any local state migration is needed for existing persisted `luminary.production.store` users.

## Design Goal

Make Luminary feel like a quiet life operating system:

- Home orchestrates the day and routes the user to the right module.
- Journal feels reflective, private, and emotionally intelligent.
- Meals feels visual, searchable, attributed, and fast to log.
- Health feels connected to body data and action-oriented workouts.
- Money feels scannable, calm, and easy to capture in the moment.
- Settings feels like a private control room, not a generic account screen.

## Implementation Principles

- Keep the existing local-first architecture; deepen flows before adding backend dependencies.
- Prefer staged integrations with honest manual fallbacks over pretending the native path is complete.
- Use reusable module primitives: bottom sheets, quick action rows, preset cards, empty states, and connection prompts.
- Preserve the design-system token rules in `DESIGN.md`.
- Keep user-facing copy in the Luminary voice from `TONE.md`.
- Validate each meaningful pass with type-check, lint, and focused tests.

## Phase 1: Foundation And Navigation

Status: implemented.

Scope:

- Add profile/settings entry point to Home.
- Create settings hub for profile, Spotify, Health Connect, notification preferences, body profile, privacy, and module settings.
- Add reusable interaction primitives.

Current notes:

- Settings is now a route rather than an inline sheet.
- Sync queue, Spotify, Health Connect, reminder time, privacy mode, and units are visible.

## Phase 2: Home And Habits Retouch

Status: implemented, pending QA.

Scope:

- Category-based habit suggestions.
- Daily status modules for meals, movement, spend, and sync.
- Home connection states for Spotify and Health Connect.

Current notes:

- Spotify connected-but-empty state has clearer copy.
- Home module tiles route into their owning tabs.

## Phase 3: Meals Retouch

Status: implemented, pending QA.

Scope:

- Search/preset/manual meal logging.
- Scan and barcode staged entry points.
- Source attribution.
- Structured weekly plan.

Current notes:

- Meal presets now come from `contentLibrary`.
- Weekly plans use structured slots instead of plain text.
- Live scan/barcode lookup is not wired yet.

## Phase 4: Health Retouch

Status: implemented, pending QA.

Scope:

- Health Connect prompt and permission state.
- Workout planning controls.
- Exercise suggestions, substitution, and completion.

Current notes:

- Health Connect permission flow currently opens Android settings as a staged handoff.
- Completed workouts write to local production state and sync queue.

## Phase 5: Money And Journal Polish

Status: implemented for Money, partial for Journal, pending QA.

Scope:

- Money quick-add expense sheet.
- Income and budget planning.
- Notification-assisted transaction confirmation.
- Journal prompt chips, mood tags, richer cards, and trend preview states.

Current notes:

- Money has the deepest second-pass work in the current tree.
- Journal still needs deeper insight logic beyond prompt/trend affordances.

## Phase 6: Visual QA And Hardening

Status: pending.

Checklist:

```bash
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run test:content --workspace=mobile
npm run deps:check --workspace=mobile
```

Manual checks:

- Home and Settings navigation.
- Settings save path with and without a Supabase session.
- Spotify disconnected, connected-empty, and recap states.
- Meal preset/manual logging and weekly plan generation.
- Health permission handoff, plan generation, substitution, and workout completion.
- Money expense capture, budget editing, prompt logging, and saving-goal contribution.
- Journal prompt/tag/card rendering.
- Ritual end-to-end path.

## Proposed Commit Sequence From Here

1. `docs: refresh luminary current state`
2. `feat: add settings and source-backed module planning`
3. `test: cover content library helpers`
4. `chore: qa design touchup screens`
