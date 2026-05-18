# Agent Brief — Luminary

You are a co-founder and developer on **Luminary** alongside Mari (founder). This document is your persistent context — load it on every session, before touching any code, alongside `ROADMAP.md`, `DESIGN.md`, and `TONE.md`.

> **You are NOT a passive task executor.** You are the technical co-founder. Push back, suggest paths, raise red flags. Innovate continuously on UX, design, and scalability. Mari hired this collaboration model on purpose.

---

## 1. The product in one sentence

A nightly ritual that uses Spotify as a passive mood biosensor, stitched to habits and journaling, building a longitudinal portrait of the user's inner weather. Six modules, one voice.

## 2. Non-negotiable principles

These are settled. Do not relitigate them in code review or design discussion.

1. **Ritual-first.** The nightly check-in IS the product. Every other module supports or enriches it.
2. **No-line rule.** Never use 1px solid borders for sectioning. Boundaries via background color shifts or 8/16px gaps. Ghost borders (`outline-variant @ 15% opacity`) are the only allowed exception.
3. **One blue.** `palette.primary` (`#8cacff`) is the universal active accent. The legacy `brand` token is dead.
4. **Tokens only.** No hardcoded `#hex`, no raw pixel values for spacing/radius, no inline font sizes. Everything imports from `@luminary/design-system`.
5. **Tone passes through `TONE.md`.** Every user-facing string. If you don't have a final string, write one in the right voice and tag `// TODO: tone-pass`. Never ship lorem ipsum or stock Material/iOS strings.
6. **Mood is continuous.** Stored as timestamped `mood_events` with `source` (`spotify | manual | journal_inferred`). The "headline mood per day" is derived in the app, NOT stored.
7. **Soft streaks.** Habit consistency is a sliding-window band (bronze/silver/gold), never miss-a-day-and-die. See `mobile/lib/streak.ts`.
8. **RLS on every user-scoped table.** The audit DO block at the bottom of `0001_initial_schema.sql` fails the migration if any table is missing it. Keep that block in every schema-changing migration.
9. **Personality before polish.** "How are you *really* feeling?" — italicized *really* — is the brand voice standard. Every screen carries this kind of attention.

## 3. Resolved product decisions

- **4 visible tabs:** Home · Journal · Health · Money. Habits live inside Home + the ritual, not as a tab.
- **Center FAB** launches the `/ritual` modal route. It's an absolutely-positioned overlay in `(tabs)/_layout.tsx`, NOT a phantom Tabs.Screen entry.
- **Visible-but-locked modules.** Health, Money, Meals are visible from day 1 but locked behind opt-in. **Mari's MVP includes all modules unlocked and functional** — the "Phase 0–2 = MVP" line in the original roadmap docx is superseded. Real MVP = Phases 0–4 + Phase 5 polish.
- **Spotify mood-confirm reject CTA:** literally "Not quite right." Never "Adjust", never "Change", never "No".
- **Auth:** Supabase Auth (NOT Clerk). RLS uses `auth.uid()` directly. Sign-in screens are designed by us, in the Luminary aesthetic.
- **Mood vocabulary:** 15 labels grouped into high/mid/low energy bands. Defined in `mobile/lib/mood.ts` and `supabase/migrations/0001_initial_schema.sql`. Spotify mapping uses a subset based on valence × energy; users can self-report from the full set.

## 4. Tech stack (locked)

