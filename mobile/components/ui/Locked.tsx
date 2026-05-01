import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Icon } from './Icon';

export type LockedProps = {
  title: string;
  description: string;
  cta?: string;
  onUnlock?: () => void;
  style?: ViewStyle;
};

/**
 * Visible-but-locked module card. Used on Health, Money, and any opt-in module
 * the user hasn't enabled yet. The treatment signals depth without demanding it.
 */
export function Locked({ title, description, cta = 'Begin', onUnlock, style }: LockedProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconWrap}>
        <Icon name="lock" size={20} color={palette.primary} />
      </View>
      <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.sm }]}>{title}</Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>{description}</Text>
      {onUnlock ? (
        <Pressable onPress={onUnlock} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
          <Text style={[type.titleMd, { color: palette.onPrimary }]}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: `${palette.primary}24`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: radii.md,
  },
});
