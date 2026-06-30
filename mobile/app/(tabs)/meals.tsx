import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { Chip } from '@/components/ui/Chip';
import { calculateNutritionTargets, type BodyGoal } from '@/lib/nutrition';
import { useProductionStore, type MealLog } from '@/stores/useProductionStore';
import { mealPresets, type MealPreset } from '@/lib/modulePresets';

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const bodyProfile = useProductionStore((s) => s.bodyProfile);
  const updateBodyProfile = useProductionStore((s) => s.updateBodyProfile);
  const meals = useProductionStore((s) => s.meals);
  const mealPlan = useProductionStore((s) => s.mealPlan);
  const addMeal = useProductionStore((s) => s.addMeal);
  const generateMealPlan = useProductionStore((s) => s.generateMealPlan);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedType, setSelectedType] = useState<MealPreset['mealType']>('snack');

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

  const filteredPresets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mealPresets;
    return mealPresets.filter((meal) => meal.name.toLowerCase().includes(term) || meal.mealType.includes(term));
  }, [searchTerm]);

  const onAddPreset = (preset: MealPreset) => {
    addMeal(preset);
    setLogSheetOpen(false);
  };

  const onAddManualMeal = () => {
    const parsedCalories = Number(calories);
    if (!mealName.trim() || !Number.isFinite(parsedCalories) || parsedCalories <= 0) return;
    addMeal({
      name: mealName.trim(),
      mealType: selectedType,
      calories: parsedCalories,
      proteinG: Math.round((parsedCalories * 0.25) / 4),
      carbsG: Math.round((parsedCalories * 0.45) / 4),
      fatG: Math.round((parsedCalories * 0.3) / 9),
      prep: 'Manual entry. Adjust macros later when the food database lands.',
    });
    setMealName('');
    setCalories('');
    setLogSheetOpen(false);
  };

  const onCreatePlan = () => {
    generateMealPlan();
    setPlannerOpen(true);
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
            <SectionLabel>Meals</SectionLabel>
            <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
              Fuel, without the noise
            </Text>
          </View>
          <Pressable onPress={() => setLogSheetOpen(true)} style={styles.headerAction} accessibilityRole="button">
            <Icon name="plus" color={palette.onPrimary} size={20} />
          </Pressable>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.targetHeader}>
            <View>
              <SectionLabel>Daily target</SectionLabel>
              <Text style={[type.displayLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                {Math.max(0, targets.calories - totals.calories)}
              </Text>
              <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
                calories left from {targets.calories} target
              </Text>
            </View>
            <View style={styles.goalStack}>
              {(['lose', 'maintain', 'gain'] as BodyGoal[]).map((goal) => (
                <Pressable
                  key={goal}
                  onPress={() => updateBodyProfile({ goal })}
                  style={[styles.goalButton, bodyProfile.goal === goal && styles.goalButtonActive]}
                >
                  <Text
                    style={[
                      type.labelSm,
                      { color: bodyProfile.goal === goal ? palette.onPrimary : palette.onSurfaceVariant },
                    ]}
                  >
                    {goal}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Macro label="Protein" value={totals.proteinG} target={targets.proteinG} color={palette.primary} />
          <Macro label="Carbs" value={totals.carbsG} target={targets.carbsG} color={palette.secondary} />
          <Macro label="Fat" value={totals.fatG} target={targets.fatG} color={palette.tertiary} />
        </Card>

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Log a meal</Text>
          <View style={styles.actionGrid}>
            <QuickActionTile
              icon="search"
              label="Search"
              detail="Foods, meals, and recents"
              accent={palette.primary}
              onPress={() => setLogSheetOpen(true)}
            />
            <QuickActionTile
              icon="camera"
              label="Scan meal"
              detail="AI photo read stub"
              accent={palette.secondary}
              onPress={() => setLogSheetOpen(true)}
            />
            <QuickActionTile
              icon="barcode"
              label="Barcode"
              detail="Packaged foods"
              accent={palette.tertiary}
              onPress={() => setLogSheetOpen(true)}
            />
          </View>
        </View>

        <View style={styles.spaced}>
          <View style={styles.sectionHeader}>
            <Text style={[type.headlineMd, { color: palette.onSurface }]}>Today</Text>
            <Pressable onPress={() => setLogSheetOpen(true)}>
              <Text style={[type.labelMd, { color: palette.primary }]}>Quick add</Text>
            </Pressable>
          </View>
          {todayMeals.length > 0 ? (
            todayMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          ) : (
            <Card variant="recessed">
              <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                No meals logged yet. Start with a preset, search, scan, or manual entry.
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.spaced}>
          <View style={styles.sectionHeader}>
            <Text style={[type.headlineMd, { color: palette.onSurface }]}>Weekly plan</Text>
            <Pressable onPress={onCreatePlan}>
              <Text style={[type.labelMd, { color: palette.primary }]}>{mealPlan.length ? 'Open' : 'Create'}</Text>
            </Pressable>
          </View>
          {mealPlan.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planStrip}>
              {mealPlan.map((day, index) => (
                <PlanDayCard key={day.id} day={day} imageUrl={mealPresets[index % mealPresets.length].imageUrl} />
              ))}
            </ScrollView>
          ) : (
            <Card variant="recessed">
              <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                Generate a flexible week, then swap meals around your goal and appetite.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <ActionSheet visible={logSheetOpen} onClose={() => setLogSheetOpen(false)} eyebrow="Meal logger" title="Add food fast">
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={palette.onSurfaceVariant} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search foods or meals"
            placeholderTextColor={palette.onSurfaceVariant}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.actionGrid}>
          <QuickActionTile icon="camera" label="Scan meal" detail="Photo recognition stub" accent={palette.secondary} />
          <QuickActionTile icon="barcode" label="Scan barcode" detail="Camera permission later" accent={palette.tertiary} />
        </View>
        <SectionLabel>Quick add</SectionLabel>
        {filteredPresets.map((preset) => (
          <MealPresetRow key={preset.name} preset={preset} onPress={() => onAddPreset(preset)} />
        ))}
        <Card variant="featured">
          <SectionLabel>Manual fallback</SectionLabel>
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
          <View style={styles.typeRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
              <Chip
                key={mealType}
                label={mealType}
                selected={selectedType === mealType}
                onPress={() => setSelectedType(mealType)}
              />
            ))}
          </View>
          <Pressable onPress={onAddManualMeal} style={styles.primaryButton}>
            <Text style={[type.labelMd, { color: palette.onPrimary }]}>Log meal</Text>
          </Pressable>
        </Card>
      </ActionSheet>

      <ActionSheet visible={plannerOpen} onClose={() => setPlannerOpen(false)} eyebrow="Weekly planner" title="Generate, swap, prep">
        {mealPlan.length === 0 ? (
          <Pressable onPress={onCreatePlan} style={styles.primaryButton}>
            <Text style={[type.labelMd, { color: palette.onPrimary }]}>Create weekly plan</Text>
          </Pressable>
        ) : (
          mealPlan.map((day, index) => (
            <Card key={day.id} variant="featured">
              <View style={styles.planDetailHeader}>
                <Image source={{ uri: mealPresets[index % mealPresets.length].imageUrl }} style={styles.planImage} />
                <View style={{ flex: 1 }}>
                  <SectionLabel>{day.day}</SectionLabel>
                  <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                    {day.breakfast}
                  </Text>
                  <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                    {day.lunch} / {day.dinner}
                  </Text>
                </View>
              </View>
              <View style={styles.planActions}>
                <Chip label="Lock favorite" />
                <Chip label="Substitute" accent={palette.secondary} />
                <Chip label="Prep list" accent={palette.tertiary} />
              </View>
            </Card>
          ))
        )}
      </ActionSheet>
    </>
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

function MealCard({ meal }: { meal: MealLog }) {
  const preset = mealPresets.find((item) => item.name === meal.name) ?? mealPresets[0];
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={styles.mealCardRow}>
        <Image source={{ uri: preset.imageUrl }} style={styles.mealImage} />
        <View style={{ flex: 1 }}>
          <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{meal.mealType}</Text>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: 2 }]}>{meal.name}</Text>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
            P {meal.proteinG}g / C {meal.carbsG}g / F {meal.fatG}g
          </Text>
        </View>
        <Text style={[type.titleMd, { color: palette.onSurface }]}>{meal.calories} cal</Text>
      </View>
    </Card>
  );
}

