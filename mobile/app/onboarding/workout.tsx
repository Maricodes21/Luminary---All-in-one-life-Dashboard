/**
 * Screen 6 of 10 — Workout preference.
 * Single-select: Gym vs Home. Required — affects habit suggestions.
 */

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

type Option = { value: 'gym' | 'home'; label: string; description: string };

const OPTIONS: Option[] = [
  { value: 'gym',  label: 'Gym',       description: 'Weights, machines, classes.' },
  { value: 'home', label: 'Home',      description: 'Bodyweight, minimal kit, your space.' },
];

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutPreference: saved, setWorkoutPreference } = useOnboardingStore();
  const [selected, setSelected] = useState<'gym' | 'home' | undefined>(saved);

  function advance() {
    if (!selected) return;
    setWorkoutPreference(selected);
    router.push('/onboarding/goals');
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="workout" />

      <View style={styles.content}>
        <Text style={[t.headlineLg, styles.headline]}>How do you like to move?</Text>
        <Text style={[t.bodyMd, styles.sub]}>
          We'll suggest habits that fit your setup.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={opt.label}
                style={[styles.optionCard, active && styles.optionCardActive]}
              >
                <Text style={[t.titleLg, { color: active ? palette.primary : palette.onSurface }]}>
                  {opt.label}
                </Text>
                <Text style={[t.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                  {opt.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={advance}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Continue to goals"
          style={({ pressed }) => [
            styles.primaryBtn,
            !selected && { opacity: 0.4 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  headline: { color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant },
  options: { gap: spacing.md },
  optionCard: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  optionCardActive: {
    backgroundColor: palette.primaryContainer,
  },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
