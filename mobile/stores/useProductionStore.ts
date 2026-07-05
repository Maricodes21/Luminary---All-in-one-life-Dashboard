import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BodyProfile } from '@/lib/nutrition';
import { parseExpenseNotification } from '@/lib/expenseNotifications';
import { buildMealPlanWeek, buildWorkoutDays } from '@/lib/planning';

type SyncAction = 'create' | 'update' | 'delete';
type SyncEntity =
  | 'habit'
  | 'journal'
  | 'meal'
  | 'meal_plan'
  | 'workout'
  | 'workout_plan'
  | 'expense'
  | 'budget'
  | 'saving_goal'
  | 'expense_prompt'
  | 'profile_settings';

export type SyncQueueItem = {
  id: string;
  entity: SyncEntity;
  action: SyncAction;
  payload: unknown;
  createdAt: string;
};

export type Habit = {
  id: string;
  name: string;
  position: number;
  archivedAt?: string;
  completedOn: string[];
};

export type LocalJournalEntry = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  writtenAt: string;
  deletedAt?: string;
};

export type MealLog = {
  id: string;
  name: string;
  mealDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  prep: string;
  source?: 'manual' | 'curated' | 'usda' | 'open_food_facts' | 'themealdb';
  providerId?: string;
  ingredients?: string[];
  allergens?: string[];
};

export type MealPlanDay = {
  id: string;
  day: string;
  breakfast: MealPlanSlot;
  lunch: MealPlanSlot;
  dinner: MealPlanSlot;
  snacks: MealPlanSlot[];
  prep: string;
};

export type MealPlanSlot = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  note: string;
  recipeId: string;
  imageUrl: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: 'Easy' | 'Steady' | 'Prep';
  servings: number;
  substitutions?: string[];
  prepSteps?: string[];
};

export type WorkoutPlan = {
  id: string;
  weekOf: string;
  category: 'calisthenics' | 'cardio' | 'cycling' | 'gym';
  level: 'beginner' | 'steady' | 'advanced';
  days: string[];
  createdAt: string;
};

export type LocalWorkoutLog = {
  id: string;
  workoutDate: string;
  workoutType: WorkoutPlan['category'];
  title: string;
  durationMinutes: number;
  notes?: string;
};

export type ProfileSettings = {
  displayName: string;
  toneProfile: 'gentle' | 'direct' | 'coach' | 'minimal';
  reminderHour: number;
  reminderMinute: number;
  privacyMode: boolean;
  metricUnits: boolean;
};

export type ExpenseCategory = 'Needs' | 'Wants' | 'Savings' | 'Emergencies';

export type Expense = {
  id: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  transactionDate: string;
  note?: string;
  source: 'manual' | 'notification';
};

export type Budget = {
  id: string;
  category: ExpenseCategory;
  limit: number;
};

export type SavingGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};

export type ExpensePrompt = {
  id: string;
  merchant: string;
  amount: number | null;
  sourceApp: string;
  receivedAt: string;
  rawTextPreview: string;
  confidence: number;
  status: 'pending' | 'logged' | 'dismissed';
};

type ProductionState = {
  profileSettings: ProfileSettings;
  bodyProfile: BodyProfile;
  habits: Habit[];
  journalEntries: LocalJournalEntry[];
  meals: MealLog[];
  mealPlan: MealPlanDay[];
  workoutPlans: WorkoutPlan[];
  workoutLogs: LocalWorkoutLog[];
  expenses: Expense[];
  budgets: Budget[];
  monthlyIncome: number;
  monthlyBudget: number;
  savingGoals: SavingGoal[];
  expensePrompts: ExpensePrompt[];
  syncQueue: SyncQueueItem[];
  updateProfileSettings: (settings: Partial<ProfileSettings>) => void;
  addHabit: (name: string) => void;
  updateHabit: (id: string, name: string) => void;
  archiveHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  addJournalEntry: (body: string, title?: string, tags?: string[]) => void;
  deleteJournalEntry: (id: string) => void;
  updateBodyProfile: (profile: Partial<BodyProfile>) => void;
  addMeal: (meal: Omit<MealLog, 'id' | 'mealDate'> & { mealDate?: string }) => void;
  deleteMeal: (id: string) => void;
  generateMealPlan: () => void;
  deleteMealPlanDay: (id: string) => void;
  clearMealPlan: () => void;
  createWorkoutPlan: (category: WorkoutPlan['category'], level: WorkoutPlan['level']) => void;
  completeWorkout: (workout: Omit<LocalWorkoutLog, 'id' | 'workoutDate'> & { workoutDate?: string }) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'transactionDate' | 'source'> & Partial<Pick<Expense, 'transactionDate' | 'source'>>) => void;
  addBudget: (category: ExpenseCategory, limit: number) => void;
  updateBudget: (category: ExpenseCategory, limit: number) => void;
  updateMonthlyPlan: (income: number, monthlyBudget: number) => void;
  addSavingGoal: (name: string, targetAmount: number) => void;
  contributeToSavingGoal: (id: string, amount: number) => void;
  addExpensePromptFromNotification: (sourceApp: string, rawText: string) => void;
  dismissExpensePrompt: (id: string) => void;
  logExpensePrompt: (id: string, category: ExpenseCategory) => void;
  clearSyncedItem: (id: string) => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function enqueue(entity: SyncEntity, action: SyncAction, payload: unknown): SyncQueueItem {
  return { id: id('sync'), entity, action, payload, createdAt: now() };
}

