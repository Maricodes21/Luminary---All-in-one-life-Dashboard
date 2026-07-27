import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { CalorieRing } from '@/components/meals/CalorieRing';
import { DynamicMealCard } from '@/components/meals/DynamicMealCard';
import { MacroProgress } from '@/components/meals/MacroProgress';
import { MealsSegmentedControl, type MealsMode } from '@/components/meals/MealsSegmentedControl';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { localDateKey, mealWindowFor } from '@/lib/meals/dates';
import { rankDailySuggestionCandidates } from '@/lib/meals/aiRecommendationGateway';
import { recipeCatalog } from '@/lib/meals/catalog';
import { recommendForNow } from '@/lib/meals/recommendations';
import { recipeImageUri } from '@/lib/meals/recipeImages';
import { makeUuid } from '@/lib/meals/state';
import { calculateMealTotals, calculateRemaining } from '@/lib/meals/totals';
import type { MealLogRecord, MealPlan, MealPlanEntry } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<MealsMode>(params.mode === 'plan' ? 'plan' : 'today');
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [staleDismissed, setStaleDismissed] = useState(false);
  const user = useMealsStore(activeMealsUser);
  const ensureTarget = useMealsStore((state) => state.ensureTarget);
  const deleteMeal = useMealsStore((state) => state.deleteMeal);
  const addMeal = useMealsStore((state) => state.addMeal);
  const undoMealDeletion = useMealsStore((state) => state.undoMealDeletion);
  const dismissMealDeletion = useMealsStore((state) => state.dismissMealDeletion);
  const deletePlanDay = useMealsStore((state) => state.deletePlanDay);
  const deletePlan = useMealsStore((state) => state.deletePlan);

  useEffect(() => {
    if (user?.profile) ensureTarget();
  }, [ensureTarget, user?.profile]);

  useEffect(() => {
    if (params.mode === 'plan') setMode('plan');
  }, [params.mode]);

  useEffect(() => {
    if (user?.undo?.kind !== 'meal') return;
    const elapsed = Date.now() - new Date(user.undo.createdAt).getTime();
    const timeout = setTimeout(dismissMealDeletion, Math.max(0, 6000 - elapsed));
    return () => clearTimeout(timeout);
  }, [dismissMealDeletion, user?.undo?.createdAt, user?.undo?.kind]);

  const today = localDateKey(new Date());
  const todayMeals = useMemo(() => user?.meals.filter((meal) => meal.localDate === today) ?? [], [today, user?.meals]);
  const totals = useMemo(() => calculateMealTotals(todayMeals), [todayMeals]);
  const target = user?.targets[today] ?? null;
  const remaining = target ? calculateRemaining(target, totals) : null;
  const plan = user?.plans[0] ?? null;
  const dates = useMemo(() => weekDates(plan?.weekOf ?? today), [plan?.weekOf, today]);
  const profileStale = user?.profile ? Date.now() - new Date(user.profile.updatedAt).getTime() > 30 * 24 * 60 * 60 * 1000 : false;

  const confirmMealDelete = (meal: MealLogRecord) => {
    Alert.alert('Delete meal?', `${meal.name} will be removed from today.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <SectionLabel>Meals</SectionLabel>
            <Text style={[type.headlineLg, { color: palette.onSurface, marginTop: 2 }]}>Your day, fed well</Text>
          </View>
          <Pressable onPress={() => router.push('/meals/search')} style={styles.primaryIconButton} accessibilityRole="button" accessibilityLabel="Log a meal">
            <Icon name="plus" color={palette.onPrimary} size={20} />
          </Pressable>
        </View>

        <MealsSegmentedControl value={mode} onChange={setMode} />

        {mode === 'today' ? (
          <TodayMode
            user={user}
            meals={todayMeals}
            target={target}
            totals={totals}
            remainingCalories={remaining?.calories ?? null}
            profileStale={profileStale && !staleDismissed}
            onDismissStale={() => setStaleDismissed(true)}
            onEditMeal={(meal) => router.push({ pathname: '/meals/manual', params: { id: meal.id } })}
            onDeleteMeal={confirmMealDelete}
            onOpenSearch={() => router.push('/meals/search')}
            onOpenCamera={() => router.push('/meals/camera')}
            onOpenBarcode={() => router.push({ pathname: '/meals/camera', params: { mode: 'barcode' } })}
            onOpenManual={() => router.push('/meals/manual')}
            onOpenProfile={() => router.push('/meals/profile')}
            onOpenRecipe={(recipeId) => router.push({ pathname: '/meals/recipe', params: { id: recipeId } })}
            onLogRecipe={(recipeId) => {
              const recipe = recipeCatalog.find((item) => item.id === recipeId);
              if (!recipe) return;
              const now = new Date();
              addMeal({ id: makeUuid(), name: recipe.name, localDate: localDateKey(now), consumedAt: now.toISOString(), timezone: currentTimezone(), mealType: mealWindowFor(now), servingQuantity: 1, servingUnit: 'serving', nutrition: recipe.nutrition, source: 'curated', providerId: recipe.providerId, imageUri: recipeImageUri(recipe) });
            }}
          />
        ) : (
          <PlanMode
            plan={plan}
            selectedDate={selectedDate}
            dates={dates}
            onSelectDate={setSelectedDate}
            onOpenRecipe={(entry) => router.push({ pathname: '/meals/recipe', params: { id: entry.recipeId ?? 'missing', entryId: entry.id } })}
            onCreatePlan={() => router.push('/meals/plan-builder')}
            onEditEntry={(entry) => router.push({ pathname: '/meals/substitute', params: { id: entry.id } })}
            onEditDay={() => plan && router.push({ pathname: '/meals/edit-day', params: { planId: plan.id, localDate: selectedDate } })}
            onClearDay={() => plan && confirmClearDay(plan, selectedDate, deletePlanDay)}
            onDeletePlan={() => plan && confirmDeletePlan(plan, deletePlan)}
          />
        )}
      </ScrollView>

      {user?.undo?.kind === 'meal' ? (
        <View style={[styles.undo, { bottom: insets.bottom + 82 }]}>
          <Text style={[type.bodySm, styles.undoText]} numberOfLines={1}>{user.undo.record.name} deleted</Text>
          <Pressable onPress={undoMealDeletion} style={styles.undoButton} accessibilityRole="button">
            <Icon name="undo" size={16} color={palette.primary} />
            <Text style={[type.labelSm, { color: palette.primary }]}>Undo</Text>
          </Pressable>
          <Pressable onPress={dismissMealDeletion} style={styles.undoDismiss} accessibilityRole="button" accessibilityLabel="Dismiss deleted meal notice">
            <Icon name="close" size={16} color={palette.onSurfaceVariant} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function TodayMode({ user, meals, target, totals, remainingCalories, profileStale, onDismissStale, onEditMeal, onDeleteMeal, onOpenSearch, onOpenCamera, onOpenBarcode, onOpenManual, onOpenProfile, onOpenRecipe, onLogRecipe }: {
  user: ReturnType<typeof activeMealsUser>;
  meals: MealLogRecord[];
  target: ReturnType<typeof useMealsStore.getState>['users'][string]['targets'][string] | null;
  totals: ReturnType<typeof calculateMealTotals>;
  remainingCalories: number | null;
  profileStale: boolean;
  onDismissStale: () => void;
  onEditMeal: (meal: MealLogRecord) => void;
  onDeleteMeal: (meal: MealLogRecord) => void;
  onOpenSearch: () => void;
  onOpenCamera: () => void;
  onOpenBarcode: () => void;
  onOpenManual: () => void;
  onOpenProfile: () => void;
  onOpenRecipe: (recipeId: string) => void;
  onLogRecipe: (recipeId: string) => void;
}) {
  return (
    <>
      <Card style={styles.nutritionCard}>
        <CalorieRing consumed={totals.calories} target={target?.calories ?? null} />
        <View style={styles.macroColumn}>
          <MacroProgress label="Protein" value={totals.proteinG} target={target?.proteinG ?? null} color={palette.primary} />
          <MacroProgress label="Carbs" value={totals.carbsG} target={target?.carbsG ?? null} color={palette.tertiary} />
          <MacroProgress label="Fat" value={totals.fatG} target={target?.fatG ?? null} color={palette.secondary} />
          <Pressable onPress={onOpenProfile} accessibilityRole="button">
            <Text style={[type.bodySm, { color: palette.primary, marginTop: spacing.sm }]}>
              {user?.profile ? `Based on ${user.profile.weightKg} kg  /  updated ${formatShortDate(user.profile.updatedAt)}` : 'Set your nutrition profile'}
            </Text>
          </Pressable>
        </View>
      </Card>

      {profileStale ? (
        <View style={styles.reminder}>
          <Pressable onPress={onOpenProfile} style={styles.reminderCopy} accessibilityRole="button">
            <Icon name="trend" size={20} color={palette.secondary} />
            <Text style={[type.bodySm, { color: palette.onSurface, flex: 1 }]}>Has your weight changed? Refresh your targets when it feels useful.</Text>
          </Pressable>
          <Pressable onPress={onDismissStale} style={styles.dismiss} accessibilityLabel="Dismiss weight reminder"><Icon name="close" size={16} color={palette.onSurfaceVariant} /></Pressable>
        </View>
      ) : null}

      <SmartSuggestion user={user} target={target} remainingCalories={remainingCalories} meals={meals} onOpenRecipe={onOpenRecipe} onLogRecipe={onLogRecipe} />

      <View style={styles.section}>
        <Text style={[type.headlineMd, { color: palette.onSurface }]}>Log a meal</Text>
        <View style={styles.actionsRow}>
          <MealAction icon="search" label="Search" onPress={onOpenSearch} />
          <MealAction icon="camera" label="Camera" onPress={onOpenCamera} />
          <MealAction icon="barcode" label="Barcode" onPress={onOpenBarcode} />
          <MealAction icon="edit" label="Manual entry" onPress={onOpenManual} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[type.headlineMd, { color: palette.onSurface }]}>Logged today</Text>
          <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{meals.length} {meals.length === 1 ? 'meal' : 'meals'}</Text>
        </View>
        <View style={styles.cardList}>
          {meals.map((meal) => (
            <DynamicMealCard key={meal.id} title={meal.name} recipeId={catalogRecipeId(meal.providerId)} imageUri={meal.imageUri} nutrition={meal.nutrition} detail={`${titleCase(meal.mealType)}  /  ${formatTime(meal.consumedAt)}`} onEdit={() => onEditMeal(meal)} onDelete={() => onDeleteMeal(meal)} />
          ))}
          {!meals.length ? <EmptyState title="Nothing logged yet" detail="Search the full food library, scan a meal, or add exactly what you know." /> : null}
        </View>
      </View>
    </>
  );
}

function SmartSuggestion({ user, target, remainingCalories, meals, onOpenRecipe, onLogRecipe }: { user: ReturnType<typeof activeMealsUser>; target: NonNullable<ReturnType<typeof activeMealsUser>>['targets'][string] | null; remainingCalories: number | null; meals: MealLogRecord[]; onOpenRecipe: (recipeId: string) => void; onLogRecipe: (recipeId: string) => void }) {
  const recordFeedback = useMealsStore((state) => state.recordSuggestionFeedback);
  const [rankedIds, setRankedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [suggestionCursor, setSuggestionCursor] = useState(0);
  const profile = user?.profile ?? null;
  const recentRecipeIds = useMemo(() => user?.plans.flatMap((plan) => plan.entries.map((entry) => entry.recipeId).filter((id): id is string => !!id)).slice(-10) ?? [], [user?.plans]);
  const recommendation = useMemo(() => profile && target && remainingCalories != null && remainingCalories >= 100
    ? recommendForNow({ recipes: recipeCatalog, profile, target, meals, now: new Date(), recentRecipeIds })
    : null, [meals, profile, recentRecipeIds, remainingCalories, target]);
  const candidateKey = recommendation?.candidates.map((recipe) => recipe.id).join('|') ?? '';
  useEffect(() => {
    if (!recommendation || !target || !profile || remainingCalories == null) return;
    let cancelled = false;
    void rankDailySuggestionCandidates(recommendation.candidates, {
      remainingCalories,
      targetProteinG: target.proteinG,
      loggedMealTypes: meals.map((meal) => meal.mealType),
      recentRecipeIds,
      maxPrepMinutes: profile.maxPrepMinutes,
    }).then((ranked) => { if (!cancelled) setRankedIds(ranked.map((recipe) => recipe.id)); });
    return () => { cancelled = true; };
  }, [candidateKey, meals, profile, recentRecipeIds, recommendation, remainingCalories, target]);
  useEffect(() => {
    setSuggestionCursor(0);
    setDismissedIds([]);
  }, [candidateKey]);
  if (!recommendation?.primary) return null;
  const ranked = rankedIds.map((id) => recommendation.candidates.find((recipe) => recipe.id === id)).filter((recipe): recipe is (typeof recipeCatalog)[number] => !!recipe);
  const available = [...ranked, ...recommendation.candidates].filter((recipe, index, recipes) => recipes.findIndex((item) => item.id === recipe.id) === index && !dismissedIds.includes(recipe.id));
  const primary = available.length ? available[suggestionCursor % available.length] : null;
  if (!primary) return null;
  const suggested = [primary, ...(recommendation.snack && recommendation.snack.id !== primary.id && !dismissedIds.includes(recommendation.snack.id) ? [recommendation.snack] : [])];
  return (
    <View style={styles.suggestionBlock}>
      <View style={styles.suggestion}>
        <Icon name="sparkles" size={20} color={palette.tertiary} />
        <View style={{ flex: 1, minWidth: 0 }}><SectionLabel>Suggested for right now</SectionLabel></View>
      </View>
      {suggested.map((recipe) => <DynamicMealCard key={recipe.id} title={recipe.name} recipeId={recipe.id} imageUri={recipeImageUri(recipe)} nutrition={recipe.nutrition} detail={`${recipe.prepMinutes + recipe.cookMinutes} min / ${recipe.mealType}`} onPress={() => onOpenRecipe(recipe.id)} actions={[
        { icon: 'trash', label: `Not for me: ${recipe.name}`, tone: 'danger', onPress: () => { setDismissedIds((current) => [...current, recipe.id]); setSuggestionCursor(0); recordFeedback(recipe.id, 'dismissed', { mealType: recipe.mealType }); } },
        { icon: 'swap', label: `Show another ${recipe.mealType}`, onPress: () => setSuggestionCursor((current) => current + 1) },
        { icon: 'plus', label: `Log ${recipe.name}`, tone: 'primary', onPress: () => { setDismissedIds((current) => [...current, recipe.id]); recordFeedback(recipe.id, 'accepted', { mealType: recipe.mealType }); onLogRecipe(recipe.id); } },
      ]} />)}
    </View>
  );
}

function PlanMode({ plan, selectedDate, dates, onSelectDate, onOpenRecipe, onCreatePlan, onEditEntry, onEditDay, onClearDay, onDeletePlan }: {
  plan: MealPlan | null;
  selectedDate: string;
  dates: string[];
  onSelectDate: (date: string) => void;
  onOpenRecipe: (entry: MealPlanEntry) => void;
  onCreatePlan: () => void;
  onEditEntry: (entry: MealPlanEntry) => void;
  onEditDay: () => void;
  onClearDay: () => void;
  onDeletePlan: () => void;
}) {
  const entries = plan?.entries.filter((entry) => entry.localDate === selectedDate) ?? [];
  return (
    <>
      <View style={styles.planHeader}>
        <View style={{ flex: 1 }}>
          <SectionLabel>Weekly planner</SectionLabel>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginTop: 2 }]}>{plan?.title ?? 'Build a week around you'}</Text>
        </View>
        {plan ? (
          <View style={styles.planHeaderActions}>
            <Pressable onPress={onEditDay} style={styles.textButton} accessibilityLabel="Edit day"><Text style={[type.labelSm, { color: palette.primary }]}>Edit</Text></Pressable>
            <Pressable onPress={onClearDay} style={styles.textButton} accessibilityLabel="Clear day"><Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>Clear</Text></Pressable>
            <Pressable onPress={onDeletePlan} style={styles.iconAction} accessibilityLabel="Delete full plan"><Icon name="trash" size={17} color={palette.error} /></Pressable>
          </View>
        ) : null}
      </View>

      {plan ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
            {dates.map((date) => {
              const active = date === selectedDate;
              const parsed = new Date(`${date}T12:00:00`);
              return (
                <Pressable key={date} onPress={() => onSelectDate(date)} style={[styles.dateButton, active && styles.dateButtonActive]}>
                  <Text style={[type.labelSm, { color: active ? palette.onPrimary : palette.onSurfaceVariant }]}>{parsed.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <Text style={[type.titleMd, { color: active ? palette.onPrimary : palette.onSurface }]}>{parsed.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.timeline}>
            {entries.map((entry) => (
              <DynamicMealCard key={entry.id} title={entry.name} recipeId={entry.recipeId} imageUri={entry.imageUri ?? recipeImageUri(entry)} nutrition={entry.nutrition} detail={titleCase(entry.mealType)} onPress={() => onOpenRecipe(entry)} onEdit={() => onEditEntry(entry)} />
            ))}
            {!entries.length ? <EmptyState title="This day is open" detail="Use Edit to add a meal, or leave the space for something spontaneous." /> : null}
          </View>
        </>
      ) : (
        <View style={styles.planEmpty}>
          <Icon name="calendar" size={28} color={palette.primary} />
          <Text style={[type.titleLg, { color: palette.onSurface }]}>A flexible plan, not a rigid template</Text>
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>Meals are selected from validated recipes around your target, timing, and preferences. Every card opens a complete prep guide.</Text>
          <Pressable onPress={onCreatePlan} style={styles.primaryButton}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Create my week</Text></Pressable>
        </View>
      )}
    </>
  );
}

function MealAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.mealAction} accessibilityRole="button">
      <Icon name={icon} size={20} color={palette.primary} />
      <Text style={[type.labelSm, { color: palette.onSurface, textAlign: 'center' }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[type.titleMd, { color: palette.onSurface }]}>{title}</Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>{detail}</Text>
    </View>
  );
}

function confirmClearDay(plan: MealPlan, localDate: string, clear: (planId: string, date: string) => void) {
  Alert.alert('Clear this day?', 'The rest of your weekly plan will stay intact.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Clear day', style: 'destructive', onPress: () => clear(plan.id, localDate) },
  ]);
}

function confirmDeletePlan(plan: MealPlan, remove: (planId: string) => void) {
  Alert.alert('Delete full plan?', 'This removes every day in this plan. Your logged meals will not change.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete plan', style: 'destructive', onPress: () => remove(plan.id) },
  ]);
}

function weekDates(weekOf: string) {
  const start = new Date(`${weekOf}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateKey(date);
  });
}

