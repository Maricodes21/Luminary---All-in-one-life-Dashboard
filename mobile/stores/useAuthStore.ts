/**
 * Auth store — Supabase session mirror + onboarding flag.
 *
 * Supabase already persists the session via AsyncStorage. This store keeps a
 * subscribed copy in memory for fast UI reads + the "is onboarding complete?"
 * flag we use to gate the (tabs) routes.
 */
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export type AuthState = {
  session: Session | null;
  user: User | null;
  onboardingComplete: boolean;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  onboardingComplete: false,
  hydrated: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
