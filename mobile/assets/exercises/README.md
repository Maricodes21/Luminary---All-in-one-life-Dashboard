# Luminary exercise visual library

This folder contains locally bundled, AI-generated instructional atlases for the workout planner. The atlas order is locked in `mobile/lib/exerciseVisualManifest.ts`; workout catalog additions must be appended to that manifest and assigned a new atlas cell rather than inserted into an existing sequence.

## Asset system

- Ten square atlases cover 157 catalog movements.
- Each atlas uses a 4 × 4 grid, read left-to-right and top-to-bottom.
- The app crops the requested cell at runtime through `ExerciseVisual`.
- Local atlases keep Health imagery available offline and avoid expiring third-party image URLs.
- Exercise name, prescription, cue, and visual ID travel together when a user substitutes a movement.

## Generation prompt

The shared prompt requested polished instructional 3D illustrations with anatomically plausible adult athletes, realistic joint positions, soft matte materials, a deep-charcoal studio or minimal outdoor setting, cool white and muted-blue athletic clothing, and subtle cobalt light. It required an exact 4 × 4 grid, one recognizable mid-repetition pose per panel, no text, no numbers, no labels, no arrows, no branding, no watermark, and no cropped limbs.

These visuals help recognition; the written coaching cue remains the source of truth. They are not a substitute for professional form assessment or medical guidance.
