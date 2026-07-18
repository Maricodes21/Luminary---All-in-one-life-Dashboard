export type BodyGoal = 'maintain' | 'lose' | 'gain';
export type ActivityLevel = 'low' | 'moderate' | 'high';

export type BodyProfile = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'female' | 'male';
  activityLevel: ActivityLevel;
  goal: BodyGoal;
};

const activityMultiplier: Record<ActivityLevel, number> = {
  low: 1.35,
  moderate: 1.55,
  high: 1.75,
};

const goalAdjustment: Record<BodyGoal, number> = {
  lose: -350,
  maintain: 0,
  gain: 300,
};

export function calculateMaintenanceCalories(profile: BodyProfile): number {
  const sexConstant = profile.sex === 'male' ? 5 : -161;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexConstant;
  return Math.round(bmr * activityMultiplier[profile.activityLevel]);
}

export function calculateNutritionTargets(profile: BodyProfile) {
  const maintenanceCalories = calculateMaintenanceCalories(profile);
  const calories = Math.max(1200, maintenanceCalories + goalAdjustment[profile.goal]);
  const proteinG = Math.round(profile.weightKg * (profile.goal === 'gain' ? 2 : 1.8));
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(80, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    maintenanceCalories,
    calories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function mealPrepSuggestion(goal: BodyGoal): string {
  if (goal === 'gain') return 'Batch a protein base, a dense carb, and one sauce so eating enough stays easy.';
  if (goal === 'lose') return 'Prep lean protein and high-volume sides first. Keep sauces measured but not joyless.';
  return 'Prep two flexible bases and let the details change. Consistency likes a little room.';
}
