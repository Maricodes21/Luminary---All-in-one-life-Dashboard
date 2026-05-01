/**
 * Theme — combines tokens into a single object passed via React context.
 * Future: a "sunrise" daytime variant slot is reserved here.
 */
import { palette, spacing, radii, elevation, accent, glass, ghostBorder } from './tokens';
import { type, fontFamily, fontWeight } from './typography';

export const darkTheme = {
  mode: 'dark' as const,
  palette,
  accent,
  spacing,
  radii,
  elevation,
  glass,
  ghostBorder,
  type,
  fontFamily,
  fontWeight,
} as const;

export type Theme = typeof darkTheme;

// Sunrise (daytime) variant — slot reserved. Tuned in Phase 5 polish.
// export const sunriseTheme: Theme = { ... };
