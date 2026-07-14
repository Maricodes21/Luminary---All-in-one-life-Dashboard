import { sanitizeQueryInterpretation } from './query.ts';
import type { MealAIProvider, MealsAction, QueryInterpretation } from './types.ts';

export const DEFAULT_MEAL_AI_MODEL = 'gemma4:31b-cloud';
export const LOCAL_MEAL_AI_MODEL = 'gemma4:12b';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface MealAIConfig {
  enabled: boolean;
  mode: 'disabled' | 'cloud' | 'local';
  paid: boolean;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  visionEvaluationModel?: string;
}

export function createMealAIConfig(env: Record<string, string | undefined>): MealAIConfig {
  const mode =
    env.MEALS_AI_MODE === 'cloud' || env.MEALS_AI_MODE === 'local' ? env.MEALS_AI_MODE : 'disabled';
  const local = mode === 'local';
  const baseUrl = local
    ? env.OLLAMA_LOCAL_URL?.trim() || 'http://host.docker.internal:11434'
    : env.OLLAMA_CLOUD_URL?.trim() || undefined;
  const apiKey = local ? undefined : env.OLLAMA_API_KEY?.trim() || undefined;
  const model = env.MEALS_AI_MODEL?.trim() || (local ? LOCAL_MEAL_AI_MODEL : DEFAULT_MEAL_AI_MODEL);

  return {
    enabled: mode !== 'disabled' && Boolean(baseUrl) && (local || Boolean(apiKey)),
    mode,
    paid: mode === 'cloud',
    model,
    baseUrl,
    apiKey,
    visionEvaluationModel: env.MEALS_AI_VISION_EVAL_MODEL?.trim() || undefined,
  };
}

function stripInventedFacts(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripInventedFacts);
  if (!value || typeof value !== 'object') return value;

  const factualNutritionTerms = [
    'barcode',
    'brand',
    'calorie',
    'carb',
    'fat',
    'macro',
    'nutrition',
    'protein',
  ];
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => {
        const normalizedKey = key.toLocaleLowerCase('en').replace(/[^a-z]/g, '');
        return !factualNutritionTerms.some((term) => normalizedKey.includes(term));
      })
      .map(([key, item]) => [key, stripInventedFacts(item)]),
  );
}

export class DisabledMealAIProvider implements MealAIProvider {
  readonly available = false;
  readonly paid = false;
  readonly model = DEFAULT_MEAL_AI_MODEL;

  async interpretQuery(): Promise<QueryInterpretation> {
    return { normalizedTerms: [], providerIds: [] };
  }

  async run(): Promise<never> {
    throw new Error('meal_ai_disabled');
  }
}

export class OllamaMealAIProvider implements MealAIProvider {
  readonly available: boolean;
  readonly paid: boolean;
  readonly model: string;
  private readonly config: MealAIConfig;
  private readonly fetcher: FetchLike;

  constructor(options: { config: MealAIConfig; fetch?: FetchLike }) {
    this.config = options.config;
    this.fetcher = options.fetch ?? fetch;
    this.available = options.config.enabled;
    this.paid = options.config.paid;
    this.model = options.config.model;
  }

  private async chat(prompt: string, images?: string[]): Promise<unknown> {
    if (!this.available || !this.config.baseUrl) throw new Error('meal_ai_disabled');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.config.apiKey) headers.authorization = `Bearer ${this.config.apiKey}`;
    const response = await this.fetcher(`${this.config.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: 'json',
        ...(this.config.mode === 'local' ? { options: { num_ctx: 8192 } } : {}),
        messages: [
          {
            role: 'user',
            content: prompt,
            ...(images?.length ? { images } : {}),
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`ollama_http_${response.status}`);
    const body = (await response.json()) as Record<string, unknown>;
    const message =
      body.message && typeof body.message === 'object'
        ? (body.message as Record<string, unknown>).content
        : body.response;
    if (typeof message !== 'string') throw new Error('ollama_invalid_response');
    return JSON.parse(message);
  }

  async interpretQuery(
    input: { query: string; locale?: string },
    allowedProviderIds: ReadonlySet<string>,
  ): Promise<QueryInterpretation> {
    const prompt = [
      'Interpret a weak food search query.',
      'Return JSON with normalizedTerms (string[]) and providerIds (string[]) only.',
      'providerIds may only contain IDs from the supplied list.',
      'Never return nutrition, calories, macros, brands, or barcodes.',
      `Query: ${JSON.stringify(input.query)}`,
      `Locale: ${JSON.stringify(input.locale ?? 'en-ZA')}`,
      `Allowed provider IDs: ${JSON.stringify([...allowedProviderIds])}`,
    ].join('\n');
    return sanitizeQueryInterpretation(await this.chat(prompt), allowedProviderIds);
  }

  async run(action: MealsAction, input: Record<string, unknown>): Promise<unknown> {
    const image = typeof input.imageBase64 === 'string' ? [input.imageBase64] : undefined;
    const prompt = [
      `Complete the meals action ${JSON.stringify(action)} using only supplied catalog facts.`,
      'Return JSON. Never invent nutrition, calories, macros, brands, or barcodes.',
      'Prefer existing recipe or provider IDs whenever they are supplied.',
      `Input: ${JSON.stringify(input)}`,
    ].join('\n');
    return stripInventedFacts(await this.chat(prompt, image));
  }
}
