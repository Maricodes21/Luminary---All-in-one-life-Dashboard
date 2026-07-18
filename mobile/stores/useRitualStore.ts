/**
 * Ritual store — ephemeral state for tonight's check-in flow.
 *
 * This is intentionally NOT persisted. The ritual is a moment in time. Once
 * complete, derived data lives in Supabase (mood_events, habit_completions,
 * spotify_snapshots). Re-opening the ritual mid-flow is fine, but state resets
 * once the user closes the modal.
 *
 * recap uses a three-value sentinel:
 *   undefined  = not yet fetched (loading)
 *   null       = fetched but user hasn't listened today (empty state)
 *   SpotifyRecap = fetched with data
 */
import { create } from 'zustand';
import type { MoodLabel, MoodSource } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

export type RitualStage = 'recap' | 'mood' | 'journal' | 'habits' | 'summary';

export type RitualState = {
  stage: RitualStage;
  recap: SpotifyRecap | null | undefined;
  mood: { label: MoodLabel; source: MoodSource; confidence: number } | null;
  moodEventId: string | null;
  journalText: string;
  journalTags: string[];
  habitsCompleted: string[];
  totalHabits: number;
  setStage: (s: RitualStage) => void;
  setRecap: (r: SpotifyRecap | null) => void;
  clearRecap: () => void;
  setMood: (m: { label: MoodLabel; source: MoodSource; confidence: number } | null) => void;
  setMoodEventId: (id: string | null) => void;
  setJournalText: (text: string) => void;
  setJournalTags: (tags: string[]) => void;
  toggleHabit: (id: string) => void;
  setTotalHabits: (n: number) => void;
  reset: () => void;
};

export const useRitualStore = create<RitualState>((set) => ({
  stage: 'recap',
  recap: undefined,
  mood: null,
  moodEventId: null,
  journalText: '',
  journalTags: [],
  habitsCompleted: [],
  totalHabits: 0,
  setStage: (stage) => set({ stage }),
  setRecap: (recap) => set({ recap }),
  clearRecap: () => set({ recap: undefined }),
  setMood: (mood) => set({ mood }),
  setMoodEventId: (moodEventId) => set({ moodEventId }),
  setJournalText: (journalText) => set({ journalText }),
  setJournalTags: (journalTags) => set({ journalTags }),
  toggleHabit: (id) =>
    set((s) => ({
      habitsCompleted: s.habitsCompleted.includes(id)
        ? s.habitsCompleted.filter((h) => h !== id)
        : [...s.habitsCompleted, id],
    })),
  setTotalHabits: (totalHabits) => set({ totalHabits }),
  reset: () =>
    set({
      stage: 'recap',
      recap: undefined,
      mood: null,
      moodEventId: null,
      journalText: '',
      journalTags: [],
      habitsCompleted: [],
      totalHabits: 0,
    }),
}));
