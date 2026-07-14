const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');

const shared = (file) =>
  pathToFileURL(path.resolve(__dirname, '../functions/_shared/meals', file)).href;

const modules = Promise.all([
  import(shared('types.ts')),
  import(shared('ranking.ts')),
  import(shared('query.ts')),
  import(shared('providers.ts')),
  import(shared('ai.ts')),
  import(shared('quota.ts')),
  import(shared('budget.ts')),
  import(shared('router.ts')),
]);
const runtimeModule = import(shared('supabase-runtime.ts'));

test('publishes the complete meals action contract', async () => {
  const [{ MEALS_ACTIONS }] = await modules;

  assert.deepEqual(MEALS_ACTIONS, [
    'search-foods',
    'lookup-barcode',
    'submit-food',
    'analyze-meal-photo',
    'daily-suggestions',
    'generate-meal-plan',
    'substitute-meal',
    'generate-recipe-image',
  ]);
});

test('ranks localized branded records before generic records deterministically', async () => {
  const [, { rankFoodResults }] = await modules;
  const results = [
    {
      provider: 'open_food_facts',
      providerId: 'off:2',
      name: 'Apple',
      serving: { calories: 52 },
    },
    {
      provider: 'usda',
      providerId: 'usda:1',
      name: 'Apple',
      serving: { calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 },
    },
    {
      provider: 'usda',
      providerId: 'usda:2',
      name: 'Apple slices',
      serving: { calories: 57, proteinG: 0.2, carbsG: 15, fatG: 0.1 },
    },
  ];

  const forward = rankFoodResults(results, 'apple').map((item) => item.providerId);
  const reversed = rankFoodResults([...results].reverse(), 'apple').map((item) => item.providerId);

  assert.deepEqual(forward, ['off:2', 'usda:1', 'usda:2']);
  assert.deepEqual(reversed, forward);
});

test('query interpretation is conditional and restricted to terms and known IDs', async () => {
  const [, , { isWeakOrAmbiguousQuery, sanitizeQueryInterpretation }] = await modules;

  assert.equal(isWeakOrAmbiguousQuery('bar'), true);
  assert.equal(isWeakOrAmbiguousQuery('rolled oats'), false);

  const sanitized = sanitizeQueryInterpretation(
    {
      normalizedTerms: ['  dark chocolate bar ', '', 42],
      providerIds: ['off:123', 'invented:9'],
      brand: 'Invented Brand',
      barcode: '0000000000000',
      nutrition: { calories: 999 },
    },
    new Set(['off:123']),
  );

  assert.deepEqual(sanitized, {
    normalizedTerms: ['dark chocolate bar'],
    providerIds: ['off:123'],
  });
});

