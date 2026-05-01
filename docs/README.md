# /docs

Reference assets, originals, and mockups.

## /originals
The handover materials Mari delivered to kick off the project. Treat as read-only reference; the canonical living docs are at the repo root.

- `luminary_roadmap.docx` — original 5-phase plan. Distilled into root `ROADMAP.md`.
- `luminary.jsx` — ~1080-line static React prototype showing all 6 tabs. Reference for layout intent only — DO NOT copy directly into `mobile/`. Each section needs to be rewritten as React Native + theme tokens.
- `DESIGN_original.md` — the original design system spec. Distilled and tightened in root `DESIGN.md`.

## /mockups
PNG screenshots and Stitch HTML exports for each major surface.

| File | Surface |
|---|---|
| `_overview.png` | Stitch project overview thumbnail |
| `home_dashboard.png/html` | Home tab |
| `guided_journal.png/html` | Mood check-in screen ("How are you really feeling?") |
| `journal_full.png/html` | Journal entries list with mood trend chart |
| `physical_health.png/html` | Health tab |
| `meal_planner.png/html` | Meals tab |
| `budget_tracker.png/html` | Money tab |

When implementing a screen in `mobile/`, look at:
1. The mockup PNG → visual intent
2. The corresponding section of `originals/luminary.jsx` → component logic intent
3. Root `DESIGN.md` → token usage rules
4. Root `TONE.md` → copy
