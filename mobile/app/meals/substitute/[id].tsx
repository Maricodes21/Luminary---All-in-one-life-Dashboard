import { Alert, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { DynamicMealCard } from '@/components/meals/DynamicMealCard';
import { MealScreen } from '@/components/meals/MealScreen';
import { recipeCatalog } from '@/lib/meals/catalog';
import { catalogSubstitutions } from '@/lib/meals/recommendations';
import { recipeImageUri } from '@/lib/meals/recipeImages';
import type { NutritionProfile } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

export default function SubstituteMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const user = useMealsStore(activeMealsUser);
  const updatePlanEntry = useMealsStore((state) => state.updatePlanEntry);
  const recordFeedback = useMealsStore((state) => state.recordSuggestionFeedback);
  const plans = Array.isArray(user?.plans) ? user.plans : [];
  const plan = plans.find((item) => (Array.isArray(item.entries) ? item.entries : []).some((entry) => entry.id === id));
  const entries = plan && Array.isArray(plan.entries) ? plan.entries : [];
  const entry = entries.find((item) => item.id === id);
  const substitutions = entry && user?.profile ? catalogSubstitutions(recipeCatalog, entry, safeProfile(user.profile)).slice(0, 12) : [];

  const choose = (recipe: (typeof recipeCatalog)[number]) => {
    if (!plan || !entry) return;
    const planId = plan.id;
    const entryId = entry.id;
    const replacedRecipeId = entry.recipeId;
    const mealType = entry.mealType;
    const updates = { name: recipe.name, recipeId: recipe.id, providerId: recipe.providerId, nutrition: recipe.nutrition, imageUri: recipeImageUri(recipe), recipeSnapshot: recipe };

    router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
    InteractionManager.runAfterInteractions(() => {
      try {
        updatePlanEntry(planId, entryId, updates);
        recordFeedback(recipe.id, 'substituted', { replacedRecipeId, mealType });
      } catch (error) {
        console.warn('[meals] Substitute failed safely', error);
        Alert.alert('Could not substitute this meal', 'Your plan is unchanged. Please try another option.');
      }
    });
  };

  return (
    <MealScreen title="Substitute meal" subtitle={entry ? `Replace ${entry.name}` : 'Planner entry unavailable'}>
      {entry ? <View style={styles.note}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>These options use the same meal time and your current diet, allergy, ingredient, and preparation limits.</Text></View> : null}
      <View style={styles.list}>{substitutions.map((recipe) => <DynamicMealCard key={recipe.id} title={recipe.name} imageUri={recipeImageUri(recipe)} nutrition={recipe.nutrition} detail={`${recipe.prepMinutes + recipe.cookMinutes} min / ${(recipe.dietaryTags ?? []).join(', ')}`} onPress={() => choose(recipe)} />)}</View>
      {!entry || !substitutions.length ? <View style={styles.empty}><Text style={[type.titleMd, { color: palette.onSurface }]}>No safe substitute found</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>Your plan is unchanged. Adjust preferences or return to the week.</Text><Pressable onPress={() => router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } })} style={styles.back}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Back to plan</Text></Pressable></View> : null}
    </MealScreen>
  );
}

function safeProfile(profile: NutritionProfile): NutritionProfile {
  return {
    ...profile,
    dietaryPreferences: Array.isArray(profile.dietaryPreferences) ? profile.dietaryPreferences : [],
    foodAllergies: Array.isArray(profile.foodAllergies) ? profile.foodAllergies : [],
    dislikedIngredients: Array.isArray(profile.dislikedIngredients) ? profile.dislikedIngredients : [],
  };
}

const styles = StyleSheet.create({
  note: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  list: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  back: { minHeight: 46, justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
});
