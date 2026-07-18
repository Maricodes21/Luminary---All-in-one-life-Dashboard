import assert from 'node:assert/strict';
import test from 'node:test';

import {
  recipeImageUri,
  selectBestOpenverseImage,
  type OpenverseImageResult,
} from './recipeImages';

const result = (overrides: Partial<OpenverseImageResult>): OpenverseImageResult => ({
  id: 'image-1',
  title: 'Untitled',
  url: 'https://images.example/original.jpg',
  thumbnail: 'https://images.example/thumb.jpg',
  creator: 'Test photographer',
  license: 'by',
  foreign_landing_url: 'https://images.example/source',
  ...overrides,
});

test('exact meal-name matches resolve with attribution metadata', () => {
  const selected = selectBestOpenverseImage('Tuna Cucumber Boats', [
    result({ id: 'weak', title: 'Tuna salad' }),
    result({ id: 'exact', title: 'Mock Tuna Cucumber Boat' }),
  ]);

  assert.equal(selected?.id, 'exact');
  assert.equal(selected?.uri, 'https://images.example/thumb.jpg');
  assert.equal(selected?.creator, 'Test photographer');
  assert.ok((selected?.confidence ?? 0) >= 0.7);
});

test('common food aliases can support a credible exact dish match', () => {
  const selected = selectBestOpenverseImage('Smoked Salmon Breakfast Bagel', [
    result({ id: 'salmon-only', title: 'Smoked salmon' }),
    result({ id: 'bagel', title: 'Lox and schmear on a homemade bagel' }),
  ]);

  assert.equal(selected?.id, 'bagel');
});

test('weak provider results are rejected instead of showing a misleading meal', () => {
  const selected = selectBestOpenverseImage('Lemon Herb Chicken and Potatoes', [
    result({ title: 'Bundt Pan Baked Chicken Dinner' }),
    result({ title: 'Steaks With Boulangere Potatoes and Green Beans' }),
  ]);

  assert.equal(selected, null);
});

test('legacy category images are ignored while verified exact images are retained', () => {
  assert.equal(recipeImageUri({
    name: 'Tuna Cucumber Boats',
    imageUri: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=720&auto=format&fit=crop&q=82',
  }), undefined);
  assert.equal(recipeImageUri({
    name: 'Tuna Cucumber Boats',
    image: { kind: 'exact', uri: 'https://images.example/tuna-cucumber-boats.jpg' },
  }), 'https://images.example/tuna-cucumber-boats.jpg');
});
