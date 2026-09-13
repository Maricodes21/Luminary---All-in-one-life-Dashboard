import { localDateKey } from './meals/dates';

export type DecisionDomain = 'meals' | 'workouts' | 'habits';
export type DecisionOutcome = 'shown' | 'accepted' | 'dismissed' | 'changed' | 'undone' | 'completed' | 'abandoned';

export type DailyDecisionContext = {
  localDate: string;
  localHour: number;
  timezone: string;
  weekStart: string;
};

export function buildDailyDecisionContext(now = new Date()): DailyDecisionContext {
  const week = new Date(now);
  const day = week.getDay();
  week.setDate(week.getDate() - ((day + 6) % 7));
  return {
    localDate: localDateKey(now),
    localHour: now.getHours(),
    timezone: safeTimezone(),
    weekStart: localDateKey(week),
  };
}

export function planContainsDate(weekOf: string | undefined, localDate: string) {
  if (!weekOf) return false;
  const start = new Date(`${weekOf}T12:00:00`);
  const target = new Date(`${localDate}T12:00:00`);
  const days = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  return days >= 0 && days < 7;
}

function safeTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}