function formatShortDate(value: string) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function formatTime(value: string) { return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
function titleCase(value: string) { return `${value.charAt(0).toUpperCase()}${value.slice(1)}`; }
function catalogRecipeId(providerId?: string) {
  const match = providerId?.match(/^luminary:(recipe_[a-z0-9_]+):\d+$/);
  return match?.[1];
}
function currentTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, minWidth: 0 },
  primaryIconButton: { width: 44, height: 44, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  nutritionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  macroColumn: { flex: 1, minWidth: 0, gap: spacing.sm },
  reminder: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.sm },
  reminderCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dismiss: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, padding: spacing.md },
  suggestionBlock: { gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  mealAction: { flex: 1, minWidth: 0, height: 68, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm },
  cardList: { gap: spacing.sm },
  empty: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  undo: { position: 'absolute', left: spacing.md, right: spacing.md, minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surfaceBright, borderRadius: radii.sm, paddingHorizontal: spacing.md },
  undoText: { color: palette.onSurface, flex: 1 },
  undoButton: { height: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  undoDismiss: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  planHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.sm },
  planHeaderActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  textButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm },
  iconAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateStrip: { gap: spacing.sm, paddingRight: spacing.md },
  dateButton: { width: 54, height: 60, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm },
  dateButtonActive: { backgroundColor: palette.primary },
  timeline: { gap: spacing.sm },
  planEmpty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  primaryButton: { minHeight: 48, minWidth: 180, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.primary, paddingHorizontal: spacing.lg },
});
