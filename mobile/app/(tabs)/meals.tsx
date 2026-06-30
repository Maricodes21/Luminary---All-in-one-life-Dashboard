import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { calculateNutritionTargets, mealPrepSuggestion, type BodyGoal } from '@/lib/nutrition';
import { useProductionStore } from '@/stores/useProductionStore';

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const bodyProfile = useProductionStore((s) => s.bodyProfile);
  const updateBodyProfile = useProductionStore((s) => s.updateBodyProfile);
  const meals = useProductionStore((s) => s.meals);
  const mealPlan = useProductionStore((s) => s.mealPlan);
  const addMeal = useProductionStore((s) => s.addMeal);
  const generateMealPlan = useProductionStore((s) => s.generateMealPlan);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const targets = calculateNutritionTargets(bodyProfile);
  const todayMeals = meals.filter((meal) => meal.mealDate === today);
  const totals = todayMeals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      proteinG: sum.proteinG + meal.proteinG,
      carbsG: sum.carbsG + meal.carbsG,
      fatG: sum.fatG + meal.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const suggestion = useMemo(() => mealPrepSuggestion(bodyProfile.goal), [bodyProfile.goal]);

  const onAddMeal = () => {
    const parsedCalories = Number(calories);
    if (!mealName.trim() || !Number.isFinite(parsedCalories) || parsedCalories <= 0) return;
    addMeal({
      name: mealName.trim(),
      mealType: 'snack',
      calories: parsedCalories,
      proteinG: Math.round(parsedCalories * 0.25 / 4),
      carbsG: Math.round(parsedCalories * 0.45 / 4),
      fatG: Math.round(parsedCalories * 0.3 / 9),
      prep: suggestion,
    });
    setMealName('');
    setCalories('');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Meals</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
        Fuel, without the noise
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <SectionLabel>Daily target</SectionLabel>
        <Text style={[type.displayLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
          {Math.max(0, targets.calories - totals.calories)}
        </Text>
        <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
          calories left from {targets.calories} target / maintenance {targets.maintenanceCalories}
        </Text>
        <Macro label="Protein" value={totals.proteinG} target={targets.proteinG} color={palette.primary} />
        <Macro label="Carbs" value={totals.carbsG} target={targets.carbsG} color={palette.secondary} />
        <Macro label="Fat" value={totals.fatG} target={targets.fatG} color={palette.tertiary} />
      </Card>

      <Card style={{ marginTop: spacing.md }} variant="recessed">
        <SectionLabel>Goal</SectionLabel>
        <View style={styles.goalRow}>
          {(['lose', 'maintain', 'gain'] as BodyGoal[]).map((goal) => (
            <Pressable
              key={goal}
              onPress={() => updateBodyProfile({ goal })}
              style={[styles.goalButton, bodyProfile.goal === goal && styles.goalButtonActive]}
            >
              <Text
                style={[
                  type.labelMd,
                  { color: bodyProfile.goal === goal ? palette.onPrimary : palette.onSurfaceVariant },
                ]}
              >
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.sm }]}>{suggestion}</Text>
      </Card>

      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Log a meal</Text>
        <Card>
          <TextInput
            value={mealName}
            onChangeText={setMealName}
            placeholder="Meal name"
            placeholderTextColor={palette.onSurfaceVariant}
            style={styles.input}
          />
          <TextInput
            value={calories}
            onChangeText={setCalories}
            placeholder="Calories"
            placeholderTextColor={palette.onSurfaceVariant}
            keyboardType="numeric"
            style={styles.input}
          />
          <Pressable onPress={onAddMeal} style={styles.primaryButton}>
            <Text style={[type.labelMd, { color: palette.onPrimary }]}>Log meal</Text>
          </Pressable>
        </Card>
      </View>

      <View style={styles.spaced}>
        <View style={styles.sectionHeader}>
          <Text style={[type.headlineMd, { color: palette.onSurface }]}>Weekly plan</Text>
          <Pressable onPress={generateMealPlan}>
            <Text style={[type.labelMd, { color: palette.primary }]}>Create</Text>
          </Pressable>
        </View>
        {mealPlan.length > 0 ? (
          mealPlan.map((day) => (
            <Card key={day.id} style={{ marginBottom: spacing.sm }}>
              <SectionLabel>{day.day}</SectionLabel>
              <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>
                {day.breakfast} / {day.lunch} / {day.dinner}
              </Text>
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>{day.prep}</Text>
            </Card>
          ))
        ) : (
          <Card variant="recessed">
            <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
              Create a week that matches your body data and goal.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function Macro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={styles.macroRow}>
        <Text style={[type.labelMd, { color: palette.onSurface }]}>{label}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
          {value}g / {target}g
        </Text>
      </View>
      <ProgressBar value={value} max={target || 1} color={color} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  goalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  goalButtonActive: { backgroundColor: palette.primary },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  input: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
