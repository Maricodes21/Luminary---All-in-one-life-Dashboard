import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { Icon } from '@/components/ui/Icon';
import type { NutritionValues } from '@/lib/meals/types';

type MealCardProps = {
  title: string;
  imageUri?: string;
  nutrition?: NutritionValues | null;
  detail: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function MealCard({ title, imageUri, nutrition, detail, onPress, onEdit, onDelete }: MealCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUri]);

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.main} accessibilityRole={onPress ? 'button' : undefined}>
        {imageUri && !imageFailed ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}><Icon name="meals" size={23} color={palette.onSurfaceVariant} /></View>
        )}
        <View style={styles.copy}>
          <Text style={[type.titleMd, styles.title]} numberOfLines={2}>{title}</Text>
          <Text style={[type.bodySm, styles.detail]} numberOfLines={1}>{detail}</Text>
          <Text style={[type.labelSm, styles.nutrition]} numberOfLines={1}>{nutritionText(nutrition)}</Text>
        </View>
      </Pressable>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? <IconButton icon="edit" label={`Edit ${title}`} onPress={onEdit} /> : null}
          {onDelete ? <IconButton icon="trash" label={`Delete ${title}`} onPress={onDelete} tone="danger" /> : null}
        </View>
      ) : null}
    </View>
  );
}

function IconButton({ icon, label, onPress, tone }: { icon: 'edit' | 'trash'; label: string; onPress: () => void; tone?: 'danger' }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
      <Icon name={icon} size={17} color={tone === 'danger' ? palette.error : palette.onSurfaceVariant} />
    </Pressable>
  );
}

function nutritionText(nutrition?: NutritionValues | null) {
  if (!nutrition) return 'Nutrition pending';
  const macros = [
    nutrition.proteinG == null ? null : `${Math.round(nutrition.proteinG)}g P`,
    nutrition.carbsG == null ? null : `${Math.round(nutrition.carbsG)}g C`,
    nutrition.fatG == null ? null : `${Math.round(nutrition.fatG)}g F`,
  ].filter(Boolean);
  return `${Math.round(nutrition.calories)} cal${macros.length ? `  /  ${macros.join('  ')}` : ''}`;
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.lg,
    padding: 12,
    gap: spacing.sm,
  },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  image: { width: 64, height: 64, borderRadius: radii.sm, flexShrink: 0 },
  imageFallback: { backgroundColor: palette.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, minHeight: 64, justifyContent: 'center' },
  title: { color: palette.onSurface },
  detail: { color: palette.onSurfaceVariant, marginTop: 2 },
  nutrition: { color: palette.primary, marginTop: spacing.xs },
  actions: { width: 36, minHeight: 64, justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
});
