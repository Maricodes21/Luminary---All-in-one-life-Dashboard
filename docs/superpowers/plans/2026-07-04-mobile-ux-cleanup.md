# Mobile UX Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved mobile UX cleanup across Home, Meals, Health, Money, Ritual, and workout imagery metadata while preserving the app's existing visual language.

**Architecture:** Keep this as a local-first UI pass. Add small pure helpers where behavior needs calculation or copy, then consume those helpers from the existing Expo route/component files. Avoid new integrations, live image generation, camera/barcode behavior, or large navigation changes.

**Tech Stack:** Expo Router, React Native, Zustand persisted store, `@luminary/design-system`, Node built-in test runner via `mobile/scripts/run-content-tests.cjs`.

---

## File Structure

- Modify `mobile/lib/contentLibrary.ts`: add optional exercise image metadata for hybrid photo/generated-illustration readiness.
- Modify `mobile/lib/contentLibrary.test.ts`: test that exercise metadata exists and remains provider-aware.
- Modify `mobile/lib/spotify.ts`: expose plain mood context helpers and listening-signal confidence copy.
- Modify `mobile/lib/spotify.test.ts`: test thin-listening and normal-listening copy helpers.
- Modify `mobile/scripts/run-content-tests.cjs`: load both content and Spotify helper tests.
- Modify `mobile/app/(tabs)/index.tsx`: replace duplicate habits with one row pattern and add visible ritual FAB context where appropriate.
- Modify `mobile/app/(tabs)/meals.tsx`: add calorie ring/progress visual, Search-first logging layout, contextual protein suggestion, plain source/confirmation copy, and compact weekly plan rows.
- Modify `mobile/app/(tabs)/health.tsx`: move workout above Health Connect when no live data, remove source plumbing copy, soften empty state, and continue using native styling.
- Modify `mobile/app/(tabs)/money.tsx`: make unassigned income primary, move unallocated budget to support copy/editor context, and replace staged/dev copy with "Manual entry".
- Modify `mobile/app/ritual/index.tsx`: add stage indicator.
- Modify `mobile/components/ritual/RecapCard.tsx`: show plain mood first, artist/listening flavor second, and thin-signal caveat.
- Modify `mobile/components/ritual/HabitCheckin.tsx`: prefer persisted local habits as fallback and rename tomorrow controls to "Keep active".

---

### Task 1: Test Source Metadata and Mood Copy Helpers

**Files:**
- Modify: `mobile/lib/contentLibrary.test.ts`
- Create: `mobile/lib/spotify.test.ts`
- Modify: `mobile/scripts/run-content-tests.cjs`

- [ ] **Step 1: Add failing content metadata test**

Append this test to `mobile/lib/contentLibrary.test.ts`:

```ts
test('exercise library exposes image metadata for future generated illustrations', () => {
  const alternatives = getWorkoutAlternatives({
    category: 'calisthenics',
    level: 'beginner',
    equipment: ['bodyweight'],
  });

  assert.ok(alternatives.length > 0);
  assert.ok(alternatives.every((exercise) => exercise.imageUrl.startsWith('https://')));
  assert.ok(alternatives.every((exercise) => exercise.imageMeta?.source === 'sourced_photo'));
  assert.ok(alternatives.every((exercise) => exercise.imageMeta?.alt.length > 0));
});
```

- [ ] **Step 2: Create failing Spotify helper tests**

Create `mobile/lib/spotify.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { describeListeningSignal, formatMoodHeadline } from './spotify';

test('listening signal is caveated when there is too little music', () => {
  const signal = describeListeningSignal({ trackCount: 1, minutesListened: 4 });

  assert.equal(signal.isThin, true);
  assert.equal(signal.copy, 'Light listening today - best guess.');
});

test('mood headline uses mood label before artist flavor', () => {
  const headline = formatMoodHeadline('Focused', 'soft-focus ken carson');

  assert.equal(headline.title, 'Focused');
  assert.equal(headline.detail, 'Soundtrack hint: soft-focus ken carson');
});
```

- [ ] **Step 3: Load Spotify tests in the test runner**

Update `mobile/scripts/run-content-tests.cjs` so it requires both test files:

```js
require(path.resolve(__dirname, '../lib/contentLibrary.test.ts'));
require(path.resolve(__dirname, '../lib/spotify.test.ts'));
```

- [ ] **Step 4: Run tests and verify RED**

Run: `npm run test:content --workspace=mobile`

Expected: FAIL because `imageMeta`, `describeListeningSignal`, and `formatMoodHeadline` do not exist yet.

### Task 2: Implement Pure Helpers and Metadata

**Files:**
- Modify: `mobile/lib/contentLibrary.ts`
- Modify: `mobile/lib/modulePresets.ts`
- Modify: `mobile/lib/spotify.ts`

- [ ] **Step 1: Add image metadata to exercise type and factory**

Add this type:

```ts
export type ExerciseImageMeta = {
  source: 'sourced_photo' | 'generated_illustration';
  alt: string;
  style: 'photo' | 'illustration';
};
```

Add `imageMeta: ExerciseImageMeta` to `LibraryExercise`, and have the `exercise(...)` helper populate:

```ts
imageMeta: {
  source: 'sourced_photo',
  alt: `${name} exercise reference photo`,
  style: 'photo',
},
```

- [ ] **Step 2: Pass image metadata through module presets**

Add `imageMeta?: ReturnType<typeof getAllLibraryExercises>[number]['imageMeta'];` to `ExercisePreset` and include `imageMeta: exercise.imageMeta` in `exercisesFor`.

- [ ] **Step 3: Add Spotify display helpers**

Export these helpers from `mobile/lib/spotify.ts`:

