import { useRecipeImage } from '@/hooks/useRecipeImage';
import { getRecipeVisualSource } from '@/lib/meals/recipeVisuals';

import { MealCard, type MealCardProps } from './MealCard';

export function DynamicMealCard({ title, imageUri, recipeId, ...props }: MealCardProps & { recipeId?: string }) {
  const imageSource = getRecipeVisualSource(recipeId);
  const image = useRecipeImage({ name: title, imageUri }, !!imageSource);
  return <MealCard {...props} title={title} imageSource={imageSource} imageUri={imageSource ? undefined : image?.uri} />;
}
