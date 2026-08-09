# Meals Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Meals personalization and reliability with canonical allergen filtering, animated macros, adaptive compact suggestions, safe substitutions, debounced search, and cached attributable recipe images.

**Architecture:** Deterministic pure helpers enforce safety and state transitions before UI or AI runs. Shared meal cards render logs, plans, and recommendations. Recipe imagery is resolved through an authenticated Supabase Edge Function adapter and stored in a service-written shared cache.

**Tech Stack:** Expo Router, Zustand, React Native Animated, Supabase Postgres/RLS and Edge Functions, Unsplash API, Zod, Node test runner.

## Global Constraints

- AI never overrides an allergen rejection or invents nutrition.
- Logged recipes must disappear from suggestions immediately and for the rest of the local day.
- Recommendation actions must fit inside the shared meal card.
- Routine catalog images use cached source-backed lookup, not generated images.
- Missing images, credentials, routes, plans, or malformed snapshots must remain recoverable.
- Unsplash credentials stay server-side and attribution remains available from recipe detail.

---

### Task 1: Canonical Allergens and Recipe Identity

**Files:**
- Create: `mobile/lib/meals/allergens.ts`
- Modify: `mobile/lib/meals/recommendations.ts`
- Modify: `mobile/lib/meals/recommendations.test.ts`

**Interfaces:**
- Produces: `expandAvoidedIngredients(values: string[]): string[]`, `ingredientMatchesAvoidance(name, values): boolean`, and `recipeIdentityForMeal(meal): string | null`, using the persisted provider ID for catalog meals.

- [ ] **Step 1: Write failing safety tests**

```ts
test('fish allergy blocks named fish and fish sauce', () => {
  const fishProfile = { ...profile, foodAllergies: ['fish'] };
  assert.equal(isRecipeAllowed(recipeWith('salmon fillet'), fishProfile), false);
  assert.equal(isRecipeAllowed(recipeWith('fish sauce'), fishProfile), false);
  assert.equal(isRecipeAllowed(recipeWith('starfruit'), fishProfile), true);
});

test('logged canonical recipe identities are excluded', () => {
  const result = recommendForNow({ recipes: recipeCatalog, profile, target, meals: [loggedCatalogMeal(recipeCatalog[0])], now, recentRecipeIds: [] });
  assert.ok(result.candidates.every((recipe) => recipe.id !== recipeCatalog[0].id));
});
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:meals --workspace=mobile`

Expected: fish aliases and logged-recipe exclusion fail.

- [ ] **Step 3: Implement deterministic normalization**

Define canonical families for fish, shellfish, peanut, tree nuts, dairy, egg, soy, wheat/gluten, and sesame. Tokenize ingredient names on non-alphanumeric boundaries and match normalized phrases, not raw substrings. Use the catalog recipe's stable `providerId` as the logged identity because it is already persisted through local and Supabase meal records.

- [ ] **Step 4: Apply one filter path**

