# Luminary

> A connected daily companion for commitments, reflection, meals, movement, money, and music.

Luminary is a mobile-first wellbeing app built around a simple loop: what happens during the day becomes useful context at night, and the completed nightly ritual shapes tomorrow. The five main destinations remain Home, Journal, Meals, Health, and Money.

## Current release

The August 2026 mobile release includes:

- Home commitments backed by one effective-dated schedule, with five-item paging and immediate cross-screen updates.
- A rules-first signal library with more than 30 signal families, evidence, confidence, expiry, cooldowns, and feedback.
- An adaptive nightly ritual that moves through listening recap, mood confirmation, Journal, commitments, tomorrow, and optional final actions.
- Spotify listening facts kept separate from Luminary's optional first-party mood estimate.
- A weekly Journal timeline with rotating prompts and evidence-backed local patterns.
- Region-aware food discovery, cited nutrition fallback, varied four-week meal planning, and a consolidated shopping list.
- Dynamic Gym, Home, Run, Cycle, and Yoga plans with guided workouts and step-by-step movement instructions.
- Cached meal and exercise media with retry and placeholder behavior.
- Free iPhone field testing through Expo Go and an Android development-client path.

See [the release summary](docs/releases/2026-08-luminary-mobile.md) for behavior, privacy boundaries, validation, and rollout notes.

## Repository layout

```text
multi-app/
|-- mobile/                  Expo React Native app
|-- packages/design-system/  Shared tokens and typography
|-- supabase/                Database migrations and Edge Functions
|-- docs/                    Release notes, setup guides, and historical references
|-- DESIGN.md                Visual design system
|-- TONE.md                  Product voice guide
|-- ROADMAP.md               Product roadmap
|-- PROGRESS.md              Implementation snapshot
`-- SETUP.md                 Local development setup
```

## Quick start

Requirements: Node 20+, npm 10+, Git, and Expo tooling.

```powershell
npm install
Copy-Item mobile\.env.example mobile\.env
npm run start --workspace=mobile
```

For a free iPhone preview:

```powershell
npm run mobile:preview:iphone
```

Install Expo Go, scan the QR code, and keep the preview command running. See [iPhone preview setup](docs/iphone-preview.md) for Spotify callback configuration and the tunnel fallback.

For Android:

```powershell
npm run mobile:android
```

## Quality checks

```powershell
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run test:content --workspace=mobile
npm run test:meals --workspace=mobile
npm run test:meals:backend
npm run test:personalization:backend
npm run test:spotify:backend
```

## Privacy boundaries

- Spotify is a display-only listening source. Its data is not sent to AI and does not determine the user's mood.
- Journal text, health data, and financial context each require separate consent before optional AI use.
- Nutrition created from online retrieval must retain its source, serving assumption, retrieval date, and confidence. It is never presented as verified food data.
- Core commitments, journaling, meals, workouts, money, and ritual completion remain usable without AI.

Read [PRIVACY.md](PRIVACY.md) for the full implementation-facing policy.

Built and maintained by Mari / Maricodes21.