test('normalizes Open Food Facts and USDA responses behind replaceable adapters', async () => {
  const [, , , { OpenFoodFactsProvider, UsdaFoodProvider }] = await modules;
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('openfoodfacts')) {
      return Response.json({
        products: [
          {
            code: '600100000001',
            product_name: 'Plain yoghurt',
            brands: 'Dairy Co',
            serving_size: '100 g',
            nutriments: {
              'energy-kcal_100g': 63,
              proteins_100g: 5.2,
              carbohydrates_100g: 7,
              fat_100g: 1.5,
            },
          },
          {
            code: '600100000002',
            product_name: 'Snack yoghurt',
            serving_size: '30 g',
            nutriments: {
              'energy-kcal_100g': 70,
              proteins_100g: 4,
              carbohydrates_100g: 8,
              fat_100g: 2,
            },
          },
        ],
      });
    }

    return Response.json({
      foods: [
        {
          fdcId: 123,
          description: 'OATS, ROLLED',
          brandOwner: 'USDA',
          foodNutrients: [
            { nutrientName: 'Energy', unitName: 'KJ', value: 1586 },
            { nutrientName: 'Energy', unitName: 'KCAL', value: 379 },
            { nutrientName: 'Protein', unitName: 'G', value: 13.2 },
            { nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: 67.7 },
            { nutrientName: 'Total lipid (fat)', unitName: 'G', value: 6.5 },
          ],
        },
      ],
    });
  };

  const off = new OpenFoodFactsProvider({ fetch: fakeFetch });
  const usda = new UsdaFoodProvider({ apiKey: 'test-key', fetch: fakeFetch });
  const [offResult, offPerHundredGramResult] = await off.search({
    query: 'plain yoghurt',
    locale: 'en-ZA',
  });
  const [usdaResult] = await usda.search({ query: 'rolled oats', locale: 'en-ZA' });

  assert.equal(offResult.providerId, 'open_food_facts:600100000001');
  assert.deepEqual(offResult.serving, {
    label: '100 g',
    quantity: 100,
    unit: 'g',
    calories: 63,
    proteinG: 5.2,
    carbsG: 7,
    fatG: 1.5,
  });
  assert.equal(usdaResult.providerId, 'usda:123');
  assert.equal(usdaResult.serving.calories, 379);
  assert.equal(offPerHundredGramResult.serving.label, '100 g');
  assert.equal(offPerHundredGramResult.serving.quantity, 100);
  assert.equal(calls.length, 2);

  const disabledUsda = new UsdaFoodProvider({ fetch: fakeFetch });
  assert.equal(disabledUsda.enabled, false);
  assert.deepEqual(await disabledUsda.search({ query: 'oats' }), []);
});

test('commercial search remains disabled and never performs I/O', async () => {
  const [, , , { DisabledCommercialFoodProvider }] = await modules;
  let fetched = false;
  const provider = new DisabledCommercialFoodProvider({
    fetch: async () => {
      fetched = true;
      return Response.json({});
    },
  });

  assert.equal(provider.enabled, false);
  assert.deepEqual(await provider.search({ query: 'anything' }), []);
  assert.equal(fetched, false);
});

test('defaults to Gemma cloud and only enables local Gemma or Qwen evaluation explicitly', async () => {
  const [, , , , { createMealAIConfig }] = await modules;

  const defaults = createMealAIConfig({});
  assert.equal(defaults.model, 'gemma4:31b-cloud');
  assert.equal(defaults.enabled, false);
  assert.equal(defaults.visionEvaluationModel, undefined);

  const local = createMealAIConfig({ MEALS_AI_MODE: 'local' });
  assert.equal(local.model, 'gemma4:12b');
  assert.equal(local.paid, false);

  const evaluation = createMealAIConfig({
    MEALS_AI_MODE: 'cloud',
    OLLAMA_CLOUD_URL: 'https://ollama.example',
    OLLAMA_API_KEY: 'test-key',
    MEALS_AI_VISION_EVAL_MODEL: 'qwen3.5-vision:evaluation',
  });
  assert.equal(evaluation.model, 'gemma4:31b-cloud');
  assert.equal(evaluation.visionEvaluationModel, 'qwen3.5-vision:evaluation');
});

test('Ollama query interpretation discards invented facts and IDs', async () => {
  const [, , , , { OllamaMealAIProvider, createMealAIConfig }] = await modules;
  let requestBody;
  const provider = new OllamaMealAIProvider({
    config: createMealAIConfig({
      MEALS_AI_MODE: 'cloud',
      OLLAMA_CLOUD_URL: 'https://ollama.example',
      OLLAMA_API_KEY: 'test-key',
    }),
    fetch: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return Response.json({
        message: {
          content: JSON.stringify({
            normalizedTerms: ['dark chocolate bar'],
            providerIds: ['open_food_facts:123', 'invented:9'],
            brand: 'Invented Brand',
            barcode: '000',
            nutrition: { calories: 500 },
          }),
        },
      });
    },
  });

  const output = await provider.interpretQuery(
    { query: 'choc bar' },
    new Set(['open_food_facts:123']),
  );

  assert.equal(requestBody.model, 'gemma4:31b-cloud');
  assert.deepEqual(output, {
    normalizedTerms: ['dark chocolate bar'],
    providerIds: ['open_food_facts:123'],
  });
});

