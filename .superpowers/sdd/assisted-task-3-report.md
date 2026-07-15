# Assisted Inputs Task 3 Report

## Status

Complete and ready for commit.

## TDD Evidence

1. RED: Added source-contract assertions for onboarding, Settings, Health, and account credentials in `mobile/lib/forms/assistedInputs.test.ts`.
   - Command: `npm run test:forms --workspace=mobile`
   - Result: exit 1; the new test failed because `mobile/app/onboarding/profile.tsx` did not import `ChoiceGroup`.
   - Failing assertion: expected `/import\s+\{[^}]*ChoiceGroup[^}]*\}\s+from\s+['"]@\/components\/ui['"]/`.
2. GREEN: Replaced the structured controls, then reran `npm run test:forms --workspace=mobile`.
   - Result: exit 0; 5 tests passed, 0 failed.
3. Compiler regression RED: the first full check surfaced `app/onboarding/profile.tsx(76,47): error TS2339: Property 'label' does not exist` after the shared label style was removed while the display-name field still used it.
   - Added the missing-style source assertion and reran `npm run test:forms --workspace=mobile`.
   - Result: exit 1; the new assertion failed for `/label:\s*\{/`.
4. Compiler regression GREEN: restored only the required profile label style and reran `npm run test:forms --workspace=mobile`.
   - Result: exit 0; 5 tests passed, 0 failed.

## Full Task Checks

The requested `&&` command is not supported by this PowerShell host, so the same command sequence was run through `cmd.exe`:

```text
cmd.exe /d /s /c "npm run test:forms --workspace=mobile && npm run test:auth --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile"
```

- `test:forms`: exit 0; 5 passed, 0 failed.
- `test:auth`: exit 0; 7 passed, 0 failed.
- `type-check`: exit 0.
- `lint`: exit 0.
- `git diff --check`: exit 0.

## Files

- `mobile/app/onboarding/profile.tsx`
- `mobile/app/onboarding/body.tsx`
- `mobile/app/settings.tsx`
- `mobile/app/(tabs)/health.tsx`
- `mobile/lib/forms/assistedInputs.test.ts`

## Self-Review

- Profile uses the requested `she/her`, `he/him`, `they/them`, and `Custom` choices. A custom value remains an optional `string` before calling the existing `setPronouns` store action.
- Body keeps local string input state and retains the existing positive-number conversion before calling `setWeight` and `setHeight`; steppers use `0.5 kg` and `1 cm`.
- Settings and Health retain their existing single enum/string selections while rendering `ChoiceGroup`; no stored values or save payload mappings changed.
- Account email and password remain free-text `TextInput` fields and were protected by source-contract assertions.
- The obsolete Health-local `Choice` helper and chip loops were removed. No unrelated files were changed.

## Concerns

- No known code or test concerns.
- The task was not exercised on an emulator, so shared-control layout and touch behavior have not had device-level visual verification in this pass.

## Important Task 3 Follow-up Fix

### RED/GREEN Evidence

1. RED: Updated `mobile/lib/forms/assistedInputs.test.ts` to require no `MultiChoiceField`, an unselected pronoun state for an empty saved value, a Custom-only text input, and no `choices[0]` persistence.
   - Command: `npm run test:forms --workspace=mobile`
   - Result: exit 1; the onboarding adoption test failed because `mobile/app/onboarding/profile.tsx` still matched `MultiChoiceField`.
2. GREEN: Replaced the custom multi-choice path with a dedicated `TextInput`; made `getPronounChoice` return `undefined` for no saved pronoun; passed `pronounChoice ?? ''` to the shared `ChoiceGroup` so no option is initially selected.
   - Command: `npm run test:forms --workspace=mobile`
   - Result: exit 0; 5 tests passed, 0 failed.
3. Type boundary RED: the first full check failed at `app/onboarding/profile.tsx(99,34)` because the ChoiceGroup UI sentinel widened the callback value to include `''`, which the nullable local state does not store.
   - Added source coverage for `setPronounChoice(choice || undefined)`.
   - Command: `npm run test:forms --workspace=mobile`
   - Result: exit 1; the onboarding adoption test failed on the missing sentinel-to-undefined mapping.
4. Type boundary GREEN: mapped the UI-only empty sentinel back to `undefined` before updating local state.
   - Command: `npm run test:forms --workspace=mobile`
   - Result: exit 0; 5 tests passed, 0 failed.

### Final Follow-up Checks

```text
cmd.exe /d /s /c "npm run test:forms --workspace=mobile && npm run test:auth --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile"
```

- `test:forms`: exit 0; 5 passed, 0 failed.
- `test:auth`: exit 0; 7 passed, 0 failed.
- `type-check`: exit 0.
- `lint`: exit 0.
- `git diff --check`: exit 0.

### Follow-up Self-Review

- A profile with no saved pronouns starts with no selected ChoiceGroup option and no custom field.
- A saved common pronoun maps to one ChoiceGroup value; a saved nonstandard string maps to Custom and preserves that one string in the custom text field.
- Selecting a common option writes that exact string. Selecting Custom clears a prior common choice once and the dedicated input writes one deterministic custom string.
- Display-name free text and the existing `setPronouns(pronouns.trim() || undefined)` payload conversion remain unchanged.
