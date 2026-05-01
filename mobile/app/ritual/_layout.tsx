import { Stack } from 'expo-router';
import { palette } from '@luminary/design-system';

export default function RitualLayout() {
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
