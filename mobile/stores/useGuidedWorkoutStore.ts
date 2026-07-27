import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildGuidedWorkoutSteps, secondsRemaining, type GuidedWorkoutStep } from '@/lib/guidedWorkout';
import type { WorkoutCategory, WorkoutSession } from '@/lib/workoutPlanning';

export type ActiveGuidedWorkout = {
  id: string;
  planId?: string;
  session: WorkoutSession;
  category: WorkoutCategory;
  steps: GuidedWorkoutStep[];
  currentStepIndex: number;
  status: 'active' | 'finished';
  isPaused: boolean;
  remainingSeconds: number;
  stepEndsAt: number | null;
  activeSeconds: number;
  activeSince: number | null;
  startedAt: string;
  finishedAt?: string;
  loggedAt?: string;
  skippedStepIds: string[];
};

type GuidedWorkoutState = {
  active: ActiveGuidedWorkout | null;
  startWorkout: (input: { planId?: string; session: WorkoutSession; category: WorkoutCategory }) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  nextStep: (skipped?: boolean) => void;
  previousStep: () => void;
  markLogged: () => void;
  clearWorkout: () => void;
};

export const useGuidedWorkoutStore = create<GuidedWorkoutState>()(
  persist(
    (set) => ({
      active: null,
      startWorkout: ({ planId, session, category }) => set({ active: createActiveWorkout(planId, session, category) }),
      pauseWorkout: () => set((state) => {
        if (!state.active || state.active.isPaused || state.active.status !== 'active') return state;
        const activeSeconds = (state.active.activeSeconds ?? 0) + elapsedSince(state.active.activeSince ?? null);
        return { active: { ...state.active, isPaused: true, remainingSeconds: secondsRemaining(state.active.stepEndsAt, state.active.remainingSeconds), stepEndsAt: null, activeSeconds, activeSince: null } };
      }),
      resumeWorkout: () => set((state) => {
        if (!state.active || !state.active.isPaused || state.active.status !== 'active') return state;
        const current = state.active.steps[state.active.currentStepIndex];
        return { active: { ...state.active, isPaused: false, stepEndsAt: current?.mode === 'timer' ? Date.now() + state.active.remainingSeconds * 1000 : null, activeSince: Date.now() } };
      }),
      nextStep: (skipped = false) => set((state) => moveStep(state, 1, skipped)),
      previousStep: () => set((state) => moveStep(state, -1, false)),
      markLogged: () => set((state) => state.active ? { active: { ...state.active, loggedAt: new Date().toISOString() } } : state),
      clearWorkout: () => set({ active: null }),
    }),
    { name: 'luminary.guided-workout.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

function createActiveWorkout(planId: string | undefined, session: WorkoutSession, category: WorkoutCategory): ActiveGuidedWorkout {
  const steps = buildGuidedWorkoutSteps(session);
  const first = steps[0];
  const remainingSeconds = first?.durationSeconds ?? 0;
  return {
    id: `guided_${session.id}_${Date.now()}`,
    ...(planId ? { planId } : {}),
    session,
    category,
    steps,
    currentStepIndex: 0,
    status: 'active',
    isPaused: false,
    remainingSeconds,
    stepEndsAt: first?.mode === 'timer' ? Date.now() + remainingSeconds * 1000 : null,
    activeSeconds: 0,
    activeSince: Date.now(),
    startedAt: new Date().toISOString(),
    skippedStepIds: [],
  };
}

function moveStep(state: GuidedWorkoutState, direction: 1 | -1, skipped: boolean): Partial<GuidedWorkoutState> {
  const active = state.active;
  if (!active || active.status !== 'active') return state;
  const nextIndex = active.currentStepIndex + direction;
  const skippedStepIds = skipped
    ? [...new Set([...active.skippedStepIds, active.steps[active.currentStepIndex]?.id].filter((id): id is string => !!id))]
    : active.skippedStepIds;
  const activeSeconds = (active.activeSeconds ?? 0) + elapsedSince(active.activeSince ?? null);
  if (nextIndex >= active.steps.length) {
    return { active: { ...active, status: 'finished', currentStepIndex: active.steps.length, isPaused: false, remainingSeconds: 0, stepEndsAt: null, activeSeconds, activeSince: null, finishedAt: new Date().toISOString(), skippedStepIds } };
  }
  const boundedIndex = Math.max(0, nextIndex);
  const next = active.steps[boundedIndex];
  const remainingSeconds = next?.durationSeconds ?? 0;
  return {
    active: {
      ...active,
      currentStepIndex: boundedIndex,
      isPaused: false,
      remainingSeconds,
      stepEndsAt: next?.mode === 'timer' ? Date.now() + remainingSeconds * 1000 : null,
      activeSeconds,
      activeSince: Date.now(),
      skippedStepIds,
    },
  };
}

function elapsedSince(value: number | null) {
  return value == null ? 0 : Math.max(0, Math.floor((Date.now() - value) / 1000));
}
