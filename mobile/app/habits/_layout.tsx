import { Stack } from 'expo-router';
import { palette } from '@luminary/design-system';

export default function HabitsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.surface }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="library" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
