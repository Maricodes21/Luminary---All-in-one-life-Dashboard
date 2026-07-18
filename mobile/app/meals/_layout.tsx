import { Stack } from 'expo-router';
import { palette } from '@luminary/design-system';

export default function MealsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.surface } }} />;
}