test('Ollama action output strips factual nutrition fields in any naming style', async () => {
  const [, , , , { OllamaMealAIProvider, createMealAIConfig }] = await modules;
  const provider = new OllamaMealAIProvider({
    config: createMealAIConfig({
      MEALS_AI_MODE: 'local',
      OLLAMA_LOCAL_URL: 'http://ollama.test',
    }),
    fetch: async () =>
      Response.json({
        message: {
          content: JSON.stringify({
            recipeIds: ['recipe:1'],
            calories_per_serving: 500,
            nested: { id: 'food:1', protein_g: 30, fatGrams: 10 },
          }),
        },
      }),
  });

  assert.deepEqual(await provider.run('daily-suggestions', {}), {
    recipeIds: ['recipe:1'],
    nested: { id: 'food:1' },
  });
});

test('meal vision sends image bytes once and uses the benchmarked ingredient schema', async () => {
  const [, , , , { OllamaMealAIProvider, createMealAIConfig }] = await modules;
  let requestBody;
  const provider = new OllamaMealAIProvider({
    config: createMealAIConfig({
      MEALS_AI_MODE: 'local',
      OLLAMA_LOCAL_URL: 'http://ollama.test',
    }),
    fetch: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return Response.json({ message: { content: '{"ingredients":["tomato"]}' } });
    },
  });

  assert.deepEqual(
    await provider.run('analyze-meal-photo', {
      imageBase64: 'base64-image-payload',
      mimeType: 'image/jpeg',
      locale: 'en-ZA',
    }),
    { ingredients: ['tomato'] },
  );
  assert.deepEqual(requestBody.messages[0].images, ['base64-image-payload']);
  assert.doesNotMatch(requestBody.messages[0].content, /base64-image-payload/);
  assert.match(requestBody.messages[0].content, /"ingredients"/);
  assert.match(requestBody.messages[0].content, /meal-vision-v1/);
});

test('enforces pilot quotas per user and feature', async () => {
  const [, , , , , { PilotQuotaGuard }] = await modules;
  const usage = new Map([
    ['user-a:meal_vision', 3],
    ['user-b:meal_vision', 1],
  ]);
  const guard = new PilotQuotaGuard({
    limits: { meal_vision: 3 },
    store: {
      getDailyUsage: async (userId, feature) => usage.get(`${userId}:${feature}`) ?? 0,
    },
  });

  assert.deepEqual(await guard.check('user-a', 'meal_vision'), {
    allowed: false,
    limit: 3,
    remaining: 0,
  });
  assert.deepEqual(await guard.check('user-b', 'meal_vision'), {
    allowed: true,
    limit: 3,
    remaining: 2,
  });
});

test('warns at 80 percent and opens the paid budget breaker at 100 percent', async () => {
  const [, , , , , , { PaidBudgetCircuitBreaker }] = await modules;
  let spend = 19.99;
  const breaker = new PaidBudgetCircuitBreaker({
    monthlyLimitUsd: 25,
    store: { getMonthlySpendUsd: async () => spend },
  });

  assert.equal((await breaker.check()).state, 'closed');
  spend = 20;
  assert.deepEqual(await breaker.check(), {
    allowed: true,
    state: 'warning',
    monthlyLimitUsd: 25,
    spendUsd: 20,
    percentUsed: 80,
  });
  spend = 25;
  assert.equal((await breaker.check()).state, 'open');
  assert.equal((await breaker.check()).allowed, false);
  spend = 24.99;
  assert.equal((await breaker.check(0.02)).state, 'open');
});

