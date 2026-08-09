# Assisted Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce avoidable typing across Luminary with shared, accessible date, choice, number, select, and autocomplete controls while preserving genuinely personal free text.

**Architecture:** Pure form helpers live in `mobile/lib/forms` and reusable React Native controls live in `mobile/components/ui`. Screens adopt the shared controls by domain, preserving their stores and submission contracts. The platform date picker is the only new mobile dependency.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, `@react-native-community/datetimepicker`, Node test runner.

## Global Constraints

- Keep free text for names, email, passwords, journal writing, personal notes, merchants, custom goals, and search queries.
- Use an ISO `YYYY-MM-DD` value for stored dates.
- Common serving units are `serving`, `g`, `kg`, `ml`, `l`, `cup`, `tbsp`, `tsp`, `piece`, and `slice`.
- Controls must fit compact Android layouts without changing parent dimensions as values change.
- Preserve current local-first stores and clear user-scoped suggestion history on sign-out.

---

### Task 1: Pure Assisted-Input Helpers

**Files:**
- Create: `mobile/lib/forms/assistedInputs.ts`
- Create: `mobile/lib/forms/assistedInputs.test.ts`
- Create: `mobile/scripts/run-forms-tests.cjs`
- Modify: `mobile/package.json`

**Interfaces:**
- Produces: `clampNumber(value, min, max)`, `stepNumber(value, step, direction, min, max)`, `toLocalDateValue(date)`, `isFutureDate(value, today)`, `uniqueChoices(values)`, and `suggestFromHistory(query, values, limit)`.

- [ ] **Step 1: Write failing helper tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { clampNumber, isFutureDate, stepNumber, suggestFromHistory, toLocalDateValue, uniqueChoices } from './assistedInputs';

test('number stepping respects bounds', () => {
  assert.equal(stepNumber(66, 0.5, 1, 20, 400), 66.5);
  assert.equal(stepNumber(20, 1, -1, 20, 400), 20);
  assert.equal(clampNumber(500, 20, 400), 400);
});

test('dates use local ISO values and reject future dates', () => {
  assert.equal(toLocalDateValue(new Date(2026, 6, 15)), '2026-07-15');
  assert.equal(isFutureDate('2026-07-16', '2026-07-15'), true);
});

