/**
 * Shared types. Schema-shaped types live next to their store/lib of use; this
 * file is for cross-cutting types only.
 */

export type ToneProfile = 'coach_hard' | 'gentle_nudges' | 'just_data';

export type ModuleKey = 'home' | 'journal' | 'health' | 'money' | 'habits' | 'meals';

export type UserPreferences = {
  toneProfile: ToneProfile;
  workoutPreference: 'gym' | 'home' | null;
  goals: string[];
  /** Which optional modules the user has unlocked. Health/Money/Meals start locked. */
  unlockedModules: ModuleKey[];
};
