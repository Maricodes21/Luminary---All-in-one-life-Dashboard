import type { PaidBudgetStore } from './budget.ts';
import type { PilotQuotaStore } from './quota.ts';
import type {
  AuthenticatedUser,
  FoodSearchProvider,
  FoodSearchQuery,
  FoodSearchResult,
  FoodSubmissionStore,
  MealAIJobType,
  QueryInterpretation,
  QueryInterpretationCache,
  TelemetryEvent,
  TelemetryHook,
} from './types.ts';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface SupabaseRuntimeConfig {
  supabaseUrl: string;
  publishableKey: string;
  secretKey: string;
}

function firstDictionaryValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.values(parsed).find(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
  } catch {
    return undefined;
  }
}

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function createSupabaseRuntimeConfig(
  env: Record<string, string | undefined>,
): SupabaseRuntimeConfig {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const publishableKey =
    firstDictionaryValue(env.SUPABASE_PUBLISHABLE_KEYS) ??
    nonEmpty(env.SUPABASE_PUBLISHABLE_KEY) ??
    nonEmpty(env.SUPABASE_ANON_KEY);
  const secretKey =
    firstDictionaryValue(env.SUPABASE_SECRET_KEYS) ??
    nonEmpty(env.SUPABASE_SECRET_KEY) ??
    nonEmpty(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !publishableKey || !secretKey) {
    throw new Error('missing_supabase_runtime_configuration');
  }
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), publishableKey, secretKey };
}

function bearerToken(request: Request): string | null {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function serviceHeaders(config: SupabaseRuntimeConfig): Record<string, string> {
  return {
    accept: 'application/json',
    apikey: config.secretKey,
    authorization: `Bearer ${config.secretKey}`,
  };
}

async function ensureOk(response: Response, code: string): Promise<void> {
  if (!response.ok) throw new Error(`${code}_${response.status}`);
}

function utcStartOfDay(): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function utcStartOfMonth(): string {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function utcStartOfWeek(): string {
  const date = new Date();
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

class SupabaseFoodSubmissionStore implements FoodSubmissionStore {
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async submit(
    user: AuthenticatedUser,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!user.accessToken) throw new Error('missing_user_access_token');
    const proposedName = optionalString(input.proposedName, 200);
    if (!proposedName) throw new Error('invalid_submission_name');
    const barcode = optionalString(input.barcode, 32);
    if (barcode && !/^\d{6,14}$/.test(barcode)) throw new Error('invalid_submission_barcode');
    const evidencePaths = Array.isArray(input.evidencePaths)
      ? input.evidencePaths
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const payload = {
      user_id: user.id,
      proposed_name: proposedName,
      ...(optionalString(input.brand, 200) ? { brand: optionalString(input.brand, 200) } : {}),
      ...(barcode ? { barcode } : {}),
      serving: safeObject(input.serving),
      nutrition: safeObject(input.nutrition),
      evidence_paths: evidencePaths,
    };
    const response = await this.fetcher(
      `${this.config.supabaseUrl}/rest/v1/food_submissions?select=id,status,created_at`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: this.config.publishableKey,
          authorization: `Bearer ${user.accessToken}`,
          'content-type': 'application/json',
          prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      },
    );
    await ensureOk(response, 'food_submission_failed');
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== 'object') {
      throw new Error('food_submission_invalid_response');
    }
    return rows[0] as Record<string, unknown>;
  }
}

class SupabaseCommunityFoodProvider implements FoodSearchProvider {
  readonly id = 'community';
  readonly enabled = true;
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async search(input: FoodSearchQuery): Promise<FoodSearchResult[]> {
    const query = input.query.trim().replace(/[,*()]/g, ' ');
    if (!query) return [];
    const params = new URLSearchParams({
      select: 'id,name,brand,barcode,image_url,calories,protein_g,carbs_g,fat_g,food_servings(label,quantity,unit,calories,protein_g,carbs_g,fat_g,is_default)',
      verification_status: 'eq.verified',
      or: `(name.ilike.*${query}*,brand.ilike.*${query}*)`,
      limit: String(Math.min(Math.max(input.limit ?? 20, 1), 50)),
    });
    return this.fetchFoods(params);
  }

  async lookupBarcode(barcode: string): Promise<FoodSearchResult[]> {
    const params = new URLSearchParams({
      select: 'id,name,brand,barcode,image_url,calories,protein_g,carbs_g,fat_g,food_servings(label,quantity,unit,calories,protein_g,carbs_g,fat_g,is_default)',
      verification_status: 'eq.verified',
      barcode: `eq.${barcode}`,
      limit: '1',
    });
    return this.fetchFoods(params);
  }

  private async fetchFoods(params: URLSearchParams): Promise<FoodSearchResult[]> {
    const response = await this.fetcher(`${this.config.supabaseUrl}/rest/v1/food_items?${params.toString()}`, { headers: serviceHeaders(this.config) });
    await ensureOk(response, 'community_food_search_failed');
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row): FoodSearchResult[] => {
      const item = safeObject(row);
      if (typeof item.id !== 'string' || typeof item.name !== 'string') return [];
      const servings = Array.isArray(item.food_servings) ? item.food_servings.map(safeObject) : [];
      const selected = servings.find((serving) => serving.is_default === true) ?? servings[0] ?? item;
      return [{
        provider: 'community',
        providerId: `community:${item.id}`,
        name: item.name,
        brand: optionalString(item.brand, 200),
        barcode: optionalString(item.barcode, 32),
        imageUrl: optionalString(item.image_url, 1000),
        serving: {
          label: optionalString(selected.label, 100) ?? '1 serving',
          quantity: finiteRuntimeNumber(selected.quantity) ?? 1,
          unit: optionalString(selected.unit, 30) ?? 'serving',
          calories: finiteRuntimeNumber(selected.calories),
          proteinG: finiteRuntimeNumber(selected.protein_g),
          carbsG: finiteRuntimeNumber(selected.carbs_g),
          fatG: finiteRuntimeNumber(selected.fat_g),
        },
      }];
    });
  }
}

