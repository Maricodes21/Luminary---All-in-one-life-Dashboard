# Meal Vision Benchmark - 2026-07-14

## Decision

Keep `gemma4:31b-cloud` as the selected meal-vision model. Do not route meal vision to
`qwen3.5:cloud` yet because the current Ollama account returns `subscription required` for every
Qwen request, so Qwen quality could not be evaluated.

Production AI remains disabled until an Ollama Cloud API key is added to Supabase. Deterministic
food search and manual logging continue to work without AI.

## Method

- Dataset: 20 real overhead meal images from [Nutrition5k](https://github.com/google-research-datasets/Nutrition5k), licensed CC BY 4.0.
- Prompt: the same `meal-vision-v1` JSON-only ingredient prompt used by `meals-api`.
- Baseline: [`gemma4:31b-cloud`](https://ollama.com/library/gemma4).
- Challenger: [`qwen3.5:cloud`](https://ollama.com/library/qwen3.5:cloud).
- Promotion gate: at least +0.10 F1 with no regression in schema validity, request success, or usage tier.
- Raw result: `supabase/benchmarks/meal-vision/latest-result.json`.

## Results

| Model              | Quality evaluated | Precision | Recall |     F1 | Valid JSON | Request success |  p50 |   p95 |
| ------------------ | ----------------: | --------: | -----: | -----: | ---------: | --------------: | ---: | ----: |
| `gemma4:31b-cloud` |               Yes |    63.24% | 64.18% | 63.70% |        95% |             95% | 6.1s | 75.3s |
| `qwen3.5:cloud`    |                No |         - |      - |      - |          - |              0% |    - |     - |

Gemma completed 19 of 20 requests; one request reached the 120-second timeout. All 20 Qwen calls
were rejected before inference because the model requires a different Ollama subscription tier.

## Product Implications

- Gemma can assist camera review, but its ingredient list must remain editable and must resolve to
  verified food records before calories or macros are shown.
- Do not auto-publish generated nutrition from vision output.
- The high tail latency makes camera analysis an asynchronous review flow, not an instant scanner.
- Re-run the same 20-sample benchmark after Qwen access is enabled. Promote only if the existing
  gate passes.
