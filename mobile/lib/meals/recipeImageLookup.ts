import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  canonicalRecipeImageQuery,
  recipeImageUri,
  selectBestOpenverseImage,
  type OpenverseImageResult,
  type RecipeImageMatch,
} from './recipeImages';

const CACHE_KEY = 'luminary.meal-image-cache.v2';
const MATCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 160;

type CacheEntry = {
  match: RecipeImageMatch | null;
  expiresAt: number;
  updatedAt: number;
};

let cache: Record<string, CacheEntry> | null = null;
let cacheLoad: Promise<Record<string, CacheEntry>> | null = null;
const inFlight = new Map<string, Promise<RecipeImageMatch | null>>();

export async function resolveRecipeImage(
  recipe: { name: string; imageUri?: string; image?: { kind: string; uri?: string } },
): Promise<RecipeImageMatch | null> {
  const supplied = recipeImageUri(recipe);
  if (supplied) return { id: `supplied:${canonicalRecipeImageQuery(recipe.name)}`, uri: supplied, confidence: 1 };

  const key = canonicalRecipeImageQuery(recipe.name);
  if (!key) return null;
  const currentCache = await loadCache();
  const cached = currentCache[key];
  if (cached && cached.expiresAt > Date.now()) return cached.match;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = lookupOpenverse(recipe.name)
    .then(async (match) => {
      const now = Date.now();
      currentCache[key] = { match, updatedAt: now, expiresAt: now + (match ? MATCH_TTL_MS : MISS_TTL_MS) };
      trimCache(currentCache);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));
      return match;
    })
    .catch(() => null)
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

async function lookupOpenverse(name: string): Promise<RecipeImageMatch | null> {
  const query = encodeURIComponent(name.trim());
  const response = await fetch(`https://api.openverse.org/v1/images/?q=${query}&page_size=20&mature=false`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Openverse image lookup failed: ${response.status}`);
  const payload = await response.json() as { results?: OpenverseImageResult[] };
  return selectBestOpenverseImage(name, Array.isArray(payload.results) ? payload.results : []);
}

async function loadCache(): Promise<Record<string, CacheEntry>> {
  if (cache) return cache;
  if (!cacheLoad) {
    cacheLoad = AsyncStorage.getItem(CACHE_KEY).then((stored) => {
      try {
        cache = stored ? JSON.parse(stored) as Record<string, CacheEntry> : {};
      } catch {
        cache = {};
      }
      return cache;
    });
  }
  return cacheLoad;
}

function trimCache(value: Record<string, CacheEntry>) {
  const entries = Object.entries(value).sort((left, right) => right[1].updatedAt - left[1].updatedAt);
  for (const [key] of entries.slice(MAX_CACHE_ENTRIES)) delete value[key];
}
