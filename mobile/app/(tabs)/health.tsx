import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useProductionStore, type WorkoutPlan } from '@/stores/useProductionStore';

const categories: WorkoutPlan['category'][] = ['calisthenics', 'cardio', 'cycling', 'gym'];
const levels: WorkoutPlan['level'][] = ['beginner', 'steady', 'advanced'];

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, latestMetric, isLoading } = useHealthMetrics();
  const [category, setCategory] = useState<WorkoutPlan['category']>('calisthenics');
  const [level, setLevel] = useState<WorkoutPlan['level']>('steady');
  const workoutPlans = useProductionStore((s) => s.workoutPlans);
  const createWorkoutPlan = useProductionStore((s) => s.createWorkoutPlan);
  const latestPlan = workoutPlans[0];
  const hasLiveMetrics = !!latestMetric;
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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Physical health</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Movement</Text>
      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        Health Connect first. Your body data stays permissioned.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <SectionLabel>Health Connect</SectionLabel>
        <View style={styles.metricRow}>
          {metricTiles.map((tile) => (
            <View key={tile.label} style={styles.metricTile}>
              <Text
                style={[type.displayMd, { color: palette.onSurface }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
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
            : 'No synced body metrics yet, so this falls back to your current plan and logged workouts.'}
        </Text>
      </Card>

      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Weekly plan setup</Text>
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
          <Pressable onPress={() => createWorkoutPlan(category, level)} style={styles.primaryButton}>
            <Text style={[type.labelMd, { color: palette.onPrimary }]}>Create your plan for the week</Text>
          </Pressable>
        </Card>
      </View>

      {latestPlan && (
        <Card style={{ marginTop: spacing.md }} variant="featured">
          <SectionLabel>This week</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
            {latestPlan.category} / {latestPlan.level}
          </Text>
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
              No workouts logged yet. Build the week first; logging comes after.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  metricRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metricTile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
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
});