```ts
export function describeListeningSignal(input: { trackCount: number; minutesListened: number }) {
  const isThin = input.trackCount < 3 || input.minutesListened < 10;
  return {
    isThin,
    copy: isThin ? 'Light listening today - best guess.' : 'Based on today\'s listening.',
  };
}

export function formatMoodHeadline(moodLabel: string, moodPhrase: string) {
  return {
    title: moodLabel,
    detail: moodPhrase ? `Soundtrack hint: ${moodPhrase}` : null,
  };
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm run test:content --workspace=mobile`

Expected: PASS.

### Task 3: Home Habit Pattern

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Replace duplicate habit rendering**

Remove `habitRingRow` rendering. Render one `habits.map` list where each row:

- toggles completion with the leading icon button,
- shows the habit name as text,
- has a trailing archive/delete press target,
- keeps the existing "Add from suggestions" button.

- [ ] **Step 2: Remove unused editable state paths**

Keep `updateHabit` only if inline editing remains. If not used, remove the selector and unused `TextInput` import from this file.

- [ ] **Step 3: Run type-check**

Run: `npm run type-check --workspace=mobile`

Expected: no new TypeScript errors from Home.

### Task 4: Meals Visual Hierarchy and Copy

**Files:**
- Modify: `mobile/app/(tabs)/meals.tsx`

- [ ] **Step 1: Add a calorie ring component**

Add a local `CalorieRing` component that uses existing `palette`, `type`, `radii`, and `View` styling. It should show calories left, target progress, and avoid SVG/new dependencies.

- [ ] **Step 2: Update daily target layout**

Use `CalorieRing` as the visual anchor and keep the `Macro` progress bars underneath or beside it depending on available width. Preserve compact mobile dimensions.

- [ ] **Step 3: Make Search the primary logging action**

Replace the equal tile grid with:

- one full-width Search `Pressable` or `QuickActionTile`,
- a secondary chip/tile row for Scan meal, Barcode, and Manual entry.

Use "Manual entry" exactly.

- [ ] **Step 4: Remove source plumbing card**

Delete the Food sources card from the primary page. Keep source attribution only inside meal rows.

- [ ] **Step 5: Add compact weekly plan overview**

Replace the horizontal `PlanDayCard` strip on the main page with `PlanDayRow` rows showing day, meal count, and total calories. Keep detailed cards in the planner sheet.

- [ ] **Step 6: Add contextual protein suggestion**

When protein remaining is at least 20g, render a dismissible or small recessed suggestion card after the target card: "Xg short on protein. Three dinner ideas." Use existing meal presets to provide the ideas.

- [ ] **Step 7: Run type-check**

Run: `npm run type-check --workspace=mobile`

Expected: no new TypeScript errors from Meals.

### Task 5: Health and Money Priority Cleanup

**Files:**
- Modify: `mobile/app/(tabs)/health.tsx`
- Modify: `mobile/app/(tabs)/money.tsx`

- [ ] **Step 1: Move actionable workout content above Health Connect**

Render Today's workout before Health Connect unless `hasLiveMetrics` is true. Keep the same card styling.

- [ ] **Step 2: Replace Health source copy**

Remove "provider / lookup" copy from Plan setup. Replace it with plain copy about varied exercises and easy substitutions.

- [ ] **Step 3: Soften workout empty copy**

Use: "No workouts logged yet. Create a week, then mark each session complete when you finish."

- [ ] **Step 4: Make Money leftover action singular**

In the month summary, show unassigned income as primary support copy. Move unallocated budget into secondary text or the budget editor opening path.

- [ ] **Step 5: Replace Money staged copy**

Use "Manual entry" for receipt/manual paths. Remove "Photo capture staged" and "Manual fallback" from user-visible primary actions.

- [ ] **Step 6: Run type-check**

Run: `npm run type-check --workspace=mobile`

Expected: no new TypeScript errors from Health or Money.

### Task 6: Ritual Trust and Flow

**Files:**
- Modify: `mobile/app/ritual/index.tsx`
- Modify: `mobile/components/ritual/RecapCard.tsx`
- Modify: `mobile/components/ritual/HabitCheckin.tsx`

- [ ] **Step 1: Add stage indicator**

Add a small `StageIndicator` in `ritual/index.tsx` that maps recap/mood to "1 of 4", journal to "2 of 4", habits to "3 of 4", and summary navigation to the summary screen.

- [ ] **Step 2: Update RecapCard mood display**

Use `mapAudioFeaturesToMood`, `moodCopy`, `describeListeningSignal`, and `formatMoodHeadline` so the card displays mood label first and artist/listening context second.

- [ ] **Step 3: Align HabitCheckin fallback with local habits**

Use `useProductionStore` as a local fallback when Supabase habit loading fails or returns no habits. The same persisted habit names should appear in Home and Ritual.

- [ ] **Step 4: Rename tomorrow controls**

Replace "Anything you'd like to skip tomorrow?" with "Keep active tomorrow" and make the switch state checked when the habit is active tomorrow, not paused.

- [ ] **Step 5: Run type-check**

Run: `npm run type-check --workspace=mobile`

Expected: no new TypeScript errors from ritual files.

### Task 7: Final Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run content tests**

Run: `npm run test:content --workspace=mobile`

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check --workspace=mobile`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint --workspace=mobile`

Expected: PASS or report exact pre-existing/tooling failures.

- [ ] **Step 4: Run dependency check**

Run: `npm run deps:check --workspace=mobile`

Expected: PASS or report exact Expo dependency drift.

- [ ] **Step 5: Run whitespace check**

Run: `git diff --check`

Expected: no whitespace errors.
