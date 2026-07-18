export const ONBOARDING_STEPS = [
  'welcome',
  'account',
  'profile',
  'spotify',
  'body',
  'workout',
  'goals',
  'habits',
  'personality',
  'ready',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export type OnboardingStatus = 'unknown' | 'incomplete' | 'complete';

export function resolveProfileRestore(input: {
  remoteComplete: boolean | null;
  profileError: boolean;
  cachedStatus: Exclude<OnboardingStatus, 'unknown'> | null;
}): OnboardingStatus {
  if (input.profileError) return input.cachedStatus ?? 'unknown';
  return input.remoteComplete === true ? 'complete' : 'incomplete';
}

export function routeForAuthState(input: {
  hasSession: boolean;
  onboardingStatus: OnboardingStatus;
  firstSegment?: string;
  resumeStep?: OnboardingStep;
}): '/onboarding/welcome' | `/onboarding/${OnboardingStep}` | '/(tabs)' | null {
  const inOnboarding = input.firstSegment === 'onboarding';
  if (!input.hasSession) return inOnboarding ? null : '/onboarding/welcome';

  if (input.onboardingStatus === 'unknown') {
    return input.firstSegment === 'spotify-callback' && input.resumeStep
      ? `/onboarding/${input.resumeStep}`
      : null;
  }

  if (input.onboardingStatus === 'incomplete') {
    if (inOnboarding) return null;
    return `/onboarding/${input.resumeStep ?? 'welcome'}`;
  }

  const allowed = input.firstSegment === '(tabs)' || input.firstSegment === 'ritual' || input.firstSegment === 'settings' || input.firstSegment === 'meals';
  return allowed ? null : '/(tabs)';
}

export function shouldAdvanceSpotifyOnReturn(isConnected: boolean, connectionPending: boolean): boolean {
  return isConnected && connectionPending;
}
