/**
 * Ritual store — ephemeral state for tonight's check-in flow.
 *
 * This is intentionally NOT persisted. The ritual is a moment in time. Once
 * complete, derived data lives in Supabase (mood_entries, habit_completions,
 * spotify_snapshots). Re-opening the ritual mid-flow is fine, but state resets
 * once the user closes the modal.
 */
import { create } from 'zustand';
import type { MoodLabel, MoodSource } from '@/lib/mood';

export type RitualStage = 'recap' | 'mood' | 'journal' | 'habits' | 'summary';

export type RitualState = {
  stage: RitualStage;
  mood: { label: MoodLabel; source: MoodSource } | null;
  journalText: string;
  habitsCompleted: string[]; // habit ids
  setStage: (s: RitualStage) => void;
  setMood: (m: { label: MoodLabel; source: MoodSource } | null) => void;
  setJournalText: (text: string) => void;
  toggleHabit: (id: string) => void;
  reset: () => void;
};

export const useRitualStore = create<RitualState>((set) => ({
  stage: 'recap',
  mood: null,
  journalText: '',
  habitsCompleted: [],
  setStage: (stage) => set({ stage }),
  setMood: (mood) => set({ mood }),
  setJournalText: (journalText) => set({ journalText }),
  toggleHabit: (id) =>
    set((s) => ({
      habitsCompleted: s.habitsCompleted.includes(id)
        ? s.habitsCompleted.filter((h) => h !== id)
        : [...s.habitsCompleted, id],
    })),
  reset: () =>
    set({
      stage: 'recap',
      mood: null,
      journalText: '',
      habitsCompleted: [],
    }),
}));
