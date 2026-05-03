# Luminary

> Personal Growth OS — a nightly ritual for the people who want to know themselves better.

Luminary is a mobile-first wellness app organized around a 3–5 minute evening wind-down. It uses Spotify listening history as a passive mood signal, ties it to habits and journaling, and quietly builds a longitudinal portrait of a user's inner weather. Six modules — Home, Journal, Health, Money, Habits, Meals — sit beneath one consistent voice.

## Repository layout

```
multi-app/
├── mobile/                  Expo (React Native) app — the product
├── packages/
│   └── design-system/       Shared design tokens, theme, typography
├── supabase/                Database migrations + edge functions
├── docs/                    Design assets, mockups, originals
├── DESIGN.md                Visual design system spec
├── TONE.md                  Copy + voice bible
├── ROADMAP.md               5-phase build plan
└── README.md                You are here
```

## Quick start

Prerequisites: Node 20+, npm 10+, Git, Expo CLI (`npm i -g expo-cli` optional).

```bash
# from repo root
npm install                    # installs all workspaces

# run the mobile app
cd mobile
cp .env.example .env           # fill in Supabase + Spotify credentials
npm run deps:check             # validates SDK-pinned versions (one-time after install)
npm run start                  # opens Expo dev server
```

For the Supabase backend, see `supabase/README.md`.

## Tech stack

- **Mobile:** React Native 0.81 + Expo SDK 54, Expo Router 6 (file-based), React 19
- **State:** Zustand (client) + TanStack Query (server cache)
- **Backend:** Supabase (Postgres + Auth + RLS) + Edge Functions
- **Auth:** Email/password + Google OAuth + Apple Sign-In
- **Spotify:** OAuth Authorization Code + PKCE; mood mapping via audio features
- **Health:** Apple Health + Google Fit
- **Validation:** Zod
- **Animations:** react-native-reanimated (worklets plugin) + expo-blur (glassmorphism)
- **Type safety:** TypeScript strict mode

## Architecture principles

1. **Ritual-first.** The nightly check-in is the product. Every module supports or enriches it.
2. **No-line rule.** Boundaries via background color shifts, never 1px borders. See `DESIGN.md`.
3. **Tokens everywhere.** Colors, spacing, radii, type — all routed through `@luminary/design-system`. No inline magic numbers.
4. **Personality is non-negotiable.** Every text moment runs through `TONE.md` voice.
5. **Soft streaks.** Habit consistency is a band, not a binary. We don't punish a missed day.
6. **Mood as continuous signal.** Stored as timestamped events with source (`spotify` / `manual` / `journal_inferred`), not as a daily snapshot.

## Status

Phase 0 (project setup) — in progress. See `ROADMAP.md` for the full plan.

---

Built by Mari with Claude as co-founder + dev.
