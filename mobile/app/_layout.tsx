/**
 * Root layout — providers, fonts, splash control.
 * Renders the Expo Router stack underneath.
 */
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
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

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash already hidden */
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
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

  useEffect(() => {
    const timeout = setTimeout(() => setFontWaitExpired(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontError) {
      // Keep the app usable if Android cannot load a bundled font.
      console.warn('[fonts] Falling back to system fonts', fontError);
    }
  }, [fontError]);

  const appReady = fontsLoaded || !!fontError || fontWaitExpired;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {
        /* noop */
      });
    }
  }, [appReady]);

  if (!appReady) return null;

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
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
