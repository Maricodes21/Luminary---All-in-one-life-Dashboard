# Luminary privacy boundaries

Luminary's optional intelligence features follow three principles: clear consent, minimum necessary data, and explainable results. The core app remains usable when AI and connected services are disabled.

## Listening recap

Spotify data is used only to display an attributed listening recap. Track, artist, artwork, count, URL, timestamp, and recap data must not enter an AI prompt or be used to derive a mood profile. Luminary presents listening facts beside a separate wellbeing estimate without claiming that the music caused the estimate.

## Mood and Journal

The local mood estimate may use confirmed mood history, Journal tags, commitment activity, workout state, meal timing, time of day, and ritual history. Raw Journal text, Health Connect data, and financial context each require separate consent before optional AI processing. A user can inspect contributing categories, reject an estimate, choose a different mood, or skip.

## Food discovery

Food search prefers community and country-matched provider data before fallback sources. When ordinary providers have no useful answer, the protected server flow may interpret the query, search an allowlist of government, university, national food-composition, and manufacturer sources, and extract nutrition only from retrieved evidence.

Every retrieved candidate must show its source, retrieval date, confidence, and serving assumption and must be confirmed before logging. Insufficient or conflicting evidence falls back to a prefilled custom-food form. Retrieved candidates are cached as sourced community entries, never as verified foods.

## Data retention and control

- Commitment deletion ends future scheduling and preserves prior scheduled days and completion history.
- A single-day commitment removal is stored as a skip for that date.
- Daily signals retain impressions, dismissals, corrections, actions, expiry, and cooldown state so the same stale suggestion is not repeatedly shown.
- Temporary meal photos are removed after visible-ingredient analysis.
- Spotify tokens remain in secure device storage.
- Local data and offline mutations remain scoped to the signed-in user and synchronize when connectivity returns.

## Operational controls

Grounded food retrieval runs server-side with secret keys, an explicit kill switch, allowlisted domains, prompt-injection filtering, timeouts, caching, and a daily pilot quota. Public mobile builds must never contain the retrieval API key.
