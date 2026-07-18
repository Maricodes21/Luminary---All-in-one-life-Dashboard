/**
 * Auth store — Supabase session mirror + onboarding flag.
 *
 * Supabase already persists the session via AsyncStorage. This store keeps a
 * subscribed copy in memory for fast UI reads + the "is onboarding complete?"
 * flag we use to gate the (tabs) routes.
 */
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { OnboardingStatus } from '@/lib/authRouting';

export type AuthState = {
  session: Session | null;
  user: User | null;
  displayName: string | null;
  onboardingComplete: boolean;
  onboardingStatus: OnboardingStatus;
  authResolving: boolean;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setDisplayName: (name: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  beginSessionResolution: (session: Session | null) => void;
  setAuthSnapshot: (session: Session | null, onboardingStatus: OnboardingStatus, displayName: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  displayName: null,
  onboardingComplete: false,
  onboardingStatus: 'unknown',
  authResolving: true,
  hydrated: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setDisplayName: (displayName) => set({ displayName }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete, onboardingStatus: onboardingComplete ? 'complete' : 'incomplete' }),
  setHydrated: (hydrated) => set({ hydrated }),
  beginSessionResolution: (session) => set({ session, user: session?.user ?? null, onboardingStatus: 'unknown', authResolving: true }),
  setAuthSnapshot: (session, onboardingStatus, displayName) => set({
    session,
    user: session?.user ?? null,
    displayName,
    onboardingStatus,
    onboardingComplete: onboardingStatus === 'complete',
    authResolving: false,
  }),
}));
