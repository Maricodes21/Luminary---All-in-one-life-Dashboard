# Luminary Roadmap

Five phases over ~18 weeks. The original handover document is preserved at `docs/luminary_roadmap.docx`.

> **MVP definition (post-discussion 2026-05-01):** All five phases ship for v1.0. The ritual (Phases 0–2) is the heart, but Mari's MVP includes the life modules (Wallet, Health, Meals) unlocked and functional. Modules are visible-but-locked from day 1 — users opt in during personalization.

## Phase 0 — Project Setup & Infrastructure (W1–2)

**Goal:** App boots, authenticates, navigates between empty tab screens.

- [x] Monorepo scaffold (mobile / packages / supabase)
- [x] Design system package with tokens (colors, typography, spacing, radii)
- [x] TONE.md copy bible
- [ ] Expo SDK 51 with Expo Router (4 tabs + center FAB)
- [ ] Supabase project + initial schema + RLS policies
- [ ] Auth: email/password + Google OAuth + Apple Sign-In
- [ ] Zustand store + TanStack Query setup
- [ ] Manrope + Inter via expo-google-fonts
- [ ] CI: lint + type-check on PR

## Phase 1 — Onboarding & Personalization (W3–4)

10-screen flow that captures preferences and unlocks the ritual.

1. Animated welcome → "Get started"
2. Account (email/password or OAuth)
3. Profile (name, avatar, optional pronouns)
4. **Spotify connect (PKCE)** — explain what data is used; skip allowed
5. Body (weight + height, optional)
6. Workout: Gym vs Home
7. Goals (multi-select, max 5)
8. Habits (suggested by goals; min 3)
9. **Personality tone:** "Coach me hard" / "Gentle nudges" / "Just the data"
10. Ready summary → "Start your first evening"

## Phase 2 — Core Evening Ritual (W5–8) — MVP heart

The product, distilled.

- Spotify recap card (`/v1/me/player/recently-played` + `/v1/audio-features`)
- Mood mapping (valence × energy → label)
- Mood confirm: "That's about right" or "Not quite right" → mood chips
- Optional journal prompt + free-text + tags + voice note
- Habit check-in with **soft-streak** consistency bands (5-of-7, not miss-and-die)
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
