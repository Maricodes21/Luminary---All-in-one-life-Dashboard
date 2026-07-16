import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealCard } from '@/components/meals/MealCard';
import { MealScreen } from '@/components/meals/MealScreen';
import { recipeCatalog } from '@/lib/meals/catalog';
import { isRecipeAllowed } from '@/lib/meals/recommendations';
import { recipeImageUri } from '@/lib/meals/recipeImages';
import { makeUuid } from '@/lib/meals/state';
import type { MealType } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function EditPlanDayScreen() {
  const router = useRouter();
  const { planId, localDate } = useLocalSearchParams<{ planId: string; localDate: string }>();
  const user = useMealsStore(activeMealsUser);
  const addPlanEntry = useMealsStore((state) => state.addPlanEntry);
  const deletePlanEntry = useMealsStore((state) => state.deletePlanEntry);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const plan = user?.plans.find((item) => item.id === planId);
  const entries = useMemo(() => plan?.entries.filter((entry) => entry.localDate === localDate) ?? [], [localDate, plan?.entries]);
  const target = user?.targets[localDate] ?? Object.values(user?.targets ?? {}).at(-1);
  const usedCalories = entries.reduce((sum, entry) => sum + (entry.nutrition?.calories ?? 0), 0);
  const candidates = useMemo(() => {
    if (!user?.profile) return [];
    return recipeCatalog
      .filter((recipe) => recipe.mealType === mealType)
      .filter((recipe) => isRecipeAllowed(recipe, user.profile!))
      .filter((recipe) => !entries.some((entry) => entry.recipeId === recipe.id))
      .filter((recipe) => !target || usedCalories + recipe.nutrition.calories <= target.calories)
      .slice(0, 6);
  }, [entries, mealType, target, usedCalories, user?.profile]);

  if (!plan || !localDate) {
    return <MealScreen title="Day unavailable" subtitle="Your plan was not changed"><View style={styles.empty}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>Return to the planner and choose another day.</Text><Pressable onPress={() => router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } })} style={styles.primary}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Back to plan</Text></Pressable></View></MealScreen>;
  }

  const addRecipe = (recipe: (typeof recipeCatalog)[number]) => {
    addPlanEntry(plan.id, {
      id: makeUuid(), localDate, mealType: recipe.mealType, name: recipe.name, source: 'curated',
      servingQuantity: 1, servingUnit: 'serving', recipeId: recipe.id, providerId: recipe.providerId,
      nutrition: recipe.nutrition, imageUri: recipeImageUri(recipe),
      recipeSnapshot: recipe,
    });
  };

  const removeEntry = (entryId: string, name: string) => Alert.alert('Remove planned meal?', `${name} will be removed from this day only.`, [
    { text: 'Keep', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => deletePlanEntry(plan.id, entryId) },
  ]);

  return (
    <MealScreen title={`Edit ${formatDay(localDate)}`} subtitle="Shape this day without rebuilding the week">
      <View style={styles.section}>
        <Text style={[type.headlineSm, { color: palette.onSurface }]}>Planned meals</Text>
        {entries.map((entry) => <MealCard key={entry.id} title={entry.name} imageUri={entry.imageUri ?? recipeImageUri(entry)} nutrition={entry.nutrition} detail={titleCase(entry.mealType)} onPress={() => router.push(`/meals/recipe/${entry.recipeId ?? 'missing'}?entryId=${entry.id}`)} onEdit={() => router.push(`/meals/substitute/${entry.id}`)} onDelete={() => removeEntry(entry.id, entry.name)} />)}
        {!entries.length ? <View style={styles.notice}><Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>This day is open. Add only the meals that would genuinely help.</Text></View> : null}
      </View>

      <View style={styles.section}>
        <Text style={[type.headlineSm, { color: palette.onSurface }]}>Add a meal</Text>
        <View style={styles.tabs}>{mealTypes.map((item) => <Pressable key={item} onPress={() => setMealType(item)} style={[styles.tab, item === mealType && styles.tabActive]}><Text style={[type.labelSm, { color: item === mealType ? palette.onPrimary : palette.onSurfaceVariant }]} numberOfLines={1}>{titleCase(item)}</Text></Pressable>)}</View>
        {candidates.map((recipe) => <View key={recipe.id} style={styles.candidate}><MealCard title={recipe.name} imageUri={recipeImageUri(recipe)} nutrition={recipe.nutrition} detail={`${recipe.prepMinutes + recipe.cookMinutes} min`} onPress={() => router.push(`/meals/recipe/${recipe.id}`)} /><Pressable onPress={() => addRecipe(recipe)} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`Add ${recipe.name} to ${formatDay(localDate)}`}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Add meal</Text></Pressable></View>)}
        {!candidates.length ? <View style={styles.notice}><Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>No verified {mealType} fits the remaining calories and current preferences.</Text></View> : null}
      </View>
    </MealScreen>
  );
}

function formatDay(localDate: string) { return new Date(`${localDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' }); }
function titleCase(value: string) { return `${value.charAt(0).toUpperCase()}${value.slice(1)}`; }

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.xs },
  tab: { flex: 1, minWidth: 0, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainer },
  tabActive: { backgroundColor: palette.primary },
  notice: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  candidate: { gap: spacing.xs },
  addButton: { minHeight: 46, alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  primary: { minHeight: 48, justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
});
