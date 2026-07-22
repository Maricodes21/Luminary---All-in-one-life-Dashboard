import type { MoodLabel } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

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

export type RitualSignalKind = 'meals' | 'health' | 'money';

export type RitualSignal = {
  id: string;
  kind: RitualSignalKind;
  title: string;
  detail: string;
  action: string;
  route: '/(tabs)/meals' | '/(tabs)/health' | '/(tabs)/money';
  priority: number;
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

export function selectDailyRitualSignals(input: DailySignalInput): RitualSignal[] {
  const signals: RitualSignal[] = [];
  const expectedMeal = expectedMealForTime(input.now);
  const mealLogged = input.loggedMealTypes.some((type) => type.toLowerCase() === expectedMeal);

  if (!mealLogged) {
    const label = sentenceCase(expectedMeal);
    signals.push({
      id: `meal-${expectedMeal}`,
      kind: 'meals',
      title: `${label} is still open`,
      detail: `Add ${expectedMeal} if you have eaten and have not logged it yet.`,
      action: 'Log meal',
      route: '/(tabs)/meals',
      priority: 90,
    });
  }

  if (input.workoutPlanned && !input.workoutCompleted) {
    signals.push({
      id: 'health-workout',
      kind: 'health',
      title: 'Workout still waiting',
      detail: input.workoutLabel ? `${input.workoutLabel} is planned for today.` : 'A workout is still planned for today.',
      action: 'Open workout',
      route: '/(tabs)/health',
      priority: 80,
    });
  }

  if (input.purchaseCount === 0) {
    signals.push({
      id: 'money-daily-log',
      kind: 'money',
      title: 'Anything to log?',
      detail: 'Add a purchase from today if something slipped your mind.',
      action: 'Add purchase',
      route: '/(tabs)/money',
      priority: 70,
    });
  }

  return signals.sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id)).slice(0, 3);
}

export function buildMusicEvidence(recap: SpotifyRecap): string[] {
  const leadingRepeat = recap.topTracks[0]?.playCount ?? 0;
  const evidence = [
    `${recap.minutesListened} minutes across ${recap.trackCount} plays`,
    `Energy signal ${Math.round(recap.averageFeatures.energy * 100)}%`,
    `Estimated tempo ${Math.round(recap.averageFeatures.tempo)} BPM`,
  ];
  if (leadingRepeat > 1) evidence.push(`Your top track returned ${leadingRepeat} times`);
  return evidence.slice(0, 3);
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

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
