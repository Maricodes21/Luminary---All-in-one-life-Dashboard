import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDirectory = path.resolve(__dirname, '../../app');
const componentsDirectory = path.resolve(__dirname, '../../components/meals');

test('every Meals workflow has a concrete route file', () => {
  const routes = [
    'meals/search.tsx',
    'meals/manual.tsx',
    'meals/camera.tsx',
    'meals/camera-review.tsx',
    'meals/profile.tsx',
    'meals/plan-builder.tsx',
    'meals/edit-day.tsx',
    'meals/submit-food.tsx',
    'meals/recipe/[id].tsx',
    'meals/substitute/[id].tsx',
  ];

  for (const route of routes) {
    assert.equal(fs.existsSync(path.join(appDirectory, route)), true, `${route} is missing`);
  }
});

test('recipe detail handles missing IDs before rendering recipe arrays', () => {
  const source = fs.readFileSync(path.join(appDirectory, 'meals/recipe/[id].tsx'), 'utf8');
  const missingGuard = source.indexOf('if (!recipe || !recipe.nutrition)');
  const ingredientMap = source.indexOf('ingredientRows.map');
  const instructionMap = source.indexOf('instructionRows.map');

  assert.ok(missingGuard >= 0);
  assert.ok(ingredientMap > missingGuard);
  assert.ok(instructionMap > missingGuard);
  assert.match(source, /recipe\?\.ingredients \?\? \[\]/);
  assert.match(source, /recipe\?\.steps \?\? \[\]/);
});

test('camera attachments preserve the complete manual-entry draft', () => {
  const manual = fs.readFileSync(path.join(appDirectory, 'meals/manual.tsx'), 'utf8');
  const camera = fs.readFileSync(path.join(appDirectory, 'meals/camera.tsx'), 'utf8');
  for (const field of ['returnId', 'returnProtein', 'returnCarbs', 'returnFat', 'returnQuantity', 'returnUnit', 'returnMealType', 'returnNotes']) {
    assert.match(manual, new RegExp(field));
    assert.match(camera, new RegExp(field));
  }
});

test('recipe detail can resolve an authoritative plan-entry snapshot', () => {
  const source = fs.readFileSync(path.join(appDirectory, 'meals/recipe/[id].tsx'), 'utf8');
  assert.match(source, /recipeSnapshot/);
  assert.match(source, /getRecipeById\(id\).*snapshot/s);
});

test('meal cards expose a compact action rail capped at three actions', () => {
  const source = fs.readFileSync(path.join(componentsDirectory, 'MealCard.tsx'), 'utf8');

  assert.match(source, /export type MealCardAction/);
  assert.match(source, /actions\??:\s*MealCardAction\[\]/);
  assert.match(source, /actions\.slice\(0,\s*3\)/);
});

test('daily suggestions keep actions inside cards without rationale copy', () => {
  const source = fs.readFileSync(path.join(appDirectory, '(tabs)/meals.tsx'), 'utf8');

  assert.doesNotMatch(source, /suggestionActions/);
  assert.doesNotMatch(source, /recommendation\.rationale|const rationale/);
  assert.match(source, /actions=\{/);
});

test('macro progress animates a clamped fill and honors reduced motion', () => {
  const source = fs.readFileSync(path.join(componentsDirectory, 'MacroProgress.tsx'), 'utf8');

  assert.match(source, /Math\.min\(1,\s*value\s*\/\s*target\)/);
  assert.match(source, /new Animated\.Value/);
  assert.match(source, /Animated\.timing/);
  assert.match(source, /duration:\s*450/);
  assert.match(source, /useNativeDriver:\s*false/);
  assert.match(source, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(source, /height:\s*6/);
});

test('food search debounces typing and ignores stale responses', () => {
  const source = fs.readFileSync(path.join(appDirectory, 'meals/search.tsx'), 'utf8');

  assert.match(source, /setTimeout\([^]*350/);
  assert.match(source, /requestSequence\.current/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /query\.trim\(\)\.length < 2/);
});

test('substitution tolerates older persisted plans without array fields', () => {
  const route = fs.readFileSync(path.join(appDirectory, 'meals/substitute/[id].tsx'), 'utf8');
  const store = fs.readFileSync(path.resolve(__dirname, '../../stores/useMealsStore.ts'), 'utf8');

  assert.match(route, /Array\.isArray\(user\?\.plans\)/);
  assert.match(route, /Array\.isArray\(item\.entries\)/);
  assert.match(route, /InteractionManager\.runAfterInteractions/);
  assert.ok(route.indexOf('router.replace') < route.indexOf('updatePlanEntry(planId'));
  assert.match(store, /Array\.isArray\(user\.plans\)/);
  assert.match(store, /Array\.isArray\(plan\.entries\)/);
});
