import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { MealScreen } from '@/components/meals/MealScreen';
import { Icon, type IconName } from '@/components/ui/Icon';
import { recipeCatalog } from '@/lib/meals/catalog';
import { catalogSubstitutions } from '@/lib/meals/recommendations';
import { recipeImageUri } from '@/lib/meals/recipeImages';
import type { NutritionProfile } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { useDecisionStore } from '@/stores/useDecisionStore';

type Adjustment = 'quicker' | 'protein' | 'available';

export default function AdjustMealPlanScreen() {
  const router = useRouter();
  const { planId, localDate } = useLocalSearchParams<{ planId: string; localDate: string }>();
  const user = useMealsStore(activeMealsUser);
  const updatePlanEntry = useMealsStore((s) => s.updatePlanEntry);
  const recordDecision = useDecisionStore((s) => s.record);
  const plan = user?.plans.find((item) => item.id === planId);
  const entries = plan?.entries.filter((entry) => entry.localDate === localDate) ?? [];

  function choose(focus: Adjustment) {
    if (!plan || !user?.profile || !entries.length) return;
    const profile = safeProfile(user.profile);
    const used = new Set(entries.map((entry) => entry.recipeId).filter(Boolean));
    let changed = 0;
    entries.forEach((entry) => {
      const choices = rank(
        catalogSubstitutions(recipeCatalog, entry, profile),
        focus,
      );
      const recipe = choices.find((candidate) => !used.has(candidate.id)) ?? choices[0];
      if (!recipe) return;
      used.add(recipe.id);
      updatePlanEntry(plan.id, entry.id, {
        name: recipe.name,
        recipeId: recipe.id,
        providerId: recipe.providerId,
        nutrition: recipe.nutrition,
        imageUri: recipeImageUri(recipe),
        recipeSnapshot: recipe,
      });
      changed += 1;
    });
    const reason = adjustmentReason(focus);
    recordDecision({ domain: 'meals', action: `adjust-day:${focus}`, outcome: 'changed', reason, localDate });
    Alert.alert('Day adjusted', `${changed} ${changed === 1 ? 'meal was' : 'meals were'} updated automatically. ${reason}`, [
      {
        text: 'Undo',
        onPress: () => {
          entries.forEach((entry) => updatePlanEntry(plan.id, entry.id, entry));
          recordDecision({ domain: 'meals', action: `adjust-day:${focus}`, outcome: 'undone', reason, localDate });
          router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
        },
      },
      { text: 'Keep changes', onPress: () => router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } }) },
    ]);
  }

  function moveTomorrow() {
    if (!plan || !entries.length) return;
    const next = new Date(`${localDate}T12:00:00`);
    next.setDate(next.getDate() + 1);
    const nextDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    entries.forEach((entry) => updatePlanEntry(plan.id, entry.id, { localDate: nextDate }));
    Alert.alert('Meals moved', `This day's meals are now planned for ${next.toLocaleDateString(undefined, { weekday: 'long' })}.`);
    router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
  }

  return (
    <MealScreen title="Adjust this day" subtitle="Keep the week; change what no longer fits">
      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>What changed? Luminary will keep your dietary restrictions and nutrition target in every option.</Text>
      <View style={styles.list}>
        <AdjustmentCard icon="clock" title="I need something quicker" detail="Show shorter total prep and cooking time first." onPress={() => choose('quicker')} />
        <AdjustmentCard icon="health" title="I need more protein" detail="Prioritize safe options with more protein." onPress={() => choose('protein')} />
        <AdjustmentCard icon="meals" title="Use what is easier to find" detail="Prioritize recipes with shorter ingredient lists." onPress={() => choose('available')} />
        <AdjustmentCard icon="calendar" title="Move this day" detail="Shift these meals to tomorrow without changing the rest of the week." onPress={moveTomorrow} />
      </View>
    </MealScreen>
  );
}

function adjustmentReason(focus: Adjustment) {
  if (focus === 'quicker') return 'Shorter preparation time was prioritized.';
  if (focus === 'protein') return 'Higher protein was prioritized.';
  return 'Recipes with fewer ingredients were prioritized.';
}

function rank<T extends (typeof recipeCatalog)[number]>(recipes: T[], focus: Adjustment) {
  if (focus === 'quicker') return [...recipes].sort((a, b) => a.prepMinutes + a.cookMinutes - b.prepMinutes - b.cookMinutes);
  if (focus === 'protein') return [...recipes].sort((a, b) => b.nutrition.proteinG - a.nutrition.proteinG);
  return [...recipes].sort((a, b) => a.ingredients.length - b.ingredients.length);
}

function safeProfile(profile: NutritionProfile): NutritionProfile {
  return {
    ...profile,
    dietaryPreferences: Array.isArray(profile.dietaryPreferences) ? profile.dietaryPreferences : [],
    foodAllergies: Array.isArray(profile.foodAllergies) ? profile.foodAllergies : [],
    dislikedIngredients: Array.isArray(profile.dislikedIngredients) ? profile.dislikedIngredients : [],
  };
}

function AdjustmentCard({ icon, title, detail, onPress }: { icon: IconName; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.icon}><Icon name={icon} size={20} color={palette.primary} /></View>
      <View style={styles.copy}><Text style={[type.titleMd, { color: palette.onSurface }]}>{title}</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>{detail}</Text></View>
      <Icon name="swap" size={18} color={palette.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: { minHeight: spacing['3xl'] + spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainer },
  icon: { width: spacing.xl + spacing.sm, height: spacing.xl + spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest },
  copy: { flex: 1, gap: spacing.xs },
});
