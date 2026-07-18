import type { MealType } from './types';

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function mealWindowFor(date: Date): MealType {
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (minutes >= 5 * 60 && minutes <= 10 * 60 + 59) {
    return 'breakfast';
  }

  if (minutes >= 11 * 60 && minutes <= 15 * 60 + 59) {
    return 'lunch';
  }

  if (minutes >= 16 * 60 && minutes <= 21 * 60 + 59) {
    return 'dinner';
  }

  return 'snack';
}
