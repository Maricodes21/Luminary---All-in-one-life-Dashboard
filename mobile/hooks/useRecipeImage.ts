import { useEffect, useMemo, useState } from 'react';

import { resolveRecipeImage } from '@/lib/meals/recipeImageLookup';
import { recipeImageUri, type RecipeImageMatch } from '@/lib/meals/recipeImages';

export function useRecipeImage(recipe: { name: string; imageUri?: string; image?: { kind: string; uri?: string } }, skipLookup = false): RecipeImageMatch | null {
  const supplied = recipeImageUri(recipe);
  const initial = useMemo<RecipeImageMatch | null>(() => supplied
    ? { id: `supplied:${recipe.name}`, uri: supplied, confidence: 1 }
    : null, [recipe.name, supplied]);
  const [match, setMatch] = useState<RecipeImageMatch | null>(initial);

  useEffect(() => {
    let cancelled = false;
    setMatch(initial);
    if (!initial && !skipLookup) void resolveRecipeImage(recipe).then((next) => { if (!cancelled) setMatch(next); });
    return () => { cancelled = true; };
  }, [initial, recipe.name, skipLookup]);

  return match;
}
