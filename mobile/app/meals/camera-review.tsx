import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { normalizeVisibleIngredients } from '@/lib/meals/photoAnalysis';
import type { MealPhotoAnalysisStatus } from '@/lib/meals/types';
import { useCameraReviewStore } from '@/stores/useCameraReviewStore';

const RECOVERY_COPY: Record<
  Exclude<MealPhotoAnalysisStatus, 'ready'>,
  { title: string; body: string }
> = {
  timeout: {
    title: 'That took too long',
    body: 'The photo was deleted, but the ingredient check did not finish. Try another photo or add the ingredients yourself.',
  },
  unavailable: {
    title: 'We could not see enough',
    body: 'The photo was deleted. Try again in brighter light, or add the ingredients you know.',
  },
  quota: {
    title: 'Photo suggestions are paused',
    body: 'You have used today’s photo suggestions. Your meal log is still available for manual entry.',
  },
  budget: {
    title: 'Photo suggestions are unavailable',
    body: 'The optional photo service is paused right now. You can still add this meal yourself.',
  },
};

export default function CameraReviewScreen() {
  const router = useRouter();
  const analysis = useCameraReviewStore((state) => state.analysis);
  const setIngredient = useCameraReviewStore((state) => state.setIngredient);
  const addIngredient = useCameraReviewStore((state) => state.addIngredient);
  const removeIngredient = useCameraReviewStore((state) => state.removeIngredient);
  const clear = useCameraReviewStore((state) => state.clear);

  const ingredients = normalizeVisibleIngredients(analysis?.ingredients ?? []);
  const status = analysis?.status ?? 'unavailable';

  const useIngredients = () => {
    if (!ingredients.length) return;
    clear();
    router.replace({
      pathname: '/meals/manual',
      params: { notes: `Visible ingredients: ${ingredients.join(', ')}` },
    });
  };

  const retry = () => {
    clear();
    router.replace('/meals/camera');
  };

  const openManual = () => {
    const notes = ingredients.length ? `Visible ingredients: ${ingredients.join(', ')}` : undefined;
    clear();
    router.replace({ pathname: '/meals/manual', params: { notes } });
  };

  if (status !== 'ready') {
    const copy = RECOVERY_COPY[status];
    return (
      <MealScreen title="Photo check" subtitle="Your photo has been deleted">
        <View style={styles.recoveryIcon}>
          <Icon name="meals" size={28} color={palette.primary} />
        </View>
        <View style={styles.recovery}>
          <Text style={[type.titleLg, { color: palette.onSurface }]}>{copy.title}</Text>
          <Text style={[type.bodyMd, styles.centeredCopy]}>{copy.body}</Text>
        </View>
        {status === 'timeout' || status === 'unavailable' ? (
          <Pressable onPress={retry} style={styles.primaryButton} accessibilityRole="button">
            <Text style={[type.labelMd, { color: palette.onPrimary }]}>Try another photo</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={openManual} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={[type.labelMd, { color: palette.primary }]}>Add ingredients myself</Text>
        </Pressable>
      </MealScreen>
    );
  }

  return (
    <MealScreen title="Ingredients we can see" subtitle="Check and edit these before continuing">
      <View style={styles.notice}>
        <Icon name="lock" size={17} color={palette.primary} />
        <Text style={[type.bodySm, styles.noticeCopy]}>
          The photo has been deleted. These are suggestions, so remove or rename anything that does
          not look right.
        </Text>
      </View>

      <View style={styles.list}>
        {analysis?.ingredients.map((ingredient, index) => (
          <View key={`ingredient-${index}`} style={styles.row}>
            <View style={styles.number}>
              <Text style={[type.labelSm, { color: palette.primary }]}>{index + 1}</Text>
            </View>
            <TextInput
              value={ingredient}
              onChangeText={(value) => setIngredient(index, value)}
              placeholder="Ingredient name"
              placeholderTextColor={palette.onSurfaceVariant}
              style={[type.bodyMd, styles.input]}
              accessibilityLabel={`Visible ingredient ${index + 1}`}
              autoCapitalize="sentences"
              maxLength={80}
            />
            <Pressable
              onPress={() => removeIngredient(index)}
              style={styles.remove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${ingredient || `ingredient ${index + 1}`}`}
            >
              <Icon name="close" size={17} color={palette.onSurfaceVariant} />
            </Pressable>
          </View>
        ))}
      </View>

      {(analysis?.ingredients.length ?? 0) < 12 ? (
        <Pressable onPress={addIngredient} style={styles.addButton} accessibilityRole="button">
          <Icon name="plus" size={17} color={palette.primary} />
          <Text style={[type.labelMd, { color: palette.primary }]}>Add an ingredient</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={useIngredients}
        disabled={!ingredients.length}
        style={[styles.primaryButton, !ingredients.length && styles.disabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ingredients.length }}
      >
        <Text style={[type.labelMd, { color: palette.onPrimary }]}>Use these ingredients</Text>
      </Pressable>
      <Pressable onPress={openManual} style={styles.secondaryButton} accessibilityRole="button">
        <Text style={[type.labelMd, { color: palette.primary }]}>Continue without suggestions</Text>
      </Pressable>
    </MealScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  noticeCopy: { flex: 1, color: palette.onSurfaceVariant },
  list: { gap: spacing.sm },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainer,
  },
  number: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.surfaceContainerHigh,
  },
  input: { flex: 1, minHeight: 48, color: palette.onSurface },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radii.sm,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: { opacity: 0.45 },
  recoveryIcon: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: palette.surfaceContainer,
  },
  recovery: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  centeredCopy: { color: palette.onSurfaceVariant, textAlign: 'center' },
});