test('requires authentication and routes strong food searches without AI', async () => {
  const [, , , , , , , { createMealsApiHandler }] = await modules;
  let aiCalls = 0;
  const handler = createMealsApiHandler({
    authenticate: async (request) =>
      request.headers.has('authorization') ? { id: 'user-a' } : null,
    foodProviders: [
      {
        id: 'usda',
        enabled: true,
        search: async () => [
          {
            provider: 'usda',
            providerId: 'usda:1',
            name: 'Rolled oats',
            serving: { calories: 379 },
          },
        ],
        lookupBarcode: async () => [],
      },
    ],
    aiProvider: {
      available: true,
      paid: false,
      model: 'test',
      interpretQuery: async () => {
        aiCalls += 1;
        return { normalizedTerms: [], providerIds: [] };
      },
      run: async () => ({ ok: true }),
    },
  });

  const unauthenticated = await handler(
    new Request('https://example.test/meals-api', {
      method: 'POST',
      body: JSON.stringify({ action: 'search-foods', input: { query: 'rolled oats' } }),
    }),
  );
  assert.equal(unauthenticated.status, 401);

  const response = await handler(
    new Request('https://example.test/meals-api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'search-foods', input: { query: 'rolled oats' } }),
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.results[0].providerId, 'usda:1');
  assert.equal(body.data.interpretation.mode, 'deterministic');
  assert.equal(aiCalls, 0);
});

test('uses AI only for weak searches and gracefully degrades every AI action', async () => {
  const [{ MEALS_ACTIONS }, , , , , , , { createMealsApiHandler }] = await modules;
  let interpretationCalls = 0;
  const provider = {
    id: 'open_food_facts',
    enabled: true,
    search: async ({ query }) => [
      {
        provider: 'open_food_facts',
        providerId: 'open_food_facts:123',
        name: query === 'bar' ? 'Chocolate snack' : 'Dark chocolate bar',
        serving: { calories: 100 },
      },
    ],
    lookupBarcode: async () => [],
  };
  const common = {
    authenticate: async () => ({ id: 'user-a' }),
    foodProviders: [provider],
  };
  const aiHandler = createMealsApiHandler({
    ...common,
    aiProvider: {
      available: true,
      paid: false,
      model: 'test',
      interpretQuery: async (_input, allowedIds) => {
        interpretationCalls += 1;
        assert.deepEqual([...allowedIds], ['open_food_facts:123']);
        return {
          normalizedTerms: ['dark chocolate bar'],
          providerIds: ['open_food_facts:123'],
        };
      },
      run: async () => ({ ok: true }),
    },
  });
  const weakResponse = await aiHandler(
    new Request('https://example.test/meals-api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'search-foods', input: { query: 'bar' } }),
    }),
  );
  const weakBody = await weakResponse.json();
  assert.equal(interpretationCalls, 1);
  assert.equal(weakBody.data.interpretation.mode, 'ai');

  const disabledHandler = createMealsApiHandler({ ...common });
  for (const action of MEALS_ACTIONS.slice(3)) {
    const response = await disabledHandler(
      new Request('https://example.test/meals-api', {
        method: 'POST',
        headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          input: { candidates: [{ id: 'catalog:1' }], catalogPlan: { id: 'plan:1' } },
        }),
      }),
    );
    const body = await response.json();
    assert.equal(response.status, 200, action);
    assert.equal(body.data.mode, 'deterministic', action);
    assert.equal(body.data.reason, 'ai_unavailable', action);
  }
});

test('reuses locale-scoped AI query interpretations without another model call', async () => {
  const [, , , , , , , { createMealsApiHandler }] = await modules;
  const cache = new Map();
  let interpretationCalls = 0;
  const handler = createMealsApiHandler({
    authenticate: async () => ({ id: 'user-a' }),
    foodProviders: [
      {
        id: 'usda',
        enabled: true,
        search: async ({ query }) => [
          {
            provider: 'usda',
            providerId: 'usda:42',
            name: query === 'bar' ? 'Snack bar' : 'Oat snack bar',
            serving: { calories: 180 },
          },
        ],
        lookupBarcode: async () => [],
      },
    ],
    aiProvider: {
      available: true,
      paid: false,
      model: 'test',
      interpretQuery: async () => {
        interpretationCalls += 1;
        return { normalizedTerms: ['oat snack bar'], providerIds: ['usda:42'] };
      },
      run: async () => ({}),
    },
    queryCache: {
      get: async (locale, queryHash) => cache.get(`${locale}:${queryHash}`) ?? null,
      set: async (locale, queryHash, value) => {
        cache.set(`${locale}:${queryHash}`, value);
      },
    },
  });
  const request = () =>
    new Request('https://example.test/meals-api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'search-foods', input: { query: 'bar', locale: 'en-ZA' } }),
    });

  const first = await (await handler(request())).json();
  const second = await (await handler(request())).json();

  assert.equal(first.data.interpretation.cached, false);
  assert.equal(second.data.interpretation.cached, true);
  assert.equal(interpretationCalls, 1);
});

