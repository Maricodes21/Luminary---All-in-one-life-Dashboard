import { Stack } from 'expo-router';
import { palette } from '@luminary/design-system';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function RitualLayout() {
  // Flush any queued offline writes when the ritual is opened / app foregrounded.
  useOfflineSync();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.surface },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
