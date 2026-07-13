import { OllamaMealAIProvider, createMealAIConfig } from '../_shared/meals/ai.ts';
import { PaidBudgetCircuitBreaker } from '../_shared/meals/budget.ts';
import {
  DisabledCommercialFoodProvider,
  OpenFoodFactsProvider,
  UsdaFoodProvider,
} from '../_shared/meals/providers.ts';
import { PilotQuotaGuard } from '../_shared/meals/quota.ts';
import { createMealsApiHandler } from '../_shared/meals/router.ts';
import {
  createSupabaseRuntimeConfig,
  createSupabaseRuntimeServices,
} from '../_shared/meals/supabase-runtime.ts';

const env = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEYS: Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'),
  SUPABASE_PUBLISHABLE_KEY: Deno.env.get('SUPABASE_PUBLISHABLE_KEY'),
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
  SUPABASE_SECRET_KEYS: Deno.env.get('SUPABASE_SECRET_KEYS'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  USDA_API_KEY: Deno.env.get('USDA_API_KEY'),
  MEALS_AI_MODE: Deno.env.get('MEALS_AI_MODE'),
  MEALS_AI_MODEL: Deno.env.get('MEALS_AI_MODEL'),
  MEALS_AI_VISION_EVAL_MODEL: Deno.env.get('MEALS_AI_VISION_EVAL_MODEL'),
  OLLAMA_CLOUD_URL: Deno.env.get('OLLAMA_CLOUD_URL'),
  OLLAMA_LOCAL_URL: Deno.env.get('OLLAMA_LOCAL_URL'),
  OLLAMA_API_KEY: Deno.env.get('OLLAMA_API_KEY'),
  MEALS_AI_MONTHLY_BUDGET_USD: Deno.env.get('MEALS_AI_MONTHLY_BUDGET_USD'),
};

const runtimeConfig = createSupabaseRuntimeConfig(env);
const runtime = createSupabaseRuntimeServices(runtimeConfig);
const aiConfig = createMealAIConfig(env);
const aiProvider = new OllamaMealAIProvider({ config: aiConfig });
const monthlyBudget = Number(env.MEALS_AI_MONTHLY_BUDGET_USD ?? 25);

const handler = createMealsApiHandler({
  authenticate: runtime.authenticate,
  foodProviders: [
    new OpenFoodFactsProvider(),
    new UsdaFoodProvider({ apiKey: env.USDA_API_KEY }),
    new DisabledCommercialFoodProvider(),
  ],
  aiProvider,
  quotaGuard: new PilotQuotaGuard({ store: runtime.usageStore }),
  budgetBreaker: new PaidBudgetCircuitBreaker({
    monthlyLimitUsd: Number.isFinite(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : 25,
    store: runtime.usageStore,
  }),
  telemetry: runtime.telemetry,
  submissionStore: runtime.submissionStore,
});

export default { fetch: handler };
