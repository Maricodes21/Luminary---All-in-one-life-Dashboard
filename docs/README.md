# /docs

Reference assets, historical originals, mockups, and living implementation plans.

## Current release

- `releases/2026-08-luminary-mobile.md` - release summary and review guide.
- `iphone-preview.md` - free Expo Go and installable preview setup.
- `ux-copy-human-tone-map.md` - product-language guidance.

## Screenshots

- `screenshots/luminary-onboarding-android.png` - current Android onboarding capture.
- `mockups/` - historical product-direction references; these are not release screenshots.

## Benchmarks

- `benchmarks/meal-vision-2026-07-14.md` - Gemma/Qwen meal-photo evaluation and routing decision.

## Current Documentation

The canonical living docs live at the repo root:

- `README.md` - project entry point and current state.
- `PROGRESS.md` - detailed implementation snapshot.
- `ROADMAP.md` - phase plan and decisions log.
- `AGENT.md` - coding-agent working agreement and current repo tour.
- `DESIGN.md` - visual rules and design-token commitments.
- `TONE.md` - copy and voice rules.
- `SETUP.md` - local development setup.
- `PRIVACY.md` - AI, Spotify, nutrition, and retention boundaries.
- `CHANGELOG.md` - shipped changes by date.

## /originals

The handover materials Mari delivered to kick off the project. Treat these as read-only historical reference. Do not update them when the living app state changes.

- `luminary_roadmap.docx` - original phase plan, distilled into root `ROADMAP.md`.
- `luminary.jsx` - static React DOM prototype. Use for visual and logic intent only; do not copy into `mobile/`.
- `DESIGN_original.md` - original design system spec, superseded by root `DESIGN.md`.

## /mockups

PNG screenshots and Stitch HTML exports for the original major surfaces.

| File                       | Surface                                    |
| -------------------------- | ------------------------------------------ |
| `_overview.png`            | Stitch project overview thumbnail          |
| `home_dashboard.png/html`  | Home tab                                   |
| `guided_journal.png/html`  | Mood check-in screen                       |
| `journal_full.png/html`    | Journal entries list with mood trend chart |
| `physical_health.png/html` | Health tab                                 |
| `meal_planner.png/html`    | Meals tab                                  |
| `budget_tracker.png/html`  | Money tab                                  |

When implementing a screen in `mobile/`, use this order:

1. Root living docs for current product truth.
2. Mockup PNG for visual intent.
3. `docs/originals/luminary.jsx` for prototype logic intent.
4. `DESIGN.md` for token and layout rules.
5. `TONE.md` for copy.
