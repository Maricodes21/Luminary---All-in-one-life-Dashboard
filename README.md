# Luminary

> Personal Growth OS: a nightly ritual for people who want to know themselves better.

Luminary is a mobile-first wellness app organized around a 3-5 minute evening wind-down. It uses Spotify listening history as a passive mood signal, ties that signal to habits and journaling, and builds a longitudinal portrait of a user's inner weather. The current product is an Expo mobile app with Home, Journal, Meals, Health, and Money surfaces around the ritual.

## Current State

As of 2026-07-04, active work is on `codex/design-touchup`.

The app has moved past static prototypes. The mobile workspace now includes:

- A local-first production scaffold backed by persisted Zustand state and a basic sync queue.
- Working Home, Journal, Meals, Health, and Money tabs with richer module interactions.
- A dedicated Settings route for profile, tone, reminders, privacy, units, Spotify, Health Connect, and sync state.
- Spotify recap plumbing that avoids the restricted audio-features endpoint and infers a lightweight mood signal from recently played history.
- Meals backed by a content library with curated, USDA, Open Food Facts, and TheMealDB attribution.
- Health planning backed by a local exercise library, workout completion logging, and staged Health Connect permission flow.
- Money planning with monthly income, budget envelope, category limits, saving-goal contributions, and notification-assisted expense confirmation.
- Supabase migrations through `0008_content_sources_profile_money.sql`.

The branch still needs final verification before being treated as shippable: type-check, lint, content-library tests, Android visual smoke testing, and a review of any uncommitted working-tree changes.

## Repository Layout

```text
multi-app/
|-- mobile/                  Expo React Native app
|-- packages/
|   `-- design-system/       Shared design tokens, theme, typography
|-- supabase/                Database migrations and Supabase config
|-- docs/                    Living plans, mockups, and historical originals
|-- DESIGN.md                Visual design system spec
|-- TONE.md                  Copy and voice bible
|-- ROADMAP.md               Product roadmap and decisions log
|-- PROGRESS.md              Current implementation snapshot
|-- SETUP.md                 Local development setup
`-- AGENT.md                 Working agreement for the coding agent
```

## Quick Start

Prerequisites: Node 20+, npm 10+, Git, Expo tooling, and optionally the Supabase CLI.

```bash
npm install
cp mobile/.env.example mobile/.env
npm run deps:check --workspace=mobile
npm run start --workspace=mobile
```

Useful checks:

```bash
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run test:content --workspace=mobile
```

For Android dev-client launches from the repo root:

```bash
npm run mobile:android:open
```

For Supabase, see `supabase/README.md`.

## Stack

- Mobile: Expo SDK 54, React Native 0.81, React 19, Expo Router 6.
- State: Zustand for local-first client state, TanStack Query for server cache.
- Backend: Supabase Postgres, Auth, RLS, and future Edge Functions.
- Validation: Zod at trust boundaries.
- Storage: Secure Store for Spotify tokens; AsyncStorage for local app state and queues.
- Design: `@luminary/design-system`, Manrope, Inter, one primary blue, no-line rule.

## Documentation Map

- `PROGRESS.md`: start here for the current implementation snapshot.
- `ROADMAP.md`: canonical product phase plan and decisions log.
- `docs/design-touchup-implementation-plan.md`: active branch plan and checkpoint notes.
- `AGENT.md`: co-founder brief, non-negotiables, repo tour, and workflow.
- `DESIGN.md`: visual system rules.
- `TONE.md`: voice rules for user-facing copy.
- `SETUP.md`: local machine setup.

Built by Mari with Codex as co-founder and dev.
