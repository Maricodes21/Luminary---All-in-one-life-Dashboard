/**
 * Mood mapping algorithm.
 *
 * Maps Spotify audio features (valence × energy, with tempo as a secondary
 * signal) into Luminary's mood vocabulary. The full vocabulary is 15 labels;
 * the algorithm derives the most likely one from features and returns a
 * confidence score so the UI can show "we're guessing" vs "we're confident."
 *
 * Stored mood entries are continuous events (timestamped, with source). A
 * "headline mood" is derived per-day in the app, but the raw signal is
 * preserved so future analyses can re-bucket.
 */

export type MoodLabel =
  // High energy
  | 'energized'
  | 'joyful'
  | 'restless'
  | 'anxious'
  | 'wired'
  // Moderate energy
  | 'reflective'
  | 'hopeful'
  | 'focused'
  | 'curious'
  | 'cloudy'
  // Low energy
  | 'peaceful'
  | 'grounded'
  | 'tender'
  | 'melancholic'
  | 'drained';

export const ALL_MOOD_LABELS: readonly MoodLabel[] = [
  'energized', 'joyful', 'restless', 'anxious', 'wired',
  'reflective', 'hopeful', 'focused', 'curious', 'cloudy',
  'peaceful', 'grounded', 'tender', 'melancholic', 'drained',
] as const;

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
 *
 * The valence × energy plane is divided into 9 zones (3×3), with high/mid/low
 * thresholds. Each zone resolves to one of two labels based on edge proximity
 * (e.g., very-high valence → joyful instead of energized). Tempo nudges the
 * mid-mid case between curious (faster) and reflective (slower).
 *
 * Confidence is the L2 distance from the closest "pure" zone center, normalized.
 */
export function mapAudioFeaturesToMood(input: {
  valence: number;
  energy: number;
  tempo?: number;
}): { label: MoodLabel; confidence: number } {
  const v = clamp01(input.valence);
  const e = clamp01(input.energy);
  const t = input.tempo ?? 100;

  let label: MoodLabel;
  let center: [number, number];

  // ─── High energy band (e > 0.6) ────────────────────────────────────────
  if (e > 0.6) {
    if (v > 0.65) {
      label = v > 0.85 ? 'joyful' : 'energized';
      center = v > 0.85 ? [0.9, 0.8] : [0.75, 0.75];
    } else if (v < 0.35) {
      label = v < 0.2 ? 'anxious' : 'restless';
      center = v < 0.2 ? [0.1, 0.8] : [0.25, 0.75];
    } else {
      label = 'wired';
      center = [0.5, 0.85];
    }
  }
  // ─── Low energy band (e < 0.4) ─────────────────────────────────────────
  else if (e < 0.4) {
    if (v > 0.6) {
      label = e < 0.25 ? 'grounded' : 'peaceful';
      center = e < 0.25 ? [0.7, 0.15] : [0.7, 0.3];
    } else if (v < 0.35) {
      label = e < 0.25 ? 'drained' : 'melancholic';
      center = e < 0.25 ? [0.2, 0.15] : [0.2, 0.3];
    } else {
      label = 'tender';
      center = [0.5, 0.25];
    }
  }
  // ─── Moderate energy band (0.4 ≤ e ≤ 0.6) ──────────────────────────────
  else {
    if (v > 0.6) {
      label = v > 0.75 ? 'hopeful' : 'focused';
      center = v > 0.75 ? [0.8, 0.5] : [0.65, 0.5];
    } else if (v < 0.4) {
      label = 'cloudy';
      center = [0.3, 0.5];
    } else {
      // Mid-mid: tempo decides between thinking-faster (curious) and thinking-slower (reflective).
      label = t > 110 ? 'curious' : 'reflective';
      center = [0.5, 0.5];
    }
  }

  const dist = Math.sqrt((v - center[0]) ** 2 + (e - center[1]) ** 2);
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

/**
 * Display copy for each mood label. `display` is what the chip shows;
 * `verb` is the past-tense form used by the Friend Card narrator
 * ("Last night you were *settled*"). Centralized so TONE.md stays consistent.
 */
export const moodCopy: Record<MoodLabel, { display: string; verb: string; band: 'high' | 'mid' | 'low' }> = {
  // High energy
  energized:   { display: 'Energized',   verb: 'lit up',     band: 'high' },
  joyful:      { display: 'Joyful',      verb: 'glowing',    band: 'high' },
  restless:    { display: 'Restless',    verb: 'unsettled',  band: 'high' },
  anxious:     { display: 'Anxious',     verb: 'wound tight', band: 'high' },
  wired:       { display: 'Wired',       verb: 'buzzing',    band: 'high' },
  // Moderate energy
  reflective:  { display: 'Reflective',  verb: 'thinking',   band: 'mid' },
  hopeful:     { display: 'Hopeful',     verb: 'reaching',   band: 'mid' },
  focused:     { display: 'Focused',     verb: 'locked in',  band: 'mid' },
  curious:     { display: 'Curious',     verb: 'seeking',    band: 'mid' },
  cloudy:      { display: 'Cloudy',      verb: 'fogged',     band: 'mid' },
  // Low energy
  peaceful:    { display: 'Peaceful',    verb: 'settled',    band: 'low' },
  grounded:    { display: 'Grounded',    verb: 'rooted',     band: 'low' },
  tender:      { display: 'Tender',      verb: 'soft',       band: 'low' },
  melancholic: { display: 'Melancholic', verb: 'tender-sad', band: 'low' },
  drained:     { display: 'Drained',     verb: 'spent',      band: 'low' },
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
