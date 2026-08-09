# Daily Focus, Meals, Workouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement local-first rotating focus notes, better habit icons, richer meal suggestion/planner UI, more diverse workouts, and remove the ritual FAB nav collision.

**Architecture:** Put deterministic content logic in focused helpers under `mobile/lib`, keep persisted state changes inside `mobile/stores/useProductionStore.ts`, and reuse existing Home/Meals cards and sheets for UI. Avoid schema changes because all requested behavior can ship from local content and existing persisted store shapes.

**Tech Stack:** Expo Router, React Native, Zustand persisted store, Node test runner via `mobile/scripts/run-content-tests.cjs`, TypeScript.

---

### Task 1: Local Content Helpers

**Files:**
- Create: `mobile/lib/dailyFocus.ts`
- Create: `mobile/lib/habitIcons.ts`
- Modify: `mobile/components/ui/Icon.tsx`
- Modify: `mobile/lib/contentLibrary.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that import `getDailyFocusNote` from `./dailyFocus` and `getHabitIconName` from `./habitIcons`. Assert same date returns same note, adjacent dates can differ, and common habit names map to expected semantic icons.

- [ ] **Step 2: Run red test**

Run: `npm run test:content --workspace=mobile`
Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement helpers**

Create a daily focus helper that hashes the date plus tone/context into local note arrays. Create a habit icon helper that maps habit text to the existing icon set plus any added icon names.

- [ ] **Step 4: Run green test**

Run: `npm run test:content --workspace=mobile`
Expected: PASS for content tests.

### Task 2: Meal And Workout Data Variety

**Files:**
- Modify: `mobile/lib/contentLibrary.ts`
- Modify: `mobile/stores/useProductionStore.ts`
- Modify: `mobile/lib/contentLibrary.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that generated meal plan slots include `prepSteps`, and workout plans for each category/level have unique names matching the expected volume.

- [ ] **Step 2: Run red test**

Run: `npm run test:content --workspace=mobile`
Expected: FAIL because current meal templates lack prep steps and workout templates are too small.

- [ ] **Step 3: Expand local data**

Add meal preparation steps and substitution metadata when building plan days. Replace the tiny workout day template with larger per-category/per-level session pools and deterministic rotation.

- [ ] **Step 4: Run green test**

Run: `npm run test:content --workspace=mobile`
Expected: PASS for content tests.

### Task 3: Home UX

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Wire daily focus and habit icons**

Use `getDailyFocusNote` in the Today's focus card and `getHabitIconName` inside each habit checkbox.

- [ ] **Step 2: Move ritual entry to Home**

Remove the `RitualFab` overlay from tabs. Add a Home card that routes to `/ritual` when not all active habits are completed today.

- [ ] **Step 3: Run type-check**

Run: `npm run type-check --workspace=mobile`
Expected: exit code 0.

### Task 4: Meals UX

**Files:**
- Modify: `mobile/app/(tabs)/meals.tsx`

- [ ] **Step 1: Fix calorie card copy**

Remove the Daily target label and logged sentence from the target card. Adjust calorie ring typography and width so the number and label fit.

- [ ] **Step 2: Add suggestion carousel**

Render a horizontal list of suggested dinner meal cards beneath the short protein message. Each card logs that preset.

- [ ] **Step 3: Add weekly plan previews and details**

Render weekly plan days as horizontal preview cards. Open an action sheet for day details, and a second meal detail state inside the planner for prep steps and substitutions.

- [ ] **Step 4: Run type-check**

Run: `npm run type-check --workspace=mobile`
Expected: exit code 0.

### Task 5: Final Verification

**Files:**
- Verify changed app files and docs.

- [ ] **Step 1: Run content tests**

Run: `npm run test:content --workspace=mobile`
Expected: exit code 0.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check --workspace=mobile`
Expected: exit code 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint --workspace=mobile`
Expected: exit code 0 or report exact lint failures.

- [ ] **Step 4: Run whitespace check**

Run: `git diff --check`
Expected: no whitespace errors.
