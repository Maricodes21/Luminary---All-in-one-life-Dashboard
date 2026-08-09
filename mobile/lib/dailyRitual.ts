import type { MoodLabel } from '@/lib/mood';
import { generateDailySignals } from './dailySignals';

export type DailyRitualStatus = 'not_started' | 'in_progress' | 'completed';

export type DailyRitualStage =
  | 'entry'
  | 'music'
  | 'mood'
  | 'journal'
  | 'habits'
  | 'context'
  | 'tomorrow'
  | 'summary';

export type DailyRitualSession = {
  id: string;
  localDate: string;
  status: DailyRitualStatus;
  currentStage: DailyRitualStage;
  startedAt: string | null;
  completedAt: string | null;
  mood: MoodLabel | null;
  moodSkipped: boolean;
  journalAdded: boolean;
  selectedSignalIds: string[];
  summary: {
    habitsCompleted: number;
    totalHabits: number;
    movementMinutes: number;
    musicMinutes: number;
    tomorrowCue: string;
  } | null;
};

export type RitualSignal = {
  id: string;
  kind: 'meals' | 'health' | 'money';
  title: string;
  detail: string;
  action: string;
  route: '/(tabs)/meals' | '/(tabs)/health' | '/(tabs)/money';
  priority: number;
  imageUrl?: string;
};

export type DailySignalInput = {
  now: Date;
  loggedMealTypes: string[];
  purchaseCount: number;
  workoutPlanned: boolean;
  workoutCompleted: boolean;
  workoutLabel?: string;
};

export function createDailyRitualSession(localDate: string): DailyRitualSession {
  return {
    id: `ritual-${localDate}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    localDate,
    status: 'not_started',
    currentStage: 'entry',
    startedAt: null,
    completedAt: null,
    mood: null,
    moodSkipped: false,
    journalAdded: false,
    selectedSignalIds: [],
    summary: null,
  };
}

export function expectedMealForTime(now: Date): 'breakfast' | 'lunch' | 'dinner' {
  const hour = now.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  return 'dinner';
}
/** Compatibility adapter for module cards while Home migrates to the full shared context. */
export function selectDailyRitualSignals(input: DailySignalInput): RitualSignal[] {
  return generateDailySignals({
    now: input.now,
    habits: [],
    loggedMealTypes: input.loggedMealTypes,
    purchaseCount: input.purchaseCount,
    workout: {
      planned: input.workoutPlanned,
      completed: input.workoutCompleted,
      title: input.workoutLabel,
    },
    journal: { entryCount: 0 },
    ritual: { status: 'completed' },
    music: { connected: true, recapAvailable: false },
  })
    .filter(
      (
        signal,
      ): signal is typeof signal & { source: RitualSignal['kind']; route: RitualSignal['route'] } =>
        ['meals', 'health', 'money'].includes(signal.source) &&
        ((signal.family.startsWith('meal-') && signal.family !== 'meal-complete') ||
          signal.family === 'workout-due' ||
          signal.family === 'money-log' ||
          signal.family === 'money-pending'),
    )
    .map((signal) => ({
      id: signal.id,
      kind: signal.source,
      title: signal.title,
      detail: signal.detail,
      action: signal.action,
      route: signal.route,
      priority: signal.priority,
      imageUrl: signal.imageUrl,
    }));
}

export function isRitualCompletedForDate(session: DailyRitualSession, localDate: string): boolean {
  return session.localDate === localDate && session.status === 'completed';
}

export function formatHomeDate(now: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
}
