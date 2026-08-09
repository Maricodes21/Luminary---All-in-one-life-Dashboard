# Meals Personalization and Assisted Inputs Design

## Goal

Finish the Meals experience as a personal, adaptive planner while reducing avoidable typing throughout Luminary. Structured values use purpose-built controls; free text remains available where the user is expressing something genuinely personal or searching an open-ended library.

## Scope

This design covers two connected workstreams:

1. Meals reliability and personalization: profile editing, allergen safety, macro progress, adaptive suggestions, substitution stability, search assistance, and accurate recipe imagery.
2. App-wide assisted input: shared date, option, numeric, unit, and suggestion controls applied to every current input screen.

The work remains on `archive/meal-functionality`. Existing account, journal, notes, and open search behavior is preserved unless this document explicitly changes it.

## Interaction Principles

- Use a calendar for dates.
- Use segmented controls or radio-style choices for short, mutually exclusive sets.
- Use chips for compact multi-select sets.
- Use a menu or bottom-sheet picker for longer option sets.
- Use a stepper for bounded values where small adjustments are common.
- Use a numeric keyboard for unbounded monetary and nutrition measurements.
- Use debounced suggestions for values that are open-ended but repeatable.
- Keep free text for names, email, passwords, journal writing, personal notes, merchants, custom goals, and search queries.
- Every assisted control remains accessible by label, supports compact Android layouts, and does not resize its parent when values change.

## Shared Input Components

Create focused controls under `mobile/components/ui` rather than duplicating form logic in screens:

- `DateField`: displays a formatted date and opens the platform date picker. It stores an ISO local date and prevents future dates where appropriate.
- `ChoiceGroup`: accessible single-select segmented or wrapped choices for two to five options.
- `MultiChoiceField`: common choices as removable chips, with an optional custom-value input for values outside the list.
- `SelectField`: opens an action sheet for longer fixed lists such as serving units.
- `NumberField`: numeric entry with validation, units, and optional decrement/increment controls. Steppers are used only when the value has a sensible interval and bounds.
- `AutocompleteField`: debounced suggestions from local history or a provider while retaining free entry.

These controls follow the existing Luminary palette, spacing, typography, and compact card geometry. They do not introduce a second form design system.

## App-Wide Field Audit

### Onboarding and Settings

| Screen | Field | Result |
| --- | --- | --- |
| Account | Email, password | Keep text; these values cannot be selected safely. |
| Profile | Display name | Keep text. |
| Profile | Pronouns | Common pronoun chips plus `Custom`; custom selection reveals one text field. |
| Body | Weight, height | `NumberField` with unit label and stepper; direct numeric entry remains available. |
| Ready | Reminder time | Keep the existing hour/minute selectors. |
| Settings | Display name | Keep text. |
| Settings | Tone, reminder hour, notification settings | Keep or normalize existing chips and switches with shared controls. |

### Home, Ritual, and Journal

| Screen | Field | Result |
| --- | --- | --- |
| Home | Custom habit or promise | Keep text because it is user-authored; show recent habit names as optional suggestions when available. |
| Ritual journal | Entry body | Keep multiline text. |
| Ritual journal | Tags | Keep existing chips; no comma-separated typing. |
| Journal | Entry body | Keep multiline text and prompt choices. |
| Journal | Tags | Replace comma-separated tag entry with chip selection plus a single custom-tag input. |

### Health

Health category, level, and available time already use structured choices. They will adopt the shared choice component without changing behavior.

### Money

| Field | Result |
| --- | --- |
| Expense amount, income, budget limits, saving targets, contributions | Keep numeric entry because values are unbounded; use `NumberField` with currency formatting and numeric keyboard, without steppers. |
| Merchant | Use local-history autocomplete while allowing a new merchant name. |
| Expense category | Keep the existing chips through `ChoiceGroup` or `MultiChoiceField` styling. |
| Expense note | Keep optional free text. |
| Saving-goal name | Keep free text and offer optional common goal suggestions without forcing a category. |

### Meals

