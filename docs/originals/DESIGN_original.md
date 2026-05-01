# Design System Strategy: The Empathetic Command Center

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Mindful Pilot."** 

We are moving away from the "data-heavy dashboard" and toward a high-end editorial experience that feels both authoritative (Mission Control) and deeply personal (Assistant). This design system achieves sophistication not through complexity, but through **intentional negative space, tonal layering, and tactile glassmorphism**. 

We break the "template" look by using a hierarchy of soft, rounded containers and asymmetric typography layouts. Every element should feel like it is floating in a deep, organized space—where the interface doesn't just display information, but holds it with care.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep obsidian base, allowing vibrant, purposeful accents to act as "beacons" for the user’s cognitive load.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
- To separate a card from the background, place a `surface-container-low` object on a `surface` background.
- Use `surface-container-highest` only for the most critical interactive elements to create natural focus.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass.
- **Base Layer:** `surface` (#0c0e10) — The infinite canvas.
- **Secondary Sectioning:** `surface-container` (#171a1c).
- **Interactive Cards:** `surface-container-high` (#1d2022).
- **Active/Hover States:** `surface-container-highest` (#232629).

### The "Glass & Gradient" Rule
To elevate the "smart" feel, use **Glassmorphism** for floating headers or navigation bars. Use semi-transparent variants of `surface-bright` with a `backdrop-filter: blur(20px)`. 

### Signature Textures
Main Action buttons and Hero Progress indicators should use a subtle linear gradient (e.g., `primary` to `primary-container`) at a 135-degree angle. This provides a tactile "glow" that flat colors lack, reinforcing the "energetic" vibe requested.

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headlines) with **Inter** (Body/Labels) to balance tech-forward precision with human readability.

- **The Power of Scale:** Use `display-lg` (3.5rem) sparingly for "Moment of Zen" or "Morning Briefing" titles to create an editorial feel.
- **Rhythm:** Headlines (`headline-md`) should always feature a tighter letter-spacing (-0.02em) to look "locked in." 
- **The Empathetic Label:** All `label-sm` elements should be in uppercase with +0.05em tracking when using the `on-surface-variant` color to provide a "Mission Control" data-tag aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are replaced by **Ambient Occlusion** and **Tonal Stacking.**

- **The Layering Principle:** Depth is achieved by stacking tiers. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a soft "recessed" look.
- **Ambient Shadows:** For floating modals, use a shadow with a 40px blur, 0% spread, and 6% opacity. The shadow color must be derived from `surface-tint` (#8cacff) to create a "cool" ambient glow rather than a muddy grey.
- **The "Ghost Border" Fallback:** If a container lacks enough contrast on a specific background, use a "Ghost Border": the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.
- **Glassmorphism Depth:** Use `surface-variant` at 60% opacity with a blur for top-level navigation to allow the vibrant accent colors of the content to bleed through as the user scrolls.

---

## 5. Components

### Buttons
- **Primary:** High-vibrancy `primary` container with a subtle inner glow. Corners: `xl` (1.5rem).
- **Secondary:** Transparent fill with a `Ghost Border` (outline-variant @ 20%).
- **Tertiary:** Text only, using `primary` or `secondary` tokens depending on the context (e.g., "Skip" vs "Continue").

### Tactical Cards
Cards must never have dividers. Use `body-lg` for titles and `body-sm` for metadata, separated by 12px of vertical white space. Use `md` (0.75rem) or `lg` (1rem) corner radius for a "friendly" tactile feel.

### Interactive Chips
- **Mood/Action Chips:** As seen in the "Mood Check" reference, use a `surface-container-high` background with an `outline-variant` ghost border. On selection, transition to the vibrant accent color (e.g., `tertiary` for "Peaceful").

### Input Fields
- **Minimalist Frames:** Use `surface-container-lowest` for the input area. The label should be `label-md` floating above the field in `on-surface-variant`.
- **States:** Use `primary` for active focus and `error` (#ff716c) for invalid states.

### Context-Aware Accents
- **Morning Mode:** Utilize `secondary` (Sunrise Orange) for progress bars.
- **Focus Mode:** Utilize `primary` (Focused Blue) for timers.
- **Fitness Mode:** Utilize `tertiary` (Energetic Green) for completion states.

---

## 6. Do's and Don'ts

### Do
- **DO** use asymmetric layouts. Align a headline to the left and a summary card to the right with generous whitespace.
- **DO** use the Typography Scale to create hierarchy. A `display-sm` headline next to a `body-sm` description creates an intentional, high-end "magazine" feel.
- **DO** rely on `surface-container` shifts to define the "Mission Control" areas (sidebar vs. main stage).

### Don't
- **DON'T** use 1px solid borders to separate list items. Use 8px or 16px of vertical space.
- **DON'T** use pure black (#000000) for backgrounds unless it's an OLED-specific container lowest layer. Use the `surface` token (#0c0e10) for better depth.
- **DON'T** use standard "Drop Shadows." If it looks like a shadow, it’s too heavy. It should look like a "glow" or a "soft lift."
- **DON'T** crowd the UI. If a screen feels full, increase the padding by one step on the `Roundedness Scale`.