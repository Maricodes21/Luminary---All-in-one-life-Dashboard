import { DisabledMealAIProvider } from './ai.ts';
import { isWeakOrAmbiguousQuery, sanitizeQueryInterpretation } from './query.ts';
import { rankFoodResults } from './ranking.ts';
import {
  AI_JOB_BY_ACTION,
  isMealsAction,
  type AuthenticatedUser,
  type FoodSearchProvider,
  type FoodSearchResult,
  type FoodSubmissionStore,
  type MealAIJobType,
  type MealAIProvider,
  type MealsAction,
  type QueryInterpretation,
  type QueryInterpretationCache,
  type TelemetryHook,
} from './types.ts';
import type { PaidBudgetDecision } from './budget.ts';
import type { PilotQuotaDecision } from './quota.ts';

const CORS_HEADERS = {
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-origin': '*',
};

interface MealsApiDependencies {
  authenticate(request: Request): Promise<AuthenticatedUser | null>;
  foodProviders: FoodSearchProvider[];
  aiProvider?: MealAIProvider;
  quotaGuard?: { check(userId: string, feature: MealAIJobType): Promise<PilotQuotaDecision> };
  budgetBreaker?: { check(projectedCostUsd?: number): Promise<PaidBudgetDecision> };
  telemetry?: TelemetryHook;
  submissionStore?: FoodSubmissionStore;
  queryCache?: QueryInterpretationCache;
  estimatedCostUsd?: Readonly<Partial<Record<MealAIJobType, number>>>;
}

export const DEFAULT_ESTIMATED_COST_USD: Readonly<Record<MealAIJobType, number>> = {
  query_interpretation: 0.002,
  suggestion_ranking: 0.01,
  meal_vision: 0.03,
  plan_generation: 0.05,
  recipe_generation: 0.03,
  recipe_image: 0.1,
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { ...CORS_HEADERS, 'cache-control': 'no-store' },
  });
}

