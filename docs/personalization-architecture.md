# Persistent personalization: first release slice

Status: implemented on `feat/insight-personalization` for review.

## Decision

Luminary will evolve through additive, user-visible slices instead of replacing every local store and plan table at once. Supabase remains the durable signed-in source of truth. The current local stores continue to make the mobile app instant and usable offline while new records adopt one typed persistence boundary.

The first slice includes:

- explicit AI context controls and a “What Luminary knows” screen;
- a Spotify-free compact-AI request contract;
- a user-owned listening reaction that may inform a tentative mood;
- generated nightly reflections that are kept only when accepted;
- additive life-profile, goals, schedule, context-fact, daily-check-in, context-snapshot, and reflection tables;
- stronger localized food search when provider results match only part of the query.

## Why this departs from the full target

The supplied target model also proposes shared immutable plan versions, activities, constraints, weekly reviews, coach conversations, and a consolidated mutation repository. Moving Health and Meals onto that model requires backfill, dual reads, plan diffs, safety review, and rollback support. Replacing those working paths inside the first mobile change would make data loss and field-test regressions more likely.

This slice therefore establishes the context and consent boundary first. Shared plan versions, confirmed conversational proposals, and the single mutation repository remain follow-on migrations. Existing meal and workout data is not rewritten.

## AI boundary

For current iPhone Expo Go testing, Gemma runs on Mari’s desktop and Luminary reaches its Ollama-compatible endpoint over the private local network. The phone does not download a model. If the endpoint is absent, mood suggestions fall back to deterministic Luminary rules and optional reflections remain unavailable without breaking the ritual.

A public on-device release requires a custom native build, not Expo Go. Luminary can either bundle a quantized compact model in the app, which increases the initial download, or download the model after consent, which keeps the store binary smaller. Both options require device capability checks, storage management, thermal testing, and a deterministic fallback. Users would not install Gemma separately.

Spotify track, artist, artwork, recap, play-count, and timing fields are excluded from every AI request. The recap remains a separate attributed surface. The only listening-related AI input is the user’s own answer to “How did the listening feel to you?”

## Live-plan gap map

| Area                             | Status after this slice            | Next safe step                                                 |
| -------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| Consent and context controls     | Partial                            | Sync the full visible context catalog across devices           |
| Optional nightly reflection      | Implemented for local compact AI   | Add hosted/provider-neutral fallback only if approved          |
| Music-assisted mood              | Implemented within policy boundary | Benchmark reaction-plus-first-party fixtures                   |
| Persistent living profile        | Partial, additive schema           | Add activities, constraints, module profiles, and editing      |
| Context snapshots                | Schema ready, server-write only    | Build the authenticated ContextAssembler                       |
| Versioned Health and Meals plans | Missing                            | Backfill, shadow-generate, then dual-read                      |
| Coach proposals                  | Missing                            | Add safety-gated structured proposals after plan versioning    |
| Unified offline mutation queue   | Partial                            | Migrate existing queues with idempotency and user partitioning |
| Weekly review                    | Missing                            | Build after versioned plans can accept or reject proposals     |

## Acceptance for this slice

- Compact-AI requests reject Spotify-shaped fields at any nesting depth.
- Raw Journal text is absent unless its separate setting is enabled.
- Rejected reflections are discarded; accepted reflections persist and can be forgotten.
- AI failure never blocks mood confirmation or ritual completion.
- Food query interpretation activates when provider results are irrelevant, not only empty.
- Every new user-scoped table has explicit grants, indexes, and owner-only RLS.
