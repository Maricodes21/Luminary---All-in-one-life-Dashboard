import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useRitualStore } from '@/stores/useRitualStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { localDateKey } from '@/lib/meals/dates';
import { getHabitIconName } from '@/lib/habitIcons';

export function HabitCheckin() {
  const today = localDateKey(new Date());
  const habits = useProductionStore((state) => state.habits.filter((habit) => !habit.archivedAt).sort((a, b) => a.position - b.position));
  const toggleCompletion = useProductionStore((state) => state.toggleHabitCompletion);
  const setStage = useRitualStore((state) => state.setStage);
  const setTotalHabits = useRitualStore((state) => state.setTotalHabits);
  const setHabitsCompleted = useRitualStore((state) => state.setHabitsCompleted);
  const completed = habits.filter((habit) => habit.completedOn.includes(today));
  const completedKey = completed.map((habit) => habit.id).join('|');

  useEffect(() => {
    setTotalHabits(habits.length);
    setHabitsCompleted(completedKey ? completedKey.split('|') : []);
  }, [completedKey, habits.length, setHabitsCompleted, setTotalHabits]);

  function toggle(id: string) {
    toggleCompletion(id, today);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View style={styles.container}>
      <SectionLabel>Commitments</SectionLabel>
      <Text style={[type.displaySm, styles.title]}>How did your small promises go?</Text>
      <Text style={[type.bodyMd, styles.copy]}>Check what happened. An unfinished commitment is information, not a reset.</Text>

      <Card style={styles.list}>
        {habits.length ? habits.map((habit) => {
          const done = habit.completedOn.includes(today);
          return (
            <Pressable key={habit.id} onPress={() => toggle(habit.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={habit.name}>
              <View style={[styles.toggle, done && styles.toggleDone]}><Icon name={done ? 'check' : getHabitIconName(habit.name)} size={16} color={done ? palette.onPrimary : palette.onSurfaceVariant} /></View>
              <View style={styles.rowBody}><Text style={[type.titleMd, styles.rowTitle, done && styles.done]}>{habit.name}</Text><Text style={[type.bodySm, styles.rowMeta]}>{done ? 'Captured today' : 'Leave open or check it now'}</Text></View>
            </Pressable>
          );
        }) : <Text style={[type.bodyMd, styles.copy]}>You have no active commitments yet. That is okay for tonight.</Text>}
      </Card>

      <Text style={[type.bodySm, styles.progress]}>{completed.length} of {habits.length} captured today</Text>
      <Pressable onPress={() => setStage('context')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button">
        <Text style={[type.labelMd, styles.primaryText]}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md }, title: { color: palette.onSurface }, copy: { color: palette.onSurfaceVariant }, list: { gap: spacing.xs },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, toggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, toggleDone: { backgroundColor: palette.tertiaryDim },
  rowBody: { flex: 1 }, rowTitle: { color: palette.onSurface }, rowMeta: { color: palette.onSurfaceVariant, marginTop: 2 }, done: { color: palette.onSurfaceVariant, textDecorationLine: 'line-through' }, progress: { color: palette.onSurfaceVariant },
  primaryButton: { minHeight: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary }, primaryText: { color: palette.onPrimary }, pressed: { opacity: 0.74 },
});
