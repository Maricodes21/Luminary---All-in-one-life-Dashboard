import type { Habit, HabitSchedule } from '@/stores/useProductionStore';

export const DEFAULT_HABIT_SCHEDULE: HabitSchedule = {
  days: [0, 1, 2, 3, 4, 5, 6],
  timeWindow: 'anytime',
  weeklyTarget: 5,
};

export function isHabitActiveOn(habit: Habit, date: string): boolean {
  if (habit.archivedAt && date >= habit.archivedAt.slice(0, 10)) return false;
  if (habit.activeFrom && date < habit.activeFrom) return false;
  if (habit.activeUntil && date > habit.activeUntil) return false;
  return true;
}

export function isHabitScheduledOn(habit: Habit, date: string): boolean {
  if (!isHabitDueOn(habit, date)) return false;
  if (habit.skippedOn?.includes(date) || habit.pausedOn?.includes(date)) return false;
  return true;
}

export function isHabitDueOn(habit: Habit, date: string): boolean {
  if (!isHabitActiveOn(habit, date)) return false;
  const schedule = habit.schedule ?? DEFAULT_HABIT_SCHEDULE;
  return schedule.days.includes(weekdayForLocalDate(date));
}

export function activeHabitsForDate(habits: Habit[], date: string): Habit[] {
  return sortHabits(habits.filter((habit) => isHabitScheduledOn(habit, date)));
}

export function scheduledHabitsForDate(habits: Habit[], date: string): Habit[] {
  return sortHabits(habits.filter((habit) => isHabitDueOn(habit, date)));
}

export function previousLocalDate(date: string): string {
  const value = localDateFromKey(date);
  value.setDate(value.getDate() - 1);
  return localDateKey(value);
}

export function nextLocalDate(date: string): string {
  const value = localDateFromKey(date);
  value.setDate(value.getDate() + 1);
  return localDateKey(value);
}

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayForLocalDate(date: string): number {
  return localDateFromKey(date).getDay();
}

function localDateFromKey(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, Math.max(0, month - 1), day, 12);
}

function timeWindowOrder(window: HabitSchedule['timeWindow'] | undefined): number {
  if (window === 'morning') return 0;
  if (window === 'day') return 1;
  if (window === 'evening') return 2;
  return 3;
}

function sortHabits(habits: Habit[]): Habit[] {
  return [...habits].sort((left, right) => {
    const windowDifference = timeWindowOrder(left.schedule?.timeWindow) - timeWindowOrder(right.schedule?.timeWindow);
    return windowDifference || left.position - right.position;
  });
}
