import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { ExerciseVisual } from '@/components/health/ExerciseVisual';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { buildWorkoutPlan, type WorkoutSession } from '@/lib/workoutPlanning';
import { warmupExercisesForSession } from '@/lib/guidedWorkout';
import { useProductionStore, type WorkoutPlan } from '@/stores/useProductionStore';

type Shelf = 'workouts' | 'warmups' | 'yoga';
const categories: WorkoutPlan['category'][] = ['gym', 'calisthenics', 'cardio', 'cycling'];
const weekdays = [1, 2, 3, 4, 5, 6, 0];

export default function MovementLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const building = mode === 'build';
  const createCustomWorkoutPlan = useProductionStore((state) => state.createCustomWorkoutPlan);
  const [shelf, setShelf] = useState<Shelf>('workouts');
  const [category, setCategory] = useState<WorkoutPlan['category']>('gym');
  const [selected, setSelected] = useState<WorkoutSession[]>([]);
  const sessions = useMemo(() => buildWorkoutPlan({ category: shelf === 'yoga' ? 'yoga' : category, level: 'steady', durationMinutes: 40, daysPerWeek: 4, weeklyFocus: shelf === 'warmups' ? 'mobility' : 'momentum', seed: `library:${shelf}:${category}` }), [category, shelf]);
  const toggle = (session: WorkoutSession) => setSelected((current) => current.some((item) => item.id === session.id) ? current.filter((item) => item.id !== session.id) : current.length < 5 ? [...current, session] : current);
  const save = () => { createCustomWorkoutPlan({ category: shelf === 'yoga' ? 'yoga' : category, sessions: selected, scheduledWeekdays: weekdays.slice(0, selected.length) }); router.replace('/(tabs)/health'); };

  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: building ? 130 : spacing['3xl'] }]}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back"><Icon name="back" /></Pressable><View style={styles.headerCopy}><SectionLabel>Movement library</SectionLabel><Text style={[type.headlineLg, styles.title]}>{building ? 'Build your own week' : 'Browse and learn'}</Text></View></View>
    <View style={styles.tabs}>{(['workouts', 'warmups', 'yoga'] as const).map((item) => <Pressable key={item} onPress={() => { setShelf(item); setSelected([]); }} style={[styles.tab, shelf === item && styles.tabActive]}><Text style={[type.labelMd, shelf === item ? styles.activeText : styles.muted]}>{item === 'warmups' ? 'Warm-ups & stretches' : title(item)}</Text></Pressable>)}</View>
    {shelf !== 'yoga' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map((item) => <Pressable key={item} onPress={() => { setCategory(item); setSelected([]); }} style={[styles.chip, category === item && styles.chipActive]}><Text style={[type.labelSm, category === item ? styles.activeText : styles.muted]}>{item === 'calisthenics' ? 'Home' : title(item)}</Text></Pressable>)}</ScrollView> : null}
    <Text style={[type.bodySm, styles.muted]}>{building ? 'Choose up to five sessions. Luminary keeps their instructions, warm-ups, and visuals when it places them into your week.' : 'Open any movement to study its visual, setup, and movement cue without starting a workout.'}</Text>
    <View style={styles.list}>{sessions.map((session) => {
      const chosen = selected.some((item) => item.id === session.id);
      const lead = shelf === 'warmups' ? warmupExercisesForSession(session)[0] : null;
      return <Card key={session.id} variant={chosen ? 'featured' : 'default'} padding="sm"><ExerciseVisual visualId={lead?.visualId ?? session.exercises[0]?.visualId ?? 'home_pushup'} style={styles.visual} /><View style={styles.cardCopy}><SectionLabel>{shelf === 'warmups' ? 'Preparation' : shelf === 'yoga' ? 'Yoga flow' : title(category)}</SectionLabel><Text style={[type.titleLg, styles.title]}>{lead?.title ?? session.title}</Text><Text style={[type.bodySm, styles.muted]}>{lead?.cue ?? `${session.focus} · ${session.durationMinutes} minutes · ${session.exercises.length} movements`}</Text></View>{building ? <Pressable onPress={() => toggle(session)} style={[styles.select, chosen && styles.selectActive]}><Icon name={chosen ? 'check' : 'plus'} size={18} color={chosen ? palette.onPrimary : palette.primary} /><Text style={[type.labelMd, chosen ? styles.activeText : { color: palette.primary }]}>{chosen ? 'Added' : 'Add to week'}</Text></Pressable> : null}</Card>;
    })}</View>
  </ScrollView>{building ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}><Text style={[type.bodySm, styles.muted]}>{selected.length} selected</Text><Pressable disabled={!selected.length} onPress={save} style={[styles.save, !selected.length && styles.disabled]}><Text style={[type.labelMd, styles.activeText]}>Use this week</Text></Pressable></View> : null}</View>;
}

function title(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.surface }, content: { paddingHorizontal: spacing.md, gap: spacing.lg }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, headerCopy: { flex: 1 }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh }, title: { color: palette.onSurface }, muted: { color: palette.onSurfaceVariant }, tabs: { flexDirection: 'row', gap: spacing.xs, padding: spacing.xs, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh }, tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs, borderRadius: radii.sm }, tabActive: { backgroundColor: palette.primary }, activeText: { color: palette.onPrimary }, chips: { gap: spacing.sm }, chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHigh }, chipActive: { backgroundColor: palette.primary }, list: { gap: spacing.md }, visual: { width: '100%', aspectRatio: 1.8, borderRadius: radii.md }, cardCopy: { gap: spacing.xs, paddingTop: spacing.sm }, select: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: palette.primaryContainer }, selectActive: { backgroundColor: palette.primary }, footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: palette.surfaceContainerHigh }, save: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: palette.primary }, disabled: { opacity: 0.45 } });
