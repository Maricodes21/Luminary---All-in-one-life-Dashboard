import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useProductionStore } from '@/stores/useProductionStore';
import { getHabitIconName } from '@/lib/habitIcons';
import { localDateKey } from '@/lib/meals/dates';

export default function CommitmentsHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const habits = useProductionStore((state) => state.habits.filter((habit) => !habit.archivedAt).sort((a, b) => a.position - b.position));
  const toggleCompletion = useProductionStore((state) => state.toggleHabitCompletion);
  const togglePause = useProductionStore((state) => state.toggleHabitPause);
  const dates = useMemo(() => recentDates(7), []);
  const completed = habits.filter((habit) => habit.completedOn.includes(selectedDate)).length;
  const paused = habits.filter((habit) => habit.pausedOn?.includes(selectedDate)).length;
  const weeklyDone = habits.reduce((total, habit) => total + habit.completedOn.filter((date) => dates.some((item) => item.key === date)).length, 0);
  const weeklyPossible = Math.max(1, habits.reduce((total, habit) => total + Math.min(habit.schedule?.weeklyTarget ?? 5, 7), 0));

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing['2xl'] }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Back"><Icon name="back" /></Pressable>
        <View style={styles.topbarTitle}><SectionLabel>Commitments hub</SectionLabel><Text style={[type.bodySm, styles.muted]}>Flexible rhythm, visible progress</Text></View>
        <Pressable onPress={() => router.push('/habits/library')} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Add commitment"><Icon name="plus" color={palette.primary} /></Pressable>
      </View>

      <Text style={[type.displaySm, styles.title]}>Keep the promise.{`\n`}Adjust the rhythm.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dates.map((date) => {
          const selected = selectedDate === date.key;
          return (
            <Pressable key={date.key} onPress={() => setSelectedDate(date.key)} style={[styles.dateChip, selected && styles.dateChipSelected]} accessibilityRole="button" accessibilityState={{ selected }}>
              <Text style={[type.labelSm, selected ? styles.dateTextSelected : styles.muted]}>{date.day}</Text>
              <Text style={[type.titleMd, selected ? styles.dateTextSelected : styles.title]}>{date.number}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.metricRow}>
        <Card style={styles.metricCard}><SectionLabel>Selected day</SectionLabel><Text style={[type.headlineLg, styles.title]}>{completed}/{habits.length}</Text><Text style={[type.bodySm, styles.muted]}>{paused ? `${paused} paused intentionally` : 'No penalties for a lighter day'}</Text></Card>
        <Card style={styles.metricCard}><SectionLabel>This week</SectionLabel><Text style={[type.headlineLg, styles.title]}>{Math.round((weeklyDone / weeklyPossible) * 100)}%</Text><Text style={[type.bodySm, styles.muted]}>Consistency, not a brittle streak</Text></Card>
      </View>

      <View style={styles.sectionHeading}><View><SectionLabel>For this day</SectionLabel><Text style={[type.headlineMd, styles.sectionTitle]}>Your commitments</Text></View></View>
      <Card>
        {habits.map((habit) => {
          const isDone = habit.completedOn.includes(selectedDate);
          const isPaused = habit.pausedOn?.includes(selectedDate) ?? false;
          return (
            <View key={habit.id} style={styles.habitRow}>
              <Pressable onPress={() => toggleCompletion(habit.id, selectedDate)} disabled={isPaused} style={[styles.check, isDone && styles.checkDone, isPaused && styles.checkPaused]} accessibilityRole="checkbox" accessibilityState={{ checked: isDone, disabled: isPaused }}>
                <Icon name={isDone ? 'check' : getHabitIconName(habit.name)} size={16} color={isDone ? palette.onPrimary : palette.onSurfaceVariant} />
              </Pressable>
              <Pressable onPress={() => router.push(`/habits/${habit.id}`)} style={styles.habitBody} accessibilityRole="button">
                <Text style={[type.titleMd, styles.title, isDone && styles.doneText]}>{habit.name}</Text>
                <Text style={[type.bodySm, styles.muted]}>{isPaused ? 'Paused for this day' : `${sentenceCase(habit.schedule?.timeWindow ?? 'anytime')} · ${habit.schedule?.weeklyTarget ?? 5} times weekly`}</Text>
              </Pressable>
              <Pressable onPress={() => togglePause(habit.id, selectedDate)} style={styles.pauseButton} accessibilityRole="button" accessibilityLabel={`${isPaused ? 'Resume' : 'Pause'} ${habit.name}`}>
                <Text style={[type.labelSm, { color: isPaused ? palette.tertiaryDim : palette.onSurfaceVariant }]}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Pressable onPress={() => router.push('/habits/library')} style={styles.addButton} accessibilityRole="button">
        <Icon name="plus" size={18} color={palette.onPrimary} /><Text style={[type.labelMd, styles.addText]}>Add commitment</Text>
      </Pressable>
    </ScrollView>
  );
}

function recentDates(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date();
    value.setDate(value.getDate() - (count - 1 - index));
    return { key: localDateKey(value), day: value.toLocaleDateString(undefined, { weekday: 'short' }), number: value.getDate() };
  });
}

function sentenceCase(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, content: { paddingHorizontal: spacing.md, gap: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topbarTitle: { alignItems: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  title: { color: palette.onSurface }, muted: { color: palette.onSurfaceVariant },
  dateStrip: { gap: spacing.sm }, dateChip: { width: 58, minHeight: 64, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainer, gap: 2 }, dateChipSelected: { backgroundColor: palette.primary }, dateTextSelected: { color: palette.onPrimary },
  metricRow: { flexDirection: 'row', gap: spacing.sm }, metricCard: { flex: 1, gap: spacing.xs },
  sectionHeading: { marginTop: spacing.sm }, sectionTitle: { color: palette.onSurface, marginTop: spacing.xs },
  habitRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, checkDone: { backgroundColor: palette.tertiaryDim }, checkPaused: { opacity: 0.45 },
  habitBody: { flex: 1, paddingVertical: spacing.sm }, doneText: { textDecorationLine: 'line-through', color: palette.onSurfaceVariant },
  pauseButton: { minWidth: 58, minHeight: 44, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainerHigh },
  addButton: { minHeight: 48, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: palette.primary }, addText: { color: palette.onPrimary },
});
