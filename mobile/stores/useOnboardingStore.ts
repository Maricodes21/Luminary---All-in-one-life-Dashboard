/**
 * Onboarding store — accumulates answers across all 10 steps before the
 * final Supabase write. Nothing is persisted to the DB until the Ready
 * screen calls commitOnboarding().
 *
 * Shape is Zod-validated at the commit boundary. Individual setters accept
 * loose types so screens can write partial state without type gymnastics.
 */

import { create } from 'zustand';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

// ─── Zod schema — the final committed shape ───────────────────────────────────

export const onboardingSchema = z.object({
  // Screen 3 — Profile
  displayName: z.string().min(1, 'We need something to call you.'),
  pronouns: z.string().optional(),

  // Screen 5 — Body (optional)
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),

  // Screen 6 — Workout
  workoutPreference: z.enum(['gym', 'home']),

  // Screen 7 — Goals (1–5 selected)
  goals: z.array(z.string()).min(1).max(5),

  // Screen 8 — Habits (min 3 names)
  habitNames: z.array(z.string().min(1)).min(3),

  // Screen 9 — Personality tone
  toneProfile: z.enum(['coach_hard', 'gentle_nudges', 'just_data']),

  // Spotify (screen 4) — stored via expo-secure-store separately;
  // we just track whether the user connected.
  spotifyConnected: z.boolean(),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

// ─── Store types ──────────────────────────────────────────────────────────────

type OnboardingStore = Partial<OnboardingData> & {
  setDisplayName: (v: string) => void;
  setPronouns: (v: string | undefined) => void;
  setWeight: (v: number | undefined) => void;
  setHeight: (v: number | undefined) => void;
  setWorkoutPreference: (v: 'gym' | 'home') => void;
  setGoals: (v: string[]) => void;
  setHabitNames: (v: string[]) => void;
  setToneProfile: (v: 'coach_hard' | 'gentle_nudges' | 'just_data') => void;
  setSpotifyConnected: (v: boolean) => void;
  /** Validate + write to Supabase. Throws on validation or DB error. */
  commitOnboarding: () => Promise<void>;
};

// ─── Default habit suggestions keyed by goal ─────────────────────────────────

export const GOAL_OPTIONS = [
  'Sleep better',
  'Move more',
  'Manage my money',
  'Be more mindful',
  'Read more',
  'Drink more water',
  'Reduce screen time',
  'Cook at home',
  'Journal regularly',
  'Build a workout habit',
] as const;

export const HABIT_SUGGESTIONS: Record<string, string[]> = {
  'Sleep better':        ['Wind down by 10 PM', 'No screens 30 min before bed', 'Morning light'],
  'Move more':           ['10 min walk', 'Stretch', 'Take the stairs'],
  'Manage my money':     ['Log one expense', 'Check my balance', 'No impulse buys today'],
  'Be more mindful':     ['2 minutes of stillness', 'One conscious breath', 'Put the phone down'],
  'Read more':           ['10 pages before sleep', 'Carry a book', 'Read instead of scroll'],
  'Drink more water':    ['Glass of water on waking', 'Water before coffee', 'Refill by noon'],
  'Reduce screen time':  ['Phone off at dinner', 'App timer on', 'Greyscale evenings'],
  'Cook at home':        ['Plan tomorrow\'s meal', 'Prep something tonight', 'No delivery today'],
  'Journal regularly':   ['One sentence tonight', 'Morning brain dump', 'Weekly review'],
  'Build a workout habit': ['3 workouts this week', 'Pack gym bag tonight', 'Move for 20 min'],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Sensible defaults so screens don't crash on first render.
  workoutPreference: undefined,
  goals: [],
  habitNames: [],
  toneProfile: 'gentle_nudges',
  spotifyConnected: false,

  setDisplayName: (displayName) => set({ displayName }),
  setPronouns: (pronouns) => set({ pronouns }),
  setWeight: (weightKg) => set({ weightKg }),
  setHeight: (heightCm) => set({ heightCm }),
  setWorkoutPreference: (workoutPreference) => set({ workoutPreference }),
  setGoals: (goals) => set({ goals }),
  setHabitNames: (habitNames) => set({ habitNames }),
  setToneProfile: (toneProfile) => set({ toneProfile }),
  setSpotifyConnected: (spotifyConnected) => set({ spotifyConnected }),

  commitOnboarding: async () => {
    const state = get();
    const parsed = onboardingSchema.safeParse(state);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      throw new Error(first?.message ?? 'Something looks incomplete.');
    }

    const data = parsed.data;
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('No authenticated user.');

    // Upsert profile.
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: userId,
      display_name: data.displayName,
      pronouns: data.pronouns ?? null,
      weight_kg: data.weightKg ?? null,
      height_cm: data.heightCm ?? null,
      workout_preference: data.workoutPreference,
      goals: data.goals,
      tone_profile: data.toneProfile,
      onboarding_complete: true,
    });
    if (profileError) throw new Error(profileError.message);

    // Insert initial habits.
    const habitRows = data.habitNames.map((name, i) => ({
      user_id: userId,
      name,
      position: i,
    }));
    const { error: habitsError } = await supabase.from('habits').insert(habitRows);
    if (habitsError) throw new Error(habitsError.message);
  },
}));
