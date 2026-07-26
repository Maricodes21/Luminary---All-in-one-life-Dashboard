import { useMemo, useState } from 'react';
import { Linking, ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { ChoiceGroup } from '@/components/ui';
import { ExerciseVisual } from '@/components/health/ExerciseVisual';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useProductionStore, type WorkoutPlan } from '@/stores/useProductionStore';
import { buildWorkoutPlan, type PlannedExercise, type PlannedExerciseAlternative, type WorkoutSession } from '@/lib/workoutPlanning';

const categories: WorkoutPlan['category'][] = ['calisthenics', 'cardio', 'cycling', 'gym'];
const levels: WorkoutPlan['level'][] = ['beginner', 'steady', 'advanced'];
const timeOptions = ['25 min', '40 min', '55 min'];

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, latestMetric, isLoading } = useHealthMetrics();
  const [category, setCategory] = useState<WorkoutPlan['category']>('calisthenics');
  const [level, setLevel] = useState<WorkoutPlan['level']>('steady');
  const [timeAvailable, setTimeAvailable] = useState('40 min');
  const [connectOpen, setConnectOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [healthPermissionMessage, setHealthPermissionMessage] = useState<string | null>(null);
  const [replacements, setReplacements] = useState<Record<string, PlannedExerciseAlternative>>({});
  const workoutPlans = useProductionStore((s) => s.workoutPlans);
  const workoutLogs = useProductionStore((s) => s.workoutLogs);
  const createWorkoutPlan = useProductionStore((s) => s.createWorkoutPlan);
  const completeWorkout = useProductionStore((s) => s.completeWorkout);
  const latestPlan = workoutPlans[0];
  const hasLiveMetrics = !!latestMetric;
  const planCategory = latestPlan?.category ?? category;
  const selectedDuration = Number(timeAvailable.replace(/\D/g, '')) || 40;
  const previewSessions = useMemo(
    () => buildWorkoutPlan({ category, level, durationMinutes: selectedDuration }),
    [category, level, selectedDuration],
  );
  const planSessions = useMemo(
    () => hasCurrentWorkoutSessions(latestPlan?.sessions)
      ? latestPlan.sessions
      : latestPlan
        ? buildWorkoutPlan({ category: latestPlan.category, level: latestPlan.level, durationMinutes: latestPlan.durationMinutes ?? 40, seed: latestPlan.weekOf })
        : previewSessions,
    [latestPlan, previewSessions],
  );
  const todaySession = planSessions[0];
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
  const loggedWorkouts = [
    ...workoutLogs.map((workout) => ({
      id: workout.id,
      title: workout.title,
      workoutType: workout.workoutType,
      workoutDate: workout.workoutDate,
      durationMinutes: workout.durationMinutes,
    })),
    ...workouts.map((workout) => ({
      id: workout.id,
      title: workout.workout_type,
      workoutType: workout.workout_type,
      workoutDate: workout.workout_date,
      durationMinutes: workout.duration_minutes ?? 0,
    })),
  ];

  const onCreatePlan = () => {
    createWorkoutPlan(category, level, selectedDuration);
    setReplacements({});
    setPlannerOpen(true);
  };

  const onRequestHealthPermissions = async () => {
    setHealthPermissionMessage('Opening Android app settings. Native Health Connect permissions are not wired yet.');
    await Linking.openSettings().catch(() => {
      setHealthPermissionMessage('Could not open settings from the emulator. Check Android app permissions manually.');
    });
  };

  const onReplaceExercise = (session: WorkoutSession, exercise: PlannedExercise) => {
    const key = `${session.id}:${exercise.id}`;
    const original = withoutAlternatives(exercise);
    const options = [original, ...exercise.alternatives];
    const current = replacements[key] ?? original;
    const currentIndex = options.findIndex((option) => option.id === current.id);
    const next = options[(currentIndex + 1) % options.length];
    setReplacements((state) => {
      if (next.id === exercise.id) {
        const updated = { ...state };
        delete updated[key];
        return updated;
      }
      return { ...state, [key]: next };
    });
  };

  const onCompleteWorkout = (session: WorkoutSession) => {
    completeWorkout({
      title: session.title,
      workoutType: planCategory,
      durationMinutes: session.durationMinutes,
      notes: session.exercises.map((exercise) => replacements[`${session.id}:${exercise.id}`]?.name ?? exercise.name).join(', '),
    });
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

        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[type.headlineMd, { color: palette.onSurface }]}>Today's workout</Text>
            <Text style={[type.labelSm, { color: palette.primary }]}>Recommended</Text>
          </View>
          <Card variant="featured" padding="sm">
            <ExerciseVisual visualId={todaySession.exercises[0]?.visualId ?? 'home_pushup'} style={styles.heroImage} />
            <View style={styles.workoutHeroContent}>
              <View style={{ flex: 1 }}>
                <Text style={[type.titleLg, { color: palette.onSurface }]}>
                  {latestPlan ? todaySession.title : 'Build your week'}
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                  {latestPlan?.durationMinutes ?? selectedDuration} min / {latestPlan?.level ?? level} / {categoryLabel(planCategory)}
                </Text>
              </View>
              <Pressable onPress={latestPlan ? () => setPlannerOpen(true) : onCreatePlan} style={styles.inlineButton}>
                <Text style={[type.labelMd, { color: palette.onPrimary }]}>{latestPlan ? 'Open' : 'Create'}</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <Card style={styles.spaced}>
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
              : 'Connect when you want body metrics here. Your workout plan still works without it.'}
          </Text>
        </Card>

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Plan setup</Text>
          <Card>
            <SectionLabel>Exercise variety</SectionLabel>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              Each day gets movements that match its focus, your setting, level, available time, and progression week.
            </Text>
            <View style={styles.choiceFields}>
              <ChoiceGroup
                label="Category"
                value={category}
                options={categories.map((item) => ({ value: item, label: categoryLabel(item) }))}
                onChange={setCategory}
              />
              <ChoiceGroup
                label="Level"
                value={level}
                options={levels.map((item) => ({ value: item, label: formatLabel(item) }))}
                onChange={setLevel}
              />
              <ChoiceGroup
                label="Time"
                value={timeAvailable}
                options={timeOptions.map((item) => ({ value: item, label: item }))}
                onChange={setTimeAvailable}
              />
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
                  {categoryLabel(latestPlan.category)} / {latestPlan.level}
                </Text>
              </View>
              <Pressable onPress={() => setPlannerOpen(true)}>
                <Text style={[type.labelMd, { color: palette.primary }]}>View full</Text>
              </Pressable>
            </View>
            {planSessions.map((session, index) => (
              <View key={session.id} style={{ marginTop: spacing.sm }}>
                <View style={styles.planRow}>
                  <Text style={[type.labelMd, { color: palette.onSurface }]}>Day {index + 1}</Text>
                  <View style={styles.planRowDetail}>
                    <Text style={[type.bodySm, { color: palette.onSurface }]}>{session.title}</Text>
                    <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{session.durationMinutes} min · {session.exercises.length} movements</Text>
                  </View>
                </View>
                <ProgressBar value={index + 1} max={planSessions.length} color={palette.tertiary} style={{ marginTop: spacing.xs }} />
              </View>
            ))}
          </Card>
        )}

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Logged workouts</Text>
          {isLoading ? (
            <ActivityIndicator color={palette.primary} />
          ) : loggedWorkouts.length > 0 ? (
            loggedWorkouts.map((workout) => (
              <Card key={workout.id} style={{ marginBottom: spacing.sm }}>
                <Text style={[type.labelMd, { color: palette.onSurface }]}>{workout.title}</Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                  {workout.workoutDate} / {workout.durationMinutes || '--'} min / {workout.workoutType}
                </Text>
              </Card>
            ))
          ) : (
            <Card variant="recessed">
              <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                No workouts logged yet. Create a week, then mark each session complete when you finish.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <ActionSheet visible={connectOpen} onClose={() => setConnectOpen(false)} eyebrow="Permissioned data" title="Connect Health services">
        <QuickActionTile
          icon="health"
          label="Health Connect"
          detail="Steps, heart rate, sleep, and workouts"
          accent={palette.tertiary}
          onPress={onRequestHealthPermissions}
        />
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Luminary should request only the metrics it can explain: steps, heart rate, sleep, and workout sessions.
          Users can revoke access at any time from Android settings.
        </Text>
        {healthPermissionMessage ? (
          <Text style={[type.bodySm, { color: palette.primary }]}>{healthPermissionMessage}</Text>
        ) : null}
        <Pressable onPress={onRequestHealthPermissions} style={styles.primaryButton} accessibilityRole="button">
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>Request permissions</Text>
        </Pressable>
      </ActionSheet>

      <ActionSheet visible={plannerOpen} onClose={() => setPlannerOpen(false)} eyebrow="Workout plan" title="Review and substitute">
        {planSessions.map((session, index) => (
          <Card key={session.id} variant="featured">
            <SectionLabel>Day {index + 1}</SectionLabel>
            <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>{session.title}</Text>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              {session.durationMinutes} min · {session.focus}
            </Text>
            <View style={styles.sessionNote}>
              <Text style={[type.labelSm, { color: palette.primary }]}>Warm up</Text>
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>{session.warmup}</Text>
            </View>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {session.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  replacement={replacements[`${session.id}:${exercise.id}`]}
                  onReplace={() => onReplaceExercise(session, exercise)}
                />
              ))}
            </View>
            <View style={styles.progressionNote}>
              <Text style={[type.labelSm, { color: palette.primary }]}>Progressive overload</Text>
              <Text style={[type.bodySm, { color: palette.onSurface }]}>{session.progression}</Text>
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>{session.cooldown}</Text>
            </View>
            <Pressable onPress={() => onCompleteWorkout(session)} style={styles.primaryButton}>
              <Text style={[type.labelMd, { color: palette.onPrimary }]}>Complete workout</Text>
            </Pressable>
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
  exercise: PlannedExercise;
  replacement?: PlannedExerciseAlternative;
  onReplace: () => void;
}) {
  const shown = replacement ?? exercise;
  return (
    <View style={styles.exerciseRow}>
      <ExerciseVisual visualId={shown.visualId} style={styles.exerciseImage} />
      <View style={{ flex: 1 }}>
        <Text style={[type.titleMd, { color: palette.onSurface }]}>{shown.name}</Text>
        <Text style={[type.labelSm, { color: palette.primary, marginTop: 2 }]}>{shown.prescription}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{shown.cue}</Text>
      </View>
      <Pressable onPress={onReplace} style={styles.replaceButton}>
        <Icon name="swap" size={16} color={palette.primary} />
        <Text style={[type.labelSm, { color: palette.primary }]}>Swap</Text>
      </Pressable>
    </View>
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

function withoutAlternatives(exercise: PlannedExercise): PlannedExerciseAlternative {
  const { alternatives: _alternatives, ...details } = exercise;
  return details;
}

function hasCurrentWorkoutSessions(sessions: WorkoutSession[] | undefined): sessions is WorkoutSession[] {
  return Boolean(
    sessions?.length
    && sessions.every((session) => session.exercises.every((exercise) =>
      typeof exercise.visualId === 'string'
      && exercise.alternatives.every((alternative) => typeof alternative === 'object' && typeof alternative.visualId === 'string'),
    )),
  );
}

function categoryLabel(category: WorkoutPlan['category']) {
  if (category === 'calisthenics') return 'Home';
  return formatLabel(category);
}

function estimateWeeklyMinutes(plan: WorkoutPlan | undefined, workouts: { duration_minutes: number | null }[]) {
  const remoteMinutes = workouts.reduce((sum, workout) => sum + (workout.duration_minutes ?? 0), 0);
  if (remoteMinutes > 0) return remoteMinutes;
  return (plan?.days.length ?? 0) * (plan?.durationMinutes ?? 40);
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
  choiceFields: { gap: spacing.md, marginTop: spacing.md },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  planRowDetail: { flex: 1, alignItems: 'flex-end', gap: spacing.xs },
  sessionNote: { gap: spacing.xs, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  progressionNote: { gap: spacing.xs, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
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
