import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealCard } from '@/components/meals/MealCard';
import { MealScreen } from '@/components/meals/MealScreen';
import { recipeCatalog } from '@/lib/meals/catalog';
import { catalogSubstitutions } from '@/lib/meals/recommendations';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

export default function SubstituteMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useMealsStore(activeMealsUser);
  const updatePlanEntry = useMealsStore((state) => state.updatePlanEntry);
  const recordFeedback = useMealsStore((state) => state.recordSuggestionFeedback);
  const plan = user?.plans.find((item) => item.entries.some((entry) => entry.id === id));
  const entry = plan?.entries.find((item) => item.id === id);
  const substitutions = entry && user?.profile ? catalogSubstitutions(recipeCatalog, entry, user.profile).slice(0, 12) : [];

  const choose = (recipe: (typeof recipeCatalog)[number]) => {
    if (!plan || !entry) return;
    recordFeedback(recipe.id, 'substituted', { replacedRecipeId: entry.recipeId, mealType: entry.mealType });
    updatePlanEntry(plan.id, entry.id, { name: recipe.name, recipeId: recipe.id, providerId: recipe.providerId, nutrition: recipe.nutrition, imageUri: recipe.image.kind === 'exact' ? recipe.image.uri : undefined, recipeSnapshot: recipe });
    router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
  };

  return (
    <MealScreen title="Substitute meal" subtitle={entry ? `Replace ${entry.name}` : 'Planner entry unavailable'}>
      {entry ? <View style={styles.note}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>These options use the same meal time and your current diet, allergy, ingredient, and preparation limits.</Text></View> : null}
      <View style={styles.list}>{substitutions.map((recipe) => <MealCard key={recipe.id} title={recipe.name} imageUri={recipe.image.kind === 'exact' ? recipe.image.uri : undefined} nutrition={recipe.nutrition} detail={`${recipe.prepMinutes + recipe.cookMinutes} min / ${recipe.dietaryTags.join(', ')}`} onPress={() => choose(recipe)} />)}</View>
      {!entry || !substitutions.length ? <View style={styles.empty}><Text style={[type.titleMd, { color: palette.onSurface }]}>No safe substitute found</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>Your plan is unchanged. Adjust preferences or return to the week.</Text><Pressable onPress={() => router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } })} style={styles.back}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Back to plan</Text></Pressable></View> : null}
    </MealScreen>
  );
}

const styles = StyleSheet.create({
  note: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  list: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  back: { minHeight: 46, justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
});
