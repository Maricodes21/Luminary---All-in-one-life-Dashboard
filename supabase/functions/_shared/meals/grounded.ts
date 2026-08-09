import type { FoodSearchProvider, FoodSearchQuery, FoodSearchResult } from './types.ts';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
const defaultDomains = [
  'samrc.ac.za',
  'health.gov.za',
  'gov.za',
  'food.gov.uk',
  'canada.ca',
  'fdc.nal.usda.gov',
  'usda.gov',
];

export class FirecrawlGroundedFoodProvider implements FoodSearchProvider {
  readonly id = 'grounded_web';
  readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly fetcher: FetchLike;
  private readonly domains: string[];

  constructor(
    options: { apiKey?: string; enabled?: boolean; fetch?: FetchLike; domains?: string[] } = {},
  ) {
    this.apiKey = options.apiKey?.trim() || undefined;
    this.enabled = Boolean(this.apiKey) && options.enabled !== false;
    this.fetcher = options.fetch ?? fetch;
    this.domains = options.domains?.length ? options.domains : defaultDomains;
  }

  async search(input: FoodSearchQuery): Promise<FoodSearchResult[]> {
    if (!this.enabled || !this.apiKey) return [];
    const country = countryFromLocale(input.locale);
    const query = `${input.query} nutrition calories protein carbohydrate fat per 100 g ${country}`;
    const response = await this.fetcher('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        query,
        limit: 5,
        sources: ['web'],
        location: country,
        scrapeOptions: { formats: ['markdown'], onlyMainContent: true, timeout: 8_000 },
      }),
    });
    if (!response.ok) throw new Error(`firecrawl_http_${response.status}`);
    const payload = (await response.json()) as Record<string, unknown>;
    const data = safeObject(payload.data);
    const web = Array.isArray(data.web)
      ? data.web
      : Array.isArray(payload.data)
        ? payload.data
        : [];
    return web
      .flatMap((item, index) => {
        const row = safeObject(item);
        const url = text(row.url);
        const markdown = text(row.markdown) ?? text(row.description);
        if (!url || !markdown || !allowedUrl(url, this.domains)) return [];
        const evidence = sanitizeEvidence(markdown);
        if (!evidence) return [];
        const nutrition = extractNutrition(evidence);
        if (!nutrition) return [];
        const title = cleanTitle(text(row.title) ?? input.query);
        return [
          {
            provider: 'grounded_web',
            providerId: `grounded_web:${stableHash(`${url}:${input.query}`)}`,
            name: title,
            sourceUrl: url,
            sourceUrls: [url],
            retrievedAt: new Date().toISOString(),
            confidence: 0.72,
            verificationStatus: 'sourced_unverified',
            countryRelevance: country,
            serving: {
              label: nutrition.perServing ? '1 serving (source panel)' : '100 g',
              quantity: nutrition.perServing ? 1 : 100,
              unit: nutrition.perServing ? 'serving' : 'g',
              calories: nutrition.calories,
              proteinG: nutrition.proteinG,
              carbsG: nutrition.carbsG,
              fatG: nutrition.fatG,
            },
          } satisfies FoodSearchResult,
        ];
      })
      .slice(0, Math.min(input.limit ?? 5, 5));
  }

  async lookupBarcode(): Promise<FoodSearchResult[]> {
    return [];
  }
}

function extractNutrition(markdown: string) {
  const calories = valueFor(
    markdown,
    /(?:energy|calories?)[^\d]{0,30}(\d+(?:\.\d+)?)\s*(?:kcal|calories?)/i,
  );
  const proteinG = valueFor(markdown, /protein[^\d]{0,30}(\d+(?:\.\d+)?)\s*g/i);
  const carbsG = valueFor(markdown, /(?:carbohydrate|carbs?)[^\d]{0,30}(\d+(?:\.\d+)?)\s*g/i);
  const fatG = valueFor(markdown, /(?:total\s+)?fat[^\d]{0,30}(\d+(?:\.\d+)?)\s*g/i);
  if ([calories, proteinG, carbsG, fatG].some((value) => value == null)) return null;
  if (calories! > 1_200 || proteinG! > 100 || carbsG! > 200 || fatG! > 150) return null;
  return {
    calories: calories!,
    proteinG: proteinG!,
    carbsG: carbsG!,
    fatG: fatG!,
    perServing:
      /per serving|serving size/i.test(markdown.slice(0, 4_000)) &&
      !/per 100\s?g/i.test(markdown.slice(0, 4_000)),
  };
}

function sanitizeEvidence(value: string) {
  const lines = value.slice(0, 20_000).split(/\r?\n/);
  const suspicious = lines.filter((line) =>
    /ignore (?:all|previous)|system prompt|assistant instructions|developer message|reveal.*secret|execute.*command/i.test(
      line,
    ),
  );
  if (suspicious.length > 2) return '';
  return lines.filter((line) => !suspicious.includes(line)).join('\n');
}
function allowedUrl(value: string, domains: string[]) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
function countryFromLocale(locale?: string) {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return region === 'ZA'
    ? 'South Africa'
    : region === 'GB'
      ? 'United Kingdom'
      : region === 'CA'
        ? 'Canada'
        : 'South Africa';
}
function cleanTitle(value: string) {
  return (
    value
      .replace(/\s*[|–—-].*$/, '')
      .trim()
      .slice(0, 100) || 'Sourced food result'
  );
}
function valueFor(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function safeObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function stableHash(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}