class SupabaseAiUsageStore implements PilotQuotaStore, PaidBudgetStore {
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async getDailyUsage(userId: string, feature: MealAIJobType): Promise<number> {
    return this.getUsageSince(userId, feature, utcStartOfDay());
  }

  async getWeeklyUsage(userId: string, feature: MealAIJobType): Promise<number> {
    return this.getUsageSince(userId, feature, utcStartOfWeek());
  }

  private async getUsageSince(userId: string, feature: MealAIJobType, since: string): Promise<number> {
    const params = new URLSearchParams({
      select: 'id',
      user_id: `eq.${userId}`,
      job_type: `eq.${feature}`,
      status: 'in.(succeeded,failed)',
      created_at: `gte.${since}`,
      limit: '1',
    });
    const response = await this.fetcher(
      `${this.config.supabaseUrl}/rest/v1/ai_jobs?${params.toString()}`,
      {
        headers: {
          ...serviceHeaders(this.config),
          prefer: 'count=exact',
          range: '0-0',
        },
      },
    );
    await ensureOk(response, 'ai_usage_failed');
    const total = response.headers.get('content-range')?.split('/').at(-1);
    return total && total !== '*' && Number.isFinite(Number(total)) ? Number(total) : 0;
  }

  async getMonthlySpendUsd(): Promise<number> {
    const params = new URLSearchParams({
      select: 'estimated_cost_usd',
      status: 'eq.succeeded',
      created_at: `gte.${utcStartOfMonth()}`,
    });
    const response = await this.fetcher(
      `${this.config.supabaseUrl}/rest/v1/ai_jobs?${params.toString()}`,
      { headers: serviceHeaders(this.config) },
    );
    await ensureOk(response, 'ai_spend_failed');
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((total, row) => {
      const value = safeObject(row).estimated_cost_usd;
      const number = typeof value === 'string' ? Number(value) : value;
      return total + (typeof number === 'number' && Number.isFinite(number) ? number : 0);
    }, 0);
  }
}

class SupabaseQueryInterpretationCache implements QueryInterpretationCache {
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async get(locale: string, queryHash: string): Promise<QueryInterpretation | null> {
    const params = new URLSearchParams({
      select: 'normalized_terms,provider_ids',
      locale: `eq.${locale}`,
      query_hash: `eq.${queryHash}`,
      expires_at: `gt.${new Date().toISOString()}`,
      limit: '1',
    });
    const response = await this.fetcher(
      `${this.config.supabaseUrl}/rest/v1/food_query_cache?${params.toString()}`,
      { headers: serviceHeaders(this.config) },
    );
    await ensureOk(response, 'food_query_cache_read_failed');
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows[0]) return null;
    const row = safeObject(rows[0]);
    return {
      normalizedTerms: stringRuntimeArray(row.normalized_terms),
      providerIds: stringRuntimeArray(row.provider_ids),
    };
  }

  async set(locale: string, queryHash: string, interpretation: QueryInterpretation): Promise<void> {
    const response = await this.fetcher(
      `${this.config.supabaseUrl}/rest/v1/food_query_cache?on_conflict=locale,query_hash`,
      {
        method: 'POST',
        headers: {
          ...serviceHeaders(this.config),
          'content-type': 'application/json',
          prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          locale,
          query_hash: queryHash,
          normalized_terms: interpretation.normalizedTerms,
          provider_ids: interpretation.providerIds,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }),
      },
    );
    await ensureOk(response, 'food_query_cache_write_failed');
  }
}

class SupabaseTelemetryHook implements TelemetryHook {
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async emit(event: TelemetryEvent): Promise<void> {
    if (event.status === 'running' || event.status === 'blocked_quota') return;
    const response = await this.fetcher(`${this.config.supabaseUrl}/rest/v1/ai_jobs`, {
      method: 'POST',
      headers: {
        ...serviceHeaders(this.config),
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: event.userId,
        job_type: event.jobType,
        provider: event.provider,
        model: event.model,
        status: event.status,
        prompt_version: 'meals-gateway-v1',
        usage: event.usage ?? {},
        estimated_cost_usd: event.estimatedCostUsd ?? 0,
        error_code: event.errorCode ?? null,
        completed_at: new Date().toISOString(),
      }),
    });
    await ensureOk(response, 'ai_telemetry_failed');
  }
}

export function createSupabaseRuntimeServices(
  config: SupabaseRuntimeConfig,
  options: { fetch?: FetchLike } = {},
) {
  const fetcher = options.fetch ?? fetch;
  const usageStore = new SupabaseAiUsageStore(config, fetcher);

  return {
    authenticate: async (request: Request): Promise<AuthenticatedUser | null> => {
      const token = bearerToken(request);
      if (!token) return null;
      const response = await fetcher(`${config.supabaseUrl}/auth/v1/user`, {
        headers: {
          accept: 'application/json',
          apikey: config.publishableKey,
          authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return null;
      const body = safeObject(await response.json());
      return typeof body.id === 'string' && body.id ? { id: body.id, accessToken: token } : null;
    },
    submissionStore: new SupabaseFoodSubmissionStore(config, fetcher),
    communityFoodProvider: new SupabaseCommunityFoodProvider(config, fetcher),
    usageStore,
    queryCache: new SupabaseQueryInterpretationCache(config, fetcher),
    telemetry: new SupabaseTelemetryHook(config, fetcher),
  };
}

function finiteRuntimeNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}

function stringRuntimeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}
