import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useMeals } from '@/hooks/useMeals';

type HealthTab = 'movement' | 'nutrition';

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<HealthTab>('movement');
  const { workouts, isLoading: loadingHealth } = useHealthMetrics();
  const { meals, isLoading: loadingMeals } = useMeals();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <SectionLabel>Wellness</SectionLabel>
        <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
          Your body in your own words
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segments}>
        <Pressable
          onPress={() => setView('movement')}
          style={[styles.segment, view === 'movement' && styles.segmentActive]}
        >
          <Text style={[type.labelMd, view === 'movement' ? { color: palette.onSurface } : { color: palette.onSurfaceVariant }]}>
            Movement
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('nutrition')}
          style={[styles.segment, view === 'nutrition' && styles.segmentActive]}
        >
          <Text style={[type.labelMd, view === 'nutrition' ? { color: palette.onSurface } : { color: palette.onSurfaceVariant }]}>
            Nutrition
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {view === 'movement' && (
          <View>
            {loadingHealth ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
            ) : (
              <>
                <Card style={{ marginTop: spacing.lg }}>
                  <SectionLabel>Today's Activity</SectionLabel>
                  <View style={styles.ringsPlaceholder}>
                    <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>
                      Connect Apple Health or Google Fit to sync step data.
                    </Text>
                  </View>
                </Card>

                <View style={styles.spaced}>
                  <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Workouts</Text>
                  {workouts.length > 0 ? (
                    workouts.map((w) => (
                      <Card key={w.id} style={{ marginBottom: spacing.sm }}>
                        <Text style={[type.labelMd, { color: palette.onSurface }]}>
                          {w.workout_type === 'gym' ? 'Gym Session' : 'Home Workout'}
                        </Text>
                        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                          {w.workout_date} • {w.duration_minutes || '--'} min
                        </Text>
                      </Card>
                    ))
                  ) : (
                    <Card variant="recessed">
                      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>No workouts tracked yet.</Text>
                    </Card>
                  )}
                </View>

                <View style={styles.spaced}>
                  <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Vitals</Text>
                  <Card variant="recessed">
                    <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                      Resting Heart Rate: -- bpm{'\n'}Sleep Score: --
                    </Text>
                  </Card>
                </View>
              </>
            )}
          </View>
        )}

        {view === 'nutrition' && (
          <View>
            {loadingMeals ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
            ) : (
              <>
                <Card style={{ marginTop: spacing.lg }}>
                  <SectionLabel>Daily Macros</SectionLabel>
                  <View style={{ marginTop: spacing.sm }}>
                    <View style={styles.macroRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>Protein</Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>0g / 150g</Text>
                    </View>
                    <ProgressBar value={0} max={100} color={palette.primary} style={{ marginTop: spacing.xs, marginBottom: spacing.md }} />

                    <View style={styles.macroRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>Carbs</Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>0g / 200g</Text>
                    </View>
                    <ProgressBar value={0} max={100} color={palette.secondary} style={{ marginTop: spacing.xs, marginBottom: spacing.md }} />

                    <View style={styles.macroRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>Fats</Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>0g / 65g</Text>
                    </View>
                    <ProgressBar value={0} max={100} color={palette.tertiary} style={{ marginTop: spacing.xs }} />
                  </View>
                </Card>

                <View style={styles.spaced}>
                  <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Meals Today</Text>
                  {meals.length > 0 ? (
                    meals.map((m) => (
                      <Card key={m.id} style={{ marginBottom: spacing.sm }}>
                        <Text style={[type.labelMd, { color: palette.onSurface }]}>{m.name}</Text>
                        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                          {m.calories || '--'} kcal
                        </Text>
                      </Card>
                    ))
                  ) : (
                    <Card variant="recessed">
                      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>No meals tracked today.</Text>
                    </Card>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  header: { paddingHorizontal: spacing.md },
  segments: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  segmentActive: {
    backgroundColor: palette.surfaceContainerHigh,
  },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  ringsPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: palette.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
