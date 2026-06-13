# Luminary — Progress Snapshot

> **As of 2026-05-24.** A jumping-off point — open this first when you come back, then read whichever doc the next move points to.

---

## TL;DR

Phase 0 and Phase 1 are done. **Phase 2 (the nightly ritual) is mostly built — six of the nine stages from the kickoff prompt are implemented and wired together end-to-end.** What's left is the Friend Card upgrade, a real smoke test on device, and Mari's review pass before declaring Phase 2 closed and opening Phase 3.

---

## Phase status

| Phase | Scope | Status | Closed |
|---|---|---|---|
| **0 — Setup & Infra** | Monorepo, design system, Supabase schema, navigation skeleton | ✅ Complete | scaffold done |
| **1 — Onboarding & Personalization** | 10-screen flow, Spotify PKCE, auth gate, onboarding store | ✅ Complete | 2026-05-18 |
| **2 — Core Evening Ritual** | Recap → mood → journal → habits → summary, push notifs, offline | 🟡 ~80% built — needs smoke test + Friend Card pass | — |
| **3 — Reflection & Insights** | Journal list, mood charts, weekly review, insight cards | ⏳ Not started | — |
| **4 — Life Modules** | Wallet · Health · Meals (unlocked for v1.0) | ⏳ Not started | — |
| **5 — Polish & Launch** | Perf, a11y, store assets, TestFlight beta | ⏳ Not started | — |

---

## Phase 2 — what's in vs. what's left

### Built and wired

| Stage | Where it lives | Notes |
|---|---|---|
| Spotify recap card | `mobile/components/ritual/RecapCard.tsx`, `mobile/hooks/useSpotifyRecap.ts` | Also surfaced on Home as `SpotifyHomeCard` in `(tabs)/index.tsx` |
| Mood mapping (valence × energy → 15 labels) | `mobile/lib/mood.ts` | 9-zone algorithm with confidence scores; `moodCopy` map for display / verb / band |
| Mood confirm + reject | `mobile/components/ritual/MoodConfirm.tsx`, `MoodChipGrid.tsx` | "Not quite right" CTA opens chip grid; writes to `mood_events` |
| Journal step (opt-in) | `mobile/components/ritual/JournalStep.tsx` | Reached only if user taps "Yes" after mood; rotating prompt + tag chips |
| Habit check-in + soft streaks | `mobile/components/ritual/HabitCheckin.tsx`, `mobile/lib/streak.ts` | Bronze/silver/gold bands over a 7-day window; optimistic toggles + haptics |
| "Tomorrow" pause section | Inside `HabitCheckin.tsx`, migration `0003_habit_pauses.sql` | Per-habit, per-date pause via `habit_pauses` table |
| Night summary card | `mobile/app/ritual/summary.tsx` | Schedules next reminder on close, then `router.replace('/(tabs)')` |
| Push notifications | `mobile/lib/notifications.ts`, migration `0004_profiles_reminder_time.sql` | Default 21:00, configurable; cancel-and-replace pattern via stable notification id |
| Offline write queue | `mobile/lib/offlineQueue.ts`, `mobile/hooks/useOfflineSync.ts` | Flushes on foreground; auth.uid() defaults (migration `0005`) make replay work cleanly |
| Ritual store | `mobile/stores/useRitualStore.ts` | Ephemeral by design — `recap` uses three-value sentinel (`undefined` / `null` / data) |

### Still to do before Phase 2 closes

- **Friend Card uplift.** Home shows the placeholder note ("A quiet start. The week is still yours."). Templates-driven copy is the MVP target; the LLM version is post-MVP.
- **End-to-end smoke test.** Run the full ritual on device — login → ritual button → recap → mood (both paths) → optional journal → habits + Tomorrow → summary → reminder rescheduled. Confirm Supabase rows land in the expected tables.
- **Empty / error state pass.** Verify the "no music today" and Spotify-error branches behave gracefully (the orchestrator has the branches; need eyes on copy and offered escape routes).
- **Mari's review.** The IDE agent's Phase 2 diff hasn't been reviewed end-to-end yet. Worth a focused read before declaring done.

---

## The product, in one breath

A calm "day surface" (Home) with the nightly ritual hidden behind a center FAB. The ritual reads what the user actually listened to today, infers a mood, lets them confirm or correct it, optionally journal, then check off habits with soft streaks. Modules (Wallet · Health · Meals) sit visible-but-locked and unlock individually.

---

## Stack quick-reference

- **Mobile:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · Expo Router 6 · Reanimated 4 (with `react-native-worklets/plugin`)
- **State:** Zustand (client) · TanStack Query v5 (server cache) · Zod at every trust boundary
- **Backend:** Supabase Postgres + Auth + RLS · `auth.uid()` defaults on user-scoped tables
- **Auth:** Supabase Auth (email/password + Google + Apple); no Clerk
- **Storage:** `expo-secure-store` for Spotify tokens · AsyncStorage for sessions and offline queue only
- **Design:** `@luminary/design-system` package · Manrope (display) + Inter (body) · single `palette.primary` blue · no-line rule · tonal layering

---

## Repo map — the files you'll touch first

