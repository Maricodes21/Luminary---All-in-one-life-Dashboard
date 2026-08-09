# Luminary mobile release — August 2026

## Product loop

`Daily activity → Home → Commitments → Nightly synthesis → Tomorrow's guidance`

Home, the Commitment Hub, and the nightly ritual now read from the same active schedule and current signal state. A change made in any of those places is reflected everywhere else without erasing historical completion data.

## What to review

1. Add a categorized commitment with a rhythm and time window. Confirm it appears on Home and in tonight's reconciliation.
2. Complete, skip, substitute, and end commitments. Confirm prior days remain in detail history.
3. Complete the nightly flow with Spotify disconnected and connected. Listening should remain factual; the mood estimate should explain only Luminary-owned contributors.
4. Free write in Journal, try contextual prompts, and inspect/hide a local pattern.
5. Search for South African foods and a misspelled regional dish. Grounded results must show sources and require confirmation.
6. Generate a meal week, inspect preparation-method variety, substitute an entry, and open the consolidated shopping list.
7. Generate Gym, Home, Run, Cycle, and Yoga plans. Open a day and run the guided player through timer and manual steps.
8. Move repeatedly through Home, Ritual, Meals, workout player, and Home to confirm images remain available.

## AI and connected-service boundaries

- Spotify recap data is display-only and excluded from AI input.
- AI personalization is optional and can be disabled independently for Journal, health, and financial context.
- Food nutrition is extracted only from cited retrieved evidence. No-source or low-evidence cases use manual entry.
- Deterministic local rules remain the default for signals, prompts, and basic mood guidance.

## Release branches

- `feat/commitments-home`
- `feat/ritual-signals`
- `feat/journal-intelligence`
- `feat/meals-local-shopping`
- `fix/health-media-reliability`
- `preview/mobile`
- `docs/luminary-release`

Feature branches are integrated into `develop`; release-ready `develop` is merged into `main` with normal merge history.

## Validation record

- Mobile content tests: 54 passed.
- Meals workflow tests: 72 passed.
- Meals backend and retrieval contracts: 37 passed.
- Personalization schema contract: passed.
- Spotify preview OAuth contracts: 3 passed.
- TypeScript, lint, Expo dependency alignment, and Android Hermes export: passed.
- The local native debug install remains machine-blocked by Reanimated/CMake path-length handling in the nested Windows worktree. The Expo Go field-test route and packaged Android export do not share that CMake build-path constraint.