test('an invalid client locale cannot crash ambiguous food search', async () => {
  const [, , , , , , , { createMealsApiHandler }] = await modules;
  const handler = createMealsApiHandler({
    authenticate: async () => ({ id: 'user-a' }),
    foodProviders: [
      {
        id: 'usda',
        enabled: true,
        search: async () => [
          { provider: 'usda', providerId: 'usda:1', name: 'Snack bar', serving: { calories: 100 } },
        ],
        lookupBarcode: async () => [],
      },
    ],
    aiProvider: {
      available: true,
      paid: false,
      model: 'test',
      interpretQuery: async () => ({ normalizedTerms: [], providerIds: [] }),
      run: async () => ({}),
    },
  });

  const response = await handler(
    new Request('https://example.test/meals-api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'search-foods',
        input: { query: 'bar', locale: 'not_a_locale' },
      }),
    }),
  );

  assert.equal(response.status, 200);
});

test('blocks paid AI at the hard budget limit and emits telemetry', async () => {
  const [, , , , , , , { createMealsApiHandler }] = await modules;
  let aiCalls = 0;
  const events = [];
  const handler = createMealsApiHandler({
    authenticate: async () => ({ id: 'user-a' }),
    foodProviders: [],
    aiProvider: {
      available: true,
      paid: true,
      model: 'gemma4:31b-cloud',
      interpretQuery: async () => ({ normalizedTerms: [], providerIds: [] }),
      run: async () => {
        aiCalls += 1;
        return { ok: true };
      },
    },
    quotaGuard: { check: async () => ({ allowed: true, limit: 3, remaining: 3 }) },
    budgetBreaker: {
      check: async (projectedCostUsd) => {
        assert.equal(projectedCostUsd, 0.03);
        return {
          allowed: false,
          state: 'open',
          monthlyLimitUsd: 25,
          spendUsd: 25,
          percentUsed: 100,
        };
      },
    },
    telemetry: { emit: async (event) => events.push(event) },
  });

  const response = await handler(
    new Request('https://example.test/meals-api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'analyze-meal-photo', input: { imagePath: 'private/a.jpg' } }),
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.reason, 'paid_budget_blocked');
  assert.equal(aiCalls, 0);
  assert.equal(events[0].status, 'blocked_budget');
  assert.equal(events[0].userId, 'user-a');
});

test('builds runtime config from current Supabase key dictionaries without source secrets', async () => {
  const { createSupabaseRuntimeConfig } = await runtimeModule;
  const config = createSupabaseRuntimeConfig({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_test' }),
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_test' }),
  });

  assert.deepEqual(config, {
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    secretKey: 'sb_secret_test',
  });

  assert.deepEqual(
    createSupabaseRuntimeConfig({
      SUPABASE_URL: 'https://legacy.supabase.co/',
      SUPABASE_PUBLISHABLE_KEY: ' ',
      SUPABASE_ANON_KEY: 'legacy-anon',
      SUPABASE_SECRET_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service',
    }),
    {
      supabaseUrl: 'https://legacy.supabase.co',
      publishableKey: 'legacy-anon',
      secretKey: 'legacy-service',
    },
  );
});

test('validates bearer auth and writes submissions with the caller token and user ID', async () => {
  const { createSupabaseRuntimeServices } = await runtimeModule;
  const requests = [];
  const services = createSupabaseRuntimeServices(
    {
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      secretKey: 'sb_secret_test',
    },
    {
      fetch: async (url, init = {}) => {
        requests.push({ url: String(url), init });
        if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'user-a' });
        return Response.json([{ id: 'submission-1', status: 'pending' }], { status: 201 });
      },
    },
  );
  const request = new Request('https://example.test/meals-api', {
    method: 'POST',
    headers: { authorization: 'Bearer user-token' },
  });
  const user = await services.authenticate(request);
  const submission = await services.submissionStore.submit(user, {
    proposedName: 'Homemade soup',
    user_id: 'attacker',
    status: 'verified',
    nutrition: { calories: 100 },
  });

  assert.deepEqual(user, { id: 'user-a', accessToken: 'user-token' });
  assert.equal(submission.id, 'submission-1');
  const insertRequest = requests[1];
  assert.equal(insertRequest.init.headers.authorization, 'Bearer user-token');
  assert.equal(insertRequest.init.headers.apikey, 'sb_publishable_test');
  assert.deepEqual(JSON.parse(insertRequest.init.body), {
    user_id: 'user-a',
    proposed_name: 'Homemade soup',
    nutrition: { calories: 100 },
    serving: {},
    evidence_paths: [],
  });
});

