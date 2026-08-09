# Changelog

## 2026-08-09

### Added

- Effective-dated commitments, categorized custom commitment creation, five-item Home paging, single-day skips, substitutions, and history-preserving future deletion.
- A shared daily signal registry with 30+ parameterized rules, confidence thresholds, expiry, copy cooldowns, feedback suppression, and deterministic variation.
- First-party mood estimation with explicit consent, visible contributing categories, correction, manual choice, and skip paths.
- Journal prompt rotation and evidence-backed patterns with confidence, evidence windows, hide, and correction controls.
- Region-aware food search and cited, allowlisted nutrition retrieval when trusted providers cannot answer.
- Weekly shopping-list consolidation and broader preparation-method meal rotation over four weeks.
- Yoga planning, dynamic workout variety, guided workout sessions, and numbered movement instructions.
- Cached meal and exercise images with on-demand exercise-atlas loading and graceful placeholders.

### Changed

- Nightly ritual order is now listening recap, mood, optional Journal, commitment reconciliation, tomorrow planning, then final optional actions.
- Spotify recap now shows four tracks and four artists as attributed listening facts; fabricated audio-feature and Spotify-derived mood fields are no longer used.
- Home's Next Up card uses the relevant meal or workout artwork, and Health shows the actual scheduled session title.
- Free write opens a blank Journal entry, and older entries remain available through weekly/monthly pagination.
- Health's standalone “useful note” card was removed.

### Privacy and reliability

- Spotify data is excluded from AI mood requests.
- Online nutrition requires cited evidence and user confirmation, with a safe manual fallback when evidence, quota, or connectivity is inadequate.
- Ritual completion is persisted before navigating into Meals, Health, or Money.
- Media now uses memory/disk caching and failure placeholders to reduce blank images after longer app sessions.