function error(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

function objectInput(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function queryHash(query: string, locale: string): Promise<string> {
  const canonical = `${locale.trim().toLocaleLowerCase('en')}\n${query.trim().toLocaleLowerCase('en')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function collectProviderResults(
  providers: FoodSearchProvider[],
  operation: (provider: FoodSearchProvider) => Promise<FoodSearchResult[]>,
): Promise<{ results: FoodSearchResult[]; degradedProviders: string[] }> {
  const active = providers.filter((provider) => provider.enabled);
  const settled = await Promise.allSettled(active.map(operation));
  const results: FoodSearchResult[] = [];
  const degradedProviders: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') results.push(...result.value);
    else degradedProviders.push(active[index].id);
  });
  return { results, degradedProviders };
}

function deterministicFallback(
  action: MealsAction,
  input: Record<string, unknown>,
  reason: string,
): Record<string, unknown> {
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  const base: Record<string, unknown> = { mode: 'deterministic', reason };
  if (action === 'daily-suggestions') return { ...base, suggestions: candidates };
  if (action === 'generate-meal-plan') return { ...base, plan: input.catalogPlan ?? null };
  if (action === 'substitute-meal') return { ...base, substitution: candidates[0] ?? null };
  return { ...base, available: false };
}

async function emitSafely(
  telemetry: TelemetryHook | undefined,
  event: Parameters<TelemetryHook['emit']>[0],
) {
  try {
    await telemetry?.emit(event);
  } catch {
    // Telemetry must never make the user-facing gateway unavailable.
  }
}

export function createMealsApiHandler(dependencies: MealsApiDependencies) {
  const aiProvider = dependencies.aiProvider ?? new DisabledMealAIProvider();

  async function policyBlock(
    user: AuthenticatedUser,
    jobType: MealAIJobType,
  ): Promise<string | null> {
    if (dependencies.quotaGuard) {
      const quota = await dependencies.quotaGuard.check(user.id, jobType);
      if (!quota.allowed) {
        await emitSafely(dependencies.telemetry, {
          userId: user.id,
          jobType,
          provider: 'ollama',
          model: aiProvider.model,
          status: 'blocked_quota',
          errorCode: 'pilot_quota_exhausted',
        });
        return 'pilot_quota_exhausted';
      }
    }

    if (aiProvider.paid && dependencies.budgetBreaker) {
      const estimatedCostUsd =
        dependencies.estimatedCostUsd?.[jobType] ?? DEFAULT_ESTIMATED_COST_USD[jobType];
      const budget = await dependencies.budgetBreaker.check(estimatedCostUsd);
      if (!budget.allowed) {
        await emitSafely(dependencies.telemetry, {
          userId: user.id,
          jobType,
          provider: 'ollama',
          model: aiProvider.model,
          status: 'blocked_budget',
          errorCode: 'paid_budget_blocked',
        });
        return 'paid_budget_blocked';
      }
    }

    return null;
  }

  async function handleSearch(user: AuthenticatedUser, input: Record<string, unknown>) {
    const query = typeof input.query === 'string' ? input.query.trim() : '';
    if (!query) return error('invalid_query', 'A food search query is required.', 400);
    const locale = typeof input.locale === 'string' ? input.locale : 'en-ZA';
    const initial = await collectProviderResults(dependencies.foodProviders, (provider) =>
      provider.search({ query, locale, limit: 20 }),
    );
    let allResults = initial.results;
    const degradedProviders = new Set(initial.degradedProviders);
    let mode: 'deterministic' | 'ai' = 'deterministic';
    let interpretedTerms: string[] = [];
    let preferredProviderIds = new Set<string>();
    let cached = false;

    if (isWeakOrAmbiguousQuery(query) && aiProvider.available) {
      const allowedProviderIds = new Set(initial.results.map((result) => result.providerId));
      const hash = await queryHash(query, locale);
      let cachedInterpretation: QueryInterpretation | null = null;
      try {
        const stored = await dependencies.queryCache?.get(locale, hash);
        cachedInterpretation = stored
          ? sanitizeQueryInterpretation(stored, allowedProviderIds)
          : null;
      } catch {
        // Cache failure cannot block deterministic lookup or a live interpretation.
      }

      if (cachedInterpretation) {
        interpretedTerms = cachedInterpretation.normalizedTerms;
        preferredProviderIds = new Set(cachedInterpretation.providerIds);
        mode = 'ai';
        cached = true;
      } else {
        const blockReason = await policyBlock(user, 'query_interpretation');
        if (!blockReason) {
          try {
            await emitSafely(dependencies.telemetry, {
              userId: user.id,
              jobType: 'query_interpretation',
              provider: 'ollama',
              model: aiProvider.model,
              status: 'running',
            });
            const interpretation = await aiProvider.interpretQuery(
              { query, locale },
              allowedProviderIds,
            );
            interpretedTerms = interpretation.normalizedTerms;
            preferredProviderIds = new Set(interpretation.providerIds);
            mode = 'ai';
            try {
              await dependencies.queryCache?.set(locale, hash, interpretation);
            } catch {
              // A failed cache write must not discard a valid interpretation.
            }
            await emitSafely(dependencies.telemetry, {
              userId: user.id,
              jobType: 'query_interpretation',
              provider: 'ollama',
              model: aiProvider.model,
              status: 'succeeded',
              estimatedCostUsd:
                dependencies.estimatedCostUsd?.query_interpretation ??
                DEFAULT_ESTIMATED_COST_USD.query_interpretation,
            });
          } catch {
            await emitSafely(dependencies.telemetry, {
              userId: user.id,
              jobType: 'query_interpretation',
              provider: 'ollama',
              model: aiProvider.model,
              status: 'failed',
              errorCode: 'query_interpretation_failed',
            });
          }
        }
      }
    }

    for (const normalizedQuery of interpretedTerms) {
      const expanded = await collectProviderResults(dependencies.foodProviders, (provider) =>
        provider.search({ query: normalizedQuery, locale, limit: 20 }),
      );
      allResults = allResults.concat(expanded.results);
      expanded.degradedProviders.forEach((providerId) => degradedProviders.add(providerId));
    }

    return json({
      data: {
        results: rankFoodResults(allResults, interpretedTerms[0] ?? query, preferredProviderIds),
        interpretation: { mode, normalizedTerms: interpretedTerms, cached },
        degradedProviders: [...degradedProviders].sort(),
      },
    });
  }

  async function handleAiAction(
    user: AuthenticatedUser,
    action: MealsAction,
    input: Record<string, unknown>,
  ): Promise<Response> {
    const jobType = AI_JOB_BY_ACTION[action];
    if (!jobType) return error('unsupported_action', 'Unsupported meals action.', 400);
    if (!aiProvider.available) {
      return json({ data: deterministicFallback(action, input, 'ai_unavailable') });
    }
    const blockReason = await policyBlock(user, jobType);
    if (blockReason) {
      return json({ data: deterministicFallback(action, input, blockReason) });
    }

    await emitSafely(dependencies.telemetry, {
      userId: user.id,
      jobType,
      provider: 'ollama',
      model: aiProvider.model,
      status: 'running',
    });
    try {
      const result = await aiProvider.run(action, input);
      if (action === 'analyze-meal-photo') {
        const terms = extractVisionTerms(result).slice(0, 6);
        const matches = await collectProviderResults(dependencies.foodProviders, async (provider) => {
          const groups = await Promise.all(terms.map((query) => provider.search({ query, locale: typeof input.locale === 'string' ? input.locale : 'en-ZA', limit: 8 })));
          return groups.flat();
        });
        await emitSafely(dependencies.telemetry, {
          userId: user.id,
          jobType,
          provider: 'ollama',
          model: aiProvider.model,
          status: 'succeeded',
          estimatedCostUsd: dependencies.estimatedCostUsd?.[jobType] ?? DEFAULT_ESTIMATED_COST_USD[jobType],
          usage: { interpretedTerms: terms.length, verifiedMatches: matches.results.length },
        });
        return json({ data: { mode: 'ai', results: rankFoodResults(matches.results, terms[0] ?? ''), degradedProviders: matches.degradedProviders } });
      }
      await emitSafely(dependencies.telemetry, {
        userId: user.id,
        jobType,
        provider: 'ollama',
        model: aiProvider.model,
        status: 'succeeded',
        estimatedCostUsd:
          dependencies.estimatedCostUsd?.[jobType] ?? DEFAULT_ESTIMATED_COST_USD[jobType],
      });
      return json({ data: { mode: 'ai', model: aiProvider.model, result } });
    } catch {
      await emitSafely(dependencies.telemetry, {
        userId: user.id,
        jobType,
        provider: 'ollama',
        model: aiProvider.model,
        status: 'failed',
        estimatedCostUsd:
          dependencies.estimatedCostUsd?.[jobType] ?? DEFAULT_ESTIMATED_COST_USD[jobType],
        errorCode: 'ai_provider_failed',
      });
      return json({ data: deterministicFallback(action, input, 'ai_provider_failed') });
    }
  }

  return async function handleMealsApi(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (request.method !== 'POST') return error('method_not_allowed', 'Use POST.', 405);

    const user = await dependencies.authenticate(request);
    if (!user) return error('unauthorized', 'Authentication is required.', 401);

    let body: Record<string, unknown>;
    try {
      body = objectInput(await request.json());
    } catch {
      return error('invalid_json', 'Request body must be valid JSON.', 400);
    }
    if (!isMealsAction(body.action)) {
      return error('unsupported_action', 'Unsupported meals action.', 400);
    }
    const input = objectInput(body.input);

    if (body.action === 'search-foods') return handleSearch(user, input);
    if (body.action === 'lookup-barcode') {
      const barcode = typeof input.barcode === 'string' ? input.barcode.trim() : '';
      if (!/^\d{6,14}$/.test(barcode)) {
        return error('invalid_barcode', 'A 6 to 14 digit barcode is required.', 400);
      }
      const lookup = await collectProviderResults(dependencies.foodProviders, (provider) =>
        provider.lookupBarcode(barcode, typeof input.locale === 'string' ? input.locale : 'en-ZA'),
      );
      return json({
        data: {
          results: rankFoodResults(lookup.results, barcode),
          degradedProviders: lookup.degradedProviders.sort(),
        },
      });
    }
    if (body.action === 'submit-food') {
      if (!dependencies.submissionStore) {
        return error('submission_unavailable', 'Food submission is unavailable.', 503);
      }
      return json({ data: await dependencies.submissionStore.submit(user, input) }, 201);
    }
    return handleAiAction(user, body.action, input);
  };
}

function extractVisionTerms(value: unknown): string[] {
  const terms: string[] = [];
  const visit = (item: unknown, key = '') => {
    if (typeof item === 'string' && /name|food|ingredient|query|term/i.test(key)) {
      const term = item.trim();
      if (term.length >= 2 && term.length <= 80) terms.push(term);
      return;
    }
    if (Array.isArray(item)) item.forEach((entry) => visit(entry, key));
    else if (item && typeof item === 'object') Object.entries(item as Record<string, unknown>).forEach(([childKey, child]) => visit(child, childKey));
  };
  visit(value);
  return [...new Set(terms)];
}
