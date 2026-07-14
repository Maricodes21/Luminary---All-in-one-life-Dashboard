import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localDateKey } from '@/lib/meals/dates';
import {
  addMealToUser,
  addPlanEntryToUser,
  addSuggestionFeedbackToUser,
  createEmptyMealsUser,
  deleteMealFromUser,
  deletePlanEntryFromUser,
  ensureDailyTarget,
  importLegacyMealsForUser,
  makeUuid,
  mergeHydratedMeals,
  mergeHydratedPlans,
  replacePlansForUser,
  undoLastMealDeletion,
  updateMealForUser,
  updateNutritionProfile,
} from '@/lib/meals/state';
import type {
  DailyNutritionTarget,
  MealLogRecord,
  MealPlan,
  MealsUserData,
  NutritionProfile,
  SuggestionFeedbackAction,
} from '@/lib/meals/types';

type MealsState = {
  activeUserId: string | null;
  users: Record<string, MealsUserData>;
  setActiveUser: (userId: string | null) => void;
  clearPrivateCache: () => void;
  hydrateUser: (userId: string, data: Partial<MealsUserData>) => void;
  importLegacyData: (userId: string, data: Pick<MealsUserData, 'meals' | 'plans'>) => void;
  updateProfile: (profile: NutritionProfile, at?: Date) => void;
  ensureTarget: (at?: Date) => void;
  addMeal: (meal: MealLogRecord) => void;
  updateMeal: (mealId: string, updates: Partial<Omit<MealLogRecord, 'id'>>) => void;
  deleteMeal: (mealId: string) => void;
  undoMealDeletion: () => void;
  recordSuggestionFeedback: (candidateId: string, action: SuggestionFeedbackAction, context?: Record<string, unknown>) => void;
  replacePlans: (plans: MealPlan[]) => void;
  addPlanEntry: (planId: string, entry: MealPlan['entries'][number]) => void;
  deletePlanEntry: (planId: string, entryId: string) => void;
  updatePlanEntry: (planId: string, entryId: string, updates: Partial<MealPlan['entries'][number]>) => void;
  deletePlanDay: (planId: string, localDate: string) => void;
  deletePlan: (planId: string) => void;
  clearPlans: () => void;
  clearSyncedMutation: (mutationId: string) => void;
};

export const useMealsStore = create<MealsState>()(
  persist(
    (set) => ({
      activeUserId: null,
      users: {},
      setActiveUser: (activeUserId) =>
        set((state) => ({
          activeUserId,
          users: activeUserId && !state.users[activeUserId]
            ? { ...state.users, [activeUserId]: createEmptyMealsUser() }
            : state.users,
        })),
      clearPrivateCache: () => set({ activeUserId: null, users: {} }),
      hydrateUser: (userId, data) =>
        set((state) => {
          const local = state.users[userId] ?? createEmptyMealsUser();
          return {
            users: {
              ...state.users,
              [userId]: {
                ...local,
                ...data,
                targets: { ...local.targets, ...(data.targets ?? {}) },
                meals: mergeHydratedMeals(data.meals ?? [], local.meals, local.syncQueue),
                plans: mergeHydratedPlans(data.plans ?? [], local.plans, local.syncQueue),
                syncQueue: local.syncQueue,
                undo: local.undo,
              },
            },
          };
        }),
      importLegacyData: (userId, data) =>
        set((state) => {
          const current = state.users[userId] ?? createEmptyMealsUser();
          return { users: { ...state.users, [userId]: importLegacyMealsForUser(current, data) } };
        }),
      updateProfile: (profile, at = new Date()) =>
        updateActive(set, (user) => updateNutritionProfile(user, profile, localDateKey(at), at)),
      ensureTarget: (at = new Date()) =>
        updateActive(set, (user) => ensureDailyTarget(user, localDateKey(at), at)),
      addMeal: (meal) => updateActive(set, (user) => addMealToUser(user, meal)),
      updateMeal: (mealId, updates) => updateActive(set, (user) => updateMealForUser(user, mealId, updates)),
      deleteMeal: (mealId) => updateActive(set, (user) => deleteMealFromUser(user, mealId)),
      undoMealDeletion: () => updateActive(set, (user) => undoLastMealDeletion(user)),
      recordSuggestionFeedback: (candidateId, action, context = {}) =>
        updateActive(set, (user) => addSuggestionFeedbackToUser(user, candidateId, action, context)),
      replacePlans: (plans) => updateActive(set, (user) => replacePlansForUser(user, plans)),
      addPlanEntry: (planId, entry) => updateActive(set, (user) => addPlanEntryToUser(user, planId, entry)),
      deletePlanEntry: (planId, entryId) => updateActive(set, (user) => deletePlanEntryFromUser(user, planId, entryId)),
      updatePlanEntry: (planId, entryId, updates) =>
        updateActive(set, (user) => {
          const plans = user.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, entries: plan.entries.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry)) }
              : plan,
          );
          const entry = plans.find((plan) => plan.id === planId)?.entries.find((item) => item.id === entryId);
          return { ...user, plans, syncQueue: entry ? [...user.syncQueue, entryMutation({ planId, entry }, 'update')] : user.syncQueue };
        }),
      deletePlanDay: (planId, localDate) =>
        updateActive(set, (user) => {
          const plans = user.plans.map((plan) =>
            plan.id === planId ? { ...plan, entries: plan.entries.filter((entry) => entry.localDate !== localDate) } : plan,
          );
          return { ...user, plans, syncQueue: [...user.syncQueue, entryMutation({ planId, localDate }, 'delete')] };
        }),
      deletePlan: (planId) =>
        updateActive(set, (user) => ({
          ...user,
          plans: user.plans.filter((plan) => plan.id !== planId),
          syncQueue: [...user.syncQueue, planMutation({ planId }, 'delete')],
        })),
      clearPlans: () =>
        updateActive(set, (user) => ({
          ...user,
          plans: [],
          syncQueue: [...user.syncQueue, planMutation({ planIds: user.plans.map((plan) => plan.id) }, 'delete')],
        })),
      clearSyncedMutation: (mutationId) =>
        updateActive(set, (user) => ({ ...user, syncQueue: user.syncQueue.filter((item) => item.id !== mutationId) })),
    }),
    {
      name: 'luminary.meals.store.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ users: state.users }),
    },
  ),
);

export function activeMealsUser(state: Pick<MealsState, 'activeUserId' | 'users'>): MealsUserData | null {
  return state.activeUserId ? state.users[state.activeUserId] ?? null : null;
}

export function activeTarget(state: Pick<MealsState, 'activeUserId' | 'users'>, localDate: string): DailyNutritionTarget | null {
  return activeMealsUser(state)?.targets[localDate] ?? null;
}

function updateActive(
  set: (updater: (state: MealsState) => Partial<MealsState>) => void,
  update: (user: MealsUserData) => MealsUserData,
) {
  set((state) => {
    if (!state.activeUserId) return state;
    const current = state.users[state.activeUserId] ?? createEmptyMealsUser();
    return { users: { ...state.users, [state.activeUserId]: update(current) } };
  });
}

function planMutation(payload: unknown, action: 'update' | 'delete') {
  const createdAt = new Date().toISOString();
  return {
    id: `mutation_${makeUuid()}`,
    entity: 'plan' as const,
    action,
    payload,
    createdAt,
  };
}

function entryMutation(payload: unknown, action: 'update' | 'delete') {
  const createdAt = new Date().toISOString();
  return { id: `mutation_${makeUuid()}`, entity: 'plan_entry' as const, action, payload, createdAt };
}
