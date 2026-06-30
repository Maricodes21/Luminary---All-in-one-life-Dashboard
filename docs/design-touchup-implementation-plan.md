# Luminary Design Touchup Implementation Plan

Date: 2026-06-30
Branch: `codex/design-touchup`

## Current State

Luminary has moved past the static prototype stage. The mobile app now has a working local-first scaffold for Home, Journal, Meals, Health, and Money, backed by persisted Zustand state, Supabase schema work, and module-specific helper libraries.

The next sprint is a product retouch: keep the calm, private, dark Luminary identity, but make each module feel like a real assistant surface rather than a shared card-and-form template.

## Design Goal

Make Luminary feel like a quiet life operating system:

- Home orchestrates the day and routes the user to the right module.
- Journal feels reflective, private, and emotionally intelligent.
- Meals feels visual, searchable, and fast to log.
- Health feels connected to body data and action-oriented workouts.
- Money feels scannable, calm, and easy to capture in the moment.

## Implementation Principles

- Keep the existing local-first architecture; deepen flows before adding backend dependencies.
- Use reusable module primitives: bottom sheets, action rows, preset cards, visual thumbnails, empty states, and connection prompts.
- Prefer progressive disclosure over long inline forms.
- Add visuals where the content benefits from recognition: meals, workouts, money categories, and habit categories.
- Preserve the design-system token rules in `DESIGN.md`.
- Validate each phase with `npm run type-check --workspace=mobile`, then lint when the touched surface is stable.

## Phase 1: Foundation And Navigation

Scope:

- Add a profile/settings entry point to Home.
- Create a settings hub for profile, Spotify, Health Connect, notification preferences, body profile, privacy, and module settings.
- Add reusable interaction primitives:
  - module header with connection chips
  - bottom sheet style modal
  - suggestion card
  - quick action tile
  - empty state card
  - visual thumbnail card

Acceptance criteria:

- Home has a visible profile/settings affordance.
- Spotify and Health Connect states are visible even when disconnected.
- No module relies on hidden setup knowledge.
- Shared primitives use design-system tokens and avoid hard-coded visual values.

## Phase 2: Home And Habits Retouch

Scope:

- Replace inline habit creation with an Add Habit flow.
- Add category-based habit suggestions:
  - Morning
  - Body
  - Mind
  - Home
  - Money
  - Sleep
  - Social
- Show habit presets with icon, cadence, estimated time, and add action.
- Add daily status modules: today focus, next meal, workout suggestion, spending pulse, journal prompt, and sync state.

Acceptance criteria:

- A user can add habits from suggested categories without typing.
- Existing custom habit editing remains possible.
- Home no longer feels empty when Spotify is disconnected.
- The screen still fits within mobile viewport constraints without crowding.

## Phase 3: Meals Retouch

Scope:

- Keep daily targets and macro progress.
- Remove unnecessary goal subtext.
- Replace the basic meal form with a real logging module:
  - search foods or meals
  - quick add presets
  - recent meals
  - camera meal scan entry point
  - barcode scan entry point
  - manual entry fallback
- Redesign weekly plan as a separate planning surface with generated days, meal images, substitutions, locked favorites, and grocery/prep summary.

Acceptance criteria:

- Logging a meal feels possible through at least three paths: preset, manual, and scan/search stub.
- Meal cards show useful visual hierarchy: meal type, calories, macros, and optional image.
- Weekly plan opens into a dedicated planning flow rather than feeling like static text.

## Phase 4: Health Retouch

Scope:

- Strengthen the Health Connect prompt with permission state and clear connect action.
- Turn weekly setup into a workout planner:
  - goal
  - category
  - level
  - equipment
  - time available
  - generated day plan
- Add workout day detail cards with exercise suggestions, thumbnails, sets/reps/time, substitute action, and completion state.

Acceptance criteria:

- Health Connect setup is actionable, not informational only.
- Generated plans expose actual exercises for each day.
- Users can substitute suggested workouts or exercises.
- Fallback state remains useful without live health metrics.

## Phase 5: Money And Journal Polish

Scope:

- Money:
  - replace long inline expense form with quick-add expense sheet
  - amount-first entry
  - merchant, category, date, note, and receipt photo stub
  - improve budget visuals and transaction confirmation cards
  - make notification assist feel like a confirmable suggested transaction
- Journal:
  - add prompt chips, mood tags, and better entry cards
  - make Trends useful before enough data exists with locked preview states
  - keep the restrained "inner weather" voice

Acceptance criteria:

- Adding an expense takes fewer visible steps than the current form.
- Money has visual budget/category distinction.
- Journal retains its calm tone while gaining useful prompts and trend affordances.

## Phase 6: Visual QA And Hardening

Scope:

- Run type-check and lint.
- Smoke-test the app on Android emulator.
- Capture screenshots for Home, Journal, Meals, Health, and Money.
- Check small-screen text fit, bottom tab overlap, touch targets, empty states, and disconnected integration states.
- Update docs with final implementation notes and known follow-ups.

Acceptance criteria:

- `npm run type-check --workspace=mobile` passes.
- `npm run lint --workspace=mobile` passes or has documented environment-only blockers.
- Screens are visually checked in connected and disconnected states where practical.
- Roadmap reflects what shipped and what remains.

## Proposed Commit Sequence

1. `docs: plan design touchup sprint`
2. `feat: add profile settings and home connection states`
3. `feat: add habit suggestion flow`
4. `feat: retouch meal logging and planner`
5. `feat: retouch health planner and exercise substitutions`
6. `feat: retouch money quick add and journal prompts`
7. `chore: polish mobile touchup docs and qa notes`

