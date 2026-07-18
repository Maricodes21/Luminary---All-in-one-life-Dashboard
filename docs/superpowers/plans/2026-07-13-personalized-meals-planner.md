# Personalized Meals And Planner Implementation Plan

> **For agentic workers:** Use test-driven development and implement one vertical slice at a time. Review each slice before moving on.

**Goal:** Turn the mobile Meals tab into a personal, user-scoped daily logger and weekly planner with broad lookup, adaptive suggestions, complete recipes, and safe AI fallbacks.

**Architecture:** Keep the mobile experience local-first and authenticated, with Supabase as the canonical remote store. Put deterministic nutrition, lookup, ranking, and recipe validation in testable TypeScript modules; call external catalogs and AI only through authenticated Supabase Edge Functions. Preserve the existing design system while splitting the current oversized tab into focused routes and shared components.

**Tech Stack:** Expo 54, React Native, Expo Router, Zustand, React Query, Zod, Supabase Postgres/Storage/Edge Functions, Ollama Cloud, Open Food Facts, USDA FoodData Central.

## Global Constraints

- Work on `codex/meal-functionality` from baseline `8378957`.
- Use `Today / Plan` modes and no meal status chips.
- Never invent nutrition from an AI response; calculate it from normalized food records.
- A meal or plan recipe must never display an unrelated image.
- Manual macros remain nullable when not supplied.
- Camera capture is supported; gallery import is not.
- Meal-photo sources are deleted unless the user explicitly attaches them.
- Commercial food lookup remains a disabled adapter until procurement selects a provider.
- Paid AI has an environment-configured hard ceiling defaulting to USD 25 per month.
- The app remains useful when every external provider and AI service is unavailable.

## Slice 1: Foundation And Daily Tracking

- Add pure meal domain schemas, local-date helpers, target snapshots, and meal totals tests.
- Extend profile and meal persistence with a migration, user-scoped RLS, and compatibility backfills.
- Split Meals into `Today / Plan`, add a true SVG calorie ring, align logged/planned cards, and support edit/delete/clear navigation.
- Add Nutrition Profile and Recipe routes with safe invalid-ID states.

## Slice 2: Food Lookup And Logging

- Add provider-neutral food-search types and deterministic ranked merging.
- Connect cache-first Open Food Facts and USDA adapters behind an authenticated search function.
- Add dedicated Search, Manual Entry, and Barcode screens; prefill Manual Entry after no results.
- Add community submission records and an evidence-based pending/verified workflow.

## Slice 3: Adaptive Recommendations

- Add deterministic meal-window and calorie-safe candidate selection.
- Add conditional Gemma query interpretation and suggestion reranking with cached, schema-validated output.
- Record accept/dismiss/substitute feedback while retaining a deterministic no-AI result.

## Slice 4: Recipes And Weekly Plans

- Bundle at least 48 normalized, validated recipes across breakfast, lunch, dinner, and snacks.
- Generate catalog-first weekly plans with individually editable entries.
- Add complete recipe guides, accurate cached imagery, serving controls, and constraint-preserving substitutions.

## Slice 5: Vision, Quotas, And Hardening

- Add camera capture and editable prepared-meal analysis with explicit consent and deletion defaults.
- Add AI provider adapters, per-user quotas, spend telemetry, rollout flags, and paid-feature degradation.
- Benchmark Gemma 4 against Qwen 3.5 for meal vision; switch only when the labeled evaluation threshold is met.
- Run Android, navigation, responsive-design, RLS, offline, and account-isolation verification.

## Verification

- `npm run test:content --workspace=mobile`
- `npm run test:meals --workspace=mobile`
- `npm run type-check --workspace=mobile`
- `npm run lint --workspace=mobile`
- `npm run deps:check --workspace=mobile`
- Supabase migration reset/lint when the local stack is available
- Android build, install, open, and compact-viewport screenshots
- `git diff --check`
- Independent dead-navigation and design-consistency reviews
