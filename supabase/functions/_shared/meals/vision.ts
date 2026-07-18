export const MEAL_VISION_PROMPT_VERSION = 'meal-vision-v1';

export function buildMealVisionPrompt(locale = 'en-ZA'): string {
  return [
    MEAL_VISION_PROMPT_VERSION,
    'Inspect the meal photo and identify only food ingredients or components that are visibly present.',
    'Use common food names, not a recipe title. Do not infer oils, seasonings, sauces, or fillings that are not visible.',
    'Return JSON exactly matching {"ingredients":["ingredient"]}.',
    'Return 1 to 12 unique ingredient strings and no other keys.',
    'Never return quantities, nutrition, calories, macros, brands, or barcodes.',
    `Locale: ${locale}`,
  ].join('\n');
}
