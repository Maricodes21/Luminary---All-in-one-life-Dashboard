import { recipeCatalog } from './catalog';
import type { MealPlan } from './types';

export type ShoppingCategory = 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Frozen' | 'Other';
export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  mealCount: number;
};

export function buildShoppingList(plan: MealPlan): ShoppingItem[] {
  const consolidated = new Map<string, ShoppingItem>();
  for (const entry of plan.entries) {
    const recipe = entry.recipeSnapshot ?? recipeCatalog.find((item) => item.id === entry.recipeId);
    if (!recipe) continue;
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.name.trim();
      if (!name) continue;
      const unit = ingredient.unit?.trim().toLowerCase() || 'item';
      const key = `${normalizeIngredient(name)}:${unit}`;
      const current = consolidated.get(key);
      const quantity =
        Math.max(0, ingredient.quantity ?? 0) * Math.max(1, entry.servingQuantity || 1);
      if (current) {
        current.quantity = round(current.quantity + quantity);
        current.mealCount += 1;
      } else {
        consolidated.set(key, {
          id: key,
          name,
          quantity: round(quantity),
          unit,
          category: categorize(name),
          mealCount: 1,
        });
      }
    }
  }
  return [...consolidated.values()].sort(
    (left, right) =>
      left.category.localeCompare(right.category) || left.name.localeCompare(right.name),
  );
}

function categorize(name: string): ShoppingCategory {
  const value = name.toLowerCase();
  if (
    /spinach|tomato|onion|pepper|lettuce|cucumber|carrot|broccoli|berry|berries|banana|apple|lemon|lime|avocado|herb|potato|mushroom|fruit|vegetable/.test(
      value,
    )
  )
    return 'Produce';
  if (/chicken|beef|turkey|pork|fish|salmon|hake|tuna|egg|tofu|lentil|bean|chickpea/.test(value))
    return 'Protein';
  if (/milk|yoghurt|yogurt|cheese|cottage|cream/.test(value)) return 'Dairy';
  if (/frozen|ice/.test(value)) return 'Frozen';
  if (
    /rice|oat|pasta|couscous|bread|wrap|oil|spice|sauce|stock|flour|seed|nut|granola|honey/.test(
      value,
    )
  )
    return 'Pantry';
  return 'Other';
}

function normalizeIngredient(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(fresh|chopped|diced|sliced|cooked|raw|large|small)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function round(value: number) {
  return Math.round(value * 100) / 100;
}
