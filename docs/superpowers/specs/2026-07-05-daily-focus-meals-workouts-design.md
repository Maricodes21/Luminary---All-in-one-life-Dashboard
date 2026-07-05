# Daily Focus, Meals, Workouts, and Ritual Design

## Goal

Refresh the Luminary mobile home and meals experience so the app feels more personal, legible, and actionable while staying local-first.

## Scope

- Replace the static Today's focus copy with a deterministic daily rotating note.
- Show custom habit-related icons inside habit checkboxes instead of a generic tick.
- Fix the meal calorie target card so the calorie text fits and remove the logged target sentence.
- Keep the protein suggestion short, then add meal-card carousels for suggested meals.
- Turn the weekly meal plan into day preview carousels with day details and meal prep instructions.
- Expand workout variety so generated plans do not repeat the same small set of sessions per category and level.
- Remove the central nightly ritual floating tab button and show a home card only when today's ritual is not done.

## UX Design

Home keeps the current quiet dashboard structure. The Today's focus card uses a daily note chosen from local date, profile tone, active habits, meal progress, and workout/ritual status. Notes are rotating and deterministic: the same day shows the same message, tomorrow changes without a backend call.

Habit rows remain accessible checkboxes. The circular control still toggles completion, but its icon is inferred from the habit name or category: water, journal/book, home, money, clock, health, or sparkles. Completed habits use filled styling and line-through text rather than a check icon.

The nightly ritual moves out of the tab overlay. The bottom navigation becomes unobstructed, and Home shows a recessed ritual card with a clear action only when the app has no completed ritual signal for today.

Meals keeps the macro target card but simplifies the calorie ring. The center text shows the remaining calorie number and a compact label that can fit inside the circle. The adjacent Daily target label and "logged" sentence are removed, leaving macros and goal controls.

Protein suggestions keep the short line, then expose a horizontal carousel of meal cards that visually match logged meals. Each card can log that suggestion. Weekly plans show horizontal day preview cards; tapping a day opens a detail sheet, and tapping a meal opens prep instructions, ingredients, macros, and substitutions.

Workout generation uses richer local session pools per category and level. Beginner, steady, and advanced map to increasing weekly volume, and each generated plan rotates through more unique session names.

## Data Design

The implementation stays local-first in `mobile/lib` and `mobile/stores/useProductionStore.ts`.

- Daily focus helpers live in a focused local module and do not persist generated copy.
- Habit icon inference is a pure helper so Home and Ritual can share it later.
- Meal plan slots already support `prepSteps`, `recipeId`, and `substitutions`; generation should populate these fields.
- Workout plans currently store `days: string[]`; this pass can improve string variety without a schema migration.

## Testing

Add content tests for:

- Daily focus rotation is deterministic per date and changes across dates.
- Habit icon inference maps common habit text to semantic icon names.
- Meal plan generation populates preparation steps and does not repeat only two templates per goal.
- Workout plan generation produces diverse sessions by level and category.

Manual UI verification should include Home and Meals on the Android dev client or Expo runtime after type-check and lint pass.
