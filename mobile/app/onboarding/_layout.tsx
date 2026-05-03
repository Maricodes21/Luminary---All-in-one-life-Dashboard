/**
 * Onboarding stack — 10 screens with a segmented dot progress bar.
 *
 * Routing order (matches ROADMAP.md Phase 1):
 *   welcome → account → profile → spotify → body →
 *   workout → goals → habits → personality → ready
 *
 * The progress bar maps screen name → step index. It is rendered once
 * here and updated via the route name so each child screen stays lean.
 */

import { Stack, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii } from '@luminary/design-system';

const STEPS = [
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

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.surface },
        animation: 'slide_from_right',
      }}
    >
      {STEPS.map((name) => (
        <Stack.Screen key={name} name={name} />
      ))}
    </Stack>
  );
}

/** Rendered inside each onboarding screen at the top — imported per-screen. */
export function OnboardingProgress({ step }: { step: (typeof STEPS)[number] }) {
  const insets = useSafeAreaInsets();
  const currentIndex = STEPS.indexOf(step);

  return (
    <View style={[styles.progressBar, { paddingTop: insets.top + spacing.sm }]}>
      {STEPS.map((s, i) => (
        <View
          key={s}
          style={[
            styles.dot,
            i <= currentIndex ? styles.dotActive : styles.dotInactive,
          ]}
          accessibilityElementsHidden
        />
      ))}
    </View>
  );
}

const DOT_SIZE = 6;

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dot: {
    flex: 1,
    height: DOT_SIZE,
    borderRadius: radii.pill,
  },
  dotActive: {
    backgroundColor: palette.primary,
  },
  dotInactive: {
    backgroundColor: palette.surfaceContainerHighest,
  },
});
