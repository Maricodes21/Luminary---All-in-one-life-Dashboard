/**
 * Screen 7 of 10 — Goals.
 * Multi-select, max 5. Selection seeds the habit suggestions on the next screen.
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore, GOAL_OPTIONS } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

const MAX_GOALS = 5;

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals: saved, setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(saved ?? []);

  function toggle(goal: string) {
    setSelected((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, goal];
    });
  }

  function advance() {
    if (selected.length === 0) return;
    setGoals(selected);
    router.push('/onboarding/habits');
  }

  const atMax = selected.length >= MAX_GOALS;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="goals" />

      <View style={styles.header}>
        <Text style={[t.headlineLg, styles.headline]}>What are you working toward?</Text>
        <Text style={[t.bodyMd, styles.sub]}>
          Pick up to {MAX_GOALS}.{atMax ? ' That\'s enough to start.' : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((goal) => {
          const active = selected.includes(goal);
          const disabled = !active && atMax;
          return (
            <Pressable
              key={goal}
              onPress={() => toggle(goal)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active, disabled }}
              accessibilityLabel={goal}
              style={[
                styles.chip,
                active && styles.chipActive,
                disabled && styles.chipDisabled,
              ]}
            >
              <Text
                style={[
                  t.bodyMd,
                  { color: active ? palette.onPrimary : disabled ? palette.onSurfaceVariant : palette.onSurface },
                ]}
              >
                {goal}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={advance}
          disabled={selected.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Continue to habits"
          style={({ pressed }) => [
            styles.primaryBtn,
            selected.length === 0 && { opacity: 0.4 },
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  headline: { color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  chip: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: palette.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
