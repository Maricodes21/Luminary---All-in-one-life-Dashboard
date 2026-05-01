/**
 * Color, spacing, and radius tokens for Luminary.
 *
 * The single source of truth for all visual values. Never inline a color or
 * pixel value in a component — import from here.
 */

export const palette = {
  // Surface hierarchy — the "no-line" foundation. Depth comes from these.
  surface: '#0c0e10',
  surfaceContainerLowest: '#0a0c0e',
  surfaceContainerLow: '#111416',
  surfaceContainer: '#171a1c',
  surfaceContainerHigh: '#1d2022',
  surfaceContainerHighest: '#232629',
  surfaceBright: '#2a2d30',

  // Primary — Focused Blue. The ONE blue. Active states, focus, primary CTAs.
  primary: '#8cacff',
  primaryDim: '#2c6dec',
  primaryFixed: '#769dff',
  primaryContainer: '#003095',
  onPrimary: '#001f56',

  // Secondary — Sunrise Orange. Warmth, urgency, morning mode.
  secondary: '#fe7d5e',
  secondaryDim: '#f7785a',
  secondaryContainer: '#5d1900',

  // Tertiary — Energetic Green. Completion, fitness mode.
  tertiary: '#b6ffbf',
  tertiaryDim: '#49ee7f',
  tertiaryContainer: '#005321',

  // Error — restrained red.
  error: '#ff716c',
  errorContainer: '#690000',

  // Foreground.
  onSurface: '#eeeef0',
  onSurfaceVariant: '#aaabad',
  onSurfaceInverse: '#0c0e10',

  // Outlines — only for ghost borders, never as 1px sectioning lines.
  outline: '#747578',
  outlineVariant: '#46484a',

  // Ambient surface tint — used for cool modal glow, not for fills.
  surfaceTint: '#8cacff',
} as const;

export type PaletteKey = keyof typeof palette;

/**
 * Semantic accent map. Pick by context, not by color name.
 *   accent.morning   → secondary (Sunrise Orange)
 *   accent.focus     → primary   (Focused Blue)
 *   accent.fitness   → tertiary  (Energetic Green)
 *   accent.warning   → error     (restrained red)
 */
export const accent = {
  morning: palette.secondary,
  focus: palette.primary,
  fitness: palette.tertiaryDim,
  warning: palette.error,
} as const;

/**
 * Spacing scale. No intermediates allowed in components.
 * Use named keys (`spacing.md`), never raw pixels.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Corner radius scale. Cards mostly use `lg` (20). Buttons `md` (16). Inputs `sm` (12).
 */
export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export type RadiiKey = keyof typeof radii;

/**
 * Elevation. Drop shadows are forbidden — use these "glow" presets only.
 * Each is a cool, ambient shadow derived from `surfaceTint`.
 */
export const elevation = {
  none: 'none',
  // Soft lift for floating cards.
  soft: {
    shadowColor: palette.surfaceTint,
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  // Modal-level ambient glow.
  modal: {
    shadowColor: palette.surfaceTint,
    shadowOpacity: 0.06,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

/**
 * Glassmorphism preset for nav and floating headers.
 * Apply via BlurView from expo-blur.
 */
export const glass = {
  intensity: 60, // expo-blur intensity
  tint: 'dark' as const,
  // Use this background under the BlurView when the platform doesn't support backdrop-filter.
  fallbackBackground: 'rgba(23, 26, 28, 0.6)',
} as const;

/**
 * Ghost border helper. Returns the rgba string for a 15% opacity outline-variant.
 * Use ONLY when surface-shift contrast is insufficient. Never as a 1px sectioning line.
 */
export const ghostBorder = (opacity = 0.15): string => `rgba(70, 72, 74, ${opacity})`;
