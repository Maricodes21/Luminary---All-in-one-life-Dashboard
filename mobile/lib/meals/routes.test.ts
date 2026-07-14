import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDirectory = path.resolve(__dirname, '../../app');

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
