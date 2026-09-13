export type ParsedMealPart = { name: string; quantity: string; unit: string };

const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', l: 'l', litre: 'l', litres: 'l',
  cup: 'cup', cups: 'cup', tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', slice: 'slice', slices: 'slice',
  piece: 'piece', pieces: 'piece', serving: 'serving', servings: 'serving',
};

const WORD_NUMBERS: Record<string, string> = { a: '1', an: '1', one: '1', two: '2', three: '3', four: '4', half: '0.5' };

export function parseMealDescription(value: string): ParsedMealPart[] {
  return value
    .replace(/\s+(?:and|plus)\s+/gi, ',')
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map(parsePart)
    .filter((part) => part.name.length > 0);
}

function parsePart(value: string): ParsedMealPart {
  const normalized = value.replace(/^\s*(?:with|and)\s+/i, '').trim();
  const match = normalized.match(/^(\d+(?:\.\d+)?|a|an|one|two|three|four|half)\s*(g|grams?|kg|kilograms?|ml|millilitres?|l|litres?|cups?|tbsp|tablespoons?|tsp|teaspoons?|slices?|pieces?|servings?)?\s+(?:of\s+)?(.+)$/i);
  if (!match) return { name: normalized, quantity: '1', unit: 'serving' };
  const quantity = WORD_NUMBERS[match[1].toLocaleLowerCase('en')] ?? match[1];
  const rawUnit = match[2]?.toLocaleLowerCase('en');
  return { name: match[3].trim(), quantity, unit: rawUnit ? UNIT_ALIASES[rawUnit] ?? rawUnit : inferUnit(match[1]) };
}

function inferUnit(value: string) {
  return /^(?:a|an|one|two|three|four)$/i.test(value) ? 'piece' : 'serving';
}
