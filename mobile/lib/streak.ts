/**
 * Soft Streak — Luminary's anti-anxiety habit consistency model.
 *
 * Traditional streaks (miss-a-day-and-die) cause anxiety and abandonment.
 * Luminary uses a sliding-window "consistency band":
 *   Bronze:  ≥ 3 of the last 7 days
 *   Silver:  ≥ 5 of the last 7 days
 *   Gold:    ≥ 6 of the last 7 days
 *   None:    < 3
 *
 * The band is calculated continuously; missing a day shifts the window but
 * doesn't reset to zero. This keeps the user encouraged through life's chop.
 */

export type StreakBand = 'none' | 'bronze' | 'silver' | 'gold';

export type StreakWindow = {
  band: StreakBand;
  daysHit: number;
  windowSize: 7;
  /** Today (ISO date YYYY-MM-DD) the calculation was anchored on. */
  asOf: string;
};

export type CompletionRecord = { date: string /* YYYY-MM-DD */ };

export function calculateBand(completions: CompletionRecord[], asOf: Date = new Date()): StreakWindow {
  const windowSize = 7 as const;
  const dates = new Set(completions.map((c) => c.date));

  let daysHit = 0;
  for (let i = 0; i < windowSize; i += 1) {
    const d = new Date(asOf);
    d.setDate(d.getDate() - i);
    if (dates.has(toIso(d))) daysHit += 1;
  }

  let band: StreakBand = 'none';
  if (daysHit >= 6) band = 'gold';
  else if (daysHit >= 5) band = 'silver';
  else if (daysHit >= 3) band = 'bronze';

  return { band, daysHit, windowSize, asOf: toIso(asOf) };
}

export function bandCopy(band: StreakBand, daysHit: number): string {
  switch (band) {
    case 'gold':
      return `${daysHit} of 7 this week. The shape is holding.`;
    case 'silver':
      return `${daysHit} of 7 this week. That counts.`;
    case 'bronze':
      return `${daysHit} of 7 this week. The rhythm's starting.`;
    case 'none':
    default:
      return "Tomorrow's a clean slate.";
  }
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