| Field | Result |
| --- | --- |
| Date of birth | `DateField` using the native calendar; future dates are invalid. |
| Weight and height | Bounded `NumberField` controls with steppers and direct numeric editing. |
| Biological sex, activity, goal | Shared single-select choice controls. |
| Dietary preferences | Multi-select chips for common patterns plus a custom value path. |
| Allergies | Multi-select allergen chips plus custom values. Broad allergens expand to canonical ingredient families for filtering. |
| Ingredients to avoid | Debounced ingredient suggestions from the catalog, stored as removable chips; custom ingredients remain possible. |
| Maximum preparation time | Fixed choices for 15, 30, 45, 60, and 90 minutes plus a bounded stepper for a custom value. |
| Food search | Debounced results while typing; explicit submit remains available. |
| Manual food name | Debounced catalog/provider suggestions with manual fallback. |
| Manual and submitted-food serving unit | Fixed unit picker with `serving`, `g`, `kg`, `ml`, `l`, `cup`, `tbsp`, `tsp`, `piece`, and `slice`; custom unit remains available. |
| Quantity, calories, and macros | Numeric controls. Quantity uses a stepper with direct numeric editing; nutrition values use direct numeric entry. |
| Notes, food name, brand, barcode | Keep appropriate text/numeric entry because values are not safely enumerable. |

## Allergen Safety

Allergies and disliked ingredients are stored separately, but both are ingredients to avoid during recommendation and planning.

A deterministic allergen normalizer expands broad terms before recipe checks. Initial canonical families include fish, shellfish, peanuts, tree nuts, dairy, egg, soy, wheat/gluten, and sesame. For example, `fish` matches tuna, salmon, sardine, anchovy, cod, hake, trout, and fish sauce. Matching is case-insensitive and token-aware so short terms do not accidentally match unrelated words.

The same `isRecipeAllowed` path governs daily suggestions, plan generation, edit-day choices, and substitutions. AI never overrides an allergen rejection. Custom allergy text remains visible to the user and is included in exact ingredient matching even when it has no known family expansion.

## Meals Dashboard

The calorie ring remains the primary calorie indicator. Protein, carbohydrate, and fat rows gain stable progress tracks with animated colored fills. Progress clamps visually at 100 percent while the numeric value may show an over-target amount. Motion respects reduced-motion settings.

`For right now` becomes a compact section indicator with no explanatory paragraph. One primary suggestion and an optional snack appear only when useful. Suggestion cards reuse the shared meal-card size and include three compact in-card actions:

- dismiss (`Not for me`),
- reshuffle,
- log meal.

Logging a suggested recipe records acceptance and immediately removes that recipe from the candidate pool. Deterministic recommendation filtering also excludes recipes already logged that day by `providerId` or canonical recipe ID, so rerenders and restarts do not bring the same suggestion back.

Reshuffle advances to the next valid candidate without weakening calorie, timing, dietary, or allergen constraints. Dismissal records feedback and excludes the candidate for the current session.

## Search Assistance

Food search begins after 350 milliseconds of inactivity and ignores stale responses when a newer query is in flight. Pressing Search runs immediately. Blank queries continue to show quick choices.

The ranking contract remains unchanged: direct provider and verified records precede AI-assisted interpretation. Suggestions never fabricate nutrition. If no verified record exists, Manual entry opens with the query prefilled.

Manual meal-name assistance calls the same normalized search path but does not force selection. Selecting a result prefills verified nutrition and serving data; continuing with custom text preserves the manual workflow.

## Substitution Stability

The substitute crash must be reproduced before changing behavior. The investigation traces the selected plan entry through route parameters, local store updates, recipe snapshot validation, synchronization, and return navigation.

The stable contract is:

- route IDs may be a string or the first value of an Expo Router parameter array;
- missing plans, entries, profiles, or malformed snapshots render a recoverable state;
- substitution candidates are always arrays before rendering;
- a selected recipe is converted through one tested `replacePlanEntryRecipe` function;
- the store update and queued synchronization use the same validated entry;
- navigation occurs only after the local replacement succeeds.

No invalid route or persisted payload may trigger an undefined `.map` or force an app reload.

## Recipe Image Resolution

Routine catalog images use source-backed lookup, not Gemini or OpenAI image generation.

