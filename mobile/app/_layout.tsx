/**
 * Root layout — providers, fonts, splash control, auth gate.
 *
 * Auth routing logic:
 *   no session              → /onboarding/welcome
 *   session + incomplete    → /onboarding/welcome  (resume from start)
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

  const { setSession, setDisplayName, setOnboardingComplete, setHydrated, hydrated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

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
    // Restore session from AsyncStorage on first load.
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session ?? null;
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete, display_name')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setOnboardingComplete(profile?.onboarding_complete ?? false);
        setDisplayName(profile?.display_name ?? null);
      }

      setHydrated(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setOnboardingComplete, setHydrated]);

  // Route guard — runs after hydration and font load.
  useEffect(() => {
    if (!hydrated || !appReady) return;

    SplashScreen.hideAsync().catch(() => {});

    const { session, onboardingComplete } = useAuthStore.getState();
    const inTabs = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inRitual = segments[0] === 'ritual';

    if (!session) {
      if (!inOnboarding) router.replace('/onboarding/welcome');
      return;
    }

    if (!onboardingComplete) {
      if (!inOnboarding) router.replace('/onboarding/welcome');
      return;
    }

    // Allow authenticated users in tabs or the ritual modal — don't redirect either.
    if (!inTabs && !inRitual) {
      router.replace('/(tabs)');
    }
  }, [hydrated, appReady, segments, router]);

  // Hold render until fonts + hydration are both done to avoid flash.
  if (!appReady || !hydrated) return null;

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
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