export const useProductionStore = create<ProductionState>()(
  persist(
    (set, get) => ({
      profileSettings: {
        displayName: 'Mari',
        toneProfile: 'gentle',
        reminderHour: 21,
        reminderMinute: 0,
        privacyMode: true,
        metricUnits: true,
      },
      bodyProfile: {
        weightKg: 75,
        heightCm: 175,
        age: 28,
        sex: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
      },
      habits: [
        { id: 'habit_water', name: 'Water before bed', position: 0, completedOn: [] },
        { id: 'habit_read', name: 'Read ten pages', position: 1, completedOn: [] },
        { id: 'habit_reset', name: 'Reset the room', position: 2, completedOn: [] },
      ],
      journalEntries: [],
      meals: [],
      mealPlan: [],
      workoutPlans: [],
      workoutLogs: [],
      expenses: [],
      monthlyIncome: 30000,
      monthlyBudget: 23000,
      budgets: [
        { id: 'budget_needs', category: 'Needs', limit: 12000 },
        { id: 'budget_wants', category: 'Wants', limit: 3500 },
        { id: 'budget_savings', category: 'Savings', limit: 6000 },
        { id: 'budget_emergencies', category: 'Emergencies', limit: 1500 },
      ],
      savingGoals: [],
      expensePrompts: [],
      syncQueue: [],
      updateProfileSettings: (settings) =>
        set((state) => {
          const profileSettings = { ...state.profileSettings, ...settings };
          return {
            profileSettings,
            syncQueue: [...state.syncQueue, enqueue('profile_settings', 'update', profileSettings)],
          };
        }),
      addHabit: (name) =>
        set((state) => {
          const habit = { id: id('habit'), name: name.trim(), position: state.habits.length, completedOn: [] };
          return { habits: [...state.habits, habit], syncQueue: [...state.syncQueue, enqueue('habit', 'create', habit)] };
        }),
      updateHabit: (habitId, name) =>
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, name: name.trim() } : habit)),
          syncQueue: [...state.syncQueue, enqueue('habit', 'update', { id: habitId, name })],
        })),
      archiveHabit: (habitId) =>
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, archivedAt: now() } : habit)),
          syncQueue: [...state.syncQueue, enqueue('habit', 'delete', { id: habitId })],
        })),
      toggleHabitCompletion: (habitId, date) =>
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== habitId) return habit;
            const completedOn = habit.completedOn.includes(date)
              ? habit.completedOn.filter((value) => value !== date)
              : [...habit.completedOn, date];
            return { ...habit, completedOn };
          }),
          syncQueue: [...state.syncQueue, enqueue('habit', 'update', { id: habitId, completedOn: date })],
        })),
      addJournalEntry: (body, title = '', tags = []) =>
        set((state) => {
          const entry = { id: id('journal'), title, body, tags, writtenAt: now() };
          return {
            journalEntries: [entry, ...state.journalEntries],
            syncQueue: [...state.syncQueue, enqueue('journal', 'create', entry)],
          };
        }),
      deleteJournalEntry: (entryId) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((entry) =>
            entry.id === entryId ? { ...entry, deletedAt: now() } : entry,
          ),
          syncQueue: [...state.syncQueue, enqueue('journal', 'delete', { id: entryId })],
        })),
      updateBodyProfile: (profile) => set((state) => ({ bodyProfile: { ...state.bodyProfile, ...profile } })),
      addMeal: (meal) =>
        set((state) => {
          const item = { ...meal, id: id('meal'), mealDate: meal.mealDate ?? today() };
          return { meals: [item, ...state.meals], syncQueue: [...state.syncQueue, enqueue('meal', 'create', item)] };
        }),
      deleteMeal: (mealId) =>
        set((state) => ({
          meals: state.meals.filter((meal) => meal.id !== mealId),
          syncQueue: [...state.syncQueue, enqueue('meal', 'delete', { id: mealId })],
        })),
      generateMealPlan: () =>
        set((state) => {
          const mealPlan = buildMealPlanWeek(state.bodyProfile.goal, today()).map((planDay, index) => {
            const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
            return {
              id: `plan_${day.toLowerCase()}`,
              day,
              ...planDay,
            };
          });
          return {
            mealPlan,
            syncQueue: [...state.syncQueue, enqueue('meal_plan', 'create', { weekOf: today(), days: mealPlan })],
          };
        }),
      deleteMealPlanDay: (planDayId) =>
        set((state) => ({
          mealPlan: state.mealPlan.filter((day) => day.id !== planDayId),
          syncQueue: [...state.syncQueue, enqueue('meal_plan', 'delete', { id: planDayId })],
        })),
      clearMealPlan: () =>
        set((state) => ({
          mealPlan: [],
          syncQueue: [...state.syncQueue, enqueue('meal_plan', 'delete', { weekOf: today(), ids: state.mealPlan.map((day) => day.id) })],
        })),
      createWorkoutPlan: (category, level) =>
        set((state) => {
          const plan = {
            id: id('workout'),
            weekOf: today(),
            category,
            level,
            days: buildWorkoutDays(category, level, today()),
            createdAt: now(),
          };
          return {
            workoutPlans: [plan, ...state.workoutPlans],
            syncQueue: [...state.syncQueue, enqueue('workout_plan', 'create', plan)],
          };
        }),
      completeWorkout: (workout) =>
        set((state) => {
          const item = {
            ...workout,
            id: id('workout_log'),
            workoutDate: workout.workoutDate ?? today(),
          };
          return {
            workoutLogs: [item, ...state.workoutLogs],
            syncQueue: [...state.syncQueue, enqueue('workout', 'create', item)],
          };
        }),
      addExpense: (expense) =>
        set((state) => {
          const item = {
            ...expense,
            id: id('expense'),
            transactionDate: expense.transactionDate ?? today(),
            source: expense.source ?? 'manual',
          };
          return {
            expenses: [item, ...state.expenses],
            syncQueue: [...state.syncQueue, enqueue('expense', 'create', item)],
          };
        }),
      addBudget: (category, limit) =>
        set((state) => {
          const item = { id: id('budget'), category, limit };
          return { budgets: [...state.budgets, item], syncQueue: [...state.syncQueue, enqueue('budget', 'create', item)] };
        }),
      updateBudget: (category, limit) =>
        set((state) => {
          const existing = state.budgets.find((budget) => budget.category === category);
          const budgets = existing
            ? state.budgets.map((budget) => (budget.category === category ? { ...budget, limit } : budget))
            : [...state.budgets, { id: id('budget'), category, limit }];
          return { budgets, syncQueue: [...state.syncQueue, enqueue('budget', existing ? 'update' : 'create', { category, limit })] };
        }),
      updateMonthlyPlan: (monthlyIncome, monthlyBudget) =>
        set((state) => ({
          monthlyIncome,
          monthlyBudget,
          syncQueue: [...state.syncQueue, enqueue('budget', 'update', { monthlyIncome, monthlyBudget })],
        })),
      addSavingGoal: (name, targetAmount) =>
        set((state) => {
          const item = { id: id('goal'), name, targetAmount, currentAmount: 0 };
          return {
            savingGoals: [...state.savingGoals, item],
            syncQueue: [...state.syncQueue, enqueue('saving_goal', 'create', item)],
          };
        }),
      contributeToSavingGoal: (goalId, amount) =>
        set((state) => ({
          savingGoals: state.savingGoals.map((goal) =>
            goal.id === goalId ? { ...goal, currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount) } : goal,
          ),
          syncQueue: [...state.syncQueue, enqueue('saving_goal', 'update', { id: goalId, contribution: amount })],
        })),
      addExpensePromptFromNotification: (sourceApp, rawText) =>
        set((state) => {
          const parsed = parseExpenseNotification(rawText);
          const prompt = {
            id: id('prompt'),
            merchant: parsed.merchant,
            amount: parsed.amount,
            sourceApp,
            receivedAt: now(),
            rawTextPreview: rawText.slice(0, 140),
            confidence: parsed.confidence,
            status: 'pending' as const,
          };
          return {
            expensePrompts: [prompt, ...state.expensePrompts],
            syncQueue: [...state.syncQueue, enqueue('expense_prompt', 'create', prompt)],
          };
        }),
      dismissExpensePrompt: (promptId) =>
        set((state) => ({
          expensePrompts: state.expensePrompts.map((prompt) =>
            prompt.id === promptId ? { ...prompt, status: 'dismissed' } : prompt,
          ),
        })),
      logExpensePrompt: (promptId, category) => {
        const prompt = get().expensePrompts.find((item) => item.id === promptId);
        if (!prompt || !prompt.amount) return;
        get().addExpense({
          merchant: prompt.merchant,
          amount: prompt.amount,
          category,
          source: 'notification',
          transactionDate: prompt.receivedAt.slice(0, 10),
          note: `Suggested from ${prompt.sourceApp}`,
        });
        set((state) => ({
          expensePrompts: state.expensePrompts.map((item) =>
            item.id === promptId ? { ...item, status: 'logged' } : item,
          ),
        }));
      },
      clearSyncedItem: (syncId) =>
        set((state) => ({ syncQueue: state.syncQueue.filter((item) => item.id !== syncId) })),
    }),
    {
      name: 'luminary.production.store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profileSettings: state.profileSettings,
        bodyProfile: state.bodyProfile,
        habits: state.habits,
        journalEntries: state.journalEntries,
        meals: state.meals,
        mealPlan: state.mealPlan,
        workoutPlans: state.workoutPlans,
        workoutLogs: state.workoutLogs,
        expenses: state.expenses,
        budgets: state.budgets,
        monthlyIncome: state.monthlyIncome,
        monthlyBudget: state.monthlyBudget,
        savingGoals: state.savingGoals,
        expensePrompts: state.expensePrompts,
        syncQueue: state.syncQueue,
      }),
    },
  ),
);
