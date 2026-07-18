# Daily Spotify Recap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a true daily Spotify recap with top songs, top artists, repeat counts, and listening stats on the ritual and Home surfaces.

**Architecture:** Add a pure aggregation module so ranking and date behavior can be tested without Expo. Keep token storage and network calls in `spotify.ts`, and share one responsive recap renderer between the ritual and Home.

**Tech Stack:** React Native, Expo, TypeScript, Zod, Node test runner, Luminary design-system tokens.

## Global Constraints

- Use the current local calendar day for every recap value.
- Keep the mood-confirmation flow and existing Spotify token storage.
- Use tokens only, one blue accent, no divider borders, and accessible Spotify links.
- Show at most three songs and three artists on both surfaces.

---

### Task 1: Daily aggregation contract

**Files:**
- Create: `mobile/lib/spotifyRecap.ts`
- Create: `mobile/lib/spotifyRecap.test.ts`
- Modify: `mobile/scripts/run-content-tests.cjs`

**Interfaces:**
- Produces: `buildDailySpotifyRecap(plays, date): SpotifyRecap | null`
- Produces: `SpotifyPlay`, `SpotifyTrackSummary`, `SpotifyArtistSummary`, and `SpotifyRecap` types.

- [ ] Write failing tests for local-day filtering, duration totals, repeat ranking, artist ranking, unique artist count, three-item limits, and empty days.
- [ ] Run `npm run test:content --workspace=mobile` and confirm failure because the new module does not exist.
- [ ] Implement the pure aggregation module with deterministic count-first ordering and representative image/link fallbacks.
- [ ] Re-run the focused suite and confirm all aggregation tests pass.

### Task 2: Spotify daily history fetch

**Files:**
- Modify: `mobile/lib/spotify.ts`
- Modify: `mobile/hooks/useSpotifyAuth.ts`

**Interfaces:**
- Consumes: `buildDailySpotifyRecap` and its play/recap types.
- Produces: the existing `fetchRecap(clientId, dateOverride?)` interface with the richer daily recap shape.

- [ ] Expand the Zod schemas to include durations, album artwork, artist ids, Spotify URLs, and paging cursors.
- [ ] Page backward until reaching a play before the target local day or the safety cap.
- [ ] Build the daily recap, then enrich its three artists via `/artists/{id}` with per-artist fallbacks.
- [ ] Remove the no-longer-needed `user-top-read` authorization scope while preserving existing tokens.

### Task 3: Shared recap presentation

**Files:**
- Create: `mobile/components/spotify/SpotifyDailyRecap.tsx`
- Modify: `mobile/components/ritual/RecapCard.tsx`
- Modify: `mobile/components/ritual/MoodConfirm.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

**Interfaces:**
- Produces: `SpotifyDailyRecap({ recap, compact })`.

- [ ] Implement the ritual layout with top-artist portraits, three repeat tiles, and three stat tiles.
- [ ] Implement the compact Home layout with three repeat rows, artist chips, and an inline stat row.
- [ ] Wrap Spotify-linked content in accessible press targets and retain image/initial fallbacks.
- [ ] Move the inferred mood label into `MoodConfirm` and replace both legacy recap renderers with the shared component.

### Task 4: Verification

**Files:**
- Verify all modified files.

- [ ] Run `npm run test:content --workspace=mobile`.
- [ ] Run `npm run type-check --workspace=mobile`.
- [ ] Run `npm run lint --workspace=mobile`.
- [ ] Run `npm run deps:check --workspace=mobile`.
- [ ] Run `git diff --check` and inspect the final diff for unrelated changes.

