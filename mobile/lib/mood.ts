/**
 * Mood mapping algorithm.
 *
 * Maps Spotify audio features (valence × energy, with tempo as a secondary signal)
 * into Luminary's mood vocabulary. The roadmap defines five quadrants; we extend
 * with a confidence score so the UI can show "we're guessing" vs "we're confident."
 *
 * Stored mood entries are continuous events (timestamped, with source). A "headline
 * mood" is derived per-day, but the raw signal is preserved.
 */

export type MoodLabel = 'energized' | 'peaceful' | 'restless' | 'melancholic' | 'reflective';

export type MoodSource = 'spotify' | 'manual' | 'journal_inferred';

export type MoodEvent = {
  /** ISO timestamp. */
  at: string;
  label: MoodLabel;
  source: MoodSource;
  /** 0..1; how confident we are in this label. Manual entries are 1.0. */
  confidence: number;
  /** Optional: original audio features for debug/audit. */
  features?: {
    valence: number;
    energy: number;
    tempo?: number;
  };
};

/**
 * Map averaged Spotify audio features to a mood label + confidence.
 * Roadmap quadrants:
 *   valence > 0.6 + energy > 0.6 = Energized
 *   valence > 0.6 + energy < 0.4 = Peaceful
 *   valence < 0.4 + energy > 0.6 = Restless
 *   valence < 0.4 + energy < 0.4 = Melancholic
 *   middle range                 = Reflective
 *
 * Confidence is the L2 distance from the closest quadrant center, normalized.
 */
export function mapAudioFeaturesToMood(input: { valence: number; energy: number; tempo?: number }): {
  label: MoodLabel;
  confidence: number;
} {
  const { valence, energy } = input;
  const v = clamp01(valence);
  const e = clamp01(energy);

  let label: MoodLabel;
  if (v > 0.6 && e > 0.6) label = 'energized';
  else if (v > 0.6 && e < 0.4) label = 'peaceful';
  else if (v < 0.4 && e > 0.6) label = 'restless';
  else if (v < 0.4 && e < 0.4) label = 'melancholic';
  else label = 'reflective';

  // Distance from nearest "pure" quadrant center → confidence.
  const centers: Record<MoodLabel, [number, number]> = {
    energized: [0.8, 0.8],
    peaceful: [0.8, 0.2],
    restless: [0.2, 0.8],
    melancholic: [0.2, 0.2],
    reflective: [0.5, 0.5],
  };
  const [cv, ce] = centers[label];
  const dist = Math.sqrt((v - cv) ** 2 + (e - ce) ** 2);
  // Max possible distance in unit square is sqrt(2). Invert and clamp.
  const confidence = clamp01(1 - dist / Math.sqrt(2));

  return { label, confidence };
}

/**
 * Average a set of audio-feature samples. Spotify returns null entries for
 * tracks with no analysis — those are filtered.
 */
export function averageAudioFeatures(
  samples: Array<{ valence: number | null; energy: number | null; tempo: number | null } | null>,
): { valence: number; energy: number; tempo: number } | null {
  const valid = samples.filter(
    (s): s is { valence: number; energy: number; tempo: number } =>
      !!s && typeof s.valence === 'number' && typeof s.energy === 'number',
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce(
    (acc, s) => ({
      valence: acc.valence + s.valence,
      energy: acc.energy + s.energy,
      tempo: acc.tempo + (s.tempo ?? 0),
    }),
    { valence: 0, energy: 0, tempo: 0 },
  );
  return {
    valence: sum.valence / valid.length,
    energy: sum.energy / valid.length,
    tempo: sum.tempo / valid.length,
  };
}

/** Friendly copy mapping for the mood label. Centralized so TONE.md stays consistent. */
export const moodCopy: Record<MoodLabel, { display: string; verb: string }> = {
  energized: { display: 'Energized', verb: 'lit up' },
  peaceful: { display: 'Peaceful', verb: 'settled' },
  restless: { display: 'Restless', verb: 'unsettled' },
  melancholic: { display: 'Melancholic', verb: 'tender' },
  reflective: { display: 'Reflective', verb: 'thinking' },
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
