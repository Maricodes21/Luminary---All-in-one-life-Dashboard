import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OnboardingStatus } from './authRouting';

const CACHE_PREFIX = 'luminary.auth.onboarding-status.v1';

export async function loadCachedOnboardingStatus(userId: string): Promise<Exclude<OnboardingStatus, 'unknown'> | null> {
  const value = await AsyncStorage.getItem(`${CACHE_PREFIX}.${userId}`);
  return value === 'complete' || value === 'incomplete' ? value : null;
}

export async function saveCachedOnboardingStatus(userId: string, status: Exclude<OnboardingStatus, 'unknown'>): Promise<void> {
  await AsyncStorage.setItem(`${CACHE_PREFIX}.${userId}`, status);
}