test('choices and history suggestions are normalized', () => {
  assert.deepEqual(uniqueChoices([' Vegan ', 'vegan', 'Fish']), ['Vegan', 'Fish']);
  assert.deepEqual(suggestFromHistory('pi', ['Pick n Pay', 'Pizza Hut', 'Woolworths'], 4), ['Pick n Pay', 'Pizza Hut']);
});
```

- [ ] **Step 2: Add the forms test runner and verify RED**

Use the existing TypeScript transpile hook from `run-meals-tests.cjs`, point it at `mobile/lib/forms/*.test.ts`, and add `"test:forms": "node --test scripts/run-forms-tests.cjs"` to `mobile/package.json`.

Run: `npm run test:forms --workspace=mobile`

Expected: FAIL because `assistedInputs.ts` does not exist.

- [ ] **Step 3: Implement the pure helpers**

```ts
export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function stepNumber(value: number, step: number, direction: -1 | 1, min: number, max: number) {
  const precision = String(step).split('.')[1]?.length ?? 0;
  return Number(clampNumber(value + step * direction, min, max).toFixed(precision));
}

export function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const isFutureDate = (value: string, today = toLocalDateValue(new Date())) => value > today;

export function uniqueChoices(values: string[]) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const clean = value.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return [];
    seen.add(key);
    return [clean];
  });
}

export function suggestFromHistory(query: string, values: string[], limit = 5) {
  const term = query.trim().toLowerCase();
  return uniqueChoices(values).filter((value) => !term || value.toLowerCase().includes(term)).slice(0, limit);
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:forms --workspace=mobile`

Expected: all form helper tests pass.

- [ ] **Step 5: Commit**

```powershell
git add mobile/lib/forms mobile/scripts/run-forms-tests.cjs mobile/package.json
git commit -m "test: establish assisted input helpers"
```

### Task 2: Shared React Native Controls

**Files:**
- Create: `mobile/components/ui/DateField.tsx`
- Create: `mobile/components/ui/ChoiceGroup.tsx`
- Create: `mobile/components/ui/MultiChoiceField.tsx`
- Create: `mobile/components/ui/SelectField.tsx`
- Create: `mobile/components/ui/NumberField.tsx`
- Create: `mobile/components/ui/AutocompleteField.tsx`
- Modify: `mobile/components/ui/index.ts`
- Modify: `mobile/package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: helpers from Task 1.
- Produces: typed UI components exported from `@/components/ui`.

- [ ] **Step 1: Add source-contract tests**

Extend `assistedInputs.test.ts` to read each component source and assert that `DateField` imports `DateTimePicker`, `NumberField` exposes `min/max/step`, `SelectField` uses `ActionSheet`, and all controls set accessibility labels or roles.

- [ ] **Step 2: Verify RED**

Run: `npm run test:forms --workspace=mobile`

Expected: FAIL because the six component files do not exist.

- [ ] **Step 3: Install the compatible date-picker dependency**

Run: `npm exec --workspace=mobile expo install @react-native-community/datetimepicker`

Expected: Expo selects the SDK 54-compatible version and updates the lockfile.

- [ ] **Step 4: Implement the controls**

Use these exact public props:

```ts
export type DateFieldProps = { label: string; value: string; onChange: (value: string) => void; maximumDate?: Date; minimumDate?: Date };
export type ChoiceOption<T extends string | number> = { value: T; label: string };
export type ChoiceGroupProps<T extends string | number> = { label: string; value: T; options: readonly ChoiceOption<T>[]; onChange: (value: T) => void };
export type MultiChoiceFieldProps = { label: string; value: string[]; suggestions: readonly string[]; onChange: (value: string[]) => void; allowCustom?: boolean; customPlaceholder?: string };
export type SelectFieldProps = { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; allowCustom?: boolean };
export type NumberFieldProps = { label: string; value: string; onChangeText: (value: string) => void; unit?: string; min?: number; max?: number; step?: number; showStepper?: boolean; placeholder?: string };
export type AutocompleteFieldProps = { label?: string; value: string; onChangeText: (value: string) => void; suggestions: readonly string[]; onSelect?: (value: string) => void; placeholder?: string; multiline?: boolean };
```

`DateField` opens `DateTimePicker` in `date` mode and calls `toLocalDateValue`. `ChoiceGroup` wraps options instead of scrolling horizontally. `MultiChoiceField` renders selected chips and one compact custom input. `SelectField` opens the existing `ActionSheet`. `NumberField` keeps direct editing and uses `stepNumber` for 44px plus/minus icon buttons. `AutocompleteField` renders at most five stable suggestion rows below the input.

- [ ] **Step 5: Export and verify**

Run: `npm run test:forms --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

Expected: all commands pass.

- [ ] **Step 6: Commit**

```powershell
git add mobile/components/ui mobile/package.json package-lock.json mobile/lib/forms/assistedInputs.test.ts
git commit -m "feat: add shared assisted input controls"
```

### Task 3: Onboarding, Settings, and Health Adoption

**Files:**
- Modify: `mobile/app/onboarding/profile.tsx`
- Modify: `mobile/app/onboarding/body.tsx`
- Modify: `mobile/app/settings.tsx`
- Modify: `mobile/app/(tabs)/health.tsx`
- Test: `mobile/lib/forms/assistedInputs.test.ts`

**Interfaces:**
- Consumes: `ChoiceGroup`, `MultiChoiceField`, and `NumberField`.
- Preserves: existing onboarding and profile store payloads.

- [ ] **Step 1: Add failing source assertions**

Assert onboarding profile imports `ChoiceGroup`, body imports `NumberField`, and Health uses shared choices while account email/password remain `TextInput`.

- [ ] **Step 2: Verify RED**

Run: `npm run test:forms --workspace=mobile`

Expected: FAIL on missing shared-control imports.

- [ ] **Step 3: Replace structured fields**

Use pronoun options `she/her`, `he/him`, `they/them`, and `Custom`. Replace body weight and height with steppers (`0.5 kg`, `1 cm`) while preserving string state. Replace local Settings and Health chip loops with shared controls without changing stored enum values.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:forms --workspace=mobile && npm run test:auth --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

```powershell
git add mobile/app/onboarding mobile/app/settings.tsx 'mobile/app/(tabs)/health.tsx' mobile/lib/forms/assistedInputs.test.ts
git commit -m "feat: simplify onboarding and health inputs"
```

### Task 4: Home, Journal, and Money Adoption

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/app/(tabs)/journal.tsx`
- Modify: `mobile/components/ritual/JournalStep.tsx`
- Modify: `mobile/app/(tabs)/money.tsx`
- Test: `mobile/lib/forms/assistedInputs.test.ts`

**Interfaces:**
- Consumes: `AutocompleteField`, `MultiChoiceField`, `NumberField`, and local store history.

- [ ] **Step 1: Add failing behavior/source tests**

Assert Journal no longer uses comma-separated tag parsing, Money merchant suggestions are derived with `suggestFromHistory`, and all money amounts use `NumberField` with `showStepper={false}`.

- [ ] **Step 2: Verify RED**

Run: `npm run test:forms --workspace=mobile`

Expected: FAIL on current journal tag and money field behavior.

- [ ] **Step 3: Implement assisted entry**

Keep Home habit text and journal bodies open. Use existing journal tags as chips plus one custom tag input. Derive merchant history from logged expenses and common saving-goal suggestions locally. Convert amount, income, budget, target, and contribution inputs to currency-labeled `NumberField` controls without steppers.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:forms --workspace=mobile && npm run test:content --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

```powershell
git add 'mobile/app/(tabs)/index.tsx' 'mobile/app/(tabs)/journal.tsx' 'mobile/app/(tabs)/money.tsx' mobile/components/ritual/JournalStep.tsx mobile/lib/forms/assistedInputs.test.ts
git commit -m "feat: add assisted journal and money entry"
```

### Task 5: Meals Form Adoption

**Files:**
- Modify: `mobile/app/meals/profile.tsx`
- Modify: `mobile/app/meals/manual.tsx`
- Modify: `mobile/app/meals/submit-food.tsx`
- Test: `mobile/lib/forms/assistedInputs.test.ts`

**Interfaces:**
- Consumes: all shared controls.
- Preserves: `NutritionProfile`, `MealLogRecord`, and community submission payloads.

- [ ] **Step 1: Add failing Meals form assertions**

Assert profile uses `DateField`, common diet/allergy chips, ingredient suggestions, and prep-time choices; manual and submit-food use `SelectField` for serving units and `NumberField` for quantities.

- [ ] **Step 2: Verify RED**

Run: `npm run test:forms --workspace=mobile`

Expected: FAIL on current free-text fields.

- [ ] **Step 3: Implement profile controls**

Use diet choices `vegetarian`, `vegan`, `pescatarian`, `gluten-free`, `dairy-free`, and `halal`; allergy choices `fish`, `shellfish`, `peanut`, `tree nuts`, `dairy`, `egg`, `soy`, `wheat/gluten`, and `sesame`; prep choices `15`, `30`, `45`, `60`, and `90`. Preserve custom values in the existing arrays.

- [ ] **Step 4: Implement logging controls**

Use the shared serving-unit list. Keep calories/macros direct numeric entry, quantity as a `0.25` stepper, and notes free. Keep the manual meal name open for the debounced provider assistance added by the Meals refinement plan.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:forms --workspace=mobile && npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile && npm run deps:check --workspace=mobile`

```powershell
git add mobile/app/meals mobile/lib/forms/assistedInputs.test.ts
git commit -m "feat: simplify meals profile and logging inputs"
```

### Task 6: Assisted-Input Visual Verification

**Files:**
- Modify only files necessary to correct verified layout defects.

- [ ] **Step 1: Run the full mobile verification stack**

Run: `npm run test:forms --workspace=mobile && npm run test:auth --workspace=mobile && npm run test:content --workspace=mobile && npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile && npm run deps:check --workspace=mobile && git diff --check`

Expected: all commands pass with no warnings introduced by this work.

- [ ] **Step 2: Build, install, and open Android**

Use Android Studio's bundled JBR if Java is not globally available. Build or reuse `mobile/android/app/build/outputs/apk/debug/app-debug.apk`, install with `adb install -r`, reverse port 8081, and open the Expo dev client.

- [ ] **Step 3: Verify compact layouts**

Check onboarding, Settings, Health, Home, Journal, Money, Nutrition Profile, Manual entry, and Submit food. Confirm labels do not overlap, custom options remain reachable, keyboard dismissal works, and steppers do not resize rows.

- [ ] **Step 4: Commit verified corrections**

```powershell
git add mobile
git commit -m "fix: polish assisted inputs on compact screens"
```
