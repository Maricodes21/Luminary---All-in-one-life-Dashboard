import { useMemo, useState, type ComponentProps } from 'react';
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
import { useProductionStore, type MealLog, type MealPlanDay, type MealPlanSlot } from '@/stores/useProductionStore';
import { mealPresets, type MealPreset } from '@/lib/modulePresets';
import { getAllLibraryMeals, getSubstitutionsForMeal } from '@/lib/contentLibrary';

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
  const [selectedPlanDay, setSelectedPlanDay] = useState<MealPlanDay | null>(null);
  const [selectedPlanMeal, setSelectedPlanMeal] = useState<{ label: string; slot: MealPlanSlot } | null>(null);
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
  const proteinRemaining = Math.max(0, targets.proteinG - totals.proteinG);
  const dinnerIdeas = useMemo(
    () => mealPresets.filter((meal) => meal.mealType === 'dinner').slice(0, 3),
    [],
  );
  const activePlanDay = selectedPlanDay ?? mealPlan[0] ?? null;
  const activePlannedDay = activePlanDay ? normalizePlanDay(activePlanDay) : null;

  const filteredPresets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mealPresets;
    return mealPresets.filter(
      (meal) =>
        meal.name.toLowerCase().includes(term) ||
        meal.mealType.includes(term) ||
        meal.ingredients?.some((ingredient) => ingredient.toLowerCase().includes(term)),
    );
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
      prep: 'Manual entry. You can adjust macros after logging.',
    });
    setMealName('');
    setCalories('');
    setLogSheetOpen(false);
  };

  const onCreatePlan = () => {
    generateMealPlan();
    setSelectedPlanDay(null);
    setSelectedPlanMeal(null);
    setPlannerOpen(true);
  };

  const onOpenPlanDay = (day: MealPlanDay) => {
    setSelectedPlanDay(day);
    setSelectedPlanMeal(null);
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
            <CalorieRing value={totals.calories} target={targets.calories} />
            <View style={styles.targetDetails}>
              <Macro label="Protein" value={totals.proteinG} target={targets.proteinG} color={palette.primary} />
              <Macro label="Carbs" value={totals.carbsG} target={targets.carbsG} color={palette.secondary} />
              <Macro label="Fat" value={totals.fatG} target={targets.fatG} color={palette.tertiary} />
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
        </Card>

        {proteinRemaining >= 20 ? (
          <Card variant="recessed" style={styles.spacedSm}>
            <View style={styles.suggestionHeader}>
              <Icon name="meals" size={20} color={palette.primary} />
              <View style={{ flex: 1 }}>
                <SectionLabel>Suggestion</SectionLabel>
                <Text style={[type.titleMd, { color: palette.onSurface, marginTop: 2 }]}>
                  {proteinRemaining}g short on protein. Three dinner ideas.
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]} numberOfLines={2}>
                  {dinnerIdeas.map((meal) => meal.name).join(' / ')}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionCarousel}
            >
              {dinnerIdeas.map((preset) => (
                <MealSuggestionCard key={preset.name} preset={preset} onPress={() => onAddPreset(preset)} />
              ))}
            </ScrollView>
          </Card>
        ) : null}

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Log a meal</Text>
          <View style={styles.logActions}>
            <QuickActionTile
              icon="search"
              label="Search foods and meals"
              detail="Fastest for staples, recents, and known foods"
              accent={palette.primary}
              onPress={() => setLogSheetOpen(true)}
              style={styles.searchTile}
            />
            <View style={styles.secondaryActionRow}>
              <SmallAction icon="camera" label="Scan meal" onPress={() => setLogSheetOpen(true)} />
              <SmallAction icon="barcode" label="Barcode" onPress={() => setLogSheetOpen(true)} accent={palette.tertiary} />
              <SmallAction icon="plus" label="Manual entry" onPress={() => setLogSheetOpen(true)} accent={palette.secondary} />
            </View>
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
            <Pressable
              onPress={mealPlan.length ? () => onOpenPlanDay(mealPlan[0]) : onCreatePlan}
              accessibilityRole="button"
            >
              <Text style={[type.labelMd, { color: palette.primary }]}>{mealPlan.length ? 'Open' : 'Create'}</Text>
            </Pressable>
          </View>
          {mealPlan.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.planCarousel}
            >
              {mealPlan.map((day) => (
                <PlanDayPreview key={day.id} day={day} onPress={() => onOpenPlanDay(day)} />
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
        <View style={styles.secondaryActionRow}>
          <SmallAction icon="camera" label="Scan meal" onPress={() => undefined} />
          <SmallAction icon="barcode" label="Barcode" onPress={() => undefined} accent={palette.tertiary} />
          <SmallAction icon="plus" label="Manual entry" onPress={() => undefined} accent={palette.secondary} />
        </View>
        <SectionLabel>Quick add</SectionLabel>
        {filteredPresets.map((preset) => (
          <MealPresetRow key={preset.name} preset={preset} onPress={() => onAddPreset(preset)} />
        ))}
        <Card variant="featured">
          <SectionLabel>Manual entry</SectionLabel>
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
        ) : activePlanDay && activePlannedDay ? (
          <Card variant="featured">
            <View style={styles.planDetailHeader}>
              <View>
                <SectionLabel>{activePlanDay.day}</SectionLabel>
                <Text style={[type.titleLg, { color: palette.onSurface, marginTop: 2 }]}>Day preview</Text>
              </View>
              <Text style={[type.labelMd, { color: palette.primary }]}>
                {sumPlanCalories(activePlannedDay)} cal
              </Text>
            </View>
            <View style={styles.mealSlotList}>
              <PlanMealRow label="Breakfast" slot={activePlannedDay.breakfast} onPress={() => setSelectedPlanMeal({ label: 'Breakfast', slot: activePlannedDay.breakfast })} />
              <PlanMealRow label="Lunch" slot={activePlannedDay.lunch} onPress={() => setSelectedPlanMeal({ label: 'Lunch', slot: activePlannedDay.lunch })} />
              <PlanMealRow label="Dinner" slot={activePlannedDay.dinner} onPress={() => setSelectedPlanMeal({ label: 'Dinner', slot: activePlannedDay.dinner })} />
              {activePlannedDay.snacks.map((snack, snackIndex) => {
                const label = activePlannedDay.snacks.length > 1 ? `Snack ${snackIndex + 1}` : 'Snack';
                return (
                  <PlanMealRow
                    key={`${snack.name}-${snackIndex}`}
                    label={label}
                    slot={snack}
                    onPress={() => setSelectedPlanMeal({ label, slot: snack })}
                  />
                );
              })}
            </View>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
              {activePlannedDay.prep}
            </Text>
            {selectedPlanMeal ? <PlanMealDetail label={selectedPlanMeal.label} slot={selectedPlanMeal.slot} /> : null}
          </Card>
        ) : null}
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

function CalorieRing({ value, target }: { value: number; target: number }) {
  const caloriesLeft = Math.max(0, target - value);
  const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={styles.calorieRing}>
      <Text
        style={[type.displaySm, { color: palette.onSurface, textAlign: 'center' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {caloriesLeft}
      </Text>
      <Text style={[type.labelSm, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>cal left</Text>
      <View style={styles.calorieMeter}>
        <View style={[styles.calorieMeterFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function SmallAction({
  icon,
  label,
  onPress,
  accent = palette.primary,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  accent?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.smallAction} accessibilityRole="button">
      <Icon name={icon} size={17} color={accent} />
      <Text style={[type.labelSm, { color: palette.onSurface }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
          {meal.source ? (
            <Text style={[type.labelSm, { color: palette.primary, marginTop: 2 }]}>{formatMealSource(meal.source)}</Text>
          ) : null}
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
          Found: {preset.calories} cal, {preset.proteinG}g protein. Adjust if needed.
        </Text>
        <Text style={[type.labelSm, { color: palette.primary, marginTop: 2 }]}>{formatMealSource(preset.source)}</Text>
      </View>
      <Icon name="plus" size={18} color={palette.primary} />
    </Pressable>
  );
}

function MealSuggestionCard({ preset, onPress }: { preset: MealPreset; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.suggestionMealCard} accessibilityRole="button">
      <Image source={{ uri: preset.imageUrl }} style={styles.suggestionMealImage} />
      <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>{preset.mealType}</Text>
      <Text style={[type.titleMd, { color: palette.onSurface, marginTop: 2 }]} numberOfLines={2}>
        {preset.name}
      </Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        {preset.calories} cal / P {preset.proteinG}g
      </Text>
      <Text style={[type.labelSm, { color: palette.primary, marginTop: spacing.xs }]}>Tap to log</Text>
    </Pressable>
  );
}

function PlanDayPreview({ day, onPress }: { day: MealPlanDay; onPress: () => void }) {
  const plannedDay = normalizePlanDay(day);
  const slots = [plannedDay.breakfast, plannedDay.lunch, plannedDay.dinner, ...plannedDay.snacks];
  const totalCalories = slots.reduce((sum, slot) => sum + slot.calories, 0);
  const totalProtein = slots.reduce((sum, slot) => sum + slot.proteinG, 0);

  return (
    <Pressable onPress={onPress} style={styles.planDayCard} accessibilityRole="button">
      <View style={styles.planDayTopline}>
        <Text style={[type.labelMd, { color: palette.onSurface }]}>{day.day}</Text>
        <Text style={[type.labelSm, { color: palette.primary }]}>{totalCalories} cal</Text>
      </View>
      <Text style={[type.titleMd, { color: palette.onSurface, marginTop: spacing.xs }]} numberOfLines={2}>
        {plannedDay.dinner.name}
      </Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        {slots.length} meals planned
      </Text>
      <Text style={[type.labelSm, { color: palette.secondary, marginTop: spacing.xs }]}>P {totalProtein}g total</Text>
    </Pressable>
  );
}

function PlanMealRow({
  label,
  slot,
  compact = false,
  onPress,
}: {
  label: string;
  slot: MealPlanSlot;
  compact?: boolean;
  onPress?: () => void;
}) {
  const substitution = getSubstitutionHint(slot.name);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.planMealRow, compact && styles.planMealRowCompact]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.mealSlotLabel}>
        <Text style={[type.labelSm, { color: palette.primary }]}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[compact ? type.bodySm : type.titleMd, { color: palette.onSurface }]} numberOfLines={compact ? 1 : 2}>
          {slot.name}
        </Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]} numberOfLines={compact ? 1 : 2}>
          {slot.calories} cal / P {slot.proteinG}g / {slot.note}
        </Text>
        {!compact && substitution ? (
          <Text style={[type.labelSm, { color: palette.secondary, marginTop: 2 }]}>{substitution}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PlanMealDetail({ label, slot }: { label: string; slot: MealPlanSlot }) {
  const prepSteps = slot.prepSteps && slot.prepSteps.length > 0
    ? slot.prepSteps
    : ['Prepare the main protein or base first.', 'Plate with the planned sides and adjust seasoning.'];
  const substitutions = slot.substitutions && slot.substitutions.length > 0 ? slot.substitutions : [getSubstitutionHint(slot.name)].filter(Boolean);

  return (
    <View style={styles.planMealDetail}>
      <SectionLabel>{label} prep</SectionLabel>
      <Text style={[type.titleMd, { color: palette.onSurface, marginTop: 2 }]}>{slot.name}</Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        {slot.calories} cal / {slot.proteinG}g protein / {slot.note}
      </Text>
      <View style={styles.prepList}>
        {prepSteps.map((step, index) => (
          <View key={`${slot.name}-prep-${index}`} style={styles.prepStep}>
            <Text style={[type.labelSm, { color: palette.primary }]}>{index + 1}</Text>
            <Text style={[type.bodySm, { color: palette.onSurface, flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </View>
      {substitutions.length > 0 ? (
        <Text style={[type.labelSm, { color: palette.secondary, marginTop: spacing.sm }]}>
          {substitutions.join(' / ')}
        </Text>
      ) : null}
    </View>
  );
}

function getSubstitutionHint(mealName: string) {
  const libraryMeal = getAllLibraryMeals().find((meal) => meal.name.toLowerCase() === mealName.toLowerCase());
  if (!libraryMeal) return null;
  const substitution = getSubstitutionsForMeal(libraryMeal.id)[0];
  return substitution ? `Swap ${substitution.replace} for ${substitution.with}` : null;
}

function formatMealSource(source: MealPreset['source'] | MealLog['source'] | undefined) {
  if (source === 'usda') return 'USDA nutrition';
  if (source === 'open_food_facts') return 'Open Food Facts';
  if (source === 'themealdb') return 'Recipe source';
  if (source === 'manual') return 'Manual';
  return 'Curated';
}

function sumPlanCalories(day: ReturnType<typeof normalizePlanDay>) {
  return [day.breakfast, day.lunch, day.dinner, ...day.snacks].reduce((sum, slot) => sum + slot.calories, 0);
}

function normalizePlanDay(day: MealPlanDay) {
  const legacyDay = day as unknown as {
    breakfast?: string | MealPlanSlot;
    lunch?: string | MealPlanSlot;
    dinner?: string | MealPlanSlot;
    snacks?: MealPlanSlot[];
    prep?: string;
  };

  return {
    breakfast: normalizePlanSlot(legacyDay.breakfast, 'Breakfast'),
    lunch: normalizePlanSlot(legacyDay.lunch, 'Lunch'),
    dinner: normalizePlanSlot(legacyDay.dinner, 'Dinner'),
    snacks: Array.isArray(legacyDay.snacks) && legacyDay.snacks.length > 0
      ? legacyDay.snacks
      : [{ name: 'Goal-based snack', calories: 250, proteinG: 18, note: 'Fill the gap without blurring meals' }],
    prep: legacyDay.prep ?? 'Prep the anchor ingredients first, then swap meals around appetite.',
  };
}

function normalizePlanSlot(value: string | MealPlanSlot | undefined, fallback: string): MealPlanSlot {
  if (value && typeof value === 'object') return value;
  return {
    name: value ?? fallback,
    calories: 450,
    proteinG: 30,
    note: 'Legacy plan item',
    prepSteps: ['Prepare the meal base.', 'Plate and season before serving.'],
  };
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
  spacedSm: { marginTop: spacing.md },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  targetDetails: { flex: 1, minWidth: 0 },
  calorieRing: {
    width: 104,
    minHeight: 104,
    borderRadius: 52,
    borderWidth: 8,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.surfaceContainerHigh,
  },
  calorieMeter: {
    width: 54,
    height: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: palette.surfaceContainerHighest,
    marginTop: spacing.xs,
  },
  calorieMeterFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
  },
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
  logActions: { gap: spacing.sm },
  searchTile: { flexBasis: '100%' },
  secondaryActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  smallAction: {
    flex: 1,
    minWidth: 96,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  suggestionCarousel: { gap: spacing.sm, paddingTop: spacing.md, paddingRight: spacing.md },
  suggestionMealCard: {
    width: 188,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
    padding: spacing.sm,
  },
  suggestionMealImage: {
    width: '100%',
    height: 92,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHighest,
  },
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
  mealSlotList: { gap: spacing.sm, marginTop: spacing.sm },
  planCarousel: { gap: spacing.sm, paddingRight: spacing.md },
  planDayCard: {
    width: 190,
    minHeight: 132,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceContainer,
    padding: spacing.md,
  },
  planDayTopline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  planDetailHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planMealRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  planMealRowCompact: { padding: spacing.xs + 2 },
  mealSlotLabel: { width: 72 },
  planMealDetail: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHighest,
    padding: spacing.md,
  },
  prepList: { gap: spacing.sm, marginTop: spacing.sm },
  prepStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  planActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
