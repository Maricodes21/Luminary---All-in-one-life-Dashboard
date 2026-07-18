import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';

type QuickActionTileProps = {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  detail?: string;
  accent?: string;
  onPress?: () => void;
  disabled?: boolean;
  status?: string;
  style?: ViewStyle;
};

export function QuickActionTile({
  icon,
  label,
  detail,
  accent = palette.primary,
  onPress,
  disabled = false,
  status,
  style,
}: QuickActionTileProps) {
  const isDisabled = disabled || !onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.tile, isDisabled && styles.disabledTile, pressed && { opacity: 0.85 }, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${accent}24` }]}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.labelMd, styles.label]} numberOfLines={1}>
          {label}
        </Text>
        {detail ? (
          <Text style={[type.bodySm, styles.detail]} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
        {status ? (
          <Text style={[type.labelSm, styles.status]} numberOfLines={1}>
            {status}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 138,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledTile: { opacity: 0.62 },
  label: { color: palette.onSurface },
  detail: { color: palette.onSurfaceVariant, marginTop: 2 },
  status: { color: palette.primary, marginTop: 4 },
});
