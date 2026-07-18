import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { useRecipeImage } from '@/hooks/useRecipeImage';
import { getRecipeById } from '@/lib/meals/catalog';
import { localDateKey, mealWindowFor } from '@/lib/meals/dates';
import { makeUuid } from '@/lib/meals/state';
import { recipeImageUri } from '@/lib/meals/recipeImages';
import type { CatalogRecipe } from '@/lib/meals/catalog';
import type { Recipe } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId?: string }>();
  const user = useMealsStore(activeMealsUser);
  const snapshot = useMemo(() => (Array.isArray(user?.plans) ? user.plans : [])
    .flatMap((plan) => Array.isArray(plan.entries) ? plan.entries : [])
    .find((entry) => entry.id === entryId)?.recipeSnapshot, [entryId, user?.plans]);
  const recipe = getRecipeById(id) ?? (snapshot?.id === id ? snapshot : undefined);
  const addMeal = useMealsStore((state) => state.addMeal);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [imageFailed, setImageFailed] = useState(false);
  const imageMatch = useRecipeImage({ name: recipe?.name ?? '', imageUri: recipe ? recipeImageUri(recipe) : undefined });
  const displayImageUri = imageMatch?.uri;
  const ingredientRows = useMemo(() => recipe?.ingredients ?? [], [recipe]);
  const instructionRows = useMemo(() => recipe?.steps ?? [], [recipe]);

  useEffect(() => setImageFailed(false), [displayImageUri]);

  if (!recipe || !recipe.nutrition) {
    return (
      <MealScreen title="Recipe unavailable" subtitle="The plan is still recoverable">
        <View style={styles.missing}><Icon name="meals" size={30} color={palette.error} /><Text style={[type.titleLg, { color: palette.onSurface }]}>This recipe ID is no longer available</Text><Text style={[type.bodyMd, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>Nothing crashed and your plan is unchanged. Choose a substitute or return to the planner.</Text>{entryId ? <Pressable onPress={() => router.replace(`/meals/substitute/${entryId}`)} style={styles.primary}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Choose substitute</Text></Pressable> : null}<Pressable onPress={() => router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } })} style={styles.secondary}><Text style={[type.labelMd, { color: palette.primary }]}>Back to plan</Text></Pressable></View>
      </MealScreen>
    );
  }

  const logRecipe = () => {
    const now = new Date();
    addMeal({ id: makeUuid(), name: recipe.name, localDate: localDateKey(now), consumedAt: now.toISOString(), timezone: currentTimezone(), mealType: mealWindowFor(now), servingQuantity: 1, servingUnit: 'serving', nutrition: recipe.nutrition!, source: recipe.source, providerId: recipe.providerId, imageUri: displayImageUri });
    router.replace('/(tabs)/meals');
  };

  return (
    <MealScreen title={recipe.name} subtitle={`${recipeDuration(recipe)} min / ${recipe.servings} ${recipe.servings === 1 ? 'serving' : 'servings'}`}>
      <View style={styles.hero}>
        {displayImageUri && !imageFailed
          ? <Image source={{ uri: displayImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setImageFailed(true)} accessibilityLabel={recipe.name} />
          : <Icon name="meals" size={34} color={palette.onSurfaceVariant} />}
      </View>
      {imageMatch?.sourceUrl && imageMatch.creator ? (
        <Pressable onPress={() => void Linking.openURL(imageMatch.sourceUrl!)} accessibilityRole="link">
          <Text style={[type.labelSm, styles.attribution]}>Photo by {imageMatch.creator}{imageMatch.license ? ` / CC ${imageMatch.license.replace(/^CC\s+/i, '')}` : ''}</Text>
        </Pressable>
      ) : null}
      <View style={styles.summary}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>{recipe.description}</Text><View style={styles.stats}><Stat label="Calories" value={`${recipe.nutrition.calories}`} /><Stat label="Protein" value={`${recipe.nutrition.proteinG}g`} /><Stat label="Carbs" value={`${recipe.nutrition.carbsG}g`} /><Stat label="Fat" value={`${recipe.nutrition.fatG}g`} /></View></View>
      <View style={styles.section}><Text style={[type.headlineSm, { color: palette.onSurface }]}>Ingredients</Text>{ingredientRows.map((ingredient) => { const done = checked.has(ingredient.id); return <Pressable key={ingredient.id} onPress={() => setChecked((current) => { const next = new Set(current); if (next.has(ingredient.id)) next.delete(ingredient.id); else next.add(ingredient.id); return next; })} style={styles.ingredient} accessibilityRole="checkbox" accessibilityState={{ checked: done }}><View style={[styles.checkbox, done && styles.checkboxDone]}>{done ? <Icon name="check" size={14} color={palette.onPrimary} /> : null}</View><Text style={[type.bodyMd, { color: done ? palette.onSurfaceVariant : palette.onSurface, flex: 1 }]}>{ingredient.quantity} {ingredient.unit} {ingredient.name}{ingredient.note ? `, ${ingredient.note}` : ''}</Text></Pressable>; })}</View>
      <View style={styles.section}><Text style={[type.headlineSm, { color: palette.onSurface }]}>Instructions</Text>{instructionRows.map((step, index) => <View key={step.id} style={styles.step}><View style={styles.stepNumber}><Text style={[type.labelSm, { color: palette.primary }]}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[type.bodyMd, { color: palette.onSurface }]}>{step.text}</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>{step.durationMinutes} min / {step.cue}</Text></View></View>)}</View>
      {entryId ? <Pressable onPress={() => router.push(`/meals/substitute/${entryId}`)} style={styles.secondary}><Icon name="swap" size={18} color={palette.primary} /><Text style={[type.labelMd, { color: palette.primary }]}>Substitute meal</Text></Pressable> : null}
      <Pressable onPress={logRecipe} style={styles.primary}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Log this meal</Text></Pressable>
    </MealScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={[type.titleMd, { color: palette.onSurface }]}>{value}</Text><Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{label}</Text></View>; }
function recipeDuration(recipe: Recipe | CatalogRecipe) { return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? recipe.steps.reduce((sum, step) => sum + (step.durationMinutes ?? 0), 0)); }
function currentTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } }

const styles = StyleSheet.create({
  missing: { minHeight: 380, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: palette.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  attribution: { color: palette.onSurfaceVariant, alignSelf: 'flex-end' },
  summary: { gap: spacing.md, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, padding: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.xs },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', backgroundColor: palette.surfaceContainerHigh, borderRadius: radii.sm, paddingVertical: spacing.sm },
  section: { gap: spacing.sm, backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  ingredient: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: 6, backgroundColor: palette.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: palette.primary },
  step: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  primary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
  secondary: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
});
