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
  const { workouts, isLoading } = useHealthMetrics();
  const [category, setCategory] = useState<WorkoutPlan['category']>('calisthenics');
  const [level, setLevel] = useState<WorkoutPlan['level']>('steady');
  const workoutPlans = useProductionStore((s) => s.workoutPlans);
  const createWorkoutPlan = useProductionStore((s) => s.createWorkoutPlan);
  const latestPlan = workoutPlans[0];

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
          <View style={styles.metricTile}>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>--</Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>steps</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>--</Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>bpm</Text>
          </View>
        </View>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
          Connect Health Connect to read steps, heart rate, and sleep where permissions allow it.
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  metricRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metricTile: {
    flex: 1,
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