```
multi-app/
├─ ROADMAP.md          # 5-phase plan + decisions log (canonical scope source)
├─ AGENT.md            # Co-founder brief for the IDE agent (Phase status §7, current work §8)
├─ DESIGN.md           # Visual system spec
├─ TONE.md             # Copy bible — every text moment goes through here
├─ README.md           # Project entry point
├─ SETUP.md            # One-time PowerShell setup
├─ App.js              # ⚠ Workspace-root shim — leave alone (see arch patterns memory)
│
├─ mobile/
│  ├─ App.js                          # ExpoRoot mount; do NOT call registerRootComponent
│  ├─ metro.config.js                 # Two resolveRequest hooks: App entry + @/ alias
│  ├─ app/                            # Expo Router routes
│  │  ├─ _layout.tsx                  # Auth gate
│  │  ├─ (tabs)/                      # Home · Journal · Health · Money + FAB overlay
│  │  ├─ onboarding/                  # 10 screens, all built
│  │  └─ ritual/                      # index.tsx (stage orchestrator) + summary.tsx
│  ├─ components/
│  │  ├─ ui/                          # Card, Chip, Icon, Locked, ProgressBar, SectionLabel
│  │  └─ ritual/                      # RecapCard, MoodConfirm, MoodChipGrid, JournalStep, HabitCheckin
│  ├─ lib/                            # spotify, mood, streak, notifications, offlineQueue, ritual, supabase
│  ├─ hooks/                          # useSpotifyAuth, useSpotifyRecap, useOfflineSync
│  └─ stores/                         # useAuthStore, useOnboardingStore, useRitualStore
│
├─ packages/design-system/            # Tokens + typography + theme
└─ supabase/migrations/               # 0001–0005 (see below)
```

---

## Database — migrations to date

| File | What it does |
|---|---|
| `0001_initial_schema.sql` | 6 tables (profiles, habits, habit_completions, mood_events, spotify_snapshots, journal_entries) · 15-label `mood_label` enum · `mood_source` enum · RLS on everything · audit DO block that fails the migration if any table lacks RLS or policies |
| `0002_tighten_habit_completions_rls.sql` | INSERT/UPDATE `WITH CHECK` now also validates `habit_id` belongs to `auth.uid()` via subquery |
| `0003_habit_pauses.sql` | Phase 2 — `habit_pauses` table for the "Tomorrow" pause toggles; unique on `(habit_id, pause_date)` |
| `0004_profiles_reminder_time.sql` | `reminder_hour` + `reminder_minute` columns on profiles (default 21:00) |
| `0005_auth_uid_defaults.sql` | `default auth.uid()` on user-scoped tables so client writes (and offline-queue replays) don't need to carry user_id |

---

## Architectural patterns (load-bearing — established Phase 1)

These are in memory as `feedback_architectural_patterns.md`. Reach for them instinctively:

- **Pure utils + React hook split** — `lib/<integration>.ts` exports pure async functions; `hooks/use<Integration>.ts` wraps lifecycle bits.
- **Zod at trust boundaries** — every external response (Spotify, Supabase if untyped, push payloads, deep-link params) goes through `safeParse` before reaching app logic.
- **Path aliases via `metro.config.js resolveRequest`** — NOT Expo's experimental `tsconfigPaths` (silently no-ops on Windows with backslashes).
- **Workspace-root `App.js` shim** — three pieces (root shim, `mobile/App.js` re-export, metro interceptor) defeat the Expo Go monorepo entry-resolution trap. Don't "simplify."
- **Auth gate in `app/_layout.tsx`** — splash stays up until session + profile are hydrated; routes between `/onboarding/welcome` and `/(tabs)` based on session + onboarding state.

---

## Cross-cutting commitments (non-negotiable)

- Tokens-only styling. Inline color values get rejected.
- One blue. `palette.primary` (#8cacff) is the universal active accent.
- Mood is continuous — stored as timestamped events with source, never a daily snapshot.
- Personality before polish — every text moment passes through TONE.md.
- Every Supabase table has RLS, enforced by the migration audit block.
- Reject CTA is **"Not quite right"** — never "Adjust."

---

## Open questions / decisions pending

- **Friend Card content strategy for MVP.** Template library scoped — how many templates, what conditions trigger each, who writes the voice. Decide before Phase 2 closes.
- **CI** (lint + type-check on PR). Deferred from Phase 0; needs to land before the first TestFlight build.
- **Voice note** in journal. Stubbed for Phase 2, ships Phase 3.
- **No-line lint rule.** Custom ESLint rule to enforce the no-line commitment — post-MVP.

---

## What to do next (when you sit back down)

1. **Read `AGENT.md` §7 and §8** for the IDE agent's current state and remaining Phase 2 work list.
2. **Run the ritual end-to-end on device** — that's the only way to know Phase 2 is really done.
3. **Decide Friend Card v0 templates** with Mari, then ship them into Home.
4. **Once Phase 2 closes:** update `ROADMAP.md` decisions log with the Phase 2 close date, then ask Claude for the Phase 3 kickoff prompt (mirror the Phase 2 prompt format — sequenced stages, acceptance criteria, hard-rule reminders).

---

## Where to look for context, if you forget

- **Scope and history:** `ROADMAP.md` (decisions log at the bottom is the timeline)
- **IDE agent brief and current sprint:** `AGENT.md`
- **Visual rules:** `DESIGN.md`
- **Copy rules:** `TONE.md`
- **Setup:** `SETUP.md`
- **Architectural rules from Phase 1:** memory file `feedback_architectural_patterns.md`
- **All resolved product decisions:** memory file `project_luminary_decisions.md`