Use `ingredientMatchesAvoidance` inside `isRecipeAllowed`; use the same function indirectly for daily suggestions, plans, edit-day, and substitutions. Filter logged recipe identities before scoring primary or snack candidates.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile`

```powershell
git add mobile/lib/meals 'mobile/app/(tabs)/meals.tsx'
git commit -m "feat: enforce canonical meal exclusions"
```

### Task 2: Macro Motion and Compact Suggestion Actions

**Files:**
- Create: `mobile/components/meals/MacroProgress.tsx`
- Modify: `mobile/components/meals/MealCard.tsx`
- Modify: `mobile/app/(tabs)/meals.tsx`
- Modify: `mobile/lib/meals/routes.test.ts`

**Interfaces:**
- Produces: `MealCardAction { icon: IconName; label: string; tone?: 'default' | 'primary' | 'danger'; onPress(): void }` and `MacroProgress`.

- [ ] **Step 1: Add failing source and behavior tests**

Assert `MealCard` accepts an `actions` array, Meals no longer renders `suggestionActions` below cards or rationale text, and `MacroProgress` clamps fill with `Math.min(1, value / target)`.

- [ ] **Step 2: Verify RED**

Run: `npm run test:meals --workspace=mobile`

Expected: FAIL on missing actions and macro component.

- [ ] **Step 3: Implement animated progress**

Use `Animated.Value`, `useEffect`, and `Animated.timing({ duration: 450, useNativeDriver: false })`. Render a stable 6px track, interpolate width from `0%` to `100%`, and use distinct existing palette colors for protein, carbs, and fat. Honor reduced motion by setting the value immediately when `AccessibilityInfo.isReduceMotionEnabled()` resolves true.

- [ ] **Step 4: Integrate card actions**

Render up to three 34x34 icon buttons in a fixed-width action rail. Daily suggestion actions are dismiss, reshuffle, and log. Dismiss records feedback; reshuffle advances a local cursor through valid candidates; log records acceptance, adds the meal with its stable `providerId`, and excludes it immediately.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

```powershell
git add mobile/components/meals 'mobile/app/(tabs)/meals.tsx' mobile/lib/meals/routes.test.ts
git commit -m "feat: refine adaptive meal suggestions"
```

### Task 3: Debounced Food and Manual Suggestions

**Files:**
- Create: `mobile/lib/meals/searchRequests.ts`
- Create: `mobile/lib/meals/searchRequests.test.ts`
- Modify: `mobile/app/meals/search.tsx`
- Modify: `mobile/app/meals/manual.tsx`

**Interfaces:**
- Produces: `createLatestRequestGate()` with `next(): number` and `isLatest(id): boolean`, and `SEARCH_DEBOUNCE_MS = 350`.

- [ ] **Step 1: Write failing request-order tests**

```ts
test('only the newest search request can publish results', () => {
  const gate = createLatestRequestGate();
  const first = gate.next();
  const second = gate.next();
  assert.equal(gate.isLatest(first), false);
  assert.equal(gate.isLatest(second), true);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:meals --workspace=mobile`

Expected: FAIL because `searchRequests.ts` does not exist.

- [ ] **Step 3: Implement request gating and debounce**

Export `SEARCH_DEBOUNCE_MS = 350` and a closure-backed incrementing gate. In Search, schedule `runSearch(query, requestId)` from `useEffect`, clear the timer on query change, and update results only when `isLatest(requestId)`. Submit cancels the timer and runs immediately. Keep previous results visible while loading.

- [ ] **Step 4: Reuse search in Manual entry**

Request up to five results for meal-name assistance. Selecting one prefills name, serving, nutrition, source, provider ID, and image; ignoring suggestions retains manual data.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

```powershell
git add mobile/lib/meals/searchRequests.ts mobile/lib/meals/searchRequests.test.ts mobile/app/meals/search.tsx mobile/app/meals/manual.tsx
git commit -m "feat: add responsive meal lookup suggestions"
```

### Task 4: Reproduce and Repair Substitution

**Files:**
- Create: `mobile/lib/meals/substitution.ts`
- Create: `mobile/lib/meals/substitution.test.ts`
- Modify: `mobile/app/meals/substitute/[id].tsx`
- Modify: `mobile/stores/useMealsStore.ts`
- Modify: `mobile/hooks/useMealsBootstrap.ts`

**Interfaces:**
- Produces: `firstRouteParam(value: string | string[] | undefined): string | null` and `replacePlanEntryRecipe(entry, recipe): MealPlanEntry`.

- [ ] **Step 1: Capture the current crash evidence**

Reproduce substitution on Android with Metro and `adb logcat` visible. Record the first application stack frame and the malformed value in the task notes before editing production code.

- [ ] **Step 2: Write the failing regression**

Test string-array route parameters, a plan entry missing `recipeSnapshot`, a replacement recipe with complete arrays, and the state update preserving `id`, `localDate`, `mealType`, and serving quantity. Add a source assertion that the route never calls `.map` on an unvalidated parameter or payload.

- [ ] **Step 3: Verify RED**

Run: `npm run test:meals --workspace=mobile`

Expected: FAIL on missing substitution helpers or the captured crash shape.

- [ ] **Step 4: Implement the root-cause fix**

Normalize the route ID with `firstRouteParam`. Convert the replacement in `replacePlanEntryRecipe`, validate arrays through `parseRecipe`, and return a recoverable screen when plan, entry, profile, or recipe validation is absent. Change the store operation to accept the complete validated replacement entry and enqueue that exact entry. Navigate only after the state contains the replacement recipe ID.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile`

Repeat the Android substitution flow three times, including after a reload.

```powershell
git add mobile/lib/meals/substitution.ts mobile/lib/meals/substitution.test.ts 'mobile/app/meals/substitute/[id].tsx' mobile/stores/useMealsStore.ts mobile/hooks/useMealsBootstrap.ts
git commit -m "fix: make meal substitutions recoverable"
```

### Task 5: Cached Unsplash Recipe Image Backend

**Files:**
- Create: `supabase/migrations/20260715120000_recipe_image_cache.sql`
- Create: `supabase/functions/_shared/meals/recipe-images.ts`
- Create: `supabase/tests/recipe-image-cache.test.cjs`
- Modify: `package.json`
- Modify: `supabase/functions/_shared/meals/types.ts`
- Modify: `supabase/functions/_shared/meals/router.ts`
- Modify: `supabase/functions/_shared/meals/supabase-runtime.ts`
- Modify: `supabase/functions/meals-api/index.ts`

**Interfaces:**
- Produces: `RecipeImageResult`, `RecipeImageProvider`, `RecipeImageCache`, and Meals action `resolve-recipe-image`.

- [ ] **Step 1: Write failing provider/cache tests**

Import `recipe-images.ts` using the same dynamic TypeScript import pattern as `meals-api-contract.test.cjs`. Test that a cache hit avoids provider fetch, a miss maps Unsplash `id`, `urls.small`, and `user.links.html`, weak or non-food results return `null`, and provider failure returns an unavailable response rather than throwing from the API handler. Append `supabase/tests/recipe-image-cache.test.cjs` to the root `test:meals:backend` script.

- [ ] **Step 2: Verify RED**

Run: `npm run test:meals:backend`

Expected: FAIL because the new action and interfaces do not exist.

- [ ] **Step 3: Add the migration**

Create `public.recipe_image_cache` with `recipe_id text primary key`, `provider text`, `provider_asset_id text`, `search_query text`, `image_url text`, `photographer_name text`, `photographer_url text`, `attribution_url text`, `selected_at timestamptz default now()`, and `invalidated_at timestamptz`. Enable RLS, grant authenticated `select`, add a policy allowing non-invalidated rows, and grant service role full access.

- [ ] **Step 4: Implement the adapter and cache**

`UnsplashRecipeImageProvider` calls `/search/photos?query=<recipe+cuisine+meal type>&orientation=landscape&content_filter=high&per_page=8` with `Authorization: Client-ID`. It selects the first result whose description or alt text includes a food token, maps required attribution, and preserves the returned CDN URL including `ixid`. `SupabaseRecipeImageCache` reads and upserts through service headers.

- [ ] **Step 5: Wire the authenticated action**

Validate `recipeId`, `recipeName`, optional `cuisine`, and optional `mealType`; check cache first; only call Unsplash when `UNSPLASH_ACCESS_KEY` is present; write successful selections; return `{ data: { image: RecipeImageResult | null, source: 'cache' | 'provider' | 'unavailable' } }`. Do not route this action through AI quota or paid-budget handling.

- [ ] **Step 6: Verify migration and function tests**

Run: `npx supabase db lint --workdir supabase` with the local Supabase stack running, then `npm run test:meals:backend`.

Expected: migration and tests pass; anonymous writes are denied.

- [ ] **Step 7: Commit**

```powershell
git add supabase/migrations supabase/functions
git commit -m "feat: cache attributable recipe images"
```

### Task 6: Mobile Recipe Image Hydration

**Files:**
- Create: `mobile/lib/meals/recipeImages.ts`
- Create: `mobile/lib/meals/recipeImages.test.ts`
- Modify: `mobile/lib/meals/validation.ts`
- Modify: `mobile/lib/meals/types.ts`
- Modify: `mobile/components/meals/MealCard.tsx`
- Modify: `mobile/app/(tabs)/meals.tsx`
- Modify: `mobile/app/meals/recipe/[id].tsx`

**Interfaces:**
- Consumes: backend `resolve-recipe-image`.
- Produces: `resolveRecipeImage(recipe): Promise<RecipeImageResult | null>` and session cache keyed by recipe ID.

- [ ] **Step 1: Write failing normalization/cache tests**

Test accepted schema, malformed response fallback, one request per recipe per session, and failed image invalidation to the neutral card fallback.

- [ ] **Step 2: Verify RED**

Run: `npm run test:meals --workspace=mobile`

Expected: FAIL because recipe image resolver is absent.

- [ ] **Step 3: Implement the client resolver**

Invoke `meals-api` with `resolve-recipe-image`, parse with Zod, memoize successful and null results, and never reject to callers. Add a small `useRecipeImage` hook that prefers exact catalog images, then cached resolved images, then undefined.

- [ ] **Step 4: Apply images consistently**

Use the hook for Today suggestions, logged catalog meals, plan cards, substitution cards, and recipe detail. Keep 64px shared card images. Recipe detail shows `Photo by <name> on Unsplash` as a tappable attribution row only when source-backed imagery is present.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:meals --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile && git diff --check`

```powershell
git add mobile/lib/meals mobile/components/meals mobile/app
git commit -m "feat: hydrate meal cards with cached images"
```

### Task 7: End-to-End Verification and Read-Only Reviews

**Files:**
- Modify only files required by verified defects.

- [ ] **Step 1: Run automated verification**

Run: `npm run test:forms --workspace=mobile && npm run test:meals --workspace=mobile && npm run test:content --workspace=mobile && npm run test:auth --workspace=mobile && npm run type-check --workspace=mobile && npm run lint --workspace=mobile && npm run deps:check --workspace=mobile && git diff --check`

- [ ] **Step 2: Verify Android behavior**

Build/install/open the dev client. Check macro animation, suggestion actions, logged exclusion, search debounce, Manual prefilling, every planner card, substitution, image loading/fallback, attribution, delete/undo, and sign-out cache clearing.

- [ ] **Step 3: Verify compact web behavior**

Capture compact and desktop screenshots. Check 64px image alignment, two-line titles, fixed action rails, no overlap, safe-area spacing, and scroll reachability.

- [ ] **Step 4: Dispatch read-only reviewers**

Send one reviewer through every Meals navigation path and one reviewer through card/input design consistency. Apply only findings reproduced by the primary agent.

- [ ] **Step 5: Commit verified corrections**

```powershell
git add mobile supabase
git commit -m "fix: harden meals refinement rollout"
```
