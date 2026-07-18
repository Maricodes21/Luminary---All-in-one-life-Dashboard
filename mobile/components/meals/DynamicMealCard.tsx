import { useRecipeImage } from '@/hooks/useRecipeImage';

import { MealCard, type MealCardProps } from './MealCard';

export function DynamicMealCard({ title, imageUri, ...props }: MealCardProps) {
  const image = useRecipeImage({ name: title, imageUri });
  return <MealCard {...props} title={title} imageUri={image?.uri} />;
}
