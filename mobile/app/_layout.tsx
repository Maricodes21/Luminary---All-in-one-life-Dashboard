/**
 * Root layout — providers, fonts, splash control, auth gate.
 *
 * Auth routing logic:
 *   no session              → /onboarding/welcome
 *   session + incomplete    → last persisted onboarding step
 *   session + complete      → /(tabs)
 *
 * The gate runs once hydration is complete (supabase session restored from
 * AsyncStorage + profile fetched). Until then the splash screen stays visible.
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { palette } from '@luminary/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMealsBootstrap } from '@/hooks/useMealsBootstrap';
import { useMealsStore } from '@/stores/useMealsStore';
import { clearMealPhotoCache } from '@/lib/meals/photos';
import { loadCachedOnboardingStatus, saveCachedOnboardingStatus } from '@/lib/authProfileCache';
import { resolveProfileRestore, routeForAuthState } from '@/lib/authRouting';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontWaitExpired, setFontWaitExpired] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const {
    session,
    onboardingStatus,
    authResolving,
    beginSessionResolution,
    setAuthSnapshot,
    setHydrated,
    hydrated,
  } = useAuthStore();
  const onboardingStoreHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingResumeStep = useOnboardingStore((state) => state.currentStep);
  const router = useRouter();
  const segments = useSegments();
  useMealsBootstrap();

  useEffect(() => {
    const timeout = setTimeout(() => setFontWaitExpired(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts] Falling back to system fonts', fontError);
    }
  }, [fontError]);

  const appReady = fontsLoaded || !!fontError || fontWaitExpired;

  // Subscribe to Supabase auth state and mirror into the store.
  useEffect(() => {
    let cancelled = false;
    let resolutionVersion = 0;
    const hydrationTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[auth] Session restore timed out; continuing without a restored session.');
        const current = useAuthStore.getState();
        if (current.authResolving) setAuthSnapshot(current.session, 'unknown', current.displayName);
        setHydrated(true);
      }
    }, 5000);

    async function syncSessionProfile(nextSession: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) {
      if (cancelled) return;
      const currentResolution = ++resolutionVersion;
      beginSessionResolution(nextSession);

      if (!nextSession?.user) {
        useMealsStore.getState().clearPrivateCache();
        void clearMealPhotoCache().catch(() => {});
        setAuthSnapshot(null, 'incomplete', null);
        return;
      }

      const cachedStatus = await loadCachedOnboardingStatus(nextSession.user.id).catch(() => null);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_complete, display_name')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();

      if (error) {
        console.warn('[auth] Profile restore failed', error.message);
      }

      if (!cancelled && currentResolution === resolutionVersion) {
        const restoredStatus = resolveProfileRestore({
          remoteComplete: typeof profile?.onboarding_complete === 'boolean' ? profile.onboarding_complete : null,
          profileError: !!error,
          cachedStatus,
        });
        useMealsStore.getState().setActiveUser(nextSession.user.id);
        setAuthSnapshot(nextSession, restoredStatus, profile?.display_name ?? null);
        if (restoredStatus !== 'unknown') {
          void saveCachedOnboardingStatus(nextSession.user.id, restoredStatus).catch(() => {});
        }
      }
    }

    // Restore session from AsyncStorage on first load.
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        await syncSessionProfile(data.session ?? null);
      })
      .catch((error) => {
        console.warn('[auth] Session restore failed', error);
        setAuthSnapshot(null, 'unknown', null);
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(hydrationTimeout);
          setHydrated(true);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSessionProfile(nextSession);
    });

    return () => {
      cancelled = true;
      clearTimeout(hydrationTimeout);
      listener.subscription.unsubscribe();
    };
  }, [beginSessionResolution, setAuthSnapshot, setHydrated]);

  // Route guard — runs after hydration and font load.
  useEffect(() => {
    if (!hydrated || !appReady || !onboardingStoreHydrated || authResolving) return;

    SplashScreen.hideAsync().catch(() => {});

    const destination = routeForAuthState({
      hasSession: !!session,
      onboardingStatus,
      firstSegment: segments[0],
      resumeStep: onboardingResumeStep,
    });

    if (destination) router.replace(destination);

  }, [hydrated, appReady, onboardingStoreHydrated, authResolving, segments, router, session, onboardingStatus, onboardingResumeStep]);

  // Hold render until fonts + hydration are both done to avoid flash.
  if (!appReady || !hydrated || !onboardingStoreHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.surface }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.surface },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="ritual"
              options={{ presentation: 'modal', animation: 'fade_from_bottom' }}
            />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="habits" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="meals" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="spotify-callback" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
