export type OpenverseImageResult = {
  id: string;
  title?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  creator?: string | null;
  license?: string | null;
  foreign_landing_url?: string | null;
  tags?: Array<{ name?: string | null }> | null;
};

export type RecipeImageMatch = {
  id: string;
  uri: string;
  sourceUrl?: string;
  creator?: string;
  license?: string;
  confidence: number;
};

const LEGACY_CATEGORY_IMAGES = [
  'photo-1511690743698-d9d85f2fbf38',
  'photo-1505252585461-04db1eb84625',
  'photo-1525351484163-7529414344d8',
  'photo-1528735602780-2552fd46c7af',
  'photo-1546069901-ba9599a7e63c',
  'photo-1532550907401-a500c9a57435',
  'photo-1544025162-d76694265947',
  'photo-1467003909585-2f8a72700288',
  'photo-1551183053-bf91a1d81141',
  'photo-1603894584373-5ac82b2ae398',
  'photo-1547592166-23ac45744acd',
  'photo-1607958996333-41aef7caefaa',
];

const STOP_WORDS = new Set(['a', 'an', 'and', 'with', 'of', 'the', 'for', 'style', 'homemade', 'breakfast', 'lunch', 'dinner']);
const DISH_WORDS = new Set(['bagel', 'boat', 'bowl', 'burger', 'burrito', 'curry', 'hash', 'muffin', 'omelette', 'pasta', 'pita', 'salad', 'sandwich', 'smoothie', 'soup', 'toast', 'wrap']);
const TOKEN_ALIASES: Record<string, string> = {
  lox: 'salmon',
  fillet: 'fish',
  fillets: 'fish',
  potatoes: 'potato',
  boats: 'boat',
  berries: 'berry',
  tomatoes: 'tomato',
  chickpeas: 'chickpea',
  oats: 'oat',
};

export function canonicalRecipeImageQuery(name: string): string {
  return tokens(name).join(' ');
}

export function isLegacyCategoryImage(uri?: string): boolean {
  return !!uri && LEGACY_CATEGORY_IMAGES.some((id) => uri.includes(id));
}

export function recipeImageUri(recipe: { name: string; imageUri?: string; image?: { kind: string; uri?: string } }): string | undefined {
  if (recipe.image?.kind === 'exact' && recipe.image.uri) return recipe.image.uri;
  return recipe.imageUri && !isLegacyCategoryImage(recipe.imageUri) ? recipe.imageUri : undefined;
}

export function selectBestOpenverseImage(name: string, results: OpenverseImageResult[]): RecipeImageMatch | null {
  const target = tokens(name);
  if (!target.length) return null;

  const ranked = results
    .map((candidate) => ({ candidate, score: scoreCandidate(target, candidate) }))
    .filter(({ candidate, score }) => score >= 0.55 && !!(candidate.thumbnail || candidate.url))
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  if (!best) return null;

  return {
    id: best.candidate.id,
    uri: best.candidate.thumbnail || best.candidate.url!,
    sourceUrl: best.candidate.foreign_landing_url ?? undefined,
    creator: best.candidate.creator ?? undefined,
    license: best.candidate.license?.toUpperCase() ?? undefined,
    confidence: Number(best.score.toFixed(2)),
  };
}

function scoreCandidate(target: string[], candidate: OpenverseImageResult): number {
  const title = tokens(candidate.title ?? '');
  const metadata = tokens((candidate.tags ?? []).map((tag) => tag.name ?? '').join(' '));
  const searchable = new Set([...title, ...metadata]);
  const overlap = target.filter((token) => searchable.has(token));
  const titleOverlap = target.filter((token) => title.includes(token));
  const requiredOverlap = target.length === 1 ? 1 : 2;
  if (overlap.length < requiredOverlap || titleOverlap.length === 0) return 0;

  const coverage = overlap.length / target.length;
  const targetDish = target.find((token) => DISH_WORDS.has(token));
  const dishMatch = targetDish && searchable.has(targetDish) ? 0.15 : 0;
  const titleCoverage = titleOverlap.length / target.length;
  return Math.min(0.99, coverage * 0.7 + titleCoverage * 0.15 + dishMatch);
}

function tokens(value: string): string[] {
  return [...new Set(value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((token) => TOKEN_ALIASES[token] ?? singularize(token))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token)))];
}

function singularize(token: string): string {
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
  return token;
}
