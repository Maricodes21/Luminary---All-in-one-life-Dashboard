# Luminary Roadmap

Five phases over ~18 weeks. The original handover document is preserved at `docs/luminary_roadmap.docx`.

> **MVP definition (post-discussion 2026-05-01):** All five phases ship for v1.0. The ritual (Phases 0–2) is the heart, but Mari's MVP includes the life modules (Wallet, Health, Meals) unlocked and functional. Modules are visible-but-locked from day 1 — users opt in during personalization.

## Phase 0 — Project Setup & Infrastructure (W1–2)

**Goal:** App boots, authenticates, navigates between empty tab screens.

**Status: ✅ Complete (scaffold). Two items deferred — see notes.**

- [x] Monorepo scaffold (mobile / packages / supabase)
- [x] Design system package with tokens (colors, typography, spacing, radii)
- [x] TONE.md copy bible
- [x] Expo SDK 54 + Expo Router 6 + React 19 (4 tabs + center FAB)
- [x] Supabase project + initial schema + RLS policies
- [x] Zustand store + TanStack Query setup (`useAuthStore`, `useRitualStore`, `QueryClientProvider`)
- [x] Manrope + Inter via expo-google-fonts
- [ ] Auth screens: email/password + Google OAuth + Apple Sign-In ← **Phase 1 (onboarding screen 2)**
- [ ] CI: lint + type-check on PR ← **deferred; add before first TestFlight build**

## Phase 1 — Onboarding & Personalization (W3–4)

**Status: ✅ Complete — 2026-05-18.** 10-screen flow that captures preferences and unlocks the ritual.

- [x] Animated welcome → "Get started"
- [x] Account (email/password + OAuth via Supabase Auth)
- [x] Profile (name, avatar, optional pronouns)
- [x] **Spotify connect (PKCE)** — built FIRST as the highest-risk integration. Token lifecycle, refresh-with-buffer, recap fetch pipeline. Zod-validated responses. `mobile/lib/spotify.ts` (pure utils) + `mobile/hooks/useSpotifyAuth.ts` (React hook) split.
- [x] Body (weight + height, optional)
- [x] Workout: Gym vs Home
- [x] Goals (multi-select, max 5)
- [x] Habits (suggested by goals; min 3)
- [x] **Personality tone:** "Coach me hard" / "Gentle nudges" / "Just the data"
- [x] Ready summary → "Start your first evening"
- [x] `useOnboardingStore` Zustand accumulator + final-step Supabase write (profile + habits + `onboarding_complete=true`)
- [x] Auth gate in `app/_layout.tsx` — routes between `/onboarding/welcome` and `/(tabs)` based on session + onboarding state

## Phase 2 — Core Evening Ritual (W5–8) — MVP heart ▶ NEXT

The product, distilled.

- Spotify recap card (`/v1/me/player/recently-played` + `/v1/audio-features`)
- Mood mapping (valence × energy → label)
- Mood confirm: "That's about right" or "Not quite right" → mood chips; each path asks if user wants to journal — "Yes" advances to journal step, "Not right now" skips it entirely (user can journal from dashboard later)
- Optional journal prompt + free-text + tags + voice note stub (voice ships Phase 3); only shown if user opts in from mood step
- Habit check-in with **soft-streak** consistency bands (5-of-7, not miss-and-die); includes "Tomorrow" section to pause individual habits for the next day (`habit_pauses` table)
- Night summary card
- Push notification (default 9 PM, user-configurable)
- **The Friend Card** — daily editorial observation (templates → LLM post-MVP)
- Offline support for habits + mood

## Phase 3 — Reflection & Insights (W9–11)

- Journal list with search + tag filter
- Mood trend charts (7d / 30d) — line + heatmap
- Weekly review (Sunday auto-generated)
- Guided prompts (mood-contextual rotation)
- Insight cards (pattern detection — "Your mood dips on Wednesdays")

## Phase 4 — Life Modules (W12–16)

All visible-but-locked from day 1; unlock individually.

### 4a. Wallet
Monthly overview · expense logging (FAB) · category budgets · savings goals · upcoming bills

### 4b. Health
Steps ring (HealthKit/Google Fit) · gym/home workout suggestions · weekly plan · vitals grid · strength projection

### 4c. Meals
Daily macros · meal protocol timeline · week strip · smart suggestions by remaining macros · quick log

## Phase 5 — Polish & Launch (W17–18)

- Performance pass (< 2s cold start, 60fps scroll)
- Animation polish (haptics, transitions, streak celebration)
- Error handling + offline edge cases
- Accessibility audit (a11y labels, contrast, touch targets ≥ 44pt)
- App Store + Play Store assets + privacy policy
- TestFlight beta (10–20 users, 2 weeks)

## Cross-cutting commitments

- **Tokens-only styling.** Inline color values get rejected at PR time.
- **One blue.** `primary` (#8cacff) is the universal active accent. No `brand` token leaks.
- **No-line rule** enforced via lint custom rule (post-MVP).
- **Mood is continuous.** Stored as timestamped events with source. Daily "headline mood" is derived.
- **Personality before polish.** Every text moment passes through TONE.md.

## Decisions log

- 2026-05-01: 4-tab nav (Home, Journal, Health, Money) + center ritual FAB. Habits absorbed into Home.
- 2026-05-01: Modules visible-but-locked. MVP includes all modules unlocked.
- 2026-05-01: Continuous mood signal (not daily snapshot).
- 2026-05-01: Friend Card and Soft Streak added to scope.
- 2026-05-01: Spotify reject CTA = "Not quite right" (replaces "Adjust").
- 2026-05-03: react-native-skia removed from README — never installed, not needed. react-native-svg handles icon rendering. No Babel plugin ordering conflict.
- 2026-05-03: habit_completions RLS tightened — INSERT/UPDATE WITH CHECK now also validates habit_id belongs to auth.uid() via subquery. Migration 0002.
- 2026-05-03: Phase 1 branch strategy established — main → develop → feat/spotify-pkce. Spotify PKCE built first (highest-risk integration).
- 2026-05-18: Phase 1 complete. Architectural patterns established this phase: (a) `lib/*` for pure async utilities, `hooks/use*` for React-bound wrappers — split so utilities can be tested and reused outside the component tree; (b) all external API responses validated through Zod before reaching app code; (c) `@/` path alias resolved via `metro.config.js resolveRequest` (NOT Expo's experimental tsconfigPaths — that experiment normalizes paths on POSIX and silently no-ops on Windows with backslashes); (d) workspace-root `App.js` shim + `mobile/App.js` re-export to defeat the Expo Go monorepo entry-resolution trap.
- 2026-05-18: Phase 2 scope additions — (a) Journal step is opt-in only: user must tap "Yes" after mood confirm/reject to reach it; "Not right now" skips to habits, no loss, journal available from dashboard later. (b) Habit check-in gains "Tomorrow" section: lightweight toggles to pause individual habits for next day, persisted in a new `habit_pauses` table (date, habit_id, user_id, RLS-scoped); un-paused habits carry forward silently.
