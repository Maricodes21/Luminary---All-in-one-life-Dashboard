import { ALL_MOOD_LABELS, type MoodLabel } from '../mood';
import type { MoodEstimate } from '../moodEstimation';
import type { NightlyReflection, PersonalizationContext } from '../personalization';
import { z } from 'zod';

type OllamaResponse = { model?: string; message?: { content?: string } };

const forbiddenSpotifyKeys = new Set([
  'spotify',
  'track',
  'tracks',
  'artist',
  'artists',
  'album',
  'artwork',
  'spotifyurl',
  'trackcount',
  'artistcount',
  'minuteslistened',
  'playcount',
  'snapshot',
]);

const moodResponseSchema = z.object({
  label: z.string(),
  confidence: z.number(),
  explanation: z.string(),
  contributingFamilies: z.array(z.string()),
});

const reflectionResponseSchema = z.object({
  theme: z.string(),
  reflection: z.string(),
  question: z.string(),
  evidenceCategories: z.array(z.string()),
  confidence: z.number(),
});

const foodInterpretationSchema = z.object({
  normalizedQuery: z.string().min(2).max(100),
});

export async function requestCompactMoodEstimate(
  context: PersonalizationContext,
): Promise<MoodEstimate | null> {
  assertSpotifyFree(context);
  const raw = await runLocalJson<unknown>({
    operation: 'mood-estimate-v1',
    system: [
      'You support a nightly wellbeing check-in for adults.',
      'Infer only a tentative mood from the supplied first-party Luminary context and the user-owned listening reaction.',
      'Missing data is not negative evidence. Do not diagnose. Do not mention Spotify, songs, artists, or audio features.',
      `Use one label from: ${ALL_MOOD_LABELS.join(', ')}.`,
      'Return JSON only with label, confidence from 0 to 1, a short explanation, and contributingFamilies.',
    ].join(' '),
    input: context,
  });
  const parsed = moodResponseSchema.safeParse(raw);
  const result = parsed.success ? parsed.data : null;
  if (!result || !ALL_MOOD_LABELS.includes(result.label as MoodLabel)) return null;
  const confidence = clamp(result.confidence);
  if (confidence < 0.55) return null;
  const allowedFamilies: MoodEstimate['contributingFamilies'] = [
    'confirmed_mood',
    'listening_reaction',
    'journal',
    'commitments',
    'movement',
    'meals',
    'ritual',
    'time',
  ];
  return {
    label: result.label as MoodLabel,
    confidence,
    explanation: cleanText(result.explanation, 220),
    contributingFamilies: [...new Set(result.contributingFamilies)]
      .filter((family): family is MoodEstimate['contributingFamilies'][number] =>
        allowedFamilies.includes(family as MoodEstimate['contributingFamilies'][number]),
      )
      .slice(0, 4),
    consentState: 'ai_consented',
    userConfirmed: null,
  };
}

export async function requestCompactNightlyReflection(
  context: PersonalizationContext,
): Promise<NightlyReflection | null> {
  assertSpotifyFree(context);
  const raw = await runLocalJson<unknown>({
    operation: 'nightly-reflection-v1',
    system: [
      'Write one warm, plain-language nightly reflection for an adult wellbeing app.',
      'Use only supplied first-party facts. Do not diagnose, moralize, overpraise, or invent events.',
      'Treat missing data as unknown. Do not mention Spotify, songs, artists, or audio features.',
      'Return JSON only with a 2-5 word theme, reflection under 45 words, one understandable question under 18 words, evidenceCategories, and confidence.',
    ].join(' '),
    input: context,
  });
  const parsed = reflectionResponseSchema.safeParse(raw);
  const result = parsed.success ? parsed.data : null;
  if (!result) return null;
  const theme = cleanText(result.theme, 48);
  const reflection = cleanText(result.reflection, 320);
  const question = cleanText(result.question, 160);
  if (!theme || !reflection || !question) return null;
  const generatedAt = new Date().toISOString();
  return {
    id: `reflection-${context.localDate}-${generatedAt}`,
    localDate: context.localDate,
    generatedAt,
    model: configuredModel(),
    theme,
    reflection,
    question,
    evidenceCategories: [
      ...new Set(result.evidenceCategories.map((value) => cleanText(value, 36)).filter(Boolean)),
    ].slice(0, 5),
    confidence: clamp(result.confidence),
    status: 'pending',
  };
}

export async function requestCompactFoodInterpretation(query: string, locale: string) {
  const input = { foodQuery: query.trim().slice(0, 120), locale: locale.slice(0, 20) };
  const raw = await runLocalJson<unknown>({
    operation: 'food-query-interpretation-v1',
    system: [
      'Interpret a food-search phrase into one concise canonical dish or food name.',
      'Preserve every explicitly named food. Use the locale only for likely regional wording.',
      'Do not provide nutrition, serving sizes, health claims, sources, or explanations.',
      'Return JSON only with normalizedQuery.',
    ].join(' '),
    input,
  });
  const parsed = foodInterpretationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const normalizedQuery = parsed.data.normalizedQuery.replace(/\s+/g, ' ').trim();
  return normalizedQuery.toLocaleLowerCase('en') === query.trim().toLocaleLowerCase('en')
    ? null
    : normalizedQuery;
}

export function compactAiConfigured() {
  return Boolean(configuredBaseUrl());
}

export function compactAiModel() {
  return configuredModel();
}

export function assertSpotifyFree(value: unknown): void {
  visit(value, []);
}

function visit(value: unknown, path: string[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, [...path, String(index)]));
    return;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
    if (
      forbiddenSpotifyKeys.has(normalized) ||
      /spotify|track|artist|album|artwork|playcount|minuteslistened/.test(normalized)
    )
      throw new Error(`Spotify data is not allowed in AI context: ${[...path, key].join('.')}`);
    visit(child, [...path, key]);
  });
}

async function runLocalJson<T>({
  operation,
  system,
  input,
}: {
  operation: string;
  system: string;
  input: unknown;
}): Promise<T | null> {
  const baseUrl = configuredBaseUrl();
  if (!baseUrl) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Luminary-Operation': operation },
      body: JSON.stringify({
        model: configuredModel(),
        stream: false,
        format: 'json',
        options: { temperature: 0.2, num_predict: 320 },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(input) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as OllamaResponse;
    return parseJson<T>(payload.message?.content);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function configuredBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_LUMINARY_AI_URL?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  return raw.replace(/\/$/, '');
}

function configuredModel() {
  return process.env.EXPO_PUBLIC_LUMINARY_AI_MODEL?.trim() || 'gemma4:e4b';
}

function parseJson<T>(value?: string): T | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function clamp(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