Add an authenticated `resolve-recipe-image` operation to the Meals API. The server searches Unsplash using the canonical recipe name plus cuisine or meal type, selects a landscape food result, and stores the selection in a `recipe_image_cache` table keyed by canonical recipe ID. The cache stores provider name, provider asset ID, search query, image URL, photographer name, photographer URL, attribution URL, and selection timestamp.

The client requests an image only when a recipe has no exact catalog image. Cache hits return without a provider request. The mobile client receives the resized CDN URL and attribution metadata; the Unsplash access key never ships in the app. Required attribution is available from recipe detail, and Unsplash CDN URLs are used as required by its API guidelines.

Provider lookup is feature-flagged. Missing credentials, rate limits, weak matches, or network failures keep the existing neutral fallback and never block logging, planning, or recipe navigation. A mismatched image can be invalidated server-side and resolved again. Generated images remain reserved for validated novel recipes and are outside this routine lookup path.

The cache is shared across users because catalog recipes are not private. The database migration grants clients no direct write access; only the service path may create or replace cached selections.

## Data and Interfaces

Add or extend the following contracts:

- canonical allergen families and `expandAvoidedIngredients(values)`;
- `recipeIdentityForMeal` for comparing logged meals with candidate recipes;
- `replacePlanEntryRecipe(entry, recipe)` returning a validated plan entry;
- `RecipeImageResult` with image and attribution fields;
- `recipe_image_cache` migration with read access for authenticated users and service-role writes;
- Meals API `resolve-recipe-image` action and provider adapter;
- local recipe-image cache to avoid repeated requests while offline.

Existing nutrition snapshots and meal history remain immutable when the profile changes. No unrelated database records are rewritten.

## Error Handling and Offline Behavior

- Date, numeric, and select controls show inline validation without discarding entered values.
- Search keeps the last valid results while a newer request loads.
- AI or provider failure falls back to deterministic search and neutral recipe imagery.
- Image URLs that fail to render fall back locally and are eligible for later re-resolution.
- Substitution errors leave the original meal intact and show a recoverable message.
- All user-scoped form history and autocomplete data is cleared on sign-out with the existing private cache.

## Delivery Slices

1. Shared assisted-input components and app-wide field replacements.
2. Nutrition profile calendar, allergen families, macro animation, and adaptive suggestion-card behavior.
3. Debounced food/manual search and substitution root-cause fix.
4. Supabase recipe-image cache, Unsplash resolver, client image hydration, and attribution.
5. Android and compact-web visual verification, regression tests, and navigation review.

Each slice must leave the app runnable and independently testable.

## Testing

Automated tests cover:

- date formatting, future-date rejection, numeric bounds, choice selection, and custom multi-choice values;
- all initial allergen families, token-aware matching, and consistent filtering across suggestions, plans, and substitutions;
- macro progress clamping and reduced-motion behavior;
- logged recipes disappearing from suggestions and reshuffle preserving all constraints;
- debounced search timing, stale-result suppression, and manual fallback;
- plan-entry replacement from valid, missing, and malformed route/state data;
- recipe-image cache hits, provider failures, weak-match fallback, attribution mapping, and access control;
- account isolation for local autocomplete history and Meals state.

Verification includes Meals, auth, and content tests; type checking; lint; dependency checks; migration validation; `git diff --check`; Android build/install/open; and compact Android and web screenshots. Read-only final reviews check dead navigation and design consistency.

## Non-Goals

- No gallery import for meal photos.
- No generated image for every catalog meal.
- No replacement of genuine journal, note, account, or search text with forced choices.
- No weight-history chart or coaching flow in this pass.
- No commercial food-data subscription decision.

## Success Criteria

- Users can complete structured forms with materially less typing.
- A broad allergy such as `fish` excludes relevant fish ingredients everywhere Meals chooses food.
- Macro progress is visibly colored and animated.
- Logged suggestions disappear immediately and do not return during the same day.
- Suggestion controls fit within the shared meal card without increasing card height excessively.
- Substitution never crashes or loses the original plan entry.
- Every catalog meal can resolve to a stable, cached, attributable image or a deliberate neutral fallback.
- All current input screens remain usable on compact Android layouts and with assistive technology.
