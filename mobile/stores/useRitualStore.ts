/**
 * Persisted nightly ritual state.
 *
 * A ritual is now an explicit daily session. It can be interrupted, resumed
 * offline, and completed independently of habit completion.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MoodLabel, MoodSource } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';
import {
  createDailyRitualSession,
  type DailyRitualSession,
  type DailyRitualStage,
} from '@/lib/dailyRitual';

export type RitualStage = DailyRitualStage;

type RitualSummary = NonNullable<DailyRitualSession['summary']>;

export type RitualState = {
  session: DailyRitualSession;
  stage: RitualStage;
  recap: SpotifyRecap | null | undefined;
  mood: { label: MoodLabel; source: MoodSource; confidence: number } | null;
  moodEventId: string | null;
  journalText: string;
  journalTags: string[];
  habitsCompleted: string[];
  totalHabits: number;
  hasHydrated: boolean;
  ensureSession: (localDate: string) => void;
  beginSession: (localDate: string, selectedSignalIds?: string[]) => void;
  completeSession: (summary: RitualSummary) => void;
  setStage: (stage: RitualStage) => void;
  setRecap: (recap: SpotifyRecap | null) => void;
  clearRecap: () => void;
  setMood: (mood: { label: MoodLabel; source: MoodSource; confidence: number } | null) => void;
  setMoodEventId: (id: string | null) => void;
  markMoodSkipped: () => void;
  setJournalAdded: (added: boolean) => void;
  setJournalText: (text: string) => void;
  setJournalTags: (tags: string[]) => void;
  toggleHabit: (id: string) => void;
  setHabitsCompleted: (ids: string[]) => void;
  setTotalHabits: (count: number) => void;
  resetForDate: (localDate: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

const initialDate = new Date().toISOString().slice(0, 10);

export const useRitualStore = create<RitualState>()(
  persist(
    (set, get) => ({
      session: createDailyRitualSession(initialDate),
      stage: 'entry',
      recap: undefined,
      mood: null,
      moodEventId: null,
      journalText: '',
      journalTags: [],
      habitsCompleted: [],
      totalHabits: 0,
      hasHydrated: false,
      ensureSession: (localDate) => {
        if (get().session.localDate === localDate) return;
        set(freshState(localDate));
      },
      beginSession: (localDate, selectedSignalIds = []) => {
        const current = get().session.localDate === localDate
          ? get().session
          : createDailyRitualSession(localDate);
        if (current.status === 'completed') return;
        const currentStage = current.status === 'in_progress' ? current.currentStage : 'music';
        set({
          session: {
            ...current,
            status: 'in_progress',
            currentStage,
            startedAt: current.startedAt ?? new Date().toISOString(),
            selectedSignalIds,
          },
          stage: currentStage,
        });
      },
      completeSession: (summary) =>
        set((state) => ({
          stage: 'summary',
          session: {
            ...state.session,
            status: 'completed',
            currentStage: 'summary',
            completedAt: new Date().toISOString(),
            summary,
          },
        })),
      setStage: (stage) =>
        set((state) => ({
          stage,
          session: {
            ...state.session,
            currentStage: stage,
            status: stage === 'entry' ? state.session.status : 'in_progress',
            startedAt: stage === 'entry' ? state.session.startedAt : state.session.startedAt ?? new Date().toISOString(),
          },
        })),
      setRecap: (recap) => set({ recap }),
      clearRecap: () => set({ recap: undefined }),
      setMood: (mood) =>
        set((state) => ({
          mood,
          session: { ...state.session, mood: mood?.label ?? null, moodSkipped: false },
        })),
      setMoodEventId: (moodEventId) => set({ moodEventId }),
      markMoodSkipped: () =>
        set((state) => ({
          mood: null,
          session: { ...state.session, mood: null, moodSkipped: true },
        })),
      setJournalAdded: (journalAdded) =>
        set((state) => ({ session: { ...state.session, journalAdded } })),
      setJournalText: (journalText) => set({ journalText }),
      setJournalTags: (journalTags) => set({ journalTags }),
      toggleHabit: (id) =>
        set((state) => ({
          habitsCompleted: state.habitsCompleted.includes(id)
            ? state.habitsCompleted.filter((habitId) => habitId !== id)
            : [...state.habitsCompleted, id],
        })),
      setHabitsCompleted: (habitsCompleted) => set({ habitsCompleted }),
      setTotalHabits: (totalHabits) => set({ totalHabits }),
      resetForDate: (localDate) => set(freshState(localDate)),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'luminary.daily-ritual.v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        stage: state.stage,
        recap: state.recap,
        mood: state.mood,
        moodEventId: state.moodEventId,
        journalText: state.journalText,
        journalTags: state.journalTags,
        habitsCompleted: state.habitsCompleted,
        totalHabits: state.totalHabits,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

function freshState(localDate: string) {
  return {
    session: createDailyRitualSession(localDate),
    stage: 'entry' as const,
    recap: undefined,
    mood: null,
    moodEventId: null,
    journalText: '',
    journalTags: [],
    habitsCompleted: [],
    totalHabits: 0,
  };
}