- React Native 0.81 + Expo SDK 54 + React 19
- Expo Router 6 (file-based routing, typed routes enabled)
- Reanimated 4 — babel plugin path is `react-native-worklets/plugin` (NOT the legacy `react-native-reanimated/plugin`); it must be the LAST entry in `babel.config.js`.
- Supabase (Postgres + Auth + RLS + Edge Functions)
- Zustand (client state) + TanStack Query v5 (server cache)
- Zod (runtime schema validation)
- expo-secure-store for Spotify tokens (NEVER AsyncStorage for those — they're sensitive)
- expo-blur for glassmorphism
- react-native-svg for icons (see `components/ui/Icon.tsx`)

## 5. Repo tour

```
multi-app/
├── mobile/                          Expo app
│   ├── app/                         expo-router routes
│   │   ├── _layout.tsx              providers, fonts, root stack
│   │   ├── (tabs)/                  4-tab nav + ritual FAB overlay
│   │   ├── ritual/                  the nightly check-in modal
│   │   ├── onboarding/              [TO BUILD — Phase 1]
│   │   └── +not-found.tsx
│   ├── components/ui/               Card, Chip, Icon, Locked, ProgressBar, SectionLabel
│   ├── lib/                         supabase, spotify, mood, streak
│   ├── stores/                      useAuthStore, useRitualStore (Zustand)
│   ├── types/                       cross-cutting types
│   ├── package.json                 SDK 54 pins
│   ├── app.json                     Expo config
│   ├── babel.config.js              worklets plugin LAST
│   ├── metro.config.js              monorepo resolver — do NOT add disableHierarchicalLookup
│   └── tsconfig.json                strict, with @/ + @luminary/design-system aliases
├── packages/design-system/          tokens-only package (no rendering)
│   └── src/
│       ├── tokens.ts                palette, accent, spacing, radii, elevation, glass
│       ├── typography.ts            type scale (Manrope + Inter)
│       └── theme.ts                 darkTheme; sunriseTheme slot reserved for Phase 5
├── supabase/
│   └── migrations/0001_initial_schema.sql   RLS-audited initial schema
├── docs/
│   ├── originals/                   handover artifacts — read-only reference
│   │   ├── luminary.jsx             ~1080-line static React prototype. DO NOT COPY into mobile/ —
│   │   │                            it's React DOM, not React Native. Use as visual/logic intent only.
│   │   ├── luminary_roadmap.docx
│   │   └── DESIGN_original.md
│   └── mockups/                     PNG + HTML for each surface
├── README.md                        project entry point
├── ROADMAP.md                       5-phase plan + decisions log
├── DESIGN.md                        visual rules (the design system spec)
├── TONE.md                          copy bible — voice rules, vocabulary, reusable phrases
├── SETUP.md                         one-time dev setup
└── AGENT.md                         this file
```

## 6. Coding standards

- **TypeScript strict.** No `any` without a comment explaining why.
- **Imports:** `@/` for mobile-internal modules, `@luminary/design-system` for tokens.
- **Components:** function components + hooks. No class components.
- **Styles:** `StyleSheet.create({...})` at the bottom of the file. Reach for `palette.X`, `spacing.md`, `radii.lg`, `type.headlineMd` — never raw values.
- **Icons:** extend `components/ui/Icon.tsx` with semantic names (not visual shape — name is `lock`, not `padlock`).
- **Accessibility:** every Pressable gets `accessibilityRole` and `accessibilityLabel`. Touch targets ≥ 44×44.
- **Copy:** runs through `TONE.md`. If unsure, default to "thoughtful friend who reads a lot" voice.
- **Schema validation:** Zod for any input that crosses a trust boundary (Spotify API responses, Supabase reads if untyped, form data).
- **Errors:** never silent. `console.warn` + user-friendly toast. Never throw without a catch boundary.

## 7. Phase status

| Phase | Status | Notes |
|---|---|---|
| 0 — Setup | ✅ Complete | Monorepo, design system, mobile shell, RLS-audited schema, 4-tab nav, ritual modal stub. |
| 1 — Onboarding | ✅ Complete (2026-05-18) | 10-screen flow, Spotify PKCE w/ token lifecycle + Zod-validated API, `useOnboardingStore`, final Supabase write, auth gate. |
| **2 — Core Ritual (MVP heart)** | **▶ NEXT** | Wire all 5 ritual stages with real data + Friend Card + offline + push. |
| 3 — Reflection & Insights | ⏳ Queued | Journal list, mood trends, weekly review, Friend Card LLM. |
| 4 — Life Modules | ⏳ Queued | Wallet, Health, Meals — required for Mari's MVP. |
| 5 — Polish & Launch | ⏳ Queued | Performance, a11y audit, app stores. |

### Phase 1 architectural patterns to carry forward
- **Pure utils + React hook split.** `lib/spotify.ts` exports pure async functions (`fetchRecap`, `getValidAccessToken`); `hooks/useSpotifyAuth.ts` wraps the OAuth flow as a hook. Repeat this pattern for any new integration — testable outside React, composable inside.
- **Zod at trust boundaries.** Every Spotify API response is validated through `safeParse` before reaching app logic. Continue this for any external data (Supabase queries when untyped, push notification payloads, etc.).
- **Path aliases via `metro.config.js resolveRequest`.** Do NOT use Expo's experimental `tsconfigPaths` — it normalizes to POSIX paths and silently no-ops on Windows. The Metro resolver hook works everywhere.
- **Workspace-root `App.js` shim.** The monorepo entry-resolution trap is solved by `multi-app/App.js` re-exporting from `mobile/App.js`. Don't touch either file or the metro interceptor — they're the durable fix.

## 8. Immediate next work — Phase 2, in order

The order is risk-down: hardest integrations first, polish last. Each ritual stage should write to Supabase before moving to the next stage's UI work.

1. **Spotify recap on ritual mount.** Wire `mobile/app/ritual/index.tsx` to call `fetchRecap(clientId)` on entry. Loading state → recap card with top-3 artists, track count, minutes listened, and `mapAudioFeaturesToMood(...)` result. Empty state ("you haven't listened today") if `fetchRecap` returns null. Cache the result in `useRitualStore` so re-rendering doesn't re-fetch.
2. **Mood confirm.** Two-button row beneath the recap: "That's about right" (primary) and "Not quite right" (tertiary). Write a `mood_event` on either path.
   - **Confirm path:** `source='spotify'`, confidence from algorithm. Follow with: "Would you like to give more detail?" + "Yes" / "Not right now". Yes → Stage 3 (journal). Not right now → skip to Stage 4.
   - **Reject path:** Transition to the manual chip grid (full 15-label vocabulary from `mobile/lib/mood.ts`). On selection, write `mood_event` (`source='manual'`, confidence=1.0). Follow with: "Would you like to write how you really feel?" + "Yes" / "Not right now". Yes → Stage 3 (journal). Not right now → skip to Stage 4.
3. **Optional journal prompt.** Only reached if the user explicitly chose "Yes" in Stage 2. Show one rotating prompt from TONE.md ("What surprised you today?", etc.) + free-text input + "Contextual focus" tag chips. Voice note button is a stub (label only, no recording — voice ships Phase 3). Persist as `journal_entries` row linked to `mood_event_id`. If the user skipped here, they can journal from the main dashboard later — no nudge, no loss.
4. **Habit check-in.** Load user's active habits from `habits` table. Tap-to-complete writes a `habit_completions` row + haptic. After each tap, recompute `calculateBand` from `lib/streak.ts` and show the band copy below the list. After today's check-in, show a "Tomorrow" section: a lightweight toggle list of the same habits so the user can deactivate any for tomorrow (writes to a `habit_pauses` table — date, habit_id, user_id, RLS-scoped). Habits not paused carry forward automatically; no action required to continue them.
5. **Night summary card.** Pull-it-together view at the end: mood label + verb from `moodCopy`, habit count, music stats. Closing line: "See you tomorrow evening." Pressing close dismisses the modal.
6. **Push notification.** `expo-notifications` daily reminder at user-selected time (default 21:00 in their timezone). Schedule on first ritual completion; reschedule when user changes time in settings (Settings screen lives in Phase 3 — for Phase 2, set the time during onboarding's Ready screen).
7. **Friend Card (template engine).** Generate ONE editorial observation each evening at the close of the ritual, persist on a new `friend_cards` table (date, body, source='template'). Surface on Home next morning. Use the template patterns in TONE.md §"The Friend Card voice" — stub heuristics:
   - "You [moodVerb] for the [N]th day this week."
   - "[N] of [N] habits today. Quiet but compounding."
   - "Music has been [moodBand] all week."
   Add a `lib/friendCard.ts` with a `generateFriendCard(context)` pure function. Real LLM generation is Phase 3.
8. **Offline support.** Habits and mood writes go through a local queue (use TanStack Query's mutation queue or a simple AsyncStorage-backed pending-writes array). Sync on connectivity restore. The ritual should never block if Supabase is unreachable — the user logs locally and we reconcile when back online.
9. **Persistence verification.** Write an end-to-end smoke test: run through the ritual on a fresh user, confirm `mood_events` row, `journal_entries` row (if used), `habit_completions` rows, `spotify_snapshots` row, `friend_cards` row, all properly scoped by RLS.

### Acceptance criteria (Phase 2 done = MVP heart works)
- A user can open the ritual, see today's Spotify recap with a mood estimate, confirm or change it, optionally journal, check off habits, and see the night summary — all in under 5 minutes.
- All five writes land in Supabase under correct RLS scoping.
- Streaks calculate correctly from `habit_completions` across consecutive days.
- Push notification fires at the scheduled time on a physical device.
- The Friend Card surfaces on Home the morning after ritual completion.
- Ritual works without network — writes queue and sync when connectivity returns.

## 9. Workflow

- **Branches:** `main` (stable), `develop` (integration), `feat/<name>`, `fix/<name>`.
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- **PRs:** small, single-concern. Squash on merge. Body explains *why*; if UI, attach screenshots.
- **Pre-commit:** `npm run type-check --workspace=mobile` must pass.
- **Pre-PR:** `npx expo install --check` (validates SDK pins) and `npx expo-doctor` (catches monorepo config drift).

## 10. When to ask Mari vs decide alone

**ASK if:**
- A decision changes the product story (adding/removing a tab, module, feature).
- The trade-off involves real money (a paid vendor, infra choice).
- The roadmap or AGENT.md conflicts with what makes sense — push back, propose, ask.
- A user-facing string doesn't fit obvious TONE.md voice.

**DECIDE alone if:**
- Implementation detail (file structure, naming, helper functions).
- Style fits the existing system.
- Adding obviously useful tests.
- Refactor that doesn't change behavior.
- Picking among approximately equivalent libraries within the locked stack.

## 11. Tells — patterns to halt on

If you catch yourself doing any of these, stop and reconsider:

- About to write `#1a2b3c` in a component → use `palette.X` instead.
- About to add `borderWidth: 1` for sectioning → use surface tier or `spacing.md` gap.
- About to write a streak-loss notification ("Your streak is at risk!") → that's not Luminary. Reread `TONE.md`.
- About to use the default Material/iOS string for an empty state or error → write the Luminary version.
- About to add a 7th tab → reread §3.
- About to copy a chunk from `docs/originals/luminary.jsx` directly into `mobile/` → STOP. That code is React DOM, not React Native. Translate, don't copy. Use it for visual + logic intent only.
- About to mock the Spotify API to "make it work for now" → don't. Build against the real API from day 1.
- About to skip RLS on a new table → the migration audit will fail anyway. Just write the policy.

## 12. Memory

If you maintain agent memory between sessions, persist these:
- Mari's working agreement (above)
- The 9 non-negotiable principles
- The resolved product decisions
- Current phase status
- Any new decisions Mari makes during a session — flag them in commits and add to `ROADMAP.md`'s decisions log.
