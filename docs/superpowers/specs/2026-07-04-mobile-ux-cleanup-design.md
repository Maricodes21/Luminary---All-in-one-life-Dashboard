# Mobile UX Cleanup Design

## Context

This pass fixes the UX issues raised in the section-by-section critique for the mobile Expo app. The goal is to make the current local-first product feel coherent and shippable without changing the core tab architecture or adding backend-dependent features.

The implementation must preserve the existing app visual language. The browser mockup was only a structural sketch; production UI should use the app's current design-system palette, typography, radii, `Card`, `QuickActionTile`, `Chip`, and `ProgressBar` patterns.

## Approved Direction

Use a focused cleanup rather than a broad redesign:

- Home: replace duplicated habit interactions with one row-based habit list.
- Meals: make calories and macros more glanceable, make Search the primary logging path, use "Manual entry" for fallback copy, and convert the weekly plan into a compact week overview.
- Health: move actionable workout content above unconnected Health Connect prompts, remove implementation-source copy, and soften empty-state copy.
- Money: make one leftover-money action primary, remove staged/dev wording, and use "Manual entry" where a manual flow is the current path.
- Ritual: align ritual habits with the same persisted habit source as Home, add a subtle step indicator, plain-language Spotify mood copy, listening-confidence caveats, and unambiguous "Keep active" toggles.
- Workout imagery: use sourced exercise photos for now, but add metadata support so generated illustrations can be swapped in later without changing UI consumers.

## Generated Illustration Cost Notes

Generated workout illustrations should be an offline asset-production cost, not a runtime per-user cost. If we generate 20 to 40 reusable exercise illustrations once and ship/cache them, the API cost is small compared with the design QA time.

Current OpenAI pricing, checked on July 4, 2026:

- `gpt-image-2` standard image output is listed at $30 per 1M output tokens, with image input at $8 per 1M tokens and text input at $5 per 1M tokens.
- Batch pricing halves those rates for `gpt-image-2` image output to $15 per 1M output tokens.
- The image generation guide says cost scales with requested size and quality, and its calculator is the right source for exact estimates.
- The guide's visible calculator example returned 196 output tokens; at $30 per 1M output tokens, that is about $0.006 in output-token cost for one simple generated image before prompt/input overhead.
- Older image-model token examples show how quickly cost rises with quality: 1024 square images were listed as 272 tokens for low, 1056 for medium, and 4160 for high. At $30 per 1M output tokens, those would be roughly $0.008, $0.032, and $0.125 each. Treat these as a sizing intuition, not exact `gpt-image-2` pricing.

Practical budget:

- Small pilot, 12 exercise illustrations, two attempts each, low/medium quality: likely under a few dollars in API spend.
- Production pass, 40 exercise illustrations, three attempts each, medium/high quality: likely still low tens of dollars in API spend.
- Real cost is curation: picking consistent poses, avoiding misleading form, checking diversity, writing alt text, and replacing weak generations.

Decision: implement the hybrid path now. Keep sourced photos in the current UI, and add source/alt/style metadata so generated illustrations can become a later asset swap.

## Home Design

Daily habits should have one interaction pattern. Replace the icon-ring row plus editable text rows with a single list:

- Leading circular checkbox toggles completion.
- Habit name is readable text, not always-editing input.
- Trailing small action opens edit/delete affordance or archives directly if the existing pattern stays simple.
- Completion count remains in the section header.

The central sparkle FAB remains the ritual entry point. Add visible context where it naturally fits, such as a tab-bar accessibility label plus a nearby "Tonight" cue or first-run helper copy outside the button. Do not turn it into a decorative duplicate action.

## Meals Design

The top daily target card should make calories visually dominant:

- Calories left appear inside a circular progress/ring-style element.
- Protein, carbs, and fat appear as three thin progress bars with current/target labels.
- The layout must use existing `palette`, `type`, and compact spacing so it matches the app rather than the rough companion mockup.

Logging hierarchy:

- Search becomes a full-width primary action.
- Scan meal, Barcode, and Manual entry become smaller secondary actions.
- Replace all dev wording such as "Manual fallback", "Search first", "Photo recognition staged", and "cache-first lookup" with user-facing copy.
- Use "Manual entry" exactly for the manual fallback path.

Food confirmation/source copy:

- Show plain confirmation: "Found: oats, 150 cal, 5g protein. Adjust if needed."
- Keep USDA/Open Food Facts/source plumbing as subtle attribution on rows, not primary screen copy.

Weekly plan:

- Replace horizontal day cards on the main Meals screen with a compact 7-row overview.
- Each row shows day, meal count, and total calories.
- If the week is incomplete, show a CTA to generate the rest of the week.
- Keep detailed meal cards inside the planner sheet or day detail view.

Suggestions:

- Add a contextual protein-gap card when protein is meaningfully short and the day is late enough to matter.
- Example copy: "20g short on protein. Three dinner ideas."
- It should be dismissible or naturally ignorable, not a permanent menu section.

## Health Design

Move "Today's workout" above the Health Connect card. If Health Connect has live data, it can rise in priority; otherwise it should not outrank a plan the user can act on.

Remove implementation-source copy from the Plan setup card. Replace "wger / curated with seed-and-cache lookup" with plain copy about exercise variety and substitutions.

Soften the empty state:

- Current: "No workouts logged yet. Create a week first; completion comes after."
- Proposed: "No workouts logged yet. Create a week, then mark each session complete when you finish."

Workout imagery remains sourced photos for this pass. Extend data with optional image metadata so a later generated illustration set can be introduced consistently.

## Money Design

The month summary should choose one primary leftover-money action:

- Primary: unassigned income, because it answers "what should I do with money not yet assigned?"
- Secondary: unallocated budget, shown as supporting copy or inside the budget editor.

Remove staged/dev wording from receipt and capture actions. Use "Manual entry" for the path that opens the existing expense form.

Keep notification assist prominent because it is a strong product idea. Its empty state should remain plain: bank notifications can become suggested transactions and the user confirms before logging.

## Ritual Design

Habits:

- Ritual habit check-in should read from the same persisted user habits as Home, with a Supabase path only when remote habits exist.
- This removes the trust-risk mismatch between Home defaults and ritual defaults.

Mood:

- Display the actual mood label first, using `moodCopy`.
- Treat artist/genre flavor as secondary context.
- If listening signal is thin, caveat the mood: "Light listening today - best guess."

Confidence:

- Use a minimum signal threshold before confident copy.
- Proposed threshold: at least 3 tracks or 10 listening minutes for normal confidence language.
- Below threshold, keep the "That's about right / Not quite right" pattern but caveat the claim.

Flow:

- Add a subtle step indicator for mood, reflection, habits, and summary.
- Rename tomorrow toggles to "Keep active" so ON means the habit remains active tomorrow.

## Implementation Boundaries

This design is a UX cleanup pass, not a new integration pass. Do not add paid image generation, live camera scanning, barcode recognition, or Health Connect wiring in this implementation. Preserve local-first behavior and existing store shape unless a small metadata extension is needed.

## Verification

Run the existing mobile verification stack:

- `npm run test:content --workspace=mobile` if content-library or asset metadata changes.
- `npm run type-check --workspace=mobile`
- `npm run lint --workspace=mobile`
- `npm run deps:check --workspace=mobile`
- `git diff --check`

If visual changes are substantial, run the Expo app and inspect Meals, Health, Money, Home, and Ritual on a mobile viewport/emulator before calling the pass complete.
