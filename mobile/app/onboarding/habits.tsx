/**
 * Screen 8 of 10 — Habits.
 * Shows suggestions seeded by selected goals. User can toggle on/off.
 * Minimum 3 required to continue. TONE.md: "Pick something small. Three is enough."
 */

import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore, HABIT_SUGGESTIONS } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

const MIN_HABITS = 3;

export default function HabitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals, habitNames: saved, setHabitNames } = useOnboardingStore();

  // Deduplicated suggestions based on selected goals.
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const goal of (goals ?? [])) {
      for (const h of (HABIT_SUGGESTIONS[goal] ?? [])) {
        if (!seen.has(h)) { seen.add(h); result.push(h); }
      }
    }
    // Pad with defaults if goals gave too few.
    const defaults = ['10-min walk', 'Wind down by 10 PM', 'One conscious breath', 'Log one expense'];
    for (const d of defaults) {
      if (result.length >= 9) break;
      if (!seen.has(d)) { seen.add(d); result.push(d); }
    }
    return result;
  }, [goals]);

  const [selected, setSelected] = useState<string[]>(
    saved?.length ? saved : suggestions.slice(0, MIN_HABITS),
  );

  function toggle(habit: string) {
    setSelected((prev) =>
      prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit],
    );
  }

  function advance() {
    if (selected.length < MIN_HABITS) return;
    setHabitNames(selected);
    router.push('/onboarding/personality');
  }

  const remaining = Math.max(0, MIN_HABITS - selected.length);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="habits" />

      <View style={styles.header}>
        <Text style={[t.headlineLg, styles.headline]}>Pick your habits.</Text>
        <Text style={[t.bodyMd, styles.sub]}>
          {remaining > 0
            ? `Pick something small. ${remaining} more to go.`
            : 'Three is enough. Add more later.'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {suggestions.map((habit) => {
          const active = selected.includes(habit);
          return (
            <Pressable
              key={habit}
              onPress={() => toggle(habit)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={habit}
              style={[styles.habitRow, active && styles.habitRowActive]}
            >
              <View style={[styles.check, active && styles.checkActive]}>
                {active && <View style={styles.checkInner} />}
              </View>
              <Text style={[t.bodyMd, { color: palette.onSurface, flex: 1 }]}>{habit}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={advance}
          disabled={selected.length < MIN_HABITS}
          accessibilityRole="button"
          accessibilityLabel="Continue to personality"
          style={({ pressed }) => [
            styles.primaryBtn,
            selected.length < MIN_HABITS && { opacity: 0.4 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CHECK_SIZE = 22;

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
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  habitRowActive: {
    backgroundColor: palette.surfaceContainerHighest,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  checkInner: {
    width: CHECK_SIZE / 2,
    height: CHECK_SIZE / 2,
    borderRadius: radii.pill,
    backgroundColor: palette.onPrimary,
  },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
