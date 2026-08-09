import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';
import { useRitualStore } from '@/stores/useRitualStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { localDateKey } from '@/lib/meals/dates';
import { getHabitIconName } from '@/lib/habitIcons';
import { scheduledHabitsForDate } from '@/lib/habits';

export function HabitCheckin() {
  const today = localDateKey(new Date());
  const allHabits = useProductionStore((state) => state.habits);
  const habits = scheduledHabitsForDate(allHabits, today);
  const toggleCompletion = useProductionStore((state) => state.toggleHabitCompletion);
  const toggleSkip = useProductionStore((state) => state.toggleHabitSkip);
  const setStage = useRitualStore((state) => state.setStage);
  const setTotalHabits = useRitualStore((state) => state.setTotalHabits);
  const setHabitsCompleted = useRitualStore((state) => state.setHabitsCompleted);
  const completed = habits.filter((habit) => habit.completedOn.includes(today));
  const completedKey = completed.map((habit) => habit.id).join('|');

  useEffect(() => {
    setTotalHabits(habits.length);
    setHabitsCompleted(completedKey ? completedKey.split('|') : []);
  }, [completedKey, habits.length, setHabitsCompleted, setTotalHabits]);

  function complete(id: string) {
    toggleCompletion(id, today);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function skip(id: string) {
    toggleSkip(id, today);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View style={styles.container}>
      <View style={styles.introCard}>
        <Text style={[type.labelSm, styles.accent]}>Today’s commitments</Text>
        <Text style={[type.headlineSm, styles.title]}>Count what happened. Leave clear what did not fit.</Text>
      </View>

      <View style={styles.list}>
        {habits.length ? habits.map((habit) => {
          const done = habit.completedOn.includes(today);
          const skipped = (habit.skippedOn ?? habit.pausedOn)?.includes(today) ?? false;
          return (
            <View key={habit.id} style={styles.row}>
              <Pressable onPress={() => complete(habit.id)} style={({ pressed }) => [styles.checkControl, pressed && styles.pressed]} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`Mark ${habit.name} ${done ? 'open' : 'complete'}`}>
                <View style={[styles.toggle, done && styles.toggleDone]}>
                  <Icon name={done ? 'check' : getHabitIconName(habit.name)} size={spacing.md} color={done ? palette.onPrimary : palette.primary} />
                </View>
              </Pressable>
              <View style={styles.rowBody}>
                <Text style={[type.titleMd, done ? styles.doneTitle : styles.title]} numberOfLines={2}>{habit.name}</Text>
                <Text style={[type.labelSm, styles.copy]}>{scheduleLabel(habit.schedule?.timeWindow, habit.schedule?.weeklyTarget)}</Text>
              </View>
              <Pressable onPress={() => skip(habit.id)} style={[styles.skipButton, skipped && styles.skipButtonActive]} accessibilityRole="switch" accessibilityState={{ checked: skipped }} accessibilityLabel={`${skipped ? 'Restore' : 'Skip'} ${habit.name} today`}>
                <Text style={[type.labelSm, skipped ? styles.accent : styles.copy]}>{skipped ? 'Restore' : 'Skip day'}</Text>
              </Pressable>
            </View>
          );
        }) : <Text style={[type.bodyMd, styles.copy]}>You have no active commitments. That is okay for tonight.</Text>}
      </View>

      <View style={styles.recoveryNote}>
        <Text style={[type.labelMd, styles.recoveryLead]}>No reset.</Text>
        <Text style={[type.bodySm, styles.copy]}>One clear day does not erase the rhythm.</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={() => setStage('context')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={[type.labelMd, styles.title]}>Skip commitments</Text>
        </Pressable>
        <Pressable onPress={() => setStage('context')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={[type.labelMd, styles.primaryText]}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function scheduleLabel(window: 'morning' | 'day' | 'evening' | 'anytime' | undefined, weeklyTarget: number | undefined) {
  const time = window ? window.charAt(0).toUpperCase() + window.slice(1) : 'Anytime';
  return weeklyTarget ? `${time} · ${weeklyTarget} days a week` : time;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  introCard: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  list: { gap: spacing.sm },
  row: { minHeight: spacing['3xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  checkControl: { width: spacing['2xl'], minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  toggle: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  toggleDone: { backgroundColor: palette.primary },
  rowBody: { flex: 1, minWidth: 0, gap: spacing.xs },
  skipButton: { minWidth: spacing['3xl'], minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHighest },
  skipButtonActive: { backgroundColor: palette.primaryContainer },
  recoveryNote: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerLow },
  recoveryLead: { color: palette.tertiary },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  primaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary },
  title: { color: palette.onSurface },
  doneTitle: { color: palette.onSurfaceVariant },
  copy: { color: palette.onSurfaceVariant },
  accent: { color: palette.primary },
  primaryText: { color: palette.onPrimary },
  pressed: { opacity: 0.74 },
});
