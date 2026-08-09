import { useEffect, useState } from 'react';
import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { Icon, type IconName } from '@/components/ui/Icon';
import type { NutritionValues } from '@/lib/meals/types';

export type MealCardAction = {
  icon: IconName;
  label: string;
  tone?: 'default' | 'primary' | 'danger';
  onPress: () => void;
};

export type MealCardProps = {
  title: string;
  imageUri?: string;
  imageSource?: ImageSource | number;
  nutrition?: NutritionValues | null;
  detail: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: MealCardAction[];
};

export function MealCard({ title, imageUri, imageSource, nutrition, detail, onPress, onEdit, onDelete, actions = [] }: MealCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const suppliedActions = actions.slice(0, 3);
  const visibleActions: MealCardAction[] = suppliedActions.length ? suppliedActions : [
    ...(onEdit ? [{ icon: 'edit' as const, label: `Edit ${title}`, onPress: onEdit }] : []),
    ...(onDelete ? [{ icon: 'trash' as const, label: `Delete ${title}`, onPress: onDelete, tone: 'danger' as const }] : []),
  ];

  useEffect(() => setImageFailed(false), [imageSource, imageUri]);

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.main} accessibilityRole={onPress ? 'button' : undefined}>
        {(imageSource || imageUri) && !imageFailed ? (
          <Image
            source={imageSource ?? { uri: imageUri! }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={imageUri ?? title}
            transition={100}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}><Icon name="meals" size={23} color={palette.onSurfaceVariant} /></View>
        )}
        <View style={styles.copy}>
          <Text style={[type.titleMd, styles.title]} numberOfLines={2}>{title}</Text>
          <Text style={[type.bodySm, styles.detail]} numberOfLines={1}>{detail}</Text>
          <Text style={[type.labelSm, styles.nutrition]} numberOfLines={1}>{nutritionText(nutrition)}</Text>
        </View>
      </Pressable>
      {visibleActions.length ? (
        <View style={styles.actions}>
          {visibleActions.map((action) => <IconButton key={`${action.icon}-${action.label}`} action={action} />)}
        </View>
      ) : null}
    </View>
  );
}

function IconButton({ action }: { action: MealCardAction }) {
  const color = action.tone === 'danger' ? palette.error : action.tone === 'primary' ? palette.primary : palette.onSurfaceVariant;
  return (
    <Pressable onPress={action.onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={action.label} hitSlop={6}>
      <Icon name={action.icon} size={17} color={color} />
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
  actions: { width: 72, height: 72, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'flex-end', gap: 4 },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainerHigh },
});
