/**
 * Typography scale for Luminary.
 *
 * Pairing: Manrope (display/headline) + Inter (body/label).
 * Rules:
 *   - Display: Manrope 800, tight tracking (-0.02em).
 *   - Headline: Manrope 700, slight tight tracking.
 *   - Body: Inter 400/500, normal tracking.
 *   - Label: Inter 700 uppercase, +0.05em tracking.
 *
 * Use named tokens (`type.headlineMd`), never raw font sizes.
 */

export const fontFamily = {
  display: 'Manrope',
  body: 'Inter',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export type TypeStyle = {
  fontFamily: (typeof fontFamily)[keyof typeof fontFamily];
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
};

export const type: Record<string, TypeStyle> = {
  // Display — sparse, editorial. "Moment of Zen" titles.
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -1.12, // -0.02em
  },
  displayMd: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.72,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.56,
  },

  // Headline — section heroes.
  headlineLg: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  headlineMd: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  headlineSm: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },

  // Title — card titles, list-item primary text.
  titleLg: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  titleMd: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },

  // Body — long-form text, paragraphs.
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.regular,
  },

  // Label — Mission Control data tags. Always uppercase + tracked.
  labelLg: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6, // +0.05em
    textTransform: 'uppercase',
  },
  labelMd: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
