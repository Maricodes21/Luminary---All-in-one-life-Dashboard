type ImageCategory = 'breakfast-bowl' | 'smoothie' | 'egg' | 'sandwich' | 'salad' | 'chicken' | 'meat' | 'fish' | 'pasta' | 'curry' | 'soup' | 'baked-snack';

const IMAGE_CACHE: Record<ImageCategory, string> = {
  'breakfast-bowl': 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=720&auto=format&fit=crop&q=82',
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=720&auto=format&fit=crop&q=82',
  egg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=720&auto=format&fit=crop&q=82',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=720&auto=format&fit=crop&q=82',
  salad: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=720&auto=format&fit=crop&q=82',
  chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=720&auto=format&fit=crop&q=82',
  meat: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=720&auto=format&fit=crop&q=82',
  fish: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=720&auto=format&fit=crop&q=82',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=720&auto=format&fit=crop&q=82',
  curry: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=720&auto=format&fit=crop&q=82',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=720&auto=format&fit=crop&q=82',
  'baked-snack': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=720&auto=format&fit=crop&q=82',
};

export function recipeImageCategory(name: string): ImageCategory {
  const value = name.toLowerCase();
  if (/salmon|tuna|cod|hake|trout|fish/.test(value)) return 'fish';
  if (/smoothie|kefir|shake/.test(value)) return 'smoothie';
  if (/omelette|egg|shakshuka|breakfast hash/.test(value)) return 'egg';
  if (/wrap|sandwich|bagel|pita|toast/.test(value)) return 'sandwich';
  if (/pasta|lasagna|stroganoff|meatball|polenta/.test(value)) return 'pasta';
  if (/curry|chili/.test(value)) return 'curry';
  if (/soup/.test(value)) return 'soup';
  if (/chicken|turkey/.test(value)) return 'chicken';
  if (/pork|beef/.test(value)) return 'meat';
  if (/muffin|baked pear|oat bites|trail mix|roasted chickpea/.test(value)) return 'baked-snack';
  if (/oat|porridge|quinoa|chia|yogurt|granola|breakfast/.test(value)) return 'breakfast-bowl';
  return 'salad';
}

export function cachedRecipeImageUri(name: string): string {
  return IMAGE_CACHE[recipeImageCategory(name)];
}

export function recipeImageUri(recipe: { name: string; imageUri?: string; image?: { kind: string; uri?: string } }): string {
  if (recipe.image?.kind === 'exact' && recipe.image.uri) return recipe.image.uri;
  return recipe.imageUri ?? cachedRecipeImageUri(recipe.name);
}
