import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { Chip } from '@/components/ui/Chip';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useProductionStore, type WorkoutPlan } from '@/stores/useProductionStore';
import { exerciseAlternates, workoutExercises, type ExercisePreset } from '@/lib/modulePresets';

const categories: WorkoutPlan['category'][] = ['calisthenics', 'cardio', 'cycling', 'gym'];
const levels: WorkoutPlan['level'][] = ['beginner', 'steady', 'advanced'];
const equipmentOptions = ['bodyweight', 'dumbbells', 'bands', 'bike'];
const timeOptions = ['25 min', '40 min', '55 min'];

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, latestMetric, isLoading } = useHealthMetrics();
  const [category, setCategory] = useState<WorkoutPlan['category']>('calisthenics');
  const [level, setLevel] = useState<WorkoutPlan['level']>('steady');
  const [equipment, setEquipment] = useState('bodyweight');
  const [timeAvailable, setTimeAvailable] = useState('40 min');
  const [connectOpen, setConnectOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const workoutPlans = useProductionStore((s) => s.workoutPlans);
  const createWorkoutPlan = useProductionStore((s) => s.createWorkoutPlan);
  const latestPlan = workoutPlans[0];
  const hasLiveMetrics = !!latestMetric;
  const planCategory = latestPlan?.category ?? category;
  const exerciseList = useMemo(() => workoutExercises[planCategory], [planCategory]);
  const metricTiles = hasLiveMetrics
    ? [
        { value: formatNumber(latestMetric.steps), label: 'steps' },
        { value: formatNumber(latestMetric.heart_rate_bpm), label: 'bpm' },
        { value: formatSleep(latestMetric.sleep_minutes), label: 'sleep' },
      ]
    : [
        { value: String(latestPlan?.days.length ?? workouts.length), label: latestPlan ? 'planned days' : 'logged' },
        { value: String(estimateWeeklyMinutes(latestPlan, workouts)), label: 'weekly min' },
        { value: latestPlan ? formatLabel(latestPlan.category) : 'Ready', label: 'focus' },
      ];

  const onCreatePlan = () => {
    createWorkoutPlan(category, level);
    setPlannerOpen(true);
  };

  const onReplaceExercise = (exerciseName: string) => {
    const current = replacements[exerciseName] ?? exerciseName;
    const currentIndex = exerciseAlternates.indexOf(current);
    const next = exerciseAlternates[(currentIndex + 1) % exerciseAlternates.length];
    setReplacements((state) => ({ ...state, [exerciseName]: next }));
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <SectionLabel>Physical health</SectionLabel>
            <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Movement</Text>
            <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              Connect body data when you are ready. The plan still works without it.
            </Text>
          </View>
          <Pressable onPress={() => setPlannerOpen(true)} style={styles.headerAction} accessibilityRole="button">
            <Icon name="calendar" color={palette.onPrimary} size={20} />
          </Pressable>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.cardHeader}>
            <SectionLabel>Health Connect</SectionLabel>
            <Pressable onPress={() => setConnectOpen(true)}>
              <Text style={[type.labelMd, { color: palette.primary }]}>{hasLiveMetrics ? 'Manage' : 'Connect'}</Text>
            </Pressable>
          </View>
          <View style={styles.metricRow}>
            {metricTiles.map((tile) => (
              <View key={tile.label} style={styles.metricTile}>
                <Text style={[type.displayMd, { color: palette.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>
                  {tile.value}
                </Text>
                <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
                  {tile.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
            {hasLiveMetrics
              ? `Latest ${latestMetric.source.replace('_', ' ')} sync from ${latestMetric.metric_date}.`
              : 'No synced metrics yet. This view falls back to plans and logged workouts.'}
          </Text>
        </Card>

        <View style={styles.spaced}>
          <View style={styles.sectionHeader}>
            <Text style={[type.headlineMd, { color: palette.onSurface }]}>Today's workout</Text>
            <Text style={[type.labelSm, { color: palette.primary }]}>Recommended</Text>
          </View>
          <Card variant="featured" padding="sm">
            <Image source={{ uri: exerciseList[0].imageUrl }} style={styles.heroImage} />
            <View style={styles.workoutHeroContent}>
              <View style={{ flex: 1 }}>
                <Text style={[type.titleLg, { color: palette.onSurface }]}>
                  {latestPlan ? `${formatLabel(latestPlan.category)} strength` : 'Build your week'}
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                  {timeAvailable} / {latestPlan?.level ?? level} / {equipment}
                </Text>
              </View>
              <Pressable onPress={latestPlan ? () => setPlannerOpen(true) : onCreatePlan} style={styles.inlineButton}>
                <Text style={[type.labelMd, { color: palette.onPrimary }]}>{latestPlan ? 'Open' : 'Create'}</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Plan setup</Text>
          <Card>
            <SectionLabel>Category</SectionLabel>
            <View style={styles.chipGrid}>
              {categories.map((item) => (
                <Choice key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
              ))}
            </View>
            <SectionLabel style={{ marginTop: spacing.md }}>Level</SectionLabel>
            <View style={styles.chipGrid}>
              {levels.map((item) => (
                <Choice key={item} label={item} active={level === item} onPress={() => setLevel(item)} />
              ))}
            </View>
            <SectionLabel style={{ marginTop: spacing.md }}>Equipment</SectionLabel>
            <View style={styles.chipGrid}>
              {equipmentOptions.map((item) => (
                <Chip key={item} label={item} selected={equipment === item} onPress={() => setEquipment(item)} />
              ))}
            </View>
            <SectionLabel style={{ marginTop: spacing.md }}>Time</SectionLabel>
            <View style={styles.chipGrid}>
              {timeOptions.map((item) => (
                <Chip key={item} label={item} selected={timeAvailable === item} onPress={() => setTimeAvailable(item)} />
              ))}
            </View>
            <Pressable onPress={onCreatePlan} style={styles.primaryButton}>
              <Text style={[type.labelMd, { color: palette.onPrimary }]}>Create your plan for the week</Text>
            </Pressable>
          </Card>
        </View>

        {latestPlan && (
          <Card style={{ marginTop: spacing.md }} variant="featured">
            <View style={styles.cardHeader}>
              <View>
                <SectionLabel>This week</SectionLabel>
                <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                  {latestPlan.category} / {latestPlan.level}
                </Text>
              </View>
              <Pressable onPress={() => setPlannerOpen(true)}>
                <Text style={[type.labelMd, { color: palette.primary }]}>View full</Text>
              </Pressable>
            </View>
            {latestPlan.days.map((day, index) => (
              <View key={day} style={{ marginTop: spacing.sm }}>
                <View style={styles.planRow}>
                  <Text style={[type.labelMd, { color: palette.onSurface }]}>Day {index + 1}</Text>
                  <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>{day}</Text>
                </View>
                <ProgressBar value={index + 1} max={latestPlan.days.length} color={palette.tertiary} style={{ marginTop: spacing.xs }} />
              </View>
            ))}
          </Card>
        )}

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Logged workouts</Text>
          {isLoading ? (
            <ActivityIndicator color={palette.primary} />
          ) : workouts.length > 0 ? (
            workouts.map((workout) => (
              <Card key={workout.id} style={{ marginBottom: spacing.sm }}>
                <Text style={[type.labelMd, { color: palette.onSurface }]}>{workout.workout_type}</Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                  {workout.workout_date} / {workout.duration_minutes || '--'} min
                </Text>
              </Card>
            ))
          ) : (
            <Card variant="recessed">
              <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                No workouts logged yet. Create a week first; completion comes after.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <ActionSheet visible={connectOpen} onClose={() => setConnectOpen(false)} eyebrow="Permissioned data" title="Connect Health services">
        <QuickActionTile icon="health" label="Health Connect" detail="Steps, heart rate, sleep, and workouts" accent={palette.tertiary} />
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Luminary should request only the metrics it can explain: steps, heart rate, sleep, and workout sessions.
          Users can revoke access at any time from Android settings.
        </Text>
        <Pressable style={styles.primaryButton}>
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>Request permissions</Text>
        </Pressable>
      </ActionSheet>

      <ActionSheet visible={plannerOpen} onClose={() => setPlannerOpen(false)} eyebrow="Workout plan" title="Review and substitute">
        {(latestPlan?.days ?? buildPreviewDays(category, level)).map((day, index) => (
          <Card key={`${day}-${index}`} variant="featured">
            <SectionLabel>Day {index + 1}</SectionLabel>
            <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>{day}</Text>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              {timeAvailable} / {equipment}
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {exerciseList.map((exercise) => (
                <ExerciseRow
                  key={`${day}-${exercise.name}`}
                  exercise={exercise}
                  replacement={replacements[exercise.name]}
                  onReplace={() => onReplaceExercise(exercise.name)}
                />
              ))}
            </View>
          </Card>
        ))}
      </ActionSheet>
    </>
  );
}

function ExerciseRow({
  exercise,
  replacement,
  onReplace,
}: {
  exercise: ExercisePreset;
  replacement?: string;
  onReplace: () => void;
}) {
  return (
    <View style={styles.exerciseRow}>
      <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
      <View style={{ flex: 1 }}>
        <Text style={[type.titleMd, { color: palette.onSurface }]}>{replacement ?? exercise.name}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{exercise.detail}</Text>
      </View>
      <Pressable onPress={onReplace} style={styles.replaceButton}>
        <Icon name="swap" size={16} color={palette.primary} />
        <Text style={[type.labelSm, { color: palette.primary }]}>Swap</Text>
      </Pressable>
    </View>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <Text style={[type.labelMd, { color: active ? palette.onPrimary : palette.onSurfaceVariant }]}>{label}</Text>
    </Pressable>
  );
}

function formatNumber(value: number | null) {
  return value == null ? '--' : Intl.NumberFormat().format(value);
}

function formatSleep(value: number | null) {
  if (value == null) return '--';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function estimateWeeklyMinutes(plan: WorkoutPlan | undefined, workouts: { duration_minutes: number | null }[]) {
  const remoteMinutes = workouts.reduce((sum, workout) => sum + (workout.duration_minutes ?? 0), 0);
  if (remoteMinutes > 0) return remoteMinutes;
  return (plan?.days.length ?? 0) * 45;
}

function buildPreviewDays(category: WorkoutPlan['category'], level: WorkoutPlan['level']) {
  const volume = level === 'advanced' ? 5 : level === 'steady' ? 4 : 3;
  const templates: Record<WorkoutPlan['category'], string[]> = {
    calisthenics: ['Push + core', 'Legs + mobility', 'Pull + core', 'Full body', 'Skill practice'],
    cardio: ['Easy run', 'Intervals', 'Zone 2 walk/run', 'Tempo session', 'Recovery walk'],
    cycling: ['Endurance ride', 'Hill repeats', 'Easy spin', 'Tempo ride', 'Long ride'],
    gym: ['Upper body', 'Lower body', 'Push', 'Pull', 'Full body'],
  };
  return templates[category].slice(0, volume);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  spaced: { marginTop: spacing.xl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  metricRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metricTile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  heroImage: { width: '100%', height: 150, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHigh },
  workoutHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  inlineButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  choice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHigh,
  },
  choiceActive: { backgroundColor: palette.primary },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  exerciseImage: { width: 54, height: 54, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHighest,
  },
});
