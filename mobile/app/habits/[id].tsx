import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useProductionStore, type HabitSchedule } from '@/stores/useProductionStore';
import { localDateKey } from '@/lib/meals/dates';

const timeWindows: HabitSchedule['timeWindow'][] = ['morning', 'day', 'evening', 'anytime'];

export default function CommitmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const habit = useProductionStore((state) => state.habits.find((item) => item.id === id));
  const updateHabit = useProductionStore((state) => state.updateHabitDetails);
  const togglePause = useProductionStore((state) => state.toggleHabitPause);
  const archiveHabit = useProductionStore((state) => state.archiveHabit);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(habit?.name ?? '');
  const [timeWindow, setTimeWindow] = useState<HabitSchedule['timeWindow']>(habit?.schedule?.timeWindow ?? 'anytime');
  const days = useMemo(() => recentDates(14), []);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);

  if (!habit) return <View style={[styles.root, styles.center]}><Text style={[type.bodyMd, styles.muted]}>This commitment is no longer available.</Text></View>;
  const week = days.slice(-7);
  const completedThisWeek = week.filter((date) => habit.completedOn.includes(date.key)).length;
  const previousWeek = days.slice(0, 7).filter((date) => habit.completedOn.includes(date.key)).length;
  const pausedTomorrow = habit.pausedOn?.includes(tomorrowKey) ?? false;

  function save() {
    if (!habit) return;
    updateHabit(habit.id, { name, schedule: { ...(habit.schedule ?? { days: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 5, timeWindow: 'anytime' }), timeWindow } });
    setEditing(false);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing['2xl'] }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button"><Icon name="back" /></Pressable>
        <SectionLabel>Commitment detail</SectionLabel>
        <Pressable onPress={() => setEditing((value) => !value)} style={styles.editButton} accessibilityRole="button"><Icon name="edit" size={16} color={palette.primary} /><Text style={[type.labelSm, styles.editText]}>Edit</Text></Pressable>
      </View>

      {editing ? (
        <Card variant="featured">
          <SectionLabel>Edit</SectionLabel>
          <TextInput value={name} onChangeText={setName} style={styles.input} accessibilityLabel="Commitment name" />
          <Text style={[type.labelSm, styles.fieldLabel]}>Time window</Text>
          <View style={styles.chips}>{timeWindows.map((window) => <Chip key={window} label={sentenceCase(window)} selected={timeWindow === window} onPress={() => setTimeWindow(window)} />)}</View>
          <Pressable onPress={save} style={styles.saveButton} accessibilityRole="button"><Text style={[type.labelMd, styles.saveText]}>Save changes</Text></Pressable>
        </Card>
      ) : (
        <>
          <Text style={[type.displaySm, styles.title]}>{habit.name}</Text>
          <Text style={[type.bodyMd, styles.muted]}>{habit.category ?? 'Personal'} · {sentenceCase(habit.schedule?.timeWindow ?? 'anytime')} · {habit.schedule?.weeklyTarget ?? 5} times weekly</Text>
        </>
      )}

      <View style={styles.metricRow}>
        <Card style={styles.metricCard}><SectionLabel>This week</SectionLabel><Text style={[type.headlineLg, styles.title]}>{completedThisWeek}/7</Text><Text style={[type.bodySm, styles.muted]}>days kept</Text></Card>
        <Card style={styles.metricCard}><SectionLabel>Direction</SectionLabel><Text style={[type.headlineLg, { color: completedThisWeek >= previousWeek ? palette.tertiaryDim : palette.secondary }]}>{completedThisWeek >= previousWeek ? 'Steady' : 'Lighter'}</Text><Text style={[type.bodySm, styles.muted]}>compared with last week</Text></Card>
      </View>

      <Card>
        <SectionLabel>Last 14 days</SectionLabel>
        <View style={styles.historyGrid}>{days.map((date) => {
          const done = habit.completedOn.includes(date.key); const paused = habit.pausedOn?.includes(date.key);
          return <View key={date.key} style={styles.historyItem}><View style={[styles.historyDot, done && styles.historyDone, paused && styles.historyPaused]}>{done ? <Icon name="check" size={13} color={palette.onPrimary} /> : null}</View><Text style={[type.labelSm, styles.muted]}>{date.day}</Text></View>;
        })}</View>
      </Card>

      <Pressable onPress={() => togglePause(habit.id, tomorrowKey)} style={styles.pauseAction} accessibilityRole="button">
        <Icon name={pausedTomorrow ? 'undo' : 'clock'} size={18} color={palette.primary} />
        <View style={styles.pauseCopy}><Text style={[type.titleMd, styles.title]}>{pausedTomorrow ? 'Resume tomorrow' : 'Pause tomorrow'}</Text><Text style={[type.bodySm, styles.muted]}>A pause is intentional and does not reset your progress.</Text></View>
      </Pressable>
      <Pressable onPress={() => { archiveHabit(habit.id); router.replace('/habits'); }} style={styles.archiveAction} accessibilityRole="button"><Text style={[type.labelMd, { color: palette.error }]}>Archive commitment</Text></Pressable>
    </ScrollView>
  );
}

function recentDates(count: number) { return Array.from({ length: count }, (_, index) => { const value = new Date(); value.setDate(value.getDate() - (count - 1 - index)); return { key: localDateKey(value), day: value.toLocaleDateString(undefined, { weekday: 'narrow' }) }; }); }
function sentenceCase(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, content: { paddingHorizontal: spacing.md, gap: spacing.md }, center: { alignItems: 'center', justifyContent: 'center' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, iconButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  editButton: { minWidth: 66, height: 44, borderRadius: radii.md, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh }, editText: { color: palette.primary },
  title: { color: palette.onSurface }, muted: { color: palette.onSurfaceVariant }, input: { minHeight: 48, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest, color: palette.onSurface, paddingHorizontal: spacing.md, marginTop: spacing.md },
  fieldLabel: { color: palette.onSurfaceVariant, marginTop: spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }, saveButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary, marginTop: spacing.md }, saveText: { color: palette.onPrimary },
  metricRow: { flexDirection: 'row', gap: spacing.sm }, metricCard: { flex: 1, gap: spacing.xs }, historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, historyItem: { alignItems: 'center', gap: spacing.xs },
  historyDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, historyDone: { backgroundColor: palette.tertiaryDim }, historyPaused: { backgroundColor: palette.surfaceBright },
  pauseAction: { minHeight: 76, borderRadius: radii.lg, backgroundColor: palette.surfaceContainer, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }, pauseCopy: { flex: 1, gap: 2 }, archiveAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