test('backs per-user usage, monthly spend, and terminal telemetry with ai_jobs', async () => {
  const { createSupabaseRuntimeServices } = await runtimeModule;
  const requests = [];
  const services = createSupabaseRuntimeServices(
    {
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      secretKey: 'sb_secret_test',
    },
    {
      fetch: async (url, init = {}) => {
        requests.push({ url: String(url), init });
        if (String(url).includes('select=id')) {
          return new Response('[]', {
            headers: { 'content-range': '0-0/2', 'content-type': 'application/json' },
          });
        }
        if (String(url).includes('select=estimated_cost_usd')) {
          return Response.json([{ estimated_cost_usd: 0.4 }, { estimated_cost_usd: 0.6 }]);
        }
        return new Response(null, { status: 201 });
      },
    },
  );

  assert.equal(await services.usageStore.getDailyUsage('user-a', 'meal_vision'), 2);
  assert.equal(await services.usageStore.getMonthlySpendUsd(), 1);
  await services.telemetry.emit({
    userId: 'user-a',
    jobType: 'meal_vision',
    provider: 'ollama',
    model: 'gemma4:31b-cloud',
    status: 'succeeded',
    estimatedCostUsd: 0.03,
  });

  const telemetryRequest = requests.at(-1);
  assert.equal(telemetryRequest.init.headers.apikey, 'sb_secret_test');
  assert.equal(JSON.parse(telemetryRequest.init.body).status, 'succeeded');
  assert.equal(JSON.parse(telemetryRequest.init.body).user_id, 'user-a');
});

test('persists only hashed query interpretations in the service-only cache', async () => {
  const { createSupabaseRuntimeServices } = await runtimeModule;
  const requests = [];
  const services = createSupabaseRuntimeServices(
    {
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      secretKey: 'sb_secret_test',
    },
    {
      fetch: async (url, init = {}) => {
        requests.push({ url: String(url), init });
        if ((init.method ?? 'GET') === 'GET') {
          return Response.json([{ normalized_terms: ['rolled oats'], provider_ids: ['usda:1'] }]);
        }
        return new Response(null, { status: 201 });
      },
    },
  );

  await services.queryCache.set('en-ZA', 'abc123', {
    normalizedTerms: ['rolled oats'],
    providerIds: ['usda:1'],
  });
  const cached = await services.queryCache.get('en-ZA', 'abc123');

  assert.deepEqual(cached, { normalizedTerms: ['rolled oats'], providerIds: ['usda:1'] });
  const stored = JSON.parse(requests[0].init.body);
  assert.equal(stored.query_hash, 'abc123');
  assert.equal('query' in stored, false);
  assert.match(requests[1].url, /food_query_cache/);
});