function MealPresetRow({ preset, onPress }: { preset: MealPreset; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.presetRow} accessibilityRole="button">
      <Image source={{ uri: preset.imageUrl }} style={styles.presetImage} />
      <View style={{ flex: 1 }}>
        <Text style={[type.titleMd, { color: palette.onSurface }]}>{preset.name}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
          {preset.calories} cal / P {preset.proteinG}g
        </Text>
      </View>
      <Icon name="plus" size={18} color={palette.primary} />
    </Pressable>
  );
}

function PlanDayCard({ day, imageUrl }: { day: { day: string; breakfast: string; lunch: string; dinner: string }; imageUrl: string }) {
  return (
    <Card style={styles.planCard}>
      <Image source={{ uri: imageUrl }} style={styles.planThumb} />
      <SectionLabel>{day.day}</SectionLabel>
      <Text style={[type.titleMd, { color: palette.onSurface, marginTop: spacing.xs }]} numberOfLines={2}>
        {day.breakfast}
      </Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]} numberOfLines={2}>
        {day.lunch} / {day.dinner}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  spaced: { marginTop: spacing.xl },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  goalStack: { gap: spacing.sm, minWidth: 92 },
  goalButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  goalButtonActive: { backgroundColor: palette.primary },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, color: palette.onSurface, paddingVertical: spacing.md },
  input: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  mealCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mealImage: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  presetImage: { width: 58, height: 58, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  planStrip: { gap: spacing.sm, paddingRight: spacing.md },
  planCard: { width: 210 },
  planThumb: { width: '100%', height: 96, borderRadius: radii.md, marginBottom: spacing.sm },
  planDetailHeader: { flexDirection: 'row', gap: spacing.md },
  planImage: { width: 76, height: 76, borderRadius: radii.md },
  planActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
