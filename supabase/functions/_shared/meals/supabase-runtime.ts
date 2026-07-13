import type { PaidBudgetStore } from './budget.ts';
import type { PilotQuotaStore } from './quota.ts';
import type {
  AuthenticatedUser,
  FoodSubmissionStore,
  MealAIJobType,
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

class SupabaseAiUsageStore implements PilotQuotaStore, PaidBudgetStore {
  private readonly config: SupabaseRuntimeConfig;
  private readonly fetcher: FetchLike;

  constructor(config: SupabaseRuntimeConfig, fetcher: FetchLike) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async getDailyUsage(userId: string, feature: MealAIJobType): Promise<number> {
    const params = new URLSearchParams({
      select: 'id',
      user_id: `eq.${userId}`,
      job_type: `eq.${feature}`,
      status: 'in.(succeeded,failed)',
      created_at: `gte.${utcStartOfDay()}`,
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
    usageStore,
    telemetry: new SupabaseTelemetryHook(config, fetcher),
  };
}
